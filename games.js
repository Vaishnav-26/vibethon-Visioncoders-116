// ═══════════════════════════════════════════════
//  NeuralTask — Games Logic (games.js)
// ═══════════════════════════════════════════════

// ══════════════════════════════
//  GAME 1: ML QUIZ ARENA
// ══════════════════════════════
const quizQuestions = [
  { q: "What does 'ML' stand for in AI/ML?", opts: ["Machine Logic","Machine Learning","Model Layer","Meta Learning"], ans: 1 },
  { q: "Which algorithm is used to find the minimum of a loss function?", opts: ["Random Forest","Gradient Descent","K-Means","Naive Bayes"], ans: 1 },
  { q: "What is overfitting in machine learning?", opts: ["Model learns too little","Model performs well on test data","Model memorizes training data","Model has too few parameters"], ans: 2 },
  { q: "Which activation function is most commonly used in hidden layers of deep networks?", opts: ["Sigmoid","Tanh","ReLU","Softmax"], ans: 2 },
  { q: "What does CNN stand for?", opts: ["Connected Neural Network","Convolutional Neural Network","Cyclic Neural Network","Cascaded Neural Network"], ans: 1 },
  { q: "What is the purpose of dropout in neural networks?", opts: ["Speed up training","Reduce overfitting","Increase model size","Add more layers"], ans: 1 },
  { q: "Which loss function is used for binary classification?", opts: ["MSE","MAE","Binary Cross-Entropy","Hinge Loss"], ans: 2 },
  { q: "What is a hyperparameter?", opts: ["A parameter learned during training","A parameter set before training","A type of neural layer","An activation function"], ans: 1 },
  { q: "What does 'epoch' mean in ML training?", opts: ["One sample processed","One full pass through dataset","One batch processed","One weight update"], ans: 1 },
  { q: "Which is NOT a type of machine learning?", opts: ["Supervised","Unsupervised","Reinforcement","Instructed"], ans: 3 },
  { q: "What is the purpose of the softmax function?", opts: ["Binary classification","Regression","Multi-class probability output","Image processing"], ans: 2 },
  { q: "What is a confusion matrix used for?", opts: ["Visualizing training loss","Evaluating classification performance","Selecting hyperparameters","Data preprocessing"], ans: 1 },
  { q: "What does LSTM stand for?", opts: ["Long Short-Term Memory","Large Scale Training Model","Linear Sequential Training Machine","Layer Stacked Training Module"], ans: 0 },
  { q: "Which metric is best for imbalanced classification?", opts: ["Accuracy","F1-Score","MSE","R²"], ans: 1 },
  { q: "What is transfer learning?", opts: ["Moving models between devices","Using pretrained models for new tasks","Transferring data between datasets","Copying neural network weights"], ans: 1 },
  { q: "What is the 'attention mechanism' in transformers?", opts: ["Focusing on important parts of the input","A regularization technique","A type of activation function","A data preprocessing step"], ans: 0 },
  { q: "Which algorithm is based on decision boundaries called 'support vectors'?", opts: ["KNN","Random Forest","SVM","Naive Bayes"], ans: 2 },
  { q: "What is PCA used for?", opts: ["Classification","Clustering","Dimensionality reduction","Reinforcement"], ans: 2 },
  { q: "What is the 'vanishing gradient problem'?", opts: ["Gradients become too large","Gradients shrink and prevent learning in early layers","Loss becomes zero","The model diverges"], ans: 1 },
  { q: "What is 'batch normalization' used for?", opts: ["Reduce training data size","Normalize layer inputs to speed up and stabilize training","Prevent overfitting only","Select batch size"], ans: 1 },
  { q: "Which model architecture is 'BERT' based on?", opts: ["RNN","CNN","Transformer encoder","GAN"], ans: 2 },
  { q: "What is a GAN?", opts: ["Gradient Accumulation Network","Generative Adversarial Network","General Attention Node","Global Averaging Network"], ans: 1 },
  { q: "In K-Means clustering, what does K represent?", opts: ["Kernel size","Number of clusters","Learning rate","Number of iterations"], ans: 1 },
  { q: "What is 'early stopping' in ML training?", opts: ["Stop training before 100 epochs","Stop when validation loss stops improving","Stop when accuracy reaches 100%","Reduce learning rate early"], ans: 1 },
  { q: "What is the difference between precision and recall?", opts: ["Both measure accuracy","Precision measures exactness, recall measures completeness","Recall measures exactness, precision measures completeness","They are the same"], ans: 1 },
  { q: "What is 'word embedding'?", opts: ["Encoding words as one-hot vectors","Dense vector representation of words","Counting word frequencies","Removing stop words"], ans: 1 },
  { q: "Which optimizer uses adaptive learning rates for each parameter?", opts: ["SGD","BGD","Adam","Momentum"], ans: 2 },
  { q: "What is 'backpropagation'?", opts: ["Forward pass through network","Algorithm to calculate gradients by chain rule","Randomly updating weights","Checking test accuracy"], ans: 1 },
  { q: "What does R² (R-squared) measure?", opts: ["Classification accuracy","Proportion of variance explained by the model","Training speed","Model size"], ans: 1 },
  { q: "What is 'feature scaling' and why is it important?", opts: ["Adding more features","Normalizing features so gradient descent converges faster","Selecting important features","Removing outliers"], ans: 1 },
];

let quizState = { questions: [], current: 0, score: 0, answered: false, timer: null, timeLeft: 20, totalAnswered: 0, correct: 0 };

function openQuizGame() {
  document.getElementById('quiz-modal').classList.add('open');
  document.getElementById('backdrop').classList.add('open');
  startQuiz();
}

function startQuiz() {
  const shuffled = [...quizQuestions].sort(() => Math.random() - 0.5).slice(0, 10);
  quizState = { questions: shuffled, current: 0, score: 0, answered: false, timer: null, timeLeft: 20, totalAnswered: 0, correct: 0 };
  renderQuiz();
}

function renderQuiz() {
  const body = document.getElementById('quiz-body');
  if (!body) return;

  if (quizState.current >= quizState.questions.length) {
    // Game over
    const pct = Math.round((quizState.correct / quizState.questions.length) * 100);
    const hs = Math.max(quizState.score, parseInt(localStorage.getItem('nt_quiz_hs') || 0));
    localStorage.setItem('nt_quiz_hs', hs);
    // Award XP
    if (typeof appState !== 'undefined') {
      appState.xp += quizState.score;
      if (typeof saveState === 'function') saveState();
    }
    body.innerHTML = `
      <div style="text-align:center;padding:20px;">
        <div style="font-size:72px;margin-bottom:16px;">${pct>=80?'🏆':pct>=60?'😊':'😅'}</div>
        <h2 style="font-size:26px;font-weight:800;margin-bottom:8px;">Quiz Complete!</h2>
        <p style="color:var(--text-secondary);margin-bottom:24px;">You answered ${quizState.correct}/${quizState.questions.length} correctly</p>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:28px;">
          <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:16px;">
            <div style="font-size:28px;font-weight:800;color:var(--cyan)">${quizState.score}</div>
            <div style="font-size:12px;color:var(--text-muted)">Score</div>
          </div>
          <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:16px;">
            <div style="font-size:28px;font-weight:800;color:${pct>=80?'var(--green)':pct>=60?'var(--orange)':'var(--red)'}">${pct}%</div>
            <div style="font-size:12px;color:var(--text-muted)">Accuracy</div>
          </div>
          <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:16px;">
            <div style="font-size:28px;font-weight:800;color:var(--orange)">${hs}</div>
            <div style="font-size:12px;color:var(--text-muted)">High Score</div>
          </div>
        </div>
        <div style="background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.2);border-radius:10px;padding:12px;margin-bottom:20px;color:var(--cyan);font-size:14px;font-weight:600;">
          🎉 +${quizState.score} XP earned!
        </div>
        <div style="display:flex;gap:10px;justify-content:center;">
          <button class="btn btn-primary" onclick="startQuiz()">🔄 Play Again</button>
          <button class="btn btn-outline" onclick="closeGame()">Close</button>
        </div>
      </div>`;
    return;
  }

  const q = quizState.questions[quizState.current];
  clearInterval(quizState.timer);
  quizState.timeLeft = 20;
  quizState.answered = false;

  body.innerHTML = `
    <div class="quiz-score">
      <div class="quiz-score-item"><div class="quiz-score-value">${quizState.score}</div><div class="quiz-score-label">Score</div></div>
      <div class="quiz-score-item"><div class="quiz-score-value">${quizState.current + 1}/${quizState.questions.length}</div><div class="quiz-score-label">Question</div></div>
      <div class="quiz-score-item"><div class="quiz-score-value" id="quiz-time">${quizState.timeLeft}</div><div class="quiz-score-label">Seconds</div></div>
      <div class="quiz-score-item"><div class="quiz-score-value">${quizState.correct}</div><div class="quiz-score-label">Correct</div></div>
    </div>
    <div class="quiz-timer"><div class="quiz-timer-fill" id="quiz-timer-fill" style="width:100%"></div></div>
    <div class="quiz-question">${quizState.current + 1}. ${q.q}</div>
    <div class="quiz-options" id="quiz-opts">
      ${q.opts.map((opt, i) => `
        <button class="quiz-option" onclick="answerQuiz(${i})" id="qopt-${i}">${String.fromCharCode(65+i)}. ${opt}</button>
      `).join('')}
    </div>
  `;

  // Start timer
  quizState.timer = setInterval(() => {
    quizState.timeLeft--;
    const timeEl = document.getElementById('quiz-time');
    const fillEl = document.getElementById('quiz-timer-fill');
    if (timeEl) timeEl.textContent = quizState.timeLeft;
    if (fillEl) fillEl.style.width = `${(quizState.timeLeft / 20) * 100}%`;
    if (fillEl && quizState.timeLeft <= 5) fillEl.style.background = 'var(--red)';
    if (quizState.timeLeft <= 0) {
      clearInterval(quizState.timer);
      if (!quizState.answered) timeoutQuiz();
    }
  }, 1000);
}

function answerQuiz(idx) {
  if (quizState.answered) return;
  quizState.answered = true;
  clearInterval(quizState.timer);
  const q = quizState.questions[quizState.current];
  const opts = document.querySelectorAll('.quiz-option');
  opts.forEach(o => o.classList.add('disabled'));

  if (idx === q.ans) {
    opts[idx].classList.add('correct');
    const timeBonus = Math.floor(quizState.timeLeft * 2);
    quizState.score += 10 + timeBonus;
    quizState.correct++;
    if (typeof showToast === 'function') showToast('success', '✅ Correct!', `+${10 + timeBonus} points (time bonus: +${timeBonus})`);
  } else {
    opts[idx].classList.add('wrong');
    opts[q.ans].classList.add('correct');
    if (typeof showToast === 'function') showToast('error', '❌ Wrong!', `Correct answer: ${String.fromCharCode(65+q.ans)}. ${q.opts[q.ans]}`);
  }

  setTimeout(() => {
    quizState.current++;
    renderQuiz();
  }, 1800);
}

function timeoutQuiz() {
  if (quizState.answered) return;
  quizState.answered = true;
  const q = quizState.questions[quizState.current];
  const opts = document.querySelectorAll('.quiz-option');
  opts.forEach(o => o.classList.add('disabled'));
  if (opts[q.ans]) opts[q.ans].classList.add('correct');
  if (typeof showToast === 'function') showToast('error', '⏰ Time\'s up!', `Correct: ${q.opts[q.ans]}`);
  setTimeout(() => { quizState.current++; renderQuiz(); }, 1800);
}

// ══════════════════════════════
//  GAME 2: NEURAL NETWORK BUILDER
// ══════════════════════════════
let nnLayers = [
  { type: 'Input', neurons: 3, activation: 'none' },
  { type: 'Hidden', neurons: 4, activation: 'ReLU' },
  { type: 'Output', neurons: 2, activation: 'Softmax' }
];

function openNNBuilder() {
  document.getElementById('nn-modal').classList.add('open');
  document.getElementById('backdrop').classList.add('open');
  renderNNBuilder();
}

function renderNNBuilder() {
  const body = document.getElementById('nn-body');
  if (!body) return;

  const params = nnLayers.reduce((acc, l) => acc + l.neurons, 0);
  const accuracy = Math.min(95, 50 + nnLayers.filter(l => l.type === 'Hidden').length * 8 + nnLayers.reduce((a, l) => a + l.neurons, 0) * 0.5).toFixed(1);

  body.innerHTML = `
    <div style="margin-bottom:16px;display:flex;gap:16px;flex-wrap:wrap;">
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:12px 20px;text-align:center;">
        <div style="font-size:20px;font-weight:800;color:var(--cyan)">${nnLayers.length}</div>
        <div style="font-size:11px;color:var(--text-muted)">Total Layers</div>
      </div>
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:12px 20px;text-align:center;">
        <div style="font-size:20px;font-weight:800;color:var(--purple)">${params}</div>
        <div style="font-size:11px;color:var(--text-muted)">Neurons</div>
      </div>
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:12px 20px;text-align:center;">
        <div style="font-size:20px;font-weight:800;color:var(--green)">${accuracy}%</div>
        <div style="font-size:11px;color:var(--text-muted)">Est. Accuracy</div>
      </div>
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:12px 20px;text-align:center;">
        <div style="font-size:20px;font-weight:800;color:var(--orange)">${nnLayers.filter(l=>l.type==='Hidden').length}</div>
        <div style="font-size:11px;color:var(--text-muted)">Hidden Layers</div>
      </div>
    </div>

    <div class="nn-builder" id="nn-visual">
      ${nnLayers.map((layer, i) => `
        <div class="nn-layer">
          <div class="nn-neuron-group">
            ${Array.from({length: Math.min(layer.neurons, 6)}, (_, j) => `
              <div class="nn-neuron" style="opacity:${0.6 + j*0.06};width:${layer.type==='Input'?40:layer.type==='Output'?44:36}px;height:${layer.type==='Input'?40:layer.type==='Output'?44:36}px;">
                ${j === 0 ? layer.neurons > 6 ? layer.neurons : '' : ''}
              </div>
            `).join('')}
            ${layer.neurons > 6 ? '<div style="font-size:10px;color:var(--text-muted)">+' + (layer.neurons-6) + ' more</div>' : ''}
          </div>
          <div class="nn-label" style="margin-top:8px;">
            <div style="font-weight:600;">${layer.type}</div>
            <div style="color:var(--text-muted);font-size:9px;">${layer.neurons} neurons</div>
            ${layer.activation !== 'none' ? `<div style="color:var(--cyan);font-size:9px;">${layer.activation}</div>` : ''}
          </div>
          ${layer.type === 'Hidden' ? `<button onclick="removeLayer(${i})" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-radius:6px;color:var(--red);font-size:10px;padding:2px 6px;cursor:pointer;margin-top:4px;">Remove</button>` : ''}
        </div>
        ${i < nnLayers.length - 1 ? '<div class="nn-arrow">→</div>' : ''}
      `).join('')}
    </div>

    <div class="nn-controls" style="margin-top:16px;">
      <button class="layer-btn" onclick="addHiddenLayer(4,'ReLU')">+ Add Hidden Layer (4n, ReLU)</button>
      <button class="layer-btn" onclick="addHiddenLayer(8,'ReLU')">+ Larger Layer (8n)</button>
      <button class="layer-btn" onclick="addHiddenLayer(2,'Sigmoid')">+ Layer (2n, Sigmoid)</button>
      <button class="layer-btn" onclick="changeNeurons('in', 1)">+ Input Neuron</button>
      <button class="layer-btn" onclick="changeNeurons('in', -1)">– Input Neuron</button>
      <button class="layer-btn" onclick="changeNeurons('out', 1)">+ Output Neuron</button>
      <button class="layer-btn" onclick="changeNeurons('out', -1)">– Output Neuron</button>
      <button class="layer-btn" onclick="resetNN()" style="border-color:rgba(239,68,68,0.3);color:var(--red)">🔄 Reset</button>
      <button class="btn btn-primary btn-sm" onclick="trainNN()">⚡ Simulate Training</button>
    </div>

    <div id="nn-train-result" style="margin-top:12px;"></div>
  `;
}

function addHiddenLayer(neurons, activation) {
  const outIdx = nnLayers.findIndex(l => l.type === 'Output');
  nnLayers.splice(outIdx, 0, { type: 'Hidden', neurons, activation });
  renderNNBuilder();
}

function removeLayer(idx) {
  if (nnLayers[idx].type !== 'Hidden') return;
  nnLayers.splice(idx, 1);
  renderNNBuilder();
}

function changeNeurons(type, delta) {
  if (type === 'in') {
    nnLayers[0].neurons = Math.max(1, Math.min(10, nnLayers[0].neurons + delta));
  } else {
    const out = nnLayers.findIndex(l => l.type === 'Output');
    nnLayers[out].neurons = Math.max(1, Math.min(10, nnLayers[out].neurons + delta));
  }
  renderNNBuilder();
}

function resetNN() {
  nnLayers = [
    { type: 'Input', neurons: 3, activation: 'none' },
    { type: 'Hidden', neurons: 4, activation: 'ReLU' },
    { type: 'Output', neurons: 2, activation: 'Softmax' }
  ];
  renderNNBuilder();
}

function trainNN() {
  const resultEl = document.getElementById('nn-train-result');
  if (!resultEl) return;
  resultEl.innerHTML = `<div style="color:var(--orange);font-size:13px;">⚡ Training simulation running...</div>`;

  let epoch = 0;
  const maxEpochs = 10;
  const logs = [];

  const interval = setInterval(() => {
    epoch++;
    const loss = (2.5 * Math.exp(-epoch * 0.3) + Math.random() * 0.1).toFixed(4);
    const acc = Math.min(98, 40 + epoch * 5 + Math.random() * 3).toFixed(1);
    logs.push({ epoch, loss, acc });

    resultEl.innerHTML = `
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:14px;font-family:monospace;font-size:12px;max-height:160px;overflow-y:auto;">
        ${logs.map(l => `<div style="color:${l.acc > 85 ? 'var(--green)' : 'var(--text-secondary)'}">Epoch ${l.epoch}/${maxEpochs} — Loss: ${l.loss} — Acc: ${l.acc}%</div>`).join('')}
      </div>
    `;

    if (epoch >= maxEpochs) {
      clearInterval(interval);
      const finalAcc = parseFloat(logs[logs.length - 1].acc);
      resultEl.innerHTML += `
        <div style="margin-top:10px;padding:12px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.2);border-radius:10px;color:var(--green);font-size:13px;font-weight:600;">
          ✅ Training Complete! Final Accuracy: ${finalAcc}% — Architecture saved! +30 XP
        </div>`;
      if (typeof appState !== 'undefined') { appState.xp += 30; if (typeof saveState === 'function') saveState(); }
    }
  }, 400);
}

// ══════════════════════════════
//  GAME 3: PATTERN RECOGNITION
// ══════════════════════════════
let patState = { round: 0, score: 0, totalRounds: 8, pattern: [], userGrid: [], answer: [], gridSize: 5 };

function openPatternGame() {
  document.getElementById('pattern-modal').classList.add('open');
  document.getElementById('backdrop').classList.add('open');
  patState = { round: 0, score: 0, totalRounds: 8, pattern: [], userGrid: [], answer: [], gridSize: 5 };
  startPatternRound();
}

function startPatternRound() {
  patState.round++;
  if (patState.round > patState.totalRounds) { endPatternGame(); return; }
  const size = patState.gridSize;
  const totalCells = size * size;
  const pattern = Array(totalCells).fill(false);
  const masked = Array(totalCells).fill(false);
  const answer = [];

  // Create a pattern (random for now, but structured)
  const numOn = Math.floor(totalCells * 0.3) + patState.round;
  const shuffled = Array.from({length: totalCells}, (_,i)=>i).sort(()=>Math.random()-0.5);
  shuffled.slice(0, numOn).forEach(i => { pattern[i] = true; });

  // Mask some cells
  const numMasked = 3 + Math.floor(patState.round / 3);
  const onCells = shuffled.filter(i => pattern[i]).slice(0, numMasked);
  onCells.forEach(i => { masked[i] = true; answer.push(i); });
  patState.pattern = pattern.map((v, i) => masked[i] ? null : v); // null = hidden
  patState.answer = answer;
  patState.userGrid = Array(totalCells).fill(null);

  renderPatternGame();
}

function renderPatternGame() {
  const body = document.getElementById('pattern-body');
  if (!body) return;
  const size = patState.gridSize;

  body.innerHTML = `
    <div style="display:flex;justify-content:space-between;margin-bottom:16px;align-items:center;">
      <div style="font-size:14px;font-weight:600;">Round ${patState.round}/${patState.totalRounds}</div>
      <div style="font-size:18px;font-weight:800;color:var(--cyan)">Score: ${patState.score}</div>
    </div>
    <p style="color:var(--text-secondary);font-size:13px;margin-bottom:14px;">🔍 Click the hidden cells (shown as grey) to complete the pattern. Fill in the <strong style="color:var(--cyan)">missing lit cells</strong>!</p>
    <div class="pattern-grid" style="grid-template-columns:repeat(${size},1fr);max-width:260px;margin:0 auto 18px auto;">
      ${patState.pattern.map((v, i) => {
        if (v === null) {
          // Hidden cell
          const userVal = patState.userGrid[i];
          return `<div class="pattern-cell" style="width:46px;height:46px;border:2px dashed rgba(99,102,241,0.5);background:${userVal?'var(--cyan)':'rgba(99,102,241,0.1)'};cursor:pointer;" onclick="togglePatternCell(${i})" title="Click to toggle"></div>`;
        }
        return `<div class="pattern-cell ${v?'on':'off'}" style="width:46px;height:46px;pointer-events:none;"></div>`;
      }).join('')}
    </div>
    <div style="display:flex;gap:10px;justify-content:center;">
      <button class="btn btn-primary" onclick="checkPattern()">✅ Check Answer</button>
      <button class="btn btn-outline btn-sm" onclick="skipPattern()">Skip →</button>
    </div>
    <div id="pat-result" style="margin-top:12px;text-align:center;"></div>
  `;
}

function togglePatternCell(i) {
  patState.userGrid[i] = !patState.userGrid[i];
  renderPatternGame();
}

function checkPattern() {
  const selected = patState.pattern.map((v,i) => v === null && patState.userGrid[i] ? i : -1).filter(i => i >= 0);
  const correct = patState.answer.filter(i => selected.includes(i)).length;
  const total = patState.answer.length;
  const pts = Math.round((correct / total) * 20);
  patState.score += pts;

  const result = document.getElementById('pat-result');
  if (result) {
    result.innerHTML = `<div style="padding:10px;border-radius:8px;font-size:13px;${correct===total?'background:rgba(16,185,129,0.1);color:var(--green);border:1px solid rgba(16,185,129,0.3)':'background:rgba(245,158,11,0.1);color:var(--orange);border:1px solid rgba(245,158,11,0.3)'}">
      ${correct===total?'🎯 Perfect!':'⚠️ Partial!'} ${correct}/${total} correct — +${pts} points
    </div>`;
  }
  setTimeout(() => startPatternRound(), 1500);
}

function skipPattern() { startPatternRound(); }

function endPatternGame() {
  const hs = Math.max(patState.score, parseInt(localStorage.getItem('nt_pat_hs') || 0));
  localStorage.setItem('nt_pat_hs', hs);
  if (typeof appState !== 'undefined') { appState.xp += patState.score; if (typeof saveState === 'function') saveState(); }
  const body = document.getElementById('pattern-body');
  if (!body) return;
  body.innerHTML = `
    <div style="text-align:center;padding:20px;">
      <div style="font-size:72px;margin-bottom:16px;">${patState.score>=100?'🏆':patState.score>=60?'🎯':'😅'}</div>
      <h2 style="font-size:24px;font-weight:800;margin-bottom:8px;">Pattern Game Complete!</h2>
      <p style="color:var(--text-secondary);margin-bottom:24px;">You scored <strong style="color:var(--cyan)">${patState.score}</strong> points across ${patState.totalRounds} rounds</p>
      <div style="background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.2);border-radius:10px;padding:14px;margin-bottom:20px;color:var(--cyan);font-weight:600;">
        🏅 High Score: ${hs} | +${patState.score} XP earned!
      </div>
      <div style="display:flex;gap:10px;justify-content:center;">
        <button class="btn btn-primary" onclick="patState={round:0,score:0,totalRounds:8,pattern:[],userGrid:[],answer:[],gridSize:5};startPatternRound()">🔄 Play Again</button>
        <button class="btn btn-outline" onclick="closeGame()">Close</button>
      </div>
    </div>`;
}

// ══════════════════════════════
//  GAME 4: DATA DETECTIVE
// ══════════════════════════════
const detectiveDatasets = [
  {
    name: 'Housing Prices Dataset',
    desc: 'Find the anomalous data points that might skew your ML model!',
    columns: ['House ID', 'Area (sqft)', 'Rooms', 'Price ($K)', 'Year Built'],
    data: [
      [1, 1200, 3, 250, 2005],
      [2, 1800, 4, 380, 2010],
      [3, 950, 2, 190, 1998],
      [4, 2200, 5, 9999, 2015],  // anomaly - price too high
      [5, 1500, 3, 310, 2008],
      [6, 1100, 2, 220, 2001],
      [7, -500, 3, 200, 2012],   // anomaly - negative area
      [8, 1700, 4, 350, 2014],
      [9, 2000, 0, 400, 2018],   // anomaly - 0 rooms
      [10, 1300, 3, 270, 2006],
    ],
    anomalies: [3, 6, 8], // 0-indexed row indices
  },
  {
    name: 'Student Exam Scores',
    desc: 'Identify outliers in student performance data.',
    columns: ['Student', 'Math', 'Science', 'English', 'Study Hours'],
    data: [
      ['Alice', 85, 82, 88, 5],
      ['Bob', 72, 68, 75, 3],
      ['Charlie', 90, 88, 92, 7],
      ['Diana', 78, 200, 80, 4],  // anomaly - science > 100
      ['Eve', 65, 62, 70, 2],
      ['Frank', -10, 75, 80, 4],  // anomaly - negative score
      ['Grace', 88, 85, 90, 6],
      ['Hank', 70, 72, 68, 3],
      ['Iris', 95, 93, 97, 8],
      ['Jack', 82, 78, 85, 150],  // anomaly - 150 study hours
    ],
    anomalies: [3, 5, 9],
  },
];

let detState = { datasetIdx: 0, selected: [], revealed: false, score: 0 };

function openDetectiveGame() {
  document.getElementById('detective-modal').classList.add('open');
  document.getElementById('backdrop').classList.add('open');
  detState = { datasetIdx: 0, selected: [], revealed: false, score: 0 };
  renderDetective();
}

function renderDetective() {
  const body = document.getElementById('detective-body');
  if (!body) return;
  const ds = detectiveDatasets[detState.datasetIdx];

  body.innerHTML = `
    <div style="margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div style="font-size:16px;font-weight:700;">${ds.name}</div>
        <div style="font-size:13px;color:var(--text-secondary);">${ds.desc}</div>
      </div>
      <div style="font-size:18px;font-weight:800;color:var(--cyan)">Score: ${detState.score}</div>
    </div>
    <p style="color:var(--text-muted);font-size:12px;margin-bottom:14px;">🕵️ Click on rows that contain <strong style="color:var(--red)">anomalies or outliers</strong>. Then click "Reveal Answers".</p>
    <div style="overflow-x:auto;border:1px solid var(--border);border-radius:12px;">
      <table class="data-table" style="min-width:500px;">
        <thead>
          <tr>${ds.columns.map(c => `<th>${c}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${ds.data.map((row, i) => {
            const isSelected = detState.selected.includes(i);
            const isAnomaly = ds.anomalies.includes(i);
            let rowClass = isSelected ? 'highlight' : '';
            let style = isSelected ? 'cursor:pointer;border-left:3px solid var(--red);' : 'cursor:pointer;';
            if (detState.revealed) {
              if (isAnomaly) rowClass = 'highlight';
              style += isAnomaly ? 'border-left:3px solid var(--red);' : '';
            }
            return `
              <tr class="${rowClass}" onclick="${!detState.revealed ? `toggleDetRow(${i})` : ''}" style="${style}">
                ${row.map((cell, ci) => {
                  let cellClass = '';
                  if (detState.revealed && isAnomaly) {
                    // Highlight the anomalous cell
                    const avg = ds.data.map(r => r[ci]).filter(v => typeof v === 'number').reduce((a,b)=>a+b,0) / ds.data.length;
                    if (typeof cell === 'number' && (cell < 0 || cell > avg * 3)) cellClass = 'anomaly';
                  }
                  return `<td class="${cellClass}">${cell}</td>`;
                }).join('')}
              </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
    <div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap;">
      <button class="btn btn-primary" onclick="revealDetective()">🔍 Reveal Answers</button>
      ${detState.datasetIdx < detectiveDatasets.length - 1 ? `<button class="btn btn-outline btn-sm" onclick="nextDataset()">Next Dataset →</button>` : `<button class="btn btn-outline btn-sm" onclick="finishDetective()">Finish Game 🏁</button>`}
      <span style="font-size:12px;color:var(--text-muted);align-self:center;">Selected: ${detState.selected.length} rows</span>
    </div>
    <div id="det-result" style="margin-top:12px;"></div>
  `;
}

function toggleDetRow(i) {
  if (detState.revealed) return;
  const idx = detState.selected.indexOf(i);
  if (idx >= 0) detState.selected.splice(idx, 1);
  else detState.selected.push(i);
  renderDetective();
}

function revealDetective() {
  if (detState.revealed) return;
  detState.revealed = true;
  const ds = detectiveDatasets[detState.datasetIdx];
  const correct = detState.selected.filter(i => ds.anomalies.includes(i)).length;
  const falsePos = detState.selected.filter(i => !ds.anomalies.includes(i)).length;
  const pts = Math.max(0, correct * 20 - falsePos * 10);
  detState.score += pts;

  renderDetective();
  const result = document.getElementById('det-result');
  if (result) {
    result.innerHTML = `
      <div style="padding:14px;border-radius:10px;background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);">
        <div style="font-weight:700;margin-bottom:6px;color:var(--cyan)">🔍 Analysis Results</div>
        <div style="font-size:13px;color:var(--text-secondary);">
          ✅ Correct anomalies found: <strong style="color:var(--green)">${correct}/${ds.anomalies.length}</strong><br>
          ❌ False positives: <strong style="color:var(--red)">${falsePos}</strong><br>
          🏆 Points earned: <strong style="color:var(--cyan)">+${pts}</strong><br>
          <span style="color:var(--text-muted);font-size:12px;">Anomalies were in rows: ${ds.anomalies.map(i=>i+1).join(', ')}</span>
        </div>
      </div>`;
  }
}

function nextDataset() {
  detState.datasetIdx++;
  detState.selected = [];
  detState.revealed = false;
  renderDetective();
}

function finishDetective() {
  const hs = Math.max(detState.score, parseInt(localStorage.getItem('nt_det_hs') || 0));
  localStorage.setItem('nt_det_hs', hs);
  if (typeof appState !== 'undefined') { appState.xp += detState.score; if (typeof saveState === 'function') saveState(); }
  const body = document.getElementById('detective-body');
  if (!body) return;
  body.innerHTML = `
    <div style="text-align:center;padding:20px;">
      <div style="font-size:72px;margin-bottom:16px;">${detState.score>=60?'🕵️':'🔍'}</div>
      <h2 style="font-size:24px;font-weight:800;margin-bottom:8px;">Case Closed!</h2>
      <p style="color:var(--text-secondary);margin-bottom:24px;">You scored <strong style="color:var(--cyan)">${detState.score}</strong> points as a Data Detective!</p>
      <div style="background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.2);border-radius:10px;padding:12px;margin-bottom:20px;color:var(--cyan);font-weight:600;">
        🏅 High Score: ${hs} | +${detState.score} XP earned!
      </div>
      <div style="display:flex;gap:10px;justify-content:center;">
        <button class="btn btn-primary" onclick="detState={datasetIdx:0,selected:[],revealed:false,score:0};renderDetective()">🔄 Play Again</button>
        <button class="btn btn-outline" onclick="closeGame()">Close</button>
      </div>
    </div>`;
}

// ─── Close game helper ───
function closeGame() {
  clearInterval(quizState.timer);
  document.querySelectorAll('.game-modal').forEach(m => m.classList.remove('open'));
  document.getElementById('backdrop').classList.remove('open');
  // Update game high scores on games page
  if (document.getElementById('quiz-hs')) document.getElementById('quiz-hs').textContent = (localStorage.getItem('nt_quiz_hs') || 0) + ' pts';
  if (document.getElementById('pat-hs')) document.getElementById('pat-hs').textContent = (localStorage.getItem('nt_pat_hs') || 0) + ' pts';
  if (document.getElementById('det-hs')) document.getElementById('det-hs').textContent = (localStorage.getItem('nt_det_hs') || 0) + ' pts';
}
