// Fach 0: Einführung eines neuen Wortes (Wort mit Audio, Übersetzung, Beispielsatz), danach sofort Stufe 1.

import { h } from '../dom.js';
import { lautsprecher } from '../audio.js';
import { beispielInfo, weiterKnopf } from './_ui.js';

export const typ = 'einfuehrung';
export const stufe = 0;
export const passt = () => true;

const GENUS = { m: 'maskulin', f: 'feminin', 'm/f': 'maskulin/feminin' };

export function render(container, item, ctx) {
  const merkmale = [
    item.genero ? h('span', { class: 'etikett' }, GENUS[item.genero]) : null,
    item.chunk ? h('span', { class: 'etikett' }, 'Wendung') : null,
    item.falso_amigo ? h('span', { class: 'etikett warnung' }, '⚠ falso amigo') : null
  ];
  container.append(
    h('div', { class: 'einfuehrung' },
      h('p', { class: 'anweisung' }, 'Neues Wort'),
      item.bild && !item.bild.includes('/') ? h('p', { class: 'bild', 'aria-hidden': 'true' }, item.bild) : null,
      h('p', { class: 'spanisch gross' }, h('span', { lang: 'es' }, item.es), lautsprecher(item.es)),
      h('p', { class: 'deutsch' }, item.de),
      h('p', { class: 'merkmale' }, merkmale),
      beispielInfo(item),
      item.bruecke && item.bruecke !== '—' ? h('p', { class: 'bruecke' }, '🌉 ', item.bruecke) : null
    ),
    h('div', { class: 'aktionen' }, weiterKnopf(() => ctx.fertig(null), 'Verstanden – jetzt üben →'))
  );
}
