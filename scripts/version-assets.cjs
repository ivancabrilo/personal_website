// Give changed CSS/JS a new URL so browsers cannot reuse a previous release.
const { readFileSync, writeFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { createHash } = require('node:crypto');
const root = resolve(__dirname, '..');
for (const page of ['index.html', 'personal.html']) {
  const file = resolve(root, page);
  const html = readFileSync(file, 'utf8');
  const versioned = html.replace(/(href|src)="([^"?:]+\.(?:css|js))(?:\?[^"\s]*)?"/g, (_, attribute, asset) => {
    const hash = createHash('sha256').update(readFileSync(resolve(root, asset))).digest('hex').slice(0, 12);
    return `${attribute}="${asset}?v=${hash}"`;
  });
  if (versioned !== html) writeFileSync(file, versioned);
  console.log(`Versioned assets in ${page}`);
}
