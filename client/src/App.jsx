import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Lobby from './components/Lobby';
import MapArea from './components/MapArea';
import GameUI from './components/GameUI';
import FugitiveLog from './components/FugitiveLog';
import FugitiveControls from './components/FugitiveControls';
import ChatWindow from './components/ChatWindow';
import { Sun, Moon, TreePine, Flag } from 'lucide-react';
import SoundEngine from './utils/SoundEngine';
import './App.css';

// Session ID setup
let sessionId = localStorage.getItem('misterx_session_id');
if (!sessionId) {
  sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  localStorage.setItem('misterx_session_id', sessionId);
}

// Socket connection uses relative path so Vite proxy handles it
const socket = io('/', {
  auth: {
    sessionId
  },
  extraHeaders: {
    "Bypass-Tunnel-Reminder": "true",
    "ngrok-skip-browser-warning": "true"
  }
});

function App() {
  const [theme, setTheme] = useState('light');
  const [errorMsg, setErrorMsg] = useState('');
  const [gameState, setGameState] = useState('lobby');
  const [players, setPlayers] = useState({});
  const [turnOrder, setTurnOrder] = useState([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [maps, setMaps] = useState({ friuli: null, italy: null, porpetto: null });
  const [selectedMap, setSelectedMap] = useState('friuli');
  const [lobbies, setLobbies] = useState([]);
  const [currentLobbyId, setCurrentLobbyId] = useState(null);
  const [votes, setVotes] = useState({});
  const [endGameVotes, setEndGameVotes] = useState({});
  const [isDouble, setIsDouble] = useState(false);
  const [isSecret, setIsSecret] = useState(false);
  const [gameOverData, setGameOverData] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Handle Document Title
  useEffect(() => {
    if (gameState === 'lobby') {
      document.title = 'FVG Yard - Menu';
    } else {
      const mapNames = {
        friuli: 'Friuli VG',
        italy: 'Italia',
        porpetto: 'Porpetto'
      };
      const mapName = mapNames[selectedMap] || 'In Game';
      document.title = `FVG Yard - ${mapName}`;
    }
  }, [gameState, selectedMap]);

  // Handle Game Start Sound
  useEffect(() => {
    if (gameState === 'playing') {
      SoundEngine.playStart();
    }
  }, [gameState]);

  // Handle Turn Change Sound
  useEffect(() => {
    if (gameState === 'playing' && turnOrder.length > 0) {
      const currentPlayerId = turnOrder[currentTurnIndex];
      if (currentPlayerId === sessionId) {
        SoundEngine.playTurn();
      }
    }
  }, [currentTurnIndex, gameState, turnOrder]);

  useEffect(() => {
    // Fetch all maps
    Promise.all([
      fetch('/map/friuli').then(res => res.json()),
      fetch('/map/italy').then(res => res.json()),
      fetch('/map/porpetto').then(res => res.json())
    ])
    .then(([f, i, p]) => setMaps({ friuli: f, italy: i, porpetto: p }))
    .catch(err => console.error("Failed to load maps", err));

    socket.on('gameState', (state) => {
      setGameState(state.gameState);
      if (state.gameState === 'lobby') {
        setGameOverData(null);
      }
      setPlayers(state.players);
      setTurnOrder(state.turnOrder);
      setCurrentTurnIndex(state.currentTurnIndex);
      setTimeLeft(state.timeLeft);
      if (state.lobbyId) setCurrentLobbyId(state.lobbyId);
      if (state.selectedMap) setSelectedMap(state.selectedMap);
      if (state.votes) setVotes(state.votes);
      if (state.endGameVotes) setEndGameVotes(state.endGameVotes);
    });

    socket.on('lobbiesMeta', (meta) => {
      setLobbies(meta);
    });

    socket.on('timerUpdate', (time) => {
      setTimeLeft(time);
    });

    socket.on('errorMsg', (msg) => {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 3000);
    });

    socket.on('gameOver', ({ winner, reason }) => {
      setGameOverData({ winner, reason });
    });

    return () => {
      socket.off('gameState');
      socket.off('lobbiesMeta');
      socket.off('timerUpdate');
      socket.off('errorMsg');
      socket.off('gameOver');
    };
  }, []);

  const handleSwitchLobby = (lobbyId) => {
    if (lobbyId !== currentLobbyId) {
      setPlayers({});
      socket.emit('switchLobby', lobbyId);
    }
  };

  const toggleTheme = () => {
    setTheme(t => {
      if (t === 'light') return 'dark';
      if (t === 'dark') return 'nature';
      return 'light';
    });
  };

  const handleJoin = (data) => {
    socket.emit('join', data);
  };

  const handleStart = () => {
    socket.emit('startGame');
  };

  const handleMove = (targetId, transportType, doubleOverride, secretOverride) => {
    socket.emit('move', { 
      targetId, 
      transportType, 
      isDouble: doubleOverride !== undefined ? doubleOverride : isDouble, 
      isSecret: secretOverride !== undefined ? secretOverride : isSecret 
    });
    setIsDouble(false);
    setIsSecret(false);
  };

  const handleSetRole = (role) => {
    socket.emit('setRole', role);
  }

  const myPlayer = players[sessionId];
  const isMyTurn = turnOrder[currentTurnIndex] === sessionId;
  const currentPlayer = players[turnOrder[currentTurnIndex]];
  const fugitivePlayer = Object.values(players).find(p => p.role === 'fugitive');

  return (
    <div className="app-container">
      <div style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 1000, display: 'flex', gap: '10px' }}>
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'light' ? <Sun size={20} /> : theme === 'dark' ? <Moon size={20} /> : <TreePine size={20} />}
        </button>
      </div>

      {errorMsg && (
        <div className="error-toast glass-panel">
          {errorMsg}
        </div>
      )}

      {(gameState === 'lobby' || ((gameState === 'playing' || gameState === 'finished') && !myPlayer)) && (
        <Lobby 
          players={players} 
          onJoin={handleJoin} 
          onStart={handleStart} 
          myId={sessionId}
          onSetRole={handleSetRole}
          onDraw={() => socket.emit('drawCard')}
          isGameInProgress={gameState !== 'lobby'}
          lobbies={lobbies}
          currentLobbyId={currentLobbyId}
          onSwitchLobby={handleSwitchLobby}
          votes={votes}
          onVoteMap={(mapId) => socket.emit('voteMap', mapId)}
        />
      )}

      {(gameState === 'playing' || gameState === 'finished') && maps[selectedMap] && myPlayer && (
        <>
          <MapArea 
            mapData={maps[selectedMap]} 
            selectedMap={selectedMap}
            players={players} 
            myPlayer={myPlayer}
            isMyTurn={isMyTurn}
            onMove={handleMove}
            isDouble={isDouble}
            isSecret={isSecret}
            theme={theme}
          />
          <GameUI 
            myPlayer={myPlayer} 
            timeLeft={timeLeft} 
            isMyTurn={isMyTurn}
            currentPlayer={currentPlayer}
            selectedMap={selectedMap}
            endGameVotes={endGameVotes}
            onVoteEndGame={() => socket.emit('voteEndGame')}
            gameState={gameState}
            onResetLobby={() => socket.emit('resetLobby')}
            totalPlayers={Object.keys(players).length}
          />
          
          {fugitivePlayer && (
            <FugitiveLog 
              history={fugitivePlayer.history} 
              isFugitive={myPlayer?.role === 'fugitive'} 
              selectedMap={selectedMap}
            />
          )}
          
          <ChatWindow socket={socket} sessionId={sessionId} />

          {myPlayer?.role === 'fugitive' && isMyTurn && (
            <FugitiveControls 
              onMove={handleMove}
              mapData={maps[selectedMap]}
              specialTickets={myPlayer.specialTickets}
              isDouble={isDouble}
              setIsDouble={setIsDouble}
              isSecret={isSecret}
              setIsSecret={setIsSecret}
            />
          )}

          {gameOverData && (
            <div className="game-ui-overlay" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, justifyContent: 'center', alignItems: 'center', pointerEvents: 'auto' }}>
              <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', maxWidth: '500px', width: '90%' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '10px', color: 'var(--primary-color)' }}>Partita Terminata</h1>
                <h2 style={{ marginBottom: '20px' }}>
                  {gameOverData.winner === 'detectives' ? 'I Detective Vincono!' : 
                   gameOverData.winner === 'fugitive' ? 'Mister X Vince!' : 
                   'Pareggio!'}
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', fontSize: '1.2rem' }}>{gameOverData.reason}</p>
                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                  <button className="btn" onClick={() => setGameOverData(null)} style={{ flex: 1 }}>Torna alla Mappa</button>
                  <button className="btn start-btn" onClick={() => socket.emit('resetLobby')} style={{ flex: 1 }}>Torna alla Lobby</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
