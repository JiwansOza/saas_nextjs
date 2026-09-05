// Generates the third-party script weight for one measured profile, into public/vendor/.
//
//   node scripts/gen-ballast-vendors.mjs amazon
//
// See src/lib/ballast-profiles.js for where the targets come from and why blocking is modelled
// as "a few expensive scripts among many cheap ones" rather than as an even spread.
//
// This reproduces the COST and the SHAPE of a real third-party stack, not any vendor's code.
// Each file builds indexes, parses JSON, walks the DOM and attaches listeners — what analytics,
// chat widgets, review apps and tag managers actually do when they boot.
//
// Loaded async by the component, deliberately: real sites load this class of script async, and
// a synchronous one would block the PARSER, which is a different cost and would confound the
// measurement with Preta's own two tags.
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { planFor, PROFILES } from '../src/lib/ballast-profiles.js';

// argv first, then the env var, then the default — resolved here rather than by shell
// parameter expansion in the npm script. npm runs scripts through cmd.exe on Windows, where
// ${VAR:-default} is not expanded at all and the generator was handed that string verbatim as
// a profile name.
const name = process.argv[2] || process.env.NEXT_PUBLIC_BALLAST || 'amazon';
if (!PROFILES[name]) {
    console.error(`unknown profile "${name}". one of: ${Object.keys(PROFILES).join(', ')}`);
    process.exit(1);
}
const plan = planFor(name);
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'vendor');

try { rmSync(OUT, { recursive: true, force: true }); } catch (e) { /* first run */ }
mkdirSync(OUT, { recursive: true });

const ROWS = plan.rows;    // derived from the byte budget — see planFor in ballast-profiles.js
const LIGHT_PASSES = 30;   // the crowd of cheap third parties

const row = (i) =>
    `{"id":"sku_${i}_${Math.random().toString(36).slice(2, 10)}","name":"Product ${i}",` +
    `"price":${(9 + (i % 90)).toFixed(2)},"tags":["a${i % 7}","b${i % 11}","c${i % 13}"],` +
    `"meta":{"rank":${i % 100},"stock":${i % 50},"slug":"product-${i}-detail-page"}}`;

let total = 0;
for (let f = 0; f < plan.vendors; f++) {
    const isHeavy = f < plan.heavy;
    const passes = isHeavy ? plan.heavyPasses : LIGHT_PASSES;
    const data = '[' + Array.from({ length: ROWS }, (_, i) => row(f * ROWS + i)).join(',') + ']';
    const js = `/* ballast vendor ${f} (${isHeavy ? 'heavy' : 'light'}, profile ${name}) — measurement instrument */
(function () {
  var RAW = ${JSON.stringify(data)};
  var t0 = (performance && performance.now) ? performance.now() : Date.now();
  var rows = JSON.parse(RAW);
  var byTag = {}, bySlug = {}, ranked = [], joined = '';
  for (var p = 0; p < ${passes}; p++) {
    byTag = {}; bySlug = {}; ranked = [];
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      bySlug[r.meta.slug] = r;
      ranked.push([r.meta.rank, r.id]);
      for (var j = 0; j < r.tags.length; j++) {
        (byTag[r.tags[j]] = byTag[r.tags[j]] || []).push(r.id);
      }
    }
    ranked.sort(function (a, b) { return a[0] - b[0]; });
    var buf = [];
    for (var k = 0; k < rows.length; k++) {
      buf.push(rows[k].name + '|' + rows[k].price.toFixed(2) + '|' + rows[k].tags.join(','));
    }
    joined = buf.join('\\n');
  }
  try {
    var els = document.querySelectorAll('[data-card]');
    for (var m = 0; m < els.length; m++) {
      els[m].addEventListener('mouseenter', function () { /* noop */ }, { passive: true });
    }
  } catch (e) { /* pre-body */ }
  window.__ballastVendor = window.__ballastVendor || [];
  window.__ballastVendor.push({ id: ${f}, heavy: ${isHeavy},
    ms: Math.round(((performance && performance.now) ? performance.now() : Date.now()) - t0),
    n: rows.length, tags: Object.keys(byTag).length, bytes: joined.length });
})();
`;
    writeFileSync(resolve(OUT, `v${f}.js`), js);
    total += Buffer.byteLength(js);
}

console.log(`profile ${name}:`);
console.log(`  target      ${plan.target.nodes} nodes, ${plan.target.scripts} scripts, ` +
    `${plan.target.heavy} tasks x ${plan.target.heavyMs}ms = ${plan.target.blocked}ms blocked`);
console.log(`  generated   ${plan.cards} cards, ${plan.vendors} vendor files ` +
    `(${plan.heavy} heavy @ ${plan.heavyPasses} passes x ${plan.rows} rows), ` +
    `${(total / 1024).toFixed(0)} KB`);
