#!/bin/bash

cd postgres-rus

docker pull postgres:18-alpine
docker build -t bozonx/postgres-rus .
docker push bozonx/postgres-rus
