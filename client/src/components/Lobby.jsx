import React, { useState } from 'react';
import './Lobby.css';
import SoundEngine from '../utils/SoundEngine';

const AVAILABLE_COLORS = [
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#10b981', // Emerald
  '#f59e0b', // Orange
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#eab308', // Yellow
  '#6366f1', // Indigo
  '#84cc16'  // Lime
];

const PawnSVG = ({ color, isFugitive }) => (
  <svg width="80" height="100" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0px 10px 10px rgba(0,0,0,0.4))', transition: 'all 0.3s ease' }}>
    <ellipse cx="50" cy="112" rx="40" ry="6" fill="rgba(0,0,0,0.6)" />
    <g fill={isFugitive ? '#1a1a1a' : color} stroke="rgba(255,255,255,0.3)" strokeWidth="2">
      <circle cx="50" cy="25" r="20" />
      <rect x="30" y="45" width="40" height="8" rx="4" />
      <path d="M 40 50 C 40 80, 20 100, 15 105 C 15 110, 20 110, 50 110 C 80 110, 85 110, 85 105 C 80 100, 60 80, 60 50 Z" />
    </g>
  </svg>
);

function Lobby({ players, onJoin, onStart, myId, onSetRole, onDraw, isGameInProgress, lobbies, currentLobbyId, onSwitchLobby, votes, onVoteMap }) {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#3b82f6');
  const me = players[myId];
  const joined = !!me;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      SoundEngine.playJoin();
      onJoin({ name: name.trim(), color: selectedColor });
    }
  };

  const handleVote = (mapId) => {
    SoundEngine.playClick();
    onVoteMap(mapId);
  };

  const playersList = Object.values(players);
  const takenColors = playersList.map(p => p.color);

  return (
    <div className="lobby-container">
      <div className="lobby-panel glass-panel" style={{ minWidth: '400px', display: 'flex', flexDirection: 'column' }}>
        
        {/* Lobby Selector Tabs */}
        {lobbies && lobbies.length > 0 && (
          <div style={{ display: 'flex', gap: '5px', marginBottom: '15px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '10px' }}>
            {lobbies.map(l => (
              <button
                key={l.id}
                onClick={() => onSwitchLobby(l.id)}
                style={{
                  flex: 1,
                  padding: '8px 4px',
                  backgroundColor: l.id === currentLobbyId ? 'var(--primary-color)' : 'transparent',
                  color: l.id === currentLobbyId ? 'white' : 'var(--text-primary)',
                  border: '1px solid var(--panel-border)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.8rem',
                  transition: 'all 0.2s',
                  boxShadow: l.id === currentLobbyId ? 'inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <div>{l.name}</div>
                <div style={{ fontSize: '0.7rem', fontWeight: 'normal', opacity: 0.9 }}>
                  {l.playerCount}/10 {l.gameState === 'playing' ? '▶️' : '⏳'}
                </div>
              </button>
            ))}
          </div>
        )}

        <h1 style={{ marginBottom: 0 }}>FVG Yard</h1>
        <p className="subtitle" style={{ marginTop: '5px' }}>L'inseguimento senza confini</p>
        
        {!joined && isGameInProgress ? (
          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <h2 style={{ color: 'var(--primary-color)' }}>Partita in corso...</h2>
            <p style={{ marginTop: '10px', color: 'var(--text-secondary)' }}>Sei in modalità Spettatore. Attendi la fine della partita per poterti unire.</p>
            <div className="players-list" style={{ marginTop: '30px', textAlign: 'left' }}>
              <h3>Giocatori in partita ({playersList.length})</h3>
              <ul style={{ padding: 0 }}>
                {playersList.map(p => (
                  <li key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: p.role === 'fugitive' ? '#111' : p.color }} />
                    <span style={{ flex: 1 }}>{p.name} <span className={`badge ${p.role}`}>{p.role === 'fugitive' ? 'Fuggitivo' : 'Detective'}</span></span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : !joined ? (
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

            {/* Voting Section */}
            <div className="map-voting" style={{ margin: '20px 0', padding: '15px', backgroundColor: 'var(--bg-accent)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', textAlign: 'center' }}>Vota la Mappa</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => handleVote('friuli')}
                  style={{ 
                    flex: 1, padding: '10px', borderRadius: '6px', 
                    border: (votes && votes[myId] === 'friuli') || (!votes || !votes[myId]) ? '2px solid var(--primary-color)' : '1px solid var(--border-light)', 
                    backgroundColor: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', transition: 'all 0.2s' 
                  }}
                >
                  <div>Friuli-VG</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: '5px', color: 'var(--primary-color)' }}>
                    {Object.values(votes || {}).filter(v => v !== 'italy' && v !== 'porpetto').length + (playersList.length - Object.values(votes || {}).length)}
                  </div>
                </button>
                <button 
                  onClick={() => handleVote('italy')}
                  style={{ 
                    flex: 1, padding: '10px', borderRadius: '6px', 
                    border: votes && votes[myId] === 'italy' ? '2px solid var(--primary-color)' : '1px solid var(--border-light)', 
                    backgroundColor: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', transition: 'all 0.2s' 
                  }}
                >
                  <div>Italia Intera</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: '5px', color: 'var(--primary-color)' }}>
                    {Object.values(votes || {}).filter(v => v === 'italy').length}
                  </div>
                </button>
                <button 
                  onClick={() => handleVote('porpetto')}
                  style={{ 
                    flex: 1, padding: '10px', borderRadius: '6px', 
                    border: votes && votes[myId] === 'porpetto' ? '2px solid var(--primary-color)' : '1px solid var(--border-light)', 
                    backgroundColor: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', transition: 'all 0.2s' 
                  }}
                >
                  <div>Porpetto</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: '5px', color: 'var(--primary-color)' }}>
                    {Object.values(votes || {}).filter(v => v === 'porpetto').length}
                  </div>
                </button>
              </div>
            </div>

            <div className="players-list">
              <h3>Giocatori ({playersList.length}/10)</h3>
              <ul style={{ padding: 0 }}>
                {playersList.map(p => (
                  <li key={p.id} className={p.id === myId ? 'me' : ''} style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: p.role === 'fugitive' ? '#111' : p.color }} />
                    <span style={{ flex: 1 }}>{p.name} <span className={`badge ${p.role}`}>{p.role === 'fugitive' ? 'Fuggitivo' : 'Detective'}</span></span>
                    
                    {/* Card display */}
                    {p.hasDrawn ? (
                      <div style={{
                        padding: '4px 10px', 
                        backgroundColor: '#fef3c7', 
                        border: '1px dashed #b45309', 
                        borderRadius: '4px',
                        color: '#b45309',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        🎫 {p.role === 'fugitive' && p.id !== myId ? '???' : p.location}
                      </div>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>In attesa di pescare...</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
              {!me.hasDrawn ? (
                <button 
                  className="btn" 
                  style={{ width: '100%' }}
                  onClick={onDraw}
                >
                  Pesca Biglietto di Partenza
                </button>
              ) : (
                <>
                  <button 
                    className="btn start-btn" 
                    onClick={onStart}
                    disabled={playersList.length < 2 || !playersList.some(p => p.role === 'fugitive') || !playersList.every(p => p.hasDrawn)}
                    style={{ width: '100%' }}
                  >
                    Inizia la Partita
                  </button>
                  {playersList.length < 2 && <small className="warn" style={{ textAlign: 'center' }}>Servono almeno 2 giocatori.</small>}
                  {!playersList.every(p => p.hasDrawn) && <small className="warn" style={{ textAlign: 'center' }}>In attesa che tutti i giocatori peschino...</small>}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Lobby;
