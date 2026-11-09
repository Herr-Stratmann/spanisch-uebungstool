// Stufe 1: Bild/Emoji → spanisches Wort wählen.

import { h, mische } from '../dom.js';
import { auswahlAufgabe, aufgabenKopf, beispielInfo } from './_ui.js';
import { spanischeDistraktoren } from './_mc.js';

export const typ = 'mc_bild';
export const stufe = 1;
export const passt = (item, umgebung) => Boolean(item.bild) && (umgebung?.alleItems?.length ?? 0) >= 4;

export function render(container, item, ctx) {
  const optionen = mische([
    { text: item.es, richtig: true, lang: 'es' },
    ...spanischeDistraktoren(item, ctx.alleItems, 3, ctx.rng).map((es) => ({ text: es, richtig: false, lang: 'es' }))
  ], ctx.rng);
  const bild = item.bild.includes('/')
    ? h('img', { class: 'bild', src: item.bild, alt: '' })
    : h('p', { class: 'bild', role: 'img', 'aria-label': 'Bild' }, item.bild);
  auswahlAufgabe(container, {
    kopf: aufgabenKopf('Welches Wort passt zum Bild?', bild),
    optionen,
    hinweis: h('p', {}, `Tipp: Auf Deutsch heißt es „${item.de.split(';')[0]}“.`),
    loesungsInfo: beispielInfo(item)
  }, ctx);
}
