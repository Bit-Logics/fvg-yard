const mapData = require('./mapData.json');

const TURN_TIME_MS = 60000; // 60 seconds
const REVEAL_TURNS = [3, 8, 13, 18, 24]; // Scotland Yard reveal turns

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
    socket.emit('gameState', getPublicState(socket.id));
    
    socket.on('join', (data) => {
      if (gameState !== 'lobby') {
        socket.emit('errorMsg', 'Game already started');
        return;
      }
      if (Object.keys(players).length >= 10) {
        socket.emit('errorMsg', 'Lobby full');
        return;
      }
      
      const playerName = typeof data === 'object' ? data.name : data;
      const playerColor = typeof data === 'object' ? data.color : '#3b82f6';

      players[socket.id] = {
        id: socket.id,
        name: playerName || `Player ${Object.keys(players).length + 1}`,
        color: playerColor,
        role: 'detective', 
        location: null, // location is assigned when drawing card
        hasDrawn: false,
        tickets: { ...STARTING_TICKETS },
        specialTickets: { double: 0, secret: 0 },
        isReady: false,
        history: []
      };
      
      broadcastState();
    });
    
    socket.on('setRole', (role) => {
      if (gameState !== 'lobby' || !players[socket.id]) return;
      if (role === 'fugitive') {
        Object.values(players).forEach(p => {
          if (p.role === 'fugitive') p.role = 'detective';
        });
        players[socket.id].role = 'fugitive';
      }
      broadcastState();
    });

    socket.on('drawCard', () => {
      if (gameState !== 'lobby' || !players[socket.id]) return;
      if (players[socket.id].hasDrawn) return;
      
      players[socket.id].location = getRandomLocation();
      players[socket.id].hasDrawn = true;
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
      if (playerList.some(p => !p.hasDrawn)) {
        socket.emit('errorMsg', 'Tutti i giocatori devono pescare un biglietto prima di iniziare');
        return;
      }
      
      playerList.forEach(p => {
        p.history = [];
        if (p.role === 'fugitive') {
          p.tickets = { car: '∞', train: '∞', plane: '∞' };
          p.specialTickets = { double: 3, secret: 3 };
        } else {
          p.tickets = { ...STARTING_TICKETS };
          p.specialTickets = { double: 0, secret: 0 };
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
      let { targetId, transportType, isDouble, isSecret } = data; // e.g. { targetId: 5, transportType: 'train' }
      
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
        isDouble = false;
        isSecret = false;
      }

      let skipNextTurn = false;
      if (player.role === 'fugitive') {
        if (isDouble) {
          if (player.specialTickets.double > 0) {
            player.specialTickets.double--;
            skipNextTurn = true;
          } else {
            isDouble = false;
          }
        }
        if (isSecret) {
          if (player.specialTickets.secret > 0) {
            player.specialTickets.secret--;
          } else {
            isSecret = false;
          }
        }
      }
      
      // Apply move
      player.history.push({ 
        from: player.location, 
        to: targetId, 
        actualType: transportType,
        displayType: isSecret ? 'secret' : transportType
      });
      player.location = targetId;
      
      // Check win condition
      if (checkWinCondition()) {
        return;
      }
      
      if (skipNextTurn) {
        startTurnTimer();
        broadcastState();
      } else {
        nextTurn();
      }
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
  if (!fugitive) return false;
  const detectives = playerList.filter(p => p.role === 'detective');
  
  // Detectives win if any is on the same node as fugitive
  if (detectives.some(d => d.location === fugitive.location)) {
    gameState = 'finished';
    io.emit('gameOver', { winner: 'detectives', reason: 'Fugitive caught!' });
    stopTimer();
    return true;
  }
  
  // Fugitive wins if survives 24 rounds
  if (fugitive.history.length >= 24) {
    gameState = 'finished';
    io.emit('gameOver', { winner: 'fugitive', reason: 'Fugitive survived 24 rounds!' });
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

function getPublicState(requestingSocketId) {
  const requestingPlayer = players[requestingSocketId];
  const isFugitiveReq = requestingPlayer && requestingPlayer.role === 'fugitive';
  
  const sanitizedPlayers = JSON.parse(JSON.stringify(players));
  
  const fugitiveId = Object.keys(sanitizedPlayers).find(id => sanitizedPlayers[id].role === 'fugitive');
  if (fugitiveId && !isFugitiveReq) {
    const f = sanitizedPlayers[fugitiveId];
    const turnNum = f.history.length;
    
    const isReveal = REVEAL_TURNS.includes(turnNum);
    
    if (!isReveal) {
      let lastRevealedNode = null;
      for (let i = 0; i < turnNum; i++) {
        if (REVEAL_TURNS.includes(i + 1)) {
           lastRevealedNode = f.history[i].to;
        }
      }
      f.location = lastRevealedNode; 
    }
    
    f.history = f.history.map((h, i) => {
      const turnIdx = i + 1;
      return {
        displayType: h.displayType,
        to: REVEAL_TURNS.includes(turnIdx) ? h.to : null
      };
    });
  }
  
  return {
    gameState,
    players: sanitizedPlayers,
    turnOrder,
    currentTurnIndex,
    currentPlayerId: turnOrder[currentTurnIndex],
    timeLeft
  };
}

function broadcastState() {
  if (!io) return;
  const sockets = Array.from(io.sockets.sockets.values());
  sockets.forEach(socket => {
    socket.emit('gameState', getPublicState(socket.id));
  });
}

module.exports = { init };
