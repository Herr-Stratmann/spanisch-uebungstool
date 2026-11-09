import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  SCHEMA, SCHLUESSEL, leererStand, ladeStand, speichereStand, migriere, exportiere, importiere,
  sicherungFaellig, markiereSicherung, verschiebeErinnerung
} from '../js/storage.js';

// Minimaler Ersatz für window.localStorage (gleiche Schnittstelle).
function speicher(anfang = {}) {
  const daten = { ...anfang };
  return {
    daten,
    getItem: (k) => (k in daten ? daten[k] : null),
    setItem: (k, v) => { daten[k] = String(v); }
  };
}

describe('leererStand', () => {
  test('hat die Struktur aus §8.3', () => {
    const s = leererStand();
    assert.equal(s.schema, SCHEMA);
    assert.deepEqual(s.items, {});
    assert.deepEqual(s.phaenomene, {});
    assert.deepEqual(s.saetze, []);
    assert.deepEqual(s.plaene, []);
    assert.equal(s.einstellungen.wiederholenAnzahl, 15);
    assert.equal(s.einstellungen.audio, true);
  });
});

describe('laden und speichern', () => {
  test('speichert und lädt denselben Stand', () => {
    const sp = speicher();
    const s = leererStand();
    s.items['u01-001'] = { fach: 2, faellig: '2026-11-10', richtig: 2, falsch: 0, letzte: '2026-11-08' };
    speichereStand(s, sp);
    assert.deepEqual(ladeStand(sp), s);
  });

  test('ohne gespeicherte Daten gibt es einen leeren Stand', () => {
    assert.deepEqual(ladeStand(speicher()), leererStand());
  });

  test('kaputte Daten führen zu leerem Stand statt Absturz', () => {
    assert.deepEqual(ladeStand(speicher({ [SCHLUESSEL]: '{kaputt' })), leererStand());
  });

  test('fehlender Speicher (z. B. privater Modus) wirft nicht', () => {
    const kaputt = { getItem() { throw new Error('SecurityError'); }, setItem() { throw new Error('QuotaExceeded'); } };
    assert.deepEqual(ladeStand(kaputt), leererStand());
    assert.equal(speichereStand(leererStand(), kaputt), false);
  });

  test('Beamermodus speichert nichts (§9)', () => {
    const sp = speicher();
    assert.equal(speichereStand(leererStand(), sp, { beamer: true }), false);
    assert.equal(sp.getItem(SCHLUESSEL), null);
  });
});

describe('migriere', () => {
  test('ergänzt fehlende Felder älterer oder unvollständiger Stände', () => {
    const m = migriere({ items: { a: { fach: 1, faellig: '2026-11-01' } } });
    assert.equal(m.schema, SCHEMA);
    assert.deepEqual(m.saetze, []);
    assert.deepEqual(m.plaene, []);
    assert.equal(m.einstellungen.wiederholenAnzahl, 15);
    assert.equal(m.items.a.fach, 1);
  });

  test('behält vorhandene Einstellungen', () => {
    const m = migriere({ schema: 1, einstellungen: { wiederholenAnzahl: 20 }, plaene: [{ id: 'p1' }] });
    assert.equal(m.einstellungen.wiederholenAnzahl, 20);
    assert.equal(m.plaene.length, 1);
    assert.equal(m.einstellungen.audio, true);
  });

  test('lehnt Stände aus einer neueren Version ab', () => {
    assert.throws(() => migriere({ schema: SCHEMA + 1 }), /neueren Version/);
  });
});

describe('Export/Import', () => {
  test('Export und Import ergeben denselben Stand', () => {
    const s = leererStand();
    s.saetze.push({ item: 'u01-001', text: '¡Hola! Me llamo Ana.', selbst: 'passt', datum: '2026-11-08' });
    assert.deepEqual(importiere(exportiere(s)), s);
  });

  test('Import lehnt Dateien ohne passende Struktur verständlich ab', () => {
    assert.throws(() => importiere('kein json'), /keine gültige Fortschrittsdatei/);
    assert.throws(() => importiere('{"foo": 1}'), /keine gültige Fortschrittsdatei/);
    assert.throws(() => importiere('[]'), /keine gültige Fortschrittsdatei/);
  });
});

describe('Sicherungserinnerung', () => {
  const mitUebung = (erstkontakt) => {
    const s = leererStand();
    s.items['u01-001'] = { fach: 2, faellig: '2026-11-20', erstkontakt };
    return s;
  };

  test('ohne Lernstand keine Erinnerung', () => {
    assert.equal(sicherungFaellig(leererStand(), '2026-11-09'), false);
  });

  test('noch nie gesichert: Erinnerung 7 Tage nach dem ersten Üben', () => {
    assert.equal(sicherungFaellig(mitUebung('2026-11-03'), '2026-11-09'), false);
    assert.equal(sicherungFaellig(mitUebung('2026-11-02'), '2026-11-09'), true);
  });

  test('nach einer Sicherung: Erinnerung nach 14 Tagen', () => {
    const s = mitUebung('2026-10-01');
    markiereSicherung(s, '2026-11-01');
    assert.equal(s.einstellungen.letzteSicherung, '2026-11-01');
    assert.equal(sicherungFaellig(s, '2026-11-14'), false);
    assert.equal(sicherungFaellig(s, '2026-11-15'), true);
  });

  test('„Später“ schiebt die Erinnerung um 3 Tage', () => {
    const s = mitUebung('2026-10-01');
    verschiebeErinnerung(s, '2026-11-09');
    assert.equal(sicherungFaellig(s, '2026-11-11'), false);
    assert.equal(sicherungFaellig(s, '2026-11-12'), true);
  });

  test('ältere Stände ohne Erstkontakt-Datum nutzen das Datum der letzten Übung', () => {
    const s = leererStand();
    s.items.a = { fach: 1, faellig: '2026-11-10', letzte: '2026-10-20' };
    assert.equal(sicherungFaellig(s, '2026-11-09'), true);
  });
});
