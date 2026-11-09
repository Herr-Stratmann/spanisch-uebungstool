import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { woerterImBereich, seitenGruppen, bereichsTitel } from '../js/bereich.js';

const it = (id, seite, bloque, es = id) => ({ id, es, seite, bloque, unidad: 4, uk: '1-4' });
const ITEMS = [
  it('a', 137, 'PP', 'el tiempo libre'),
  it('b', 138, 'A', 'trabajar'),
  it('c', 138, 'A', 'la encuesta'),
  it('d', 139, 'A', 'necesitar'),
  it('e', 140, 'A', 'interesante'),
  it('f', 140, 'B', 'el plan'),
  { id: 'x', es: 'otra', seite: 150, bloque: 'A', unidad: 5, uk: '1-5' }
];

describe('woerterImBereich', () => {
  test('liefert alle Wörter von … bis … einschließlich, in Buchreihenfolge', () => {
    assert.deepEqual(woerterImBereich(ITEMS, { uk: '1-4', von: 'b', bis: 'e' }).map((x) => x.id), ['b', 'c', 'd', 'e']);
  });
  test('vertauschte Angaben werden toleriert', () => {
    assert.deepEqual(woerterImBereich(ITEMS, { uk: '1-4', von: 'e', bis: 'b' }).map((x) => x.id), ['b', 'c', 'd', 'e']);
  });
  test('ohne von/bis: ganze Unidad', () => {
    assert.equal(woerterImBereich(ITEMS, { uk: '1-4' }).length, 6);
  });
  test('ohne Unidad: alle Wörter', () => {
    assert.equal(woerterImBereich(ITEMS, {}).length, 7);
  });
  test('Wörter anderer Unidades bleiben draußen', () => {
    assert.ok(!woerterImBereich(ITEMS, { uk: '1-4' }).some((x) => x.id === 'x'));
  });
});

describe('seitenGruppen', () => {
  test('gruppiert nach Seite und Bloque für die Auswahlliste', () => {
    const g = seitenGruppen(ITEMS.filter((x) => x.uk === '1-4'));
    assert.deepEqual(g.map((x) => x.label), ['S. 137 · Primer paso', 'S. 138 · Bloque A', 'S. 139 · Bloque A', 'S. 140 · Bloque A', 'S. 140 · Bloque B']);
    assert.deepEqual(g[1].items.map((x) => x.id), ['b', 'c']);
  });
  test('ohne Bloque nur die Seite', () => {
    assert.equal(seitenGruppen([{ id: 'q', es: 'q', seite: 186, bloque: null }])[0].label, 'S. 186');
  });
});

describe('bereichsTitel', () => {
  test('beschreibt den Bereich so, wie er in der Hausaufgabe steht', () => {
    assert.equal(
      bereichsTitel(ITEMS, { uk: '1-4', von: 'b', bis: 'e' }, 'Unidad 4'),
      'Unidad 4 · S. 138 „trabajar“ – S. 140 „interesante“'
    );
  });
  test('ganze Unidad', () => {
    assert.equal(bereichsTitel(ITEMS, { uk: '1-4', von: 'a', bis: 'f' }, 'Unidad 4'), 'Unidad 4');
  });
});
