import React, { useState } from 'react';

function FugitiveControls({ onMove, mapData, specialTickets }) {
  const [inputValue, setInputValue] = useState('');
  const [selectedTransport, setSelectedTransport] = useState('car');
  const [isDouble, setIsDouble] = useState(false);
  const [isSecret, setIsSecret] = useState(false);

  // Autocomplete matching
  const matchingNodes = mapData.nodes
    .map((n, i) => ({ ...n, num: i + 1 }))
    .filter(n => n.id.toLowerCase().includes(inputValue.toLowerCase()) || n.num.toString() === inputValue)
    .slice(0, 5);

  const handleMove = (nodeId) => {
    if (!nodeId) return;
    onMove(nodeId, selectedTransport, isDouble, isSecret);
    setInputValue('');
    setIsDouble(false);
    setIsSecret(false);
  };

  const getTransportColor = (type) => {
    switch(type) {
      case 'car': return '#facc15'; 
      case 'train': return '#ef4444'; 
      case 'plane': return '#a855f7'; 
      default: return '#fff';
    }
  };

  return (
    <div className="glass-panel" style={{
      position: 'absolute',
      bottom: '20px',
      left: '300px',
      zIndex: 20,
      padding: '15px',
      borderRadius: '12px',
      backgroundColor: 'var(--panel-bg)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      width: '280px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}>
      <h3 style={{ margin: 0, fontSize: '16px', color: '#1e293b' }}>Pannello Fuggitivo</h3>
      
      <div style={{ display: 'flex', gap: '5px' }}>
        <button 
          onClick={() => setSelectedTransport('car')}
          style={{ flex: 1, padding: '5px', borderRadius: '5px', border: `2px solid ${getTransportColor('car')}`, background: selectedTransport === 'car' ? getTransportColor('car') : 'transparent', color: selectedTransport === 'car' ? 'white' : 'black', fontWeight: 'bold', cursor: 'pointer' }}
        >🚗 Auto</button>
        <button 
          onClick={() => setSelectedTransport('train')}
          style={{ flex: 1, padding: '5px', borderRadius: '5px', border: `2px solid ${getTransportColor('train')}`, background: selectedTransport === 'train' ? getTransportColor('train') : 'transparent', color: selectedTransport === 'train' ? 'white' : 'black', fontWeight: 'bold', cursor: 'pointer' }}
        >🚂 Treno</button>
        <button 
          onClick={() => setSelectedTransport('plane')}
          style={{ flex: 1, padding: '5px', borderRadius: '5px', border: `2px solid ${getTransportColor('plane')}`, background: selectedTransport === 'plane' ? getTransportColor('plane') : 'transparent', color: selectedTransport === 'plane' ? 'white' : 'black', fontWeight: 'bold', cursor: 'pointer' }}
        >✈️ Aereo</button>
      </div>

      <div style={{ display: 'flex', gap: '5px' }}>
        <button 
          onClick={() => setIsDouble(!isDouble)}
          disabled={specialTickets.double <= 0}
          style={{ flex: 1, padding: '5px', borderRadius: '5px', border: '2px solid #8b5cf6', background: isDouble ? '#8b5cf6' : 'transparent', color: isDouble ? 'white' : 'black', fontWeight: 'bold', cursor: specialTickets.double > 0 ? 'pointer' : 'not-allowed', opacity: specialTickets.double > 0 ? 1 : 0.5 }}
        >
          2x Move ({specialTickets.double})
        </button>
        <button 
          onClick={() => setIsSecret(!isSecret)}
          disabled={specialTickets.secret <= 0}
          style={{ flex: 1, padding: '5px', borderRadius: '5px', border: '2px solid #1f2937', background: isSecret ? '#1f2937' : 'transparent', color: isSecret ? 'white' : 'black', fontWeight: 'bold', cursor: specialTickets.secret > 0 ? 'pointer' : 'not-allowed', opacity: specialTickets.secret > 0 ? 1 : 0.5 }}
        >
          ⬛ Segreto ({specialTickets.secret})
        </button>
      </div>

      <div style={{ position: 'relative' }}>
        <input 
          type="text" 
          placeholder="Digita il paese o numero..." 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }}
        />
        
        {inputValue.length > 0 && (
          <ul style={{ position: 'absolute', bottom: '100%', left: 0, width: '100%', background: 'white', border: '1px solid #ccc', borderRadius: '8px', listStyle: 'none', padding: 0, margin: '0 0 5px 0', maxHeight: '150px', overflowY: 'auto', boxShadow: '0 -4px 10px rgba(0,0,0,0.1)' }}>
            {matchingNodes.length > 0 ? matchingNodes.map(n => (
              <li 
                key={n.id} 
                onClick={() => handleMove(n.id)}
                style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Vai a <strong>{n.num}. {n.id}</strong>
              </li>
            )) : <li style={{ padding: '10px', color: '#999' }}>Nessun paese trovato</li>}
          </ul>
        )}
      </div>
    </div>
  );
}

export default FugitiveControls;
