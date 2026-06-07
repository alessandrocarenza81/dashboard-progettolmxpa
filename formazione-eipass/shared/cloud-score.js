/* Invio punteggi al pannello del docente — Formazione EIPASS
 * Oltre al salvataggio locale (vedi score.js, che resta invariato e continua
 * a funzionare anche offline), ogni risultato viene inviato a un piccolo
 * database condiviso (Supabase) così il docente può vedere in tempo reale
 * come procedono gli allievi durante ogni giornata.
 *
 * Per partecipare basta inserire il proprio nome una sola volta: viene
 * ricordato nel browser e riusato per tutte le 5 giornate.
 */
const CloudScore = (function () {
  const SUPABASE_URL = 'https://qtoodhayndvrspmatnoj.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_6N1all4BrOrwc-rmDEnalA_YjQYBc5G';
  const NAME_KEY = 'eipass-student-name';

  function getName() {
    try { return (localStorage.getItem(NAME_KEY) || '').trim(); }
    catch (e) { return ''; }
  }

  function setName(name) {
    try { localStorage.setItem(NAME_KEY, name.trim()); }
    catch (e) {}
  }

  function dayFromActivityKey(activityKey) {
    const m = /^g(\d)/.exec(activityKey || '');
    return m ? ('Giorno ' + m[1]) : 'Altro';
  }

  // Invio "fire and forget": se manca il nome o la connessione, non blocca
  // né disturba l'esperienza dell'allievo — il punteggio resta comunque
  // salvato in locale.
  function submit(activityKey, score, total) {
    const name = getName();
    if (!name) return;
    try {
      fetch(SUPABASE_URL + '/rest/v1/eipass_scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          student_name: name,
          day_key: dayFromActivityKey(activityKey),
          activity_key: activityKey,
          score: score,
          total: total
        })
      }).catch(function () {});
    } catch (e) {}
  }

  async function fetchAll() {
    const res = await fetch(
      SUPABASE_URL + '/rest/v1/eipass_scores?select=*&order=created_at.desc&limit=2000',
      { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY } }
    );
    if (!res.ok) throw new Error('Richiesta fallita (' + res.status + ')');
    return res.json();
  }

  // Mostra una piccola barra "chi sei?" dentro il contenitore indicato.
  // Se il nome è già noto, mostra solo un saluto con possibilità di cambiarlo.
  function mountNameBar(container) {
    render();

    function render() {
      const name = getName();
      if (name) {
        container.innerHTML =
          '<span class="name-greeting">👋 Ciao, <strong>' + escapeHtml(name) + '</strong> — i tuoi punteggi sono visibili al docente.</span>' +
          '<button type="button" class="name-edit-btn" id="cs-edit-name">cambia nome</button>';
        container.querySelector('#cs-edit-name').onclick = function () { renderForm(name); };
      } else {
        renderForm('');
      }
    }

    function renderForm(current) {
      container.innerHTML =
        '<form id="cs-name-form" class="name-form">' +
        '  <label for="cs-name-input">Come ti chiami? <span class="muted">(serve al docente per vedere i tuoi progressi)</span></label>' +
        '  <div class="name-form-row">' +
        '    <input type="text" id="cs-name-input" maxlength="60" placeholder="Es. Maria Rossi" autocomplete="name" value="' + escapeHtml(current) + '">' +
        '    <button type="submit" class="btn btn-primary btn-sm">Salva</button>' +
        '  </div>' +
        '</form>';
      const form = container.querySelector('#cs-name-form');
      const input = container.querySelector('#cs-name-input');
      form.onsubmit = function (ev) {
        ev.preventDefault();
        const v = input.value.trim();
        if (!v) { input.focus(); return; }
        setName(v);
        render();
      };
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  return { getName, setName, submit, fetchAll, mountNameBar };
})();
