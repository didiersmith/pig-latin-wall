# Pig Latin Wall

This is a simple wall upon which you can write stuff. Except the stuff you
write turns to pig latin.

## Running

```shell
./run.sh
```

This outputs a bunch of useful information, including the private key to add to
your metamask wallet (make sure you use the local chain!) and how to start a
live-reloading react dev server.

## Developing

Look at the docker containers:

```shell
docker ps
```

Read the logs of the containers:

```shell
docker logs -f hello-world-hardhat-local
```

Get a redis shell

```shell
docker exec -it hello-world-redis redis-cli
```

Restart the API server and watch the logs:

```shell
docker restart hello-world-api-server && docker logs -f hello-world-api-server
```

