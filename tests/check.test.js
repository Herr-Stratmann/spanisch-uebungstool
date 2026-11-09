import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { normalisiere, ohneAkzente, levenshtein, pruefeAntwort } from '../js/check.js';

describe('normalisiere (§6.1)', () => {
  test('trimmt, macht klein, fasst Leerzeichen zusammen', () => {
    assert.equal(normalisiere('  Hago   los DEBERES '), 'hago los deberes');
  });
  test('ignoriert Satzzeichen am Ende', () => {
    assert.equal(normalisiere('Hago los deberes.'), 'hago los deberes');
    assert.equal(normalisiere('¿Dónde estás?!'), 'dónde estás');
  });
  test('¿ und ¡ sind optional', () => {
    assert.equal(normalisiere('¡Hola!'), normalisiere('Hola'));
    assert.equal(normalisiere('¿Qué tal?'), 'qué tal');
  });
  test('Satzzeichen innerhalb des Satzes bleiben erhalten', () => {
    assert.equal(normalisiere('Así, así.'), 'así, así');
  });
  test('Unicode-Varianten (zerlegte Akzente vom iPad) werden vereinheitlicht', () => {
    assert.equal(normalisiere('está'), 'está');
  });
});

describe('ohneAkzente', () => {
  test('entfernt á é í ó ú ü, lässt ñ stehen', () => {
    assert.equal(ohneAkzente('áéíóúü ñ'), 'aeiouu ñ');
  });
});

describe('levenshtein', () => {
  test('berechnet Editierdistanz', () => {
    assert.equal(levenshtein('ventana', 'ventana'), 0);
    assert.equal(levenshtein('ventana', 'ventena'), 1);
    assert.equal(levenshtein('ventana', 'ventan'), 1);
    assert.equal(levenshtein('abc', 'xyz'), 3);
  });
});

describe('pruefeAntwort – Fehlerklassen (§6.2)', () => {
  test('exakt richtig nach Normalisierung', () => {
    const r = pruefeAntwort('Hago los deberes.', { akzeptiert: ['hago los deberes'] });
    assert.equal(r.klasse, 'richtig');
    assert.equal(r.richtig, true);
    assert.equal(r.zweiterVersuch, false);
  });

  test('jeder Eintrag in akzeptiert gilt', () => {
    const r = pruefeAntwort('Hausaufgaben machen', { akzeptiert: ['die Hausaufgaben machen', 'Hausaufgaben machen'] });
    assert.equal(r.klasse, 'richtig');
  });

  test('Akzentfehler zählt als richtig, mit Hinweis auf korrekte Schreibung', () => {
    const r = pruefeAntwort('esta', { akzeptiert: ['está'] });
    assert.equal(r.klasse, 'akzent');
    assert.equal(r.richtig, true);
    assert.equal(r.loesung, 'está');
    assert.match(r.hinweis, /está/);
  });

  test('fehlendes ñ ist falsch und bekommt einen eigenen Hinweis', () => {
    const r = pruefeAntwort('el ano', { akzeptiert: ['el año'] });
    assert.equal(r.klasse, 'enye');
    assert.equal(r.richtig, false);
    assert.equal(r.zweiterVersuch, true);
    assert.match(r.hinweis, /ñ/);
  });

  test('ñ-Fehler wird nicht als Tippfehler gewertet, auch bei langen Wörtern', () => {
    const r = pruefeAntwort('la montana', { akzeptiert: ['la montaña'] });
    assert.equal(r.klasse, 'enye');
  });

  test('fehlender Artikel wird erkannt', () => {
    const r = pruefeAntwort('mesa', { akzeptiert: ['la mesa'] });
    assert.equal(r.klasse, 'artikel');
    assert.equal(r.richtig, false);
    assert.equal(r.zweiterVersuch, true);
    assert.match(r.hinweis, /Artikel/);
  });

  test('fehlender Artikel wird auch mit Akzentfehler erkannt', () => {
    const r = pruefeAntwort('salon', { akzeptiert: ['el salón'] });
    assert.equal(r.klasse, 'artikel');
  });

  test('Tippfehler: Levenshtein 1 ab Länge 5', () => {
    const r = pruefeAntwort('la ventena', { akzeptiert: ['la ventana'] });
    assert.equal(r.klasse, 'tippfehler');
    assert.equal(r.richtig, false);
    assert.match(r.hinweis, /Fast/);
  });

  test('kein Tippfehler bei kurzen Wörtern (< 5 Zeichen)', () => {
    const r = pruefeAntwort('mal', { akzeptiert: ['mas'] });
    assert.equal(r.klasse, 'falsch');
  });

  test('bekannter Fehlertyp liefert gezielten Hinweis aus den Daten', () => {
    const r = pruefeAntwort('son', {
      akzeptiert: ['están'],
      fehlantworten: { son: 'ser-statt-estar-ort' },
      fehlertypen: [{ id: 'ser-statt-estar-ort', hinweis: 'Es geht um einen Ort.' }]
    });
    assert.equal(r.klasse, 'fehlertyp');
    assert.equal(r.fehlertyp, 'ser-statt-estar-ort');
    assert.equal(r.hinweis, 'Es geht um einen Ort.');
    assert.equal(r.zweiterVersuch, true);
  });

  test('ausdrücklich hinterlegte Fehlantwort schlägt die Akzent-Toleranz', () => {
    const r = pruefeAntwort('esta', {
      akzeptiert: ['está'],
      fehlantworten: { esta: 'demonstrativ' },
      fehlertypen: [{ id: 'demonstrativ', hinweis: 'esta = diese. Gesucht ist das Verb.' }]
    });
    assert.equal(r.klasse, 'fehlertyp');
  });

  test('sonst falsch mit Anfangsbuchstabe und Länge als Hinweis', () => {
    const r = pruefeAntwort('perro', { akzeptiert: ['el gato'] });
    assert.equal(r.klasse, 'falsch');
    assert.equal(r.richtig, false);
    assert.match(r.hinweis, /„e“/);
    assert.match(r.hinweis, /7 Zeichen/);
  });

  test('leere Eingabe ist falsch', () => {
    const r = pruefeAntwort('   ', { akzeptiert: ['la mesa'] });
    assert.equal(r.klasse, 'falsch');
  });
});

describe('pruefeAntwort – Versuche (§6.3)', () => {
  test('im 2. Versuch gibt es keinen weiteren Versuch, sondern die Lösung', () => {
    const r = pruefeAntwort('mesa', { akzeptiert: ['la mesa'] }, { versuch: 2 });
    assert.equal(r.richtig, false);
    assert.equal(r.zweiterVersuch, false);
    assert.equal(r.zeigeLoesung, true);
    assert.equal(r.loesung, 'la mesa');
  });

  test('falsche Antwort bei „sicher“ wird hervorgehoben', () => {
    const r = pruefeAntwort('perro', { akzeptiert: ['el gato'] }, { sicher: true });
    assert.equal(r.hervorheben, true);
  });

  test('richtige Antwort bei „sicher“ wird nicht hervorgehoben', () => {
    const r = pruefeAntwort('el gato', { akzeptiert: ['el gato'] }, { sicher: true });
    assert.equal(r.hervorheben, false);
  });
});
