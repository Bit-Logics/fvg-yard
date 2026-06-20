import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Lobby from './components/Lobby';
import MapArea from './components/MapArea';
import GameUI from './components/GameUI';
import FugitiveLog from './components/FugitiveLog';
import FugitiveControls from './components/FugitiveControls';
import { Sun, Moon, TreePine } from 'lucide-react';
import './App.css';

// Socket connection uses relative path so Vite proxy handles it
const socket = io('/', {
  extraHeaders: {
    "Bypass-Tunnel-Reminder": "true",
    "ngrok-skip-browser-warning": "true"
  }
});

function App() {
  const [theme, setTheme] = useState('dark');
  const [gameState, setGameState] = useState('lobby');
  const [players, setPlayers] = useState({});
  const [turnOrder, setTurnOrder] = useState([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [mapData, setMapData] = useState(null);
  const [lobbies, setLobbies] = useState([]);
  const [currentLobbyId, setCurrentLobbyId] = useState('lobby1');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    // Fetch map data
    fetch('/map')
      .then(res => res.json())
      .then(data => setMapData(data))
      .catch(err => console.error("Failed to load map data", err));

    socket.on('gameState', (state) => {
      setGameState(state.gameState);
      setPlayers(state.players);
      setTurnOrder(state.turnOrder);
      setCurrentTurnIndex(state.currentTurnIndex);
      setTimeLeft(state.timeLeft);
      if (state.lobbyId) setCurrentLobbyId(state.lobbyId);
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
      <button className="theme-toggle" onClick={toggleTheme}>
        {theme === 'light' ? <Sun size={20} /> : theme === 'dark' ? <Moon size={20} /> : <TreePine size={20} />}
      </button>

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
        />
      )}

      {(gameState === 'playing' || gameState === 'finished') && mapData && myPlayer && (
        <>
          <MapArea 
            mapData={mapData} 
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
          />
          
          {fugitivePlayer && (
            <FugitiveLog 
              history={fugitivePlayer.history} 
              isFugitive={myPlayer?.role === 'fugitive'} 
            />
          )}

          {myPlayer?.role === 'fugitive' && isMyTurn && (
            <FugitiveControls 
              onMove={handleMove}
              mapData={mapData}
              specialTickets={myPlayer.specialTickets}
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;
