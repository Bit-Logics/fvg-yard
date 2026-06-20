const fs = require('fs');

const MAP_FILE = './mapDataPorpetto.json';

const nodes = [
  // Centro di Porpetto
  { id: 'Municipio', lat: 45.8590, lng: 13.2130 },
  { id: 'Chiesa', lat: 45.8580, lng: 13.2120 },
  { id: 'Bar Centrale', lat: 45.8570, lng: 13.2140 },
  { id: 'Ristorante', lat: 45.8600, lng: 13.2110 },
  { id: 'Campo Sportivo', lat: 45.8610, lng: 13.2150 },
  { id: 'Palude Fraghis', lat: 45.8450, lng: 13.2200 },
  { id: 'Cimitero', lat: 45.8530, lng: 13.2100 },
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
  { id: 'Asilo', lat: 45.8580, lng: 13.2155 },
  
  // Frazione Corgnolo
  { id: 'Piazza di Corgnolo', lat: 45.8450, lng: 13.1850 },
  { id: 'Chiesa di Corgnolo', lat: 45.8455, lng: 13.1845 },
  { id: 'Bar di Corgnolo', lat: 45.8445, lng: 13.1855 },
  
  // Frazione Pampaluna
  { id: 'Borgo Pampaluna', lat: 45.8500, lng: 13.2300 },
  { id: 'Villa Pampaluna', lat: 45.8490, lng: 13.2310 },
  
  // Frazione Castello
  { id: 'Castello di Porpetto', lat: 45.8600, lng: 13.2200 },
  { id: 'Borgo Castello', lat: 45.8605, lng: 13.2210 },
  { id: 'Torre', lat: 45.8610, lng: 13.2195 },
  
  // Frazione Fornalis
  { id: 'Borgo Fornalis', lat: 45.8650, lng: 13.2300 },
  { id: 'Chiesetta Fornalis', lat: 45.8655, lng: 13.2310 }
];

const links = [
  // Piedi (car) - distanze brevissime in Centro
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

  // Piedi (car) - All'interno delle Frazioni
  { source: 'Piazza di Corgnolo', target: 'Chiesa di Corgnolo', type: 'car', geometry: [] },
  { source: 'Piazza di Corgnolo', target: 'Bar di Corgnolo', type: 'car', geometry: [] },
  { source: 'Borgo Pampaluna', target: 'Villa Pampaluna', type: 'car', geometry: [] },
  { source: 'Castello di Porpetto', target: 'Borgo Castello', type: 'car', geometry: [] },
  { source: 'Castello di Porpetto', target: 'Torre', type: 'car', geometry: [] },
  { source: 'Borgo Fornalis', target: 'Chiesetta Fornalis', type: 'car', geometry: [] },
  
  // Bici (train) - distanze medie (Collega centro a frazioni e tra loro)
  { source: 'Piazza', target: 'Campo Sportivo', type: 'train', geometry: [] },
  { source: 'Chiesa', target: 'Cimitero', type: 'train', geometry: [] },
  { source: 'Ristorante', target: 'Stazione FS', type: 'train', geometry: [] },
  { source: 'Stazione FS', target: 'Zona Industriale', type: 'train', geometry: [] },
  { source: 'Supermercato', target: 'Zona Industriale', type: 'train', geometry: [] },
  { source: 'Parco Pubblico', target: 'Castello di Porpetto', type: 'train', geometry: [] },
  { source: 'Castello di Porpetto', target: 'Borgo Fornalis', type: 'train', geometry: [] },
  { source: 'Cimitero', target: 'Palude Fraghis', type: 'train', geometry: [] },
  { source: 'Cimitero', target: 'Piazza di Corgnolo', type: 'train', geometry: [] },
  { source: 'Fiume Corno', target: 'Piazza di Corgnolo', type: 'train', geometry: [] },
  { source: 'Fiume Corno', target: 'Ristorante', type: 'train', geometry: [] },
  { source: 'Municipio', target: 'Supermercato', type: 'train', geometry: [] },
  { source: 'Asilo', target: 'Supermercato', type: 'train', geometry: [] },
  { source: 'Campo Sportivo', target: 'Palude Fraghis', type: 'train', geometry: [] },
  { source: 'Palude Fraghis', target: 'Borgo Pampaluna', type: 'train', geometry: [] },
  { source: 'Borgo Fornalis', target: 'Torre', type: 'train', geometry: [] },
  { source: 'Borgo Pampaluna', target: 'Borgo Castello', type: 'train', geometry: [] },
  { source: 'Chiesa di Corgnolo', target: 'Palude Fraghis', type: 'train', geometry: [] },

  // Motorino (plane) - distanze lunghe (Niente palude o campi)
  { source: 'Bar Centrale', target: 'Stazione FS', type: 'plane', geometry: [] },
  { source: 'Stazione FS', target: 'Zona Industriale', type: 'plane', geometry: [] },
  { source: 'Zona Industriale', target: 'Castello di Porpetto', type: 'plane', geometry: [] },
  { source: 'Pala', target: 'Castello di Porpetto', type: 'plane', geometry: [] },
  { source: 'Castello di Porpetto', target: 'Borgo Fornalis', type: 'plane', geometry: [] },
  { source: 'Pala', target: 'Zona Industriale', type: 'plane', geometry: [] },
  { source: 'Municipio', target: 'Stazione FS', type: 'plane', geometry: [] },
  { source: 'Municipio', target: 'Borgo Pampaluna', type: 'plane', geometry: [] },
  { source: 'Municipio', target: 'Piazza di Corgnolo', type: 'plane', geometry: [] },
  { source: 'Piazza di Corgnolo', target: 'Zona Industriale', type: 'plane', geometry: [] },
  { source: 'Borgo Pampaluna', target: 'Borgo Fornalis', type: 'plane', geometry: [] }
];

const mapData = { nodes, links };
fs.writeFileSync(MAP_FILE, JSON.stringify(mapData, null, 2));
console.log(`${MAP_FILE} generated successfully with ${nodes.length} POIs and ${links.length} routes.`);
