// Stufe 1: Spanisches Wort → deutsche Bedeutung wählen.

import { h, mische } from '../dom.js';
import { auswahlAufgabe, aufgabenKopf, spanisch, beispielInfo } from './_ui.js';

export const typ = 'mc_es_de';
export const stufe = 1;
export const passt = (item) => (item.distraktoren_de ?? []).length >= 3;

export function render(container, item, ctx) {
  const optionen = mische([
    { text: item.de, richtig: true },
    ...item.distraktoren_de.slice(0, 3).map((d) => ({ text: d, richtig: false }))
  ], ctx.rng);
  const b = item.beispiele?.[0];
  auswahlAufgabe(container, {
    kopf: aufgabenKopf('Was bedeutet das?', spanisch(item.es, { gross: true })),
    optionen,
    hinweis: b ? h('p', {}, 'Tipp – so wird es benutzt: ', h('span', { lang: 'es' }, b.es)) : null,
    loesungsInfo: beispielInfo(item)
  }, ctx);
}
