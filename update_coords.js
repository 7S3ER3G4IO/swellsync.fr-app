const fs = require('fs');
const spots = JSON.parse(fs.readFileSync('data/spots.json', 'utf8'));

// We have 60 spots. Let's not hit Nominatim 60 times.
console.log("Spots count: " + spots.length);
