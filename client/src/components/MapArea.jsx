import React, { useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import './MapArea.css';

function MapArea({ mapData, players, myPlayer, isMyTurn, onMove }) {
  const [selectedTransport, setSelectedTransport] = useState('car');
  
  const handleNodeClick = (nodeId) => {
    if (!isMyTurn || !myPlayer) return;
    
    // Check if there is a valid link of the selected transport type
    const validLink = mapData.links.some(l => 
      ((l.source === myPlayer.location && l.target === nodeId) || 
       (l.source === nodeId && l.target === myPlayer.location)) && 
      l.type === selectedTransport
    );
    
    if (validLink) {
      onMove(nodeId, selectedTransport);
    }
  };

  const getTransportColor = (type) => {
    switch(type) {
      case 'car': return 'var(--route-car)';
      case 'train': return 'var(--route-train)';
      case 'plane': return 'var(--route-plane)';
      default: return '#fff';
    }
  };

  const playersList = Object.values(players);

  return (
    <div className="map-area">
      <div className="transport-selector glass-panel">
        <label>
          <input 
            type="radio" 
            value="car" 
            checked={selectedTransport === 'car'} 
            onChange={(e) => setSelectedTransport(e.target.value)} 
          /> Auto
        </label>
        <label>
          <input 
            type="radio" 
            value="train" 
            checked={selectedTransport === 'train'} 
            onChange={(e) => setSelectedTransport(e.target.value)} 
          /> Treno
        </label>
        <label>
          <input 
            type="radio" 
            value="plane" 
            checked={selectedTransport === 'plane'} 
            onChange={(e) => setSelectedTransport(e.target.value)} 
          /> Aereo
        </label>
      </div>

      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={4}
        centerOnInit={true}
        wheel={{ step: 0.1 }}
      >
        <TransformComponent wrapperClass="map-wrapper" contentClass="map-content">
          <div className="map-background">
             <img src="/map_bg.png" alt="FVG Map" />
          </div>
          
          <svg className="map-svg" viewBox="0 0 1000 1000">
            {/* Draw links */}
            {mapData.links.map((link, i) => {
              const sourceNode = mapData.nodes.find(n => n.id === link.source);
              const targetNode = mapData.nodes.find(n => n.id === link.target);
              if (!sourceNode || !targetNode) return null;
              
              // Calculate slight offset based on transport type to avoid overlapping lines completely
              let offset = 0;
              if (link.type === 'train') offset = 4;
              if (link.type === 'plane') offset = -4;

              const dx = targetNode.x - sourceNode.x;
              const dy = targetNode.y - sourceNode.y;
              const length = Math.sqrt(dx*dx + dy*dy);
              const nx = -dy / length;
              const ny = dx / length;

              return (
                <line 
                  key={`link-${i}`}
                  x1={sourceNode.x + nx * offset}
                  y1={sourceNode.y + ny * offset}
                  x2={targetNode.x + nx * offset}
                  y2={targetNode.y + ny * offset}
                  stroke={getTransportColor(link.type)}
                  strokeWidth="6"
                  strokeDasharray={link.type === 'train' ? '10, 5' : link.type === 'plane' ? '1, 15' : 'none'}
                  strokeLinecap="round"
                  opacity={0.7}
                />
              );
            })}

            {/* Draw nodes */}
            {mapData.nodes.map(node => {
              // Highlight node if it's a valid move for current transport
              const isReachable = isMyTurn && myPlayer && mapData.links.some(l => 
                ((l.source === myPlayer.location && l.target === node.id) || 
                 (l.source === node.id && l.target === myPlayer.location)) && 
                l.type === selectedTransport
              );

              return (
                <g 
                  key={`node-${node.id}`} 
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={() => handleNodeClick(node.id)}
                  style={{ cursor: isReachable ? 'pointer' : 'default' }}
                >
                  <circle 
                    r={isReachable ? 18 : 12} 
                    fill="var(--node-color)" 
                    stroke={isReachable ? getTransportColor(selectedTransport) : "var(--node-border)"} 
                    strokeWidth={isReachable ? 4 : 2}
                  />
                  <text 
                    y="25" 
                    textAnchor="middle" 
                    fill="var(--text-primary)"
                    fontSize="16"
                    fontWeight="bold"
                    style={{ textShadow: "0 0 5px var(--panel-bg)" }}
                  >
                    {node.name}
                  </text>
                </g>
              );
            })}

            {/* Draw players */}
            {playersList.map((p, i) => {
              const node = mapData.nodes.find(n => n.id === p.location);
              if (!node) return null;
              
              const isMe = myPlayer && p.id === myPlayer.id;
              // Add slight offset if multiple players on same node
              const offsetAngle = (i * Math.PI * 2) / playersList.length;
              const r = playersList.filter(pl => pl.location === p.location).length > 1 ? 15 : 0;
              const px = node.x + Math.cos(offsetAngle) * r;
              const py = node.y + Math.sin(offsetAngle) * r;

              return (
                <g key={`player-${p.id}`} transform={`translate(${px}, ${py})`} style={{ transition: 'all 0.5s ease-out' }}>
                  <circle 
                    r="10" 
                    fill={p.role === 'fugitive' ? 'var(--ticket-black)' : 'var(--primary-color)'} 
                    stroke="#fff" 
                    strokeWidth="2"
                  />
                  <text y="-15" textAnchor="middle" fill="var(--text-primary)" fontSize="12" fontWeight="bold" style={{ textShadow: "0 0 3px var(--panel-bg)" }}>
                    {p.name}
                  </text>
                  {isMe && (
                    <circle r="14" fill="none" stroke="var(--accent-color)" strokeWidth="2" strokeDasharray="4 2" className="pulse-anim" />
                  )}
                </g>
              );
            })}
          </svg>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}

export default MapArea;
