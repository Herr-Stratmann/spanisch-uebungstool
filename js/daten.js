// Lädt die Inhalte aus /data (SPEC §8). Inhalte stehen nie im Code.
// Jede Unidad hat einen Schlüssel „uk“ = "<band>-<nr>", damit spätere Bände (Unidad 1 in Band 2 …) nicht kollidieren.

async function holeJSON(pfad) {
  const antwort = await fetch(pfad);
  if (!antwort.ok) throw new Error(`${pfad} konnte nicht geladen werden (${antwort.status}).`);
  return antwort.json();
}

export function unidadSchluessel(band, nr) {
  return `${band ?? 1}-${nr}`;
}

export async function ladeDaten(basis = 'data/') {
  const index = await holeJSON(`${basis}index.json`);
  const baende = new Set((index.unidades ?? []).map((u) => u.band ?? 1));
  const unidades = [];
  const items = [];
  for (const u of index.unidades ?? []) {
    const band = u.band ?? 1;
    const uk = unidadSchluessel(band, u.nr);
    const datei = u.vocab ? await holeJSON(basis + u.vocab) : { items: [] };
    const titel = u.titel ?? `Unidad ${u.nr}`;
    unidades.push({ uk, band, nr: u.nr, titel: baende.size > 1 ? `Band ${band} · ${titel}` : titel, anzahl: datei.items.length });
    for (const it of datei.items) items.push({ ...it, band, uk });
  }
  const nachId = new Map(items.map((it) => [it.id, it]));
  // Grammatikthemen (V2): Einträge ohne „datei“ haben noch keine Übungen.
  const grammatik = (index.grammar ?? []).map((g) => ({ ...g, verfuegbar: Boolean(g.datei) }));
  return { index, unidades, items, nachId, grammatik };
}
