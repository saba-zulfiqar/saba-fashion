const fs = require('fs');
const path = require('path');

const uploadDir = path.join(__dirname, '../../uploads/products');

const SET_SOURCES = {
  // Silk 1-8
  'silk01': 'pk13',
  'silk02': 'pk22',
  'silk03': 'pk23',
  'silk04': 'pk24',
  'silk05': 'pk25',
  'silk06': 'pk26',
  'silk07': 'pk48',
  'silk08': 'pk01',

  // Summer 5-8
  'summer05': 'pk14',
  'summer06': 'pk28',
  'summer07': 'pk29',
  'summer08': 'pk19',

  // Casual 1-8
  'casual01': 'pk35',
  'casual02': 'pk06',
  'casual03': 'pk52',
  'casual04': 'pk51',
  'casual05': 'pk53',
  'casual06': 'pk54',
  'casual07': 'pk47',
  'casual08': 'pk10',

  // Printed 5-8
  'printed05': 'pk34',
  'printed06': 'pk42',
  'printed07': 'pk43',
  'printed08': 'pk44',

  // Embroidery 1-8
  'embroidery01': 'pk32',
  'embroidery02': 'pk39',
  'embroidery03': 'pk45',
  'embroidery04': 'pk36',
  'embroidery05': 'pk02',
  'embroidery06': 'pk04',
  'embroidery07': 'pk11',
  'embroidery08': 'pk12',
};

const suffixes = ['a', 'b', 'c', 'd'];

for (const [targetName, sourceName] of Object.entries(SET_SOURCES)) {
  for (const suf of suffixes) {
    const srcFile = path.join(uploadDir, `${sourceName}-${suf}.jpg`);
    const targetFile = path.join(uploadDir, `${targetName}-${suf}.jpg`);
    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, targetFile);
    }
  }
}

console.log('Product image sets created successfully!');
