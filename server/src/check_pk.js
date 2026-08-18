const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../uploads/products');
const files = fs.readdirSync(dir);
const pkSets = {};
files.forEach(f => {
  const m = f.match(/^(pk\d+)-([abcd])\.jpg$/);
  if (m) {
    pkSets[m[1]] = pkSets[m[1]] || [];
    pkSets[m[1]].push(m[2]);
  }
});
console.log('Total PK Sets found:', Object.keys(pkSets).length);
console.log(Object.keys(pkSets).sort());
