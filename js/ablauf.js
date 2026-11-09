// Ablauf einer Übungssitzung (Warteschlange, erneute Abfrage, Bilanz).
// Reines Modul ohne DOM. Das Verbuchen im Leitner-Fach übernimmt die Oberfläche mit scheduler.bewerte().

import { wiederEinreihen } from './scheduler.js';

const ABSTAND_WIEDERHOLUNG = 3;
const BLOCK = 5;
const WIEDERHOLUNGEN_ZWISCHEN_RUNDEN = 3;

function mische(liste, rng) {
  const a = [...liste];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Mischt so lange (begrenzt), bis die Bedingung erfüllt ist. */
function mischeBis(liste, rng, ok) {
  let a = mische(liste, rng);
  for (let i = 0; i < 20 && liste.length > 1 && !ok(a); i++) a = mische(liste, rng);
  return a;
}

/**
 * Ordnet eine Sitzung für neue Wörter um (SPEC §14 Nr. 11):
 * Lernblock (bis zu 5 Karten) → Runde 1 Erkennen, gemischt, zählt nicht →
 * einige fällige Wiederholungen (Abstand) → Runde 2 Abrufen, neu gemischt, zählt.
 * Aufgaben ohne neue Wörter bleiben unverändert.
 */
export function planeSitzung(aufgaben, {
  rng = Math.random, block = BLOCK, rang = null, konflikt = () => false
} = {}) {
  let neue = aufgaben.filter((a) => a.stufe === 0);
  if (!neue.length) return aufgaben;
  if (rang) neue = [...neue].sort((a, b) => rang(a.id) - rang(b.id)); // Lernkarten in Buchreihenfolge
  const rest = aufgaben.filter((a) => a.stufe !== 0);

  // Gleichmäßige Blöcke; Paare aus nicht_zusammen_mit (Prämisse 5) kommen in verschiedene Blöcke.
  const kapazitaet = Math.ceil(neue.length / Math.ceil(neue.length / block));
  const gruppen = [];
  for (const a of neue) {
    const passend = gruppen.find((g) => g.length < kapazitaet && !g.some((b) => konflikt(a.id, b.id)));
    if (passend) passend.push(a); else gruppen.push([a]);
  }

  const plan = [];
  gruppen.forEach((gruppe, i) => {
    const ids = gruppe.map((a) => a.id);
    const r1 = mischeBis(gruppe, rng, (x) => x.some((a, k) => a.id !== ids[k]));
    const r2 = mischeBis(gruppe, rng, (x) => x[0].id !== r1.at(-1).id);
    plan.push({ art: 'lernen', id: `lernen-${i}`, ids, unidad: gruppe[0].unidad });
    plan.push(...r1.map((a) => ({ ...a, stufe: 1, runde: 1, buchen: false })));
    plan.push(...rest.splice(0, WIEDERHOLUNGEN_ZWISCHEN_RUNDEN));
    plan.push(...r2.map((a) => ({ ...a, stufe: 2, runde: 2 })));
  });
  return [...plan, ...rest];
}

/** Ergebnis für den Scheduler aus Versuchsnummer und Richtigkeit (§5, §6.3). */
export function ergebnisAusVersuchen(versuch, richtig) {
  if (!richtig) return 'falsch';
  return versuch === 1 ? 'richtig' : 'hinweis';
}

export class Sitzung {
  constructor(aufgaben) {
    this.schlange = [...aufgaben];
    this.index = 0;
    this.bilanz = {};
  }

  get aktuelle() {
    return this.schlange[this.index] ?? null;
  }

  get fertig() {
    return this.index >= this.schlange.length;
  }

  get stand() {
    return { erledigt: this.index, gesamt: this.schlange.length };
  }

  /**
   * Schließt die aktuelle Aufgabe ab.
   * @returns {{buchen: boolean}} ob das Ergebnis im Leitner-Fach verbucht werden soll
   */
  verbuche(ergebnis) {
    const aufgabe = this.aktuelle;
    const buchen = !aufgabe.sitzungsWiederholung && aufgabe.buchen !== false && aufgabe.art !== 'lernen';
    if (buchen) {
      this.bilanz[ergebnis] = (this.bilanz[ergebnis] ?? 0) + 1;
      if (ergebnis === 'falsch') {
        this.schlange = wiederEinreihen(this.schlange, this.index, ABSTAND_WIEDERHOLUNG);
        const kopie = this.schlange.findIndex((a, i) => i > this.index && a.sitzungsWiederholung && a.id === aufgabe.id);
        if (this.schlange[kopie].stufe === 0) this.schlange[kopie] = { ...this.schlange[kopie], stufe: 1 };
      }
    }
    this.index += 1;
    return { buchen };
  }
}
