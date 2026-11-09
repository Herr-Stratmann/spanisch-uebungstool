// Stufe 3: Lückensatz ohne Hilfe (ggf. konjugierte Form).

import { h } from '../dom.js';
import { eingabeAufgabe, aufgabenKopf, beispielInfo } from './_ui.js';
import { lueckenSatz } from './_luecke.js';
import { fehlantwortenAusItem } from './_fehlantworten.js';

export const typ = 'luecke';
export const stufe = 3;
export const passt = (item) => Boolean(item.beispiele?.[0]?.luecke);

export function render(container, item, ctx) {
  const b = item.beispiele[0];
  eingabeAufgabe(container, {
    kopf: aufgabenKopf('Ergänze den Satz.', lueckenSatz(b, false), h('p', { class: 'uebersetzung' }, b.de)),
    akzeptiert: [b.luecke, ...b.luecke_akzeptiert],
    ...fehlantwortenAusItem(item),
    loesungsInfo: beispielInfo(item),
    beschriftung: 'Wort für die Lücke'
  }, ctx);
}
