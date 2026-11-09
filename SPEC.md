# SPEC – Spanisch-Übungstool (Wortschatz & Grammatik)

> Grundlage für die Entwicklung mit Claude Code.
> Projekt: CJD Christophorusschule Gymnasium Versmold, Spanischkurs (1.–2. Lernjahr, A1–A2)
> Stand: 08.11.2026

---

## 1. Ziel

Ein browserbasiertes Lern-Tool, mit dem Schülerinnen und Schüler bereits gelernten **Wortschatz** und **Grammatik** wiederholen, festigen und bei Bedarf **neu lernen**. Leitproblem: Die Lernenden kennen Vokabeln isoliert, können sie aber kaum in **eigenen Sätzen** anwenden. Das Tool führt deshalb jedes Item schrittweise vom Erkennen bis zur freien Verwendung.

## 2. Rahmenbedingungen

| Punkt | Festlegung |
|---|---|
| Zielgruppe | Spanisch 1.–2. Lernjahr, GER A1–A2 |
| Geräte | 1:1-iPads (Safari), zusätzlich Beamer im Unterricht |
| Konten | **Kein Login.** Keine personenbezogenen Daten. |
| Speicherung | Lokal im Browser (localStorage), Export/Import des Fortschritts |
| Hosting | GitHub Pages (statisch) |
| Verteilung | Jamf School Web Clip (Homescreen-Web-App) |
| KI | Version 1 ohne KI. Später optional KI-Feedback (z. B. fobizz) für freie Sätze |
| Inhalte | Vokabelliste und Grammatik liegen im Projektkontext und werden in das JSON-Format aus Abschnitt 8 überführt |

## 3. Didaktische Prämissen (verbindlich)

Jede Prämisse ist eine Anforderung. Bei Designentscheidungen gilt: Was einer Prämisse widerspricht, wird nicht gebaut.

1. **Abrufen statt Wiederlesen** (Testeffekt; Karpicke & Roediger 2008). Jede Übung verlangt zuerst eine eigene Antwort, erst danach kommt Rückmeldung. Kein reines „Karte umdrehen“.
2. **Verteilte Wiederholung** (Spacing; Cepeda et al. 2006). Jedes Item hat ein eigenes Leitner-Fach mit wachsenden Abständen (Abschnitt 5).
3. **Progression Erkennen → Abrufen → Verwenden → frei Produzieren** (Nation 2013; Involvement Load Hypothesis, Laufer & Hulstijn 2001). Das Fach bestimmt den Übungstyp. Ein Item gilt erst als „gelernt“, wenn es in einem eigenen Satz verwendet wurde.
4. **Kontext und Chunks** (Lexical Approach). Wo sinnvoll, werden Wendungen gelernt („hacer los deberes“), nicht nur Einzelwörter. Beispielsätze enthalten außer dem Zielitem nur bereits eingeführten Wortschatz (Tag `unidad`).
5. **Keine semantischen Cluster bei der Einführung** (Tinkham 1993; Waring 1997). Synonyme, Antonyme und Reihen (Wochentage, Farben) werden nicht in derselben Sitzung **neu** eingeführt. Thematische Gruppen sind erlaubt. In der Wiederholung darf gemischt werden.
6. **Grammatik: Bemerken → Verarbeiten → Produzieren** (Schmidt: Noticing; VanPatten: Processing Instruction; Swain: Output; Norris & Ortega 2000). Kurze explizite Regel, Form visuell hervorgehoben, dann Aufgaben, bei denen die Form bedeutungsrelevant ist, dann Produktion.
7. **Interleaving bei Kontrasten.** Kontrastive Phänomene (ser/estar, hay/estar, gustar vs. reguläre Verben, später indefinido/imperfecto) werden nach der Einführung **gemischt** geübt.
8. **Feedback, das Selbstkorrektur ermöglicht** (Lyster & Ranta 1997; Hattie & Timperley 2007; Heift 2004). Gestuft: erst Hinweis, dann Lösung mit Kurzregel (Abschnitt 6).
9. **Metakognition.** Vor dem Prüfen gibt die Person an: „sicher“ / „unsicher“. Falsche Antworten bei „sicher“ erhalten besonders deutliches Feedback (Hypercorrection-Effekt).
10. **Mehrsprachigkeit.** Optionaler Brücken-Tipp zu Englisch/Latein/Französisch. *Falsos amigos* werden markiert.
11. **Motivation über Kompetenzerleben** (Selbstbestimmungstheorie). Sichtbarer Fortschritt, Wahlfreiheit bei Unidad/Thema/Grammatik. **Keine** Ranglisten, **kein** Zeitdruck, **keine** Streaks mit Verlustangst.

## 4. Lernstufen und Übungstypen

### 4.1 Wortschatz

| Stufe | Ziel | Übungstypen (`typ`) |
|---|---|---|
| 1 Erkennen | rezeptiv | `mc_es_de` (ES → DE wählen), `mc_audio` (hören → Wort/Bild wählen), `mc_bild` (Bild/Emoji → Wort wählen). Distraktoren: gleiche Wortart, nicht semantisch eng verwandt |
| 2 Gelenkt abrufen | produktiv, mit Stütze | `tippen_de_es` (DE → ES tippen), `luecke_hilfe` (Lückensatz mit Anfangsbuchstabe und Länge), `diktat` (TTS hören → schreiben) |
| 3 Verwenden | produktiv im Satz | `luecke` (Lückensatz ohne Hilfe, ggf. konjugierte Form), `satzpuzzle` (Wörter in Reihenfolge bringen), `kollokation` (passende Teile verbinden), `umformen` (Satz in andere Person/Zahl) |
| 4 Frei produzieren | eigener Satz | `situation` (Situations- oder Bildimpuls → eigener Satz mit Zielitem) mit Musterlösung + Checkliste + Selbstbewertung |

### 4.2 Grammatik (je Phänomen)

| Stufe | Ziel | Übungstypen (`typ`) |
|---|---|---|
| 0 Einführung | Bemerken | `regelkarte`: Regel in 1–3 Sätzen, 3 Beispiele, Zielform farbig hervorgehoben |
| 1 Verarbeiten | Form → Bedeutung | `structured_input`: Bedeutung über die Form erschließen (z. B. „¿Quién habla? hablo → yo / él“) |
| 2 Gelenkt | Form bilden | `luecke_infinitiv` (Infinitiv in Klammern), `formen_zuordnen` |
| 3 Kontrast & Kontrolle | unterscheiden | `fehler_finden` (Fehler im Satz markieren und korrigieren), `kontrast_mc` (z. B. ser/estar gemischt), `umformen` |
| 4 Kommunikativ | anwenden | `persoenliche_frage` (Frage über sich selbst beantworten), `minidialog` (Lücken in Dialog füllen) – Selbstbewertung wie Wortschatz Stufe 4 |

### 4.3 Stufe 4 ohne KI

- Lernende schreiben einen eigenen Satz.
- Danach erscheinen **Musterlösung(en)** und eine **Checkliste**, z. B.:
  - Ist das Zielwort enthalten?
  - Ist das Verb passend konjugiert?
  - Stimmen Artikel und Genus/Numerus?
  - Stimmt die Wortstellung (z. B. Verneinung *no* vor dem Verb)?
- Selbstbewertung: **passt** / **teilweise** / **noch nicht** → wirkt auf das Leitner-Fach (Abschnitt 5).
- Eigene Sätze werden lokal gespeichert („Meine Sätze“) und können kopiert werden (z. B. für OneNote/Teams).
- Schnittstelle für späteres KI-Feedback vorsehen (Funktion `bewerteFreienSatz()` als austauschbares Modul), aber in V1 nicht implementieren.

## 5. Wiederholungslogik (Leitner)

- Fächer: `0` (neu) und `1`–`5`.
- Fälligkeit nach richtiger Antwort: Fach 1 → 1 Tag, 2 → 2 Tage, 3 → 4 Tage, 4 → 8 Tage, 5 → 16 Tage. Fach 5 bleibt danach in 16-Tage-Abständen aktiv.
- Fach → Stufe:

| Fach | Übungsstufe |
|---|---|
| 0 | Einführung (Wort mit Audio, Übersetzung, Beispielsatz) + sofort Stufe 1 |
| 1 | Stufe 1 oder 2 |
| 2 | Stufe 2 |
| 3 | Stufe 3 |
| 4 | Stufe 3 oder 4 |
| 5 | Stufe 4 |

- Bewertung:
  - richtig im 1. Versuch → +1 Fach
  - richtig nach Hinweis (2. Versuch) → Fach bleibt, nächste Fälligkeit morgen
  - falsch → −2 Fächer (minimal Fach 1), in derselben Sitzung später erneut abfragen
  - Stufe 4 Selbstbewertung: passt → +1, teilweise → 0, noch nicht → −1
- **Sitzung** (Standard „Täglich üben“): max. 15–20 Aufgaben (~10 Min.), ca. 70 % fällige Wiederholungen, max. 5 neue Items. Items aus verschiedenen Unidades/Phänomenen mischen. Prämisse 5 bei neuen Items beachten.
- Zusätzlich frei wählbar: „Unidad üben“, „Grammatik üben“ (wirkt ebenfalls auf die Fächer).

## 6. Antwortprüfung und Feedback

### 6.1 Normalisierung

Vor dem Vergleich: trimmen, Kleinschreibung, Mehrfach-Leerzeichen zusammenfassen, Satzzeichen am Ende ignorieren, ¿ und ¡ optional. Alle Einträge in `akzeptiert` gelten als richtig.

### 6.2 Fehlerklassen

| Klasse | Erkennung | Behandlung |
|---|---|---|
| exakt richtig | Match nach Normalisierung | richtig |
| Akzentfehler | Match nach Entfernen von á é í ó ú ü | **richtig**, aber Hinweis mit korrekter Schreibung (z. B. „Achte auf die Tilde: *está*“) |
| ñ fehlt | n statt ñ | **falsch** (ñ ist ein eigener Buchstabe, z. B. *año/ano*) |
| Artikel fehlt | Substantiv ohne el/la/los/las | Hinweis „Artikel fehlt“, 2. Versuch |
| Tippfehler | Levenshtein-Distanz 1 bei Länge ≥ 5 | Hinweis „Fast! Prüf die Schreibung“, 2. Versuch |
| bekannter Fehlertyp | Antwort entspricht einem Eintrag in `fehlertypen` | gezielter Hinweis aus den Daten, 2. Versuch |
| falsch | alles andere | allgemeiner Hinweis (Anfangsbuchstabe, Länge), 2. Versuch |

### 6.3 Ablauf

1. Antwort + Sicherheit („sicher“/„unsicher“) → Prüfen.
2. Falsch → **Hinweis**, 2. Versuch.
3. Wieder falsch → **Lösung**, Kurzregel/Beispielsatz, Audio. Optional: Lösung einmal abtippen.
4. War die Person „sicher“ und lag falsch → Feedback besonders hervorheben, bei Grammatik direkt die Regelkarte anbieten.

Feedbacktexte: kurz, auf Deutsch, freundlich, sachlich. Kein „Falsch!“ in Rot als einziges Signal (Barrierefreiheit: Farbe + Text + Symbol).

## 7. Diagnoseschleife („neu lernen, wenn nötig“)

- Jede Grammatikaufgabe verweist auf ein Phänomen (`phaenomen_id`), typische Fehlantworten auf einen Fehlertyp.
- Wird ein Phänomen **2× innerhalb einer Sitzung** oder **3× innerhalb von 7 Tagen** falsch gelöst:
  1. Regelkarte anzeigen,
  2. 2–3 Aufgaben der Stufen 1–2 dieses Phänomens einschieben,
  3. Phänomen in der Fortschrittsübersicht als „wiederholen“ markieren.
- Bei Wortschatz: Item, das 3× hintereinander falsch war, bekommt erneut die Einführung (Fach 0).
- V2: optionaler **Einstufungstest** pro Unidad/Phänomen. Sicher Beherrschtes startet in Fach 3.

## 8. Datenmodell

Inhalte liegen **ausschließlich** in JSON-Dateien, nie im Code. Neue Unidades werden durch Hinzufügen von Dateien ergänzt.

```
/data/index.json              – Liste aller Dateien und Unidades
/data/vocab/unidad-01.json    – Wortschatz je Unidad
/data/grammar/<id>.json       – ein Grammatikphänomen je Datei
```

### 8.1 Wortschatz-Item

```json
{
  "id": "u03-012",
  "es": "hacer los deberes",
  "de": "die Hausaufgaben machen",
  "akzeptiert_es": ["hacer los deberes"],
  "akzeptiert_de": ["Hausaufgaben machen", "die Hausaufgaben machen"],
  "unidad": 3,
  "wortart": "verbo",
  "genero": null,
  "chunk": true,
  "tema": "colegio",
  "bild": "📚",
  "beispiele": [
    {
      "es": "Por la tarde hago los deberes.",
      "de": "Nachmittags mache ich die Hausaufgaben.",
      "luecke": "hago los deberes",
      "luecke_akzeptiert": ["hago los deberes"]
    }
  ],
  "situation": {
    "impuls": "Es ist 17 Uhr. Was machst du gerade? Schreib einen Satz.",
    "muster": ["Hago los deberes.", "Ahora hago los deberes en mi habitación."]
  },
  "falso_amigo": false,
  "bruecke": "—",
  "nicht_zusammen_mit": [],
  "distraktoren_de": ["das Zimmer aufräumen", "Fußball spielen", "fernsehen"]
}
```

Hinweise:
- `genero`: `"m"`, `"f"`, `"m/f"` oder `null`. Substantive werden mit Artikel gespeichert (`"la mesa"`).
- `nicht_zusammen_mit`: IDs, die nicht in derselben Sitzung neu eingeführt werden (Prämisse 5).
- `bild`: Emoji oder Pfad zu einem eigenen bzw. frei lizenzierten Bild. **Keine Abbildungen aus dem Lehrwerk.**
- Beispielsätze selbst formulieren und nur bekannten Wortschatz verwenden (≤ eigene Unidad).

### 8.2 Grammatikphänomen

```json
{
  "id": "g-ser-estar-ort",
  "titel": "ser oder estar? – Ortsangaben",
  "unidad": 2,
  "kontrast_mit": ["g-ser-herkunft"],
  "regelkarte": {
    "regel": "Wo sich etwas oder jemand befindet, drückt man mit estar aus.",
    "beispiele": [
      { "es": "Madrid **está** en España.", "de": "Madrid liegt in Spanien." },
      { "es": "¿Dónde **estás**?", "de": "Wo bist du?" },
      { "es": "El libro **está** en la mesa.", "de": "Das Buch liegt auf dem Tisch." }
    ]
  },
  "fehlertypen": [
    { "id": "ser-statt-estar-ort", "hinweis": "Es geht um einen Ort. Welches Verb benutzt man für Ortsangaben?" }
  ],
  "aufgaben": [
    {
      "id": "g-ser-estar-ort-01",
      "stufe": 2,
      "typ": "luecke_infinitiv",
      "satz": "Mis padres ___ (ser/estar) en Sevilla.",
      "akzeptiert": ["están"],
      "fehlantworten": { "son": "ser-statt-estar-ort" }
    },
    {
      "id": "g-ser-estar-ort-02",
      "stufe": 3,
      "typ": "fehler_finden",
      "satz": "La escuela es en el centro.",
      "fehlerwort": "es",
      "akzeptiert": ["está"],
      "fehlertyp": "ser-statt-estar-ort"
    }
  ]
}
```

Markierung der Zielform in Beispielen mit `**…**` (wird farbig hervorgehoben dargestellt).

### 8.3 Lokaler Fortschritt (localStorage)

```json
{
  "schema": 1,
  "items": {
    "u03-012": { "fach": 3, "faellig": "2026-11-12", "richtig": 5, "falsch": 1, "letzte": "2026-11-08" }
  },
  "phaenomene": {
    "g-ser-estar-ort": { "fehler7Tage": ["2026-11-06", "2026-11-08"], "status": "wiederholen" }
  },
  "saetze": [
    { "item": "u03-012", "text": "Hago los deberes con mi amiga.", "selbst": "passt", "datum": "2026-11-08" }
  ],
  "einstellungen": { "neueProSitzung": 5, "audio": true }
}
```

- Schlüssel versioniert (`schema`), Migration bei Änderungen.
- **Export/Import**: Fortschritt als JSON-Datei herunterladen bzw. einlesen (Gerätewechsel, Sicherung).

## 9. Oberfläche

- **Start**: „Heute fällig: X Aufgaben“ → Button „Täglich üben“ (empfohlen). Daneben: „Unidad üben“, „Grammatik üben“, „Mein Fortschritt“, „Meine Sätze“.
- **Übung**: eine Aufgabe pro Bildschirm, große Schrift, Touch-Ziele ≥ 44 px. Sicherheitsauswahl + „Prüfen“.
- **Sonderzeichenleiste** über dem Eingabefeld: á é í ó ú ñ ü ¿ ¡.
- **Audio**: Lautsprecher-Button bei spanischen Wörtern/Sätzen (Web Speech API, `es-ES`). Fehlt eine Stimme, wird der Button ausgeblendet.
- **Fortschritt**: je Unidad Verteilung auf Fächer, je Grammatikphänomen Status (neu / in Arbeit / sicher / wiederholen).
- **Beamermodus** (Umschalter oder `?beamer=1`): sehr große Schrift, Lösung erst auf Klick, **nichts wird gespeichert**.
- Sprache der Oberfläche: Deutsch. Aufgabenstellungen kurz und einheitlich.
- Barrierefreiheit: ausreichender Kontrast, Farbe nie als einziges Signal, Bedienung ohne Zeitlimit.

## 10. Technik

- **Vanilla HTML/CSS/JavaScript (ES-Module), kein Build-Schritt, keine Frameworks**, damit die Lehrkraft das Projekt ohne Toolchain pflegen kann.
- **Keine externen Ressourcen** (keine CDNs, keine Webfonts von Drittanbietern, kein Tracking, keine Analytics).
- PWA: `manifest.webmanifest` + Service Worker für Offline-Nutzung und Homescreen-Start (Safari löscht localStorage normaler Websites nach 7 Tagen ohne Nutzung, Homescreen-Web-Apps sind davon ausgenommen).
- Logik in reinen, testbaren Modulen trennen:
  - `js/check.js` – Antwortprüfung (Normalisierung, Fehlerklassen)
  - `js/scheduler.js` – Leitner-Logik und Sitzungszusammenstellung
  - `js/diagnose.js` – Diagnoseschleife
  - `js/storage.js` – localStorage, Export/Import, Migration
  - `js/exercises/*.js` – je Übungstyp ein Modul
- Tests mit `node --test` für `check`, `scheduler`, `diagnose`.
- Ein Skript `tools/validate-data.mjs` prüft alle JSON-Dateien (Pflichtfelder, eindeutige IDs, Verweise).
- Zielplattform: Safari auf iPadOS (aktuelle Version). Zusätzlich Desktop-Browser für den Beamer.

## 11. Umfang und Reihenfolge

**Version 1 – Wortschatz**
- Übungstypen Stufe 1–4 aus 4.1
- Leitner-Logik, Sitzungen, Antwortprüfung, gestuftes Feedback
- Fortschritt, „Meine Sätze“, Export/Import
- PWA, Beamermodus
- Daten: Unidades aus der vorhandenen Vokabelliste

**Version 2 – Grammatik**
- Übungstypen aus 4.2, Regelkarten
- Diagnoseschleife, Interleaving von Kontrasten
- Einstufungstest

**Version 3 – optional**
- KI-Feedback für freie Sätze (Datenschutz und Schnittstelle vorher klären)
- Anonyme Kursauswertung (nur falls ohne personenbezogene Daten machbar)

## 12. Arbeitsanweisungen für Claude Code

- Diese Datei ist die verbindliche Spezifikation. Bei Widersprüchen nachfragen, nicht raten.
- Schrittweise arbeiten: erst `check.js` und `scheduler.js` mit Tests, dann die Oberfläche, dann Übungstypen einzeln.
- Keine Inhalte im Code hartkodieren. Beispieldaten nur in `/data/`.
- Keine zusätzlichen Abhängigkeiten ohne Rückfrage.
- Spanische Texte sorgfältig prüfen (Akzente, ¿ ¡, Genus).
- Nach jedem Schritt im Browser testen, Fokus auf iPad-Safari-Verhalten (Bildschirmtastatur, Audio erst nach Nutzerinteraktion).

## 13. Offene Punkte

- Lehrwerk und Unidades, die abgedeckt werden sollen
- Liste der Grammatikphänomene für V2 (aus dem Projektkontext)
- Anzahl neuer Items pro Sitzung (Standard 5) – nach erster Erprobung anpassen
- Name des Tools

## 14. Entscheidungen (Stand 09.11.2026)

Ergänzungen nach Rückfrage, verbindlich wie die übrigen Abschnitte.

1. **Fach 4 → 5 nur über einen eigenen Satz** (löst den Widerspruch zwischen Prämisse 3 und §5): Eine richtige Stufe-3-Aufgabe in Fach 4 hält das Fach, die nächste Abfrage ist Stufe 4. Erst „passt“ befördert nach Fach 5. „Gelernt“ = mindestens einmal „passt“; die Markierung bleibt auch bei späterem Zurückfallen.
2. **„Unidad üben“ mit nicht fälligen Items:** Fehler stufen normal zurück, Erfolge befördern nicht (Abstände bleiben erhalten). Die Sitzung füllt nach fälligen und neuen Items mit den als Nächstes fälligen auf.
3. **Daten:** Die Wortliste aus ¡Vamos! ¡Adelante! Curso intensivo 1 darf öffentlich auf GitHub Pages liegen. Beispielsätze, Situationen und Bilder werden selbst erstellt (§8.1).
4. **Erneute Abfrage in derselben Sitzung** (§5 „falsch“) ist reine Übung und wird nicht noch einmal im Fach verbucht.
5. **Datenmodell-Ergänzung** `fehlantworten_es` (optional) im Wortschatz-Item: `{ "tu": "Hinweistext" }` für bedeutungsunterscheidende Akzente (tú/tu, él/el, sí/si …). Hinterlegte Fehlantworten haben Vorrang vor der Akzent-Toleranz aus §6.2.
