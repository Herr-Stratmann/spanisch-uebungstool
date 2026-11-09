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

import { planeSitzung } from '../js/ablauf.js';

function seeded(seed = 1) {
  let s = seed;
  return () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
}
const neu = (id) => ({ id, unidad: 1, stufe: 0, neu: true, faellig: true });
const wdh = (id) => ({ id, unidad: 2, stufe: 2, neu: false, faellig: true });

describe('planeSitzung: erst lernen, dann gemischt abfragen', () => {
  test('ohne neue Wörter bleibt alles unverändert', () => {
    const a = [wdh('x'), wdh('y')];
    assert.deepEqual(planeSitzung(a, { rng: seeded() }), a);
  });

  test('neue Wörter: Lernblock, dann Erkennen (zählt nicht), dann Abrufen (zählt)', () => {
    const plan = planeSitzung(['a', 'b', 'c'].map(neu), { rng: seeded() });
    assert.equal(plan[0].art, 'lernen');
    assert.deepEqual(plan[0].ids, ['a', 'b', 'c']);
    const runde1 = plan.filter((x) => x.runde === 1);
    const runde2 = plan.filter((x) => x.runde === 2);
    assert.deepEqual(runde1.map((x) => x.id).sort(), ['a', 'b', 'c']);
    assert.deepEqual(runde2.map((x) => x.id).sort(), ['a', 'b', 'c']);
    assert.ok(runde1.every((x) => x.stufe === 1 && x.buchen === false));
    assert.ok(runde2.every((x) => x.stufe === 2 && x.buchen !== false));
    assert.ok(plan.indexOf(runde1.at(-1)) < plan.indexOf(runde2[0]));
  });

  test('Abfrage nicht direkt in Lernreihenfolge, Runde 2 beginnt nicht mit dem letzten Wort aus Runde 1', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const plan = planeSitzung(['a', 'b', 'c', 'd', 'e'].map(neu), { rng: seeded(seed) });
      const r1 = plan.filter((x) => x.runde === 1).map((x) => x.id);
      const r2 = plan.filter((x) => x.runde === 2).map((x) => x.id);
      assert.notDeepEqual(r1, ['a', 'b', 'c', 'd', 'e'], `Seed ${seed}`);
      assert.notEqual(r2[0], r1.at(-1), `Seed ${seed}`);
    }
  });

  test('mehr als 5 neue Wörter: mehrere, gleichmäßig große Lernblöcke', () => {
    const plan = planeSitzung(['a', 'b', 'c', 'd', 'e', 'f', 'g'].map(neu), { rng: seeded() });
    const bloecke = plan.filter((x) => x.art === 'lernen');
    assert.deepEqual(bloecke.map((b) => b.ids.length), [4, 3]);
  });

  test('Lernkarten in Buchreihenfolge, auch wenn die Aufgaben gemischt ankommen', () => {
    const rang = { a: 0, b: 1, c: 2 };
    const plan = planeSitzung(['c', 'a', 'b'].map(neu), { rng: seeded(), rang: (id) => rang[id] });
    assert.deepEqual(plan[0].ids, ['a', 'b', 'c']);
  });

  test('nicht_zusammen_mit (Prämisse 5): Paare kommen in getrennte Lernblöcke, keins fällt weg', () => {
    const konflikt = (x, y) => (x === 'padre' && y === 'madre') || (x === 'madre' && y === 'padre');
    const plan = planeSitzung(['padre', 'madre', 'mi'].map(neu), { rng: seeded(), konflikt });
    const bloecke = plan.filter((x) => x.art === 'lernen').map((b) => b.ids);
    assert.equal(bloecke.flat().length, 3);
    assert.ok(bloecke.every((b) => !(b.includes('padre') && b.includes('madre'))));
  });

  test('fällige Wiederholungen liegen zwischen den Runden (Abstand), der Rest danach', () => {
    const plan = planeSitzung([...['a', 'b'].map(neu), ...['x', 'y', 'z', 'w', 'v'].map(wdh)], { rng: seeded() });
    const pos = (pred) => plan.findIndex(pred);
    const letzteR1 = plan.map((x) => x.runde).lastIndexOf(1);
    const ersteR2 = pos((x) => x.runde === 2);
    const zwischen = plan.slice(letzteR1 + 1, ersteR2);
    assert.ok(zwischen.length >= 2 && zwischen.every((x) => !x.neu));
    assert.equal(plan.filter((x) => ['x', 'y', 'z', 'w', 'v'].includes(x.id)).length, 5);
  });
});

describe('Sitzung mit Lern- und Übungsschritten', () => {
  test('Lernschritt und Übungsrunde werden nicht verbucht und nicht wiederholt', () => {
    const s = new Sitzung(planeSitzung(['a', 'b'].map(neu), { rng: seeded() }));
    assert.equal(s.aktuelle.art, 'lernen');
    assert.equal(s.verbuche(null).buchen, false);
    const r = s.verbuche('falsch'); // Runde 1
    assert.equal(r.buchen, false);
    assert.equal(s.stand.gesamt, 5);
  });

  test('falsch in Runde 2 wird verbucht und später wiederholt', () => {
    const s = new Sitzung(planeSitzung(['a', 'b'].map(neu), { rng: seeded() }));
    s.verbuche(null); s.verbuche('richtig'); s.verbuche('richtig');
    assert.equal(s.aktuelle.runde, 2);
    assert.equal(s.verbuche('falsch').buchen, true);
    assert.equal(s.stand.gesamt, 6);
    assert.deepEqual(s.bilanz, { falsch: 1 });
  });
});
