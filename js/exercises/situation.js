// Stufe 4: Situation → eigener Satz mit dem Zielwort. Musterlösung, Checkliste, Selbstbewertung (§4.3).

import { h, leere } from '../dom.js';
import { lautsprecher } from '../audio.js';
import { bewerteFreienSatz } from '../bewertung.js';
import { aufgabenKopf, eingabe, rueckmeldung } from './_ui.js';

export const typ = 'situation';
export const stufe = 4;
export const passt = (item) => Boolean(item.situation?.impuls && item.situation?.muster?.length);

const CHECKLISTE = [
  'Ist das Zielwort enthalten?',
  'Ist das Verb passend konjugiert?',
  'Stimmen Artikel und Genus/Numerus?',
  'Stimmt die Wortstellung (z. B. no vor dem Verb)?',
  'Stimmen ¿ ¡ und Akzente?'
];

function muster(item) {
  return h('div', { class: 'muster' },
    h('strong', {}, item.situation.muster.length > 1 ? 'Mögliche Lösungen' : 'Mögliche Lösung'),
    h('ul', {}, item.situation.muster.map((m) => h('li', {}, h('span', { lang: 'es' }, m), lautsprecher(m)))));
}

export function render(container, item, ctx) {
  const kopf = aufgabenKopf('Schreib einen eigenen Satz.',
    h('p', { class: 'impuls' }, item.situation.impuls),
    h('p', { class: 'zielwort' }, 'Verwende: ', h('strong', { lang: 'es' }, item.es)));
  const bereich = h('div', { class: 'rueckmeldungen' });
  const unten = h('div', { class: 'aktionen' });

  if (ctx.beamer) {
    container.append(kopf, bereich, unten);
    unten.append(h('button', {
      type: 'button', class: 'knopf primaer',
      onclick: () => { bereich.append(muster(item)); leere(unten).append(weiter(() => ctx.fertig(null))); }
    }, 'Musterlösung zeigen'));
    return;
  }

  const { feld, el } = eingabe({ mehrzeilig: true, beschriftung: 'Dein Satz' });
  const fertigKnopf = h('button', { type: 'button', class: 'knopf primaer', disabled: true, onclick: vergleiche }, 'Fertig – vergleichen');
  feld.addEventListener('input', () => { fertigKnopf.disabled = feld.value.trim() === ''; });
  const aufgeben = h('button', {
    type: 'button', class: 'knopf klein leise', onclick: () => {
      feld.readOnly = true;
      leere(unten);
      bereich.append(
        rueckmeldung('info', 'Lies die Musterlösung laut und versuch es beim nächsten Mal selbst.', { titel: 'Kein Problem' }),
        muster(item));
      unten.append(weiter(() => ctx.fertig('nochNicht')));
    }
  }, 'Weiß ich nicht – Muster zeigen');
  container.append(kopf, el, bereich, unten);
  unten.append(fertigKnopf, h('div', { class: 'knopfreihe hilfe' }, aufgeben));
  setTimeout(() => feld.focus(), 50);

  async function vergleiche() {
    feld.readOnly = true;
    const satz = feld.value.trim();
    const auto = await bewerteFreienSatz({ text: satz, item });
    leere(unten);
    bereich.append(
      muster(item),
      auto.zielwortGefunden
        ? rueckmeldung('info', `„${item.es}“ kommt in deinem Satz vor.`, { titel: 'Automatischer Hinweis' })
        : rueckmeldung('hinweis', `Ich finde „${item.es}“ nicht in deinem Satz. Vielleicht hast du eine andere Form benutzt – prüf selbst.`, { titel: 'Automatischer Hinweis' }),
      h('div', { class: 'checkliste' },
        h('strong', {}, 'Prüf deinen Satz:'),
        h('ul', {}, CHECKLISTE.map((c) => h('li', {}, h('label', {}, h('input', { type: 'checkbox' }), ' ', c))))),
      h('p', { class: 'anweisung' }, 'Wie gut passt dein Satz?'),
      h('div', { class: 'knopfreihe selbst' },
        selbst('passt', '✓ passt'), selbst('teilweise', '≈ teilweise'), selbst('nochNicht', '✗ noch nicht'))
    );
    function selbst(wert, text) {
      return h('button', { type: 'button', class: `knopf selbst-${wert}`, onclick: () => ctx.fertig(wert, { satz }) }, text);
    }
  }
}

function weiter(beimKlick) {
  return h('button', { type: 'button', class: 'knopf primaer weiter', onclick: beimKlick }, 'Weiter →');
}
