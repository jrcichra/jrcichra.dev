
(function () {
  var canvas = document.getElementById('globe');
  if (!canvas) return;
  var page = canvas.closest('.page') || document.body;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var gl = null;
  try {
    gl = canvas.getContext('webgl', { alpha: true, antialias: false, depth: true, premultipliedAlpha: true })
      || canvas.getContext('experimental-webgl', { alpha: true, antialias: false, depth: true, premultipliedAlpha: true });
  } catch (e) { gl = null; }
  if (!gl) return; // no WebGL: starfield alone still renders fine

  // ---------- real earth + cloud textures ----------
  // Blue-Marble-derived day map + cloud layer, sourced from three.js's public
  // example assets (MIT-licensed repo, imagery credited to NASA Visible Earth).
  var EARTH_IMG_SRC = canvas.getAttribute('data-earth-src');
  var CLOUD_IMG_SRC = canvas.getAttribute('data-cloud-src');

  function makePlaceholderTexture() {
    var t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([235, 235, 235, 255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return t;
  }
  var earthTex = makePlaceholderTexture();
  var cloudTex = makePlaceholderTexture();

  var texturesLoaded = 0;
  function loadTexture(tex, src) {
    var img = new Image();
    img.onload = function () {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      texturesLoaded++;
      if (texturesLoaded >= 2) { requestAnimationFrame(render); }
    };
    img.src = src;
  }
  loadTexture(earthTex, EARTH_IMG_SRC);
  loadTexture(cloudTex, CLOUD_IMG_SRC);

  // ---------- sphere geometry ----------
  function buildSphere(latBands, lonBands) {
    var positions = [], normals = [], uvs = [], indices = [];
    for (var lat = 0; lat <= latBands; lat++) {
      var theta = lat * Math.PI / latBands;
      var sinT = Math.sin(theta), cosT = Math.cos(theta);
      for (var lon = 0; lon <= lonBands; lon++) {
        var phi = lon * 2 * Math.PI / lonBands - Math.PI;
        var sinP = Math.sin(phi), cosP = Math.cos(phi);
        var x = -cosP * sinT, y = cosT, z = sinP * sinT;
        positions.push(x, y, z);
        normals.push(x, y, z);
        uvs.push(lon / lonBands, lat / latBands);
      }
    }
    for (var lat2 = 0; lat2 < latBands; lat2++) {
      for (var lon2 = 0; lon2 < lonBands; lon2++) {
        var first = lat2 * (lonBands + 1) + lon2;
        var second = first + lonBands + 1;
        indices.push(first, second, first + 1);
        indices.push(second, second + 1, first + 1);
      }
    }
    return {
      positions: new Float32Array(positions),
      normals: new Float32Array(normals),
      uvs: new Float32Array(uvs),
      indices: new Uint16Array(indices)
    };
  }
  var sphere = buildSphere(34, 60);

  function makeBuffer(data, target) {
    var b = gl.createBuffer();
    gl.bindBuffer(target || gl.ARRAY_BUFFER, b);
    gl.bufferData(target || gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return b;
  }
  var posBuf = makeBuffer(sphere.positions);
  var normBuf = makeBuffer(sphere.normals);
  var uvBuf = makeBuffer(sphere.uvs);
  var idxBuf = makeBuffer(sphere.indices, gl.ELEMENT_ARRAY_BUFFER);

  // ---------- shaders ----------
  var VERT = [
    'attribute vec3 aPosition;',
    'attribute vec3 aNormal;',
    'attribute vec2 aUv;',
    'uniform mat4 uModel;',
    'uniform mat4 uView;',
    'uniform mat4 uProj;',
    'varying vec3 vNormal;',
    'varying vec2 vUv;',
    'varying vec3 vViewDir;',
    'void main() {',
    '  vec4 worldPos = uModel * vec4(aPosition, 1.0);',
    '  vNormal = normalize(mat3(uModel) * aNormal);',
    '  vUv = aUv;',
    '  vec4 viewPos = uView * worldPos;',
    '  vViewDir = normalize(-viewPos.xyz);',
    '  gl_Position = uProj * viewPos;',
    '}'
  ].join('\n');

  var FRAG_EARTH = [
    'precision mediump float;',
    'varying vec3 vNormal;',
    'varying vec2 vUv;',
    'varying vec3 vViewDir;',
    'uniform sampler2D uTex;',
    'uniform vec3 uLightDir;',
    'void main() {',
    '  vec3 n = normalize(vNormal);',
    '  float ndotl = dot(n, uLightDir);',
    '  float lambert = smoothstep(-0.35, 0.45, ndotl);',
    '  vec3 texColor = texture2D(uTex, vUv).rgb;',
    '  vec3 color = texColor * (0.18 + lambert * 0.78);',
    '  float fres = pow(1.0 - max(dot(n, normalize(vViewDir)), 0.0), 2.6);',
    '  vec3 atmo = vec3(0.35, 0.5, 0.78) * fres * (0.16 + 0.3 * lambert);',
    '  gl_FragColor = vec4(min(color + atmo, vec3(1.0)), 1.0);',
    '}'
  ].join('\n');

  var FRAG_CLOUD = [
    'precision mediump float;',
    'varying vec3 vNormal;',
    'varying vec2 vUv;',
    'uniform sampler2D uTex;',
    'uniform vec3 uLightDir;',
    'void main() {',
    '  vec3 n = normalize(vNormal);',
    '  float lambert = smoothstep(-0.35, 0.45, dot(n, uLightDir));',
    '  vec4 c = texture2D(uTex, vUv);',
    '  float shade = min(0.22 + 0.72 * lambert, 1.0);',
    '  float a = c.a * 0.85;',
    '  gl_FragColor = vec4(vec3(shade) * a, a);',
    '}'
  ].join('\n');

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }
  function link(vsrc, fsrc) {
    var p = gl.createProgram();
    gl.attachShader(p, compile(gl.VERTEX_SHADER, vsrc));
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fsrc));
    gl.linkProgram(p);
    return p;
  }
  var progEarth = link(VERT, FRAG_EARTH);
  var progCloud = link(VERT, FRAG_CLOUD);

  function bindAttribs(prog) {
    var aPos = gl.getAttribLocation(prog, 'aPosition');
    var aNorm = gl.getAttribLocation(prog, 'aNormal');
    var aUv = gl.getAttribLocation(prog, 'aUv');
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, normBuf);
    gl.enableVertexAttribArray(aNorm);
    gl.vertexAttribPointer(aNorm, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
    gl.enableVertexAttribArray(aUv);
    gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0);
  }

  // ---------- matrices ----------
  function mat4Identity() { return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]); }
  function mat4Perspective(fovy, aspect, near, far) {
    var f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    var out = new Float32Array(16);
    out[0] = f / aspect; out[5] = f; out[10] = (far + near) * nf; out[11] = -1; out[14] = 2 * far * near * nf;
    return out;
  }
  function mat4Translate(x, y, z) { var m = mat4Identity(); m[12] = x; m[13] = y; m[14] = z; return m; }
  function mat4RotateY(rad, scale) {
    var c = Math.cos(rad), s = Math.sin(rad);
    var k = scale || 1;
    var m = mat4Identity();
    m[0] = c * k; m[2] = -s * k; m[8] = s * k; m[10] = c * k; m[5] = k;
    return m;
  }
  function mat4RotateX(rad) {
    var c = Math.cos(rad), s = Math.sin(rad);
    var m = mat4Identity();
    m[5] = c; m[6] = s; m[9] = -s; m[10] = c;
    return m;
  }
  function mat4Multiply(a, b) {
    var out = new Float32Array(16);
    for (var i = 0; i < 4; i++) {
      for (var j = 0; j < 4; j++) {
        var sum = 0;
        for (var k = 0; k < 4; k++) sum += a[k * 4 + j] * b[i * 4 + k];
        out[i * 4 + j] = sum;
      }
    }
    return out;
  }

  var proj = mat4Perspective(0.8, 1, 0.1, 10);
  var view = mat4Translate(0, 0, -3.1);
  var lightDir = (function () {
    var v = [0.55, 0.35, 0.85];
    var len = Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2]);
    return [v[0]/len, v[1]/len, v[2]/len];
  })();

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  var size = 0;
  function resize() {
    var cssW = page.clientWidth || window.innerWidth;
    var cssH = page.clientHeight || window.innerHeight;
    var cx = cssW * 0.90, cy = cssH * 0.40;
    var R = Math.min(cssW, cssH) * 0.42;
    size = R * 2.4;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    canvas.style.left = (cx - size / 2) + 'px';
    canvas.style.top = (cy - size / 2) + 'px';
    var DPR = Math.min((window.devicePixelRatio || 1) * 1.5, 3);
    canvas.width = Math.max(1, Math.floor(size * DPR));
    canvas.height = Math.max(1, Math.floor(size * DPR));
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  window.addEventListener('resize', resize);
  if (window.ResizeObserver) { new ResizeObserver(resize).observe(page); }
  resize();

  var earthRot = 0, cloudRot = 0;
  var EARTH_SPEED = reduceMotion ? 0 : 0.00009;
  var CLOUD_SPEED = reduceMotion ? 0 : 0.00012;

  // ---------- drag-to-spin ----------
  var dragYaw = 0, pitch = 0;
  var dragging = false, lastX = 0, lastY = 0, resumeDelay = 0;
  var DRAG_SENS = 0.008;
  var PITCH_LIMIT = 1.3;

  canvas.addEventListener('pointerdown', function (e) {
    dragging = true;
    lastX = e.clientX; lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    dragYaw += dx * DRAG_SENS;
    pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch + dy * DRAG_SENS));
  });
  function endDrag() { dragging = false; resumeDelay = 700; }
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('pointerleave', function () { if (dragging) endDrag(); });

  function drawSphere(prog, tex, modelScale, model) {
    gl.useProgram(prog);
    bindAttribs(prog);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(gl.getUniformLocation(prog, 'uTex'), 0);
    gl.uniform3fv(gl.getUniformLocation(prog, 'uLightDir'), lightDir);
    gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'uModel'), false, model);
    gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'uView'), false, view);
    gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'uProj'), false, proj);
    gl.drawElements(gl.TRIANGLES, sphere.indices.length, gl.UNSIGNED_SHORT, 0);
  }

  function render(now) {
    if (!dragging) {
      if (resumeDelay > 0) { resumeDelay -= 16.6; }
      else { earthRot += EARTH_SPEED * 16.6; cloudRot += CLOUD_SPEED * 16.6; }
    }

    var tilt = mat4RotateX(pitch);
    var earthModel = mat4Multiply(tilt, mat4RotateY(earthRot + dragYaw));
    var cloudModel = mat4Multiply(tilt, mat4RotateY(cloudRot + dragYaw, 1.018));

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.depthMask(true);
    drawSphere(progEarth, earthTex, 1, earthModel);

    gl.depthMask(false);
    drawSphere(progCloud, cloudTex, 1.02, cloudModel);
    gl.depthMask(true);

    requestAnimationFrame(render);
  }
})();
