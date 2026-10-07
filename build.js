const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const publicDir = path.join(rootDir, 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const files = [
  'index.html',
  'index3d.html',
  'cyber-maze-3d.html',
  'styles.css',
  'styles3d.css',
  'favicon.svg'
];

for (const file of files) {
  const src = path.join(rootDir, file);
  const dest = path.join(publicDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
}

const srcDir = path.join(rootDir, 'src');
const destSrcDir = path.join(publicDir, 'src');
if (fs.existsSync(srcDir)) {
  fs.cpSync(srcDir, destSrcDir, { recursive: true });
}

console.log('Build completed: static files synchronized to public/ and root.');
