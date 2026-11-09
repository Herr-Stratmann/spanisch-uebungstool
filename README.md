# ¡Practica! – Spanisch-Übungstool

Statische Web-App für Wortschatz-Wiederholung (Vanilla JS, keine Abhängigkeiten, kein Build-Schritt).
Spezifikation: [SPEC.md](SPEC.md) – inkl. §14 mit den Entscheidungen vom 09.11.2026.
Der Name „¡Practica!“ ist ein Platzhalter (offener Punkt §13) und steht in `index.html` und `manifest.webmanifest`.

## Stand (Version 1, Schritt 2)

| Bereich | Stand |
|---|---|
| `check.js`, `scheduler.js`, `storage.js`, `ablauf.js` | fertig, mit Tests |
| Oberfläche: Start (Vokabeln / Grammatik), Vokabeln nach Unidades oder gemischt, Fortschritt, Meine Sätze, Beamermodus | fertig |
| Vokabeln | Bereich wählen (Unidad, von–bis nach Seite/Bloque), „Wiederholen“ (Anzahl wählbar, direkte Abfrage) oder „Neu lernen“ (Lernplan bis zum Termin) |
| Grammatik | Themenliste (22 Themen, nach Bereichen; Lehrbuch-Abschnitte, die fürs Üben zusammengehören, sind zusammengefasst (`unidades` nennt die Quellen)) in `data/index.json`; Übungen folgen in V2. Ein Thema wird aktiv, sobald `datei` gesetzt ist. |
| Übungstypen Stufe 1 | `mc_es_de`, `mc_bild` (offen: `mc_audio`) |
| Übungstypen Stufe 2 | `tippen_de_es`, `luecke_hilfe` (offen: `diktat`) |
| Übungstypen Stufe 3 | `luecke` (offen: `satzpuzzle`, `kollokation`, `umformen`) |
| Übungstypen Stufe 4 | `situation` mit Musterlösung, Checkliste, Selbstbewertung |
| PWA | Manifest, Service Worker, Icons |
| Daten | Unidad 1–8 aus ¡Vamos! ¡Adelante! Curso intensivo 1, 831 Wörter mit Seite/Bloque, eigenen Beispielsätzen und Situationen |

## Hinweise zu den Daten

- Weggelassen: Artikel und Zahlen (laufen über die Grammatik), Orts- und Eigennamen (z. B. Andalucía, los Alpes) sowie einzelne Doppelungen (z. B. „el horror“ neben „¡Qué horror!“).
- Wörter mit zwei Formen (el hermano / la hermana) verlangen beide Formen; nur eine Form gibt einen Hinweis und einen zweiten Versuch.
- Bedeutungsunterscheidende Akzente (tú/tu, él/el, sí/si, qué/que …) sind über `fehlantworten_es` abgesichert.
- Distraktoren wurden automatisch gewählt (gleiche Wortart, anderes Thema) und können in den JSON-Dateien von Hand angepasst werden.

## Lokal starten

```
python3 -m http.server 8000      # dann http://localhost:8000
node --test                      # Unit-Tests (Node ≥ 20)
node tools/validate-data.mjs     # Inhaltsdateien prüfen
```

`?beamer=1` an die URL hängen öffnet den Beamermodus.

## Neue Inhalte ergänzen

1. `data/vocab/unidad-02.json` nach dem Muster von Unidad 1 anlegen (§8.1), Items in Buchreihenfolge, jeweils mit `seite` und `bloque`.
2. In `data/index.json` unter `unidades` eintragen.
3. In `sw.js` die Datei in `DATEIEN` ergänzen und `VERSION` erhöhen (ein Test meldet vergessene Dateien).
4. `node tools/validate-data.mjs` und `node --test` laufen lassen.

## Veröffentlichen (GitHub Pages + Jamf School)

1. Repository auf GitHub anlegen, Inhalt dieses Ordners hochladen.
2. *Settings → Pages → Deploy from a branch → main / (root)*.
3. In Jamf School einen Web Clip mit der Pages-URL anlegen, „Vollbild“ aktivieren und den iPads zuweisen.
   Als Homescreen-App bleibt der Fortschritt erhalten (Safari löscht sonst Website-Daten nach 7 Tagen ohne Nutzung).

## Auslegung der Spec (Entscheidungen in der Umsetzung)

| Punkt | Entscheidung |
|---|---|
| ñ fehlt vs. Tippfehler (beides Levenshtein 1) | ñ wird zuerst geprüft und ist falsch, mit eigenem Hinweis und 2. Versuch. |
| Hinweistext Akzent | „Achte auf den Akzent: *está*“ (statt „Tilde“, weil Tilde im Deutschen das Zeichen über dem ñ meint). |
| Neues Item (Fach 0) richtig nach Hinweis | Fach 1, fällig morgen. |
| „falsch → minimal Fach 1“ vs. „3× hintereinander falsch → Fach 0“ (§7) | §7 hat Vorrang. Eine richtige Antwort (auch nach Hinweis) unterbricht die Serie. |
| Sitzungslänge „15–20“ | Standard 15. Ergibt 10 Wiederholungen + 5 neue, wenn genug fällig ist. |
| Reihenfolge neuer Items | Lehrbuchreihenfolge (Reihenfolge in den JSON-Dateien). |
| `nicht_zusammen_mit` | Gilt in beide Richtungen, nur für Neueinführungen. |
| Sicherheit + Prüfen | Ein Tipp: „✓ Sicher – prüfen“ oder „? Unsicher – prüfen“. |
| Stufe 4 | Keine Sicherheitsangabe, dafür Selbstbewertung. Der automatische Hinweis „Zielwort gefunden“ kommt aus `js/bewertung.js` (`bewerteFreienSatz()`, später durch KI ersetzbar). |
| Beamermodus | Unidad und Stufe wählen, Aufgaben in Lehrbuchreihenfolge, Lösung auf Klick, nichts wird gespeichert. |
| iPad-Eingabe | Autokorrektur und Großschreibung aus, Sonderzeichenleiste hält die Tastatur offen, Schrift ≥ 16 px (kein Zoom). |
