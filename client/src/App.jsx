import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Lobby from './components/Lobby';
import MapArea from './components/MapArea';
import GameUI from './components/GameUI';
import { Sun, Moon } from 'lucide-react';
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
  const [errorMsg, setErrorMsg] = useState('');

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
      setGameState('lobby');
    });

    return () => {
      socket.off('gameState');
      socket.off('timerUpdate');
      socket.off('errorMsg');
      socket.off('gameOver');
    };
  }, []);

  const toggleTheme = () => {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  };

  const handleJoin = (name) => {
    socket.emit('join', name);
  };

  const handleStart = () => {
    socket.emit('startGame');
  };

  const handleMove = (targetId, transportType) => {
    socket.emit('move', { targetId, transportType });
  };

  const handleSetRole = (role) => {
    socket.emit('setRole', role);
  }

  const myPlayer = players[socket.id];
  const isMyTurn = turnOrder[currentTurnIndex] === socket.id;
  const currentPlayer = players[turnOrder[currentTurnIndex]];

  return (
    <div className="app-container">
      <button className="theme-toggle" onClick={toggleTheme}>
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {errorMsg && (
        <div className="error-toast glass-panel">
          {errorMsg}
        </div>
      )}

      {gameState === 'lobby' && (
        <Lobby 
          players={players} 
          onJoin={handleJoin} 
          onStart={handleStart} 
          myId={socket.id}
          onSetRole={handleSetRole}
        />
      )}

      {(gameState === 'playing' || gameState === 'finished') && mapData && (
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
        </>
      )}
    </div>
  );
}

export default App;
