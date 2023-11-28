+++
date = "2022-04-26"
description = ""
featuredpath = "date"
linktitle = ""
slug = "Hands on with the Axzez Interceptor"
title = "Hands on with the Axzez Interceptor"
type = ["posts","post"]
+++

# Intro

I got my hands on the new Interceptor board from [Axzez](https://www.axzez.com/product-page/interceptor-carrier-board)!

![Interceptor Board](https://static.wixstatic.com/media/bd8842_162702393ff0423e9f8b64161dbef2b7~mv2.jpg/v1/fill/w_1593,h_1061,al_c,q_85,usm_0.66_1.00_0.01/bd8842_162702393ff0423e9f8b64161dbef2b7~mv2.jpg)

# What is it?

The Interceptor is built on top of the Raspberry Pi Compute Module 4 Platform. [Jeff Geerling](https://www.jeffgeerling.com/) did a [video](https://www.youtube.com/watch?v=NsfVI8s2gaI) on it back in Februrary, detailing most of the product's features. I won't go into those features here. I want to go over the stock Interceptor OS and the experience I've had in my first few days.

# Interceptor OS

Axzez provides an OS [image](https://www.axzez.com/software-downloads) you can install to a flash drive to get things started. When the Interceptor comes up, it first shows the familar Raspberry Pi boot screen:
![Pi boot screen](/interceptor/pi_screen.jpg)

Then a boot selector shows up:
![Pi boot selector](/interceptor/boot.jpg)

I've already installed my OS on the internal eMMC of my Compute Module 4. But you can install it to a flash drive or a SATA drive. The install process is very straightforward and fast.

After a few systemd boot messages, you arrive at a wayfire desktop:
![Wayfire desktop](/interceptor/desktop.jpg)

There's a clock on the top-right and a menu bar in the top left. Here's what the menu bar looks like:

![Menu](/interceptor/menu.jpg)

... and a few of the setting screens:
![Time](/interceptor/time.jpg)
![Language](/interceptor/language.jpg)
![Network1](/interceptor/network1.jpg)
![Network2](/interceptor/network2.jpg)
![System](/interceptor/system.jpg)

# The Network is the Computer

There are 4 Ethernet Jacks on the Interceptor. I've plugged my Ethernet cable into the 'bottom left' jack, which defaults to DHCP. In a follow-up blog I'll be detailing more about these Ethernet Jacks and how they can be configured.

Running the obligatory `neofetch` reveals Interceptor OS runs a build based off of Debian Bullseye 64 Bit. My Compute Module 4 has 2 gigs of RAM:
![Neofetch](/interceptor/neofetch.png)

Here's what `ifconfig` looks like out of the box:

```bash
admin@interceptor:~$ ifconfig
eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet6 fe80::e65f:1ff:fe66:1cbd  prefixlen 64  scopeid 0x20<link>
        ether e4:5f:01:66:1c:bd  txqueuelen 1000  (Ethernet)
        RX packets 15350  bytes 1162726 (1.1 MiB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 10388  bytes 10078532 (9.6 MiB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

lan: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 10.90.0.1  netmask 255.255.255.0  broadcast 10.90.0.255
        inet6 fe80::e65f:1ff:fe66:1cbd  prefixlen 64  scopeid 0x20<link>
        ether e4:5f:01:66:1c:bd  txqueuelen 1000  (Ethernet)
        RX packets 0  bytes 0 (0.0 B)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 25  bytes 1960 (1.9 KiB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        inet6 ::1  prefixlen 128  scopeid 0x10<host>
        loop  txqueuelen 1000  (Local Loopback)
        RX packets 0  bytes 0 (0.0 B)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 0  bytes 0 (0.0 B)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

wan: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 10.0.0.110  netmask 255.255.255.0  broadcast 10.0.0.255
        inet6 fdb3:dd5c:79f7:0:e65f:1ff:fe66:1cbd  prefixlen 64  scopeid 0x0<global>
        inet6 fd32:db85:3f4f:0:e65f:1ff:fe66:1cbd  prefixlen 64  scopeid 0x0<global>
        inet6 fe80::e65f:1ff:fe66:1cbd  prefixlen 64  scopeid 0x20<link>
        inet6 fd38:65c3:b703:0:e65f:1ff:fe66:1cbd  prefixlen 64  scopeid 0x0<global>
        inet6 fd51:de9e:9c6d:0:e65f:1ff:fe66:1cbd  prefixlen 64  scopeid 0x0<global>
        ether e4:5f:01:66:1c:bd  txqueuelen 1000  (Ethernet)
        RX packets 15349  bytes 886374 (865.5 KiB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 5897  bytes 9740025 (9.2 MiB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

admin@interceptor:~$
```

How about PCI devices? We can see the Interceptor's SATA controller:

```bash
admin@interceptor:~$ lspci
00:00.0 PCI bridge: Broadcom Inc. and subsidiaries BCM2711 PCIe Bridge (rev 20)
01:00.0 SATA controller: JMicron Technology Corp. JMB58x AHCI SATA controller
admin@interceptor:~$
```

`lsblk` with 5 miscellaneous drives and the onboard eMMC:

```bash
admin@interceptor:~$ lsblk
NAME         MAJ:MIN RM   SIZE RO TYPE MOUNTPOINT
sda            8:0    0 298.1G  0 disk
├─sda1         8:1    0   100M  0 part
└─sda2         8:2    0   298G  0 part
sdb            8:16   0  93.2G  0 disk
├─sdb1         8:17   0     7G  0 part
└─sdb2         8:18   0  86.2G  0 part
sdc            8:32   0 931.5G  0 disk
├─sdc1         8:33   0 931.5G  0 part
└─sdc9         8:41   0     8M  0 part
sdd            8:48   0  14.6T  0 disk
├─sdd1         8:49   0  14.6T  0 part
└─sdd9         8:57   0     8M  0 part
sde            8:64   0  14.6T  0 disk
├─sde1         8:65   0  14.6T  0 part
└─sde9         8:73   0     8M  0 part
mmcblk0      179:0    0   7.3G  0 disk
├─mmcblk0p1  179:1    0   100M  0 part
├─mmcblk0p2  179:2    0   348M  0 part /squashfs
└─mmcblk0p3  179:3    0   6.8G  0 part /
mmcblk0boot0 179:32   0     4M  1 disk
mmcblk0boot1 179:64   0     4M  1 disk
```

`lsusb`:

```bash
admin@interceptor:~$ lsusb
Bus 002 Device 001: ID 1d6b:0003 Linux Foundation 3.0 root hub
Bus 001 Device 004: ID 413c:2003 Dell Computer Corp. Keyboard SK-8115
Bus 001 Device 003: ID 046d:c03d Logitech, Inc. M-BT96a Pilot Optical Mouse
Bus 001 Device 002: ID 1a40:0101 Terminus Technology Inc. Hub
Bus 001 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub
admin@interceptor:~$
```

# ZFS

This OS comes with ZFS support already but it was hard to find. Trying `zfs` commands fail:

```bash
admin@interceptor:~$ zfs
-bash: zfs: command not found
admin@interceptor:~$ zpool
-bash: zpool: command not found
admin@interceptor:~$
```

...my first assumption was `ZFS` wasn't installed. So I installed `zfs-dkms`....oh, that didn't work. It needed `linux-headers`. And then it didn't work again...and now ZFS won't compile...ugh.

Oh! It turns out `/sbin` wasn't in the path! Adding `/sbin` to my `PATH` in `.bashrc` was easy once I realized the problem.

```bash
admin@interceptor:~$ /sbin/zfs version
zfs-2.0.3-9
zfs-kmod-2.0.7-1
admin@interceptor:~$
```

I'll be running more tests with `zfs` later. I'm curious how compression will play out (uncompressed vs lz4 vs zstd).

# dd Tests

I ran a couple of benchmarks on the storage I have. The best drives I have in the Inteceptor right now are two refurbished [Water Panther / Seagate Exos 16TB drives](https://www.newegg.com/water-panther-arsenal-wps16t72sata3das-16tb/p/1Z4-00WE-000B9?Item=9SIAK15C5E7751).

Doing a straight `dd` test on one of the drives from the beginning yields great results:

```bash
admin@interceptor:~$ sudo dd if=/dev/sde of=/dev/null bs=4M status=progress iflag=direct
1866465280 bytes (1.9 GB, 1.7 GiB) copied, 7 s, 266 MB/s^C
455+0 records in
454+0 records out
1904214016 bytes (1.9 GB, 1.8 GiB) copied, 7.15672 s, 266 MB/s

admin@interceptor:~$
```

How about both at the same time?

```bash
admin@interceptor:~$ sudo dd if=/dev/sdd of=/dev/null bs=4M status=progress iflag=direct
2860515328 bytes (2.9 GB, 2.7 GiB) copied, 14 s, 204 MB/s^C
724+0 records in
723+0 records out
3032481792 bytes (3.0 GB, 2.8 GiB) copied, 14.8491 s, 204 MB/s

admin@interceptor:~$
```

```bash
admin@interceptor:~$ sudo dd if=/dev/sde of=/dev/null bs=4M status=progress iflag=direct
3409969152 bytes (3.4 GB, 3.2 GiB) copied, 16 s, 213 MB/s^C
839+0 records in
838+0 records out
3514826752 bytes (3.5 GB, 3.3 GiB) copied, 16.4079 s, 214 MB/s

admin@interceptor:~$
```

...there's a little slowdown, but not very significant. The CPU is hardly doing any work with this read test.

What happens if we read from all the drives at the same time?

```bash
avg-cpu:  %user   %nice %system %iowait  %steal   %idle
          10.77    0.00    9.49   56.92    0.00   22.82

Device            r/s     rkB/s   rrqm/s  %rrqm r_await rareq-sz     w/s     wkB/s   wrqm/s  %wrqm w_await wareq-sz     d/s     dkB/s   drqm/s  %drqm d_await dareq-sz     f/s f_await  aqu-sz  %util
mmcblk0          0.00      0.00     0.00   0.00    0.00     0.00    0.00      0.00     0.00   0.00    0.00     0.00    0.00      0.00     0.00   0.00    0.00     0.00    0.00    0.00    0.00   0.00
mmcblk0boot0     0.00      0.00     0.00   0.00    0.00     0.00    0.00      0.00     0.00   0.00    0.00     0.00    0.00      0.00     0.00   0.00    0.00     0.00    0.00    0.00    0.00   0.00
mmcblk0boot1     0.00      0.00     0.00   0.00    0.00     0.00    0.00      0.00     0.00   0.00    0.00     0.00    0.00      0.00     0.00   0.00    0.00     0.00    0.00    0.00    0.00   0.00
sda             83.00  85760.00     0.00   0.00   34.23  1033.25    0.00      0.00     0.00   0.00    0.00     0.00    0.00      0.00     0.00   0.00    0.00     0.00    0.00    0.00    2.84 100.80
sdb             64.00  65536.00     0.00   0.00   35.48  1024.00    0.00      0.00     0.00   0.00    0.00     0.00    0.00      0.00     0.00   0.00    0.00     0.00    0.00    0.00    2.27 100.00
sdc             83.00  84736.00     0.00   0.00   34.20  1020.92    0.00      0.00     0.00   0.00    0.00     0.00    0.00      0.00     0.00   0.00    0.00     0.00    0.00    0.00    2.84  99.60
sdd             84.00  86016.00     0.00   0.00   33.82  1024.00    0.00      0.00     0.00   0.00    0.00     0.00    0.00      0.00     0.00   0.00    0.00     0.00    0.00    0.00    2.84 100.00
sde             84.00  86016.00     0.00   0.00   33.65  1024.00    0.00      0.00     0.00   0.00    0.00     0.00    0.00      0.00     0.00   0.00    0.00     0.00    0.00    0.00    2.83 100.40
```

That gives us ~ 408 MB/s when doing a sequential read from these drives.

The CM4 PCIe 1x lane appears to be PCIe Gen 2.0, which has a therortical max of 4Gbps. That's 500MB/s throughput. We're getting close with my hodgepodge of drives.

# Data Transfer

In my short amount of testing, transferring data with `SSH/rsync` is a bottleneck. The encryption takes up a whole core on the CM4 and hurts performance. I was only able to pull ~25MB/s over the network with `rsync` in my testing. Doing that same test over `nfs` is faster, but not significantly. More testing is needed.

# iperf3

Speeds were close to 1Gbps:

```bash
admin@interceptor:~$ iperf3 -c justin-3900x -t 0
Connecting to host justin-3900x, port 5201
[  5] local 10.0.0.110 port 42884 connected to 10.0.0.65 port 5201
[ ID] Interval           Transfer     Bitrate         Retr  Cwnd
[  5]   0.00-1.00   sec   100 MBytes   842 Mbits/sec    0    359 KBytes
[  5]   1.00-2.00   sec  98.7 MBytes   828 Mbits/sec    0    359 KBytes
[  5]   2.00-3.00   sec   101 MBytes   849 Mbits/sec    0    359 KBytes
[  5]   3.00-4.00   sec   101 MBytes   848 Mbits/sec    0    375 KBytes
[  5]   4.00-5.00   sec   101 MBytes   846 Mbits/sec    0    375 KBytes
[  5]   5.00-6.00   sec   101 MBytes   851 Mbits/sec    0    375 KBytes
[  5]   6.00-7.00   sec  98.7 MBytes   828 Mbits/sec    0    375 KBytes
[  5]   7.00-8.00   sec   101 MBytes   850 Mbits/sec    0    375 KBytes
[  5]   8.00-9.00   sec   100 MBytes   841 Mbits/sec    0    375 KBytes
[  5]   9.00-10.00  sec   100 MBytes   843 Mbits/sec    0    375 KBytes
^C[  5]  10.00-10.38  sec  38.2 MBytes   851 Mbits/sec    0    375 KBytes
- - - - - - - - - - - - - - - - - - - - - - - - -
[ ID] Interval           Transfer     Bitrate         Retr
[  5]   0.00-10.38  sec  1.02 GBytes   843 Mbits/sec    0             sender
[  5]   0.00-10.38  sec  0.00 Bytes  0.00 bits/sec                  receiver
iperf3: interrupt - the client has terminated
admin@interceptor:~$
```

```bash
admin@interceptor:~$ iperf3 -c justin-3900x -t 0 -R
Connecting to host justin-3900x, port 5201
Reverse mode, remote host justin-3900x is sending
[  5] local 10.0.0.110 port 42888 connected to 10.0.0.65 port 5201
[ ID] Interval           Transfer     Bitrate
[  5]   0.00-1.00   sec   111 MBytes   932 Mbits/sec
[  5]   1.00-2.00   sec   112 MBytes   939 Mbits/sec
[  5]   2.00-3.00   sec   112 MBytes   939 Mbits/sec
[  5]   3.00-4.00   sec   112 MBytes   939 Mbits/sec
[  5]   4.00-5.00   sec   111 MBytes   929 Mbits/sec
[  5]   5.00-6.00   sec   112 MBytes   939 Mbits/sec
[  5]   6.00-7.00   sec   112 MBytes   939 Mbits/sec
[  5]   7.00-8.00   sec   112 MBytes   939 Mbits/sec
[  5]   8.00-9.00   sec   112 MBytes   939 Mbits/sec
[  5]   9.00-10.00  sec   112 MBytes   939 Mbits/sec
^C[  5]  10.00-10.23  sec  26.1 MBytes   938 Mbits/sec
- - - - - - - - - - - - - - - - - - - - - - - - -
[ ID] Interval           Transfer     Bitrate
[  5]   0.00-10.23  sec  0.00 Bytes  0.00 bits/sec                  sender
[  5]   0.00-10.23  sec  1.12 GBytes   937 Mbits/sec                  receiver
iperf3: interrupt - the client has terminated
admin@interceptor:~$
```

Even when saturating the network (one way) I was able to pull ~400MB/s from my drives.

# Power usage

With my 5 drive setup and an old 450 Watt power supply, it's using ~54 Watts in total according to a kill-o-watt.

# Conclusion

At $119 (formerly $99), the [Interceptor Carrier Board](https://www.axzez.com/product-page/interceptor-carrier-board) is a wonderful little board. This is the board to get if you want an ARM workstation with massive data storage and network possibilities.

The processing power of the Compute Module 4 will disappoint many, but with proper configuration and tuning on a LAN network, that bottleneck can be reduced. If you need to do processing of data on the collection device, you'll want to look elsewhere.

If you're a hobbist like me, this board won't disappoint. I'm excited to try projects like [GlusterFS](https://www.gluster.org/) and [Ceph](https://docs.ceph.com/en/quincy/) on it, just to push its limits. Stay tuned for those blog posts.

Feel free to leave your comments or test cases you want me to try in the [Github Discussion](https://github.com/jrcichra/jrcichra.dev/discussions/1).
