import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  addiereTage, INTERVALL, bewerte, stufeFuerFach, istFaellig,
  stelleSitzungZusammen, wiederEinreihen
} from '../js/scheduler.js';

const HEUTE = '2026-11-09';

// Deterministischer Zufall für reproduzierbare Tests.
function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

describe('addiereTage', () => {
  test('rechnet über Monats- und Zeitumstellungsgrenzen', () => {
    assert.equal(addiereTage('2026-10-24', 2), '2026-10-26');
    assert.equal(addiereTage('2026-11-30', 1), '2026-12-01');
    assert.equal(addiereTage('2026-12-31', 16), '2027-01-16');
  });
});

describe('Intervalle (§5)', () => {
  test('Fach 1–5 → 1, 2, 4, 8, 16 Tage', () => {
    assert.deepEqual([1, 2, 3, 4, 5].map((f) => INTERVALL[f]), [1, 2, 4, 8, 16]);
  });
});

describe('bewerte (§5 Bewertung)', () => {
  test('neues Item richtig → Fach 1, fällig morgen', () => {
    const z = bewerte(undefined, 'richtig', HEUTE);
    assert.equal(z.fach, 1);
    assert.equal(z.faellig, '2026-11-10');
    assert.equal(z.richtig, 1);
    assert.equal(z.letzte, HEUTE);
  });

  test('richtig im 1. Versuch → +1 Fach mit passendem Abstand', () => {
    const z = bewerte({ fach: 2, faellig: HEUTE, richtig: 3, falsch: 0 }, 'richtig', HEUTE);
    assert.equal(z.fach, 3);
    assert.equal(z.faellig, addiereTage(HEUTE, 4));
  });

  test('Fach 5 bleibt in 16-Tage-Abständen aktiv', () => {
    const z = bewerte({ fach: 5, faellig: HEUTE, richtig: 9, falsch: 0 }, 'richtig', HEUTE);
    assert.equal(z.fach, 5);
    assert.equal(z.faellig, addiereTage(HEUTE, 16));
  });

  test('richtig nach Hinweis → Fach bleibt, fällig morgen', () => {
    const z = bewerte({ fach: 3, faellig: HEUTE, richtig: 2, falsch: 0 }, 'hinweis', HEUTE);
    assert.equal(z.fach, 3);
    assert.equal(z.faellig, '2026-11-10');
  });

  test('neues Item richtig nach Hinweis → mindestens Fach 1', () => {
    const z = bewerte(undefined, 'hinweis', HEUTE);
    assert.equal(z.fach, 1);
  });

  test('falsch → −2 Fächer, fällig morgen', () => {
    const z = bewerte({ fach: 4, faellig: HEUTE, richtig: 4, falsch: 0 }, 'falsch', HEUTE);
    assert.equal(z.fach, 2);
    assert.equal(z.faellig, '2026-11-10');
    assert.equal(z.falsch, 1);
  });

  test('falsch → minimal Fach 1', () => {
    assert.equal(bewerte({ fach: 2, faellig: HEUTE, richtig: 1, falsch: 0 }, 'falsch', HEUTE).fach, 1);
    assert.equal(bewerte(undefined, 'falsch', HEUTE).fach, 1);
  });

  test('3× hintereinander falsch → zurück in Fach 0 (erneute Einführung, §7)', () => {
    let z = bewerte(undefined, 'falsch', HEUTE);
    z = bewerte(z, 'falsch', HEUTE);
    assert.equal(z.fach, 1);
    z = bewerte(z, 'falsch', HEUTE);
    assert.equal(z.fach, 0);
    assert.equal(z.falschInFolge, 0);
    assert.equal(istFaellig(z, '2026-11-10'), true);
  });

  test('eine richtige Antwort unterbricht die Fehlerserie', () => {
    let z = bewerte(undefined, 'falsch', HEUTE);
    z = bewerte(z, 'falsch', HEUTE);
    z = bewerte(z, 'hinweis', HEUTE);
    z = bewerte(z, 'falsch', HEUTE);
    assert.equal(z.fach, 1);
  });

  test('Stufe-4-Selbstbewertung: passt +1, teilweise 0, noch nicht −1', () => {
    const basis = { fach: 4, faellig: HEUTE, richtig: 5, falsch: 0 };
    assert.equal(bewerte(basis, 'passt', HEUTE).fach, 5);
    assert.equal(bewerte(basis, 'teilweise', HEUTE).fach, 4);
    assert.equal(bewerte(basis, 'nochNicht', HEUTE).fach, 3);
    assert.equal(bewerte({ ...basis, fach: 1 }, 'nochNicht', HEUTE).fach, 1);
  });

  test('verändert den übergebenen Zustand nicht', () => {
    const alt = { fach: 2, faellig: HEUTE, richtig: 1, falsch: 0 };
    bewerte(alt, 'richtig', HEUTE);
    assert.equal(alt.fach, 2);
  });

  test('unbekanntes Ergebnis wirft einen Fehler', () => {
    assert.throws(() => bewerte(undefined, 'vielleicht', HEUTE));
  });
});

describe('bewerte – Entscheidung: Fach 4 → 5 nur über einen eigenen Satz', () => {
  const fach4 = { fach: 4, faellig: HEUTE, richtig: 6, falsch: 0 };

  test('richtige Stufe-3-Aufgabe in Fach 4 hält das Fach und verlangt als Nächstes einen Satz', () => {
    const z = bewerte(fach4, 'richtig', HEUTE);
    assert.equal(z.fach, 4);
    assert.equal(z.satzFaellig, true);
    assert.equal(z.faellig, addiereTage(HEUTE, INTERVALL[4]));
  });

  test('passt in Fach 4 → Fach 5 und gilt als gelernt', () => {
    const z = bewerte({ ...fach4, satzFaellig: true }, 'passt', HEUTE);
    assert.equal(z.fach, 5);
    assert.equal(z.satzFaellig, false);
    assert.equal(z.gelernt, true);
  });

  test('gelernt bleibt erhalten, auch wenn das Wort später zurückfällt', () => {
    const z = bewerte({ fach: 5, faellig: HEUTE, richtig: 9, falsch: 0, gelernt: true }, 'falsch', HEUTE);
    assert.equal(z.fach, 3);
    assert.equal(z.gelernt, true);
  });

  test('stufeFuerFach liefert Stufe 4, wenn ein Satz fällig ist', () => {
    assert.equal(stufeFuerFach(4, () => 0.1, { satzFaellig: true }), 4);
  });
});

describe('bewerte – Entscheidung: nicht fällige Items („Unidad üben“) zählen nur bei Fehlern', () => {
  const basis = { fach: 3, faellig: '2026-11-12', richtig: 2, falsch: 0 };

  test('richtig bei nicht fälligem Item: Fach und Fälligkeit bleiben, Zähler steigt', () => {
    const z = bewerte(basis, 'richtig', HEUTE, { nurFehlerZaehlen: true });
    assert.equal(z.fach, 3);
    assert.equal(z.faellig, '2026-11-12');
    assert.equal(z.richtig, 3);
    assert.equal(z.letzte, HEUTE);
  });

  test('passt bei nicht fälligem Item befördert nicht', () => {
    const z = bewerte({ ...basis, fach: 4 }, 'passt', HEUTE, { nurFehlerZaehlen: true });
    assert.equal(z.fach, 4);
  });

  test('falsch bei nicht fälligem Item stuft normal zurück', () => {
    const z = bewerte(basis, 'falsch', HEUTE, { nurFehlerZaehlen: true });
    assert.equal(z.fach, 1);
    assert.equal(z.faellig, '2026-11-10');
  });
});

describe('bewerte – Erstkontakt beim Wiederholen (Diagnose)', () => {
  test('richtig + sicher → Start in Fach 3', () => {
    const z = bewerte(undefined, 'richtig', HEUTE, { diagnose: true, sicher: true });
    assert.equal(z.fach, 3);
    assert.equal(z.faellig, addiereTage(HEUTE, 4));
  });
  test('richtig + unsicher → Start in Fach 2', () => {
    const z = bewerte(undefined, 'richtig', HEUTE, { diagnose: true, sicher: false });
    assert.equal(z.fach, 2);
    assert.equal(z.faellig, addiereTage(HEUTE, 2));
  });
  test('erst nach Hinweis → Fach 2, fällig morgen', () => {
    const z = bewerte(undefined, 'hinweis', HEUTE, { diagnose: true, sicher: true });
    assert.equal(z.fach, 2);
    assert.equal(z.faellig, '2026-11-10');
  });
  test('falsch → Fach 1', () => {
    assert.equal(bewerte(undefined, 'falsch', HEUTE, { diagnose: true, sicher: true }).fach, 1);
  });
  test('Diagnose wirkt nur beim allerersten Kontakt', () => {
    const z = bewerte({ fach: 1, faellig: HEUTE, richtig: 0, falsch: 1 }, 'richtig', HEUTE, { diagnose: true, sicher: true });
    assert.equal(z.fach, 2);
  });
  test('Erstkontakt-Datum wird gespeichert und später nicht überschrieben', () => {
    const z = bewerte(undefined, 'richtig', HEUTE);
    assert.equal(z.erstkontakt, HEUTE);
    assert.equal(bewerte(z, 'richtig', '2026-11-20').erstkontakt, HEUTE);
  });
});

describe('bewerte – Lernplan: spätestens bis zum Termin wiederholen', () => {
  test('Fälligkeit wird auf das spätestens-Datum gekappt', () => {
    const z = bewerte({ fach: 3, faellig: HEUTE, richtig: 2, falsch: 0 }, 'richtig', HEUTE, { spaetestens: '2026-11-11' });
    assert.equal(z.fach, 4);
    assert.equal(z.faellig, '2026-11-11');
  });
  test('frühere Fälligkeit bleibt unverändert', () => {
    const z = bewerte(undefined, 'falsch', HEUTE, { spaetestens: '2026-11-13' });
    assert.equal(z.faellig, '2026-11-10');
  });
});

describe('stufeFuerFach (§5 Fach → Stufe)', () => {
  test('feste Zuordnungen', () => {
    assert.equal(stufeFuerFach(0), 0);
    assert.equal(stufeFuerFach(2), 2);
    assert.equal(stufeFuerFach(3), 3);
    assert.equal(stufeFuerFach(5), 4);
  });
  test('Fach 1 → Stufe 1 oder 2, Fach 4 → Stufe 3 oder 4', () => {
    assert.equal(stufeFuerFach(1, () => 0.1), 1);
    assert.equal(stufeFuerFach(1, () => 0.9), 2);
    assert.equal(stufeFuerFach(4, () => 0.1), 3);
    assert.equal(stufeFuerFach(4, () => 0.9), 4);
  });
});

// --- Sitzung ---------------------------------------------------------------

function item(id, unidad, extra = {}) {
  return { id, unidad, nicht_zusammen_mit: [], ...extra };
}

function vieleItems(anzahlJeUnidad, unidades = [1, 2, 3]) {
  const liste = [];
  for (const u of unidades) {
    for (let i = 1; i <= anzahlJeUnidad; i++) liste.push(item(`u0${u}-${String(i).padStart(3, '0')}`, u));
  }
  return liste;
}

describe('stelleSitzungZusammen (§5 Sitzung)', () => {
  test('nimmt nur fällige Wiederholungen, keine noch nicht fälligen', () => {
    const items = [item('a', 1), item('b', 1)];
    const fortschritt = {
      a: { fach: 2, faellig: '2026-11-08' },
      b: { fach: 2, faellig: '2026-11-12' }
    };
    const s = stelleSitzungZusammen({ items, fortschritt, heute: HEUTE, rng: seeded() });
    assert.deepEqual(s.map((a) => a.id), ['a']);
  });

  test('höchstens 5 neue Items und höchstens max Aufgaben', () => {
    const items = vieleItems(20);
    const s = stelleSitzungZusammen({ items, fortschritt: {}, heute: HEUTE, rng: seeded() });
    assert.equal(s.filter((a) => a.neu).length, 5);
    assert.ok(s.length <= 15);
  });

  test('neue Items kommen in Lehrbuch-Reihenfolge', () => {
    const items = vieleItems(10);
    const s = stelleSitzungZusammen({ items, fortschritt: {}, heute: HEUTE, rng: seeded() });
    const neu = s.filter((a) => a.neu).map((a) => a.id).sort();
    assert.deepEqual(neu, ['u01-001', 'u01-002', 'u01-003', 'u01-004', 'u01-005']);
  });

  test('neue Items starten mit Stufe 0 (Einführung)', () => {
    const s = stelleSitzungZusammen({ items: [item('a', 1)], fortschritt: {}, heute: HEUTE, rng: seeded() });
    assert.equal(s[0].stufe, 0);
  });

  test('ca. 70 % Wiederholungen, wenn genug fällig ist', () => {
    const items = vieleItems(20);
    const fortschritt = {};
    items.slice(0, 30).forEach((it) => { fortschritt[it.id] = { fach: 2, faellig: '2026-11-01' }; });
    const s = stelleSitzungZusammen({ items, fortschritt, heute: HEUTE, max: 15, rng: seeded() });
    assert.equal(s.length, 15);
    const wdh = s.filter((a) => !a.neu).length;
    assert.ok(wdh >= 10 && wdh <= 11, `Wiederholungen: ${wdh}`);
  });

  test('bei mehr fälligen als Plätzen: die am längsten überfälligen zuerst', () => {
    const items = vieleItems(10, [1, 2]);
    const fortschritt = {};
    items.forEach((it, i) => { fortschritt[it.id] = { fach: 2, faellig: addiereTage('2026-10-01', i) }; });
    const s = stelleSitzungZusammen({ items, fortschritt, heute: HEUTE, max: 5, rng: seeded() });
    assert.deepEqual(s.map((a) => a.id).sort(), items.slice(0, 5).map((it) => it.id));
  });

  test('füllt mit Wiederholungen auf, wenn es keine neuen Items gibt', () => {
    const items = vieleItems(10, [1, 2]);
    const fortschritt = {};
    items.forEach((it) => { fortschritt[it.id] = { fach: 3, faellig: '2026-11-01' }; });
    const s = stelleSitzungZusammen({ items, fortschritt, heute: HEUTE, max: 15, rng: seeded() });
    assert.equal(s.length, 15);
  });

  test('nicht_zusammen_mit: Items werden nicht in derselben Sitzung neu eingeführt (beide Richtungen)', () => {
    const items = [
      item('lunes', 4, { nicht_zusammen_mit: ['martes'] }),
      item('martes', 4),
      item('blanco', 8),
      item('negro', 8, { nicht_zusammen_mit: ['blanco'] })
    ];
    const s = stelleSitzungZusammen({ items, fortschritt: {}, heute: HEUTE, rng: seeded() });
    const ids = s.map((a) => a.id);
    assert.ok(!(ids.includes('lunes') && ids.includes('martes')));
    assert.ok(!(ids.includes('blanco') && ids.includes('negro')));
    assert.ok(ids.includes('lunes') && ids.includes('blanco'));
  });

  test('nicht_zusammen_mit gilt nicht für Wiederholungen (Mischen erlaubt)', () => {
    const items = [item('lunes', 4, { nicht_zusammen_mit: ['martes'] }), item('martes', 4)];
    const fortschritt = {
      lunes: { fach: 2, faellig: '2026-11-01' },
      martes: { fach: 2, faellig: '2026-11-01' }
    };
    const s = stelleSitzungZusammen({ items, fortschritt, heute: HEUTE, rng: seeded() });
    assert.equal(s.length, 2);
  });

  test('mischt Unidades: keine zwei gleichen Unidades nebeneinander, wenn vermeidbar', () => {
    const items = vieleItems(5, [1, 2, 3]);
    const fortschritt = {};
    items.forEach((it) => { fortschritt[it.id] = { fach: 2, faellig: '2026-11-01' }; });
    for (const seed of [1, 2, 3, 4, 5]) {
      const s = stelleSitzungZusammen({ items, fortschritt, heute: HEUTE, max: 15, rng: seeded(seed) });
      for (let i = 1; i < s.length; i++) {
        assert.notEqual(s[i].unidad, s[i - 1].unidad, `Seed ${seed}, Position ${i}`);
      }
    }
  });

  test('Filter („Unidad üben“) schränkt die Auswahl ein', () => {
    const items = vieleItems(5, [1, 2]);
    const s = stelleSitzungZusammen({
      items, fortschritt: {}, heute: HEUTE, rng: seeded(), filter: (it) => it.unidad === 2
    });
    assert.ok(s.length > 0);
    assert.ok(s.every((a) => a.unidad === 2));
  });

  test('auffuellen („Unidad üben“): ergänzt nicht fällige Items, als solche markiert', () => {
    const items = vieleItems(10, [2]);
    const fortschritt = {};
    items.forEach((it, i) => { fortschritt[it.id] = { fach: 3, faellig: addiereTage('2026-11-10', i) }; });
    fortschritt['u02-001'].faellig = '2026-11-01';
    const s = stelleSitzungZusammen({ items, fortschritt, heute: HEUTE, max: 5, rng: seeded(), auffuellen: true });
    assert.equal(s.length, 5);
    assert.equal(s.find((a) => a.id === 'u02-001').faellig, true);
    assert.equal(s.filter((a) => a.faellig === false).length, 4);
    assert.ok(!s.some((a) => a.id === 'u02-010'), 'zuerst die bald fälligen');
  });

  test('ohne auffuellen sind alle Aufgaben fällig oder neu', () => {
    const s = stelleSitzungZusammen({ items: vieleItems(3), fortschritt: {}, heute: HEUTE, rng: seeded() });
    assert.ok(s.every((a) => a.faellig === true));
  });

  test('Wiederholen (Diagnose): erst Fälliges, dann Unbekanntes direkt in Stufe 2, keine Einführung', () => {
    const items = vieleItems(10, [1]);
    const fortschritt = { 'u01-001': { fach: 2, faellig: '2026-11-01' } };
    const s = stelleSitzungZusammen({ items, fortschritt, heute: HEUTE, max: 6, erstkontakt: 'diagnose', rng: seeded() });
    assert.equal(s.length, 6);
    assert.ok(s.some((a) => a.id === 'u01-001' && !a.neu));
    const neue = s.filter((a) => a.neu);
    assert.equal(neue.length, 5);
    assert.ok(neue.every((a) => a.stufe === 2 && a.erstkontakt === 'diagnose'));
  });

  test('Wiederholen ignoriert nicht_zusammen_mit (alles schon einmal gelernt)', () => {
    const items = [item('lunes', 4, { nicht_zusammen_mit: ['martes'] }), item('martes', 4)];
    const s = stelleSitzungZusammen({ items, fortschritt: {}, heute: HEUTE, erstkontakt: 'diagnose', rng: seeded() });
    assert.equal(s.length, 2);
  });

  test('neueKandidaten (Lernplan): nur diese werden neu eingeführt, in ihrer Reihenfolge', () => {
    const items = vieleItems(10, [1]);
    const kandidaten = [items[7], items[3]];
    const s = stelleSitzungZusammen({ items, fortschritt: {}, heute: HEUTE, neueKandidaten: kandidaten, neueAnzahl: 2, rng: seeded() });
    assert.deepEqual(s.map((a) => a.id).sort(), ['u01-004', 'u01-008']);
    assert.ok(s.every((a) => a.stufe === 0 && a.erstkontakt === 'neu'));
  });

  test('ohne neueKandidaten und neueAnzahl 0 gibt es nur Wiederholungen', () => {
    const s = stelleSitzungZusammen({ items: vieleItems(5), fortschritt: {}, heute: HEUTE, neueAnzahl: 0, rng: seeded() });
    assert.equal(s.length, 0);
  });

  test('neueMax aus den Einstellungen wird beachtet', () => {
    const s = stelleSitzungZusammen({ items: vieleItems(10), fortschritt: {}, heute: HEUTE, neueMax: 2, rng: seeded() });
    assert.equal(s.filter((a) => a.neu).length, 2);
  });
});

describe('wiederEinreihen (§5: falsch → in derselben Sitzung erneut)', () => {
  test('fügt die Aufgabe einige Positionen später erneut ein, markiert als Sitzungswiederholung', () => {
    const q = ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id, stufe: 1 }));
    const neu = wiederEinreihen(q, 0, 3);
    assert.equal(neu.length, 6);
    assert.equal(neu[4].id, 'a');
    assert.equal(neu[4].sitzungsWiederholung, true);
    assert.equal(q.length, 5);
  });

  test('am Ende der Schlange wird hinten angehängt', () => {
    const q = [{ id: 'a', stufe: 1 }, { id: 'b', stufe: 1 }];
    const neu = wiederEinreihen(q, 1, 3);
    assert.equal(neu.at(-1).id, 'b');
    assert.equal(neu.length, 3);
  });
});
