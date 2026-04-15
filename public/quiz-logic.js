/* ═══════════════════════════════════════════════════════════════════
   AI-Learn Explorer  –  quiz-logic.js
   Classification Mini-Game · AI Lesson Engine · Progress Charts
═══════════════════════════════════════════════════════════════════ */
'use strict';

const _API = () => window.location.origin + '/api';
const _tok = () => localStorage.getItem('aile_token') || '';

/* ─── Spam / Ham game data ────────────────────────────────────── */
const GAME_ITEMS = [
  { id:1,  text:'🎉 YOU WON a $1,000 Amazon gift card! Claim NOW',     label:'spam' },
  { id:2,  text:'Project update: Sprint review meeting at 3 pm',       label:'ham'  },
  { id:3,  text:'URGENT: Your bank account has been suspended!',       label:'spam' },
  { id:4,  text:'Lunch tomorrow at the new Thai place?',               label:'ham'  },
  { id:5,  text:'Make $500/day working from HOME – LIMITED TIME ONLY', label:'spam' },
  { id:6,  text:'Please review my pull request on GitHub',             label:'ham'  },
  { id:7,  text:'FREE iPhone 16 – Claim your prize before midnight!!!',label:'spam' },
  { id:8,  text:'Meeting notes + action items from today's standup',   label:'ham'  },
  { id:9,  text:'HOT DEAL: 95% OFF – Buy NOW before offer ends!',     label:'spam' },
  { id:10, text:'Your invoice #2024-089 is attached — please review',  label:'ham'  },
  { id:11, text:'Congratulations! You have been selected for $10,000', label:'spam' },
  { id:12, text:'Can you send the Q3 quarterly report by Friday?',     label:'ham'  },
];

/* ─── State ────────────────────────────────────────────────────── */
let _game  = { items:[], current:0, correct:0, answered:0, results:[], started:false, finished:false };
let _quiz  = { questions:[], current:0, selected:null, score:0, finished:false };
let _chartsDrawn = false;

/* ════════════════════════════════════════════════════════════════
   TAB SYSTEM
════════════════════════════════════════════════════════════════ */
function switchMainTab(tabId) {
  document.querySelectorAll('.main-tab-panel').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.main-tab-btn').forEach(b => {
    b.classList.remove('tab-active');
    b.style.color = '';
  });
  const panel = document.getElementById('panel-' + tabId);
  const btn   = document.getElementById('mtb-' + tabId);
  if (panel) panel.classList.remove('hidden');
  if (btn)   btn.classList.add('tab-active');

  // Lazy-init on first visit
  if (tabId === 'progress' && !_chartsDrawn) initProgressCharts();
  if (tabId === 'game'     && !_game.started) initGame();
}

/* ════════════════════════════════════════════════════════════════
   AI LESSON ENGINE
════════════════════════════════════════════════════════════════ */
async function generateLesson() {
  const topic  = document.getElementById('lesson-topic').value;
  const level  = document.getElementById('lesson-level').value;
  const btn    = document.getElementById('btn-generate');
  const output = document.getElementById('lesson-output');

  btn.disabled = true;
  btn.innerHTML = '<span style="display:inline-block;animation:spin 1s linear infinite">⚙️</span> Generating with Gemini…';
  output.classList.remove('hidden');
  output.innerHTML = `
    <div class="flex flex-col items-center justify-center gap-3 py-16" style="color:var(--clr-muted)">
      <div style="width:48px;height:48px;border:3px solid rgba(108,99,255,0.3);border-top-color:#6C63FF;border-radius:50%;animation:spin 0.8s linear infinite"></div>
      <p class="text-sm">AI is generating your personalised lesson…</p>
    </div>`;

  try {
    const res  = await fetch(`${_API()}/generate-lesson`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'Authorization':'Bearer '+_tok() },
      body: JSON.stringify({ topic, level })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Generation failed');
    _quiz = { questions: data.quiz || [], current:0, selected:null, score:0, finished:false };
    renderLesson(data, topic);
  } catch (err) {
    output.innerHTML = `<div class="text-center py-10 text-red-400">❌ ${err.message}</div>`;
  } finally {
    btn.disabled = false;
    btn.innerHTML = '🤖 Generate Lesson';
  }
}

function renderLesson(lesson, topic) {
  const ytQ   = encodeURIComponent(topic + ' machine learning tutorial explained');
  const ytUrl = `https://www.youtube.com/results?search_query=${ytQ}`;
  const output = document.getElementById('lesson-output');

  output.innerHTML = `
    <!-- Header row -->
    <div class="flex flex-wrap items-center gap-3 mb-5">
      <span class="text-xs font-semibold px-3 py-1 rounded-full"
            style="background:rgba(108,99,255,0.18);color:#A78BFA;border:1px solid rgba(108,99,255,0.35)">
        🤖 Gemini AI
      </span>
      <span class="level-badge level-${lesson.level || 'beginner'}">${cap(lesson.level||'beginner')}</span>
      <h3 class="text-xl font-bold font-display flex-1">${lesson.title || topic}</h3>
    </div>

    <!-- Two-col: concept + use case -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
      <div class="glass p-5 rounded-xl lg:col-span-2">
        <h4 class="font-bold mb-3 text-gradient flex items-center gap-2">📖 Core Concept</h4>
        <div class="text-sm leading-relaxed space-y-2" style="color:var(--clr-text)">
          ${(lesson.concept||'').split('\\n').map(p=>`<p>${p}</p>`).join('')}
        </div>
        ${lesson.keyPoints ? `
        <ul class="mt-4 space-y-1.5">
          ${lesson.keyPoints.map(pt=>`
          <li class="flex items-start gap-2 text-sm">
            <span style="color:var(--clr-accent1);margin-top:2px">▸</span>
            <span style="color:var(--clr-muted)">${pt}</span>
          </li>`).join('')}
        </ul>` : ''}
      </div>

      <div class="glass p-5 rounded-xl flex flex-col gap-3"
           style="background:linear-gradient(135deg,rgba(108,99,255,0.07),rgba(0,212,255,0.04))">
        <h4 class="font-bold text-gradient-warm flex items-center gap-2">🌍 Real-World Use Case</h4>
        <p class="text-sm font-semibold">${lesson.useCase?.title||''}</p>
        <p class="text-xs leading-relaxed" style="color:var(--clr-muted)">${lesson.useCase?.description||''}</p>
        ${lesson.useCase?.example ? `
        <div class="text-xs p-3 rounded-lg mt-auto"
             style="background:rgba(255,255,255,0.05);border:1px solid var(--clr-border);color:var(--clr-muted)">
          💡 ${lesson.useCase.example}
        </div>` : ''}
      </div>
    </div>

    <!-- YouTube Placeholder -->
    <div class="rounded-2xl overflow-hidden mb-5 cursor-pointer group"
         onclick="window.open('${ytUrl}','_blank')"
         style="background:linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#24243e 100%);
                position:relative;min-height:160px;display:flex;align-items:center;justify-content:center;
                border:1px solid rgba(255,255,255,0.08)">
      <div class="flex flex-col items-center gap-3 py-8">
        <div class="w-16 h-16 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
             style="background:rgba(255,0,0,0.9);box-shadow:0 0 36px rgba(255,0,0,0.55)">
          <svg viewBox="0 0 24 24" fill="white" width="28" height="28" style="margin-left:4px"><path d="M8 5v14l11-7z"/></svg>
        </div>
        <p class="text-sm font-semibold text-white">▶ Watch: ${topic} – Full Tutorial</p>
        <p class="text-xs text-white opacity-40">YouTube · Click to open</p>
      </div>
      <div class="absolute top-3 right-3 flex items-center gap-1.5">
        <div class="w-6 h-6 flex items-center justify-center rounded"
             style="background:rgba(255,0,0,0.9)">
          <svg viewBox="0 0 90 20" fill="white" width="36"><path d="M27.9727 3.12324C27.6435 1.89323 26.6768 0.926221 25.4468 0.597075C23.2197 2.7e-06 14.285 0 14.285 0C14.285 0 5.35042 2.7e-06 3.12323 0.597075C1.89323 0.926221 0.926221 1.89323 0.597075 3.12324C2.7e-06 5.35042 0 10 0 10C0 10 2.7e-06 14.6496 0.597075 16.8768C0.926221 18.1068 1.89323 19.0738 3.12323 19.4029C5.35042 20 14.285 20 14.285 20C14.285 20 23.2197 20 25.4468 19.4029C26.6768 19.0738 27.6435 18.1068 27.9727 16.8768C28.5699 14.6496 28.5699 10 28.5699 10C28.5699 10 28.5699 5.35042 27.9727 3.12324ZM11.4253 14.2854V5.71458L18.8477 10.0001L11.4253 14.2854Z"/></svg>
        </div>
        <span class="text-xs text-white font-bold">YouTube</span>
      </div>
    </div>

    <!-- Quiz -->
    ${_quiz.questions.length ? buildQuizHTML() : ''}
  `;
}

function buildQuizHTML() {
  const q = _quiz.questions[0];
  return `
    <div class="glass p-5 rounded-xl" id="quiz-section">
      <div class="flex items-center justify-between mb-4">
        <h4 class="font-bold flex items-center gap-2">🧠 Knowledge Check</h4>
        <span class="text-xs" style="color:var(--clr-muted)">
          Question <span id="q-num">1</span> / ${_quiz.questions.length}
        </span>
      </div>
      <div id="quiz-body">${quizQuestionHTML(q, 0)}</div>
    </div>`;
}

function quizQuestionHTML(q, idx) {
  const labels = ['A','B','C','D'];
  return `
    <p class="text-sm font-semibold mb-4">${idx+1}. ${q.question}</p>
    <div class="space-y-2 mb-4" id="quiz-opts">
      ${q.options.map((opt,i) => `
      <button onclick="selectQuizAnswer(${i})" id="qo-${i}"
              class="w-full text-left px-4 py-3 rounded-xl text-sm transition-all"
              style="background:rgba(255,255,255,0.04);border:1px solid var(--clr-border);color:var(--clr-text);cursor:pointer">
        <span class="font-bold mr-2">${labels[i]}.</span>${opt}
      </button>`).join('')}
    </div>
    <div id="quiz-feedback" class="hidden text-sm p-3 rounded-xl mb-4"></div>
    <div class="flex justify-end">
      <button id="btn-qsubmit" onclick="submitQuizAnswer()" disabled
              class="btn-primary text-sm px-5 py-2.5" style="opacity:0.5">
        ${idx < _quiz.questions.length-1 ? 'Submit & Next →' : 'Finish Quiz 🎉'}
      </button>
    </div>`;
}

function selectQuizAnswer(i) {
  if (_quiz.selected !== null) return; // already answered this question
  _quiz.selected = i;
  document.querySelectorAll('[id^="qo-"]').forEach((b, idx) => {
    b.style.background   = idx===i ? 'rgba(108,99,255,0.25)' : 'rgba(255,255,255,0.04)';
    b.style.borderColor  = idx===i ? 'rgba(108,99,255,0.6)'  : 'var(--clr-border)';
  });
  const submitBtn = document.getElementById('btn-qsubmit');
  if (submitBtn) { submitBtn.disabled = false; submitBtn.style.opacity = '1'; }
}

function submitQuizAnswer() {
  if (_quiz.selected === null) return;
  const q       = _quiz.questions[_quiz.current];
  const correct = q.correct;
  const sel     = _quiz.selected;
  const ok      = sel === correct;
  if (ok) _quiz.score++;

  // Colour options
  document.querySelectorAll('[id^="qo-"]').forEach((b, i) => {
    b.style.pointerEvents = 'none';
    if (i === correct) { b.style.background='rgba(52,211,153,0.2)'; b.style.borderColor='rgba(52,211,153,0.5)'; }
    else if (i === sel && !ok) { b.style.background='rgba(239,68,68,0.2)'; b.style.borderColor='rgba(239,68,68,0.5)'; }
  });

  // Show feedback
  const fb = document.getElementById('quiz-feedback');
  if (fb) {
    fb.classList.remove('hidden');
    fb.style.background  = ok ? 'rgba(52,211,153,0.12)':'rgba(239,68,68,0.12)';
    fb.style.border      = `1px solid ${ok ? 'rgba(52,211,153,0.4)':'rgba(239,68,68,0.4)'}`;
    fb.style.color       = ok ? '#34D399':'#EF4444';
    fb.textContent       = (ok ? '✅ Correct! ':'❌ Incorrect. ') + (q.explanation||'');
  }

  _quiz.current++;
  const btn = document.getElementById('btn-qsubmit');
  if (_quiz.current < _quiz.questions.length) {
    if (btn) { btn.textContent='Next Question →'; btn.onclick=advanceQuiz; }
  } else {
    if (btn) { btn.textContent='See Results 🎉'; btn.onclick=showQuizResults; }
    _quiz.finished = true;
  }
}

function advanceQuiz() {
  _quiz.selected = null;
  const q = _quiz.questions[_quiz.current];
  document.getElementById('q-num').textContent = _quiz.current + 1;
  document.getElementById('quiz-body').innerHTML = quizQuestionHTML(q, _quiz.current);
}

async function showQuizResults() {
  const total= _quiz.questions.length;
  const score= _quiz.score;
  const pct  = Math.round((score/total)*100);
  const xp   = score * 20;
  const emoji= pct>=80?'🏆':pct>=60?'✨':'📚';
  const msg  = pct>=80?'Excellent!':pct>=60?'Good Job!':'Keep Learning!';

  document.getElementById('quiz-section').innerHTML = `
    <div class="text-center py-6">
      <div class="text-5xl mb-3">${emoji}</div>
      <h4 class="text-xl font-bold font-display mb-2">${msg}</h4>
      <p class="text-3xl font-bold text-gradient mb-1">${score} / ${total}</p>
      <p class="text-sm mb-5" style="color:var(--clr-muted)">${pct}% accuracy</p>
      <div class="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-6"
           style="background:rgba(255,215,0,0.12);border:1px solid rgba(255,215,0,0.3);color:#FFD700">
        ⚡ +${xp} XP Earned!
      </div><br>
      <button onclick="generateLesson()" class="btn-glass text-sm">Try Another Lesson</button>
    </div>`;

  // Award XP on server
  try {
    const topic = document.getElementById('lesson-topic').value;
    const r = await fetch(`${_API()}/progress`, {
      method:'PATCH',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+_tok()},
      body:JSON.stringify({ moduleId:'quiz-'+Date.now(), moduleName:topic+' Quiz', completed:score, total })
    });
    if (r.ok) {
      const d   = await r.json();
      const stu = JSON.parse(localStorage.getItem('aile_student')||'{}');
      stu.xp = d.xp;
      localStorage.setItem('aile_student', JSON.stringify(stu));
      const xpEl = document.getElementById('xp-count');
      if (xpEl) xpEl.textContent = d.xp;
    }
  } catch(e) { /* offline */ }
}

/* ════════════════════════════════════════════════════════════════
   CLASSIFICATION MINI-GAME
════════════════════════════════════════════════════════════════ */
function initGame() {
  _game = {
    items: [...GAME_ITEMS].sort(() => Math.random() - 0.5),
    current:0, correct:0, answered:0, results:[], started:true, finished:false
  };
  renderGameCard();
  updateGameStats();
  const ctrl = document.getElementById('game-controls');
  const res  = document.getElementById('game-results-area');
  if (ctrl) ctrl.classList.remove('hidden');
  if (res)  res.classList.add('hidden');
}

function restartGame() { initGame(); }

function renderGameCard() {
  if (_game.current >= _game.items.length) { finishGame(); return; }
  const item  = _game.items[_game.current];
  const textEl= document.getElementById('game-item-text');
  const card  = document.getElementById('game-card');
  if (card)   { card.style.borderColor='var(--clr-border)'; card.style.background='rgba(255,255,255,0.04)'; }
  if (textEl) {
    textEl.style.opacity='0'; textEl.style.transform='translateY(8px)';
    setTimeout(()=>{ textEl.textContent=item.text; textEl.style.opacity='1'; textEl.style.transform='translateY(0)'; textEl.style.transition='all 0.25s'; }, 100);
  }
  const fb = document.getElementById('game-feedback');
  if (fb) fb.classList.add('hidden');
}

function classifyEmail(choice) {
  if (_game.finished || _game.current >= _game.items.length) return;
  const item = _game.items[_game.current];
  const ok   = item.label === choice;
  _game.correct  += ok ? 1 : 0;
  _game.answered++;
  _game.results.push({ item, chosen:choice, correct:ok });
  _game.current++;

  // Feedback flash
  const card = document.getElementById('game-card');
  const fb   = document.getElementById('game-feedback');
  if (card) { card.style.borderColor=ok?'rgba(52,211,153,0.6)':'rgba(239,68,68,0.6)'; card.style.background=ok?'rgba(52,211,153,0.08)':'rgba(239,68,68,0.08)'; }
  if (fb)   { fb.classList.remove('hidden'); fb.textContent=ok?`✅ Correct! That was ${item.label.toUpperCase()}`:`❌ Wrong! That was ${item.label.toUpperCase()}`; fb.style.color=ok?'#34D399':'#EF4444'; }

  updateGameStats();

  if (_game.current >= _game.items.length) {
    setTimeout(finishGame, 700);
  } else {
    setTimeout(renderGameCard, 700);
  }
}

function updateGameStats() {
  const acc     = _game.answered > 0 ? Math.round((_game.correct/_game.answered)*100) : 0;
  const progress= Math.round((_game.current/_game.items.length)*100);
  const el = (id) => document.getElementById(id);
  if (el('game-score'))       el('game-score').textContent       = _game.correct;
  if (el('game-accuracy'))    el('game-accuracy').textContent    = acc + '%';
  if (el('game-remaining'))   el('game-remaining').textContent   = _game.items.length - _game.current;
  if (el('game-progress-bar'))el('game-progress-bar').style.width= progress + '%';
  if (el('game-counter'))     el('game-counter').textContent     = `${_game.current} / ${_game.items.length}`;
}

async function finishGame() {
  _game.finished = true;
  const total = _game.items.length;
  const score = _game.correct;
  const pct   = Math.round((score/total)*100);
  const xp    = score * 15;

  const ctrl = document.getElementById('game-controls');
  const area = document.getElementById('game-results-area');
  if (ctrl) ctrl.classList.add('hidden');
  if (!area) return;

  area.classList.remove('hidden');
  area.innerHTML = `
    <div class="text-center mb-5">
      <div class="text-4xl mb-3">${pct>=80?'🏆':pct>=60?'⭐':'📈'}</div>
      <h4 class="text-xl font-bold font-display mb-1">${pct>=80?'Spam Master!':pct>=60?'Good Eye!':'Keep Practising!'}</h4>
      <p class="text-3xl font-bold text-gradient mb-1">${score} / ${total}</p>
      <p class="text-sm mb-4" style="color:var(--clr-muted)">${pct}% accurate</p>
      <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5"
           style="background:rgba(255,215,0,0.12);border:1px solid rgba(255,215,0,0.3);color:#FFD700">
        ⚡ +${xp} XP Earned
      </div>
    </div>
    <div class="space-y-1.5 max-h-52 overflow-y-auto mb-5">
      ${_game.results.map(r=>`
      <div class="flex items-center gap-3 px-3 py-2 rounded-lg text-xs"
           style="background:${r.correct?'rgba(52,211,153,0.08)':'rgba(239,68,68,0.08)'}">
        <span>${r.correct?'✅':'❌'}</span>
        <span class="flex-1 truncate" style="color:var(--clr-muted)">${r.item.text}</span>
        <span class="font-bold uppercase" style="color:${r.item.label==='spam'?'#EF4444':'#34D399'}">${r.item.label}</span>
      </div>`).join('')}
    </div>
    <button onclick="restartGame()" class="btn-primary w-full text-sm">🔄 Play Again</button>`;

  // Award XP
  try {
    await fetch(`${_API()}/progress`, {
      method:'PATCH',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+_tok()},
      body:JSON.stringify({ moduleId:'spam-game', moduleName:'Spam Classification Game', completed:score, total })
    });
    const stu = JSON.parse(localStorage.getItem('aile_student')||'{}');
    stu.xp    = (stu.xp||0) + xp;
    localStorage.setItem('aile_student', JSON.stringify(stu));
    const xpEl = document.getElementById('xp-count');
    if (xpEl) xpEl.textContent = stu.xp;
  } catch(e) { /* offline */ }
}

/* ════════════════════════════════════════════════════════════════
   PROGRESS CHARTS
════════════════════════════════════════════════════════════════ */
function initProgressCharts() {
  if (_chartsDrawn) return;
  _chartsDrawn = true;
  const stu = JSON.parse(localStorage.getItem('aile_student') || '{}');

  /* XP Line Chart */
  const xpCtx = document.getElementById('xpLineChart');
  if (xpCtx) {
    const xp   = stu.xp || 0;
    const base = Math.max(0, xp - 200);
    const data = [0,1,2,3,4,5,6].map(i => Math.round(base + (xp - base) * (i/6) + (Math.random()-0.5)*15));
    data[6] = xp;
    new Chart(xpCtx, {
      type: 'line',
      data: {
        labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Today'],
        datasets: [{ label:'XP Earned', data, borderColor:'#6C63FF', backgroundColor:'rgba(108,99,255,0.08)',
                     borderWidth:2.5, fill:true, tension:0.4, pointBackgroundColor:'#00D4FF', pointRadius:5, pointHoverRadius:7 }]
      },
      options: { responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{ labels:{ color:'rgba(226,232,240,0.7)',font:{size:11} } },
                  tooltip:{ backgroundColor:'rgba(10,14,26,0.9)',borderColor:'rgba(108,99,255,0.4)',borderWidth:1 } },
        scales:{ x:{ grid:{color:'rgba(255,255,255,0.05)'}, ticks:{color:'rgba(226,232,240,0.6)',font:{size:11}} },
                 y:{ grid:{color:'rgba(255,255,255,0.05)'}, ticks:{color:'rgba(226,232,240,0.6)',font:{size:11}},beginAtZero:true } }
      }
    });
  }

  /* Module Donut */
  const doCtx = document.getElementById('moduleDonutChart');
  if (doCtx) {
    const prog  = stu.progress || [];
    const done  = prog.reduce((a,p)=>a+p.completed,0);
    const total = Math.max(prog.reduce((a,p)=>a+p.total,0), 42);
    new Chart(doCtx, {
      type:'doughnut',
      data:{ labels:['Completed','Remaining'],
             datasets:[{ data:[done, Math.max(0,total-done)],
                         backgroundColor:['rgba(108,99,255,0.85)','rgba(255,255,255,0.05)'],
                         borderColor:['#6C63FF','rgba(255,255,255,0.08)'], borderWidth:2 }] },
      options:{ responsive:true, maintainAspectRatio:false, cutout:'72%',
        plugins:{ legend:{ labels:{color:'rgba(226,232,240,0.7)',font:{size:11}} },
                  tooltip:{ backgroundColor:'rgba(10,14,26,0.9)',borderColor:'rgba(108,99,255,0.4)',borderWidth:1 } } }
    });
  }

  /* Streak Calendar */
  const calEl = document.getElementById('streak-calendar');
  if (calEl) {
    const today = new Date();
    const streak= stu.streak || 0;
    const cells = Array.from({length:28},(_,i)=>{
      const d    = new Date(today); d.setDate(d.getDate()-(27-i));
      const active = i >= (28-streak) || Math.random()>0.4;
      return `<div title="${d.toLocaleDateString('en-US',{month:'short',day:'numeric'})}"
                   style="width:22px;height:22px;border-radius:4px;cursor:default;
                          background:${active?'rgba(108,99,255,0.55)':'rgba(255,255,255,0.05)'};
                          border:1px solid ${active?'rgba(108,99,255,0.4)':'rgba(255,255,255,0.06)'}"></div>`;
    }).join('');
    calEl.innerHTML=`<div style="display:flex;flex-wrap:wrap;gap:4px">${cells}</div>
      <div style="display:flex;align-items:center;gap:12px;margin-top:10px;font-size:11px;color:var(--clr-muted)">
        <div style="display:flex;align-items:center;gap:6px"><div style="width:12px;height:12px;border-radius:3px;background:rgba(108,99,255,0.55)"></div>Active</div>
        <div style="display:flex;align-items:center;gap:6px"><div style="width:12px;height:12px;border-radius:3px;background:rgba(255,255,255,0.05)"></div>Inactive</div>
      </div>`;
  }
}

/* ─── Helper ──────────────────────────────────────────────────── */
function cap(s) { return s ? s.charAt(0).toUpperCase()+s.slice(1) : ''; }

/* ─── Expose globals (used in onclick attrs) ─────────────────── */
window.switchMainTab   = switchMainTab;
window.generateLesson  = generateLesson;
window.selectQuizAnswer= selectQuizAnswer;
window.submitQuizAnswer= submitQuizAnswer;
window.advanceQuiz     = advanceQuiz;
window.showQuizResults = showQuizResults;
window.classifyEmail   = classifyEmail;
window.restartGame     = restartGame;
window.initGame        = initGame;
