// Austauschbares Modul für die Rückmeldung zu freien Sätzen (SPEC §4.3).
// V1: keine KI. Es gibt nur einen automatischen Hinweis, ob das Zielwort vorkommt.
// Später kann hier ein KI-Dienst angebunden werden, ohne dass sich die Oberfläche ändert.

import { normalisiere, ohneAkzente } from './check.js';

const ARTIKEL = /^(el|la|los|las) /u;

function kern(text) {
  return ohneAkzente(normalisiere(text)).replace(/[.,;:!?]/gu, ' ').replace(/\s+/gu, ' ').trim();
}

/**
 * @param {{text: string, item: object}} eingabe
 * @returns {Promise<{zielwortGefunden: boolean, kiFeedback: string|null}>}
 */
export async function bewerteFreienSatz({ text, item }) {
  const satz = ` ${kern(text)} `;
  const ziel = kern(item.es).replace(ARTIKEL, '');
  return { zielwortGefunden: satz.includes(` ${ziel} `), kiFeedback: null };
}
