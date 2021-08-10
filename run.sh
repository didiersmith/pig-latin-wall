#!/bin/bash

ROOT_DIR="$(echo "$(cd -P "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)")"
NODE_VERSION="current-alpine3.11"

clean_up() {
    docker ps -a \
        | grep hello-world \
        | awk '{print $1}' \
        | xargs docker rm -f 2>/dev/null
}
clean_up

# Start redis
docker run \
    --network=host \
    --name hello-world-redis \
    -d \
    redis


cd $ROOT_DIR/contract
npm i
# Start hardhat local ethereum node.
# adduser hackery is to work around a permission error with running hardhat as root.
docker run \
    --name=hello-world-hardhat-local \
    --network=host \
    --user root \
    -v $ROOT_DIR:/mnt/hello \
    -d \
    node:$NODE_VERSION \
    sh -c "adduser -D hardhat && \
        cd /mnt/hello/contract && \
        su hardhat -c '/usr/local/bin/npx hardhat node'"

for i in {1..600}; do
    docker logs hello-world-hardhat-local | grep Started && break
    echo "Waiting for hardhat to initialize"
    sleep 1
done

private_key=$(docker logs hello-world-hardhat-local \
    | grep "Private Key" \
    | head -1 \
    | cut -d : -f 2 \
    | tr -d ' ')

# Build and deploy smart contract. This is done from the host so that the
# compiled artifacts have the same permissions as the user deploying.
npx hardhat compile
npx hardhat run scripts/deploy.js --network localhost
cd ..

contract_address=$(docker logs hello-world-hardhat-local \
    | grep "Contract address:" \
    | docker logs hello-world-hardhat-local \
    | grep "Contract address:"  \
    | cut -d : -f 2 \
    | tr -d ' ')

echo $contract_address


# Update ABI in GUI
cp -rf contract/artifacts gui/src/artifacts
cp -rf contract/artifacts api/artifacts

cd $ROOT_DIR/gui
npm i
export REACT_APP_CONTRACT_ADDRESS=$contract_address
npm run build
cd ..

cd $ROOT_DIR/api
npm i

echo "Starting server"
docker run \
    --name=hello-world-api-server \
    --network=host \
    --user root \
    -v $ROOT_DIR:/mnt/hello \
    -e WALL_CONTRACT_ADDRESS=$contract_address \
    -d \
    node:$NODE_VERSION \
    sh -c "adduser -D serve;
        cd /mnt/hello/api && \
        su serve -c '/usr/local/bin/node ./app.js'"

for i in {1..600}; do
    docker logs hello-world-api-server 2>/dev/null | grep "API server listening" && break
    echo "Waiting for API server to start"
    sleep 1
done

web_addr=$(docker logs hello-world-api-server \
    | grep "API server listening" \
    | cut -d '-' -f 2 \
    | tr -d ' ')

cat << EOF

================================================================================

App started!

Import private key $private_key to your metamask wallet.

Reset your metamask testing account if you've imported this private key before!

Open $web_addr in your browser to view the application.

Running containers:
$(docker ps  --filter name="hello-world*")

Run "docker logs <container_name> to see logs.

To start react dev server:

cd gui
REACT_APP_CONTRACT_ADDRESS=$contract_address npm run start 

================================================================================
EOF
