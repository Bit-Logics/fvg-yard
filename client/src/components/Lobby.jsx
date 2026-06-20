import React, { useState } from 'react';
import './Lobby.css';

const AVAILABLE_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e'];

const PawnSVG = ({ color, isFugitive }) => (
  <svg width="80" height="100" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0px 10px 10px rgba(0,0,0,0.4))', transition: 'all 0.3s ease' }}>
    <ellipse cx="12" cy="30" rx="10" ry="2" fill="rgba(0,0,0,0.6)"/>
    <path d="M12 2 C8 2 8 8 12 10 C16 12 18 20 20 28 C20 30 18 30 12 30 C6 30 4 30 4 28 C6 20 8 12 12 10 C16 8 16 2 12 2 Z" fill={isFugitive ? '#111' : color} stroke={isFugitive ? "#ff0000" : "white"} strokeWidth="1"/>
    <path d="M10 4 C8 4 8 7 10 8 C12 9 13 15 14 22" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
  </svg>
);

function Lobby({ players, onJoin, onStart, myId, onSetRole }) {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#3b82f6');
  const me = players[myId];
  const joined = !!me;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onJoin({ name: name.trim(), color: selectedColor });
    }
  };

  const playersList = Object.values(players);
  const takenColors = playersList.map(p => p.color);

  return (
    <div className="lobby-container">
      <div className="lobby-panel glass-panel" style={{ minWidth: '400px' }}>
        <h1 style={{ marginBottom: 0 }}>FVG Yard</h1>
        <p className="subtitle" style={{ marginTop: '5px' }}>L'inseguimento in Friuli-Venezia Giulia</p>
        
        {!joined ? (
          <form onSubmit={handleSubmit} className="join-form" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            
            <div style={{ position: 'relative', marginBottom: '20px', marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
               <div style={{
                  padding: '4px 12px',
                  backgroundColor: selectedColor,
                  color: 'white',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  border: '2px solid white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                  marginBottom: '10px',
                  transition: 'background-color 0.3s ease'
                }}>
                  {name || "Il tuo nome"}
                </div>
               <PawnSVG color={selectedColor} isFugitive={false} />
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {AVAILABLE_COLORS.map(c => {
                const isTaken = takenColors.includes(c);
                return (
                  <div 
                    key={c}
                    onClick={() => !isTaken && setSelectedColor(c)}
                    style={{
                      width: '30px', height: '30px', borderRadius: '50%',
                      backgroundColor: isTaken ? '#94a3b8' : c,
                      border: selectedColor === c ? '3px solid #1e293b' : '2px solid white',
                      cursor: isTaken ? 'not-allowed' : 'pointer',
                      opacity: isTaken ? 0.3 : 1,
                      transform: selectedColor === c ? 'scale(1.2)' : 'scale(1)',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                    title={isTaken ? 'Colore già in uso' : 'Scegli colore'}
                  />
                );
              })}
            </div>

            <input 
              type="text" 
              placeholder="Inserisci il tuo nome..." 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              maxLength={15}
              style={{ width: '100%', marginBottom: '15px' }}
            />
            <button type="submit" className="btn" disabled={!myId || !name.trim()}>
              {myId ? "Entra nella Lobby" : "Connessione in corso..."}
            </button>
          </form>
        ) : (
          <div className="lobby-actions">
            <h2>Benvenuto, {me.name}</h2>
            
            <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
               <PawnSVG color={me.color} isFugitive={me.role === 'fugitive'} />
            </div>

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
              <ul style={{ padding: 0 }}>
                {playersList.map(p => (
                  <li key={p.id} className={p.id === myId ? 'me' : ''} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: p.role === 'fugitive' ? '#111' : p.color }} />
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
