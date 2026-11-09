// Ablauf einer Übungssitzung (Warteschlange, erneute Abfrage, Bilanz).
// Reines Modul ohne DOM. Das Verbuchen im Leitner-Fach übernimmt die Oberfläche mit scheduler.bewerte().

import { wiederEinreihen } from './scheduler.js';

const ABSTAND_WIEDERHOLUNG = 3;

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
    const buchen = !aufgabe.sitzungsWiederholung;
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
