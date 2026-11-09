// Lädt die Inhalte aus /data (SPEC §8). Inhalte stehen nie im Code.

async function holeJSON(pfad) {
  const antwort = await fetch(pfad);
  if (!antwort.ok) throw new Error(`${pfad} konnte nicht geladen werden (${antwort.status}).`);
  return antwort.json();
}

export async function ladeDaten(basis = 'data/') {
  const index = await holeJSON(`${basis}index.json`);
  const unidades = [];
  const items = [];
  for (const u of index.unidades ?? []) {
    const datei = u.vocab ? await holeJSON(basis + u.vocab) : { items: [] };
    unidades.push({ nr: u.nr, titel: u.titel ?? `Unidad ${u.nr}`, anzahl: datei.items.length });
    items.push(...datei.items);
  }
  const nachId = new Map(items.map((it) => [it.id, it]));
  // Grammatikthemen (V2): Einträge ohne „datei“ haben noch keine Übungen.
  const grammatik = (index.grammar ?? []).map((g) => ({ ...g, verfuegbar: Boolean(g.datei) }));
  return { index, unidades, items, nachId, grammatik };
}
