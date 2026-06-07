/* Motore Quiz riutilizzabile — Formazione EIPASS
 * Uso:
 *   QuizEngine.mount(elementoContenitore, {
 *     storageKey: 'g1-quiz-hardware',   // chiave univoca per salvare il punteggio
 *     timePerQuestion: 25,              // secondi per domanda (0 = nessun timer)
 *     questions: [
 *       {
 *         scenario: '<div class="scenario">...</div>',  // opzionale, HTML libero
 *         question: 'Testo della domanda',
 *         options: ['Opzione A', 'Opzione B', 'Opzione C'],
 *         correct: 0,                    // indice della risposta corretta
 *         explanation: 'Perché è corretta...'
 *       }, ...
 *     ]
 *   });
 */
const QuizEngine = (function () {

  function mount(container, config) {
    const state = {
      index: 0,
      score: 0,
      answered: false,
      timer: null,
      timeLeft: config.timePerQuestion || 0,
    };

    render();

    function render() {
      if (state.index >= config.questions.length) {
        renderResult();
        return;
      }
      const q = config.questions[state.index];
      state.answered = false;
      state.timeLeft = config.timePerQuestion || 0;

      container.innerHTML = `
        <div class="progress-line">
          <span>Domanda ${state.index + 1} di ${config.questions.length}</span>
          <span>Punteggio: ${state.score}</span>
        </div>
        ${config.timePerQuestion ? '<div class="timer-bar-track"><div class="timer-bar-fill" id="qe-timer"></div></div>' : '<div style="height:14px"></div>'}
        ${q.scenario || ''}
        <h3>${q.question}</h3>
        <div class="opt-list" id="qe-options"></div>
        <div class="feedback-box" id="qe-feedback"></div>
      `;

      const optList = container.querySelector('#qe-options');
      q.options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = 'opt-btn';
        btn.textContent = opt;
        btn.onclick = () => selectAnswer(i);
        optList.appendChild(btn);
      });

      if (config.timePerQuestion) startTimer();
    }

    function startTimer() {
      const fill = container.querySelector('#qe-timer');
      const total = config.timePerQuestion;
      clearInterval(state.timer);
      state.timer = setInterval(() => {
        state.timeLeft -= 0.1;
        const pct = Math.max(0, (state.timeLeft / total) * 100);
        if (fill) {
          fill.style.width = pct + '%';
          fill.classList.toggle('warn', pct <= 50 && pct > 20);
          fill.classList.toggle('danger', pct <= 20);
        }
        if (state.timeLeft <= 0) {
          clearInterval(state.timer);
          if (!state.answered) selectAnswer(-1); // tempo scaduto = nessuna risposta
        }
      }, 100);
    }

    function selectAnswer(choiceIndex) {
      if (state.answered) return;
      state.answered = true;
      clearInterval(state.timer);

      const q = config.questions[state.index];
      const buttons = container.querySelectorAll('.opt-btn');
      const correct = choiceIndex === q.correct;
      if (correct) state.score++;

      buttons.forEach((b, i) => {
        b.disabled = true;
        if (i === q.correct) b.classList.add('correct');
        else if (i === choiceIndex) b.classList.add('wrong');
      });

      const fb = container.querySelector('#qe-feedback');
      fb.classList.add('show', correct ? 'ok' : 'ko');
      if (choiceIndex === -1) {
        fb.innerHTML = `⏱️ <strong>Tempo scaduto!</strong> La risposta corretta era: <em>${q.options[q.correct]}</em>. ${q.explanation || ''}`;
      } else {
        fb.innerHTML = correct
          ? `✅ <strong>Esatto!</strong> ${q.explanation || ''}`
          : `❌ <strong>Non proprio.</strong> La risposta corretta era: <em>${q.options[q.correct]}</em>. ${q.explanation || ''}`;
      }

      const nextBtn = document.createElement('button');
      nextBtn.className = 'btn btn-primary';
      nextBtn.style.marginTop = '16px';
      nextBtn.textContent = (state.index + 1 < config.questions.length) ? 'Prossima domanda →' : 'Vedi il risultato →';
      nextBtn.onclick = () => { state.index++; render(); };
      container.appendChild(nextBtn);
    }

    function renderResult() {
      const total = config.questions.length;
      const pct = Math.round((state.score / total) * 100);
      let msg;
      if (pct === 100) msg = '🏆 Perfetto! Hai risposto correttamente a tutte le domande.';
      else if (pct >= 70) msg = '👏 Ottimo lavoro! Hai una buona padronanza dell\'argomento.';
      else if (pct >= 40) msg = '🙂 Bene, ma vale la pena ripassare qualche punto.';
      else msg = '📘 Ripassiamo insieme questi concetti: con un po\' di pratica miglioreranno in fretta.';

      EipassScore.save(config.storageKey, state.score, total);

      container.innerHTML = `
        <div class="result-box">
          <div class="result-score">${state.score} / ${total}</div>
          <p class="result-msg">${msg}</p>
          <button class="btn btn-secondary" id="qe-retry" style="margin-top:14px">↻ Riprova il quiz</button>
        </div>
      `;
      container.querySelector('#qe-retry').onclick = () => {
        state.index = 0; state.score = 0; render();
      };
      if (typeof config.onComplete === 'function') config.onComplete(state.score, total);
    }
  }

  return { mount };
})();
