/* Motore di Abbinamento riutilizzabile — Formazione EIPASS
 * Interazione "tocca e abbina" (funziona bene anche su tablet/touch, niente drag&drop nativo)
 * Uso:
 *   MatchingEngine.mount(elementoContenitore, {
 *     storageKey: 'g1-match-hardware',
 *     leftTitle: 'Componente',
 *     rightTitle: 'Funzione',
 *     pairs: [
 *       { left: 'RAM', right: 'Memoria temporanea di lavoro del computer' },
 *       ...
 *     ]
 *   });
 */
const MatchingEngine = (function () {

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function mount(container, config) {
    const pairs = config.pairs;
    const leftItems = pairs.map((p, i) => ({ id: i, text: p.left }));
    const rightItems = shuffle(pairs.map((p, i) => ({ id: i, text: p.right })));
    const leftOrder = shuffle(leftItems);

    let selectedLeft = null;
    let selectedRight = null;
    let matchedCount = 0;
    let attempts = 0;
    const total = pairs.length;

    container.innerHTML = `
      <div class="progress-line">
        <span>Abbinamenti corretti: <span id="me-count">0</span> / ${total}</span>
        <span>Tentativi: <span id="me-attempts">0</span></span>
      </div>
      <div class="match-grid" style="margin-top:14px">
        <div>
          <div class="match-col-title">${config.leftTitle || 'Elemento'}</div>
          <div id="me-left"></div>
        </div>
        <div>
          <div class="match-col-title">${config.rightTitle || 'Corrispondenza'}</div>
          <div id="me-right"></div>
        </div>
      </div>
      <div class="feedback-box" id="me-feedback"></div>
    `;

    const leftCol = container.querySelector('#me-left');
    const rightCol = container.querySelector('#me-right');

    leftOrder.forEach(item => {
      const b = document.createElement('button');
      b.className = 'match-item';
      b.textContent = item.text;
      b.dataset.id = item.id;
      b.dataset.side = 'left';
      b.onclick = () => pick(b, 'left', item.id);
      leftCol.appendChild(b);
    });
    rightItems.forEach(item => {
      const b = document.createElement('button');
      b.className = 'match-item';
      b.textContent = item.text;
      b.dataset.id = item.id;
      b.dataset.side = 'right';
      b.onclick = () => pick(b, 'right', item.id);
      rightCol.appendChild(b);
    });

    function pick(btn, side, id) {
      if (btn.classList.contains('matched')) return;
      if (side === 'left') {
        if (selectedLeft) selectedLeft.el.classList.remove('selected');
        selectedLeft = { el: btn, id };
        btn.classList.add('selected');
      } else {
        if (selectedRight) selectedRight.el.classList.remove('selected');
        selectedRight = { el: btn, id };
        btn.classList.add('selected');
      }
      if (selectedLeft && selectedRight) checkMatch();
    }

    function checkMatch() {
      attempts++;
      container.querySelector('#me-attempts').textContent = attempts;
      const fb = container.querySelector('#me-feedback');

      if (selectedLeft.id === selectedRight.id) {
        selectedLeft.el.classList.remove('selected');
        selectedRight.el.classList.remove('selected');
        selectedLeft.el.classList.add('matched');
        selectedRight.el.classList.add('matched');
        matchedCount++;
        container.querySelector('#me-count').textContent = matchedCount;
        fb.className = 'feedback-box show ok';
        fb.innerHTML = `✅ <strong>Abbinamento corretto!</strong> "${selectedLeft.el.textContent}" ↔ "${selectedRight.el.textContent}"`;
        selectedLeft = null; selectedRight = null;

        if (matchedCount === total) finish(fb);
      } else {
        fb.className = 'feedback-box show ko';
        fb.innerHTML = `❌ <strong>Non corrispondono.</strong> Riprova con un'altra coppia.`;
        const l = selectedLeft.el, r = selectedRight.el;
        l.classList.add('shake'); r.classList.add('shake');
        setTimeout(() => {
          l.classList.remove('selected', 'shake');
          r.classList.remove('selected', 'shake');
        }, 420);
        selectedLeft = null; selectedRight = null;
      }
    }

    function finish(fb) {
      const accuracy = Math.round((total / attempts) * 100);
      EipassScore.save(config.storageKey, total, total);
      setTimeout(() => {
        let msg;
        if (attempts === total) msg = '🏆 Perfetto: tutti gli abbinamenti azzeccati al primo colpo!';
        else if (accuracy >= 70) msg = '👏 Molto bene, pochi tentativi a vuoto.';
        else msg = '🙂 Completato! Con un altro giro la precisione salirà ancora.';

        const resultBox = document.createElement('div');
        resultBox.className = 'result-box';
        resultBox.innerHTML = `
            <div class="result-score">${total}/${total}</div>
            <p class="result-msg">${msg}<br><span class="muted">Tentativi totali: ${attempts} · Precisione: ${accuracy}%</span></p>
            <button class="btn btn-secondary" id="me-retry" style="margin-top:10px">↻ Rifai l'esercizio</button>`;
        container.appendChild(resultBox);
        resultBox.querySelector('#me-retry').onclick = () => mount(container, config);
        if (typeof config.onComplete === 'function') config.onComplete(total, total);
      }, 500);
    }
  }

  return { mount };
})();
