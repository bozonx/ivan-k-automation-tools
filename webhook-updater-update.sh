#!/bin/bash

cd webhook-updater

docker pull node:20-alpine
docker build -t bozonx/webhook-updater .
# docker push bozonx/webhook-updater
