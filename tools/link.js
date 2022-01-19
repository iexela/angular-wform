const fs = require('fs');
const path = require('path');

if (process.argv.length < 4) {
  console.error('Both existing path and linked path should be provided');
  process.exit(1);
}

const existingPath = resolve(process.argv[2]);
if (!fs.existsSync(existingPath)) {
  console.error(`File "${existingPath}" does not exist`);
  process.exit(1);
}

const newPath = resolve(process.argv[3]);

fs.symlinkSync(existingPath, newPath, 'dir');

function resolve(p) {
  if (path.isAbsolute(p)) {
    return p;
  }

  return path.resolve(process.cwd(), p);
}
