// Gemeinsame Logik für Auswahlaufgaben der Stufe 1.

import { mische } from '../dom.js';
import { normalisiere } from '../check.js';

/** Spanische Distraktoren: gleiche Wortart, anderes Thema (nicht semantisch eng verwandt, §4.1). */
export function spanischeDistraktoren(item, alleItems, anzahl = 3, rng = Math.random) {
  const andere = alleItems.filter((x) => x.id !== item.id && normalisiere(x.es) !== normalisiere(item.es));
  const passend = mische(andere.filter((x) => x.wortart === item.wortart && x.tema !== item.tema), rng);
  const rest = mische(andere.filter((x) => !passend.includes(x)), rng);
  return [...passend, ...rest].slice(0, anzahl).map((x) => x.es);
}
