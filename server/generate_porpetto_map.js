const fs = require('fs');

const MAP_FILE = './mapDataPorpetto.json';

const nodes = [
  { id: 'Municipio', lat: 45.8590, lng: 13.2130 },
  { id: 'Chiesa', lat: 45.8580, lng: 13.2120 },
  { id: 'Bar Centrale', lat: 45.8570, lng: 13.2140 },
  { id: 'Ristorante', lat: 45.8600, lng: 13.2110 },
  { id: 'Campo Sportivo', lat: 45.8610, lng: 13.2150 },
  { id: 'Palude Fraghis', lat: 45.8450, lng: 13.2200 },
  { id: 'Cimitero', lat: 45.8530, lng: 13.2100 },
  { id: 'Castello di Pampaluna', lat: 45.8500, lng: 13.2300 },
  { id: 'Scuole', lat: 45.8585, lng: 13.2160 },
  { id: 'Stazione FS', lat: 45.8650, lng: 13.2100 },
  { id: 'Supermercato', lat: 45.8620, lng: 13.2180 },
  { id: 'Farmacia', lat: 45.8575, lng: 13.2135 },
  { id: 'Parco Pubblico', lat: 45.8560, lng: 13.2150 },
  { id: 'Zona Industriale', lat: 45.8700, lng: 13.2050 },
  { id: 'Fiume Corno', lat: 45.8550, lng: 13.2080 },
  { id: 'Chiosco', lat: 45.8540, lng: 13.2140 },
  { id: 'Poste', lat: 45.8595, lng: 13.2140 },
  { id: 'Banca', lat: 45.8582, lng: 13.2125 },
  { id: 'Panetteria', lat: 45.8588, lng: 13.2132 },
  { id: 'Macelleria', lat: 45.8578, lng: 13.2128 },
  { id: 'Edicola', lat: 45.8584, lng: 13.2122 },
  { id: 'Pala', lat: 45.8592, lng: 13.2125 },
  { id: 'Piazza', lat: 45.8585, lng: 13.2135 },
  { id: 'Monumento', lat: 45.8575, lng: 13.2145 },
  { id: 'Fioreria', lat: 45.8581, lng: 13.2141 },
  { id: 'Gelateria', lat: 45.8593, lng: 13.2115 },
  { id: 'Asilo', lat: 45.8580, lng: 13.2155 }
];

const links = [
  // Piedi (car) - distanze brevissime
  { source: 'Municipio', target: 'Pala', type: 'car', geometry: [] },
  { source: 'Pala', target: 'Panetteria', type: 'car', geometry: [] },
  { source: 'Pala', target: 'Banca', type: 'car', geometry: [] },
  { source: 'Panetteria', target: 'Poste', type: 'car', geometry: [] },
  { source: 'Municipio', target: 'Piazza', type: 'car', geometry: [] },
  { source: 'Piazza', target: 'Fioreria', type: 'car', geometry: [] },
  { source: 'Piazza', target: 'Edicola', type: 'car', geometry: [] },
  { source: 'Fioreria', target: 'Monumento', type: 'car', geometry: [] },
  { source: 'Monumento', target: 'Bar Centrale', type: 'car', geometry: [] },
  { source: 'Edicola', target: 'Chiesa', type: 'car', geometry: [] },
  { source: 'Chiesa', target: 'Banca', type: 'car', geometry: [] },
  { source: 'Chiesa', target: 'Macelleria', type: 'car', geometry: [] },
  { source: 'Macelleria', target: 'Farmacia', type: 'car', geometry: [] },
  { source: 'Farmacia', target: 'Asilo', type: 'car', geometry: [] },
  { source: 'Asilo', target: 'Scuole', type: 'car', geometry: [] },
  { source: 'Scuole', target: 'Piazza', type: 'car', geometry: [] },
  { source: 'Municipio', target: 'Gelateria', type: 'car', geometry: [] },
  { source: 'Gelateria', target: 'Ristorante', type: 'car', geometry: [] },
  { source: 'Bar Centrale', target: 'Parco Pubblico', type: 'car', geometry: [] },
  { source: 'Parco Pubblico', target: 'Chiosco', type: 'car', geometry: [] },
  { source: 'Chiosco', target: 'Cimitero', type: 'car', geometry: [] },
  { source: 'Chiesa', target: 'Fiume Corno', type: 'car', geometry: [] },
  { source: 'Poste', target: 'Scuole', type: 'car', geometry: [] },
  { source: 'Scuole', target: 'Campo Sportivo', type: 'car', geometry: [] },
  { source: 'Campo Sportivo', target: 'Supermercato', type: 'car', geometry: [] },
  { source: 'Ristorante', target: 'Municipio', type: 'car', geometry: [] },
  { source: 'Fiume Corno', target: 'Cimitero', type: 'car', geometry: [] },
  
  // Bici (train) - distanze medie
  { source: 'Piazza', target: 'Campo Sportivo', type: 'train', geometry: [] },
  { source: 'Chiesa', target: 'Cimitero', type: 'train', geometry: [] },
  { source: 'Ristorante', target: 'Stazione FS', type: 'train', geometry: [] },
  { source: 'Stazione FS', target: 'Zona Industriale', type: 'train', geometry: [] },
  { source: 'Supermercato', target: 'Zona Industriale', type: 'train', geometry: [] },
  { source: 'Parco Pubblico', target: 'Castello di Pampaluna', type: 'train', geometry: [] },
  { source: 'Cimitero', target: 'Palude Fraghis', type: 'train', geometry: [] },
  { source: 'Fiume Corno', target: 'Ristorante', type: 'train', geometry: [] },
  { source: 'Municipio', target: 'Supermercato', type: 'train', geometry: [] },
  { source: 'Asilo', target: 'Supermercato', type: 'train', geometry: [] },
  { source: 'Campo Sportivo', target: 'Palude Fraghis', type: 'train', geometry: [] },

  // Motorino (plane) - distanze lunghe (niente zone di campi/palude)
  { source: 'Bar Centrale', target: 'Stazione FS', type: 'plane', geometry: [] },
  { source: 'Stazione FS', target: 'Zona Industriale', type: 'plane', geometry: [] },
  { source: 'Zona Industriale', target: 'Castello di Pampaluna', type: 'plane', geometry: [] },
  { source: 'Pala', target: 'Castello di Pampaluna', type: 'plane', geometry: [] },
  { source: 'Pala', target: 'Zona Industriale', type: 'plane', geometry: [] },
  { source: 'Municipio', target: 'Stazione FS', type: 'plane', geometry: [] }
];

const mapData = { nodes, links };
fs.writeFileSync(MAP_FILE, JSON.stringify(mapData, null, 2));
console.log(`${MAP_FILE} generated successfully with ${nodes.length} POIs and ${links.length} routes.`);
