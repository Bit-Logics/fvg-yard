const fs = require('fs');
const https = require('https');

const MAP_FILE = './mapDataItaly.json';

const newTowns = [
  'Roma', 'Milano', 'Napoli', 'Torino', 'Palermo', 'Genova', 
  'Bologna', 'Firenze', 'Bari', 'Catania', 'Venezia', 'Verona', 
  'Padova', 'Trieste', 'Cagliari', 'Sassari', 'Trento', 'Aosta', 
  'Perugia', 'Ancona', 'Pescara', 'L Aquila', 'Campobasso', 
  'Potenza', 'Catanzaro', 'Reggio Calabria', 'Messina', 'Salerno', 'Lecce'
];

const connections = [
  // Planes (straight lines, geometry = [])
  { source: 'Roma', target: 'Milano', type: 'plane' },
  { source: 'Roma', target: 'Palermo', type: 'plane' },
  { source: 'Roma', target: 'Catania', type: 'plane' },
  { source: 'Roma', target: 'Cagliari', type: 'plane' },
  { source: 'Roma', target: 'Venezia', type: 'plane' },
  { source: 'Roma', target: 'Bari', type: 'plane' },
  { source: 'Milano', target: 'Napoli', type: 'plane' },
  { source: 'Milano', target: 'Palermo', type: 'plane' },
  { source: 'Milano', target: 'Catania', type: 'plane' },
  { source: 'Milano', target: 'Cagliari', type: 'plane' },
  { source: 'Milano', target: 'Bari', type: 'plane' },
  { source: 'Venezia', target: 'Palermo', type: 'plane' },
  { source: 'Napoli', target: 'Cagliari', type: 'plane' },

  // Trains (straight lines for distinction)
  { source: 'Torino', target: 'Milano', type: 'train' },
  { source: 'Milano', target: 'Verona', type: 'train' },
  { source: 'Verona', target: 'Padova', type: 'train' },
  { source: 'Padova', target: 'Venezia', type: 'train' },
  { source: 'Venezia', target: 'Trieste', type: 'train' },
  { source: 'Milano', target: 'Bologna', type: 'train' },
  { source: 'Bologna', target: 'Firenze', type: 'train' },
  { source: 'Firenze', target: 'Roma', type: 'train' },
  { source: 'Roma', target: 'Napoli', type: 'train' },
  { source: 'Napoli', target: 'Salerno', type: 'train' },
  { source: 'Salerno', target: 'Reggio Calabria', type: 'train' },
  { source: 'Bologna', target: 'Ancona', type: 'train' },
  { source: 'Ancona', target: 'Pescara', type: 'train' },
  { source: 'Pescara', target: 'Bari', type: 'train' },
  { source: 'Bari', target: 'Lecce', type: 'train' },
  { source: 'Genova', target: 'Milano', type: 'train' },
  { source: 'Genova', target: 'Torino', type: 'train' },
  { source: 'Genova', target: 'Roma', type: 'train' },
  { source: 'Verona', target: 'Trento', type: 'train' },
  { source: 'Messina', target: 'Palermo', type: 'train' },
  { source: 'Messina', target: 'Catania', type: 'train' },
  { source: 'Cagliari', target: 'Sassari', type: 'train' },

  // Cars (OSRM routing)
  { source: 'Torino', target: 'Aosta', type: 'car' },
  { source: 'Torino', target: 'Milano', type: 'car' },
  { source: 'Milano', target: 'Verona', type: 'car' },
  { source: 'Verona', target: 'Padova', type: 'car' },
  { source: 'Padova', target: 'Venezia', type: 'car' },
  { source: 'Venezia', target: 'Trieste', type: 'car' },
  { source: 'Verona', target: 'Trento', type: 'car' },
  { source: 'Milano', target: 'Genova', type: 'car' },
  { source: 'Torino', target: 'Genova', type: 'car' },
  { source: 'Genova', target: 'Firenze', type: 'car' },
  { source: 'Milano', target: 'Bologna', type: 'car' },
  { source: 'Bologna', target: 'Firenze', type: 'car' },
  { source: 'Firenze', target: 'Roma', type: 'car' },
  { source: 'Roma', target: 'Napoli', type: 'car' },
  { source: 'Napoli', target: 'Salerno', type: 'car' },
  { source: 'Salerno', target: 'Potenza', type: 'car' },
  { source: 'Salerno', target: 'Catanzaro', type: 'car' },
  { source: 'Catanzaro', target: 'Reggio Calabria', type: 'car' },
  { source: 'Bologna', target: 'Ancona', type: 'car' },
  { source: 'Ancona', target: 'Pescara', type: 'car' },
  { source: 'Pescara', target: 'Bari', type: 'car' },
  { source: 'Bari', target: 'Lecce', type: 'car' },
  { source: 'Firenze', target: 'Perugia', type: 'car' },
  { source: 'Perugia', target: 'Roma', type: 'car' },
  { source: 'Roma', target: 'L Aquila', type: 'car' },
  { source: 'L Aquila', target: 'Pescara', type: 'car' },
  { source: 'Napoli', target: 'Campobasso', type: 'car' },
  { source: 'Campobasso', target: 'Pescara', type: 'car' },
  { source: 'Messina', target: 'Catania', type: 'car' },
  { source: 'Catania', target: 'Palermo', type: 'car' },
  { source: 'Messina', target: 'Palermo', type: 'car' },
  { source: 'Cagliari', target: 'Sassari', type: 'car' }
];

async function geocode(townName) {
  const query = `${townName}, Italy`;
  return new Promise((resolve, reject) => {
    https.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': 'MisterXMapGen/1.0' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const results = JSON.parse(data);
          if (results.length > 0) {
            resolve({
              lat: parseFloat(results[0].lat),
              lng: parseFloat(results[0].lon)
            });
          } else {
            console.warn(`Could not geocode ${townName}`);
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', reject);
  });
}

async function getRouteGeometry(sourceNode, targetNode) {
  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${sourceNode.lng},${sourceNode.lat};${targetNode.lng},${targetNode.lat}?overview=full&geometries=geojson`;
  
  return new Promise((resolve) => {
    https.get(osrmUrl, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.routes && result.routes.length > 0) {
            resolve(result.routes[0].geometry.coordinates);
          } else {
            resolve([]);
          }
        } catch (e) {
          resolve([]);
        }
      });
    }).on('error', () => resolve([]));
  });
}

async function run() {
  const mapData = { nodes: [], links: [] };

  console.log('Geocoding towns...');
  for (const t of newTowns) {
    await new Promise(r => setTimeout(r, 1000));
    const coords = await geocode(t);
    if (coords) {
      mapData.nodes.push({ id: t, ...coords });
      console.log(`Added ${t}`);
    }
  }

  console.log('Fetching geometries for connections...');
  for (const conn of connections) {
    const sourceNode = mapData.nodes.find(n => n.id === conn.source);
    const targetNode = mapData.nodes.find(n => n.id === conn.target);
    
    if (sourceNode && targetNode) {
      let geometry = [];
      if (conn.type === 'car') {
        await new Promise(r => setTimeout(r, 200));
        geometry = await getRouteGeometry(sourceNode, targetNode);
      }
      
      mapData.links.push({
        source: conn.source,
        target: conn.target,
        type: conn.type,
        geometry: geometry
      });
      console.log(`Added link ${conn.source} -> ${conn.target} (${conn.type})`);
    } else {
      console.warn(`Skipped link ${conn.source} -> ${conn.target} (Node missing)`);
    }
  }

  fs.writeFileSync(MAP_FILE, JSON.stringify(mapData, null, 2));
  console.log(`Done! ${MAP_FILE} generated.`);
}

run().catch(console.error);
