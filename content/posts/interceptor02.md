+++
date = "2022-05-23"
description = ""
featuredpath = "date"
linktitle = ""
slug = "Axzez Interceptor Part 2 - 5x16TB"
title = "Axzez Interceptor Part 2 - 5x16TB"
type = ["posts","post"]
+++

# TLDR

I bought some more [refurbished Seagate Exos 18 HDD](https://www.newegg.com/seagate-exos-x18-st16000nm000j-16tb-hard-drive/p/1Z4-002P-02326)'s for my Axzez Interceptor. Here are the results:

```bash
admin@interceptor:~$ lsblk | grep disk
sda            8:0    0 14.6T  0 disk
sdb            8:16   0 14.6T  0 disk
sdc            8:32   0 14.6T  0 disk
sdd            8:48   0 14.6T  0 disk
sde            8:64   0 14.6T  0 disk
```

# But first, Ceph

I did try Ceph/Rook as I alluded to in the last post. However, it went terribly :) Rook in a k3d cluster got stuck before it could provision OSD's, and Ceph Pacific did eventually load the dashboard and mark OSDs up/in, but it completely locked up when I went to make a storage pool, replicas 3. Sadly, you cannot run a single node Ceph cluster on a single-node Pi-based ARM system (but that's totally ok).

# ZFS to the rescue

ZFS works great on this system. I made a striped pool just for fun:

```bash
admin@interceptor:~$ sudo zpool create bigdata \
        /dev/disk/by-id/ata-ST16000NM000J-2TW103_ZR*
admin@interceptor:~$ zpool status
  pool: bigdata
 state: ONLINE
config:

	NAME                                 STATE     READ WRITE CKSUM
	bigdata                              ONLINE       0     0     0
	  ata-ST16000NM000J-2TW103_ZR50N14H  ONLINE       0     0     0
	  ata-ST16000NM000J-2TW103_ZR50YWTZ  ONLINE       0     0     0
	  ata-ST16000NM000J-2TW103_ZR51317G  ONLINE       0     0     0
	  ata-ST16000NM000J-2TW103_ZR51MHBH  ONLINE       0     0     0
	  ata-ST16000NM000J-2TW103_ZR701M30  ONLINE       0     0     0

errors: No known data errors
admin@interceptor:~$ zpool list
NAME      SIZE  ALLOC   FREE  CKPOINT  EXPANDSZ   FRAG    CAP  DEDUP    HEALTH  ALTROOT
bigdata  72.7T  36.0G  72.7T        -         -     0%     0%  1.00x    ONLINE  -
admin@interceptor:~$ zfs list
NAME      USED  AVAIL     REFER  MOUNTPOINT
bigdata  36.0G  72.6T     36.0G  /bigdata
admin@interceptor:~$

```

A whopping 73TiB of storage (as seen in ZFS)! Granted, this is nothing in comparison to [Jeff Geerling's storage adventures](https://www.youtube.com/watch?v=BBnomwpF_uY).

For production I plan on running this system in RaidZ2, and possibly swapping out my 5x8TB to the Interceptor, while using these 5x16TB drives in my [Helios 64](https://wiki.kobol.io/helios64/intro/).

# FIO

FIO results in a no encryption, no compression, no dedup striped array:

Sequential Reads:

```bash
sudo fio --name=sequential-read --ioengine=posixaio --rw=read --bs=1m --size=4g --numjobs=8 --iodepth=1 --runtime=120 --time_based
Run status group 0 (all jobs):
   READ: bw=349MiB/s (366MB/s), 42.4MiB/s-45.3MiB/s (44.5MB/s-47.5MB/s), io=40.9GiB (43.9GB), run=120001-120023msec

```

...I seem to be hitting the PCIe 2.0 1x lane limits on the CM4, which is expected.

![SR01](/interceptor02/sr01.png)
![SR02](/interceptor02/sr02.png)

Random Reads (4k):

```bash
sudo fio --name=random-read --ioengine=posixaio --rw=randread --bs=4k --size=1g --numjobs=4 --iodepth=1 --runtime=120 --time_based
Run status group 0 (all jobs):
   READ: bw=2194KiB/s (2246kB/s), 535KiB/s-561KiB/s (548kB/s-575kB/s), io=257MiB (270MB), run=120001-120012msec
```

![RR01](/interceptor02/rr01.png)
![RR02](/interceptor02/rr02.png)

And since we're running ZFS, how about randomly reading 128k blocks?

```bash
sudo fio --name=random-read --ioengine=posixaio --rw=randread --bs=128k --size=1g --numjobs=4 --iodepth=1 --runtime=120 --time_based
Run status group 0 (all jobs):
   READ: bw=62.0MiB/s (66.0MB/s), 14.6MiB/s-16.3MiB/s (15.4MB/s-17.0MB/s), io=7558MiB (7925MB), run=120001-120011msec

```

![RR128k01](/interceptor02/rr128k01.png)
![RR128k02](/interceptor02/rr128k02.png)

Sequential Writes:

```bash
sudo fio --name=sequential-write --ioengine=posixaio --rw=write --bs=1m --size=4g --numjobs=8 --iodepth=1 --runtime=120 --time_based
Run status group 0 (all jobs):
  WRITE: bw=281MiB/s (295MB/s), 34.3MiB/s-35.9MiB/s (36.0MB/s-37.6MB/s), io=33.0GiB (35.4GB), run=120016-120105msec
```

![SW01](/interceptor02/sw01.png)
![SW02](/interceptor02/sw02.png)

... a little slower than reads, which I'd expect given we're writing to ZFS.

# RaidZ2

# Conclusions

Again, the Interceptor may disappoint those who want the maximum speed out of their drives, due to the Pis PCIe 2.0 1x slot. But granted, you'll probably be limited by your network bandwidth, as I don't expect anyone to be able to run workloads on the Interceptor (it's in the name, it intercepts lots of data and that's what it's meant for).

I am impressed with how the Interceptor keeps up with handling 5 hard drives with ZFS. I'll be using it as a secondary NFS/Samba/iSCSI server with a 5x8TB array installed in it. The Helios64 will take the 5x16TB array, as it has 2 lanes of bandwidth (twice as much), and I'd rather have the newer bigger drives in there.

# Next Steps

Once I'm done playing with the 5x16TB hard drives, I'll make it into a RAIDZ2 array and `zfs send` my helios data to the Interceptor. Over time I'll keep sending incremental snapshots to the Interceptor, and eventually do a drive swap. The 5x16TB drives will have the data of the 5x8TB hard drives, and I'll just need to change the mount properties so the new pool is still mounted under `/helios`. The 5x8TB can be wiped and used for other purposes, which may still include mirroring datasets from the helios.
