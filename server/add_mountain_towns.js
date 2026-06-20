const fs = require('fs');
const https = require('https');

const MAP_FILE = './mapData.json';
const mapData = require(MAP_FILE);

const newTowns = [
  'Ampezzo', 'Forni di Sopra', 'Sappada', 'Pontebba', 
  'Ovaro', 'Paluzza', 'Moggio Udinese', 'Chiusaforte', 
  'Venzone', 'Trasaghis', 'Arta Terme'
];

// Relationships (Auto routes) to connect them to each other and existing nodes
const connections = [
  { source: 'Ampezzo', target: 'Forni di Sopra', type: 'car' },
  { source: 'Ampezzo', target: 'Ovaro', type: 'car' },
  { source: 'Ovaro', target: 'Tolmezzo', type: 'car' },
  { source: 'Ovaro', target: 'Sappada', type: 'car' },
  { source: 'Tolmezzo', target: 'Arta Terme', type: 'car' },
  { source: 'Arta Terme', target: 'Paluzza', type: 'car' },
  { source: 'Tolmezzo', target: 'Venzone', type: 'car' },
  { source: 'Venzone', target: 'Gemona del Friuli', type: 'car' },
  { source: 'Trasaghis', target: 'Gemona del Friuli', type: 'car' },
  { source: 'Venzone', target: 'Moggio Udinese', type: 'car' },
  { source: 'Moggio Udinese', target: 'Chiusaforte', type: 'car' },
  { source: 'Chiusaforte', target: 'Pontebba', type: 'car' },
  { source: 'Pontebba', target: 'Tarvisio', type: 'car' },
  { source: 'Pontebba', target: 'Moggio Udinese', type: 'train' }, // example train route
  { source: 'Venzone', target: 'Gemona del Friuli', type: 'train' }
];

async function geocode(townName) {
  const query = `${townName}, Friuli-Venezia Giulia, Italy`;
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
  console.log('Geocoding new towns...');
  for (const t of newTowns) {
    if (!mapData.nodes.find(n => n.id === t)) {
      await new Promise(r => setTimeout(r, 1000)); // Respect Nominatim rate limit
      const coords = await geocode(t);
      if (coords) {
        mapData.nodes.push({ id: t, ...coords });
        console.log(`Added ${t}`);
      }
    }
  }

  console.log('Fetching geometries for connections...');
  for (const conn of connections) {
    // Only add if not exists
    const exists = mapData.links.some(l => 
      ((l.source === conn.source && l.target === conn.target) || 
       (l.source === conn.target && l.target === conn.source)) &&
      l.type === conn.type
    );
    
    if (!exists) {
      const sourceNode = mapData.nodes.find(n => n.id === conn.source);
      const targetNode = mapData.nodes.find(n => n.id === conn.target);
      
      if (sourceNode && targetNode) {
        await new Promise(r => setTimeout(r, 200)); // Rate limit for OSRM
        let geometry = [];
        if (conn.type === 'car') {
          geometry = await getRouteGeometry(sourceNode, targetNode);
        }
        
        mapData.links.push({
          source: conn.source,
          target: conn.target,
          type: conn.type,
          geometry: geometry
        });
        console.log(`Added link ${conn.source} -> ${conn.target} (${conn.type})`);
      }
    }
  }

  fs.writeFileSync(MAP_FILE, JSON.stringify(mapData, null, 2));
  console.log('Done! mapData.json updated.');
}

run().catch(console.error);
