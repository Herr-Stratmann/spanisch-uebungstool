// Auswahl eines Vokabelbereichs wie in der Hausaufgabe: „Unidad 4 A S. 138 trabajar – S. 140 interesante“.
// Grundlage: Die Reihenfolge der Items in den Datendateien ist die Reihenfolge im Vocabulario.

const BLOQUE_NAME = { PP: 'Primer paso', A: 'Bloque A', B: 'Bloque B', C: 'Bloque C' };

/**
 * @param {object[]} items – alle Items in Buchreihenfolge
 * @param {{uk?: string, von?: string, bis?: string}} bereich – Unidad-Schlüssel und Item-IDs
 */
export function woerterImBereich(items, { uk, von, bis } = {}) {
  const liste = uk ? items.filter((x) => x.uk === uk) : [...items];
  if (!von && !bis) return liste;
  let a = von ? liste.findIndex((x) => x.id === von) : 0;
  let b = bis ? liste.findIndex((x) => x.id === bis) : liste.length - 1;
  if (a < 0) a = 0;
  if (b < 0) b = liste.length - 1;
  if (a > b) [a, b] = [b, a];
  return liste.slice(a, b + 1);
}

export function gruppenLabel(item) {
  const teile = [];
  if (item.seite) teile.push(`S. ${item.seite}`);
  if (item.bloque) teile.push(BLOQUE_NAME[item.bloque] ?? item.bloque);
  return teile.join(' · ') || 'Wörter';
}

/** Gruppen für <optgroup>: aufeinanderfolgende Items mit gleicher Seite und gleichem Bloque. */
export function seitenGruppen(items) {
  const gruppen = [];
  for (const item of items) {
    const label = gruppenLabel(item);
    const letzte = gruppen.at(-1);
    if (letzte && letzte.label === label) letzte.items.push(item);
    else gruppen.push({ label, items: [item] });
  }
  return gruppen;
}

/** Lesbare Beschreibung, z. B. für den Titel eines Lernplans. */
export function bereichsTitel(items, bereich, unidadTitel) {
  const alle = bereich.uk ? items.filter((x) => x.uk === bereich.uk) : items;
  const auswahl = woerterImBereich(items, bereich);
  if (!auswahl.length) return unidadTitel;
  if (auswahl.length === alle.length) return unidadTitel;
  const erstes = auswahl[0];
  const letztes = auswahl.at(-1);
  const seite = (x) => (x.seite ? `S. ${x.seite} ` : '');
  return `${unidadTitel} · ${seite(erstes)}„${erstes.es}“ – ${seite(letztes)}„${letztes.es}“`;
}
