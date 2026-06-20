import React, { useState, useMemo } from 'react';
import Map, { Marker, Source, Layer, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import './MapArea.css';

function MapArea({ mapData, players, myPlayer, isMyTurn, onMove }) {
  const [selectedTransport, setSelectedTransport] = useState('car');
  const [viewState, setViewState] = useState({
    longitude: 13.1,
    latitude: 46.0,
    zoom: 8.5,
    pitch: 0, // default 2d
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
      case 'car': return '#0ea5e9'; // var(--route-car) roughly
      case 'train': return '#f59e0b'; // var(--route-train)
      case 'plane': return '#ef4444'; // var(--route-plane)
      default: return '#fff';
    }
  };

  // Generate GeoJSON for links
  const { carGeojson, trainGeojson, planeGeojson } = useMemo(() => {
    const buildCollection = (type) => {
      const features = mapData.links
        .filter(l => l.type === type)
        .map(l => {
          const sourceNode = mapData.nodes.find(n => n.id === l.source);
          const targetNode = mapData.nodes.find(n => n.id === l.target);
          if (!sourceNode || !targetNode) return null;
          return {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [
                [sourceNode.lng, sourceNode.lat],
                [targetNode.lng, targetNode.lat]
              ]
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
      <div className="transport-selector glass-panel" style={{ zIndex: 10, position: 'absolute', top: 20, left: 20 }}>
        <label style={{ cursor: 'pointer', marginRight: '15px' }}>
          <input 
            type="radio" 
            value="car" 
            checked={selectedTransport === 'car'} 
            onChange={(e) => setSelectedTransport(e.target.value)} 
          /> Auto
        </label>
        <label style={{ cursor: 'pointer', marginRight: '15px' }}>
          <input 
            type="radio" 
            value="train" 
            checked={selectedTransport === 'train'} 
            onChange={(e) => setSelectedTransport(e.target.value)} 
          /> Treno
        </label>
        <label style={{ cursor: 'pointer' }}>
          <input 
            type="radio" 
            value="plane" 
            checked={selectedTransport === 'plane'} 
            onChange={(e) => setSelectedTransport(e.target.value)} 
          /> Aereo
        </label>
      </div>

      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        style={{ width: '100%', height: '100%' }}
        maxPitch={60}
      >
        <NavigationControl position="bottom-right" />

        {/* Car Links Layer */}
        <Source id="car-routes" type="geojson" data={carGeojson}>
          <Layer 
            id="car-lines" 
            type="line" 
            paint={{
              'line-color': getTransportColor('car'),
              'line-width': 4,
              'line-opacity': 0.7
            }} 
          />
        </Source>

        {/* Train Links Layer */}
        <Source id="train-routes" type="geojson" data={trainGeojson}>
          <Layer 
            id="train-lines" 
            type="line" 
            paint={{
              'line-color': getTransportColor('train'),
              'line-width': 4,
              'line-opacity': 0.9,
              'line-dasharray': [2, 2]
            }} 
          />
        </Source>

        {/* Plane Links Layer */}
        <Source id="plane-routes" type="geojson" data={planeGeojson}>
          <Layer 
            id="plane-lines" 
            type="line" 
            paint={{
              'line-color': getTransportColor('plane'),
              'line-width': 3,
              'line-opacity': 0.8,
              'line-dasharray': [1, 4]
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
                  backgroundColor: 'var(--node-color)',
                  border: `3px solid ${isReachable ? getTransportColor(selectedTransport) : 'var(--node-border)'}`,
                  borderRadius: '50%',
                  boxShadow: isReachable ? `0 0 10px ${getTransportColor(selectedTransport)}` : 'none'
                }}></div>
                <div style={{
                  marginTop: 4,
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  textShadow: '0 0 4px black',
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
          const node = mapData.nodes.find(n => n.id === p.location);
          if (!node) return null;
          
          const isMe = myPlayer && p.id === myPlayer.id;
          
          // Slight offset for multiple players on same node
          const numOnSameNode = playersList.filter(pl => pl.location === p.location).length;
          const offset = numOnSameNode > 1 ? (i * 0.01) : 0; // Very rough lng/lat offset

          return (
            <Marker 
              key={`player-${p.id}`} 
              longitude={node.lng + offset} 
              latitude={node.lat + offset} 
              anchor="bottom"
              style={{ transition: 'all 0.5s ease' }}
            >
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  padding: '2px 8px',
                  backgroundColor: p.role === 'fugitive' ? 'black' : 'var(--primary-color)',
                  color: 'white',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  border: '2px solid white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                  marginBottom: '4px'
                }}>
                  {p.name}
                </div>
                {/* Pointer arrow down */}
                <div style={{
                  width: 0, height: 0,
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderTop: `8px solid ${p.role === 'fugitive' ? 'black' : 'var(--primary-color)'}`
                }}></div>
                
                {isMe && (
                  <div className="pulse-anim" style={{
                    position: 'absolute',
                    bottom: -10,
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    border: '2px dashed var(--accent-color)'
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
