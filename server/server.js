const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const gameLogic = require('./gameLogic');
const mapData = require('./mapData.json');

app.get('/map', (req, res) => {
  res.json(mapData);
});

// Pass io to gameLogic to handle socket connections
gameLogic.init(io);

// Serve static React files in production
const path = require('path');
app.use(express.static(path.join(__dirname, '../client/dist')));
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
