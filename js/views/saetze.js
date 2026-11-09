// „Meine Sätze“: eigene Sätze aus Stufe 4, zum Kopieren (z. B. für OneNote/Teams).

import { h } from '../dom.js';

const SELBST = { passt: '✓ passt', teilweise: '≈ teilweise', 'noch nicht': '✗ noch nicht' };

async function kopiere(text, knopf) {
  try {
    await navigator.clipboard.writeText(text);
    const alt = knopf.textContent;
    knopf.textContent = '✓ kopiert';
    setTimeout(() => { knopf.textContent = alt; }, 1500);
  } catch {
    knopf.textContent = 'Kopieren nicht möglich';
  }
}

export function zeigeSaetze(el, app) {
  const saetze = [...app.stand.saetze].reverse();
  el.append(h('h1', {}, 'Meine Sätze'));
  if (!saetze.length) {
    el.append(h('p', { class: 'unterzeile' }, 'Hier sammeln sich deine eigenen Sätze aus der Stufe „frei schreiben“.'));
  } else {
    const alle = h('button', { type: 'button', class: 'knopf' }, '📋 Alle kopieren');
    alle.addEventListener('click', () => kopiere(saetze.map((s) => s.text).join('\n'), alle));
    el.append(
      alle,
      h('ul', { class: 'saetze' }, saetze.map((s) => {
        const item = app.daten.nachId.get(s.item);
        const k = h('button', { type: 'button', class: 'knopf klein', 'aria-label': `Satz kopieren: ${s.text}` }, '📋');
        k.addEventListener('click', () => kopiere(s.text, k));
        return h('li', {},
          h('p', { lang: 'es', class: 'satz' }, s.text),
          h('p', { class: 'meta' }, `${item ? item.es + ' · ' : ''}${SELBST[s.selbst] ?? s.selbst} · ${s.datum.split('-').reverse().join('.')}`),
          k);
      })));
  }
  el.append(h('button', { type: 'button', class: 'knopf', onclick: app.start }, '← Zurück'));
}
