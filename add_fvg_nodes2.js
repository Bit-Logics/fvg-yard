const fs = require('fs');
const https = require('https');

const MAP_FILE = './server/mapData.json';
const mapData = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));

const newTowns = [
  'Palmanova', 'Cervignano del Friuli', 'Latisana', 'Lignano Sabbiadoro', 
  'Grado', 'Monfalcone', 'Gorizia', 'Cividale del Friuli', 'Gemona del Friuli', 
  'Tolmezzo', 'Tarvisio', 'Codroipo', 'San Daniele del Friuli', 'Tricesimo', 'Aquileia', 'Fagagna'
];

const newLinks = [
  // Pianura / Mare
  { source: 'Udine', target: 'Palmanova', type: 'car' },
  { source: 'Palmanova', target: 'Cervignano del Friuli', type: 'car' },
  { source: 'Cervignano del Friuli', target: 'Aquileia', type: 'car' },
  { source: 'Aquileia', target: 'Grado', type: 'car' },
  { source: 'Cervignano del Friuli', target: 'Monfalcone', type: 'car' },
  { source: 'Monfalcone', target: 'Trieste', type: 'car' },
  { source: 'Palmanova', target: 'Gorizia', type: 'car' },
  { source: 'Codroipo', target: 'Latisana', type: 'car' },
  { source: 'Latisana', target: 'Lignano Sabbiadoro', type: 'car' },
  
  // Collina / Confine
  { source: 'Udine', target: 'Cividale del Friuli', type: 'car' },
  { source: 'Udine', target: 'Tricesimo', type: 'car' },
  { source: 'Tricesimo', target: 'Gemona del Friuli', type: 'car' },
  { source: 'Udine', target: 'Fagagna', type: 'car' },
  { source: 'Fagagna', target: 'San Daniele del Friuli', type: 'car' },
  { source: 'San Daniele del Friuli', target: 'Spilimbergo', type: 'car' },
  { source: 'Codroipo', target: 'Udine', type: 'car' },
  { source: 'Codroipo', target: 'Pordenone', type: 'car' },
  { source: 'San Daniele del Friuli', target: 'Gemona del Friuli', type: 'car' },
  
  // Montagna
  { source: 'Gemona del Friuli', target: 'Tolmezzo', type: 'car' },
  { source: 'Tolmezzo', target: 'Tarvisio', type: 'car' },
  { source: 'Gemona del Friuli', target: 'Tarvisio', type: 'car' }
];

async function geocode(townName) {
  const query = `${townName}, Friuli Venezia Giulia, Italy`;
  return new Promise((resolve) => {
    https.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': 'MisterXMapGen/2.0' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const results = JSON.parse(data);
          if (results.length > 0) {
            resolve({ lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) });
          } else {
            console.warn(`Could not geocode ${townName}`);
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function run() {
  console.log('Geocoding new FVG towns...');
  for (const t of newTowns) {
    if (!mapData.nodes.find(n => n.id === t)) {
      await new Promise(r => setTimeout(r, 1000));
      const coords = await geocode(t);
      if (coords) {
        mapData.nodes.push({ id: t, ...coords });
        console.log(`Added node: ${t}`);
      }
    } else {
      console.log(`Node ${t} already exists.`);
    }
  }

  console.log('Adding new FVG links...');
  for (const l of newLinks) {
    if (!mapData.links.find(existing => existing.source === l.source && existing.target === l.target && existing.type === l.type)) {
      mapData.links.push({ source: l.source, target: l.target, type: l.type });
      console.log(`Added link: ${l.source} -> ${l.target} (${l.type})`);
    } else {
      console.log(`Link ${l.source} -> ${l.target} already exists.`);
    }
  }

  fs.writeFileSync(MAP_FILE, JSON.stringify(mapData, null, 2));
  console.log(`Saved to ${MAP_FILE}. Now run fetchRoutes.js to fetch OSRM geometries!`);
}

run().catch(console.error);
