// Données figées : une copie d'une vraie réponse de l'API du
// Cleveland Museum of Art (recherche « landscape »), prise le 12 nov. 2026.
// Elles servent seulement si l'API ne répond pas.
const FROZEN_ARTWORKS = [
 {
  "id": 147016,
  "title": "Virgin and Child in a Landscape",
  "creators": [
   {
    "description": "Jan Gossaert (Flemish, c. 1475/78–1532)"
   }
  ],
  "creation_date": "1531",
  "images": {
   "web": {
    "url": "https://openaccess-cdn.clevelandart.org/1972.47/1972.47_web.jpg"
   }
  }
 },
 {
  "id": 152006,
  "title": "Rocky, Wooded Landscape with a Dell and Weir",
  "creators": [
   {
    "description": "Thomas Gainsborough (British, 1727–1788)"
   }
  ],
  "creation_date": "c. 1782–1783",
  "images": {
   "web": {
    "url": "https://openaccess-cdn.clevelandart.org/1984.59/1984.59_web.jpg"
   }
  }
 },
 {
  "id": 151298,
  "title": "Prater Landscape",
  "creators": [
   {
    "description": "Ferdinand Georg Waldmüller (Austrian, 1793–1865)"
   }
  ],
  "creation_date": "c. 1831",
  "images": {
   "web": {
    "url": "https://openaccess-cdn.clevelandart.org/1983.155/1983.155_web.jpg"
   }
  }
 },
 {
  "id": 171296,
  "title": "Vale of Kashmir",
  "creators": [
   {
    "description": "Robert S. Duncanson (American, 1821–1872)"
   }
  ],
  "creation_date": "1867",
  "images": {
   "web": {
    "url": "https://openaccess-cdn.clevelandart.org/2014.12/2014.12_web.jpg"
   }
  }
 },
 {
  "id": 111066,
  "title": "Saint Jerome in a Landscape",
  "creators": [
   {
    "description": "Domenico Campagnola (Italian, 1500–1564)"
   }
  ],
  "creation_date": "c. 1530",
  "images": {
   "web": {
    "url": "https://openaccess-cdn.clevelandart.org/1929.557/1929.557_web.jpg"
   }
  }
 },
 {
  "id": 139454,
  "title": "Landscape",
  "creators": [
   {
    "description": "Sōami (Japanese, d. 1525)"
   }
  ],
  "creation_date": "early 1500s",
  "images": {
   "web": {
    "url": "https://openaccess-cdn.clevelandart.org/1963.262/1963.262_web.jpg"
   }
  }
 },
 {
  "id": 148739,
  "title": "Landscape with Large Trees",
  "creators": [
   {
    "description": "Gustave Courbet (French, 1819–1877)"
   }
  ],
  "creation_date": "c. 1870",
  "images": {
   "web": {
    "url": "https://openaccess-cdn.clevelandart.org/1976.18/1976.18_web.jpg"
   }
  }
 },
 {
  "id": 79932,
  "title": "Landscape with Fishermen",
  "creators": [
   {
    "description": "Yi Bul-hae (Korean, active 1500s)"
   }
  ],
  "creation_date": "1600s",
  "images": {
   "web": {
    "url": "https://openaccess-cdn.clevelandart.org/2015.516/2015.516_web.jpg"
   }
  }
 },
 {
  "id": 125873,
  "title": "Shepherds in a Landscape",
  "creators": [
   {
    "description": "Giulio Campagnola (Italian, 1482–1515)"
   }
  ],
  "creation_date": "c. 1517",
  "images": {
   "web": {
    "url": "https://openaccess-cdn.clevelandart.org/1948.12/1948.12_web.jpg"
   }
  }
 },
 {
  "id": 143234,
  "title": "Landscape with a Windmill",
  "creators": [
   {
    "description": "Jacob van Ruisdael (Dutch, 1628/29–1682)"
   }
  ],
  "creation_date": "1646",
  "images": {
   "web": {
    "url": "https://openaccess-cdn.clevelandart.org/1967.19/1967.19_web.jpg"
   }
  }
 },
 {
  "id": 143602,
  "title": "Low Waterfall in a Wooded Landscape with a Dead Beech Tree",
  "creators": [
   {
    "description": "Jacob van Ruisdael (Dutch, 1628/29–1682)"
   }
  ],
  "creation_date": "c. 1660–70",
  "images": {
   "web": {
    "url": "https://openaccess-cdn.clevelandart.org/1967.63/1967.63_web.jpg"
   }
  }
 },
 {
  "id": 83635,
  "title": "Breton Landscape",
  "creators": [
   {
    "description": "Jan Verkade (Dutch, 1868–1946)"
   }
  ],
  "creation_date": "1891–92",
  "images": {
   "web": {
    "url": "https://openaccess-cdn.clevelandart.org/2020.117/2020.117_web.jpg"
   }
  }
 },
 {
  "id": 159501,
  "title": "Landscape with Peasants Dancing",
  "creators": [
   {
    "description": "David Teniers (Flemish, 1610–1690)"
   }
  ],
  "creation_date": "c. 1645–50",
  "images": {
   "web": {
    "url": "https://openaccess-cdn.clevelandart.org/1996.271/1996.271_web.jpg"
   }
  }
 },
 {
  "id": 149768,
  "title": "Saint John the Baptist in a Landscape",
  "creators": [
   {
    "description": "Petrus Christus (Netherlandish, c. 1410–1475/76)"
   }
  ],
  "creation_date": "c. 1445",
  "images": {
   "web": {
    "url": "https://openaccess-cdn.clevelandart.org/1979.80/1979.80_web.jpg"
   }
  }
 },
 {
  "id": 149417,
  "title": "Landscape with Gentle Peaks",
  "creators": [
   {
    "description": "Kan Tenju (Japanese, 1727–1795)"
   }
  ],
  "creation_date": "possibly 1800s",
  "images": {
   "web": {
    "url": "https://openaccess-cdn.clevelandart.org/1978.7/1978.7_web.jpg"
   }
  }
 },
 {
  "id": 112586,
  "title": "Venus Reclining in a Landscape",
  "creators": [
   {
    "description": "Giulio Campagnola (Italian, 1482–1515)"
   }
  ],
  "creation_date": "c. 1508–9",
  "images": {
   "web": {
    "url": "https://openaccess-cdn.clevelandart.org/1931.205/1931.205_web.jpg"
   }
  }
 },
 {
  "id": 141639,
  "title": "Twilight in the Wilderness",
  "creators": [
   {
    "description": "Frederic Edwin Church (American, 1826–1900)"
   }
  ],
  "creation_date": "1860",
  "images": {
   "web": {
    "url": "https://openaccess-cdn.clevelandart.org/1965.233/1965.233_web.jpg"
   }
  }
 },
 {
  "id": 159769,
  "title": "Italian Landscape",
  "creators": [
   {
    "description": "John Robert Cozens (British, 1752–1797)"
   }
  ],
  "creation_date": "c. 1790–92",
  "images": {
   "web": {
    "url": "https://openaccess-cdn.clevelandart.org/1997.137/1997.137_web.jpg"
   }
  }
 }
];

const FROZEN_CREATORS = [
 "Jan Gossaert (Flemish, c. 1475/78–1532)",
 "Thomas Gainsborough (British, 1727–1788)",
 "Ferdinand Georg Waldmüller (Austrian, 1793–1865)",
 "Robert S. Duncanson (American, 1821–1872)",
 "Domenico Campagnola (Italian, 1500–1564)",
 "Sōami (Japanese, d. 1525)",
 "Gustave Courbet (French, 1819–1877)",
 "Yi Bul-hae (Korean, active 1500s)",
 "Giulio Campagnola (Italian, 1482–1515)",
 "Jacob van Ruisdael (Dutch, 1628/29–1682)",
 "Jan Verkade (Dutch, 1868–1946)",
 "David Teniers (Flemish, 1610–1690)",
 "Petrus Christus (Netherlandish, c. 1410–1475/76)",
 "Kan Tenju (Japanese, 1727–1795)",
 "Frederic Edwin Church (American, 1826–1900)",
 "John Robert Cozens (British, 1752–1797)"
];
