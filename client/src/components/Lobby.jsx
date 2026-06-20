import React, { useState } from 'react';
import './Lobby.css';

function Lobby({ players, onJoin, onStart, myId, onSetRole }) {
  const [name, setName] = useState('');
  const me = players[myId];
  const joined = !!me;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onJoin(name.trim());
    }
  };

  const playersList = Object.values(players);

  return (
    <div className="lobby-container">
      <div className="lobby-panel glass-panel">
        <h1>FVG Yard</h1>
        <p className="subtitle">L'inseguimento in Friuli-Venezia Giulia</p>
        
        {!joined ? (
          <form onSubmit={handleSubmit} className="join-form">
            <input 
              type="text" 
              placeholder="Il tuo nome..." 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              maxLength={15}
            />
            <button type="submit" className="btn" disabled={!myId}>
              {myId ? "Entra nella Lobby" : "Connessione in corso..."}
            </button>
          </form>
        ) : (
          <div className="lobby-actions">
            <h2>Benvenuto, {me.name}</h2>
            
            <div className="role-selection">
              <p>Il tuo ruolo: <strong>{me.role === 'fugitive' ? 'Fuggitivo' : 'Detective'}</strong></p>
              {me.role !== 'fugitive' && (
                <button className="btn role-btn" onClick={() => onSetRole('fugitive')}>
                  Diventa il Fuggitivo
                </button>
              )}
            </div>

            <div className="players-list">
              <h3>Giocatori ({playersList.length}/10)</h3>
              <ul>
                {playersList.map(p => (
                  <li key={p.id} className={p.id === myId ? 'me' : ''}>
                    {p.name} <span className={`badge ${p.role}`}>{p.role === 'fugitive' ? 'Fuggitivo' : 'Detective'}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button 
              className="btn start-btn" 
              onClick={onStart}
              disabled={playersList.length < 2 || !playersList.some(p => p.role === 'fugitive')}
            >
              Inizia la Partita
            </button>
            {playersList.length < 2 && <small className="warn">Servono almeno 2 giocatori.</small>}
          </div>
        )}
      </div>
    </div>
  );
}

export default Lobby;
