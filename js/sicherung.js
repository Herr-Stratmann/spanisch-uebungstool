// Fortschritt als Datei sichern. Auf dem iPad über das Teilen-Menü (Dateien, OneDrive …), sonst als Download.

import { h } from './dom.js';
import { exportiere, markiereSicherung } from './storage.js';

/** @returns {Promise<boolean>} ob gesichert wurde (Abbruch im Teilen-Menü → false) */
export async function sichereFortschritt(app) {
  const name = `spanisch-fortschritt-${app.heute()}.json`;
  const text = exportiere(app.stand);
  const datei = typeof File === 'function' ? new File([text], name, { type: 'application/json' }) : null;
  if (datei && navigator.canShare?.({ files: [datei] })) {
    try {
      await navigator.share({ files: [datei], title: 'Spanisch-Fortschritt' });
    } catch (e) {
      if (e?.name === 'AbortError') return false;
      herunterladen(text, name);
    }
  } else {
    herunterladen(text, name);
  }
  markiereSicherung(app.stand, app.heute());
  app.speichere();
  return true;
}

function herunterladen(text, name) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = h('a', { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
