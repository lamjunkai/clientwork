import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(__dirname, '..', 'dist');
const anW1 = path.join(dist, 'anW1');

fs.mkdirSync(anW1, { recursive: true });
fs.renameSync(path.join(dist, 'index.html'), path.join(anW1, 'index.html'));
fs.renameSync(path.join(dist, 'assets'), path.join(anW1, 'assets'));

console.log('Post-build: app moved to /anW1/');
