import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { erstellePlan, tagesPortion, neueFuerHeute, planAktiv, spaetestensFuer, planStand } from '../js/plan.js';
import { addiereTage } from '../js/scheduler.js';

const HEUTE = '2026-11-09';
const ids = (n) => Array.from({ length: n }, (_, i) => `w${i + 1}`);

describe('erstellePlan', () => {
  test('5 Tage Zeit: neue Wörter an 4 Tagen, der letzte Tag nur Wiederholung', () => {
    const p = erstellePlan({ titel: 'U4 A', itemIds: ids(20), heute: HEUTE, tage: 5 });
    assert.equal(p.ziel, '2026-11-14');
    assert.equal(p.lernEnde, '2026-11-12');
    assert.equal(p.start, HEUTE);
    assert.ok(p.id);
  });
  test('1 Tag Zeit: alles heute', () => {
    const p = erstellePlan({ titel: 't', itemIds: ids(5), heute: HEUTE, tage: 1 });
    assert.equal(p.lernEnde, HEUTE);
    assert.equal(p.ziel, '2026-11-10');
  });
  test('2 Tage Zeit: heute alles neu, morgen Wiederholung', () => {
    const p = erstellePlan({ titel: 't', itemIds: ids(5), heute: HEUTE, tage: 2 });
    assert.equal(p.lernEnde, HEUTE);
  });
});

describe('tagesPortion', () => {
  const plan = erstellePlan({ titel: 't', itemIds: ids(20), heute: HEUTE, tage: 5 }); // 4 Lerntage

  test('verteilt gleichmäßig und rundet auf', () => {
    assert.equal(tagesPortion(plan, {}, HEUTE), 5);
    const p2 = erstellePlan({ titel: 't', itemIds: ids(21), heute: HEUTE, tage: 5 });
    assert.equal(tagesPortion(p2, {}, HEUTE), 6);
  });

  test('bereits heute eingeführte Wörter verringern die Portion', () => {
    const f = { w1: { fach: 1, erstkontakt: HEUTE }, w2: { fach: 1, erstkontakt: HEUTE } };
    assert.equal(tagesPortion(plan, f, HEUTE), 3);
  });

  test('ein ausgelassener Tag wird auf die restlichen Tage verteilt', () => {
    const morgen = addiereTage(HEUTE, 1);
    const f = {};
    ids(5).forEach((id) => { f[id] = { fach: 1, erstkontakt: HEUTE }; });
    assert.equal(tagesPortion(plan, f, morgen), 5); // 15 Rest auf 3 Tage
    const uebermorgen = addiereTage(HEUTE, 2);
    assert.equal(tagesPortion(plan, f, uebermorgen), 8); // 15 Rest auf 2 Tage, Tag ausgelassen
  });

  test('nach dem letzten Lerntag kommt der ganze Rest', () => {
    assert.equal(tagesPortion(plan, {}, '2026-11-13'), 20);
  });

  test('Wörter, die schon vorher bekannt waren, zählen nicht als neu', () => {
    const f = { w1: { fach: 3, erstkontakt: '2026-10-01' } };
    assert.equal(tagesPortion(plan, f, HEUTE), 5); // 19 Rest / 4 = 5
  });
});

describe('neueFuerHeute', () => {
  test('liefert die nächsten noch unbekannten Wörter jedes aktiven Plans in Planreihenfolge', () => {
    const a = erstellePlan({ titel: 'a', itemIds: ids(8), heute: HEUTE, tage: 5 }); // 4 Lerntage → 2/Tag
    const b = erstellePlan({ titel: 'b', itemIds: ['x1', 'x2', 'x3'], heute: HEUTE, tage: 1 });
    assert.deepEqual(neueFuerHeute([a, b], { w1: { fach: 2, erstkontakt: '2026-10-01' } }, HEUTE), ['w2', 'w3', 'x1', 'x2', 'x3']);
  });
  test('abgelaufene Pläne liefern nichts', () => {
    const a = erstellePlan({ titel: 'a', itemIds: ids(4), heute: '2026-11-01', tage: 3 });
    assert.deepEqual(neueFuerHeute([a], {}, HEUTE), []);
  });
});

describe('planAktiv und spaetestensFuer', () => {
  const p = erstellePlan({ titel: 'a', itemIds: ['w1'], heute: HEUTE, tage: 5 }); // Ziel 14.11.

  test('aktiv bis einschließlich Vortag des Ziels', () => {
    assert.equal(planAktiv(p, '2026-11-13'), true);
    assert.equal(planAktiv(p, '2026-11-14'), false);
  });

  test('Wiederholung spätestens am Tag vor dem Ziel', () => {
    assert.equal(spaetestensFuer('w1', [p], HEUTE), '2026-11-13');
    assert.equal(spaetestensFuer('w9', [p], HEUTE), undefined);
  });

  test('am letzten Tag keine Kappung mehr', () => {
    assert.equal(spaetestensFuer('w1', [p], '2026-11-13'), undefined);
  });
});

describe('planStand', () => {
  test('zählt eingeführte und sichere Wörter', () => {
    const p = erstellePlan({ titel: 'a', itemIds: ids(4), heute: HEUTE, tage: 5 });
    const f = { w1: { fach: 1 }, w2: { fach: 3 }, w3: { fach: 0 } };
    assert.deepEqual(planStand(p, f), { gesamt: 4, eingefuehrt: 3, sicher: 1 });
  });
});
