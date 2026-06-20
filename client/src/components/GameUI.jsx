import React from 'react';
import './GameUI.css';

function GameUI({ myPlayer, timeLeft, isMyTurn, currentPlayer, selectedMap }) {
  if (!myPlayer) return null;

  const isPorpetto = selectedMap === 'porpetto';
  const getTicketName = (type) => {
    if (isPorpetto) {
      if (type === 'car') return '🚶 Piedi';
      if (type === 'train') return '🚲 Bici';
      if (type === 'plane') return '🛵 Motorino';
    } else {
      if (type === 'car') return '🚗 Auto';
      if (type === 'train') return '🚂 Treno';
      if (type === 'plane') return '✈️ Aereo';
    }
    return type;
  };

  return (
    <div className="game-ui-overlay">
      <div className="top-bar glass-panel">
        <div className="turn-info">
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

      <div className="side-panel glass-panel">
        <div className="player-info" style={{ marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid var(--panel-border)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>GIOCATORE</div>
          <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: myPlayer.color !== '#111' ? myPlayer.color : 'var(--text-primary)' }}>
            {myPlayer.name} {myPlayer.role === 'fugitive' && '(Mister X)'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>POSIZIONE</div>
          <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{myPlayer.location || 'Nascosta'}</div>
        </div>

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
