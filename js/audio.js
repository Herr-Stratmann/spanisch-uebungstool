// Vorlesen über die Web Speech API (es-ES). Ohne spanische Stimme werden keine Buttons angezeigt.
// iPad/Safari: Sprechen nur als Reaktion auf eine Nutzeraktion, deshalb nie automatisch.

import { h } from './dom.js';

let stimme = null;
let eingeschaltet = true;

function waehleStimme() {
  const stimmen = globalThis.speechSynthesis?.getVoices?.() ?? [];
  stimme = stimmen.find((s) => s.lang === 'es-ES')
    ?? stimmen.find((s) => s.lang?.toLowerCase().startsWith('es'))
    ?? null;
}

/** Wartet kurz auf die Stimmenliste (Safari/Chrome laden sie asynchron). */
export function initAudio() {
  if (!globalThis.speechSynthesis) return Promise.resolve(false);
  waehleStimme();
  if (stimme) return Promise.resolve(true);
  return new Promise((fertig) => {
    const ende = () => { waehleStimme(); fertig(Boolean(stimme)); };
    speechSynthesis.addEventListener('voiceschanged', ende, { once: true });
    setTimeout(ende, 1500);
  });
}

export function setzeAudio(an) {
  eingeschaltet = an;
}

export function audioVerfuegbar() {
  return eingeschaltet && Boolean(stimme);
}

export function sprich(text) {
  if (!audioVerfuegbar()) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/[—–]/g, ' '));
  u.lang = stimme.lang;
  u.voice = stimme;
  u.rate = 0.9;
  speechSynthesis.speak(u);
}

/** Lautsprecher-Button oder null, wenn kein Audio verfügbar ist. */
export function lautsprecher(text, beschriftung = 'Vorlesen') {
  if (!audioVerfuegbar()) return null;
  return h('button', {
    type: 'button', class: 'lautsprecher', 'aria-label': `${beschriftung}: ${text}`,
    onclick: (e) => { e.preventDefault(); sprich(text); }
  }, '🔊');
}
