/* Punteggio cumulativo condiviso tra le 5 giornate — salvato in localStorage del browser.
 * Ogni attività salva { score, total } sotto una chiave univoca, così il riepilogo
 * personale (in alto e nella pagina principale) funziona sempre, anche offline.
 * Se l'allievo ha inserito il proprio nome, lo stesso risultato viene anche
 * inoltrato al pannello del docente (vedi cloud-score.js).
 */
const EipassScore = (function () {
  const KEY = 'eipass-formazione-progressi-v1';

  function getAll() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
    catch (e) { return {}; }
  }

  function save(activityKey, score, total) {
    const data = getAll();
    const prev = data[activityKey];
    // conserva il miglior risultato ottenuto per quella attività
    if (!prev || score > prev.score) data[activityKey] = { score, total, date: new Date().toISOString() };
    localStorage.setItem(KEY, JSON.stringify(data));
    // se disponibile, inoltra il risultato al pannello del docente (vedi cloud-score.js)
    if (typeof CloudScore !== 'undefined') CloudScore.submit(activityKey, score, total);
  }

  function totals() {
    const data = getAll();
    let score = 0, total = 0, done = 0;
    Object.values(data).forEach(v => { score += v.score; total += v.total; done++; });
    return { score, total, done };
  }

  function reset() {
    localStorage.removeItem(KEY);
  }

  return { save, getAll, totals, reset };
})();
