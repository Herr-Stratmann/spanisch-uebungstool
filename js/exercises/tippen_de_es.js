// Stufe 2: Deutsch → Spanisch tippen.

import { h } from '../dom.js';
import { eingabeAufgabe, aufgabenKopf, beispielInfo } from './_ui.js';
import { fehlantwortenAusItem } from './_fehlantworten.js';

export const typ = 'tippen_de_es';
export const stufe = 2;
export const passt = (item) => (item.akzeptiert_es ?? []).length > 0;

export function render(container, item, ctx) {
  eingabeAufgabe(container, {
    kopf: aufgabenKopf('Wie heißt das auf Spanisch?', h('p', { class: 'deutsch gross' }, item.de)),
    akzeptiert: item.akzeptiert_es,
    ...fehlantwortenAusItem(item),
    loesungsInfo: beispielInfo(item),
    beschriftung: 'Spanische Antwort'
  }, ctx);
}
