// Register der Übungstypen und Auswahl je Stufe (§4.1).
// Neue Typen (mc_audio, diktat, satzpuzzle, kollokation, umformen) hier eintragen.

import * as einfuehrung from './einfuehrung.js';
import * as mcEsDe from './mc_es_de.js';
import * as mcBild from './mc_bild.js';
import * as tippenDeEs from './tippen_de_es.js';
import * as lueckeHilfe from './luecke_hilfe.js';
import * as luecke from './luecke.js';
import * as situation from './situation.js';

const NACH_STUFE = {
  0: [einfuehrung],
  1: [mcEsDe, mcBild],
  2: [tippenDeEs, lueckeHilfe],
  3: [luecke],
  4: [situation]
};

/** Wählt zufällig einen Übungstyp der Stufe, für den das Item genug Daten hat. Fällt sonst eine Stufe tiefer. */
export function waehleUebung(item, stufe, umgebung = {}, rng = Math.random) {
  for (let s = stufe; s >= 1; s--) {
    const moeglich = (NACH_STUFE[s] ?? []).filter((t) => t.passt(item, umgebung));
    if (moeglich.length) return moeglich[Math.floor(rng() * moeglich.length)];
  }
  return mcEsDe;
}

export { einfuehrung };
