const mapDataFriuli = require('./mapData.json');
const mapDataItaly = require('./mapDataItaly.json');
const mapDataPorpetto = require('./mapDataPorpetto.json');
const MAPS = {
  friuli: mapDataFriuli,
  italy: mapDataItaly,
  porpetto: mapDataPorpetto
};

const TURN_TIME_MS = 60000; // 60 seconds
const REVEAL_TURNS = [3, 8, 13, 18, 24];

const STARTING_TICKETS = {
  car: 10,
  train: 8,
  plane: 4,
  ferry: 3
};

let io;

const LOBBIES = {
  lobby1: { id: 'lobby1', name: 'Lobby 1', players: {}, gameState: 'lobby', turnOrder: [], currentTurnIndex: 0, timer: null, timeLeft: 0, timerInterval: null, votes: {}, selectedMap: 'friuli' },
  lobby2: { id: 'lobby2', name: 'Lobby 2', players: {}, gameState: 'lobby', turnOrder: [], currentTurnIndex: 0, timer: null, timeLeft: 0, timerInterval: null, votes: {}, selectedMap: 'friuli' },
  lobby3: { id: 'lobby3', name: 'Lobby 3', players: {}, gameState: 'lobby', turnOrder: [], currentTurnIndex: 0, timer: null, timeLeft: 0, timerInterval: null, votes: {}, selectedMap: 'friuli' },
};

function init(socketIo) {
  io = socketIo;
  
  io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);
    
    // Auto-assign to best lobby
    let bestLobbyId = 'lobby1';
    let maxPlayers = -1;
    for (const [lId, lobby] of Object.entries(LOBBIES)) {
      const pCount = Object.keys(lobby.players).length;
      if (lobby.gameState === 'lobby' && pCount < 10 && pCount > maxPlayers) {
        maxPlayers = pCount;
        bestLobbyId = lId;
      }
    }
    
    socket.lobbyId = bestLobbyId;
    socket.join(bestLobbyId);
    
    socket.emit('gameState', getPublicState(socket.id, bestLobbyId));
    broadcastLobbiesMeta();
    
    socket.on('switchLobby', (targetLobbyId) => {
      if (typeof targetLobbyId !== 'string' || !LOBBIES[targetLobbyId]) return;
      
      const oldLobbyId = socket.lobbyId;
      if (oldLobbyId) {
        // Remove from old lobby
        if (LOBBIES[oldLobbyId].players[socket.id]) {
          delete LOBBIES[oldLobbyId].players[socket.id];
          if (Object.keys(LOBBIES[oldLobbyId].players).length < 2 && LOBBIES[oldLobbyId].gameState === 'playing') {
            LOBBIES[oldLobbyId].gameState = 'lobby';
            stopTimer(oldLobbyId);
          }
        }
        socket.leave(oldLobbyId);
        broadcastState(oldLobbyId);
      }
      
      socket.lobbyId = targetLobbyId;
      socket.join(targetLobbyId);
      socket.emit('gameState', getPublicState(socket.id, targetLobbyId));
      broadcastLobbiesMeta();
    });

    socket.on('join', (data) => {
      const lobby = LOBBIES[socket.lobbyId];
      if (lobby.gameState !== 'lobby') {
        socket.emit('errorMsg', 'Game already started');
        return;
      }
      if (Object.keys(lobby.players).length >= 10) {
        socket.emit('errorMsg', 'Lobby full');
        return;
      }
      
      const playerNameRaw = data && typeof data === 'object' ? data.name : data;
      const playerColorRaw = data && typeof data === 'object' ? data.color : '#3b82f6';
      
      // Sanitization
      const playerName = playerNameRaw ? String(playerNameRaw).replace(/[<>]/g, '').substring(0, 15) : `Player ${Object.keys(lobby.players).length + 1}`;
      const playerColor = playerColorRaw ? String(playerColorRaw).replace(/[<>]/g, '').substring(0, 15) : '#3b82f6';

      lobby.players[socket.id] = {
        id: socket.id,
        name: playerName || `Player ${Object.keys(lobby.players).length + 1}`,
        color: playerColor,
        role: 'detective', 
        location: null,
        hasDrawn: false,
        tickets: { ...STARTING_TICKETS },
        specialTickets: { double: 0, secret: 0 },
        isReady: false,
        history: []
      };
      
      broadcastState(socket.lobbyId);
      broadcastLobbiesMeta();
    });
    
    socket.on('setRole', (role) => {
      const lobby = LOBBIES[socket.lobbyId];
      if (lobby.gameState !== 'lobby' || !lobby.players[socket.id]) return;
      if (role === 'fugitive') {
        Object.values(lobby.players).forEach(p => {
          if (p.role === 'fugitive') p.role = 'detective';
        });
        lobby.players[socket.id].role = 'fugitive';
      }
      broadcastState(socket.lobbyId);
    });

    socket.on('voteMap', (mapId) => {
      const lobby = LOBBIES[socket.lobbyId];
      if (!lobby || lobby.gameState !== 'lobby' || !lobby.players[socket.id]) return;
      if (mapId !== 'friuli' && mapId !== 'italy' && mapId !== 'porpetto') return;
      lobby.votes[socket.id] = mapId;
      broadcastState(socket.lobbyId);
    });

    socket.on('drawCard', () => {
      const lobby = LOBBIES[socket.lobbyId];
      if (!lobby || lobby.gameState !== 'lobby' || !lobby.players[socket.id]) return;
      if (lobby.players[socket.id].hasDrawn) return;
      
      lobby.players[socket.id].hasDrawn = true;
      lobby.players[socket.id].startingLocations = {
        friuli: getRandomLocationForMap('friuli', lobby),
        italy: getRandomLocationForMap('italy', lobby),
        porpetto: getRandomLocationForMap('porpetto', lobby)
      };
      broadcastState(socket.lobbyId);
    });
    
    socket.on('startGame', () => {
      const lobby = LOBBIES[socket.lobbyId];
      if (lobby.gameState !== 'lobby') return;
      const playerList = Object.values(lobby.players);
      if (playerList.length < 2) {
        socket.emit('errorMsg', 'Need at least 2 players');
        return;
      }
      if (!playerList.find(p => p.role === 'fugitive')) {
        socket.emit('errorMsg', 'Need a fugitive');
        return;
      }
      if (playerList.some(p => !p.hasDrawn)) {
        socket.emit('errorMsg', 'Tutti i giocatori devono essersi dichiarati pronti (pescare un biglietto) prima di iniziare');
        return;
      }

      // Tally votes
      let votesCount = { friuli: 0, italy: 0, porpetto: 0 };
      for (const p of playerList) {
        const v = lobby.votes[p.id];
        if (v === 'italy' || v === 'porpetto') {
          votesCount[v]++;
        } else {
          votesCount.friuli++;
        }
      }
      
      let winner = 'friuli';
      let maxVotes = votesCount.friuli;
      if (votesCount.italy > maxVotes) { winner = 'italy'; maxVotes = votesCount.italy; }
      if (votesCount.porpetto > maxVotes) { winner = 'porpetto'; maxVotes = votesCount.porpetto; }
      
      lobby.selectedMap = winner;
      
      // Assign starting locations now that map is decided
      playerList.forEach(p => {
        p.location = p.startingLocations ? p.startingLocations[winner] : getRandomLocationForMap(winner, lobby);
      });
      
      playerList.forEach(p => {
        p.history = [];
        if (p.role === 'fugitive') {
          p.tickets = { car: '∞', train: '∞', plane: '∞', ferry: '∞' };
          p.specialTickets = { double: 3, secret: 3 };
        } else {
          p.tickets = { ...STARTING_TICKETS };
          p.specialTickets = { double: 0, secret: 0 };
        }
      });
      
      const fugitive = playerList.find(p => p.role === 'fugitive');
      const detectives = playerList.filter(p => p.role === 'detective');
      lobby.turnOrder = [fugitive.id, ...detectives.map(d => d.id)];
      lobby.currentTurnIndex = 0;
      lobby.endGameVotes = {};
      lobby.gameState = 'playing';
      
      startTurnTimer(socket.lobbyId);
      broadcastState(socket.lobbyId);
      broadcastLobbiesMeta();
    });

    socket.on('voteEndGame', () => {
      const lobby = LOBBIES[socket.lobbyId];
      if (!lobby || lobby.gameState !== 'playing' || !lobby.players[socket.id]) return;
      
      if (!lobby.endGameVotes) lobby.endGameVotes = {};
      lobby.endGameVotes[socket.id] = true;
      
      const voteCount = Object.keys(lobby.endGameVotes).length;
      const totalPlayers = Object.keys(lobby.players).length;
      
      if (voteCount >= totalPlayers && totalPlayers > 0) {
        lobby.gameState = 'finished';
        io.to(socket.lobbyId).emit('gameOver', { winner: 'none', reason: 'Partita terminata tramite votazione unanime.' });
        stopTimer(socket.lobbyId);
        broadcastLobbiesMeta();
      }
      broadcastState(socket.lobbyId);
    });

    socket.on('resetLobby', () => {
      const lobby = LOBBIES[socket.lobbyId];
      if (!lobby || lobby.gameState !== 'finished') return;
      
      lobby.gameState = 'lobby';
      
      // Reset players state but keep them in the lobby
      Object.keys(lobby.players).forEach(pid => {
        const p = lobby.players[pid];
        p.role = null;
        p.location = null;
        p.history = [];
        p.tickets = {};
        p.specialTickets = {};
      });
      
      lobby.turnOrder = [];
      lobby.currentTurnIndex = 0;
      lobby.endGameVotes = {};
      lobby.votes = { friuli: 0, italy: 0, porpetto: 0 };
      lobby.playerVotes = {};
      
      broadcastState(socket.lobbyId);
      broadcastLobbiesMeta();
    });
    
    socket.on('move', (data) => {
      const lobby = LOBBIES[socket.lobbyId];
      if (!lobby || lobby.gameState !== 'playing') return;
      if (!data || typeof data !== 'object') return;
      
      let { targetId, transportType, isDouble, isSecret } = data;
      isDouble = !!isDouble;
      isSecret = !!isSecret;
      
      if (!['car', 'train', 'plane', 'ferry'].includes(transportType)) {
        socket.emit('errorMsg', 'Mezzo non valido');
        return;
      }
      
      const currentPlayerId = lobby.turnOrder[lobby.currentTurnIndex];
      if (socket.id !== currentPlayerId) {
        socket.emit('errorMsg', 'Not your turn');
        return;
      }
      
      const player = lobby.players[socket.id];
      
      if (!isValidMove(player.location, targetId, transportType, socket.id, lobby)) {
        socket.emit('errorMsg', 'Invalid move');
        return;
      }
      
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
      
      player.history.push({ 
        from: player.location, 
        to: targetId, 
        actualType: transportType,
        displayType: isSecret ? 'secret' : transportType
      });
      player.location = targetId;
      
      if (checkWinCondition(socket.lobbyId)) {
        return;
      }
      
      if (skipNextTurn) {
        startTurnTimer(socket.lobbyId);
        broadcastState(socket.lobbyId);
      } else {
        nextTurn(socket.lobbyId);
      }
    });
    
    socket.on('sendChatMessage', (messageText) => {
      const lobby = LOBBIES[socket.lobbyId];
      if (!lobby || !lobby.players[socket.id]) return;
      
      const player = lobby.players[socket.id];
      const now = Date.now();
      
      // Anti-spam: 1 message per 1.5 seconds
      if (player.lastMessageTime && now - player.lastMessageTime < 1500) {
        socket.emit('errorMsg', 'Aspetta un attimo prima di inviare un altro messaggio.');
        return;
      }
      player.lastMessageTime = now;
      
      if (typeof messageText !== 'string') return;
      
      const text = messageText.trim().substring(0, 200); // Max 200 chars
      if (text.length === 0) return;
      
      // Sanitize
      const sanitizedText = text.replace(/[<>]/g, '');
      
      io.to(socket.lobbyId).emit('chatMessage', {
        playerId: player.id,
        playerName: player.name,
        playerColor: player.color,
        text: sanitizedText,
        timestamp: now
      });
    });

    socket.on('disconnect', () => {
      console.log('Player disconnected:', socket.id);
      const lId = socket.lobbyId;
      if (lId && LOBBIES[lId]) {
        const lobby = LOBBIES[lId];
        if (lobby.players[socket.id]) {
          const disconnectedPlayer = lobby.players[socket.id];
          
          if (lobby.gameState === 'playing') {
            if (disconnectedPlayer.role === 'fugitive') {
              lobby.gameState = 'finished';
              io.to(lId).emit('gameOver', { winner: 'detectives', reason: 'Il Fuggitivo ha abbandonato la partita!' });
              stopTimer(lId);
              delete lobby.players[socket.id];
            } else if (disconnectedPlayer.role === 'detective') {
              Object.values(lobby.players).forEach(p => {
                if (p.role === 'detective' && p.id !== socket.id) {
                  p.tickets.car += 3;
                  p.tickets.train += 2;
                  p.tickets.plane += 1;
                }
              });
              
              delete lobby.players[socket.id];
              
              if (Object.keys(lobby.players).length < 2) {
                lobby.gameState = 'lobby';
                stopTimer(lId);
              } else if (lobby.turnOrder[lobby.currentTurnIndex] === socket.id) {
                nextTurn(lId);
              }
            }
          } else {
            delete lobby.players[socket.id];
          }
          
          broadcastState(lId);
          broadcastLobbiesMeta();
        }
      }
    });
  });
}

function getRandomLocationForMap(mapId, lobby) {
  const mapData = MAPS[mapId];
  if (!mapData || !mapData.nodes) return "Sconosciuto";
  const nodes = mapData.nodes;
  let loc;
  do {
    loc = nodes[Math.floor(Math.random() * nodes.length)].id;
  } while (Object.values(lobby.players).some(p => p.startingLocations && p.startingLocations[mapId] === loc));
  return loc;
}

function getRandomLocation(lobby) {
  return getRandomLocationForMap(lobby.selectedMap, lobby);
}

function isValidMove(fromId, toId, transportType, playerId, lobby) {
  const mapData = MAPS[lobby.selectedMap];
  const hasLink = mapData.links.some(l => 
    ((l.source === fromId && l.target === toId) || 
     (l.source === toId && l.target === fromId)) && 
    l.type === transportType
  );
  if (!hasLink) return false;

  const player = lobby.players[playerId];
  if (player && player.role === 'detective') {
    const occupiedByDetective = Object.values(lobby.players).some(p => p.role === 'detective' && p.id !== playerId && p.location === toId);
    if (occupiedByDetective) return false;
  }
  return true;
}

function checkWinCondition(lobbyId) {
  const lobby = LOBBIES[lobbyId];
  const playerList = Object.values(lobby.players);
  const fugitive = playerList.find(p => p.role === 'fugitive');
  if (!fugitive) return false;
  const detectives = playerList.filter(p => p.role === 'detective');
  
  if (detectives.some(d => d.location === fugitive.location)) {
    lobby.gameState = 'finished';
    io.to(lobbyId).emit('gameOver', { winner: 'detectives', reason: 'Fugitive caught!' });
    stopTimer(lobbyId);
    broadcastLobbiesMeta();
    return true;
  }
  
  if (fugitive.history.length >= 24) {
    lobby.gameState = 'finished';
    io.to(lobbyId).emit('gameOver', { winner: 'fugitive', reason: 'Fugitive survived 24 rounds!' });
    stopTimer(lobbyId);
    broadcastLobbiesMeta();
    return true;
  }
  
  return false;
}

function nextTurn(lobbyId) {
  const lobby = LOBBIES[lobbyId];
  lobby.currentTurnIndex = (lobby.currentTurnIndex + 1) % lobby.turnOrder.length;
  
  const playerId = lobby.turnOrder[lobby.currentTurnIndex];
  const player = lobby.players[playerId];
  
  if (!player || (player.role === 'detective' && Object.values(player.tickets).every(t => t === 0))) {
     nextTurn(lobbyId);
     return;
  }
  
  startTurnTimer(lobbyId);
  broadcastState(lobbyId);
}

function startTurnTimer(lobbyId) {
  const lobby = LOBBIES[lobbyId];
  stopTimer(lobbyId);
  lobby.timeLeft = TURN_TIME_MS / 1000;
  
  lobby.timerInterval = setInterval(() => {
    lobby.timeLeft--;
    io.to(lobbyId).emit('timerUpdate', lobby.timeLeft);
    
    if (lobby.timeLeft <= 0) {
      nextTurn(lobbyId);
    }
  }, 1000);
}

function stopTimer(lobbyId) {
  const lobby = LOBBIES[lobbyId];
  if (lobby.timerInterval) clearInterval(lobby.timerInterval);
}

function getPublicState(requestingSocketId, lobbyId) {
  const lobby = LOBBIES[lobbyId];
  if (!lobby) return null;
  
  const requestingPlayer = lobby.players[requestingSocketId];
  const isFugitiveReq = requestingPlayer && requestingPlayer.role === 'fugitive';
  
  const sanitizedPlayers = JSON.parse(JSON.stringify(lobby.players));
  
  const fugitiveId = Object.keys(sanitizedPlayers).find(id => sanitizedPlayers[id].role === 'fugitive');
  if (fugitiveId && !isFugitiveReq) {
    const f = sanitizedPlayers[fugitiveId];
    const turnNum = f.history.length;
    
    const isReveal = REVEAL_TURNS.includes(turnNum);
    
    if (!isReveal) {
      f.location = null; 
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
    gameState: lobby.gameState,
    players: sanitizedPlayers,
    turnOrder: lobby.turnOrder,
    currentTurnIndex: lobby.currentTurnIndex,
    currentPlayerId: lobby.turnOrder[lobby.currentTurnIndex],
    timeLeft: lobby.timeLeft,
    lobbyId: lobby.id,
    votes: lobby.votes,
    selectedMap: lobby.selectedMap,
    endGameVotes: lobby.endGameVotes || {}
  };
}

function broadcastState(lobbyId) {
  const lobby = LOBBIES[lobbyId];
  if (!lobby) return;
  
  Object.keys(lobby.players).forEach(socketId => {
    io.to(socketId).emit('gameState', getPublicState(socketId, lobbyId));
  });
}

function broadcastLobbiesMeta() {
  if (!io) return;
  const meta = Object.values(LOBBIES).map(l => ({
    id: l.id,
    name: l.name,
    playerCount: Object.keys(l.players).length,
    gameState: l.gameState
  }));
  io.emit('lobbiesMeta', meta);
}

module.exports = { init };
