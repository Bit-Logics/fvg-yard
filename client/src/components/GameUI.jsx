import React from 'react';
import { Flag } from 'lucide-react';
import './GameUI.css';

function GameUI({ myPlayer, timeLeft, isMyTurn, currentPlayer, selectedMap, endGameVotes, onVoteEndGame, gameState, onResetLobby, totalPlayers }) {
  if (!myPlayer) return null;

  const isPorpetto = selectedMap === 'porpetto';
  const getTicketName = (type) => {
    if (isPorpetto) {
      if (type === 'car') return '🚶 Piedi';
      if (type === 'train') return '🚲 Bici';
      if (type === 'plane') return '🛵 Motorino';
      if (type === 'ferry') return '🛶 Barca';
    } else {
      if (type === 'car') return '🚗 Auto';
      if (type === 'train') return '🚂 Treno';
      if (type === 'plane') return '✈️ Aereo';
      if (type === 'ferry') return '🚢 Traghetto';
    }
    return type;
  };

  return (
    <div className="game-ui-overlay">
      <div className="top-bar glass-panel" style={{ display: 'flex', gap: '20px', alignItems: 'center', padding: '10px 30px', alignSelf: 'center' }}>
        
        {/* Left: Player Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: myPlayer.color !== '#111' ? myPlayer.color : 'var(--text-primary)' }} />
          <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: myPlayer.color !== '#111' ? myPlayer.color : 'var(--text-primary)', whiteSpace: 'nowrap' }}>
            {myPlayer.name} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{myPlayer.role === 'fugitive' ? '(Mister X)' : '(Detective)'}</span>
          </div>
        </div>

        {/* Center: Turn Info & Timer */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', borderLeft: '1px solid var(--panel-border)', borderRight: '1px solid var(--panel-border)', padding: '0 20px' }}>
          <div className="turn-info" style={{ whiteSpace: 'nowrap' }}>
            {isMyTurn ? (
              <span className="my-turn">È il tuo turno!</span>
            ) : (
              <span>Turno di: <strong>{currentPlayer?.name}</strong></span>
            )}
          </div>
          <div className={`timer ${timeLeft <= 10 ? 'danger' : ''}`}>
            {timeLeft}s
          </div>
        </div>

        {/* Right: Position & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>POSIZIONE:</div>
          <div style={{ fontWeight: 'bold', fontSize: '1.1rem', whiteSpace: 'nowrap' }}>{myPlayer.location || 'Nascosta'}</div>
          
          <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--panel-border)', margin: '0 5px' }} />
          
          {gameState === 'playing' ? (
            <button 
              onClick={onVoteEndGame}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '5px', 
                backgroundColor: endGameVotes && endGameVotes[myPlayer.id] ? 'var(--danger-color)' : 'transparent',
                color: endGameVotes && endGameVotes[myPlayer.id] ? 'white' : 'var(--danger-color)',
                border: '1px solid var(--danger-color)',
                padding: '4px 10px', borderRadius: '4px', cursor: 'pointer'
              }}
              title="Vota per terminare la partita in anticipo"
            >
              <Flag size={16} />
              <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Resa</span>
              {endGameVotes && Object.keys(endGameVotes).length > 0 && (
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                  ({Object.keys(endGameVotes).length}/{totalPlayers})
                </span>
              )}
            </button>
          ) : gameState === 'finished' ? (
            <button 
              onClick={onResetLobby}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '5px', 
                backgroundColor: 'var(--primary-color)',
                color: 'white',
                border: 'none',
                padding: '4px 12px', borderRadius: '4px', cursor: 'pointer'
              }}
            >
              <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Torna alla Lobby</span>
            </button>
          ) : null}
        </div>

      </div>

      <div className="side-panel glass-panel">

        <h3>I tuoi Biglietti</h3>
        <ul className="tickets-list">
          <li className="ticket-item car">
            <span>{getTicketName('car')}:</span>
            <strong>{myPlayer.tickets.car}</strong>
          </li>
          <li className="ticket-item train">
            <span>{getTicketName('train')}:</span>
            <strong>{myPlayer.tickets.train}</strong>
          </li>
          <li className="ticket-item plane">
            <span>{getTicketName('plane')}:</span>
            <strong>{myPlayer.tickets.plane}</strong>
          </li>
          {selectedMap === 'italy' && (
            <li className="ticket-item ferry" style={{ color: '#3b82f6' }}>
              <span>{getTicketName('ferry')}:</span>
              <strong>{myPlayer.tickets.ferry}</strong>
            </li>
          )}
          {myPlayer.role === 'fugitive' && (
            <li className="ticket-item black">
              <span>Black:</span>
              <strong>{myPlayer.tickets.black}</strong>
            </li>
          )}
        </ul>
        
        <div className="history">
          <h4>Storico Mosse</h4>
          <ul>
            {myPlayer.history.slice(-5).map((h, i) => (
              <li key={i}>{h.type} a {h.to}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default GameUI;
