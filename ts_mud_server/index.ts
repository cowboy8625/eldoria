import express from 'express';
import expressWs from 'express-ws';
import WebSocket from 'ws';

const app = express();
const { app: wsApp } = expressWs(app);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

wsApp.ws('/ws', (ws: WebSocket) => {
  console.log('connected');

  ws.on('message', (message: string) => {
    console.log(`received message: ${message}`);

    ws.send(`you said: ${message}`);
  });

  ws.on('close', () => {
    console.log('disconnected');
  });
});

app.listen(PORT, () => {
  console.log(`server started on port ${PORT}`);
});
