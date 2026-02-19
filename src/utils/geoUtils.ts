// Haversine distance between two lat/lng points in km
export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Points based on distance (closer = more points)
export function calculatePoints(distance: number): number {
  if (distance < 50) return 5000;
  if (distance < 150) return 4000;
  if (distance < 350) return 3000;
  if (distance < 750) return 2000;
  if (distance < 1500) return 1000;
  if (distance < 3000) return 500;
  return 0;
}

// Sample locations with lat/lng and image URLs (using Wikimedia Commons for images)
export const LOCATIONS = [
  {
    name: 'Eiffel Tower',
    lat: 48.8584,
    lng: 2.2945,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Tour_Eiffel_Wikimedia_Commons.jpg/800px-Tour_Eiffel_Wikimedia_Commons.jpg',
    hint: 'Iconic iron lattice tower in Europe'
  },
  {
    name: 'Statue of Liberty',
    lat: 40.6892,
    lng: -74.0445,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Statue_of_Liberty_7.jpg/800px-Statue_of_Liberty_7.jpg',
    hint: 'Gift from France to the United States'
  },
  {
    name: 'Sydney Opera House',
    lat: -33.8568,
    lng: 151.2153,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Sydney_Opera_House_-_Dec_2008.jpg/800px-Sydney_Opera_House_-_Dec_2008.jpg',
    hint: 'Famous performing arts center in Australia'
  },
  {
    name: 'Machu Picchu',
    lat: -13.1631,
    lng: -72.5450,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Machu_Picchu%2C_Peru.jpg/800px-Machu_Picchu%2C_Peru.jpg',
    hint: 'Ancient Incan citadel in South America'
  },
  {
    name: 'Great Wall of China',
    lat: 40.4319,
    lng: 116.5704,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/2008_07_26_great_wall_8285.jpg/800px-2008_07_26_great_wall_8285.jpg',
    hint: 'Longest man-made structure in the world'
  },
  {
    name: 'Taj Mahal',
    lat: 27.1751,
    lng: 78.0421,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Taj-Mahal_Agra-India.jpg/800px-Taj-Mahal_Agra-India.jpg',
    hint: 'White marble mausoleum in India'
  },
  {
    name: 'Christ the Redeemer',
    lat: -22.9519,
    lng: -43.2105,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Christ_the_Redeemer_-_Rio_de_Janeiro%2C_Brazil.jpg/800px-Christ_the_Redeemer_-_Rio_de_Janeiro%2C_Brazil.jpg',
    hint: 'Iconic statue overlooking a Brazilian city'
  },
  {
    name: 'Colosseum',
    lat: 41.8902,
    lng: 12.4922,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Colosseum_in_Rome%2C_Italy_-_April_2007.jpg/800px-Colosseum_in_Rome%2C_Italy_-_April_2007.jpg',
    hint: 'Ancient amphitheater in Rome'
  },
  {
    name: 'Petra',
    lat: 30.3285,
    lng: 35.4444,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/AdDeir_BW_21.JPG/800px-AdDeir_BW_21.JPG',
    hint: 'Archaeological site carved into red cliffs'
  },
  {
    name: 'Mount Fuji',
    lat: 35.3606,
    lng: 138.7274,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Fuji_Mount_2017_May.jpg/800px-Fuji_Mount_2017_May.jpg',
    hint: 'Highest mountain in Japan'
  }
];
