// Lokaler Fortschritt (SPEC §8.3): localStorage, Migration, Export/Import.
// Keine personenbezogenen Daten, kein Server.

export const SCHEMA = 1;
// Eindeutiger Schlüssel: Unter <name>.github.io teilen sich alle Pages-Projekte einen Speicher.
export const SCHLUESSEL = 'cjd-spanisch:fortschritt';

const STANDARD_EINSTELLUNGEN = Object.freeze({ neueProSitzung: 5, audio: true });

export function leererStand() {
  return {
    schema: SCHEMA,
    items: {},
    phaenomene: {},
    saetze: [],
    einstellungen: { ...STANDARD_EINSTELLUNGEN }
  };
}

function istObjekt(x) {
  return x !== null && typeof x === 'object' && !Array.isArray(x);
}

/** Bringt einen Stand beliebiger älterer Version auf das aktuelle Schema. */
export function migriere(roh) {
  const version = Number(roh?.schema ?? 0);
  if (version > SCHEMA) {
    throw new Error('Dieser Fortschritt stammt aus einer neueren Version des Tools. Bitte die Seite neu laden.');
  }
  // Schema 0 → 1: fehlende Bereiche ergänzen. Künftige Schritte hier anhängen (if version < 2 …).
  const basis = leererStand();
  return {
    schema: SCHEMA,
    items: istObjekt(roh?.items) ? roh.items : basis.items,
    phaenomene: istObjekt(roh?.phaenomene) ? roh.phaenomene : basis.phaenomene,
    saetze: Array.isArray(roh?.saetze) ? roh.saetze : basis.saetze,
    einstellungen: { ...basis.einstellungen, ...(istObjekt(roh?.einstellungen) ? roh.einstellungen : {}) }
  };
}

export function ladeStand(speicher = globalThis.localStorage) {
  try {
    const text = speicher?.getItem(SCHLUESSEL);
    if (!text) return leererStand();
    return migriere(JSON.parse(text));
  } catch {
    return leererStand();
  }
}

/** @returns {boolean} ob gespeichert wurde */
export function speichereStand(stand, speicher = globalThis.localStorage, { beamer = false } = {}) {
  if (beamer) return false;
  try {
    speicher.setItem(SCHLUESSEL, JSON.stringify(stand));
    return true;
  } catch {
    return false;
  }
}

export function exportiere(stand) {
  return JSON.stringify(stand, null, 2);
}

export function importiere(text) {
  let roh;
  try {
    roh = JSON.parse(text);
  } catch {
    throw new Error('Das ist keine gültige Fortschrittsdatei.');
  }
  if (!istObjekt(roh) || !('schema' in roh) || !istObjekt(roh.items)) {
    throw new Error('Das ist keine gültige Fortschrittsdatei.');
  }
  return migriere(roh);
}
