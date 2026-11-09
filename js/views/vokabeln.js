// Vokabeln: Täglich üben, Lernpläne, Bereich wählen (Unidad, von … bis …), Wiederholen oder Neu lernen.

import { h, leere, anfuegen } from '../dom.js';
import { stelleSitzungZusammen, addiereTage } from '../scheduler.js';
import { woerterImBereich, seitenGruppen, bereichsTitel } from '../bereich.js';
import { erstellePlan, planAktiv, neueFuerHeute, tagesPortion, planStand } from '../plan.js';
import { zeigeUeben } from './ueben.js';

const MAX_SITZUNG = 20;
const ANZAHLEN = [10, 15, 20, 30];
const TAGE = [1, 2, 3, 5, 7, 10, 14];

export function datum(iso) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' });
}

const minuten = (n) => Math.max(1, Math.round(n * 0.6));

/** Heutige Sitzung: fällige Wiederholungen + Tagesportion aus den Lernplänen. */
export function taeglicheAufgaben(app) {
  const heute = app.heute();
  const plaene = app.stand.plaene.filter((p) => planAktiv(p, heute));
  const neueIds = neueFuerHeute(plaene, app.stand.items, heute);
  return stelleSitzungZusammen({
    items: app.daten.items,
    fortschritt: app.stand.items,
    heute,
    max: MAX_SITZUNG,
    neueKandidaten: neueIds.map((id) => app.daten.nachId.get(id)).filter(Boolean),
    neueAnzahl: neueIds.length,
    erstkontakt: 'neu'
  });
}

export function zeigeVokabeln(el, app) {
  const heute = app.heute();
  const heutige = taeglicheAufgaben(app);
  const neuHeute = heutige.filter((a) => a.neu).length;

  anfuegen(el,
    h('h1', {}, 'Vokabeln'),
    h('section', { class: 'karte' },
      h('h2', {}, 'Heute'),
      heutige.length
        ? h('p', {}, `${heutige.length - neuHeute} Wiederholungen`, neuHeute ? ` · ${neuHeute} neue Wörter aus deinen Lernplänen` : '')
        : h('p', {}, 'Heute ist nichts fällig ✓ Du kannst unten trotzdem Wörter wiederholen.'),
      heutige.length ? h('button', {
        type: 'button', class: 'knopf primaer gross',
        onclick: () => app.zeige(zeigeUeben, { titel: 'Täglich üben', aufgaben: taeglicheAufgaben(app) })
      }, `▶ Täglich üben (${heutige.length} Aufgaben, ca. ${minuten(heutige.length)} Min.)`) : null),
    lernplaene(app, heute),
    auswahlBereich(app, heute),
    h('button', { type: 'button', class: 'knopf', onclick: app.start }, '← Zurück')
  );
}

function lernplaene(app, heute) {
  const aktive = app.stand.plaene.filter((p) => planAktiv(p, heute));
  if (!aktive.length) return null;
  return h('section', { class: 'karte' },
    h('h2', {}, 'Meine Lernpläne'),
    h('ul', { class: 'plaene' }, aktive.map((p) => {
      const s = planStand(p, app.stand.items);
      const portion = tagesPortion(p, app.stand.items, heute);
      const tage = Math.round((Date.parse(p.ziel) - Date.parse(heute)) / 86400000);
      return h('li', {},
        h('strong', {}, p.titel),
        h('p', { class: 'meta' }, `Termin: ${datum(p.ziel)} (noch ${tage} ${tage === 1 ? 'Tag' : 'Tage'})`),
        h('div', { class: 'balken', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(s.gesamt), 'aria-valuenow': String(s.eingefuehrt) },
          h('div', { class: 'balken-fuellung', style: `width:${(100 * s.eingefuehrt) / s.gesamt}%` })),
        h('p', { class: 'meta' }, `${s.eingefuehrt} von ${s.gesamt} Wörtern eingeführt · ${s.sicher} sicher`,
          portion ? ` · heute noch ${portion} neue` : (s.eingefuehrt < s.gesamt ? ' · für heute geschafft ✓' : '')),
        h('button', {
          type: 'button', class: 'link', onclick: () => {
            if (!confirm(`Lernplan „${p.titel}“ löschen? Dein Lernstand bei den Wörtern bleibt erhalten.`)) return;
            app.stand.plaene = app.stand.plaene.filter((x) => x.id !== p.id);
            app.speichere();
            app.zeige(zeigeVokabeln);
          }
        }, 'Plan löschen'));
    })));
}

function auswahlBereich(app, heute) {
  const e = app.stand.einstellungen;
  const zustand = { uk: app.daten.unidades[0]?.uk ?? '', von: null, bis: null, modus: 'wiederholen', anzahl: e.wiederholenAnzahl ?? 15, tage: 7 };

  const unidadWahl = h('select', { class: 'auswahl', 'aria-label': 'Unidad' },
    app.daten.unidades.map((u) => h('option', { value: u.uk }, u.titel)),
    h('option', { value: '' }, 'Alle Unidades'));
  const vonWahl = h('select', { class: 'auswahl', 'aria-label': 'von Wort' });
  const bisWahl = h('select', { class: 'auswahl', 'aria-label': 'bis Wort' });
  const vonBis = h('div', { class: 'von-bis' },
    h('label', {}, h('span', {}, 'von'), vonWahl),
    h('label', {}, h('span', {}, 'bis'), bisWahl));
  const info = h('p', { class: 'meta', role: 'status' });
  const modusKnoepfe = h('div', { class: 'segment', role: 'radiogroup', 'aria-label': 'Wie möchtest du üben?' });
  const panel = h('div', { class: 'modus-panel' });

  function fuelleWortlisten() {
    const items = app.daten.items.filter((x) => x.uk === zustand.uk);
    vonBis.hidden = !zustand.uk;
    for (const [sel, wert] of [[vonWahl, items[0]?.id], [bisWahl, items.at(-1)?.id]]) {
      leere(sel).append(...seitenGruppen(items).map((g) => h('optgroup', { label: g.label },
        g.items.map((it) => h('option', { value: it.id }, it.es)))));
      sel.value = wert ?? '';
    }
    zustand.von = items[0]?.id ?? null;
    zustand.bis = items.at(-1)?.id ?? null;
  }

  const bereich = () => (zustand.uk ? { uk: zustand.uk, von: zustand.von, bis: zustand.bis } : {});
  const unidadTitel = () => app.daten.unidades.find((u) => u.uk === zustand.uk)?.titel ?? 'Alle Unidades';

  function aktualisiere() {
    const woerter = woerterImBereich(app.daten.items, bereich());
    const geuebt = woerter.filter((w) => app.stand.items[w.id]).length;
    info.textContent = `${woerter.length} Wörter ausgewählt${geuebt ? ` · ${geuebt} davon schon geübt` : ''}`;
    leere(modusKnoepfe).append(
      segmentKnopf('wiederholen', 'Wiederholen', 'Ich habe die Wörter schon gelernt'),
      segmentKnopf('neu', 'Neu lernen', 'Ich lerne die Wörter zum ersten Mal'));
    anfuegen(leere(panel), zustand.modus === 'neu' ? panelNeu(woerter) : panelWiederholen(woerter));
  }

  function segmentKnopf(wert, text, unter) {
    return h('button', {
      type: 'button', role: 'radio', class: 'segment-knopf', 'aria-checked': String(zustand.modus === wert),
      onclick: () => { zustand.modus = wert; aktualisiere(); }
    }, h('strong', {}, text), h('small', {}, unter));
  }

  function chipReihe(werte, aktuell, beschriftung, setze, label) {
    return h('div', { class: 'chips', role: 'radiogroup', 'aria-label': label }, werte.map((w) => h('button', {
      type: 'button', class: 'chip', role: 'radio', 'aria-checked': String(w === aktuell), 'aria-pressed': String(w === aktuell),
      onclick: () => { setze(w); aktualisiere(); }
    }, beschriftung(w))));
  }

  function panelWiederholen(woerter) {
    const n = woerter.length;
    const werte = [...ANZAHLEN.filter((a) => a < n), n];
    if (!werte.includes(zustand.anzahl)) zustand.anzahl = werte.find((w) => w >= 15) ?? n;
    const anzahl = Math.min(zustand.anzahl, n);
    return [
      h('h3', {}, 'Wie viele Wörter möchtest du wiederholen?'),
      chipReihe(werte, zustand.anzahl, (w) => (w === n ? `alle (${n})` : String(w)), (w) => { zustand.anzahl = w; }, 'Anzahl'),
      h('p', { class: 'meta' }, 'Zuerst kommen fällige Wörter, dann noch nicht geübte. Wer ein Wort gleich weiß, überspringt die leichten Stufen.'),
      h('button', {
        type: 'button', class: 'knopf primaer gross', disabled: !n,
        onclick: () => {
          e.wiederholenAnzahl = zustand.anzahl;
          app.speichere();
          app.zeige(zeigeUeben, {
            titel: bereichsTitel(app.daten.items, bereich(), unidadTitel()),
            aufgaben: stelleSitzungZusammen({
              items: woerter, fortschritt: app.stand.items, heute, max: anzahl, erstkontakt: 'diagnose', auffuellen: true
            })
          });
        }
      }, `▶ ${anzahl} Wörter wiederholen`)
    ];
  }

  function panelNeu(woerter) {
    const unbekannt = woerter.filter((w) => !app.stand.items[w.id]);
    const tageFeld = h('input', { type: 'number', min: '1', max: '60', inputmode: 'numeric', value: String(zustand.tage), 'aria-label': 'Anzahl Tage' });
    tageFeld.addEventListener('change', () => { zustand.tage = Math.min(60, Math.max(1, Number(tageFeld.value) || 7)); aktualisiere(); });
    const vorschau = erstellePlan({ titel: '', itemIds: unbekannt.map((w) => w.id), heute, tage: zustand.tage });
    const proTag = tagesPortion(vorschau, {}, heute);
    const bekannt = woerter.length - unbekannt.length;
    const vorschauText = !unbekannt.length
      ? 'Alle Wörter in diesem Bereich hast du schon geübt. Nimm „Wiederholen“.'
      : zustand.tage <= 2
        ? `Heute ${unbekannt.length} neue Wörter${zustand.tage === 2 ? `, morgen (${datum(addiereTage(heute, 1))}) nur Wiederholung` : ''}.`
        : `Ca. ${proTag} neue Wörter pro Tag bis ${datum(vorschau.lernEnde)}, am ${datum(addiereTage(vorschau.ziel, -1))} nur Wiederholung.`;
    return [
      h('h3', {}, 'Wie viele Tage hast du noch Zeit?'),
      h('p', { class: 'meta' }, 'Zum Beispiel bis zum Vokabeltest.'),
      chipReihe(TAGE, zustand.tage, (t) => (t === 1 ? '1 Tag' : `${t} Tage`), (t) => { zustand.tage = t; }, 'Tage'),
      h('label', { class: 'andere-tage' }, 'oder: ', tageFeld, ' Tage'),
      h('p', { class: 'plan-vorschau', role: 'status' },
        unbekannt.length ? h('span', { class: 'termin' }, `Termin (z. B. Test): ${datum(vorschau.ziel)}`) : null, vorschauText),
      bekannt && unbekannt.length ? h('p', { class: 'meta' }, `${bekannt} Wörter kennst du schon – sie laufen in der normalen Wiederholung mit.`) : null,
      h('button', {
        type: 'button', class: 'knopf primaer gross', disabled: !unbekannt.length,
        onclick: () => {
          const plan = erstellePlan({
            titel: bereichsTitel(app.daten.items, bereich(), unidadTitel()),
            itemIds: woerter.map((w) => w.id), heute, tage: zustand.tage, bereich: bereich()
          });
          app.stand.plaene.push(plan);
          app.speichere();
          app.zeige(zeigeUeben, { titel: 'Täglich üben', aufgaben: taeglicheAufgaben(app) });
        }
      }, '▶ Lernplan anlegen und loslegen')
    ];
  }

  unidadWahl.addEventListener('change', () => { zustand.uk = unidadWahl.value; fuelleWortlisten(); aktualisiere(); });
  vonWahl.addEventListener('change', () => { zustand.von = vonWahl.value; aktualisiere(); });
  bisWahl.addEventListener('change', () => { zustand.bis = bisWahl.value; aktualisiere(); });
  fuelleWortlisten();
  aktualisiere();

  return h('section', { class: 'karte' },
    h('h2', {}, 'Wörter auswählen'),
    h('p', { class: 'meta' }, 'Z. B. aus der Hausaufgabe: Unidad, erstes und letztes Wort. Die Liste ist nach Seiten im Vocabulario sortiert.'),
    h('label', { class: 'unidad-wahl' }, h('span', {}, 'Unidad'), unidadWahl),
    vonBis, info,
    h('h3', {}, 'Wie möchtest du üben?'),
    modusKnoepfe, panel);
}

