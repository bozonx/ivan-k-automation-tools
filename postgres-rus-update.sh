#!/bin/bash

cd postgres-rus

docker build --pull -t bozonx/postgres-rus .
docker push bozonx/postgres-rus
