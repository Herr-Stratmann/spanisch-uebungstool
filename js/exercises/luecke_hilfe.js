// Stufe 2: Lückensatz mit Anfangsbuchstabe und Länge.

import { h } from '../dom.js';
import { eingabeAufgabe, aufgabenKopf, beispielInfo } from './_ui.js';
import { lueckenSatz } from './_luecke.js';
import { fehlantwortenAusItem } from './_fehlantworten.js';

export const typ = 'luecke_hilfe';
export const stufe = 2;
export const passt = (item) => Boolean(item.beispiele?.[0]?.luecke);

export function render(container, item, ctx) {
  const b = item.beispiele[0];
  eingabeAufgabe(container, {
    kopf: aufgabenKopf('Ergänze die Lücke.', lueckenSatz(b, true), h('p', { class: 'uebersetzung' }, b.de)),
    akzeptiert: [b.luecke, ...b.luecke_akzeptiert],
    // Anfangsbuchstabe und Länge stehen schon in der Lücke – der Tipp verrät die erste Hälfte.
    tipp: `Die Lösung beginnt mit „${[...b.luecke].slice(0, Math.ceil([...b.luecke].length / 2)).join('')}…“`,
    ...fehlantwortenAusItem(item),
    loesungsInfo: beispielInfo(item),
    beschriftung: 'Wort für die Lücke'
  }, ctx);
}
