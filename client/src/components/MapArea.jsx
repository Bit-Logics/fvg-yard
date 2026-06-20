import './MapArea.css';
import React, { useState, useMemo } from 'react';
import Map, { Marker, Source, Layer, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import SoundEngine from '../utils/SoundEngine';

const PORPETTO_BOUNDS = [
  [13.18, 45.83], // SW
  [13.25, 45.88]  // NE
];

const ITALY_BOUNDS = [
  [-10.0, 30.0], // Southwest coordinates (Atlantic/Africa)
  [30.0, 55.0]  // Northeast coordinates (Eastern Europe)
];

const FVG_BOUNDS = [
  [12.1, 45.5], // Southwest coordinates
  [14.2, 46.7]  // Northeast coordinates
];

const PawnSVG = ({ color, isFugitive }) => (
  <svg width="40" height="50" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0px 8px 8px rgba(0,0,0,0.4))' }}>
    <ellipse cx="50" cy="112" rx="40" ry="6" fill="rgba(0,0,0,0.6)" />
    <g fill={isFugitive ? '#1a1a1a' : color} stroke="rgba(255,255,255,0.3)" strokeWidth="2">
      <circle cx="50" cy="25" r="20" />
      <rect x="30" y="45" width="40" height="8" rx="4" />
      <path d="M 40 50 C 40 80, 20 100, 15 105 C 15 110, 20 110, 50 110 C 80 110, 85 110, 85 105 C 80 100, 60 80, 60 50 Z" />
    </g>
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

function MapArea({ mapData, selectedMap, players, myPlayer, isMyTurn, onMove, theme }) {
  const [selectedTransport, setSelectedTransport] = useState('car');
  const [showAllTrajectories, setShowAllTrajectories] = useState(false);
  const [viewState, setViewState] = useState({
    longitude: 13.1,
    latitude: 46.0,
    zoom: 8.5,
    pitch: 0,
    bearing: 0
  });

  const availableTransports = useMemo(() => {
    if (!myPlayer || !myPlayer.location || !mapData || !mapData.links) return ['car', 'train', 'plane', 'ferry'];
    const nodeLinks = mapData.links.filter(l => l.source === myPlayer.location || l.target === myPlayer.location);
    if (nodeLinks.length === 0) return ['car', 'train', 'plane', 'ferry'];
    return Array.from(new Set(nodeLinks.map(l => l.type)));
  }, [mapData, myPlayer]);

  React.useEffect(() => {
    if (availableTransports.length > 0 && !availableTransports.includes(selectedTransport)) {
      setSelectedTransport(availableTransports[0]);
    }
  }, [availableTransports, selectedTransport]);

  React.useEffect(() => {
    if (selectedMap === 'italy') {
      setViewState({
        longitude: 12.5,
        latitude: 41.9,
        zoom: 5.5,
        pitch: 0,
        bearing: 0
      });
    } else if (selectedMap === 'porpetto') {
      setViewState({
        longitude: 13.213,
        latitude: 45.858,
        zoom: 14.5,
        pitch: 0,
        bearing: 0
      });
    } else {
      setViewState({
        longitude: 13.1,
        latitude: 46.0,
        zoom: 8.5,
        pitch: 0,
        bearing: 0
      });
    }
  }, [selectedMap]);

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
      case 'car': return '#facc15';
      case 'train': return '#ef4444';
      case 'plane': return '#a855f7';
      case 'ferry': return '#3b82f6'; // Blue for ferry
      default: return '#fff';
    }
  };

  const { carGeojson, trainGeojson, planeGeojson, ferryGeojson } = useMemo(() => {
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
      planeGeojson: buildCollection('plane'),
      ferryGeojson: buildCollection('ferry')
    };
  }, [mapData]);

  const playersList = Object.values(players);

  return (
    <div className="map-area" style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* UI for transport selection */}
      <div className="glass-panel transport-panel">
        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155', textAlign: 'center', marginBottom: '4px' }}>
          MEZZO
        </div>
        
        {/* Car Button */}
        <button 
          onClick={() => { SoundEngine.playClick(); setSelectedTransport('car'); }}
          style={{
            background: selectedTransport === 'car' ? getTransportColor('car') : 'transparent',
            color: selectedTransport === 'car' ? 'white' : 'var(--text-primary)',
            border: `2px solid ${getTransportColor('car')}`,
            padding: '6px 12px',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: availableTransports.includes('car') ? 'pointer' : 'not-allowed',
            opacity: availableTransports.includes('car') ? 1 : 0.3,
            transition: 'all 0.2s',
            fontSize: '14px'
          }}
          disabled={!availableTransports.includes('car')}
        >
          {selectedMap === 'porpetto' ? '🚶 A Piedi' : '🚗 Auto'}
        </button>

        {/* Train Button */}
        <button 
          onClick={() => { SoundEngine.playClick(); setSelectedTransport('train'); }}
          style={{
            background: selectedTransport === 'train' ? getTransportColor('train') : 'transparent',
            color: selectedTransport === 'train' ? 'white' : 'var(--text-primary)',
            border: `2px solid ${getTransportColor('train')}`,
            padding: '6px 12px',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: availableTransports.includes('train') ? 'pointer' : 'not-allowed',
            opacity: availableTransports.includes('train') ? 1 : 0.3,
            transition: 'all 0.2s',
            fontSize: '14px'
          }}
          disabled={!availableTransports.includes('train')}
        >
          {selectedMap === 'porpetto' ? '🚲 In Bici' : '🚂 Treno'}
        </button>

        {/* Plane Button */}
        <button 
          onClick={() => { SoundEngine.playClick(); setSelectedTransport('plane'); }}
          style={{
            background: selectedTransport === 'plane' ? getTransportColor('plane') : 'transparent',
            color: selectedTransport === 'plane' ? 'white' : 'var(--text-primary)',
            border: `2px solid ${getTransportColor('plane')}`,
            padding: '6px 12px',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: availableTransports.includes('plane') ? 'pointer' : 'not-allowed',
            opacity: availableTransports.includes('plane') ? 1 : 0.3,
            transition: 'all 0.2s',
            fontSize: '14px'
          }}
          disabled={!availableTransports.includes('plane')}
        >
          {selectedMap === 'porpetto' ? '🛵 Motorino' : '✈️ Aereo'}
        </button>

        {/* Ferry Button (Only Italy) */}
        {selectedMap === 'italy' && (
          <button 
            onClick={() => { SoundEngine.playClick(); setSelectedTransport('ferry'); }}
            style={{
              background: selectedTransport === 'ferry' ? getTransportColor('ferry') : 'transparent',
              color: selectedTransport === 'ferry' ? 'white' : 'var(--text-primary)',
              border: `2px solid ${getTransportColor('ferry')}`,
              padding: '6px 12px',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: availableTransports.includes('ferry') ? 'pointer' : 'not-allowed',
              opacity: availableTransports.includes('ferry') ? 1 : 0.3,
              transition: 'all 0.2s',
              fontSize: '14px'
            }}
            disabled={!availableTransports.includes('ferry')}
          >
            🚢 Traghetto
          </button>
        )}

        <div style={{ marginTop: '5px', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '10px' }}>
          <button 
            onClick={() => { SoundEngine.playClick(); setShowAllTrajectories(!showAllTrajectories); }}
            style={{
              background: showAllTrajectories ? '#10b981' : 'transparent',
              color: showAllTrajectories ? 'white' : 'var(--text-primary)',
              border: `2px solid #10b981`,
              padding: '6px 12px',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontSize: '12px',
              width: '100%'
            }}
          >
            {showAllTrajectories ? '👀 Tutte Attive' : '👁️ Mostra Tutte'}
          </button>
        </div>
      </div>

      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle={OSM_STYLE}
        style={{ width: '100%', height: '100%' }}
        maxPitch={60}
        maxBounds={selectedMap === 'italy' ? ITALY_BOUNDS : (selectedMap === 'porpetto' ? PORPETTO_BOUNDS : FVG_BOUNDS)}
        minZoom={2}
      >
        {/* Mask Layer */}
        {selectedMap === 'italy' && (
          <Source id="italy-mask" type="geojson" data="/italy_mask.json">
            <Layer id="italy-mask-fill" type="fill" paint={{ 'fill-color': theme === 'dark' ? '#000000' : '#ffffff', 'fill-opacity': 0.7 }} />
          </Source>
        )}
        {selectedMap === 'friuli' && (
          <Source id="friuli-mask" type="geojson" data="/friuli_mask.json">
            <Layer id="friuli-mask-fill" type="fill" paint={{ 'fill-color': theme === 'dark' ? '#000000' : '#ffffff', 'fill-opacity': 0.7 }} />
          </Source>
        )}

        <NavigationControl position="bottom-right" />

        {/* Car Links Layer */}
        <Source id="car-routes" type="geojson" data={carGeojson}>
          <Layer 
            id="car-lines" 
            type="line" 
            layout={{ visibility: (showAllTrajectories || selectedTransport === 'car') ? 'visible' : 'none' }}
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
            layout={{ visibility: (showAllTrajectories || selectedTransport === 'train') ? 'visible' : 'none' }}
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
            layout={{ visibility: (showAllTrajectories || selectedTransport === 'plane') ? 'visible' : 'none' }}
            paint={{
              'line-color': getTransportColor('plane'),
              'line-width': 5,
              'line-opacity': 0.8,
              'line-dasharray': [1, 4],
              'line-offset': -8
            }} 
          />
        </Source>

        {/* Ferry Links Layer */}
        <Source id="ferry-routes" type="geojson" data={ferryGeojson}>
          <Layer 
            id="ferry-lines" 
            type="line" 
            layout={{ visibility: (showAllTrajectories || selectedTransport === 'ferry') ? 'visible' : 'none' }}
            paint={{
              'line-color': getTransportColor('ferry'),
              'line-width': 5,
              'line-opacity': 0.8,
              'line-dasharray': [3, 3]
            }} 
          />
        </Source>

        {/* Draw Nodes */}
        {mapData.nodes.map((node, index) => {
          const nodeNum = index + 1;
          const isReachable = isMyTurn && myPlayer && mapData.links.some(l => 
            ((l.source === myPlayer.location && l.target === node.id) || 
             (l.source === node.id && l.target === myPlayer.location)) && 
            l.type === selectedTransport
          ) && !(myPlayer.role === 'detective' && playersList.some(p => p.role === 'detective' && p.id !== myPlayer.id && p.location === node.id));

          const types = [];
          if (mapData.links.some(l => (l.source === node.id || l.target === node.id) && l.type === 'car')) types.push('car');
          if (mapData.links.some(l => (l.source === node.id || l.target === node.id) && l.type === 'train')) types.push('train');
          if (mapData.links.some(l => (l.source === node.id || l.target === node.id) && l.type === 'plane')) types.push('plane');
          if (mapData.links.some(l => (l.source === node.id || l.target === node.id) && l.type === 'ferry')) types.push('ferry');

          let backgroundStyle = 'white';
          if (types.length === 1) {
             backgroundStyle = getTransportColor(types[0]);
          } else if (types.length === 2) {
             backgroundStyle = `conic-gradient(${getTransportColor(types[0])} 0% 50%, ${getTransportColor(types[1])} 50% 100%)`;
          } else if (types.length === 3) {
             backgroundStyle = `conic-gradient(${getTransportColor(types[0])} 0% 33.33%, ${getTransportColor(types[1])} 33.33% 66.66%, ${getTransportColor(types[2])} 66.66% 100%)`;
          }

          return (
            <Marker 
              key={`node-${node.id}`} 
              longitude={node.lng} 
              latitude={node.lat} 
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                if (isReachable) {
                  SoundEngine.playMove();
                  handleNodeClick(node.id);
                }
              }}
            >
              <div 
                className="node-marker" 
                style={{
                  cursor: isReachable ? 'pointer' : 'default',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  transform: isReachable ? 'scale(1.3)' : 'scale(1)',
                  transition: 'transform 0.2s',
                  zIndex: isReachable ? 10 : 1
                }}
              >
                <div style={{
                  width: isReachable ? 28 : 20,
                  height: isReachable ? 28 : 20,
                  background: backgroundStyle,
                  border: `3px solid ${isReachable ? 'white' : '#1e293b'}`,
                  borderRadius: '50%',
                  boxShadow: isReachable ? `0 0 15px ${getTransportColor(selectedTransport)}` : '0 2px 4px rgba(0,0,0,0.5)'
                }}></div>
                <div style={{
                  marginTop: 4,
                  color: '#1e293b',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  textShadow: '2px 2px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff',
                  pointerEvents: 'none'
                }}>
                  {nodeNum}. {node.id}
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
