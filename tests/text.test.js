import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findeTeil } from '../js/text.js';

test('findet das Lückenwort als ganzes Wort, nicht innerhalb eines anderen', () => {
  assert.equal(findeTeil('Soy de México y vivo en Alemania.', 'y'), 14);
  assert.equal(findeTeil('La fiesta es en la casa de Ana.', 'en'), 13);
});

test('findet mehrteilige Lücken und Wörter mit Satzzeichen daneben', () => {
  assert.equal(findeTeil('¡Hola, Ana! ¿Qué tal?', 'Hola'), 1);
  assert.equal(findeTeil('Ana, ¿cuál es tu número de teléfono?', 'cuál es tu número de teléfono'), 6);
});

test('ohne Treffer als ganzes Wort: Teilstring, sonst -1', () => {
  assert.equal(findeTeil('¡Buenas tardes, Paco!', 'tard'), 8);
  assert.equal(findeTeil('Hola', 'adiós'), -1);
});
