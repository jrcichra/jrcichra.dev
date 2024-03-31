+++
date = "2024-03-30"
description = ""
featuredpath = "date"
linktitle = ""
slug = "Creating a highly available 3 node Nomad cluster"
title = "Creating a highly available 3 node Nomad cluster"
type = ["posts","post"]
+++

# Overview

As someone who's worked with Kubernetes for several years, I wanted to experiment with a different orchestration platform. I had a few Raspberry Pi's lying around at home. And while I could set up yet another Kubernetes cluster and call it a day, that wasn't as fulfilling as learning something new.

[https://www.nomadproject.io/](Nomad) is marketed as an alternative to Kubernetes. And to my knowledge, it's the only other viable competitor on the market (excluding anything built on top of Kubernetes).

It supports containerized and non-containerized workloads, such as downloading and execing binaries or running programs on the JVM.

For those coming from a Kubernetes background, I recommend reading this guide by Hashicorp: https://www.hashicorp.com/blog/a-kubernetes-user-s-guide-to-hashicorp-nomad. Here are a few simple mappings:

1. A Nomad Job is like a Kubernetes Deployment
2. A Nomad TaskGroup is like a Kubernetes Pod
3. A Nomad Task is like a Kubernetes Container
4. A Nomad Allocation is like a running Kubernetes Pod

You can click on a running allocation and inspect each task in the task groups (e.g look at logs or exec in).

Nomad's control-plane nodes are called Servers and its workers are called Clients.

# First steps

I started out simple, running a single-node nomad cluster by using the `dev` subcommand. This let me explore the nomad GUI and get a feel for the product. This configures a single node as both a Server and a Client. You can deploy workloads to this single node using HCL syntax.

I didn't want to stick with the `dev` mode too long so I started looking for a more proper way to deploy nomad. Nomad takes a config file in HCL format, so I wrote up a simple config and started building an Ansible playbook:

```hcl
data_dir  = "/opt/nomad/data"
bind_addr = "0.0.0.0"

server {
  enabled          = true
  bootstrap_expect = 1
}

client {
  enabled = true
  servers = ["127.0.0.1"]
}
```

Then I made a systemd service for it:

```
[Unit]
Description=Nomad
Documentation=https://www.nomadproject.io/docs/index.html
Wants=network-online.target
After=network-online.target

[Service]
ExecStart=/usr/bin/nomad agent -config=/etc/nomad.d/nomad.hcl
Restart=always
KillMode=process
RestartSec=5
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
```

And finally, enabled the service and started nomad:

```
sudo systemctl enable --now nomad.service
```

Great, we have a single instance of nomad running.

I then installed Docker because we'll want to deploy containers as our main source of software.

From there we can tinker and deploy a simple http Job and poke around in the GUI:

```hcl
job "whoami" {
  datacenters = ["dc1"]
  group "whoami" {
    count = 3
    network {
      port "http" {
        to = 8080
      }
    }
    task "whoami" {
      driver = "docker"
      config {
        image = "ghcr.io/jrcichra/whoami"
        ports = ["http"]
      }
    }
  }
}
```

![Nomad Job Page](/nomad/figure01.png)
