// Leitner-Logik und Sitzungszusammenstellung (SPEC §5, §7 Wortschatz).
// Reines Modul: Datum und Zufall werden hereingereicht, damit alles testbar bleibt.

/** Abstand in Tagen nach richtiger Antwort, je Fach. */
export const INTERVALL = Object.freeze({ 1: 1, 2: 2, 3: 4, 4: 8, 5: 16 });
export const MAX_FACH = 5;
const FEHLER_BIS_NEUEINFUEHRUNG = 3;
const ANTEIL_NEU = 0.3;

/** ISO-Datum (YYYY-MM-DD) + n Tage. Rechnet in UTC, damit Zeitumstellungen egal sind. */
export function addiereTage(iso, n) {
  const [j, m, t] = iso.split('-').map(Number);
  const d = new Date(Date.UTC(j, m - 1, t + n));
  return d.toISOString().slice(0, 10);
}

/** Heutiges Datum in lokaler Zeit als ISO-String. */
export function heuteISO(jetzt = new Date()) {
  const j = jetzt.getFullYear();
  const m = String(jetzt.getMonth() + 1).padStart(2, '0');
  const t = String(jetzt.getDate()).padStart(2, '0');
  return `${j}-${m}-${t}`;
}

export function istFaellig(zustand, heute) {
  return Boolean(zustand) && zustand.faellig <= heute;
}

/**
 * Neuer Lernstand eines Items nach einer Antwort.
 * @param {object|undefined} zustand – bisheriger Stand oder undefined für neue Items
 * @param {'richtig'|'hinweis'|'falsch'|'passt'|'teilweise'|'nochNicht'} ergebnis
 * @param {string} heute – ISO-Datum
 */
export function bewerte(zustand, ergebnis, heute) {
  const alt = { fach: 0, richtig: 0, falsch: 0, falschInFolge: 0, ...zustand };
  const neu = { ...alt, letzte: heute };
  const morgen = addiereTage(heute, 1);

  switch (ergebnis) {
    case 'richtig':
    case 'passt':
      neu.fach = Math.min(MAX_FACH, alt.fach + 1);
      neu.faellig = addiereTage(heute, INTERVALL[neu.fach]);
      neu.richtig = alt.richtig + 1;
      neu.falschInFolge = 0;
      break;
    case 'hinweis':
      neu.fach = Math.max(1, alt.fach);
      neu.faellig = morgen;
      neu.richtig = alt.richtig + 1;
      neu.falschInFolge = 0;
      break;
    case 'teilweise':
      neu.fach = Math.max(1, alt.fach);
      neu.faellig = morgen;
      neu.falschInFolge = 0;
      break;
    case 'nochNicht':
      neu.fach = Math.max(1, alt.fach - 1);
      neu.faellig = morgen;
      neu.falsch = alt.falsch + 1;
      break;
    case 'falsch':
      neu.falsch = alt.falsch + 1;
      neu.falschInFolge = alt.falschInFolge + 1;
      neu.faellig = morgen;
      if (neu.falschInFolge >= FEHLER_BIS_NEUEINFUEHRUNG) {
        neu.fach = 0; // erneute Einführung (§7)
        neu.falschInFolge = 0;
      } else {
        neu.fach = Math.max(1, alt.fach - 2);
      }
      break;
    default:
      throw new Error(`Unbekanntes Ergebnis: ${ergebnis}`);
  }
  return neu;
}

/** Übungsstufe für ein Fach. 0 = Einführung (anschließend sofort Stufe 1). */
export function stufeFuerFach(fach, rng = Math.random) {
  switch (fach) {
    case 0: return 0;
    case 1: return rng() < 0.5 ? 1 : 2;
    case 2: return 2;
    case 3: return 3;
    case 4: return rng() < 0.5 ? 3 : 4;
    default: return 4;
  }
}

function mische(liste, rng) {
  const a = [...liste];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Ordnet so an, dass möglichst nie zwei Aufgaben derselben Unidad aufeinander folgen. */
function verteileUnidades(aufgaben, rng) {
  const gruppen = new Map();
  for (const a of mische(aufgaben, rng)) {
    if (!gruppen.has(a.unidad)) gruppen.set(a.unidad, []);
    gruppen.get(a.unidad).push(a);
  }
  const ergebnis = [];
  let letzte;
  while (ergebnis.length < aufgaben.length) {
    const kandidaten = [...gruppen.entries()]
      .filter(([u, g]) => g.length > 0 && u !== letzte)
      .sort((x, y) => y[1].length - x[1].length);
    const [u, g] = kandidaten.length
      ? kandidaten[0]
      : [...gruppen.entries()].find(([, g2]) => g2.length > 0);
    ergebnis.push(g.shift());
    letzte = u;
  }
  return ergebnis;
}

function waehleNeue(kandidaten, anzahl) {
  const gewaehlt = [];
  const gesperrt = new Set();
  for (const it of kandidaten) {
    if (gewaehlt.length >= anzahl) break;
    if (gesperrt.has(it.id)) continue;
    const eigene = it.nicht_zusammen_mit ?? [];
    const konflikt = gewaehlt.some((g) => eigene.includes(g.id));
    if (konflikt) continue;
    gewaehlt.push(it);
    for (const id of it.nicht_zusammen_mit ?? []) gesperrt.add(id);
  }
  return gewaehlt;
}

/**
 * Stellt eine Übungssitzung zusammen.
 * @returns {{id, unidad, fach, stufe, neu}[]}
 */
export function stelleSitzungZusammen({
  items, fortschritt = {}, heute, max = 15, neueMax = 5, rng = Math.random, filter = () => true
}) {
  const pool = items.filter(filter);

  const faellige = mische(pool.filter((it) => istFaellig(fortschritt[it.id], heute)), rng)
    .sort((a, b) => fortschritt[a.id].faellig.localeCompare(fortschritt[b.id].faellig));
  const unbekannt = pool.filter((it) => !fortschritt[it.id]); // Datenreihenfolge = Lehrbuchreihenfolge

  const neuZiel = Math.min(neueMax, Math.round(max * ANTEIL_NEU));
  const neue = waehleNeue(unbekannt, Math.min(neuZiel, max));
  const wiederholungen = faellige.slice(0, max - neue.length);

  const aufgaben = [
    ...wiederholungen.map((it) => {
      const fach = fortschritt[it.id].fach;
      return { id: it.id, unidad: it.unidad, fach, stufe: stufeFuerFach(fach, rng), neu: false };
    }),
    ...neue.map((it) => ({ id: it.id, unidad: it.unidad, fach: 0, stufe: 0, neu: true }))
  ];
  return verteileUnidades(aufgaben, rng);
}

/**
 * Reiht eine falsch beantwortete Aufgabe weiter hinten erneut ein.
 * Sitzungswiederholungen dienen dem Üben und werden nicht erneut im Leitner-Fach verbucht.
 */
export function wiederEinreihen(warteschlange, index, abstand = 3) {
  const kopie = [...warteschlange];
  const aufgabe = { ...warteschlange[index], sitzungsWiederholung: true };
  const ziel = Math.min(index + 1 + abstand, kopie.length);
  kopie.splice(ziel, 0, aufgabe);
  return kopie;
}
