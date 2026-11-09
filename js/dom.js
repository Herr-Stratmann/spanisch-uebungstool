import { findeTeil } from './text.js';

// Kleine DOM-Helfer. Text wird immer als Text eingefügt (kein innerHTML mit Daten).

export function h(tag, attrs = {}, ...kinder) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  haengeAn(el, kinder);
  return el;
}

function haengeAn(el, kinder) {
  for (const k of kinder.flat(Infinity)) {
    if (k === null || k === undefined || k === false) continue;
    el.append(k instanceof Node ? k : document.createTextNode(String(k)));
  }
}

/** Wie Element.append, überspringt aber null/undefined (natives append würde „null“ als Text einfügen). */
export function anfuegen(el, ...kinder) {
  haengeAn(el, kinder);
  return el;
}

export function leere(el) {
  while (el.firstChild) el.firstChild.remove();
  return el;
}

/** Satz mit hervorgehobenem Teil (Zielform, Prämisse 6 „Bemerken“). */
export function markiert(satz, teil) {
  const i = findeTeil(satz, teil);
  if (i < 0) return h('span', { lang: 'es' }, satz);
  return h('span', { lang: 'es' }, satz.slice(0, i), h('mark', {}, teil), satz.slice(i + teil.length));
}

/** Markierung mit **…** aus den Daten (§8.2) in hervorgehobene Elemente umwandeln. */
export function mitSternchen(text) {
  const teile = text.split(/\*\*(.+?)\*\*/g);
  return h('span', { lang: 'es' }, teile.map((t, i) => (i % 2 ? h('mark', {}, t) : t)));
}

export function mische(liste, rng = Math.random) {
  const a = [...liste];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
