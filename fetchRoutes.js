const fs = require('fs');
const https = require('https');

const mapDataFile = './server/mapData.json';
const mapData = JSON.parse(fs.readFileSync(mapDataFile, 'utf8'));

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const fetchGeometry = (lng1, lat1, lng2, lat2) => {
  return new Promise((resolve, reject) => {
    const url = `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.routes && json.routes.length > 0) {
            resolve(json.routes[0].geometry.coordinates);
          } else {
            resolve(null);
          }
        } catch(e) {
          resolve(null);
        }
      });
    }).on('error', (e) => resolve(null));
  });
};

async function processLinks() {
  console.log('Fetching route geometries from OSRM...');
  for (let i = 0; i < mapData.links.length; i++) {
    const link = mapData.links[i];
    if (link.type === 'plane') continue; // keep plane as straight line
    
    // Check if we already fetched it (if we rerun script)
    if (link.geometry) continue;

    const sourceNode = mapData.nodes.find(n => n.id === link.source);
    const targetNode = mapData.nodes.find(n => n.id === link.target);

    if (sourceNode && targetNode) {
      console.log(`Fetching ${link.source} -> ${link.target} (${link.type})...`);
      const coords = await fetchGeometry(sourceNode.lng, sourceNode.lat, targetNode.lng, targetNode.lat);
      if (coords) {
        link.geometry = coords;
      } else {
        console.log(`Failed to fetch ${link.source} -> ${link.target}`);
      }
      await sleep(200); // polite to public API
    }
  }

  fs.writeFileSync(mapDataFile, JSON.stringify(mapData, null, 2));
  console.log('Successfully saved real geometries to mapData.json');
}

processLinks();
