// Fortschritt je Unidad (Verteilung auf die Fächer), Einstellungen, Export/Import (§8.3, §9).

import { h } from '../dom.js';
import { importiere } from '../storage.js';
import { sichereFortschritt } from '../sicherung.js';
import { setzeAudio } from '../audio.js';

const FACH_NAMEN = ['neu', 'Fach 1', 'Fach 2', 'Fach 3', 'Fach 4', 'Fach 5'];

export function zeigeFortschritt(el, app) {
  el.append(
    h('h1', {}, 'Mein Fortschritt'),
    h('p', { class: 'unterzeile' }, 'Je weiter rechts, desto sicherer. „Gelernt“ heißt: in einem eigenen Satz richtig verwendet.'),
    ...app.daten.unidades.map((u) => unidadZeile(u, app)),
    einstellungen(app),
    sicherung(app),
    h('button', { type: 'button', class: 'knopf', onclick: app.start }, '← Zurück')
  );
}

function unidadZeile(u, app) {
  const items = app.daten.items.filter((it) => it.uk === u.uk);
  const anzahl = [0, 0, 0, 0, 0, 0];
  let gelernt = 0;
  for (const it of items) {
    const z = app.stand.items[it.id];
    anzahl[z?.fach ?? 0] += 1;
    if (z?.gelernt) gelernt += 1;
  }
  return h('section', { class: 'unidad-fortschritt' },
    h('h2', {}, u.titel, h('span', { class: 'gelernt' }, ` · ${gelernt} von ${items.length} gelernt`)),
    h('div', { class: 'faecher', role: 'img', 'aria-label': anzahl.map((n, f) => `${FACH_NAMEN[f]}: ${n}`).join(', ') },
      anzahl.map((n, f) => (n ? h('div', { class: `fach fach-${f}`, style: `flex-grow:${n}` }, String(n)) : null))),
    h('ul', { class: 'legende' }, anzahl.map((n, f) => h('li', {}, h('span', { class: `punkt fach-${f}` }), `${FACH_NAMEN[f]}: ${n}`))));
}

function einstellungen(app) {
  const e = app.stand.einstellungen;
  const audio = h('input', { type: 'checkbox', checked: e.audio });
  audio.addEventListener('change', () => { e.audio = audio.checked; setzeAudio(e.audio); app.speichere(); });
  return h('section', { class: 'einstellungen' },
    h('h2', {}, 'Einstellungen'),
    h('label', {}, audio, ' Vorlesen (Lautsprecher-Buttons)'));
}

function sicherung(app) {
  const meldung = h('p', { class: 'meldung', role: 'status' });
  const datei = h('input', { type: 'file', accept: 'application/json,.json', hidden: true });
  datei.addEventListener('change', async () => {
    const f = datei.files?.[0];
    if (!f) return;
    try {
      const neu = importiere(await f.text());
      if (!confirm('Dein aktueller Fortschritt auf diesem Gerät wird ersetzt. Fortfahren?')) return;
      app.stand = neu;
      app.speichere();
      app.zeige(zeigeFortschritt);
    } catch (e) {
      meldung.textContent = e.message;
    }
  });
  const letzte = app.stand.einstellungen.letzteSicherung;
  const stand = h('p', { class: 'meta', role: 'status' },
    letzte ? `Letzte Sicherung: ${letzte.split('-').reverse().join('.')}` : 'Noch keine Sicherung.');
  return h('section', { class: 'sicherung' },
    h('h2', {}, 'Sichern und übertragen'),
    h('p', {}, 'Speichere deinen Fortschritt regelmäßig als Datei, am besten in OneDrive. Damit kannst du ihn auf einem neuen oder zurückgesetzten iPad wiederherstellen. Die Datei enthält nur deine Lernstände und Sätze.'),
    stand,
    h('div', { class: 'knopfreihe' },
      h('button', {
        type: 'button', class: 'knopf', onclick: async () => {
          if (await sichereFortschritt(app)) stand.textContent = `Letzte Sicherung: ${app.heute().split('-').reverse().join('.')} ✓`;
        }
      }, '⬇ Fortschritt sichern'),
      h('button', { type: 'button', class: 'knopf', onclick: () => datei.click() }, '⬆ Fortschritt laden')),
    datei, meldung);
}
