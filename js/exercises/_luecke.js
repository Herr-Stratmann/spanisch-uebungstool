// Gemeinsame Darstellung von Lückensätzen.

import { h } from '../dom.js';
import { findeTeil } from '../text.js';

/** Lücke mit Anfangsbuchstabe und Länge (Stufe 2) oder neutral (Stufe 3). */
export function lueckenText(luecke, mitHilfe) {
  if (!mitHilfe) return '_______';
  return luecke.split(' ').map((wort) => {
    const z = [...wort];
    return z[0] + '_'.repeat(Math.max(0, z.length - 1));
  }).join(' ');
}

export function lueckenSatz(beispiel, mitHilfe) {
  const i = findeTeil(beispiel.es, beispiel.luecke);
  return h('p', { class: 'luecken-satz', lang: 'es' },
    beispiel.es.slice(0, i),
    h('span', { class: 'luecke', 'aria-label': 'Lücke' }, lueckenText(beispiel.luecke, mitHilfe)),
    beispiel.es.slice(i + beispiel.luecke.length));
}
