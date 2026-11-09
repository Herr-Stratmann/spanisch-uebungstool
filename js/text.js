// Textfunktionen ohne DOM.

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Position eines Teils im Satz – bevorzugt als ganzes Wort (wichtig bei kurzen Lücken wie „y“ oder „en“). */
export function findeTeil(satz, teil) {
  if (!teil) return -1;
  const ganzesWort = new RegExp(`(?<![\\p{L}\\p{N}])${escape(teil)}(?![\\p{L}\\p{N}])`, 'u');
  const m = ganzesWort.exec(satz);
  return m ? m.index : satz.indexOf(teil);
}
