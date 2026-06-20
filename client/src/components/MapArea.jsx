import React, { useState, useMemo } from 'react';
import Map, { Marker, Source, Layer, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import './MapArea.css';

const FVG_BOUNDS = [
  [12.1, 45.5], // Southwest coordinates
  [14.2, 46.7]  // Northeast coordinates
];

// Pawn SVG component
const PawnSVG = ({ color, isFugitive }) => (
  <svg width="40" height="50" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0px 8px 8px rgba(0,0,0,0.4))' }}>
    <ellipse cx="50" cy="112" rx="40" ry="6" fill="rgba(0,0,0,0.6)" />
    <g fill={isFugitive ? '#1a1a1a' : color} stroke="rgba(255,255,255,0.3)" strokeWidth="2">
      <circle cx="50" cy="25" r="20" />
      <rect x="30" y="45" width="40" height="8" rx="4" />
      <path d="M 40 50 C 40 80, 20 100, 15 105 C 15 110, 20 110, 50 110 C 80 110, 85 110, 85 105 C 80 100, 60 80, 60 50 Z" />
    </g>
    <path d="M 40 13 A 12 12 0 0 1 50 7" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
    <path d="M 32 60 C 27 80, 25 95, 25 100" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
  </svg>
);

const OSM_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap Contributors'
    }
  },
  layers: [
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
      minzoom: 0,
      maxzoom: 19
    }
  ]
};

function MapArea({ mapData, players, myPlayer, isMyTurn, onMove }) {
  const [selectedTransport, setSelectedTransport] = useState('car');
  const [viewState, setViewState] = useState({
    longitude: 13.1,
    latitude: 46.0,
    zoom: 8.5,
    pitch: 0,
    bearing: 0
  });

  const handleNodeClick = (nodeId) => {
    if (!isMyTurn || !myPlayer) return;
    
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
      case 'car': return '#0ea5e9'; 
      case 'train': return '#f59e0b'; 
      case 'plane': return '#ef4444'; 
      default: return '#fff';
    }
  };

  const { carGeojson, trainGeojson, planeGeojson } = useMemo(() => {
    const buildCollection = (type) => {
      const features = mapData.links
        .filter(l => l.type === type)
        .map(l => {
          const sourceNode = mapData.nodes.find(n => n.id === l.source);
          const targetNode = mapData.nodes.find(n => n.id === l.target);
          if (!sourceNode || !targetNode) return null;
          
          // Use real geometry if available, else fallback to straight line
          let coordinates = [];
          if (l.geometry && l.geometry.length > 0) {
            coordinates = l.geometry;
          } else {
            coordinates = [
              [sourceNode.lng, sourceNode.lat],
              [targetNode.lng, targetNode.lat]
            ];
          }

          return {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: coordinates
            }
          };
        }).filter(Boolean);
      return { type: 'FeatureCollection', features };
    };
    return {
      carGeojson: buildCollection('car'),
      trainGeojson: buildCollection('train'),
      planeGeojson: buildCollection('plane')
    };
  }, [mapData]);

  const playersList = Object.values(players);

  return (
    <div className="map-area" style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* UI for transport selection */}
      <div 
        className="glass-panel" 
        style={{ 
          zIndex: 10, 
          position: 'absolute', 
          top: '20px', 
          left: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          padding: '10px',
          borderRadius: '12px',
          backgroundColor: 'var(--panel-bg)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}
      >
        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155', textAlign: 'center', marginBottom: '4px' }}>
          MEZZO
        </div>
        
        {/* Car Button */}
        <button 
          onClick={() => setSelectedTransport('car')}
          style={{
            background: selectedTransport === 'car' ? getTransportColor('car') : 'transparent',
            color: selectedTransport === 'car' ? 'white' : '#334155',
            border: `2px solid ${getTransportColor('car')}`,
            padding: '6px 12px',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontSize: '14px'
          }}
        >
          🚗 Auto
        </button>

        {/* Train Button */}
        <button 
          onClick={() => setSelectedTransport('train')}
          style={{
            background: selectedTransport === 'train' ? getTransportColor('train') : 'transparent',
            color: selectedTransport === 'train' ? 'white' : '#334155',
            border: `2px solid ${getTransportColor('train')}`,
            padding: '6px 12px',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontSize: '14px'
          }}
        >
          🚂 Treno
        </button>

        {/* Plane Button */}
        <button 
          onClick={() => setSelectedTransport('plane')}
          style={{
            background: selectedTransport === 'plane' ? getTransportColor('plane') : 'transparent',
            color: selectedTransport === 'plane' ? 'white' : '#334155',
            border: `2px solid ${getTransportColor('plane')}`,
            padding: '6px 12px',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontSize: '14px'
          }}
        >
          ✈️ Aereo
        </button>
      </div>

      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle={OSM_STYLE}
        style={{ width: '100%', height: '100%' }}
        maxPitch={60}
        maxBounds={FVG_BOUNDS}
        minZoom={7}
      >
        <NavigationControl position="bottom-right" />

        {/* Car Links Layer */}
        <Source id="car-routes" type="geojson" data={carGeojson}>
          <Layer 
            id="car-lines" 
            type="line" 
            paint={{
              'line-color': getTransportColor('car'),
              'line-width': 6,
              'line-opacity': 0.8
            }} 
          />
        </Source>

        {/* Train Links Layer - Offset to avoid overlapping car routes */}
        <Source id="train-routes" type="geojson" data={trainGeojson}>
          <Layer 
            id="train-lines" 
            type="line" 
            paint={{
              'line-color': getTransportColor('train'),
              'line-width': 6,
              'line-opacity': 0.9,
              'line-dasharray': [2, 2],
              'line-offset': 8
            }} 
          />
        </Source>

        {/* Plane Links Layer - Offset in the opposite direction */}
        <Source id="plane-routes" type="geojson" data={planeGeojson}>
          <Layer 
            id="plane-lines" 
            type="line" 
            paint={{
              'line-color': getTransportColor('plane'),
              'line-width': 5,
              'line-opacity': 0.8,
              'line-dasharray': [1, 4],
              'line-offset': -8
            }} 
          />
        </Source>

        {/* Draw Nodes */}
        {mapData.nodes.map(node => {
          const isReachable = isMyTurn && myPlayer && mapData.links.some(l => 
            ((l.source === myPlayer.location && l.target === node.id) || 
             (l.source === node.id && l.target === myPlayer.location)) && 
            l.type === selectedTransport
          );

          return (
            <Marker 
              key={`node-${node.id}`} 
              longitude={node.lng} 
              latitude={node.lat} 
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                handleNodeClick(node.id);
              }}
            >
              <div 
                className="node-marker" 
                style={{
                  cursor: isReachable ? 'pointer' : 'default',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  transform: isReachable ? 'scale(1.2)' : 'scale(1)',
                  transition: 'transform 0.2s'
                }}
              >
                <div style={{
                  width: isReachable ? 24 : 16,
                  height: isReachable ? 24 : 16,
                  backgroundColor: 'white',
                  border: `3px solid ${isReachable ? getTransportColor(selectedTransport) : '#334155'}`,
                  borderRadius: '50%',
                  boxShadow: isReachable ? `0 0 10px ${getTransportColor(selectedTransport)}` : '0 2px 4px rgba(0,0,0,0.3)'
                }}></div>
                <div style={{
                  marginTop: 4,
                  color: '#1e293b',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  textShadow: '2px 2px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff',
                  pointerEvents: 'none'
                }}>
                  {node.id}
                </div>
              </div>
            </Marker>
          );
        })}

        {/* Draw Players */}
        {playersList.map((p, i) => {
          if (!p.location) return null; // Hide if location is masked by server!
          const node = mapData.nodes.find(n => n.id === p.location);
          if (!node) return null;
          
          const isMe = myPlayer && p.id === myPlayer.id;
          const numOnSameNode = playersList.filter(pl => pl.location === p.location).length;
          const offset = numOnSameNode > 1 ? (i * 0.01) : 0; 

          return (
            <Marker 
              key={`player-${p.id}`} 
              longitude={node.lng + offset} 
              latitude={node.lat + offset} 
              anchor="bottom"
              style={{ transition: 'none', zIndex: 100 }} 
            >
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  padding: '2px 8px',
                  backgroundColor: 'white',
                  color: '#1e293b',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  border: '1px solid #ccc',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  marginBottom: '2px'
                }}>
                  {p.name}
                </div>
                
                {/* 3D Pawn Shape */}
                <PawnSVG 
                  color={p.role === 'fugitive' ? '#111' : p.color} 
                  isFugitive={p.role === 'fugitive'}
                />
                
                {isMe && (
                  <div className="pulse-anim" style={{
                    position: 'absolute',
                    bottom: 0,
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    border: '3px dashed var(--accent-color)'
                  }}></div>
                )}
              </div>
            </Marker>
          );
        })}
      </Map>
    </div>
  );
}

export default MapArea;
