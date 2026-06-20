import React from 'react';

const REVEAL_TURNS = [3, 8, 13, 18, 24];

function FugitiveLog({ history = [], isFugitive }) {
  // We need 24 rows
  const rows = Array.from({ length: 24 }).map((_, i) => {
    const turn = i + 1;
    const isReveal = REVEAL_TURNS.includes(turn);
    const move = history[i];

    return {
      turn,
      isReveal,
      move
    };
  });

  const getEmoji = (type) => {
    if (type === 'car') return '🚗';
    if (type === 'train') return '🚂';
    if (type === 'plane') return '✈️';
    if (type === 'secret') return '⬛';
    return '';
  };

  return (
    <div className="glass-panel" style={{
      position: 'absolute',
      bottom: '20px',
      left: '20px', // We'll move FugitiveControls slightly to the right in App.jsx
      zIndex: 20,
      padding: '10px',
      borderRadius: '12px',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      width: '260px',
      maxHeight: '400px',
      display: 'flex',
      flexDirection: 'column',
      pointerEvents: 'auto'
    }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#1e293b', textAlign: 'center' }}>
        Registro Mister X
      </h3>
      
      <div style={{ overflowY: 'auto', flex: 1, paddingRight: '5px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr>
              <th style={{ padding: '4px', borderBottom: '2px solid #ccc', textAlign: 'left' }}>#</th>
              <th style={{ padding: '4px', borderBottom: '2px solid #ccc', textAlign: 'center' }}>Mezzo</th>
              <th style={{ padding: '4px', borderBottom: '2px solid #ccc', textAlign: 'right' }}>Luogo</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.turn} style={{ 
                backgroundColor: row.isReveal ? '#fef3c7' : 'transparent',
                borderBottom: '1px solid #eee'
              }}>
                <td style={{ padding: '4px 2px', fontWeight: row.isReveal ? 'bold' : 'normal', color: '#64748b' }}>
                  {row.turn}
                </td>
                <td style={{ padding: '4px 2px', textAlign: 'center', fontSize: '16px' }}>
                  {row.move ? getEmoji(row.move.displayType) : <span style={{ opacity: 0.2 }}>-</span>}
                </td>
                <td style={{ padding: '4px 2px', textAlign: 'right', fontWeight: 'bold', color: row.isReveal ? '#b45309' : '#334155' }}>
                  {row.move && (isFugitive || row.move.to) ? row.move.to : (row.isReveal ? '?' : '---')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default FugitiveLog;
