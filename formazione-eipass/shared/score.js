/* Punteggio cumulativo condiviso tra le 5 giornate — salvato in localStorage del browser.
 * Ogni attività salva { score, total } sotto una chiave univoca; non c'è invio dati a server,
 * tutto resta sul dispositivo di chi sta facendo l'esercizio.
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
