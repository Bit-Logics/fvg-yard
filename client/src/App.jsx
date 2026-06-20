import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Lobby from './components/Lobby';
import MapArea from './components/MapArea';
import GameUI from './components/GameUI';
import FugitiveLog from './components/FugitiveLog';
import FugitiveControls from './components/FugitiveControls';
import { Sun, Moon, TreePine, Flag } from 'lucide-react';
import SoundEngine from './utils/SoundEngine';
import './App.css';

// Socket connection uses relative path so Vite proxy handles it
const socket = io('/', {
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

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

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
      if (currentPlayerId === socket.id) {
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
      alert(`Game Over! ${winner} wins! Reason: ${reason}`);
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

  const handleMove = (targetId, transportType, isDouble = false, isSecret = false) => {
    socket.emit('move', { targetId, transportType, isDouble, isSecret });
  };

  const handleSetRole = (role) => {
    socket.emit('setRole', role);
  }

  const myPlayer = players[socket.id];
  const isMyTurn = turnOrder[currentTurnIndex] === socket.id;
  const currentPlayer = players[turnOrder[currentTurnIndex]];
  const fugitivePlayer = Object.values(players).find(p => p.role === 'fugitive');

  return (
    <div className="app-container">
      <div style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 1000, display: 'flex', gap: '10px' }}>
        {gameState === 'playing' && (
          <button 
            className="theme-toggle" 
            onClick={() => socket.emit('voteEndGame')}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '5px', 
              backgroundColor: endGameVotes[socket.id] ? 'var(--danger-color)' : 'var(--panel-bg)',
              color: endGameVotes[socket.id] ? 'white' : 'var(--text-primary)'
            }}
            title="Vota per terminare la partita in anticipo"
          >
            <Flag size={20} />
            {Object.keys(endGameVotes).length > 0 && (
              <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                {Object.keys(endGameVotes).length}/{Object.keys(players).length}
              </span>
            )}
          </button>
        )}
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'light' ? <Sun size={20} /> : theme === 'dark' ? <Moon size={20} /> : <TreePine size={20} />}
        </button>
      </div>

      {errorMsg && (
        <div className="error-toast glass-panel">
          {errorMsg}
        </div>
      )}

      {(gameState === 'lobby' || (gameState === 'playing' && !myPlayer)) && (
        <Lobby 
          players={players} 
          onJoin={handleJoin} 
          onStart={handleStart} 
          myId={socket.id}
          onSetRole={handleSetRole}
          onDraw={() => socket.emit('drawCard')}
          isGameInProgress={gameState === 'playing'}
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
          />
          <GameUI 
            myPlayer={myPlayer} 
            timeLeft={timeLeft} 
            isMyTurn={isMyTurn}
            currentPlayer={currentPlayer}
            selectedMap={selectedMap}
          />
          
          {fugitivePlayer && (
            <FugitiveLog 
              history={fugitivePlayer.history} 
              isFugitive={myPlayer?.role === 'fugitive'} 
              selectedMap={selectedMap}
            />
          )}

          {myPlayer?.role === 'fugitive' && isMyTurn && (
            <FugitiveControls 
              onMove={handleMove}
              mapData={maps[selectedMap]}
              specialTickets={myPlayer.specialTickets}
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;
