import { Stats, Player, Location } from './component';
import { sleep } from './utils/mod';
import express from 'express';
import expressWs from 'express-ws';
import { WebSocket } from 'ws';
import { System, Entity, createId, queryEntities } from './ecs/mod';

const app = express();
const { app: wsApp } = expressWs(app);
const PORT = process.env.PORT || 3000;

type Message = {
  message: string;
  sendBy: WebSocket;
  receivedBy: WebSocket[];
};

let messageToSendToClients: Message[] = [];
let world: Entity[] = [];

app.use(express.static('public'));

wsApp.ws('/ws', (ws: WebSocket) => {
  console.log('connected');
  const player = initPlayerEntity(ws);
  world.push(player);

  const message = 'Welcome to Eldoria!';
  const { health } = player.components.stats as Stats;
  const { region, room } = player.components.location as Location;

  ws.send(JSON.stringify({
    message,
    hp: health,
    region,
    room,
  }));

  // On receiving a message User Command will be created and added to queue.
  ws.on('message', (mgs: string) => webSocketMessageHandler(mgs, ws));

  // On closing of a connection need to remove Socket from users array
  ws.on('close', () => {
    console.log('disconnected');
  });
});

app.listen(PORT, () => {
  console.log(`message: server started on port ${PORT}`);
});

function webSocketMessageHandler(message: string, sendBy: WebSocket) {
  messageToSendToClients.push({ message, sendBy, receivedBy: [] });
}

function initPlayerEntity(socket: WebSocket): Entity {
  return {
    id: createId(),
    components: {
      stats: { health: 100 },
      player: { socket },
      location: { region: 'earth', room: 'usa' },
    },
  };
}

const broadcaseSystem: System = (entities: Entity[]) => {
  if (!messageToSendToClients) return;
  const query = queryEntities(entities, 'player', 'location');
  for (const { components } of query) {
    const { health } = components.stats as Stats;
    const { socket } = components.player as Player;
    const { region, room } = components.location as Location;
    messageToSendToClients.forEach((msg: Message) => {
      if (socket !== msg.sendBy && !msg.receivedBy.includes(socket)) {
        msg.receivedBy.push(socket);
        socket.send(JSON.stringify({
          message: msg.message,
          hp: health,
          region,
          room,
        }));
      }
      if (socket === msg.sendBy && !msg.receivedBy.includes(socket)) {
        msg.receivedBy.push(socket);
        const formatedMessage = `you send -> ${msg.message}`;
        socket.send(JSON.stringify({
          message: formatedMessage,
          hp: health,
          region,
          room,
        }));
      }
    });
  }
};

const playerMovementSystem: System = (entities: Entity[]) => {
};

const systems: System[] = [
  playerMovementSystem,
  broadcaseSystem,
];


// Game Loop
async function main() {
  while (true) {
    await sleep(1000);
    systems.forEach((system: System) => {
      system(world);
    })
  }
}

main()
