import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  SCHEMA, SCHLUESSEL, leererStand, ladeStand, speichereStand, migriere, exportiere, importiere
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
    assert.equal(s.einstellungen.neueProSitzung, 5);
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
    assert.equal(m.einstellungen.neueProSitzung, 5);
    assert.equal(m.items.a.fach, 1);
  });

  test('behält vorhandene Einstellungen', () => {
    const m = migriere({ schema: 1, einstellungen: { neueProSitzung: 3 } });
    assert.equal(m.einstellungen.neueProSitzung, 3);
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
