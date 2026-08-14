import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const root = process.argv[2] || '.';
const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml', '.webmanifest':'application/manifest+json' };
const server = createServer(async (request, response) => {
  try {
    let path = normalize(decodeURIComponent(request.url.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
    if (path === '/') path = '/index.html';
    let file = join(root, path);
    if (!(await stat(file)).isFile()) file = join(root, 'index.html');
    response.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream');
    response.end(await readFile(file));
  } catch { response.writeHead(404).end('Not found'); }
});
server.listen(4173, '0.0.0.0', () => console.log('Queens running at http://localhost:4173'));
