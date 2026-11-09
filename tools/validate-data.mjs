#!/usr/bin/env node
// Prüft alle Inhaltsdateien unter /data (SPEC §10): Pflichtfelder, eindeutige IDs, Verweise.
// Aufruf: node tools/validate-data.mjs

import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findeTeil } from '../js/text.js';

const DATA = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
const fehler = [];
const warnungen = [];
const melde = (ort, text) => fehler.push(`${ort}: ${text}`);
const warne = (ort, text) => warnungen.push(`${ort}: ${text}`);

const WORTARTEN = ['sustantivo', 'verbo', 'adjetivo', 'adverbio', 'pronombre', 'preposicion',
  'conjuncion', 'expresion', 'nombre_propio', 'numeral', 'articulo', 'interjeccion'];
const GENERA = ['m', 'f', 'm/f', null];

async function json(pfad) {
  try {
    return JSON.parse(await readFile(join(DATA, pfad), 'utf8'));
  } catch (e) {
    melde(pfad, `nicht lesbar (${e.message})`);
    return null;
  }
}

const istText = (x) => typeof x === 'string' && x.trim() !== '';
const istTextListe = (x) => Array.isArray(x) && x.length > 0 && x.every(istText);

function pruefeItem(it, datei, unidadNr) {
  const ort = `${datei} › ${it.id ?? '(ohne id)'}`;
  if (!/^(b\d-)?u\d{2}-\d{3}$/.test(it.id ?? '')) melde(ort, 'id muss das Format u01-001 (Band 1) bzw. b2-u01-001 haben');
  if (!Number.isInteger(it.seite)) melde(ort, 'seite (Seite im Vocabulario) fehlt');
  if (![null, 'PP', 'A', 'B', 'C'].includes(it.bloque)) melde(ort, 'bloque muss null, PP, A, B oder C sein');
  for (const f of ['es', 'de']) if (!istText(it[f])) melde(ort, `${f} fehlt`);
  for (const f of ['akzeptiert_es', 'akzeptiert_de', 'distraktoren_de']) {
    if (!istTextListe(it[f])) melde(ort, `${f} muss eine nicht leere Liste sein`);
  }
  if (it.unidad !== unidadNr) melde(ort, `unidad ${it.unidad} passt nicht zur Datei (Unidad ${unidadNr})`);
  if (!WORTARTEN.includes(it.wortart)) melde(ort, `unbekannte wortart „${it.wortart}“`);
  if (!GENERA.includes(it.genero)) melde(ort, `genero muss m, f, m/f oder null sein`);
  if (it.wortart === 'sustantivo' && !/^(el|la|los|las) /.test(it.es)) {
    warne(ort, 'Substantiv ohne Artikel gespeichert (§8.1)');
  }
  if ((it.distraktoren_de ?? []).length < 3) melde(ort, 'mindestens 3 distraktoren_de');
  if ((it.distraktoren_de ?? []).includes(it.de)) melde(ort, 'Distraktor ist identisch mit der Lösung');
  if (typeof it.bild === 'string' && /^https?:/i.test(it.bild)) melde(ort, 'bild darf keine externe URL sein (§10)');
  if (!Array.isArray(it.beispiele) || it.beispiele.length === 0) melde(ort, 'mindestens ein Beispielsatz');
  for (const [i, b] of (it.beispiele ?? []).entries()) {
    const o = `${ort} › beispiele[${i}]`;
    if (!istText(b.es) || !istText(b.de)) melde(o, 'es und de erforderlich');
    if (!istText(b.luecke) || !b.es?.includes(b.luecke)) melde(o, `luecke „${b.luecke}“ kommt im Satz nicht vor`);
    else if (!new RegExp(`(?<![\\p{L}])${b.luecke.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}])`, 'u').test(b.es)) {
      warne(o, `luecke „${b.luecke}“ ist kein ganzes Wort im Satz (Position ${findeTeil(b.es, b.luecke)})`);
    }
    if (!istTextListe(b.luecke_akzeptiert)) melde(o, 'luecke_akzeptiert fehlt');
  }
  if (!istText(it.situation?.impuls) || !istTextListe(it.situation?.muster)) {
    melde(ort, 'situation braucht impuls und mindestens eine Musterlösung');
  }
  if (!Array.isArray(it.nicht_zusammen_mit)) melde(ort, 'nicht_zusammen_mit muss eine Liste sein');
  if (it.fehlantworten_es !== undefined && typeof it.fehlantworten_es !== 'object') {
    melde(ort, 'fehlantworten_es muss ein Objekt {antwort: hinweis} sein');
  }
  // Typische Tippfallen in spanischen Texten
  for (const text of [it.es, ...(it.beispiele ?? []).map((b) => b.es), ...(it.situation?.muster ?? [])]) {
    if (typeof text !== 'string') continue;
    if (/\?/.test(text) && !/¿/.test(text)) warne(ort, `„${text}“: ¿ fehlt`);
    if (/!/.test(text) && !/¡/.test(text)) warne(ort, `„${text}“: ¡ fehlt`);
  }
}

const index = await json('index.json');
const alleItems = new Map();
const themen = new Set();

if (index) {
  for (const u of index.unidades ?? []) {
    if (!u.vocab) continue;
    const datei = await json(u.vocab);
    if (!datei) continue;
    if (datei.unidad !== u.nr) melde(u.vocab, `unidad ${datei.unidad} ≠ index (${u.nr})`);
    let vorherigeSeite = 0;
    for (const it of datei.items ?? []) {
      if (Number.isInteger(it.seite)) {
        if (it.seite < vorherigeSeite) melde(`${u.vocab} › ${it.id}`, `Seite ${it.seite} nach Seite ${vorherigeSeite}: Items müssen in Buchreihenfolge stehen`);
        vorherigeSeite = it.seite;
      }
      if (alleItems.has(it.id)) melde(u.vocab, `doppelte id ${it.id}`);
      alleItems.set(it.id, { it, datei: u.vocab });
      pruefeItem(it, u.vocab, u.nr);
    }
  }
  for (const g of index.grammar ?? []) {
    const ort = `index.json › grammar › ${g.id ?? '(ohne id)'}`;
    if (!/^g-[a-z0-9-]+$/.test(g.id ?? '')) melde(ort, 'id muss mit g- beginnen (Kleinbuchstaben, Ziffern, -)');
    if (themen.has(g.id)) melde(ort, 'doppelte id');
    themen.add(g.id);
    if (!istText(g.titel)) melde(ort, 'titel fehlt');
    if (!istText(g.bereich)) melde(ort, 'bereich fehlt');
    if (g.datei !== null && g.datei !== undefined) await json(g.datei);
  }
  for (const { it, datei } of alleItems.values()) {
    for (const ref of it.nicht_zusammen_mit ?? []) {
      if (!alleItems.has(ref)) melde(`${datei} › ${it.id}`, `nicht_zusammen_mit verweist auf unbekannte id ${ref}`);
    }
  }
}

for (const w of warnungen) console.warn(`Warnung  ${w}`);
for (const f of fehler) console.error(`Fehler   ${f}`);
console.log(`${alleItems.size} Wortschatz-Items und ${themen.size} Grammatikthemen geprüft, ${fehler.length} Fehler, ${warnungen.length} Warnungen.`);
process.exit(fehler.length ? 1 : 0);
