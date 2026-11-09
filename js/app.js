// Einstieg: Daten und Fortschritt laden, Ansichten wechseln, Beamermodus.

import { h, leere } from './dom.js';
import { ladeDaten } from './daten.js';
import { ladeStand, speichereStand } from './storage.js';
import { initAudio, setzeAudio } from './audio.js';
import { heuteISO } from './scheduler.js';
import { zeigeUeben } from './views/ueben.js';
import { zeigeFortschritt } from './views/fortschritt.js';
import { zeigeSaetze } from './views/saetze.js';
import { zeigeVokabeln, taeglicheAufgaben } from './views/vokabeln.js';

const main = document.getElementById('app');
const params = new URLSearchParams(location.search);

const app = {
  daten: null,
  stand: ladeStand(),
  beamer: params.get('beamer') === '1',
  heute: () => heuteISO(),
  speichere() { return speichereStand(app.stand, globalThis.localStorage, { beamer: app.beamer }); },
  zeige(ansicht, ...args) {
    leere(main);
    window.scrollTo(0, 0);
    ansicht(main, app, ...args);
    main.focus({ preventScroll: true });
  },
  start: () => app.zeige(zeigeStart)
};

function setzeBeamer(an) {
  app.beamer = an;
  document.documentElement.classList.toggle('beamer', an);
  document.getElementById('beamer-hinweis').hidden = !an;
  const url = new URL(location.href);
  if (an) url.searchParams.set('beamer', '1'); else url.searchParams.delete('beamer');
  history.replaceState(null, '', url);
}

function zeigeStart(el) {
  if (app.beamer) return zeigeBeamerStart(el);
  const faellig = taeglicheAufgaben(app).length;
  const themen = app.daten.grammatik.length;
  el.append(
    h('section', { class: 'start' },
      h('h1', {}, '¡Hola! Was möchtest du üben?'),
      h('div', { class: 'bereiche' },
        h('button', { type: 'button', class: 'bereich', onclick: () => app.zeige(zeigeVokabeln) },
          h('span', { class: 'bereich-symbol', 'aria-hidden': 'true' }, '📚'),
          h('span', { class: 'bereich-titel' }, 'Vokabeln'),
          h('span', { class: 'bereich-info' }, faellig ? `Heute: ${faellig} Aufgaben` : 'Heute nichts fällig ✓')),
        h('button', { type: 'button', class: 'bereich', onclick: () => app.zeige(zeigeGrammatik) },
          h('span', { class: 'bereich-symbol', 'aria-hidden': 'true' }, '🧩'),
          h('span', { class: 'bereich-titel' }, 'Grammatik'),
          h('span', { class: 'bereich-info' }, `${themen} Themen`))),
      h('nav', { class: 'nebenlinks', 'aria-label': 'Weitere Bereiche' },
        h('button', { type: 'button', class: 'knopf', onclick: () => app.zeige(zeigeFortschritt) }, '📈 Mein Fortschritt'),
        h('button', { type: 'button', class: 'knopf', onclick: () => app.zeige(zeigeSaetze) }, '✍️ Meine Sätze')),
      h('p', { class: 'fusszeile' },
        'Dein Fortschritt bleibt auf diesem Gerät. ',
        h('button', { type: 'button', class: 'link', onclick: () => { setzeBeamer(true); app.start(); } }, 'Beamermodus'))
    )
  );
}

function zeigeGrammatik(el) {
  const bereiche = new Map();
  for (const g of app.daten.grammatik) {
    if (!bereiche.has(g.bereich)) bereiche.set(g.bereich, []);
    bereiche.get(g.bereich).push(g);
  }
  const verfuegbar = app.daten.grammatik.some((g) => g.verfuegbar);
  el.append(
    h('h1', {}, 'Grammatik'),
    verfuegbar ? null : h('p', { class: 'hinweis-box' }, 'Die Grammatikübungen sind in Arbeit. Hier siehst du schon, welche Themen kommen.'),
    ...[...bereiche].map(([bereich, themen]) => h('section', { class: 'themenbereich' },
      h('h2', {}, bereich),
      h('div', { class: 'liste' }, themen.map((g) => h('button', {
        type: 'button', class: 'listeneintrag', disabled: !g.verfuegbar
      }, h('strong', {}, g.titel), h('span', {}, g.verfuegbar ? '▶' : 'folgt')))))),
    h('button', { type: 'button', class: 'knopf', onclick: app.start }, '← Zurück')
  );
}

function zeigeBeamerStart(el) {
  let unidad = app.daten.unidades[0]?.uk;
  let stufe = 1;
  const auswahl = (name, werte, aktuell, setze) => h('div', { class: 'knopfreihe', role: 'radiogroup', 'aria-label': name },
    werte.map(([wert, text]) => {
      const b = h('button', {
        type: 'button', class: 'knopf', role: 'radio', 'aria-checked': String(wert === aktuell),
        onclick: () => { setze(wert); b.parentElement.querySelectorAll('button').forEach((x) => x.setAttribute('aria-checked', String(x === b))); }
      }, text);
      return b;
    }));
  el.append(
    h('h1', {}, 'Beamermodus'),
    h('p', { class: 'unterzeile' }, 'Für die ganze Klasse. Lösungen erst auf Klick. Es wird nichts gespeichert.'),
    h('h2', {}, 'Unidad'),
    auswahl('Unidad', app.daten.unidades.map((u) => [u.uk, u.titel]), unidad, (w) => { unidad = w; }),
    h('h2', {}, 'Stufe'),
    auswahl('Stufe', [[0, 'Einführung'], [1, '1 Erkennen'], [2, '2 Abrufen'], [3, '3 Verwenden'], [4, '4 Frei']], stufe, (w) => { stufe = w; }),
    h('div', { class: 'knopfreihe' },
      h('button', {
        type: 'button', class: 'knopf primaer gross',
        onclick: () => app.zeige(zeigeUeben, {
          titel: app.daten.unidades.find((u) => u.uk === unidad)?.titel ?? 'Vokabeln',
          aufgaben: app.daten.items.filter((it) => it.uk === unidad)
            .map((it) => ({ id: it.id, unidad: it.uk, stufe, neu: false, faellig: true }))
        })
      }, '▶ Starten'),
      h('button', { type: 'button', class: 'knopf', onclick: () => { setzeBeamer(false); app.start(); } }, 'Beamermodus beenden'))
  );
}

async function init() {
  document.getElementById('zur-startseite').addEventListener('click', app.start);
  setzeBeamer(app.beamer);
  try {
    [app.daten] = await Promise.all([ladeDaten(), initAudio()]);
  } catch (e) {
    leere(main).append(h('p', { class: 'fehler' }, 'Die Übungen konnten nicht geladen werden. Bitte Internetverbindung prüfen und neu laden.'), h('p', {}, String(e.message)));
    return;
  }
  setzeAudio(app.stand.einstellungen.audio);
  app.start();
}

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

init();
