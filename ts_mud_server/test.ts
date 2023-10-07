// import express from "express";
// import expressWs from "express-ws";
// import { WebSocket } from "ws";
//
// const app = express();
// const { app: wsApp } = expressWs(app);
// const PORT = process.env.PORT || 3000;
//
// app.use(express.static("public"));
//
// wsApp.ws("/ws", initConnection);
// app.listen(PORT, initServerSideListen);
//
// function initServerSideListen(): void {
//   console.log(`message: server started on port ${PORT}`);
// }
//
// function initConnection(ws: WebSocket): void {
//   console.log("connected");
//   const message = "Welcome to the Test Eldoria Server where we will be making monads";
//   ws.send(JSON.stringify({ message }));
//   ws.on("message", (msg: string) => incomingMessageHandler(msg, ws));
//   ws.on("close", () => console.log("disconnected"));
// }
//
// function incomingMessageHandler(msg: string, ws: WebSocket): void {
//   console.log(msg);
//   ws.send(JSON.stringify({
//     message: `echo: ${msg}`,
//   }))
// }
//
// class WebSocketWrapper {
//   private socket: WebSocket;
//
//   constructor(url: string) {
//     this.socket = new WebSocket(url);
//   }
//
//   connect(): Promise<void> {
//     return new Promise<void>((resolve, reject) => {
//       this.socket.addEventListener('open', () => {
//         resolve();
//       });
//
//       this.socket.addEventListener('error', (error) => {
//         reject(error);
//       });
//     });
//   }
//
//   send(message: string): Promise<void> {
//     return new Promise<void>((resolve, reject) => {
//       this.socket.addEventListener('open', () => {
//         this.socket.send(message);
//         resolve();
//       });
//
//       this.socket.addEventListener('error', (error) => {
//         reject(error);
//       });
//     });
//   }
//
//   receive(): Promise<string> {
//     return new Promise<string>((resolve, reject) => {
//       this.socket.addEventListener('message', (event) => {
//         resolve(event.data);
//       });
//
//       this.socket.addEventListener('error', (error) => {
//         reject(error);
//       });
//     });
//   }
//
//   close(): Promise<void> {
//     return new Promise<void>((resolve) => {
//       this.socket.addEventListener('close', () => {
//         resolve();
//       });
//
//       this.socket.close();
//     });
//   }
// }
//
// // Usage example
// const ws = new WebSocketWrapper('ws://example.com');
//
// ws.connect()
//   .then(() => {
//     return ws.send('Hello, WebSocket!');
//   })
//   .then(() => {
//     return ws.receive();
//   })
//   .then((message) => {
//     console.log('Received message:', message);
//   })
//   .catch((error) => {
//     console.error('WebSocket error:', error);
//   })
//   .finally(() => {
//     return ws.close();
//   });
//
