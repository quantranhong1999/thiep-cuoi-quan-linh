// Writes dist-artifact/index.html: index.html without the document skeleton,
// which the Claude Artifact host adds itself (with its own charset and viewport meta).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const src = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const head = src.match(/<head>([\s\S]*)<\/head>/)[1]
  .replace(/<meta charset[^>]*>\s*/, '')
  .replace(/<meta name="viewport"[^>]*>\s*/, '');
const body = src.match(/<body>([\s\S]*)<\/body>/)[1];
// The demo shows sample wishes; the real site (GitHub Pages) never does.
const demo = '<script>window.THIEP_DEMO = { sampleWishes: true };</script>\n';
if (!head.includes('<script src="js/config.js"')) throw new Error('config.js script tag not found');

const out = new URL('../dist-artifact/', import.meta.url);
mkdirSync(out, { recursive: true });
writeFileSync(new URL('index.html', out), head.replace('<script src="js/config.js"', demo + '<script src="js/config.js"').trim() + '\n\n' + body.trim() + '\n');
console.log('dist-artifact/index.html written');
