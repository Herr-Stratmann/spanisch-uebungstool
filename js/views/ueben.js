// Übungsablauf: eine Aufgabe pro Bildschirm, Fortschrittsbalken ohne Zeitdruck, Abschlussübersicht.

import { h, leere, anfuegen } from '../dom.js';
import { Sitzung, planeSitzung } from '../ablauf.js';
import { bewerte } from '../scheduler.js';
import { spaetestensFuer } from '../plan.js';
import { waehleUebung, einfuehrung } from '../exercises/index.js';

export function zeigeUeben(el, app, { titel, aufgaben }) {
  const rangIndex = new Map(app.daten.items.map((it, i) => [it.id, i]));
  const sitzung = new Sitzung(planeSitzung(aufgaben, {
    rang: (id) => rangIndex.get(id) ?? 0,
    konflikt: (a, b) => {
      const x = app.daten.nachId.get(a);
      const y = app.daten.nachId.get(b);
      return Boolean(x?.nicht_zusammen_mit?.includes(b) || y?.nicht_zusammen_mit?.includes(a));
    }
  }));
  let gelernt = 0;
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
    if (aufgabe.art === 'lernen') return lernkarten(aufgabe.ids.map((id) => app.daten.nachId.get(id)).filter(Boolean));
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

  // Lernphase: mehrere neue Wörter nacheinander ansehen (vor- und zurückblättern), dann gemischte Abfrage.
  function lernkarten(items, k = 0) {
    leere(buehne);
    buehne.dataset.typ = 'lernen';
    buehne.dataset.item = items[k]?.id ?? '';
    if (!items.length) { sitzung.verbuche(null); return naechste(); }
    const letzte = k === items.length - 1;
    einfuehrung.render(buehne, items[k], {
      beamer: app.beamer,
      fertig: () => {
        if (!letzte) return lernkarten(items, k + 1);
        gelernt += items.length;
        sitzung.verbuche(null);
        naechste();
      }
    }, {
      titel: `Neue Wörter · ${k + 1} von ${items.length}`,
      knopf: letzte ? 'Alle angesehen – Abfrage starten →' : 'Nächstes Wort →',
      zurueck: k > 0 ? () => lernkarten(items, k - 1) : null
    });
  }

  function abschliessen(aufgabe, item, ergebnis, extra = {}) {
    if (app.beamer || ergebnis === null) {
      sitzung.verbuche('richtig');
      return naechste();
    }
    const { buchen } = sitzung.verbuche(ergebnis);
    if (buchen) {
      app.stand.items[item.id] = bewerte(app.stand.items[item.id], ergebnis, app.heute(), {
        nurFehlerZaehlen: aufgabe.faellig === false,
        diagnose: aufgabe.erstkontakt === 'diagnose',
        sicher: extra.sicher,
        spaetestens: spaetestensFuer(item.id, app.stand.plaene, app.heute())
      });
    }
    if (extra.satz) {
      app.stand.saetze.push({ item: item.id, text: extra.satz, selbst: ergebnis === 'nochNicht' ? 'noch nicht' : ergebnis, datum: app.heute() });
    }
    app.speichere();
    // Beim Wiederholen nicht gewusst: Wort einmal in Ruhe zeigen (wie eine Einführung), dann weiter.
    if (buchen && ergebnis === 'falsch' && aufgabe.erstkontakt === 'diagnose') {
      leere(buehne);
      buehne.dataset.typ = 'einfuehrung';
      buehne.dataset.item = item.id;
      return einfuehrung.render(buehne, item, { beamer: false, fertig: () => naechste() },
        { titel: 'Präg dir das Wort noch einmal ein', knopf: 'Weiter →' });
    }
    naechste();
  }

  function abschluss() {
    const b = sitzung.bilanz;
    const zeile = (anzahl, text) => (anzahl ? h('li', {}, `${anzahl} × ${text}`) : null);
    anfuegen(buehne,
      h('h1', {}, '¡Muy bien! Geschafft.'),
      app.beamer ? null : h('ul', { class: 'bilanz' },
        gelernt ? h('li', {}, `${gelernt} neue ${gelernt === 1 ? 'Wort' : 'Wörter'} kennengelernt`) : null,
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
