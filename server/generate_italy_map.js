const fs = require('fs');
const https = require('https');

const MAP_FILE = './mapDataItaly.json';

const newTowns = [
  'Roma', 'Milano', 'Napoli', 'Torino', 'Palermo', 'Genova', 
  'Bologna', 'Firenze', 'Bari', 'Catania', 'Venezia', 'Verona', 
  'Padova', 'Trieste', 'Cagliari', 'Sassari', 'Trento', 'Aosta', 
  'Perugia', 'Ancona', 'Pescara', 'L Aquila', 'Campobasso', 
  'Potenza', 'Catanzaro', 'Reggio Calabria', 'Messina', 'Salerno', 'Lecce',
  // Intermediate towns (Mainland)
  'Novara', 'Piacenza', 'Parma', 'Reggio Emilia', 'Modena',
  'Sasso Marconi', 'Barberino di Mugello', 'Arezzo', 'Orvieto', 'Viterbo',
  'Frosinone', 'Cassino', 'Caserta', 'Battipaglia', 'Cosenza',
  'Rimini', 'Pesaro', 'San Benedetto del Tronto', 'Termoli', 'Foggia',
  // Mainland empty spots
  'Cuneo', 'Alessandria', 'Savona', 'La Spezia', 'Siena', 'Grosseto', 'Piombino', 'Livorno', 'Civitavecchia',
  'Terni', 'Taranto', 'Brindisi', 'Matera', 'Crotone', 'Lamezia Terme',
  'Bolzano', 'Belluno', 'Udine', 'Treviso',
  // Sicilia
  'Enna', 'Caltanissetta', 'Siracusa', 'Agrigento', 'Trapani',
  'Marsala', 'Gela', 'Ragusa', 'Taormina', 'Cefalu', 'Mazara del Vallo',
  // Sardegna
  'Olbia', 'Nuoro', 'Oristano', 'Alghero', 'Porto Torres', 'Iglesias', 'Carbonia',
  // Corsica & Elba (REMOVED)
  // Ragnatela Towns
  'Varese', 'Como', 'Bergamo', 'Brescia', 'Cremona', 'Mantova', 'Pavia', 'Lecco', 'Sondrio',
  'Vicenza', 'Rovigo',
  'Asti', 'Biella', 'Vercelli',
  'Ferrara', 'Forli', 'Ravenna',
  'Lucca', 'Pisa', 'Pistoia', 'Massa', 'Carrara',
  'Macerata', 'Ascoli Piceno', 'Teramo', 'Chieti', 'Isernia',
  'Benevento', 'Avellino',
  'Vibo Valentia',
  'Barletta', 'Andria', 'Trani',
  'Caltagirone', 'Sciacca',
  
  // Phase 4: Extreme expansion (150+ cities)
  'Ivrea', 'Pinerolo', 'Alba', 'Bra', 'Domodossola', 'Verbania', 'Arona', 
  'Monza', 'Lodi', 'Crema', 'Treviglio', 'Desenzano del Garda', 'Salo', 
  'Rovereto', 'Merano', 'Bressanone', 'Brunico', 'Cortina d Ampezzo', 
  'Pordenone', 'Gorizia', 'Cervignano', 'Palmanova', 'Portogruaro', 
  'Chioggia', 'Bassano del Grappa', 'Castelfranco Veneto', 'Conegliano', 'Vittorio Veneto',
  'Sassuolo', 'Carpi', 'Imola', 'Faenza', 'Cesena', 'Cattolica', 
  'Fano', 'Senigallia', 'Jesi', 'Fabriano', 'Foligno', 'Spoleto', 
  'Gubbio', 'Citta di Castello', 'Empoli', 'Pontedera', 'Volterra', 'Cecina', 
  'Follonica', 'Orbetello', 'Tarquinia', 'Rieti', 'Avezzano', 'Sulmona', 'Lanciano', 'Vasto',
  'Formia', 'Gaeta', 'Pozzuoli', 'Torre del Greco', 'Castellammare di Stabia', 'Sorrento', 
  'Eboli', 'Sala Consilina', 'Sapri', 'Scalea', 'Paola', 'Amantea', 
  'Gioia Tauro', 'Locri', 'Siderno', 'Rossano', 'Corigliano Calabro', 'Castrovillari', 
  'Policoro', 'Pisticci', 'Francavilla Fontana', 'Ostuni', 'Fasano', 'Monopoli', 
  'Altamura', 'Gravina in Puglia', 'Cerignola', 'Manfredonia', 'San Severo', 'Lucera',
  'Agnone', 'Milazzo', 'Patti', 'Capo d Orlando', 'Corleone', 'Termini Imerese', 
  'Licata', 'Modica', 'Noto', 'Avola', 'Augusta', 'Lentini', 'Piazza Armerina',
  'Bosa', 'Macomer', 'Ozieri', 'Tempio Pausania', 'Arzachena', 'San Teodoro', 
  'Siniscola', 'Tortoli', 'Lanusei', 'Villacidro', 'Sanluri'
];

const connections = [
  // Planes (curved paths, stepwise)
  { source: 'Milano', target: 'Venezia', type: 'plane' },
  { source: 'Milano', target: 'Genova', type: 'plane' },
  { source: 'Venezia', target: 'Roma', type: 'plane' },
  { source: 'Genova', target: 'Roma', type: 'plane' },
  { source: 'Roma', target: 'Napoli', type: 'plane' },
  { source: 'Napoli', target: 'Bari', type: 'plane' },
  { source: 'Napoli', target: 'Palermo', type: 'plane' },
  { source: 'Palermo', target: 'Catania', type: 'plane' },
  { source: 'Roma', target: 'Cagliari', type: 'plane' },
  { source: 'Cagliari', target: 'Palermo', type: 'plane' },
  { source: 'Milano', target: 'Olbia', type: 'plane' },

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
  { source: 'Sassari', target: 'Olbia', type: 'train' },
  { source: 'Olbia', target: 'Cagliari', type: 'train' },
  { source: 'Palermo', target: 'Cefalu', type: 'train' },
  { source: 'Cefalu', target: 'Messina', type: 'train' },
  { source: 'Catania', target: 'Siracusa', type: 'train' },
  { source: 'Siracusa', target: 'Ragusa', type: 'train' },
  { source: 'Ragusa', target: 'Gela', type: 'train' },

  // Cars (OSRM routing - Dense Network)
  { source: 'Torino', target: 'Aosta', type: 'car' },
  { source: 'Torino', target: 'Novara', type: 'car' },
  { source: 'Torino', target: 'Cuneo', type: 'car' },
  { source: 'Torino', target: 'Alessandria', type: 'car' },
  { source: 'Novara', target: 'Milano', type: 'car' },
  { source: 'Cuneo', target: 'Savona', type: 'car' },
  { source: 'Alessandria', target: 'Genova', type: 'car' },
  { source: 'Genova', target: 'Savona', type: 'car' },
  { source: 'Genova', target: 'La Spezia', type: 'car' },
  { source: 'La Spezia', target: 'Piacenza', type: 'car' },
  { source: 'La Spezia', target: 'Piombino', type: 'car' },
  
  // A4 / A1
  { source: 'Milano', target: 'Piacenza', type: 'car' },
  { source: 'Piacenza', target: 'Parma', type: 'car' },
  { source: 'Parma', target: 'Reggio Emilia', type: 'car' },
  { source: 'Reggio Emilia', target: 'Modena', type: 'car' },
  { source: 'Modena', target: 'Bologna', type: 'car' },
  { source: 'Bologna', target: 'Sasso Marconi', type: 'car' },
  { source: 'Sasso Marconi', target: 'Barberino di Mugello', type: 'car' },
  { source: 'Barberino di Mugello', target: 'Firenze', type: 'car' },
  { source: 'Firenze', target: 'Arezzo', type: 'car' },
  { source: 'Firenze', target: 'Siena', type: 'car' },
  { source: 'Firenze', target: 'Livorno', type: 'car' },
  { source: 'Livorno', target: 'Grosseto', type: 'car' },
  { source: 'Siena', target: 'Grosseto', type: 'car' },
  { source: 'Grosseto', target: 'Piombino', type: 'car' },
  { source: 'Grosseto', target: 'Civitavecchia', type: 'car' },
  { source: 'Civitavecchia', target: 'Roma', type: 'car' },
  { source: 'Grosseto', target: 'Viterbo', type: 'car' },

  { source: 'Arezzo', target: 'Perugia', type: 'car' },
  { source: 'Perugia', target: 'Terni', type: 'car' },
  { source: 'Terni', target: 'Roma', type: 'car' },
  { source: 'Perugia', target: 'Orvieto', type: 'car' },
  { source: 'Orvieto', target: 'Viterbo', type: 'car' },
  { source: 'Viterbo', target: 'Roma', type: 'car' },
  { source: 'Roma', target: 'Frosinone', type: 'car' },
  { source: 'Frosinone', target: 'Cassino', type: 'car' },
  { source: 'Cassino', target: 'Caserta', type: 'car' },
  { source: 'Caserta', target: 'Napoli', type: 'car' },
  { source: 'Napoli', target: 'Salerno', type: 'car' },
  { source: 'Salerno', target: 'Battipaglia', type: 'car' },
  { source: 'Battipaglia', target: 'Cosenza', type: 'car' },
  { source: 'Cosenza', target: 'Lamezia Terme', type: 'car' },
  { source: 'Lamezia Terme', target: 'Catanzaro', type: 'car' },
  { source: 'Catanzaro', target: 'Crotone', type: 'car' },
  { source: 'Catanzaro', target: 'Reggio Calabria', type: 'car' },
  
  // Adriatic Coast & South
  { source: 'Bologna', target: 'Forli', type: 'car' },
  { source: 'Forli', target: 'Rimini', type: 'car' },
  { source: 'Rimini', target: 'Pesaro', type: 'car' },
  { source: 'Pesaro', target: 'Ancona', type: 'car' },
  { source: 'Ancona', target: 'Macerata', type: 'car' },
  { source: 'Macerata', target: 'Ascoli Piceno', type: 'car' },
  { source: 'Ascoli Piceno', target: 'San Benedetto del Tronto', type: 'car' },
  { source: 'San Benedetto del Tronto', target: 'Teramo', type: 'car' },
  { source: 'Teramo', target: 'Pescara', type: 'car' },
  { source: 'Pescara', target: 'Chieti', type: 'car' },
  { source: 'Chieti', target: 'Termoli', type: 'car' },
  { source: 'Termoli', target: 'Foggia', type: 'car' },
  { source: 'Foggia', target: 'Barletta', type: 'car' },
  { source: 'Barletta', target: 'Andria', type: 'car' },
  { source: 'Andria', target: 'Trani', type: 'car' },
  { source: 'Trani', target: 'Bari', type: 'car' },
  { source: 'Bari', target: 'Brindisi', type: 'car' },
  { source: 'Brindisi', target: 'Lecce', type: 'car' },
  { source: 'Lecce', target: 'Taranto', type: 'car' },
  { source: 'Taranto', target: 'Matera', type: 'car' },
  { source: 'Matera', target: 'Bari', type: 'car' },
  { source: 'Matera', target: 'Potenza', type: 'car' },
  
  // Campania / Appennini cross
  { source: 'Napoli', target: 'Avellino', type: 'car' },
  { source: 'Avellino', target: 'Benevento', type: 'car' },
  { source: 'Benevento', target: 'Campobasso', type: 'car' },
  { source: 'Campobasso', target: 'Isernia', type: 'car' },
  { source: 'Isernia', target: 'Cassino', type: 'car' },
  { source: 'Benevento', target: 'Foggia', type: 'car' },
  
  // Ragnatela: Nord
  { source: 'Torino', target: 'Asti', type: 'car' },
  { source: 'Asti', target: 'Alessandria', type: 'car' },
  { source: 'Torino', target: 'Biella', type: 'car' },
  { source: 'Biella', target: 'Vercelli', type: 'car' },
  { source: 'Vercelli', target: 'Novara', type: 'car' },
  { source: 'Milano', target: 'Varese', type: 'car' },
  { source: 'Varese', target: 'Como', type: 'car' },
  { source: 'Como', target: 'Lecco', type: 'car' },
  { source: 'Lecco', target: 'Sondrio', type: 'car' },
  { source: 'Milano', target: 'Pavia', type: 'car' },
  { source: 'Pavia', target: 'Piacenza', type: 'car' },
  { source: 'Milano', target: 'Bergamo', type: 'car' },
  { source: 'Bergamo', target: 'Brescia', type: 'car' },
  { source: 'Brescia', target: 'Verona', type: 'car' },
  { source: 'Piacenza', target: 'Cremona', type: 'car' },
  { source: 'Cremona', target: 'Mantova', type: 'car' },
  { source: 'Mantova', target: 'Verona', type: 'car' },
  { source: 'Mantova', target: 'Rovigo', type: 'car' },
  { source: 'Rovigo', target: 'Ferrara', type: 'car' },
  { source: 'Ferrara', target: 'Bologna', type: 'car' },
  { source: 'Ferrara', target: 'Ravenna', type: 'car' },
  { source: 'Ravenna', target: 'Forli', type: 'car' },
  { source: 'Verona', target: 'Vicenza', type: 'car' },
  { source: 'Vicenza', target: 'Padova', type: 'car' },
  
  // Ragnatela: Centro
  { source: 'La Spezia', target: 'Carrara', type: 'car' },
  { source: 'Carrara', target: 'Massa', type: 'car' },
  { source: 'Massa', target: 'Lucca', type: 'car' },
  { source: 'Lucca', target: 'Pisa', type: 'car' },
  { source: 'Pisa', target: 'Livorno', type: 'car' },
  { source: 'Lucca', target: 'Firenze', type: 'car' },
  { source: 'Firenze', target: 'Pistoia', type: 'car' },
  { source: 'Pistoia', target: 'Lucca', type: 'car' },
  { source: 'Siena', target: 'Perugia', type: 'car' },
  
  // Calabria & Sicilia Cross
  { source: 'Lamezia Terme', target: 'Vibo Valentia', type: 'car' },
  { source: 'Vibo Valentia', target: 'Reggio Calabria', type: 'car' },
  { source: 'Catania', target: 'Caltagirone', type: 'car' },
  { source: 'Caltagirone', target: 'Gela', type: 'car' },
  { source: 'Agrigento', target: 'Sciacca', type: 'car' },
  { source: 'Sciacca', target: 'Mazara del Vallo', type: 'car' },
  
  // North-East
  { source: 'Verona', target: 'Bolzano', type: 'car' },
  { source: 'Bolzano', target: 'Trento', type: 'car' },
  { source: 'Venezia', target: 'Treviso', type: 'car' },
  { source: 'Treviso', target: 'Belluno', type: 'car' },
  { source: 'Treviso', target: 'Udine', type: 'car' },
  { source: 'Udine', target: 'Trieste', type: 'car' },
  
  // Other connections
  { source: 'Milano', target: 'Verona', type: 'car' },
  { source: 'Verona', target: 'Padova', type: 'car' },
  { source: 'Padova', target: 'Venezia', type: 'car' },
  { source: 'Roma', target: 'L Aquila', type: 'car' },
  { source: 'L Aquila', target: 'Pescara', type: 'car' },
  { source: 'Napoli', target: 'Campobasso', type: 'car' },
  { source: 'Campobasso', target: 'Foggia', type: 'car' },
  { source: 'Salerno', target: 'Potenza', type: 'car' },
  
  // Sicilia
  { source: 'Messina', target: 'Taormina', type: 'car' },
  { source: 'Taormina', target: 'Catania', type: 'car' },
  { source: 'Catania', target: 'Siracusa', type: 'car' },
  { source: 'Siracusa', target: 'Noto', type: 'car' },
  { source: 'Noto', target: 'Ragusa', type: 'car' },
  { source: 'Ragusa', target: 'Gela', type: 'car' },
  { source: 'Gela', target: 'Agrigento', type: 'car' },
  { source: 'Agrigento', target: 'Mazara del Vallo', type: 'car' },
  { source: 'Mazara del Vallo', target: 'Marsala', type: 'car' },
  { source: 'Marsala', target: 'Trapani', type: 'car' },
  { source: 'Trapani', target: 'Palermo', type: 'car' },
  { source: 'Palermo', target: 'Cefalu', type: 'car' },
  { source: 'Cefalu', target: 'Messina', type: 'car' },
  { source: 'Catania', target: 'Enna', type: 'car' },
  { source: 'Enna', target: 'Caltanissetta', type: 'car' },
  { source: 'Caltanissetta', target: 'Agrigento', type: 'car' },
  { source: 'Palermo', target: 'Enna', type: 'car' },

  // Sardegna
  { source: 'Cagliari', target: 'Villasimius', type: 'car' },
  { source: 'Cagliari', target: 'Carbonia', type: 'car' },
  { source: 'Carbonia', target: 'Iglesias', type: 'car' },
  { source: 'Iglesias', target: 'Oristano', type: 'car' },
  { source: 'Cagliari', target: 'Oristano', type: 'car' },
  { source: 'Oristano', target: 'Nuoro', type: 'car' },
  { source: 'Oristano', target: 'Alghero', type: 'car' },
  { source: 'Alghero', target: 'Sassari', type: 'car' },
  { source: 'Sassari', target: 'Porto Torres', type: 'car' },
  { source: 'Sassari', target: 'Olbia', type: 'car' },
  { source: 'Nuoro', target: 'Olbia', type: 'car' },
  
  // Ferries
  { source: 'Genova', target: 'Porto Torres', type: 'ferry' },
  { source: 'Livorno', target: 'Olbia', type: 'ferry' },
  { source: 'Napoli', target: 'Palermo', type: 'ferry' },
  { source: 'Civitavecchia', target: 'Olbia', type: 'ferry' },

  // Extreme expansion routes
  { source: 'Torino', target: 'Ivrea', type: 'car' },
  { source: 'Torino', target: 'Pinerolo', type: 'car' },
  { source: 'Torino', target: 'Alba', type: 'car' },
  { source: 'Alba', target: 'Bra', type: 'car' },
  { source: 'Bra', target: 'Cuneo', type: 'car' },
  { source: 'Novara', target: 'Arona', type: 'car' },
  { source: 'Arona', target: 'Verbania', type: 'car' },
  { source: 'Verbania', target: 'Domodossola', type: 'car' },
  { source: 'Milano', target: 'Monza', type: 'car' },
  { source: 'Monza', target: 'Lecco', type: 'car' },
  { source: 'Milano', target: 'Lodi', type: 'car' },
  { source: 'Lodi', target: 'Piacenza', type: 'car' },
  { source: 'Milano', target: 'Crema', type: 'car' },
  { source: 'Crema', target: 'Cremona', type: 'car' },
  { source: 'Milano', target: 'Treviglio', type: 'car' },
  { source: 'Treviglio', target: 'Bergamo', type: 'car' },
  { source: 'Brescia', target: 'Desenzano del Garda', type: 'car' },
  { source: 'Desenzano del Garda', target: 'Salo', type: 'car' },
  { source: 'Salo', target: 'Riva del Garda', type: 'car' }, // we don't have Riva
  { source: 'Verona', target: 'Rovereto', type: 'car' },
  { source: 'Rovereto', target: 'Trento', type: 'car' },
  { source: 'Bolzano', target: 'Merano', type: 'car' },
  { source: 'Bolzano', target: 'Bressanone', type: 'car' },
  { source: 'Bressanone', target: 'Brunico', type: 'car' },
  { source: 'Belluno', target: 'Cortina d Ampezzo', type: 'car' },
  { source: 'Treviso', target: 'Conegliano', type: 'car' },
  { source: 'Conegliano', target: 'Vittorio Veneto', type: 'car' },
  { source: 'Treviso', target: 'Castelfranco Veneto', type: 'car' },
  { source: 'Vicenza', target: 'Bassano del Grappa', type: 'car' },
  { source: 'Bassano del Grappa', target: 'Trento', type: 'car' },
  { source: 'Padova', target: 'Chioggia', type: 'car' },
  { source: 'Venezia', target: 'Chioggia', type: 'car' },
  { source: 'Udine', target: 'Gorizia', type: 'car' },
  { source: 'Gorizia', target: 'Trieste', type: 'car' },
  { source: 'Udine', target: 'Palmanova', type: 'car' },
  { source: 'Palmanova', target: 'Cervignano', type: 'car' },
  { source: 'Venezia', target: 'Portogruaro', type: 'car' },
  { source: 'Portogruaro', target: 'Pordenone', type: 'car' },
  { source: 'Pordenone', target: 'Udine', type: 'car' },
  { source: 'Modena', target: 'Sassuolo', type: 'car' },
  { source: 'Modena', target: 'Carpi', type: 'car' },
  { source: 'Bologna', target: 'Imola', type: 'car' },
  { source: 'Imola', target: 'Faenza', type: 'car' },
  { source: 'Faenza', target: 'Forli', type: 'car' },
  { source: 'Forli', target: 'Cesena', type: 'car' },
  { source: 'Cesena', target: 'Rimini', type: 'car' },
  { source: 'Rimini', target: 'Cattolica', type: 'car' },
  { source: 'Cattolica', target: 'Pesaro', type: 'car' },
  { source: 'Pesaro', target: 'Fano', type: 'car' },
  { source: 'Fano', target: 'Senigallia', type: 'car' },
  { source: 'Senigallia', target: 'Ancona', type: 'car' },
  { source: 'Ancona', target: 'Jesi', type: 'car' },
  { source: 'Jesi', target: 'Fabriano', type: 'car' },
  { source: 'Fabriano', target: 'Foligno', type: 'car' },
  { source: 'Perugia', target: 'Foligno', type: 'car' },
  { source: 'Foligno', target: 'Spoleto', type: 'car' },
  { source: 'Spoleto', target: 'Terni', type: 'car' },
  { source: 'Perugia', target: 'Gubbio', type: 'car' },
  { source: 'Gubbio', target: 'Citta di Castello', type: 'car' },
  { source: 'Citta di Castello', target: 'Arezzo', type: 'car' },
  { source: 'Firenze', target: 'Empoli', type: 'car' },
  { source: 'Empoli', target: 'Pontedera', type: 'car' },
  { source: 'Pontedera', target: 'Pisa', type: 'car' },
  { source: 'Pontedera', target: 'Volterra', type: 'car' },
  { source: 'Livorno', target: 'Cecina', type: 'car' },
  { source: 'Cecina', target: 'Volterra', type: 'car' },
  { source: 'Cecina', target: 'Follonica', type: 'car' },
  { source: 'Follonica', target: 'Grosseto', type: 'car' },
  { source: 'Grosseto', target: 'Orbetello', type: 'car' },
  { source: 'Orbetello', target: 'Tarquinia', type: 'car' },
  { source: 'Tarquinia', target: 'Civitavecchia', type: 'car' },
  { source: 'Terni', target: 'Rieti', type: 'car' },
  { source: 'Rieti', target: 'L Aquila', type: 'car' },
  { source: 'L Aquila', target: 'Avezzano', type: 'car' },
  { source: 'Avezzano', target: 'Sulmona', type: 'car' },
  { source: 'Sulmona', target: 'Pescara', type: 'car' },
  { source: 'Pescara', target: 'Lanciano', type: 'car' },
  { source: 'Lanciano', target: 'Vasto', type: 'car' },
  { source: 'Vasto', target: 'Termoli', type: 'car' },
  { source: 'Latina', target: 'Formia', type: 'car' }, // don't have Latina, let's use Frosinone
  { source: 'Frosinone', target: 'Formia', type: 'car' },
  { source: 'Formia', target: 'Gaeta', type: 'car' },
  { source: 'Napoli', target: 'Pozzuoli', type: 'car' },
  { source: 'Napoli', target: 'Torre del Greco', type: 'car' },
  { source: 'Torre del Greco', target: 'Castellammare di Stabia', type: 'car' },
  { source: 'Castellammare di Stabia', target: 'Sorrento', type: 'car' },
  { source: 'Battipaglia', target: 'Eboli', type: 'car' },
  { source: 'Eboli', target: 'Sala Consilina', type: 'car' },
  { source: 'Sala Consilina', target: 'Sapri', type: 'car' },
  { source: 'Sapri', target: 'Scalea', type: 'car' },
  { source: 'Scalea', target: 'Paola', type: 'car' },
  { source: 'Paola', target: 'Amantea', type: 'car' },
  { source: 'Amantea', target: 'Lamezia Terme', type: 'car' },
  { source: 'Vibo Valentia', target: 'Gioia Tauro', type: 'car' },
  { source: 'Gioia Tauro', target: 'Reggio Calabria', type: 'car' },
  { source: 'Reggio Calabria', target: 'Locri', type: 'car' },
  { source: 'Locri', target: 'Siderno', type: 'car' },
  { source: 'Siderno', target: 'Catanzaro', type: 'car' },
  { source: 'Crotone', target: 'Rossano', type: 'car' },
  { source: 'Rossano', target: 'Corigliano Calabro', type: 'car' },
  { source: 'Corigliano Calabro', target: 'Castrovillari', type: 'car' },
  { source: 'Castrovillari', target: 'Policoro', type: 'car' },
  { source: 'Policoro', target: 'Pisticci', type: 'car' },
  { source: 'Pisticci', target: 'Taranto', type: 'car' },
  { source: 'Taranto', target: 'Francavilla Fontana', type: 'car' },
  { source: 'Francavilla Fontana', target: 'Brindisi', type: 'car' },
  { source: 'Brindisi', target: 'Ostuni', type: 'car' },
  { source: 'Ostuni', target: 'Fasano', type: 'car' },
  { source: 'Fasano', target: 'Monopoli', type: 'car' },
  { source: 'Monopoli', target: 'Bari', type: 'car' },
  { source: 'Matera', target: 'Altamura', type: 'car' },
  { source: 'Altamura', target: 'Gravina in Puglia', type: 'car' },
  { source: 'Foggia', target: 'Cerignola', type: 'car' },
  { source: 'Cerignola', target: 'Barletta', type: 'car' },
  { source: 'Foggia', target: 'Manfredonia', type: 'car' },
  { source: 'Foggia', target: 'San Severo', type: 'car' },
  { source: 'San Severo', target: 'Lucera', type: 'car' },
  { source: 'Isernia', target: 'Agnone', type: 'car' },
  { source: 'Messina', target: 'Milazzo', type: 'car' },
  { source: 'Milazzo', target: 'Patti', type: 'car' },
  { source: 'Patti', target: 'Capo d Orlando', type: 'car' },
  { source: 'Capo d Orlando', target: 'Cefalu', type: 'car' },
  { source: 'Palermo', target: 'Corleone', type: 'car' },
  { source: 'Palermo', target: 'Termini Imerese', type: 'car' },
  { source: 'Termini Imerese', target: 'Cefalu', type: 'car' },
  { source: 'Gela', target: 'Licata', type: 'car' },
  { source: 'Licata', target: 'Agrigento', type: 'car' },
  { source: 'Ragusa', target: 'Modica', type: 'car' },
  { source: 'Modica', target: 'Noto', type: 'car' },
  { source: 'Noto', target: 'Avola', type: 'car' },
  { source: 'Avola', target: 'Siracusa', type: 'car' },
  { source: 'Siracusa', target: 'Augusta', type: 'car' },
  { source: 'Augusta', target: 'Lentini', type: 'car' },
  { source: 'Lentini', target: 'Catania', type: 'car' },
  { source: 'Enna', target: 'Piazza Armerina', type: 'car' },
  { source: 'Piazza Armerina', target: 'Caltagirone', type: 'car' },
  { source: 'Alghero', target: 'Bosa', type: 'car' },
  { source: 'Bosa', target: 'Oristano', type: 'car' },
  { source: 'Oristano', target: 'Macomer', type: 'car' },
  { source: 'Macomer', target: 'Sassari', type: 'car' },
  { source: 'Sassari', target: 'Ozieri', type: 'car' },
  { source: 'Ozieri', target: 'Nuoro', type: 'car' },
  { source: 'Sassari', target: 'Tempio Pausania', type: 'car' },
  { source: 'Tempio Pausania', target: 'Olbia', type: 'car' },
  { source: 'Olbia', target: 'Arzachena', type: 'car' },
  { source: 'Olbia', target: 'San Teodoro', type: 'car' },
  { source: 'San Teodoro', target: 'Siniscola', type: 'car' },
  { source: 'Siniscola', target: 'Nuoro', type: 'car' },
  { source: 'Nuoro', target: 'Tortoli', type: 'car' },
  { source: 'Tortoli', target: 'Lanusei', type: 'car' },
  { source: 'Oristano', target: 'Villacidro', type: 'car' },
  { source: 'Villacidro', target: 'Carbonia', type: 'car' },
  { source: 'Oristano', target: 'Sanluri', type: 'car' },
  { source: 'Sanluri', target: 'Cagliari', type: 'car' },
  { source: 'Rovigo', target: 'Trieste', type: 'ferry' },
];

async function geocode(townName) {
  const query = townName.includes(',') ? townName : `${townName}, Italy`;
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

function getPlaneGeometry(source, target) {
  const points = [];
  const steps = 20;
  
  const mx = (source.lng + target.lng) / 2;
  const my = (source.lat + target.lat) / 2;
  
  const dx = target.lng - source.lng;
  const dy = target.lat - source.lat;
  
  const nx = -dy;
  const ny = dx;
  
  const offset = 0.2;
  const cx = mx + nx * offset;
  const cy = my + ny * offset;
  
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const mt = 1 - t;
    const x = mt*mt * source.lng + 2*mt*t * cx + t*t * target.lng;
    const y = mt*mt * source.lat + 2*mt*t * cy + t*t * target.lat;
    points.push([x, y]);
  }
  
  return points;
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
      if (conn.type === 'car' || conn.type === 'train' || conn.type === 'ferry') {
        await new Promise(r => setTimeout(r, 200));
        geometry = await getRouteGeometry(sourceNode, targetNode);
      } else if (conn.type === 'plane') {
        geometry = getPlaneGeometry(sourceNode, targetNode);
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
