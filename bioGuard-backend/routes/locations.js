
const express = require('express');
const router = express.Router();

const LOCATIONS = [

{ name: 'Kaziranga National Park — Western Range', state: 'Assam', lat: 26.578, lng: 93.041, type: 'National Park', description: 'UNESCO World Heritage Site. Largest one-horned rhino population.' },
{ name: 'Kaziranga National Park — Eastern Range', state: 'Assam', lat: 26.600, lng: 93.450, type: 'National Park', description: 'High tiger density. Elephant movement corridor.' },
{ name: 'Kaziranga — Kohora Core Zone', state: 'Assam', lat: 26.571, lng: 93.168, type: 'National Park', description: 'Central Kaziranga administrative zone.' },
{ name: 'Kaziranga Buffer — Bagori Range', state: 'Assam', lat: 26.545, lng: 93.052, type: 'Buffer Zone', description: 'Human-wildlife conflict hotspot. Tea estates nearby.' },
{ name: 'Manas National Park — Core Zone', state: 'Assam', lat: 26.742, lng: 90.980, type: 'National Park', description: 'UNESCO World Heritage Site. Golden Langur & Bengal tiger.' },
{ name: 'Manas Buffer Zone — Basbari Village', state: 'Assam', lat: 26.708, lng: 90.955, type: 'Buffer Zone', description: 'Seasonal wildfire risk. Beki River corridor.' },
{ name: 'Orang National Park — North Bank', state: 'Assam', lat: 26.493, lng: 92.246, type: 'National Park', description: 'Mini Kaziranga. Brahmaputra north bank rhino habitat.' },
{ name: 'Dibru-Saikhowa National Park', state: 'Assam', lat: 27.467, lng: 95.254, type: 'National Park', description: 'Feral horse habitat. Brahmaputra river islands.' },
{ name: 'Dibru-Saikhowa — Guijan Ghat', state: 'Assam', lat: 27.472, lng: 95.290, type: 'Ferry/Entry Point', description: 'River ferry access point. Dolphin sighting zone.' },
{ name: 'Bornadi Wildlife Sanctuary', state: 'Assam', lat: 26.850, lng: 91.688, type: 'Wildlife Sanctuary', description: 'Pygmy Hog habitat. Forest corridor link.' },
{ name: 'Pobitora Wildlife Sanctuary', state: 'Assam', lat: 26.212, lng: 91.978, type: 'Wildlife Sanctuary', description: 'Highest rhino density per sqkm globally.' },
{ name: 'Laokhowa Wildlife Sanctuary', state: 'Assam', lat: 26.441, lng: 92.686, type: 'Wildlife Sanctuary', description: 'Wetland bird sanctuary near Brahmaputra.' },
{ name: 'NH-37 — Bokakhat Wildlife Crossing', state: 'Assam', lat: 26.637, lng: 93.601, type: 'Conflict Hotspot', description: 'Major elephant-vehicle conflict zone on Kaziranga highway.' },
{ name: 'Golaghat Forest Division — Doyang Corridor', state: 'Assam', lat: 26.511, lng: 93.975, type: 'Forest Division', description: 'Assam-Nagaland border poaching corridor.' },
{ name: 'Chariduar Tea Estate', state: 'Assam', lat: 26.492, lng: 92.232, type: 'Conflict Hotspot', description: 'Tiger straying into plantation. HWC hotspot.' },
{ name: 'Dehing Patkai Elephant Reserve', state: 'Assam', lat: 27.279, lng: 95.499, type: 'Elephant Reserve', description: 'Largest rainforest in India east of Assam.' },

{ name: 'Namdapha National Park — Core Zone', state: 'Arunachal Pradesh', lat: 27.493, lng: 96.394, type: 'National Park', description: 'Four big cat species. Largest protected area in NE India.' },
{ name: 'Namdapha — Miao Buffer Zone', state: 'Arunachal Pradesh', lat: 27.541, lng: 96.247, type: 'Buffer Zone', description: 'Deforestation hotspot. Miao market logging route.' },
{ name: 'Pakke Tiger Reserve — Core', state: 'Arunachal Pradesh', lat: 27.023, lng: 93.218, type: 'Tiger Reserve', description: 'Hornbill nesting forest. Community anti-poaching initiative.' },
{ name: 'Pakke — Seijosa Eco-Sensitive Zone', state: 'Arunachal Pradesh', lat: 26.978, lng: 93.186, type: 'Eco-Sensitive Zone', description: 'Buffer village area. Jhum cultivation pressure.' },
{ name: 'Eaglenest Wildlife Sanctuary', state: 'Arunachal Pradesh', lat: 27.033, lng: 92.380, type: 'Wildlife Sanctuary', description: 'Highest avian biodiversity in Asia. Bugun Liocichla.' },
{ name: 'Dibang Wildlife Sanctuary', state: 'Arunachal Pradesh', lat: 28.640, lng: 95.890, type: 'Wildlife Sanctuary', description: 'Clouded leopard and Snow leopard habitat.' },
{ name: 'Kamlang Wildlife Sanctuary', state: 'Arunachal Pradesh', lat: 27.800, lng: 96.320, type: 'Wildlife Sanctuary', description: 'Hollock gibbon and tiger corridor.' },
{ name: 'Hollongapar Gibbon Sanctuary', state: 'Arunachal Pradesh', lat: 26.802, lng: 94.561, type: 'Wildlife Sanctuary', description: 'Only hoolock gibbon sanctuary in India.' },

{ name: 'Keibul Lamjao National Park', state: 'Manipur', lat: 24.508, lng: 93.891, type: 'National Park', description: 'Only floating national park. Sangai (Brow-antlered deer) habitat.' },
{ name: 'Keibul Lamjao — Section 7B', state: 'Manipur', lat: 24.519, lng: 93.908, type: 'Poaching Hotspot', description: 'Camera trap zone. Known poaching entry point.' },
{ name: 'Loktak Lake — Sendra Island', state: 'Manipur', lat: 24.542, lng: 93.915, type: 'Ramsar Wetland', description: 'Largest freshwater lake in NE India. Fishery zone.' },
{ name: 'Yangoupokpi-Lokchao Wildlife Sanctuary', state: 'Manipur', lat: 24.800, lng: 94.200, type: 'Wildlife Sanctuary', description: 'Tiger corridor linking Myanmar border areas.' },
{ name: 'Shiroi National Park', state: 'Manipur', lat: 25.312, lng: 94.239, type: 'National Park', description: 'Shiroi lily endemic habitat. Biodiversity hotspot.' },

{ name: 'Balpakram National Park', state: 'Meghalaya', lat: 25.159, lng: 90.861, type: 'National Park', description: 'Land of eternal winds. Barato corridor. Tiger habitat.' },
{ name: 'Nokrek National Park — Core', state: 'Meghalaya', lat: 25.426, lng: 90.356, type: 'National Park', description: 'UNESCO Biosphere Reserve. Red Panda buffer zone.' },
{ name: 'Nokrek — Sibbari Eco-Sensitive', state: 'Meghalaya', lat: 25.398, lng: 90.328, type: 'Eco-Sensitive Zone', description: 'Gaur-human conflict zone. Village periphery.' },
{ name: 'Garo Hills — Tura Range', state: 'Meghalaya', lat: 25.513, lng: 90.219, type: 'Forest Division', description: 'GLAD deforestation alert cluster. Active logging.' },
{ name: 'Nongkhyllem Wildlife Sanctuary', state: 'Meghalaya', lat: 25.900, lng: 91.766, type: 'Wildlife Sanctuary', description: 'Hoolock gibbon and leopard. Near Shillong.' },
{ name: 'Umling Wildlife Sanctuary', state: 'Meghalaya', lat: 25.310, lng: 92.100, type: 'Wildlife Sanctuary', description: 'Part of northeast India biodiversity hotspot.' },
{ name: 'Baghmara Reserve Forest', state: 'Meghalaya', lat: 25.192, lng: 90.627, type: 'Reserve Forest', description: 'Leopard cat sighting zone. Community HWC area.' },

{ name: 'Dzukou Valley — Main Ridge', state: 'Nagaland', lat: 25.509, lng: 94.082, type: 'Protected Area', description: 'Dzukou lily endemic habitat. Seasonal fire risk.' },
{ name: 'Dzukou Valley — Viswema Track', state: 'Nagaland', lat: 25.497, lng: 94.076, type: 'Trekking Corridor', description: 'Main trekking route. Wildfire flame front concern.' },
{ name: 'Intanki National Park', state: 'Nagaland', lat: 25.970, lng: 93.730, type: 'National Park', description: 'Elephant and tiger corridor bordering Assam.' },
{ name: 'Singphan Wildlife Sanctuary', state: 'Nagaland', lat: 26.602, lng: 94.862, type: 'Wildlife Sanctuary', description: 'Forest cover loss zone. Longleng subsistence farming.' },
{ name: 'Fakim Wildlife Sanctuary', state: 'Nagaland', lat: 25.970, lng: 94.800, type: 'Wildlife Sanctuary', description: 'India-Myanmar border area. Clouded leopard habitat.' },

{ name: 'Khangchendzonga National Park', state: 'Sikkim', lat: 27.600, lng: 88.200, type: 'National Park', description: 'UNESCO World Heritage. Snow Leopard and Red Panda.' },
{ name: 'Khangchendzonga Buffer — Yuksom', state: 'Sikkim', lat: 27.448, lng: 88.248, type: 'Buffer Zone', description: 'Trek base camp. HWC and RADD deforestation alerts.' },
{ name: 'Barsey Rhododendron Sanctuary', state: 'Sikkim', lat: 27.200, lng: 88.068, type: 'Wildlife Sanctuary', description: 'Red Panda focus area. Alpine meadow habitat.' },
{ name: 'Fambong Lho Wildlife Sanctuary', state: 'Sikkim', lat: 27.330, lng: 88.570, type: 'Wildlife Sanctuary', description: 'Clouded leopard sightings recorded.' },

{ name: 'Dampa Tiger Reserve', state: 'Mizoram', lat: 24.072, lng: 92.407, type: 'Tiger Reserve', description: 'Largest wildlife sanctuary in Mizoram. Leopard tiger.' },
{ name: 'Murlen National Park', state: 'Mizoram', lat: 23.625, lng: 93.386, type: 'National Park', description: 'Hump-backed Mahseer fish. Phawngpui Biosphere.' },
{ name: 'Mizoram Forest Zone — Lunglei District', state: 'Mizoram', lat: 23.820, lng: 92.420, type: 'Forest Division', description: 'GLAD-S2 alert zone. Shifting cultivation edge.' },

{ name: 'Sepahijala Wildlife Sanctuary', state: 'Tripura', lat: 23.550, lng: 91.320, type: 'Wildlife Sanctuary', description: 'Clouded leopard and spectacled monkey habitat.' },
{ name: 'Trishna Wildlife Sanctuary', state: 'Tripura', lat: 23.280, lng: 91.620, type: 'Wildlife Sanctuary', description: 'Largest WS in Tripura. Bison and elephant.' },
{ name: 'Tripura Forest Corridor', state: 'Tripura', lat: 23.700, lng: 91.580, type: 'Forest Corridor', description: 'GLAD alert area. Linear infrastructure pressure.' }];


const STATES = [
{ name: 'Assam', capital: 'Dispur', lat: 26.1, lng: 92.0 },
{ name: 'Arunachal Pradesh', capital: 'Itanagar', lat: 27.0, lng: 94.0 },
{ name: 'Manipur', capital: 'Imphal', lat: 24.8, lng: 93.9 },
{ name: 'Meghalaya', capital: 'Shillong', lat: 25.5, lng: 91.9 },
{ name: 'Mizoram', capital: 'Aizawl', lat: 23.7, lng: 92.7 },
{ name: 'Nagaland', capital: 'Kohima', lat: 25.7, lng: 94.1 },
{ name: 'Sikkim', capital: 'Gangtok', lat: 27.3, lng: 88.6 },
{ name: 'Tripura', capital: 'Agartala', lat: 23.8, lng: 91.3 },
{ name: 'West Bengal', capital: 'Kolkata', lat: 22.6, lng: 88.4 },
{ name: 'Uttarakhand', capital: 'Dehradun', lat: 30.3, lng: 78.0 }];


router.get('/suggestions', (req, res) => {
  const { q = '', state, type, limit = 30 } = req.query;
  const lim = Math.min(parseInt(limit) || 30, 100);

  let results = LOCATIONS;

  if (q) {
    const lower = q.toLowerCase();
    results = results.filter((l) =>
    l.name.toLowerCase().includes(lower) ||
    l.state.toLowerCase().includes(lower) ||
    l.description.toLowerCase().includes(lower) ||
    l.type.toLowerCase().includes(lower)
    );
  }

  if (state) {
    results = results.filter((l) => l.state.toLowerCase().includes(state.toLowerCase()));
  }

  if (type) {
    results = results.filter((l) => l.type.toLowerCase().includes(type.toLowerCase()));
  }

  res.json({
    locations: results.slice(0, lim),
    total: results.length,
    states: STATES,
    types: [...new Set(LOCATIONS.map((l) => l.type))].sort()
  });
});

router.get('/states', (req, res) => {
  res.json({ states: STATES, count: STATES.length });
});

router.get('/hotspots', (req, res) => {
  const hotspots = LOCATIONS.filter((l) =>
  ['Conflict Hotspot', 'Poaching Hotspot', 'Buffer Zone', 'Eco-Sensitive Zone'].includes(l.type)
  );
  res.json({ hotspots, count: hotspots.length });
});

module.exports = router;