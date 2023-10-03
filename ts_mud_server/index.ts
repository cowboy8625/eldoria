/*
  *  {
  *    message?: String;
  *    hp?: Number;
  *
  *
  *
  *
  *    mp?: Number;
  *    inventory?: Array;
  *    location?: String;
  *    direction?: String;
  *    name?: String;
  *  }
*/
import express from 'express';
import expressWs from 'express-ws';
import WebSocket from 'ws';


// TODO: Create a player HP data
// TODO: Display HP of player
// TODO: Spawn a monster
// TODO: Allow players to attack monster (AKA ATTACK command)

const app = express();
const { app: wsApp } = expressWs(app);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

type User = {
  ws: WebSocket;
  hp: number;
};

type Mob = {
  hp: number;
  user_idx?: number;
}

type Data = {
  message?: string;
  hp?: number;

};

const COMMAND = {
  ATTACK: 0,
} as const;

type Command = typeof COMMAND[keyof typeof COMMAND];

let users: User[] = [];
let commandQueue: Command[] = [];
let monster: Mob = {hp: 100};

wsApp.ws('/ws', (ws: WebSocket) => {
  console.log('connected');

  ws.on('message', (message: string) => {
    console.log(`received message: ${message}`);
    if (message === '/attack') {
      const user = users.find((u) => u.ws === ws);
      if (!user) {
        return;
      }
      const attackPower = Math.floor(Math.random() * 100);
      monster.hp -= attackPower;
      console.log('attack', attackPower);
      sendData({message: `you attacked a monster a moster for ${attackPower}`, hp: user?.hp}, ws);
      if (monster.hp <= 0) {
        sendData({message: 'you kill the monster!', hp: user?.hp}, ws);
        monster.hp = 100;

      }
    } else {
      broadcast(message, ws);
    }
  });

  ws.on('close', () => {
    console.log('disconnected');
  });

  users.push({ws, hp: 100});
});

app.listen(PORT, () => {
  console.log(`message: server started on port ${PORT}`);
});

const broadcast = (message: string, ws: WebSocket) => {
  users.forEach((u) => {
    if (u.ws!== ws) {
      sendData({message}, u.ws);
    }
  })
};

const sendData = (data: Data, ws: WebSocket) => {
  ws.send(JSON.stringify(data));
};


async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
};


function randomInt(min: number, max: number): number {
  const randomDecimal = Math.random();
  const randomInRange = min + (randomDecimal * (max - min));
  return Math.floor(randomInRange);
}

function saturatingSub(a: number, b: number): number {
  return Math.max(0, Math.min(a, b));
}


// Game Loop
async function main() {
  while (true) {
    await sleep(1000);
    if (!monster?.user_idx && Math.random() < 0.5 && users.length > 0) {
      monster = {
        user_idx: randomInt(0, users.length),
        hp: 100,
      };

    }
    if (monster.user_idx === undefined) {
      continue;
    }
    const attackPower = Math.floor(Math.random() * 10);
    const user: User = users[monster?.user_idx];
    user.hp -= attackPower;
    sendData({message: `you was attacked by a monster for ${attackPower}`, hp: user?.hp}, user.ws);
  }
}

main();

