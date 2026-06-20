const fs = require('fs');

const data = JSON.parse(fs.readFileSync('server/mapData.json', 'utf8'));

const newNodes = [
  { id: "Maniago", lng: 12.7093, lat: 46.1687 },
  { id: "Azzano Decimo", lng: 12.7167, lat: 45.8833 },
  { id: "Fontanafredda", lng: 12.5667, lat: 45.9667 },
  { id: "Porcia", lng: 12.6167, lat: 45.9667 },
  { id: "Brugnera", lng: 12.5333, lat: 45.9 },
  { id: "Caneva", lng: 12.45, lat: 45.9667 },
  { id: "Roveredo in Piano", lng: 12.6167, lat: 46.0167 },
  { id: "Zoppola", lng: 12.7667, lat: 45.9667 },
  { id: "San Giorgio della Richinvelda", lng: 12.8667, lat: 46.05 },
  { id: "Valvasone", lng: 12.8667, lat: 45.9833 }
];

const newLinks = [
  { source: "Maniago", target: "Spilimbergo", type: "car" },
  { source: "Maniago", target: "Aviano", type: "car" },
  { source: "Azzano Decimo", target: "Pordenone", type: "car" },
  { source: "Azzano Decimo", target: "San Vito al Tagliamento", type: "car" },
  { source: "Fontanafredda", target: "Pordenone", type: "car" },
  { source: "Fontanafredda", target: "Sacile", type: "car" },
  { source: "Porcia", target: "Pordenone", type: "car" },
  { source: "Porcia", target: "Brugnera", type: "car" },
  { source: "Brugnera", target: "Sacile", type: "car" },
  { source: "Caneva", target: "Sacile", type: "car" },
  { source: "Roveredo in Piano", target: "Pordenone", type: "car" },
  { source: "Roveredo in Piano", target: "Aviano", type: "car" },
  { source: "Zoppola", target: "Pordenone", type: "car" },
  { source: "Zoppola", target: "Casarsa della Delizia", type: "car" },
  { source: "San Giorgio della Richinvelda", target: "Spilimbergo", type: "car" },
  { source: "San Giorgio della Richinvelda", target: "Casarsa della Delizia", type: "car" },
  { source: "Valvasone", target: "Casarsa della Delizia", type: "car" },
  { source: "Valvasone", target: "San Vito al Tagliamento", type: "car" }
];

// Add if not exists
newNodes.forEach(n => {
  if (!data.nodes.find(existing => existing.id === n.id)) {
    data.nodes.push(n);
  }
});

newLinks.forEach(l => {
  if (!data.links.find(existing => existing.source === l.source && existing.target === l.target && existing.type === l.type)) {
    data.links.push(l);
  }
});

fs.writeFileSync('server/mapData.json', JSON.stringify(data, null, 2));
console.log('Added ' + newNodes.length + ' nodes and ' + newLinks.length + ' links.');
