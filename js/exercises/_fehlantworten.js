// Wandelt optionale „fehlantworten_es“ eines Wortschatz-Items ({antwort: hinweis}) in das Format von check.js um.

export function fehlantwortenAusItem(item) {
  const fehlantworten = {};
  const fehlertypen = [];
  Object.entries(item.fehlantworten_es ?? {}).forEach(([antwort, hinweis], i) => {
    const id = `${item.id}-fa${i}`;
    fehlantworten[antwort] = id;
    fehlertypen.push({ id, hinweis });
  });
  return { fehlantworten, fehlertypen };
}
