// Gemeinsame Bausteine der Übungstypen: Eingabe mit Sonderzeichen, Sicherheit + Prüfen,
// gestuftes Feedback (§6.3), Beamer-Variante (§9).

import { h, leere, anfuegen } from '../dom.js';
import { normalisiere } from '../check.js';
import { pruefeAntwort } from '../check.js';
import { ergebnisAusVersuchen } from '../ablauf.js';
import { lautsprecher } from '../audio.js';

const SONDERZEICHEN = ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü', '¿', '¡'];

export function aufgabenKopf(anweisung, ...inhalt) {
  return h('div', { class: 'aufgaben-kopf' }, h('p', { class: 'anweisung' }, anweisung), ...inhalt);
}

export function spanisch(text, { gross = false } = {}) {
  return h('p', { class: gross ? 'spanisch gross' : 'spanisch' }, h('span', { lang: 'es' }, text), lautsprecher(text));
}

/** Eingabefeld mit Sonderzeichenleiste. Die Leiste behält den Fokus, damit die iPad-Tastatur offen bleibt. */
export function eingabe({ mehrzeilig = false, beschriftung }) {
  const feld = h(mehrzeilig ? 'textarea' : 'input', {
    class: 'eingabe', lang: 'es', 'aria-label': beschriftung,
    autocomplete: 'off', autocorrect: 'off', autocapitalize: 'off', spellcheck: 'false',
    enterkeyhint: 'done', rows: mehrzeilig ? 3 : null, type: mehrzeilig ? null : 'text'
  });
  const leiste = h('div', { class: 'sonderzeichen', role: 'group', 'aria-label': 'Sonderzeichen' },
    SONDERZEICHEN.map((z) => h('button', {
      type: 'button', tabindex: '-1', 'aria-label': `${z} einfügen`,
      onpointerdown: (e) => e.preventDefault(),
      onclick: () => fuegeEin(feld, z)
    }, z)));
  return { feld, el: h('div', { class: 'eingabe-block' }, leiste, feld) };
}

function fuegeEin(feld, zeichen) {
  const start = feld.selectionStart ?? feld.value.length;
  const ende = feld.selectionEnd ?? feld.value.length;
  feld.value = feld.value.slice(0, start) + zeichen + feld.value.slice(ende);
  feld.focus();
  feld.setSelectionRange(start + zeichen.length, start + zeichen.length);
  feld.dispatchEvent(new Event('input'));
}

/** Zwei Prüf-Buttons: Sicherheitsangabe und Prüfen in einem Schritt (Prämisse 9). */
export function pruefButtons(beimPruefen) {
  const sicher = h('button', { type: 'button', class: 'knopf primaer', onclick: () => beimPruefen(true) }, '✓ Sicher – prüfen');
  const unsicher = h('button', { type: 'button', class: 'knopf', onclick: () => beimPruefen(false) }, '? Unsicher – prüfen');
  const el = h('div', { class: 'knopfreihe pruefen' }, sicher, unsicher);
  return {
    el,
    aktiv(an) { sicher.disabled = !an; unsicher.disabled = !an; }
  };
}

const SYMBOL = { richtig: '✓', hinweis: '↻', falsch: '✗', info: 'ℹ' };
const TITEL = { richtig: 'Richtig!', hinweis: 'Noch ein Versuch', falsch: 'Lösung', info: '' };

export function rueckmeldung(art, text, { titel = TITEL[art], betont = false, extra = [] } = {}) {
  return h('div', { class: `rueckmeldung ${art}${betont ? ' betont' : ''}`, role: 'status', 'aria-live': 'polite' },
    h('span', { class: 'symbol', 'aria-hidden': 'true' }, SYMBOL[art]),
    h('div', {}, titel ? h('strong', {}, titel) : null, text ? h('p', {}, text) : null, ...extra));
}

export function weiterKnopf(beimKlick, text = 'Weiter →') {
  const k = h('button', { type: 'button', class: 'knopf primaer weiter', onclick: beimKlick }, text);
  queueMicrotask(() => k.focus());
  return k;
}

function hinweisSicher() {
  return h('p', { class: 'sicher-falsch' },
    '⚠ Du warst dir sicher – genau solche Fehler lohnen sich. Schau dir die Lösung in Ruhe an.');
}

/**
 * Texteingabe-Aufgabe mit zwei Versuchen.
 * @param {object} cfg – { kopf, akzeptiert, fehlantworten, fehlertypen, loesungsInfo, mehrzeilig, beschriftung }
 * @param {object} ctx – { beamer, fertig(ergebnis) }
 */
export function eingabeAufgabe(container, cfg, ctx) {
  const { feld, el: eingabeEl } = eingabe({ beschriftung: cfg.beschriftung ?? 'Deine Antwort' });
  const bereich = h('div', { class: 'rueckmeldungen' });
  const unten = h('div', { class: 'aktionen' });
  anfuegen(container, cfg.kopf, ctx.beamer ? null : eingabeEl, bereich, unten);

  if (ctx.beamer) {
    unten.append(h('button', {
      type: 'button', class: 'knopf primaer', onclick: () => {
        leere(unten);
        bereich.append(rueckmeldung('info', null, { titel: `Lösung: ${cfg.akzeptiert[0]}`, extra: [cfg.loesungsInfo] }));
        unten.append(weiterKnopf(() => ctx.fertig(null)));
      }
    }, 'Lösung zeigen'));
    return;
  }

  let versuch = 1;
  const knoepfe = pruefButtons(pruefe);
  knoepfe.aktiv(false);
  unten.append(knoepfe.el);
  feld.addEventListener('input', () => knoepfe.aktiv(feld.value.trim() !== ''));
  feld.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !cfg.mehrzeilig) { e.preventDefault(); feld.blur(); } });
  setTimeout(() => feld.focus(), 50);

  function pruefe(sicher) {
    const r = pruefeAntwort(feld.value, cfg, { versuch, sicher });
    leere(bereich);
    if (r.richtig) {
      feld.readOnly = true;
      bereich.append(rueckmeldung('richtig', r.klasse === 'akzent' ? r.hinweis : null, { extra: [cfg.loesungsInfo] }));
      leere(unten).append(weiterKnopf(() => ctx.fertig(ergebnisAusVersuchen(versuch, true))));
      return;
    }
    if (r.zweiterVersuch) {
      bereich.append(rueckmeldung('hinweis', r.hinweis, { betont: r.hervorheben }));
      versuch = 2;
      feld.focus();
      feld.select();
      return;
    }
    feld.readOnly = true;
    const abtippen = eingabe({ beschriftung: 'Lösung abtippen (freiwillig)' });
    abtippen.feld.placeholder = 'Lösung einmal abtippen (freiwillig)';
    const abtippenOk = h('p', { class: 'abtippen-ok', role: 'status' });
    abtippen.feld.addEventListener('input', () => {
      abtippenOk.textContent = normalisiere(abtippen.feld.value) === normalisiere(r.loesung) ? '✓ Genau so.' : '';
    });
    abtippen.el.append(abtippenOk);
    bereich.append(rueckmeldung('falsch', null, {
      titel: `Lösung: ${r.loesung}`,
      betont: r.hervorheben,
      extra: [r.hervorheben ? hinweisSicher() : null, cfg.loesungsInfo, abtippen.el]
    }));
    leere(unten).append(weiterKnopf(() => ctx.fertig('falsch')));
  }
}

/**
 * Auswahl-Aufgabe mit zwei Versuchen.
 * @param {object} cfg – { kopf, optionen: [{text, richtig, lang}], hinweis: Node|string, loesungsInfo }
 */
export function auswahlAufgabe(container, cfg, ctx) {
  let gewaehlt = null;
  let versuch = 1;
  const bereich = h('div', { class: 'rueckmeldungen' });
  const unten = h('div', { class: 'aktionen' });
  const knoepfe = ctx.beamer ? null : pruefButtons(pruefe);
  const optionen = cfg.optionen.map((o) => {
    const b = h('button', {
      type: 'button', class: 'option', role: 'radio', 'aria-checked': 'false', lang: o.lang ?? null,
      onclick: () => waehle(o, b)
    }, o.text);
    o.el = b;
    return b;
  });
  anfuegen(container, cfg.kopf, h('div', { class: 'optionen', role: 'radiogroup' }, optionen), bereich, unten);

  if (ctx.beamer) {
    unten.append(h('button', {
      type: 'button', class: 'knopf primaer', onclick: () => {
        cfg.optionen.forEach((o) => o.richtig && o.el.classList.add('ist-richtig'));
        leere(unten).append(weiterKnopf(() => ctx.fertig(null)));
        bereich.append(rueckmeldung('info', null, { titel: 'Lösung', extra: [cfg.loesungsInfo] }));
      }
    }, 'Lösung zeigen'));
    return;
  }
  knoepfe.aktiv(false);
  unten.append(knoepfe.el);

  function waehle(o, b) {
    if (b.disabled) return;
    gewaehlt = o;
    optionen.forEach((x) => x.setAttribute('aria-checked', String(x === b)));
    knoepfe.aktiv(true);
  }

  function pruefe(sicher) {
    leere(bereich);
    if (gewaehlt.richtig) {
      optionen.forEach((x) => { x.disabled = true; });
      gewaehlt.el.classList.add('ist-richtig');
      bereich.append(rueckmeldung('richtig', null, { extra: [cfg.loesungsInfo] }));
      leere(unten).append(weiterKnopf(() => ctx.fertig(ergebnisAusVersuchen(versuch, true))));
      return;
    }
    gewaehlt.el.classList.add('ist-falsch');
    gewaehlt.el.disabled = true;
    gewaehlt.el.setAttribute('aria-checked', 'false');
    if (versuch === 1) {
      versuch = 2;
      gewaehlt = null;
      knoepfe.aktiv(false);
      bereich.append(rueckmeldung('hinweis', null, { betont: sicher, extra: [cfg.hinweis] }));
      return;
    }
    optionen.forEach((x) => { x.disabled = true; });
    cfg.optionen.find((o) => o.richtig).el.classList.add('ist-richtig');
    bereich.append(rueckmeldung('falsch', null, {
      titel: `Lösung: ${cfg.optionen.find((o) => o.richtig).text}`,
      betont: sicher,
      extra: [sicher ? hinweisSicher() : null, cfg.loesungsInfo]
    }));
    leere(unten).append(weiterKnopf(() => ctx.fertig('falsch')));
  }
}

/** Beispielsatz mit Übersetzung und Audio als Teil der Lösung. */
export function beispielInfo(item, markieren = true) {
  const b = item.beispiele?.[0];
  if (!b) return null;
  const satz = h('span', { lang: 'es' });
  const i = markieren ? b.es.indexOf(b.luecke) : -1;
  if (i >= 0) satz.append(b.es.slice(0, i), h('mark', {}, b.es.slice(i, i + b.luecke.length)), b.es.slice(i + b.luecke.length));
  else satz.append(b.es);
  return h('div', { class: 'beispiel' },
    h('p', {}, satz, lautsprecher(b.es)),
    h('p', { class: 'uebersetzung' }, b.de));
}
