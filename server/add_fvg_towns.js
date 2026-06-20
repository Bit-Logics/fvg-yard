const fs = require('fs');
const https = require('https');

const MAP_FILE = './mapData.json';
const mapData = require(MAP_FILE);

const newTowns = [
  // Bassa Friulana / Stella
  'Marano Lagunare', 'Palazzolo dello Stella', 'Muzzana del Turgnano', 'Carlino',
  // Collio / Carso / Goriziano
  'San Pietro al Natisone', 'Ronchi dei Legionari', 'Duino', 'Opicina', 'Sistiana', 'Redipuglia',
  // Medio Friuli
  'Mortegliano', 'Pozzuolo del Friuli', 'Campoformido', 'Basiliano', 'Lestizza',
  // Carnia extra
  'Sauris', 'Ravascletto', 'Sutrio', 'Paularo', 'Comeglians',
  // Destra Tagliamento
  'Fiume Veneto', 'Prata di Pordenone', 'Pinzano al Tagliamento', 'Sequals', 'Vivaro'
];

const connections = [
  { source: 'Marano Lagunare', target: 'Carlino', type: 'car' },
  { source: 'Carlino', target: 'Muzzana del Turgnano', type: 'car' },
  { source: 'Muzzana del Turgnano', target: 'Palazzolo dello Stella', type: 'car' },
  { source: 'Palazzolo dello Stella', target: 'Latisana', type: 'car' },
  { source: 'Muzzana del Turgnano', target: 'San Giorgio di Nogaro', type: 'car' },
  { source: 'Marano Lagunare', target: 'Lignano Sabbiadoro', type: 'ferry' },
  
  { source: 'San Pietro al Natisone', target: 'Cividale del Friuli', type: 'car' },
  { source: 'Ronchi dei Legionari', target: 'Monfalcone', type: 'car' },
  { source: 'Ronchi dei Legionari', target: 'Redipuglia', type: 'car' },
  { source: 'Redipuglia', target: 'Gradisca d\'Isonzo', type: 'car' },
  { source: 'Duino', target: 'Monfalcone', type: 'car' },
  { source: 'Sistiana', target: 'Duino', type: 'car' },
  { source: 'Opicina', target: 'Sistiana', type: 'car' },
  { source: 'Opicina', target: 'Trieste', type: 'car' },
  
  { source: 'Mortegliano', target: 'Pozzuolo del Friuli', type: 'car' },
  { source: 'Pozzuolo del Friuli', target: 'Campoformido', type: 'car' },
  { source: 'Campoformido', target: 'Udine', type: 'car' },
  { source: 'Mortegliano', target: 'Lestizza', type: 'car' },
  { source: 'Lestizza', target: 'Basiliano', type: 'car' },
  { source: 'Basiliano', target: 'Codroipo', type: 'car' },
  
  { source: 'Sauris', target: 'Ampezzo', type: 'car' },
  { source: 'Ravascletto', target: 'Comeglians', type: 'car' },
  { source: 'Comeglians', target: 'Ovaro', type: 'car' },
  { source: 'Sutrio', target: 'Paluzza', type: 'car' },
  { source: 'Sutrio', target: 'Arta Terme', type: 'car' },
  { source: 'Paularo', target: 'Arta Terme', type: 'car' },
  
  { source: 'Fiume Veneto', target: 'Azzano Decimo', type: 'car' },
  { source: 'Fiume Veneto', target: 'Zoppola', type: 'car' },
  { source: 'Prata di Pordenone', target: 'Brugnera', type: 'car' },
  { source: 'Prata di Pordenone', target: 'Pordenone', type: 'car' },
  { source: 'Pinzano al Tagliamento', target: 'Spilimbergo', type: 'car' },
  { source: 'Sequals', target: 'Pinzano al Tagliamento', type: 'car' },
  { source: 'Vivaro', target: 'Maniago', type: 'car' },
  { source: 'Vivaro', target: 'Spilimbergo', type: 'car' }
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
        fs.writeFileSync(MAP_FILE, JSON.stringify(mapData, null, 2));
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
      } else {
        console.warn(`Could not find nodes for link ${conn.source} -> ${conn.target}`);
      }
    }
  }

  fs.writeFileSync(MAP_FILE, JSON.stringify(mapData, null, 2));
  console.log('Done! mapData.json updated.');
}

run().catch(console.error);
