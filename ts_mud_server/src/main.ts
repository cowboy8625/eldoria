import { Stats, Player } from './component';
import { sleep } from './utils';
import express from 'express';
import expressWs from 'express-ws';
import { WebSocket } from 'ws';
import { System, Entity, createId, queryEntities } from './ecs/mod';

const app = express();
const { app: wsApp } = expressWs(app);
const PORT = process.env.PORT || 3000;

type Message = {
  message: string;
  ws: WebSocket;
};

let messageToSendToClients: Message[] = [];
let world: Entity[] = [];

app.use(express.static('public'));

wsApp.ws('/ws', (ws: WebSocket) => {
  console.log('connected');
  const player = initPlayerEntity(ws);
  world.push(player);

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

function webSocketMessageHandler(message: string, ws: WebSocket) {
  messageToSendToClients.push({ message, ws });
}

function initPlayerEntity(socket: WebSocket): Entity {
  return {
    id: createId(),
    components: {
      stats: { health: 100 },
      player: { socket },
    },
  };
}


const broadcaseSystem: System = (entities: Entity[]) => {
  const query = queryEntities(entities, 'player');
  for (const { components } of query) {
    const { health } = components.stats as Stats;
    const { socket } = components.player as Player;
    let sentMessage: number[] = []
    messageToSendToClients.forEach((msg, idx) => {
      const { message, ws } = msg as Message;
      if (socket !== ws) {
        sentMessage.push(idx);
        socket.send(JSON.stringify({ message, hp: health }));
      }
    });
    sentMessage.forEach((idx) => {
      messageToSendToClients.splice(idx, 1);
    })
  }
};

const playerAttackSystem: System = (entities: Entity[]) => {
};

const systems: System[] = [
  playerAttackSystem,
  broadcaseSystem,
  playerAttackSystem,
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
