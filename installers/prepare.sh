#!/usr/bin/env bash

# Prepare

echo 'Preparing environment'

sudo apt-get update
sudo apt-get install -y build-essential redis-tools python-minimal libelf1 dos2unix
