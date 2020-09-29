#!/bin/bash
docker run -it -d \
	--name jekyll \
	--volume="$PWD:/srv/jekyll" \
	-p 4000:4000 \
	jrcichra/jrcichra.dev \
        bundle exec jekyll serve --host 0.0.0.0
