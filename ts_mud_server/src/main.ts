import { Stats, Player, Location } from "./component";
import { sleep } from "./utils/mod";
import express from "express";
import expressWs from "express-ws";
import { WebSocket } from "ws";
import { System, Entity, createId, queryEntities } from "./ecs/mod";
import { World } from "./world/mod";
import { log } from "console";

const app = express();
const { app: wsApp } = expressWs(app);
const PORT = process.env.ELDORIA_PORT || 3000;

type Message = {
  message: string;
  sentBy: WebSocket;
};

type Command = {
  message: string;
  sentBy: WebSocket;
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

function webSocketMessageHandler(message: string, sentBy: WebSocket) {
  if (message.toLowerCase().startsWith("/")) {
    console.log("look around");
    queueCommand.push({
      message,
      sentBy,
    });
  } else {
    messageToSendToClients.push({ message, sentBy});
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
  if (socket === msg.sentBy) {
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
  if (socket !== msg.sentBy) {
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

const lookAroundSystem: System = (entities: Entity[]) => {
  if (!queueCommand) return;
  const query = queryEntities(entities, "player", "location");
  for (const { components } of query) {
    const { socket } = components.player as Player;
    const { region, room } = components.location as Location;
    const systemCommands = filterCommands(socket, "/look around");
    systemCommands.forEach((i: number) => {
      socket.send(JSON.stringify({
        message: 'Looking arround you see.......',
      }));
      socket.send(JSON.stringify({
        message: World[region][room].description,
      }));
      socket.send(JSON.stringify({
        message: Object.entries(World[region][room].movements)
          .map(([key, value]) => {
            return `${key}: ${value as string}`
        })
      }));
      queueCommand.splice(i, 1);
    })
  }
};

const playerMovementSystem: System = (entities: Entity[]) => {
  if (!queueCommand) return;
  const query = queryEntities(entities, "player", "location");
  for (const { components } of query) {
    const { socket } = components.player as Player;
    let location = components.location as Location;
    const systemCommands = filterCommands(socket, "/north");
    systemCommands.forEach((i: number) => {
      const north = World[location.region][location.room].movements.north;
      location.room = north;
      socket.send(JSON.stringify({
        message: `You move north to ${north}`,
        room: location.room,
      }));
      queueCommand.splice(i, 1);
    });
  }
};

function filterCommands(socket: WebSocket, filterBy: string): number[] {
  const systemCommands = queueCommand
    .filter((cmd: Command) => cmd.sentBy === socket && cmd.message === filterBy)
    .map((_: Command, i: number) => i);
  systemCommands.reverse();
  return systemCommands;
}

const systems: System[] = [
  playerMovementSystem,
  broadcaseSystem,
  lookAroundSystem,
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
