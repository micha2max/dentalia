// Generic interactive quiz engine — renders every `.quiz-mount` from its quiz
// definition in src/data/quizzes.js. Reuses the .quiz* design system (same as
// the home Zahngesundheits-Test). Modes: knowledge (score = correct answers),
// assessment (score = summed option weights), poll (no score).
import { quizzes } from '../data/quizzes.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function initQuiz(root, def) {
  const Q = def.questions;
  let idx = 0;
  let ans = new Array(Q.length).fill(null);
  root.classList.add('quiz-wrap');
  const el = document.createElement('div');
  el.className = 'quiz';
  root.appendChild(el);

  function render() {
    const q = Q[idx];
    const pct = Math.round((idx / Q.length) * 100);
    const opts = q.options
      .map((o, i) => `<button type="button" class="quiz-opt${ans[idx] === i ? ' sel' : ''}" data-i="${i}"><span class="rd"></span>${esc(o)}</button>`)
      .join('');
    el.innerHTML =
      `<div class="quiz-top"><p class="quiz-h">${esc(def.title)}</p><p>${esc(def.intro || '')}</p></div>` +
      `<div class="quiz-bar"><i style="width:${pct}%"></i></div>` +
      `<div class="quiz-body"><div class="quiz-step">Frage ${idx + 1} von ${Q.length}</div>` +
      `<div class="quiz-q">${esc(q.q)}</div><div class="quiz-options">${opts}</div>` +
      `<div class="quiz-nav"><button type="button" class="btn btn-ghost" data-prev${idx === 0 ? ' style="visibility:hidden"' : ''}>Zurück</button>` +
      `<button type="button" class="btn btn-primary" data-next${ans[idx] === null ? ' disabled style="opacity:.5;cursor:not-allowed"' : ''}>${idx === Q.length - 1 ? 'Ergebnis' : 'Weiter'}</button></div></div>`;
    el.querySelectorAll('.quiz-opt').forEach((b) =>
      b.addEventListener('click', () => { ans[idx] = +b.dataset.i; render(); })
    );
    const pv = el.querySelector('[data-prev]');
    if (pv) pv.addEventListener('click', () => { if (idx > 0) { idx--; render(); } });
    const nx = el.querySelector('[data-next]');
    if (nx) nx.addEventListener('click', () => { if (ans[idx] === null) return; if (idx < Q.length - 1) { idx++; render(); } else result(); });
  }

  function pickTier(score) {
    const tiers = [...(def.results || [])].sort((a, b) => b.min - a.min);
    return tiers.find((t) => score >= t.min) || tiers[tiers.length - 1] || { t: '', p: '' };
  }

  function result() {
    let head = '';
    let r;
    if (def.mode === 'knowledge') {
      const total = Q.filter((q) => q.correct != null).length;
      let correct = 0;
      Q.forEach((q, i) => { if (q.correct != null && ans[i] === q.correct) correct++; });
      r = pickTier(correct);
      head = `<div class="quiz-score">${correct} / ${total} richtig</div>`;
    } else if (def.mode === 'assessment') {
      let sum = 0;
      Q.forEach((q, i) => { sum += (q.scores && q.scores[ans[i]]) || 0; });
      r = pickTier(sum);
    } else {
      r = def.final || { t: 'Danke!', p: '' };
    }
    const cta = def.cta ? `<a class="btn btn-primary" href="${def.cta.href}">${esc(def.cta.label)}</a>` : '';
    el.innerHTML =
      `<div class="quiz-result">${head}<h3>${esc(r.t)}</h3><p>${esc(r.p)}</p>` +
      `<div class="cta-row" style="justify-content:center">${cta}<button type="button" class="btn btn-ghost" data-reset>Test wiederholen</button></div></div>`;
    const rs = el.querySelector('[data-reset]');
    if (rs) rs.addEventListener('click', () => { idx = 0; ans = new Array(Q.length).fill(null); render(); });
  }

  render();
}

document.querySelectorAll('.quiz-mount').forEach((m) => {
  const def = quizzes[m.dataset.quiz];
  if (def) initQuiz(m, def);
});
