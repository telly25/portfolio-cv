#!/usr/bin/env node
/**
 * sync-fr-to-en.js
 *
 * Compare locales/fr.json au commit précédent, détecte les clés modifiées,
 * puis pour chaque clé changée :
 *   - clés miroir (URLs, chemins) → copie directe dans en.json
 *   - clés texte                  → traduction FR→EN via Claude API (batch)
 *
 * Appelé par le GitHub Action .github/workflows/sync-locales.yml
 */

const fs   = require('fs');
const https = require('https');
const { execSync } = require('child_process');

// ── Clés copiées telles quelles (URLs, chemins, icônes) ──────────────────────
function isMirrorKey(key) {
  return (
    key.startsWith('tool_icon_') ||
    key === 'logo_src'           ||
    key === 'hero_cta_href'
  );
}

// ── Appel Claude API (batch) ──────────────────────────────────────────────────
async function translateBatch(payload, apiKey) {
  const prompt = [
    'Translate the following French portfolio website strings to English.',
    'Return ONLY a valid JSON object with the same keys and translated values.',
    'Rules:',
    '- Keep proper nouns, company names, tool names (Jira, Confluence…) unchanged.',
    '- Keep HTML entities (&amp; &lt; <em>…</em>) unchanged.',
    '- Keep the same tone and punctuation style as the original.',
    '- For arrays, translate each item individually.',
    '',
    'Input JSON:',
    JSON.stringify(payload, null, 2),
  ].join('\n');

  const body = JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (response.error) return reject(new Error(response.error.message));
            const text = response.content[0].text;
            const match = text.match(/\{[\s\S]*\}/);
            if (!match) return reject(new Error('No JSON found in Claude response'));
            resolve(JSON.parse(match[0]));
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
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const frPath = 'locales/fr.json';
  const enPath = 'locales/en.json';

  const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));
  const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

  // Récupère l'état du fr.json au commit précédent
  let prevFr = {};
  try {
    prevFr = JSON.parse(execSync('git show HEAD~1:locales/fr.json', { stdio: ['pipe', 'pipe', 'ignore'] }).toString());
  } catch {
    console.log('Pas de commit précédent — comparaison contre un objet vide.');
  }

  const mirrorUpdates  = {};
  const translateQueue = {};

  for (const key of Object.keys(fr)) {
    const hasChanged = JSON.stringify(fr[key]) !== JSON.stringify(prevFr[key]);
    if (!hasChanged) continue;

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

  console.log(`Clés modifiées : ${totalChanged} (${Object.keys(mirrorUpdates).length} miroir, ${Object.keys(translateQueue).length} à traduire)`);

  // Applique les miroirs
  Object.assign(en, mirrorUpdates);

  // Traduit en batch
  if (Object.keys(translateQueue).length > 0) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.warn('ANTHROPIC_API_KEY absent — les champs texte sont copiés en FR avec préfixe [FR].');
      for (const [k, v] of Object.entries(translateQueue)) {
        en[k] = Array.isArray(v) ? v.map((s) => `[FR] ${s}`) : `[FR] ${v}`;
      }
    } else {
      console.log('Traduction en cours via Claude…');
      const translated = await translateBatch(translateQueue, apiKey);
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
