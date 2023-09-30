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
  switch (clientState.state) {
    case STATE.GetName: {
      getUserName(client, data, clientState);
      break;
    }
    case STATE.CheckPassWord: {
      throw new Error("checkPassword funtion not create yet")
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
    clientState.state = STATE.CheckToCreateUser;
    return;
  }

  const [player, ..._] = offline.splice(index);
  online.push(client);
  clientState.player = Option.some(player);
  clientState.state = STATE.CheckPassWord;
}

function checkToCreateUser(client: Socket, data: Buffer, clientState: ClientState): void {
  const answer = data.toString().trim();

  if (!['yes', 'y'].includes(answer.toLowerCase())) {
    client.write('Enter your name: ');
    clientState.state = STATE.GetName;
    return;
  }

  let player = new Player();
  clientState.player = Option.some(player);
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
  online.splice(idx);
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


// type PlayerState = {
//   client: Socket;
//   player: Player;
// };

// class MudServer {
//   private offline: Array<Player>;
//   private online: Array<PlayerState>;
//   private PORT: number;
//   constructor() {
//     this.PORT = 8080;
//     this.offline = [];
//     this.online = [];
//   }

//   listen() {
//     console.log(`Server is listening on port ${this.PORT}`);
//   }

//   connection(client: Socket) {
//     let state = {state: STATE.GetName};
//     client.setEncoding('utf8');
//     client.write('Welcome to the chat server!\r\n');
//     client.write('Enter your name: ');

//     client.on('data', data => this.handleData(client, data, state));
//     client.on('end', () => this.handleEnd(client));
//   }

//   handleData(client: Socket, data: Buffer, state: State) {
//     if (data.toString().charCodeAt(0) === 65533) {
//       client.end();
//       return;
//     }
//     switch (state.state) {
//       case STATE.GetName: {
//         const name = data.toString().trim();
//         const idx = this.offline.findIndex(p => p.name === name);
//         if (idx < 0) {
//           client.write('looks like your not in the system do you want to create a character?');
//           state.state = STATE.CheckToCreateUser;
//           return;
//         }
//         break;
//       }
//       case STATE.GetName:{
//         break;
//       }
//       case STATE.CheckPassWord:{
//         break;
//       }
//       case STATE.CheckToCreateUser:{
//         const answer = data.toString().trim();
//         if (!['yes', 'y'].includes(answer.toLowerCase())) {
//           client.write('Enter your name: ');
//           state.state = STATE.GetName;
//           return; 
//         }
//         let player = new Player();
//         this.online.push({client, player})
//         client.write('Set a password: ');
//         state.state = STATE.SetPassWord;
//         break;
//       }
//       case STATE.SetPassWord:{
//         break;
//       }
//       case STATE.Connected:{
//         break;
//       }
//     }
//   }

//   handleEnd(client: Socket) {
//     const idx = this.online.findIndex(ps => ps.client === client);
//     const [ {player} ] = this.online.splice(idx, 1);
//     this.offline.push(player);
//     if (player.name) {
//       this.broadcast(`User '${player.name}' has left the chat.`, client, player);
//     }
//   }

//   broadcast(message: string, sender: Socket, player: Player) {
//     if (!player.hasName() || !player.hasPassword()) {
//       return;
//     }
//     this.online.forEach(({client}) => {
//       if (client !== sender) {
//         client.write(message + '\n');
//       }
//     });
//   }

//   run() {
//     const server = net.createServer((client: Socket) => this.connection(client));
//     server.listen(this.PORT, () => this.listen());
//   }

//   mapOnline(fn: (player: PlayerState) => void) {
//     this.online.forEach(fn);
//   }
// }

// new MudServer()
//   // .handleCommand(foo)
//   .run();


// function foo(data: Buffer) -> Command {
  
// }


// const clients: Map<string, Player> = new Map();
//
// const server = net.createServer((client: Socket) => {
//   client.setEncoding('utf8');
//   client.write('Welcome to the chat server!\n');
//
//   let player = new Player(client);
//
//   if (player.hasPassword()) {
//     client.write(`Hello ${player.name}, please enter your password: `);
//   } else {
//     client.write('Please enter your username: ');
//   }
//
//   let loggedIn = false;
//
//   client.on('data', (data) => {
//     if (data.toString().charCodeAt(0) === 65533) {
//       client.end();
//       return;
//     }
//
//     if (!player.hasName()) {
//       player.name = data.toString().trim();
//       broadcast(`User '${player.name}' has joined the chat.`, client, player);
//       client.write('Please set your password: ');
//     } else if (!player.hasPassword()) {
//       player.password = Option.some(data.toString().trim());;
//       loggedIn = true;
//     } else if (player.hasName() && player.hasPassword() && !loggedIn) {
//       player.login(data.toString().trim());
//       loggedIn = true;
//     } else if (loggedIn) {
//       const message = `[${player.name}]: ${data.toString().trim()}`;
//       broadcast(message, client, player);
//     }
//   });
//
//   client.on('end', () => {
//     console.log(player, clientId);
//     removeClient(client);
//     knownClients.delete(clientId);
//     knownClients.set(player.name, player);
//     console.log(knownClients.get(clientId));
//     // Notify all clients that the user has left
//     if (player.name) {
//       broadcast(`User '${player.name}' has left the chat.`, client, player);
//     }
//   });
//
//   clients.push(client);
// });
//
// function broadcast(message: string, sender: Socket, player: Player) {
//   if (!player.hasName() || !player.hasPassword()) {
//     return;
//   }
//   clients.forEach((client) => {
//     if (client !== sender) {
//       client.write(message + '\n');
//     }
//   });
// }
//
// function removeClient(client: Socket) {
//   const index = clients.indexOf(client);
//   if (index !== -1) {
//     clients.splice(index, 1);
//   }
// }
//
// const PORT = 8080;
// server.listen(PORT, () => {
//   console.log(`Server is listening on port ${PORT}`);
// });
//
