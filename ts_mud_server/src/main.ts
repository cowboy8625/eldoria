import { Option } from './option';
import { Player } from './player';

import net from 'node:net';
import type { Socket } from 'node:net';

process.on('SIGINT', () => process.exit(0));

const STATE = {
  GetName: 0,
  CheckPassWord: 1,
  CheckToCreateUser: 2,
  SetPassWord: 3,
  Connected: 4,
} as const;

type State = number;

type ClientState = {
  player: Option<Player>;
  state: State;
}

let offline: Player[] = [];
let online: Socket[] = [];


function createClient(client: Socket, clientState: ClientState) {
    client.setEncoding('utf8');
    client.write('Welcome to the chat server!\r\n');
    client.write('Enter your name: ');
    client.on('data', data => handleData(client, data, clientState));
    client.on('end', () => handleEnd(client, clientState));
}


function handleData(client: Socket, data: Buffer, clientState: ClientState) {
  if (data.toString().charCodeAt(0) === 65533) {
    client.end();
    return;
  }
  switch (clientState.state) {
    case STATE.GetName: {
      getUserName(client, data, clientState);
      break;
    }
    case STATE.CheckPassWord: {
      checkPassword(client, data, clientState);
      break;
    }
    case STATE.CheckToCreateUser: {
      checkToCreateUser(client, data, clientState);
      break;
    }
    case STATE.SetPassWord: {
      setPassword(client, data, clientState);
      break;
    }
    case STATE.Connected: {
      connected(client, data, clientState);
      break;
    }
  }
}


function getUserName(client: Socket, data: Buffer, clientState: ClientState): void {
  const name = data.toString().trim();
  const index = offline.findIndex(p => p.name === name);
  const failed = index < 0;

  if (failed) {
    client.write('Looks like your not in the system.\r\n')
    client.write('Do you want to create a character?: ');
    let player = new Player();
    player.name = name;
    clientState.player = Option.some(player);
    clientState.state = STATE.CheckToCreateUser;
    return;
  }

  const [player, ..._] = offline.splice(index);
  online.push(client);
  clientState.player = Option.some(player);
  client.write('password: ');
  clientState.state = STATE.CheckPassWord;
}


function checkPassword(client: Socket, data: Buffer, clientState: ClientState): void {
  if (clientState.player.isNone()) {
    console.log('ERROR: clientState is missing player. Some logic is broken in handleData');
    return;
  }

  const player = clientState.player.unwrap();
  const password = data.toString().trim();
  if (!player.password.map(p => p === password).unwrapOr(false)) {
    client.write('Wrong password!\r\n');
    clientState.state = STATE.CheckPassWord;
    return;
  }
  client.write('password is correct!\r\n');
  clientState.state = STATE.Connected;
  online.push(client);
}


function checkToCreateUser(client: Socket, data: Buffer, clientState: ClientState): void {
  const answer = data.toString().trim();

  if (!['yes', 'y'].includes(answer.toLowerCase())) {
    client.write('Enter your name: ');
    clientState.state = STATE.GetName;
    return;
  }

  online.push(client)
  client.write('Set a password: ');
  clientState.state = STATE.SetPassWord;
}


function setPassword(client: Socket, data: Buffer, clientState: ClientState): void {
  const password = data.toString().trim();
  const player = clientState.player.map(p => {
    p.password = Option.some(password)
    return p
  });
  client.write('your password was set.\r\n');
  clientState.player = player
  clientState.state = STATE.Connected
}


function connected(client: Socket, data: Buffer, clientState: ClientState): void {
  if (clientState.player.isNone()) {
    console.log('ERROR: clientState is missing player. Some logic is broken in handleData');
    return;
  }
  let player = clientState.player.unwrap();
  const message = `[${player.name}]: ${data.toString().trim()}`;
  broadcast(message, client);
}


function handleEnd(client: Socket, clientState: ClientState): void {
  if (clientState.player.isNone()) {
    console.log('ERROR: client failed to disconnect player was None on clientState');
    return;
  }
  const player = clientState.player.unwrap();
  offline.push(player);
  if (player.name) {
    broadcast(`User '${player.name}' has left the server.`, client);
  }

  const idx = online.indexOf(client);
  online.splice(idx, 1);
}


function broadcast(message: string, sender: Socket) {
  online.forEach((client) => {
    if (client !== sender) {
      client.write(message + '\r\n');
    }
  });
}


const server = net.createServer(c => createClient(c, {
  player: Option.none(),
  state: STATE.GetName
}));


const PORT = 8080;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

