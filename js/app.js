// Einstieg: Daten und Fortschritt laden, Ansichten wechseln, Beamermodus.

import { h, leere } from './dom.js';
import { ladeDaten } from './daten.js';
import { ladeStand, speichereStand } from './storage.js';
import { initAudio, setzeAudio } from './audio.js';
import { heuteISO, stelleSitzungZusammen } from './scheduler.js';
import { zeigeUeben } from './views/ueben.js';
import { zeigeFortschritt } from './views/fortschritt.js';
import { zeigeSaetze } from './views/saetze.js';

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

function heutigeSitzung() {
  return stelleSitzungZusammen({
    items: app.daten.items,
    fortschritt: app.stand.items,
    heute: app.heute(),
    neueMax: app.stand.einstellungen.neueProSitzung
  });
}

function zeigeStart(el) {
  if (app.beamer) return zeigeBeamerStart(el);
  const anzahl = heutigeSitzung().length;
  el.append(
    h('section', { class: 'start' },
      h('h1', {}, anzahl ? `Heute fällig: ${anzahl} Aufgaben` : 'Für heute ist alles erledigt 🎉'),
      h('p', { class: 'unterzeile' }, anzahl ? `Etwa ${Math.max(1, Math.round(anzahl * 0.6))} Minuten. Ohne Zeitdruck.` : 'Du kannst trotzdem eine Unidad üben.'),
      h('button', {
        type: 'button', class: 'knopf primaer gross', disabled: !anzahl,
        onclick: () => app.zeige(zeigeUeben, { titel: 'Täglich üben', aufgaben: heutigeSitzung() })
      }, '▶ Täglich üben'),
      h('div', { class: 'kacheln' },
        h('button', { type: 'button', class: 'kachel', onclick: () => app.zeige(zeigeUnidadWahl) }, '📚', h('span', {}, 'Unidad üben')),
        h('button', { type: 'button', class: 'kachel', disabled: true, title: 'kommt in Version 2' }, '🧩', h('span', {}, 'Grammatik üben'), h('small', {}, 'kommt bald')),
        h('button', { type: 'button', class: 'kachel', onclick: () => app.zeige(zeigeFortschritt) }, '📈', h('span', {}, 'Mein Fortschritt')),
        h('button', { type: 'button', class: 'kachel', onclick: () => app.zeige(zeigeSaetze) }, '✍️', h('span', {}, 'Meine Sätze'))
      ),
      h('p', { class: 'fusszeile' },
        'Dein Fortschritt bleibt auf diesem Gerät. ',
        h('button', { type: 'button', class: 'link', onclick: () => { setzeBeamer(true); app.start(); } }, 'Beamermodus'))
    )
  );
}

function zeigeUnidadWahl(el) {
  el.append(
    h('h1', {}, 'Unidad üben'),
    h('p', { class: 'unterzeile' }, 'Fällige und neue Wörter zuerst, dann Wiederholung. Wörter, die noch nicht fällig sind, rücken nicht vor – Fehler zählen aber.'),
    h('div', { class: 'liste' }, app.daten.unidades.map((u) =>
      h('button', {
        type: 'button', class: 'listeneintrag',
        onclick: () => app.zeige(zeigeUeben, {
          titel: u.titel,
          aufgaben: stelleSitzungZusammen({
            items: app.daten.items, fortschritt: app.stand.items, heute: app.heute(),
            neueMax: app.stand.einstellungen.neueProSitzung, filter: (it) => it.unidad === u.nr, auffuellen: true
          })
        })
      }, h('strong', {}, u.titel), h('span', {}, `${u.anzahl} Wörter`)))),
    h('button', { type: 'button', class: 'knopf', onclick: app.start }, '← Zurück')
  );
}

function zeigeBeamerStart(el) {
  let unidad = app.daten.unidades[0]?.nr;
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
    auswahl('Unidad', app.daten.unidades.map((u) => [u.nr, u.titel]), unidad, (w) => { unidad = w; }),
    h('h2', {}, 'Stufe'),
    auswahl('Stufe', [[0, 'Einführung'], [1, '1 Erkennen'], [2, '2 Abrufen'], [3, '3 Verwenden'], [4, '4 Frei']], stufe, (w) => { stufe = w; }),
    h('div', { class: 'knopfreihe' },
      h('button', {
        type: 'button', class: 'knopf primaer gross',
        onclick: () => app.zeige(zeigeUeben, {
          titel: `Unidad ${unidad}`,
          aufgaben: app.daten.items.filter((it) => it.unidad === unidad)
            .map((it) => ({ id: it.id, unidad: it.unidad, stufe, neu: false, faellig: true }))
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
