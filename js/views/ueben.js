// Übungsablauf: eine Aufgabe pro Bildschirm, Fortschrittsbalken ohne Zeitdruck, Abschlussübersicht.

import { h, leere, anfuegen } from '../dom.js';
import { Sitzung } from '../ablauf.js';
import { bewerte } from '../scheduler.js';
import { waehleUebung, einfuehrung } from '../exercises/index.js';

export function zeigeUeben(el, app, { titel, aufgaben }) {
  const sitzung = new Sitzung(aufgaben);
  const balken = h('div', { class: 'balken', role: 'progressbar', 'aria-valuemin': '0' }, h('div', { class: 'balken-fuellung' }));
  const zaehler = h('span', { class: 'zaehler' });
  const buehne = h('section', { class: 'aufgabe' });
  el.append(
    h('div', { class: 'uebungskopf' },
      h('span', { class: 'titel' }, titel), zaehler,
      h('button', { type: 'button', class: 'knopf klein', onclick: () => beenden() }, 'Beenden')),
    balken, buehne);

  naechste();

  function aktualisiereStand() {
    const { erledigt, gesamt } = sitzung.stand;
    zaehler.textContent = `Aufgabe ${Math.min(erledigt + 1, gesamt)} von ${gesamt}`;
    balken.setAttribute('aria-valuemax', String(gesamt));
    balken.setAttribute('aria-valuenow', String(erledigt));
    balken.firstChild.style.width = `${gesamt ? (100 * erledigt) / gesamt : 0}%`;
  }

  function naechste() {
    aktualisiereStand();
    leere(buehne);
    delete buehne.dataset.typ;
    delete buehne.dataset.item;
    if (sitzung.fertig) return abschluss();
    const aufgabe = sitzung.aktuelle;
    const item = app.daten.nachId.get(aufgabe.id);
    if (!item) { sitzung.verbuche('richtig'); return naechste(); }
    buehne.dataset.item = item.id;
    const umgebung = { alleItems: app.daten.items };
    const ctx = { beamer: app.beamer, alleItems: app.daten.items, rng: Math.random };

    const uebe = (stufe) => {
      leere(buehne);
      const uebung = waehleUebung(item, stufe, umgebung);
      buehne.dataset.typ = uebung.typ;
      uebung.render(buehne, item, { ...ctx, fertig: (ergebnis, extra) => abschliessen(aufgabe, item, ergebnis, extra) });
    };

    if (aufgabe.stufe === 0) {
      buehne.dataset.typ = einfuehrung.typ;
      einfuehrung.render(buehne, item, { ...ctx, fertig: () => (app.beamer ? abschliessen(aufgabe, item, null) : uebe(1)) });
    } else {
      uebe(aufgabe.stufe);
    }
  }

  function abschliessen(aufgabe, item, ergebnis, extra = {}) {
    if (app.beamer || ergebnis === null) {
      sitzung.verbuche('richtig');
      return naechste();
    }
    const { buchen } = sitzung.verbuche(ergebnis);
    if (buchen) {
      app.stand.items[item.id] = bewerte(app.stand.items[item.id], ergebnis, app.heute(), { nurFehlerZaehlen: aufgabe.faellig === false });
    }
    if (extra.satz) {
      app.stand.saetze.push({ item: item.id, text: extra.satz, selbst: ergebnis === 'nochNicht' ? 'noch nicht' : ergebnis, datum: app.heute() });
    }
    app.speichere();
    naechste();
  }

  function abschluss() {
    const b = sitzung.bilanz;
    const zeile = (anzahl, text) => (anzahl ? h('li', {}, `${anzahl} × ${text}`) : null);
    anfuegen(buehne,
      h('h1', {}, '¡Muy bien! Geschafft.'),
      app.beamer ? null : h('ul', { class: 'bilanz' },
        zeile(b.richtig, 'gleich gewusst'),
        zeile(b.hinweis, 'mit Hinweis gelöst'),
        zeile(b.falsch, 'noch einmal anschauen – kommt bald wieder'),
        zeile(b.passt, 'eigener Satz passt'),
        zeile(b.teilweise, 'eigener Satz teilweise'),
        zeile(b.nochNicht, 'eigener Satz noch nicht')),
      h('button', { type: 'button', class: 'knopf primaer', onclick: app.start }, 'Zur Startseite'));
  }

  function beenden() {
    // Bereits beantwortete Aufgaben sind gespeichert.
    app.start();
  }
}
