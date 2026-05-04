#!/usr/bin/env node
/**
 * sync-fr-to-en.js
 *
 * Compare locales/fr.json au commit précédent, détecte les clés modifiées,
 * puis pour chaque clé changée :
 *   - clés miroir (URLs, chemins) → copie directe dans en.json
 *   - clés texte                  → traduction FR→EN via DeepL Free API
 *
 * Appelé par le GitHub Action .github/workflows/sync-locales.yml
 * Nécessite le secret DEEPL_API_KEY (clé gratuite sur deepl.com/fr/pro#developer)
 */

const fs    = require('fs');
const https = require('https');
const { execSync } = require('child_process');

// ── Clés copiées telles quelles (URLs, chemins, icônes) ──────────────────────
function isMirrorKey(key) {
  return (
    key.startsWith('tool_icon_') ||
    key === 'logo_src'           ||
    key === 'hero_cta_href'      ||
    key === 'cv_download_enabled'
  );
}

// ── Traduction batch via DeepL Free ──────────────────────────────────────────
async function translateWithDeepl(payload, apiKey) {
  // Aplatit {clé: string|array} en liste de chaînes à traduire
  const items   = []; // { key, index|null }
  const strings = [];

  for (const [key, value] of Object.entries(payload)) {
    if (Array.isArray(value)) {
      value.forEach((s, i) => {
        items.push({ key, index: i });
        strings.push(String(s));
      });
    } else {
      items.push({ key, index: null });
      strings.push(String(value));
    }
  }

  // Construit le body form-encoded (DeepL accepte plusieurs `text` dans une requête)
  const params = new URLSearchParams();
  strings.forEach((s) => params.append('text', s));
  params.append('source_lang', 'FR');
  params.append('target_lang', 'EN-GB');
  const body = params.toString();

  const translations = await new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api-free.deepl.com',
        path: '/v2/translate',
        method: 'POST',
        headers: {
          'Authorization': `DeepL-Auth-Key ${apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.message) return reject(new Error(`DeepL: ${json.message}`));
            resolve(json.translations);
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });

  // Reconstitue l'objet {clé: string|array} avec les traductions
  const result = {};
  items.forEach(({ key, index }, i) => {
    const translated = translations[i].text;
    if (index === null) {
      result[key] = translated;
    } else {
      if (!result[key]) result[key] = [];
      result[key][index] = translated;
    }
  });

  return result;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const frPath = 'locales/fr.json';
  const enPath = 'locales/en.json';

  const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));
  const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

  let prevFr = {};
  try {
    prevFr = JSON.parse(
      execSync('git show HEAD~1:locales/fr.json', { stdio: ['pipe', 'pipe', 'ignore'] }).toString()
    );
  } catch {
    console.log('Pas de commit précédent — comparaison contre un objet vide.');
  }

  const mirrorUpdates  = {};
  const translateQueue = {};

  for (const key of Object.keys(fr)) {
    if (JSON.stringify(fr[key]) === JSON.stringify(prevFr[key])) continue;

    if (isMirrorKey(key)) {
      mirrorUpdates[key] = fr[key];
    } else if (typeof fr[key] === 'string' || Array.isArray(fr[key])) {
      translateQueue[key] = fr[key];
    }
  }

  const totalChanged = Object.keys(mirrorUpdates).length + Object.keys(translateQueue).length;

  if (totalChanged === 0) {
    console.log('Aucun changement détecté dans fr.json.');
    return;
  }

  console.log(
    `Clés modifiées : ${totalChanged}` +
    ` (${Object.keys(mirrorUpdates).length} miroir,` +
    ` ${Object.keys(translateQueue).length} à traduire)`
  );

  // Miroirs
  Object.assign(en, mirrorUpdates);

  // Traduction
  if (Object.keys(translateQueue).length > 0) {
    const apiKey = process.env.DEEPL_API_KEY;
    if (!apiKey) {
      console.warn('DEEPL_API_KEY absent — textes copiés en FR avec préfixe [FR].');
      for (const [k, v] of Object.entries(translateQueue)) {
        en[k] = Array.isArray(v) ? v.map((s) => `[FR] ${s}`) : `[FR] ${v}`;
      }
    } else {
      console.log('Traduction en cours via DeepL…');
      const translated = await translateWithDeepl(translateQueue, apiKey);
      Object.assign(en, translated);
      console.log('Traduction terminée.');
    }
  }

  fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n');
  console.log('en.json mis à jour.');
}

main().catch((err) => {
  console.error('Erreur sync :', err.message);
  process.exit(1);
});
