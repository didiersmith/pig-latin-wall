const express = require('express');
const cors = require('cors')
const ethers = require('ethers');
const redis = require("redis");
const { promisify } = require("util");

// Initialize express.js
const app = express();
const listenPort = 11235;
const maxResults = 20;
app.use(cors());
app.options('*', cors());

// Initialize redis
const redisClient = redis.createClient();
redisClient.on("error", function(error) {
  console.error(error);
});
const lrangeAsync = promisify(redisClient.lrange).bind(redisClient);


// Smart contract
const Wall = require("./artifacts/contracts/Wall.sol/Wall.json")
const wallAddress = process.env.WALL_CONTRACT_ADDRESS;
console.log("Smart contract address", wallAddress);
const provider = new ethers.providers.JsonRpcProvider();
const contract = new ethers.Contract(wallAddress, Wall.abi, provider);

contract.on("MsgUpdated", async (message) => {
  // Update the message in redis when the MsgUpdated event fires.
  console.log("MsgUpdated", message);
  pigMsg = message.split(" ")
    .map(x => {
      // Terrible pig latin implementation that doesn't handle punctuation or
      // unicode or probably a zillion other special cases.
      if (x.length == 0) {
        return x
      } else if ("aeiou".search(x.charAt(0)) !== -1) {
        return x+"ay";
      } else {
        return x.slice(1)+x.charAt(0)+"ay"
      }
    }).join(" ");
  lrangeAsync("wall", 0, 0).then(result => {
    if (result.length > 0 && result[0] == pigMsg) {
      // De-dupe messages. This is to work around the fact that ethers emits
      // the last event on a contract when we start up. This means that if the
      // server restarts, we get duplicate events in the database. A better way to
      // solve this would be to associate a unique ID with each message.
      console.log("Refusing to insert duplicate wall message, think of something more creative.");
      return;
    }
    redisClient.lpush("wall", pigMsg);
  });
});

// Express.js API
app.get('/api/v1/wall', async (request, response) => {
  lrangeAsync("wall", 0, maxResults).then(result => {
    response.send(result);
  });
});

// Serve react app
app.use(express.static("../gui/build"));

app.listen(listenPort, () => {
  console.log(`API server listening at - http://localhost:${listenPort}`)
})
