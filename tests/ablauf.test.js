import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Sitzung, ergebnisAusVersuchen } from '../js/ablauf.js';

const aufgaben = () => ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id, stufe: 2, faellig: true }));

describe('ergebnisAusVersuchen (§5/§6.3)', () => {
  test('richtig im 1. Versuch → richtig', () => assert.equal(ergebnisAusVersuchen(1, true), 'richtig'));
  test('richtig im 2. Versuch → hinweis', () => assert.equal(ergebnisAusVersuchen(2, true), 'hinweis'));
  test('falsch im 2. Versuch → falsch', () => assert.equal(ergebnisAusVersuchen(2, false), 'falsch'));
});

describe('Sitzung', () => {
  test('läuft die Aufgaben der Reihe nach ab', () => {
    const s = new Sitzung(aufgaben());
    assert.equal(s.aktuelle.id, 'a');
    s.verbuche('richtig');
    assert.equal(s.aktuelle.id, 'b');
    assert.deepEqual(s.stand, { erledigt: 1, gesamt: 5 });
  });

  test('falsch → Aufgabe kommt später in derselben Sitzung erneut', () => {
    const s = new Sitzung(aufgaben());
    const r = s.verbuche('falsch');
    assert.equal(r.buchen, true);
    assert.equal(s.stand.gesamt, 6);
    const ids = [];
    while (!s.fertig) { ids.push(s.aktuelle.id); s.verbuche('richtig'); }
    assert.deepEqual(ids, ['b', 'c', 'd', 'a', 'e']);
  });

  test('Sitzungswiederholungen werden nicht erneut verbucht und nicht endlos wiederholt', () => {
    const s = new Sitzung([{ id: 'a', stufe: 2 }]);
    s.verbuche('falsch');
    assert.equal(s.aktuelle.sitzungsWiederholung, true);
    const r = s.verbuche('falsch');
    assert.equal(r.buchen, false);
    assert.equal(s.fertig, true);
  });

  test('eine wiederholte neue Aufgabe startet ohne erneute Einführung (Stufe 1)', () => {
    const s = new Sitzung([{ id: 'a', stufe: 0, neu: true }, { id: 'b', stufe: 2 }]);
    s.verbuche('falsch');
    s.verbuche('richtig');
    assert.equal(s.aktuelle.id, 'a');
    assert.equal(s.aktuelle.stufe, 1);
  });

  test('zählt Ergebnisse für die Abschlussübersicht (nur verbuchte)', () => {
    const s = new Sitzung(aufgaben());
    s.verbuche('richtig');
    s.verbuche('hinweis');
    s.verbuche('falsch');
    assert.deepEqual(s.bilanz, { richtig: 1, hinweis: 1, falsch: 1 });
  });
});
