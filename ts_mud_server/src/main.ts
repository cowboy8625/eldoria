import { Stats, Player, Location } from "./component";
import { sleep } from "./utils/mod";
import express from "express";
import expressWs from "express-ws";
import { WebSocket } from "ws";
import { System, Entity, createId, queryEntities } from "./ecs/mod";
import { World } from "./world/mod";

const app = express();
const { app: wsApp } = expressWs(app);
const PORT = process.env.ELDORIA_PORT || 3000;

type Message = {
  message: string;
  sendBy: WebSocket;
};

type Command = {
  message: string;
  sendBy: WebSocket;
};

let messageToSendToClients: Message[] = [];
let queueCommand: Command[] = [];
let world: Entity[] = [];

app.use(express.static("public"));

wsApp.ws("/ws", (ws: WebSocket) => {
  console.log("connected: ", ws.url);
  const player = initPlayerEntity(ws);
  world.push(player);

  const message = "Welcome to Eldoria!";
  const { health } = player.components.stats as Stats;
  const { region, room } = player.components.location as Location;

  ws.send(
    JSON.stringify({
      message,
      hp: health,
      region,
      room,
    }),
  );

  ws.on("message", (mgs: string) => webSocketMessageHandler(mgs, ws));
  ws.on("close", () => {
    console.log("disconnected");
  });
});

app.listen(PORT, () => {
  console.log(`message: server started on port ${PORT}`);
});

function webSocketMessageHandler(message: string, sendBy: WebSocket) {
  if (message.toLowerCase().startsWith("/")) {
    console.log("look around");
    queueCommand.push({
      message,
      sendBy,
    });
  } else {
    messageToSendToClients.push({ message, sendBy});
  }
}

function initPlayerEntity(socket: WebSocket): Entity {
  return {
    id: createId(),
    components: {
      stats: { health: 100 },
      player: { socket },
      location: { region: "The Verdant Glades", room: "Eldertree Grove" },
    },
  };
}

const broadcastOtherUsers = (
  msg: Message,
  health: number,
  region: string,
  room: string,
  socket: WebSocket,
) => {
  if (socket === msg.sendBy) {
    return;
  }
  socket.send(
    JSON.stringify({
      message: msg.message,
      hp: health,
      region,
      room,
    }),
  );
};

const broadcastBackToSender = (
  msg: Message,
  health: number,
  region: string,
  room: string,
  socket: WebSocket,
) => {
  if (socket !== msg.sendBy) {
    return;
  }
  const formatedMessage = `you send -> ${msg.message}`;
  socket.send(
    JSON.stringify({
      message: formatedMessage,
      hp: health,
      region,
      room,
    }),
  );
};

const broadcaseSystem: System = (entities: Entity[]) => {
  if (!messageToSendToClients) return;
  const query = queryEntities(entities, "player", "location", "stats");
  for (const { components } of query) {
    const { health } = components.stats as Stats;
    const { socket } = components.player as Player;
    const { region, room } = components.location as Location;
    messageToSendToClients.forEach((msg: Message) => {
      broadcastBackToSender(msg, health, region, room, socket);
      broadcastOtherUsers(msg, health, region, room, socket);
    });
  }
  messageToSendToClients = [];
};

const plyaerCommandSystem: System = (entities: Entity[]) => {
  if (!queueCommand) return;
  const query = queryEntities(entities, "player", "location", "stats");
  for (const { components } of query) {
    const { health } = components.stats as Stats;
    const { socket } = components.player as Player;
    const { region, room } = components.location as Location;
    queueCommand.forEach((msg: Command) => {
      socket.send(JSON.stringify({
        message: 'Looking arround you see.......',
      }));
      socket.send(JSON.stringify({
        message: World[region][room].description,
      }));
      socket.send(JSON.stringify({
        message: World[region][room].movements,
      }));
    })
  }
  queueCommand = [];
};

const playerMovementSystem: System = (entities: Entity[]) => {
};

const systems: System[] = [
  playerMovementSystem,
  broadcaseSystem,
  plyaerCommandSystem,
];

// Game Loop
async function main() {
  while (true) {
    await sleep(1000);
    systems.forEach((system: System) => {
      system(world);
    });
  }
}

main();
