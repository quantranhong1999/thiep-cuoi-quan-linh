// Used by GitHub Actions: copies the site into _site/ and writes the SHEET_URL secret into
// _site/js/config.js, so the Apps Script URL never sits in the (public) repository.
// It still ends up in the published page, which is unavoidable for a static site.
import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const out = new URL('_site/', root);
mkdirSync(out, { recursive: true });
for (const f of ['index.html', 'favicon.svg', 'css', 'js', 'assets']) cpSync(new URL(f, root), new URL(f, out), { recursive: true });

const url = (process.env.SHEET_URL || '').trim();
if (!url) {
  console.log("::warning::SHEET_URL secret is not set: RSVPs and wishes stay in each guest's browser.");
} else {
  if (!/^https:\/\/script\.google\.com\/(macros|a\/macros\/[^/]+)\/s\/[\w-]+\/exec$/.test(url)) {
    console.log('::error::SHEET_URL must be the Apps Script web app URL (https://script.google.com/macros/s/…/exec).');
    process.exit(1);
  }
  const cfg = new URL('js/config.js', out);
  const placeholder = "sheetUrl: '',";
  const src = readFileSync(cfg, 'utf8');
  if (!src.includes(placeholder)) {
    console.log('::error::js/config.js has no empty sheetUrl to fill in.');
    process.exit(1);
  }
  writeFileSync(cfg, src.replace(placeholder, 'sheetUrl: ' + JSON.stringify(url) + ','));
  console.log('sheetUrl filled in from the SHEET_URL secret.');
}
