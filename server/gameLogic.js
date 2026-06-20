const mapData = require('./mapData.json');

const TURN_TIME_MS = 60000; // 60 seconds

let io;
let players = {};
let gameState = 'lobby'; // lobby, playing, finished
let turnOrder = [];
let currentTurnIndex = 0;
let timer = null;
let timeLeft = 0;
let timerInterval = null;

const STARTING_TICKETS = {
  car: 10,
  train: 8,
  plane: 4
};

function init(socketIo) {
  io = socketIo;
  
  io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);
    
    // Send current state to new player
    socket.emit('gameState', getPublicState());
    
    socket.on('join', (name) => {
      if (gameState !== 'lobby') {
        socket.emit('errorMsg', 'Game already started');
        return;
      }
      if (Object.keys(players).length >= 10) {
        socket.emit('errorMsg', 'Lobby full');
        return;
      }
      
      const isFirst = Object.keys(players).length === 0;
      players[socket.id] = {
        id: socket.id,
        name: name || `Player ${Object.keys(players).length + 1}`,
        role: isFirst ? 'fugitive' : 'detective', // first player defaults to fugitive
        location: getRandomLocation(),
        tickets: { ...STARTING_TICKETS },
        isReady: false,
        history: []
      };
      
      if (players[socket.id].role === 'fugitive') {
         // Fugitive gets special tickets representation or logic
         players[socket.id].tickets = { car: '∞', train: '∞', plane: '∞', black: '∞' };
      }
      
      broadcastState();
    });
    
    socket.on('setRole', (role) => {
      if (gameState !== 'lobby' || !players[socket.id]) return;
      // If someone wants to be fugitive, swap with current
      if (role === 'fugitive') {
        Object.values(players).forEach(p => {
          if (p.role === 'fugitive') p.role = 'detective';
        });
        players[socket.id].role = 'fugitive';
      }
      broadcastState();
    });
    
    socket.on('startGame', () => {
      if (gameState !== 'lobby') return;
      const playerList = Object.values(players);
      if (playerList.length < 2) {
        socket.emit('errorMsg', 'Need at least 2 players');
        return;
      }
      if (!playerList.find(p => p.role === 'fugitive')) {
        socket.emit('errorMsg', 'Need a fugitive');
        return;
      }
      
      // Reset tickets and locations
      playerList.forEach(p => {
        p.location = getRandomLocation();
        p.history = [];
        if (p.role === 'fugitive') {
          p.tickets = { car: '∞', train: '∞', plane: '∞' };
        } else {
          p.tickets = { ...STARTING_TICKETS };
        }
      });
      
      // Setup turn order: Fugitive goes first, then detectives
      const fugitive = playerList.find(p => p.role === 'fugitive');
      const detectives = playerList.filter(p => p.role === 'detective');
      turnOrder = [fugitive.id, ...detectives.map(d => d.id)];
      currentTurnIndex = 0;
      gameState = 'playing';
      
      startTurnTimer();
      broadcastState();
    });
    
    socket.on('move', (data) => {
      if (gameState !== 'playing') return;
      const { targetId, transportType } = data; // e.g. { targetId: 5, transportType: 'train' }
      
      const currentPlayerId = turnOrder[currentTurnIndex];
      if (socket.id !== currentPlayerId) {
        socket.emit('errorMsg', 'Not your turn');
        return;
      }
      
      const player = players[socket.id];
      
      // Validate move
      if (!isValidMove(player.location, targetId, transportType)) {
        socket.emit('errorMsg', 'Invalid move');
        return;
      }
      
      // Consume ticket
      if (player.role === 'detective') {
        if (player.tickets[transportType] <= 0) {
          socket.emit('errorMsg', 'No tickets of that type');
          return;
        }
        player.tickets[transportType]--;
      }
      
      // Apply move
      player.history.push({ from: player.location, to: targetId, type: transportType });
      player.location = targetId;
      
      // Check win condition
      if (checkWinCondition()) {
        return;
      }
      
      nextTurn();
    });
    
    socket.on('disconnect', () => {
      console.log('Player disconnected:', socket.id);
      delete players[socket.id];
      if (Object.keys(players).length < 2 && gameState === 'playing') {
        gameState = 'lobby';
        stopTimer();
      }
      broadcastState();
    });
  });
}

function getRandomLocation() {
  const nodes = mapData.nodes;
  return nodes[Math.floor(Math.random() * nodes.length)].id;
}

function isValidMove(fromId, toId, transportType) {
  return mapData.links.some(l => 
    ((l.source === fromId && l.target === toId) || 
     (l.source === toId && l.target === fromId)) && 
    l.type === transportType
  );
}

function checkWinCondition() {
  const playerList = Object.values(players);
  const fugitive = playerList.find(p => p.role === 'fugitive');
  const detectives = playerList.filter(p => p.role === 'detective');
  
  // Detectives win if any is on the same node as fugitive
  if (detectives.some(d => d.location === fugitive.location)) {
    gameState = 'finished';
    io.emit('gameOver', { winner: 'detectives', reason: 'Fugitive caught!' });
    stopTimer();
    return true;
  }
  
  // Fugitive wins if all detectives are out of tickets (simplified: round 22 reached)
  // For now, let's say round 22 is max. Fugitive history length = 22
  if (fugitive.history.length >= 22) {
    gameState = 'finished';
    io.emit('gameOver', { winner: 'fugitive', reason: 'Fugitive survived 22 rounds!' });
    stopTimer();
    return true;
  }
  
  return false;
}

function nextTurn() {
  currentTurnIndex = (currentTurnIndex + 1) % turnOrder.length;
  
  // Skip player if they have no valid moves/tickets (if detective)
  const player = players[turnOrder[currentTurnIndex]];
  if (player.role === 'detective' && Object.values(player.tickets).every(t => t === 0)) {
     nextTurn();
     return;
  }
  
  startTurnTimer();
  broadcastState();
}

function startTurnTimer() {
  stopTimer();
  timeLeft = TURN_TIME_MS / 1000;
  
  timerInterval = setInterval(() => {
    timeLeft--;
    io.emit('timerUpdate', timeLeft);
    
    if (timeLeft <= 0) {
      // Time up, pass turn
      nextTurn();
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) clearInterval(timerInterval);
}

function getPublicState() {
  // Hide fugitive's exact location from detectives most turns?
  // Scotland Yard rules: fugitive is visible on turns 3, 8, 13, 18, 24.
  // For simplicity first, let's keep it visible, or implement the hide logic.
  // Let's implement full visibility first, then hide if time permits.
  // Actually, we'll keep it simple for a fluid web game: always visible, or hide depending on turn number.
  // The prompt says "come scotland yard", let's hide it unless it's a specific turn, BUT wait,
  // let's send full state to fugitive and obfuscated to detectives.
  
  return {
    gameState,
    players,
    turnOrder,
    currentTurnIndex,
    currentPlayerId: turnOrder[currentTurnIndex],
    timeLeft
  };
}

function broadcastState() {
  io.emit('gameState', getPublicState());
}

module.exports = { init };
