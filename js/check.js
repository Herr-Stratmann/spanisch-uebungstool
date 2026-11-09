// Antwortprüfung: Normalisierung und Fehlerklassen (SPEC §6).
// Reines Modul ohne DOM-Zugriff, damit es mit `node --test` prüfbar bleibt.

const SATZZEICHEN_ENDE = /[\s.!?…,;:]+$/u;
const UMGEKEHRTE_ZEICHEN = /[¿¡]/gu;
const ARTIKEL = /^(el|la|los|las) /u;
const MIN_LAENGE_TIPPFEHLER = 5;

/** Vergleichsform einer Eingabe (§6.1). */
export function normalisiere(text) {
  return String(text ?? '')
    .normalize('NFC')
    .replace(UMGEKEHRTE_ZEICHEN, '')
    .toLowerCase()
    .replace(/\s+/gu, ' ')
    .trim()
    .replace(SATZZEICHEN_ENDE, '')
    .trim();
}

/** Entfernt á é í ó ú ü. Das ñ bleibt bewusst erhalten (eigener Buchstabe). */
export function ohneAkzente(text) {
  return text
    .replace(/á/gu, 'a').replace(/é/gu, 'e').replace(/í/gu, 'i')
    .replace(/ó/gu, 'o').replace(/[úü]/gu, 'u')
    .replace(/Á/gu, 'A').replace(/É/gu, 'E').replace(/Í/gu, 'I')
    .replace(/Ó/gu, 'O').replace(/[ÚÜ]/gu, 'U');
}

export function levenshtein(a, b) {
  const s = [...a];
  const t = [...b];
  let vorher = Array.from({ length: t.length + 1 }, (_, j) => j);
  for (let i = 1; i <= s.length; i++) {
    const aktuell = [i];
    for (let j = 1; j <= t.length; j++) {
      const kosten = s[i - 1] === t[j - 1] ? 0 : 1;
      aktuell[j] = Math.min(vorher[j] + 1, aktuell[j - 1] + 1, vorher[j - 1] + kosten);
    }
    vorher = aktuell;
  }
  return vorher[t.length];
}

// Rangfolge, falls mehrere akzeptierte Lösungen unterschiedlich nah dran sind.
const RANG = ['richtig', 'akzent', 'enye', 'artikel', 'tippfehler', 'falsch'];

function klassifiziere(eingabe, ziel) {
  if (eingabe === ziel) return 'richtig';
  const e = ohneAkzente(eingabe);
  const z = ohneAkzente(ziel);
  if (e === z) return 'akzent';
  if (z.includes('ñ') && e === z.replace(/ñ/gu, 'n')) return 'enye';
  if (ARTIKEL.test(z) && e === z.replace(ARTIKEL, '')) return 'artikel';
  if ([...z].length >= MIN_LAENGE_TIPPFEHLER && levenshtein(e, z) === 1) return 'tippfehler';
  return 'falsch';
}

function hinweisFuer(klasse, loesung) {
  switch (klasse) {
    case 'akzent': return `Richtig! Achte auf den Akzent: ${loesung}`;
    case 'enye': return 'Achte auf das ñ – es ist ein eigener Buchstabe (año ≠ ano).';
    case 'artikel': return 'Der Artikel fehlt. Lerne Substantive immer mit el, la, los oder las.';
    case 'tippfehler': return 'Fast! Prüf die Schreibung.';
    case 'falsch': {
      const zeichen = [...loesung];
      return `Die Lösung beginnt mit „${zeichen[0]}“ und hat ${zeichen.length} Zeichen.`;
    }
    default: return '';
  }
}

/**
 * Prüft eine Antwort.
 * @param {string} eingabe – was die Person getippt hat
 * @param {object} aufgabe – { akzeptiert: string[], fehlantworten?: {antwort: fehlertypId}, fehlertypen?: [{id, hinweis}] }
 * @param {object} [kontext] – { versuch: 1|2, sicher: boolean }
 */
export function pruefeAntwort(eingabe, aufgabe, kontext = {}) {
  const versuch = kontext.versuch ?? 1;
  const sicher = kontext.sicher === true;
  const akzeptiert = aufgabe.akzeptiert ?? [];
  const e = normalisiere(eingabe);

  let klasse = 'falsch';
  let loesung = akzeptiert[0] ?? '';
  let fehlertyp = null;
  let hinweis = '';

  const exakt = akzeptiert.find((a) => normalisiere(a) === e);
  if (exakt !== undefined && e !== '') {
    klasse = 'richtig';
    loesung = exakt;
  } else {
    // Ausdrücklich hinterlegte Fehlantworten haben Vorrang vor den Toleranzen.
    const fehlantworten = Object.entries(aufgabe.fehlantworten ?? {});
    const treffer = fehlantworten.find(([antwort]) => normalisiere(antwort) === e);
    if (treffer && e !== '') {
      klasse = 'fehlertyp';
      fehlertyp = treffer[1];
      const eintrag = (aufgabe.fehlertypen ?? []).find((f) => f.id === fehlertyp);
      hinweis = eintrag?.hinweis ?? hinweisFuer('falsch', loesung);
    } else if (e !== '') {
      let besterRang = RANG.length;
      for (const a of akzeptiert) {
        const k = klassifiziere(e, normalisiere(a));
        const rang = RANG.indexOf(k);
        if (rang < besterRang) {
          besterRang = rang;
          klasse = k;
          loesung = a;
        }
      }
    }
    if (klasse !== 'fehlertyp') hinweis = hinweisFuer(klasse, loesung);
  }

  const richtig = klasse === 'richtig' || klasse === 'akzent';
  return {
    klasse,
    richtig,
    loesung,
    hinweis,
    fehlertyp,
    zweiterVersuch: !richtig && versuch < 2,
    zeigeLoesung: !richtig && versuch >= 2,
    hervorheben: !richtig && sicher
  };
}
