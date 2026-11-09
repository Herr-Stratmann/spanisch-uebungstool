# Spanisch-Übungstool

Statische Web-App (Vanilla JS, keine Abhängigkeiten, kein Build-Schritt). Spezifikation: [SPEC.md](SPEC.md).

## Stand

- [x] `js/check.js` – Antwortprüfung (§6) mit Tests
- [x] `js/scheduler.js` – Leitner-Logik und Sitzungen (§5, Wortschatzteil von §7) mit Tests
- [ ] `js/storage.js`, Oberfläche, Übungstypen, PWA, Daten

## Tests

```
node --test
```

(Node ≥ 20. Das `package.json` dient nur dazu, ES-Module für Node zu aktivieren.)

## Auslegung der Spec (Entscheidungen in Schritt 1)

| Punkt | Entscheidung |
|---|---|
| Hinterlegte Fehlantwort vs. Akzent-Toleranz | Die Daten gewinnen: Steht `esta` in `fehlantworten`, gibt es den gezielten Hinweis statt „richtig mit Akzenthinweis“. |
| ñ fehlt vs. Tippfehler (beides Levenshtein 1) | ñ wird zuerst geprüft und ist falsch, mit eigenem Hinweis und 2. Versuch. |
| Hinweistext Akzent | „Achte auf den Akzent: *está*“ (statt „Tilde“, weil Tilde im Deutschen das Zeichen über dem ñ meint). |
| Erneute Abfrage in derselben Sitzung nach „falsch“ | Reine Übung, wird nicht noch einmal im Fach verbucht. Sonst würde eine richtige Antwort Minuten später den Abstieg sofort wieder aufheben. |
| Neues Item (Fach 0) richtig nach Hinweis | Fach 1, fällig morgen. |
| „falsch → minimal Fach 1“ vs. „3× hintereinander falsch → Fach 0“ (§7) | §7 hat Vorrang. Eine richtige Antwort (auch nach Hinweis) unterbricht die Serie. |
| Sitzungslänge „15–20“ | Standard 15, Parameter `max`. Ergibt 10 Wiederholungen + 5 neue. |
| Reihenfolge neuer Items | Lehrbuchreihenfolge (Reihenfolge in den JSON-Dateien), damit Beispielsätze nur Bekanntes enthalten. |
| `nicht_zusammen_mit` | Gilt in beide Richtungen, nur für Neueinführungen, nicht für Wiederholungen. |
