+++
date = "2020-09-29"
description = ""
featuredpath = "date"
linktitle = ""
slug = "Transparent Wireguard Networks in KVM"
title = "Transparent Wireguard Networks in KVM"
type = ["posts","post"]
+++

## Overview

The cloud is an exciting place. It unlocks new scalability features and managed services. But cloud is expensive, and running some workloads "on-prem" makes more financial sense.

I've been designing my personal infrastructure with a "cloud-first" mentality. Most of my cloud workloads are computationally lightweight, consisting of web servers, small databases, and light daemons. I run it all in Kubernetes, between two cloud vendors, tied with Wireguard.

The existing tie I have today between Oracle Cloud and OVH got me thinking..."why can't my local machine be another 'cloud provider'?"

I run Linux as my main operating system, using KVM/QEMU as my virtualization platform (the same as most cloud vendors). This should totally be possible, right? But how can I keep it secure...how can I completely remove my LAN from an attack surface?

The answer is simple...Wireguard!

Wireguard's power comes from it's simplicity. My knowledge of OpenVPN and IPSec is next to none beyond the theoretical idea of VPNs. Wireguard made VPNs approachable to younger, "full stack developers / sysadmins".

## Goal

The goal is simple: Build a multi-cloud Wireguard VPN, where a virtual subnet of virtual machines are:

- Accessible to/from the Wireguard network
- The virtual machines don't know Wireguard is involved (attackers can't become root and 'turn off' wireguard and see my local subnet)
- All traffic from the virtual machine flows through a cloud provider as its internet gateway
- The host running Wireguard is inaccessible from both the cloud and the VMs

## Guide

### Cloud-side

Right now, I have a single VM connected to my cloud Wireguard VPN. Here's how to do the same:

On the Wireguard gateway / internet gateway for local VMS, use this Wireguard config:

```
[Interface]
Address = 10.0.3.1/24
ListenPort = 51821
PrivateKey = <REDACTED>
PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -t nat -A POSTROUTING -o ens3 -j MASQUERADE; ip6tables -A FORWARD -i %i -j ACCEPT; ip6tables -t nat -A POSTROUTING -o ens3 -j MASQUERADE
PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -t nat -D POSTROUTING -o ens3 -j MASQUERADE; ip6tables -D FORWARD -i %i -j ACCEPT; ip6tables -t nat -D POSTROUTING -o ens3 -j MASQUERADE

[Peer]
PublicKey = <REDACTED>
AllowedIPs = 192.168.100.0/24

```

Change `ens3` to the interface on the cloud instance that provides internet connectivity. AllowedIPs is the subnet we'll give out to VMs in KVM.

I'm using `10.0.3.1` as the cloud Wireguard network. You can modify this or the KVM subnet to work with your environment. You may even be able to serve part of the 10.0.3.0/24 subnet to KVM.

The PostUp & PostDown routing rules forward internet requests in and out of the WAN to the KVM instances.

### KVM-host

```
[Interface]
Address = 10.0.3.2/24
PrivateKey = <REDACTED>
Table = off

PostUp = ip rule add from 192.168.100.139 table 42; ip route add default dev %i table 42; iptables -A INPUT -d 10.0.3.2 -j DROP;
PostDown = ip rule del from 192.168.100.139 table 42; iptables -D INPUT -d 10.0.3.2 -j DROP

[Peer]
PublicKey = <REDACTED>
AllowedIPs = 0.0.0.0/0
Endpoint = <CLOUD-IP>:51821

```

The KVM host has a `10.0.3.2` address to communicate with `10.0.3.1`. The PostUp and PostDown rules serve two purposes. Right now, I only add an IP rule for the specific IP given to the KVM instance, but this could be extended to the entire subnet. That IP rule adds a rule to route traffic through the wireguard instance and the second drops cloud connections trying to reach into the KVM host.

`AllowedIPs` will forward all data coming through this route up to the cloud. This does not forward all data on the KVM host, only the `192.168.100.x` subnet.

### Starting the interfaces

I used `wg-quick wg1 up` on both the cloud and KVM host. You won't be able to ping between the KVM host and the cloud instance, but this is expected. We are blocking that traffic with the `iptables` `DROP`.

### libvirt routed interface

Using `virt-manager` is a pretty simple way to create the private network we'll want to be attached as the sole virtual network on the cloud instance.

![virt-manager-network](/wireguard/kvm1.png)

I chose to route traffic from this `192.168.100.0/24` subnet through `wg1`.

Next, you'll want to attach this virtual bridge as a NIC on your virtual machine:

![virt-manager-vm](/wireguard/kvm2.png)

You should be able to boot the VM with this virtual NIC and have internet connectivity through the cloud with no visibility to your local network. There's also no way for an attacker to gain root access to the VM and disable wireguard's `0.0.0.0/0` policy to gain access to your network, because Wireguard is totally outside the VM. Your host OS would need to be compromised. Having the local `iptables` `DENY` is what protects your KVM host from attacks through the Wireguard interface.

Did I miss something? Could this article be enhanced? Please open an issue on my GitHub: [https://github.com/jrcichra/jrcichra.dev](https://github.com/jrcichra/jrcichra.dev)

### Resources

- [https://saasbootstrap.com/how-to-setup-a-vpn-with-wireguard-that-only-routes-traffic-from-a-specific-docker-container-or-specific-ip/?unapproved=36&moderation-hash=343a2d9cc803676cbf5ba5cd1c82880a#comment-36](https://saasbootstrap.com/how-to-setup-a-vpn-with-wireguard-that-only-routes-traffic-from-a-specific-docker-container-or-specific-ip/?unapproved=36&moderation-hash=343a2d9cc803676cbf5ba5cd1c82880a#comment-36)
