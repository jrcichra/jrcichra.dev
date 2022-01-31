+++
date = "2021-06-25"
description = ""
featuredpath = "date"
linktitle = ""
slug = "Switching to CockroachDB"
title = "Switching to CockroachDB"
type = ["posts","post"]
+++

## Overview

I decided to switch my website's database from MySQL to CockroachDB. So far it's been a great switch. I don't have many transactions, but being able to do rolling no-downtime upgrades, drain a node without fear, and have out-of-the-box horizontal scaling is a huge plus.

## What is CockroachDB?

[CockroachDB](https://www.cockroachlabs.com/) is a resilient distributed database built on top of the Raft consensus algorithm. It's a highly available, postgres-compatible open source project. It has support for geo-spatial data, and uses the [Go](https://golang.org/) programming language.

## Why should I switch?

MySQL is an easy database to get started with, but it comes with some bad defaults. One that always gets me is string comparisons. By default, it is case-in-sensitive. This means if you have a column called "name" and a row with the value "John" in it, `select "name" from users where "name" = "john"` will return "John". In postgres and other enterprise databases, this is not acceptable.

MySQL (as far as I know) doesn't support multi-threaded queries. Postgres and CockroachDB can distribute the load of a query between threads (or even nodes!). I also really like the explain tree that CockroachDB shows. It makes it very clear where I need an index.

CockroachDB has a nice GUI out of the box and it supports Kubernetes with a helm chart. Setup on my 4 node Oracle ARM cluster was a breeze...except not quite. I did have to build a custom container with support for ARM64. This was only possible because CockroachDB is open source. I can maintain a fork with build support for ARM64. Another big advantage to CockroachDB is it's written in Go, so it works cross-architecture, cross-platform (yes even on windows), and is speedy.

It also comes as a static binary, which is 'insane' that I can run three replicas of a static binary on one system for a 3 node cluster.

## What are the downsides of switching?

Definitely porting applications from MySQL. Porting DBs is a pain. Using MySQL left me with some bad habits. I wasn't using ANSI-compliant syntax in my applications and my queries were working in case-insensitive situations on usernames.

One downside with the product is no trigger support (yet). So I can't do a `BEFORE INSERT` or `AFTER UPDATE` on a column. This isn't crucial for my workflows, but I'm sure for a legacy production application this is a must-have. Granted, the other features CockroachDB offers outweigh missing triggers/procedures (when in the right setting). CockroachDB doesn't have every feature (yet). But I'm excited for its future.

## What do you use it for?

All my cloud homelab projects send their data in to CockroachDB. Right now that is ingestd and madeit. The first application ingests GPS data from a Raspberry Pi and the second gets GPS data from Android phones. So it's not a lot of data but it's enough to learn the platform and benefit from it.

Being postgres-wire compatible is super handy. I can spin up a postgres container and test my application against it, and I can be pretty sure the integration is going to work. So when I don't want a full cockroachdb cluster (even single node), I can just run postgres.

## What am I doing with it next?

I'm interested in the geo-replication features. I'm running in Oracle Cloud Ashburn and I have a friend who's got his Oracle Cloud instances in California. We'll get a 'real-world' test of geo-replication once we connect the two clusters together. We'll have to figure out the best way to connect two Kubernetes clusters together (for cockroachdb node communication).

## I'm convinced! Where do I get it?

You can download it from the [CockroachDB website](https://www.cockroachlabs.com/docs/install-cockroachdb.html).