// Lernpläne für „Neu lernen“: Bis zum Termin werden die Wörter gleichmäßig auf die Tage verteilt.
// Der letzte Tag vor dem Termin bleibt für die Wiederholung frei. Ausgelassene Tage werden nachverteilt.

import { addiereTage } from './scheduler.js';

function tageZwischen(von, bis) {
  const ms = (iso) => { const [j, m, t] = iso.split('-').map(Number); return Date.UTC(j, m - 1, t); };
  return Math.round((ms(bis) - ms(von)) / 86400000);
}

/**
 * @param {{titel: string, itemIds: string[], heute: string, tage: number, bereich?: object}} p
 * tage = wie viele Tage noch Zeit ist; ziel = heute + tage (z. B. der Tag des Vokabeltests).
 */
export function erstellePlan({ titel, itemIds, heute, tage, bereich = null }) {
  const n = Math.max(1, Math.round(tage));
  const ziel = addiereTage(heute, n);
  const lernEnde = n >= 3 ? addiereTage(ziel, -2) : heute;
  return {
    id: `p-${heute}-${Math.random().toString(36).slice(2, 8)}`,
    titel, itemIds: [...itemIds], bereich, start: heute, ziel, lernEnde
  };
}

export function planAktiv(plan, heute) {
  return heute < plan.ziel;
}

const unbekannt = (plan, fortschritt) => plan.itemIds.filter((id) => !fortschritt[id]);

/** Wie viele neue Wörter dieser Plan heute noch einführen soll. */
export function tagesPortion(plan, fortschritt, heute) {
  if (!planAktiv(plan, heute)) return 0;
  const rest = unbekannt(plan, fortschritt).length;
  const heuteEingefuehrt = plan.itemIds.filter((id) => fortschritt[id]?.erstkontakt === heute).length;
  const tageUebrig = Math.max(1, tageZwischen(heute, plan.lernEnde) + 1);
  const ziel = Math.ceil((rest + heuteEingefuehrt) / tageUebrig);
  return Math.max(0, Math.min(rest, ziel - heuteEingefuehrt));
}

/** IDs der Wörter, die heute aus allen aktiven Plänen neu eingeführt werden (Planreihenfolge). */
export function neueFuerHeute(plaene, fortschritt, heute) {
  const ergebnis = [];
  for (const plan of plaene) {
    const portion = tagesPortion(plan, fortschritt, heute);
    for (const id of unbekannt(plan, fortschritt).slice(0, portion)) {
      if (!ergebnis.includes(id)) ergebnis.push(id);
    }
  }
  return ergebnis;
}

/** Spätestes Wiederholungsdatum für ein Wort: Vortag des frühesten Termins aktiver Pläne. */
export function spaetestensFuer(itemId, plaene, heute) {
  const daten = plaene
    .filter((p) => planAktiv(p, heute) && p.itemIds.includes(itemId))
    .map((p) => addiereTage(p.ziel, -1))
    .filter((d) => d > heute)
    .sort();
  return daten[0];
}

export function planStand(plan, fortschritt) {
  const zustaende = plan.itemIds.map((id) => fortschritt[id]).filter(Boolean);
  return {
    gesamt: plan.itemIds.length,
    eingefuehrt: zustaende.length,
    sicher: zustaende.filter((z) => z.fach >= 3).length
  };
}
