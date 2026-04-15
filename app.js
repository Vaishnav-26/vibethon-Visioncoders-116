// ═══════════════════════════════════════════════
//  NeuralTask — Main App Logic (app.js)
// ═══════════════════════════════════════════════

// ─── Auth Guard ───
const savedUser = JSON.parse(localStorage.getItem('neuraltask_user') || 'null');
if (!savedUser) { window.location.href = 'login.html'; }

// ─── App State ───
let appState = {
  user: savedUser,
  tasks: JSON.parse(localStorage.getItem('nt_tasks') || 'null') || getDefaultTasks(),
  taskFilter: 'all',
  courseFilter: 'all',
  videoFilter: 'all',
  lbFilter: 'weekly',
  completedCourses: JSON.parse(localStorage.getItem('nt_courses') || '[]'),
  xp: parseInt(localStorage.getItem('nt_xp') || '1240'),
  streak: parseInt(localStorage.getItem('nt_streak') || '7'),
  learningHours: parseFloat(localStorage.getItem('nt_hours') || '12'),
};

function saveState() {
  localStorage.setItem('nt_tasks', JSON.stringify(appState.tasks));
  localStorage.setItem('nt_courses', JSON.stringify(appState.completedCourses));
  localStorage.setItem('nt_xp', appState.xp);
  localStorage.setItem('nt_streak', appState.streak);
  localStorage.setItem('nt_hours', appState.learningHours);
}

// ─── Default Tasks ───
function getDefaultTasks() {
  return [
    { id:1, title:'Introduction to Linear Regression', desc:'Learn the fundamentals of linear regression including cost functions and gradient descent.', category:'ML Basics', difficulty:'Beginner', time:2, completed:true, aiPick:false, icon:'📊', color:'#10b981' },
    { id:2, title:'Build a Neural Network from Scratch', desc:'Implement a simple feedforward neural network using only NumPy to understand backpropagation.', category:'Deep Learning', difficulty:'Intermediate', time:4, completed:false, aiPick:true, icon:'🧠', color:'#8b5cf6' },
    { id:3, title:'Text Classification with Transformers', desc:'Use HuggingFace transformers to build a sentiment analysis model.', category:'NLP', difficulty:'Intermediate', time:3, completed:false, aiPick:false, icon:'💬', color:'#06b6d4' },
    { id:4, title:'Object Detection with YOLO', desc:'Implement real-time object detection using the YOLO architecture.', category:'Computer Vision', difficulty:'Advanced', time:5, completed:false, aiPick:false, icon:'👁️', color:'#f59e0b' },
    { id:5, title:'Kaggle Competition: Titanic', desc:'Practice ML skills with the classic Titanic survival prediction competition.', category:'Practice', difficulty:'Beginner', time:3, completed:true, aiPick:false, icon:'🚢', color:'#ec4899' },
    { id:6, title:'Implement Gradient Descent', desc:'Build gradient descent optimization from scratch to understand how models learn.', category:'ML Basics', difficulty:'Beginner', time:2, completed:false, aiPick:false, icon:'📉', color:'#10b981' },
  ];
}

// ─── Navigation ───
function navigate(pageId, el) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  // Show target page
  const page = document.getElementById('page-' + pageId);
  if (page) { page.classList.add('active'); page.classList.add('animate-fade-in'); }
  if (el) el.classList.add('active');
  // Update topbar title
  const titles = { dashboard:'Dashboard', courses:'Courses', games:'AI/ML Games', videos:'Video Topics', progress:'Progress', leaderboard:'Leaderboard', resources:'Resources', profile:'Profile' };
  document.getElementById('topbar-title').textContent = titles[pageId] || pageId;
  // Close sidebar on mobile
  if (window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('open');
  // Render page content
  renderPage(pageId);
}

function renderPage(pageId) {
  switch(pageId) {
    case 'dashboard': renderDashboard(); break;
    case 'courses': renderCourses(); break;
    case 'games': renderGames(); break;
    case 'videos': renderVideos(); break;
    case 'progress': renderProgress(); break;
    case 'leaderboard': renderLeaderboard(); break;
    case 'resources': renderResources(); break;
    case 'profile': renderProfile(); break;
  }
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ─── Init ───
window.addEventListener('DOMContentLoaded', () => {
  initUser();
  renderDashboard();
  initParticles();
  setTimeout(() => renderLeaderboard(), 100);
});

function initUser() {
  const u = appState.user;
  if (!u) return;
  const name = u.name || u.displayName || u.email?.split('@')[0] || 'Learner';
  document.getElementById('welcome-name').textContent = name.split(' ')[0];
  document.getElementById('sidebar-name').textContent = name;
  document.getElementById('sidebar-email').textContent = u.email || '';
  // Avatar
  const initial = name.charAt(0).toUpperCase();
  document.getElementById('sidebar-avatar').textContent = initial;
  document.getElementById('topbar-avatar-text').textContent = initial;
  if (u.photo) {
    document.getElementById('sidebar-avatar').innerHTML = `<img src="${u.photo}" alt="Avatar">`;
    document.getElementById('profile-avatar-display').innerHTML = `<img src="${u.photo}" alt="Avatar">`;
  } else {
    document.getElementById('sidebar-avatar').textContent = initial;
    document.getElementById('profile-avatar-display').textContent = initial;
  }
}

// ─── DASHBOARD ───
function renderDashboard() {
  const tasks = appState.tasks;
  const completed = tasks.filter(t => t.completed).length;
  const total = tasks.length;
  const rate = total > 0 ? Math.round((completed/total)*100) : 0;
  const hours = appState.learningHours;
  const streak = appState.streak;

  // Stats
  animateValue('stat-completed', `${completed}/${total}`);
  animateValue('stat-rate', `${rate}%`);
  animateValue('stat-hours', `${hours}h`);
  animateValue('stat-streak', streak);
  document.getElementById('stat-completed-bar').style.width = `${(completed/total)*100}%`;
  document.getElementById('stat-rate-bar').style.width = `${rate}%`;
  document.getElementById('stat-hours-bar').style.width = `${Math.min((hours/20)*100,100)}%`;
  document.getElementById('stat-streak-bar').style.width = `${Math.min((streak/30)*100,100)}%`;

  renderTasks();
  renderCategoryProgress();
  renderAISuggestions();
}

function animateValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ─── TASKS ───
function renderTasks() {
  const filter = appState.taskFilter;
  let tasks = appState.tasks;
  if (filter === 'active') tasks = tasks.filter(t => !t.completed);
  if (filter === 'completed') tasks = tasks.filter(t => t.completed);
  const container = document.getElementById('tasks-container');
  if (!container) return;
  if (tasks.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📋</div><p>No tasks here yet!</p></div>`;
    return;
  }
  container.innerHTML = tasks.map(t => `
    <div class="task-item ${t.completed?'completed':''}" id="task-${t.id}">
      <div class="task-checkbox ${t.completed?'checked':''}" onclick="toggleTask(${t.id})" title="${t.completed?'Mark incomplete':'Mark complete'}">
        ${t.completed ? '✓' : ''}
      </div>
      <div class="task-icon" style="background:${t.color}22;font-size:18px;">${t.icon}</div>
      <div class="task-body">
        <div class="task-title">${t.title}</div>
        <div class="task-desc">${t.desc}</div>
        <div class="task-meta">
          <span class="badge badge-${t.difficulty.toLowerCase()}">${t.difficulty}</span>
          <span class="badge badge-category">${t.category}</span>
          <span class="task-time">⏱️ ${t.time}h</span>
        </div>
      </div>
      <div class="task-right" style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">
        ${t.aiPick ? '<span class="badge badge-ai">🤖 AI PICK</span>' : ''}
        <button onclick="deleteTask(${t.id})" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:14px;" title="Delete">🗑️</button>
      </div>
    </div>
  `).join('');
}

function toggleTask(id) {
  const task = appState.tasks.find(t => t.id === id);
  if (!task) return;
  task.completed = !task.completed;
  if (task.completed) {
    appState.xp += 50;
    appState.learningHours += task.time;
    showToast('success', '✅ Task Completed!', `+50 XP • +${task.time}h learning`);
  }
  saveState();
  renderDashboard();
}

function deleteTask(id) {
  appState.tasks = appState.tasks.filter(t => t.id !== id);
  saveState();
  renderTasks();
  showToast('info', '🗑️ Task deleted', 'Task removed from your list.');
}

function filterTasks(filter, el) {
  appState.taskFilter = filter;
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  renderTasks();
}

function openAddTask() {
  document.getElementById('add-task-modal').classList.add('open');
  document.getElementById('backdrop').classList.add('open');
}

function addTask() {
  const title = document.getElementById('new-task-title').value.trim();
  if (!title) { showToast('error', '❌ Error', 'Please enter a task title.'); return; }
  const icons = { 'ML Basics':'📊','Deep Learning':'🧠','NLP':'💬','Computer Vision':'👁️','Practice':'🚢' };
  const colors = { 'ML Basics':'#10b981','Deep Learning':'#8b5cf6','NLP':'#06b6d4','Computer Vision':'#f59e0b','Practice':'#ec4899' };
  const cat = document.getElementById('new-task-cat').value;
  const newTask = {
    id: Date.now(),
    title,
    desc: document.getElementById('new-task-desc').value || 'Custom learning task.',
    category: cat,
    difficulty: document.getElementById('new-task-diff').value,
    time: parseFloat(document.getElementById('new-task-time').value) || 2,
    completed: false, aiPick: false,
    icon: icons[cat] || '📌',
    color: colors[cat] || '#6366f1'
  };
  appState.tasks.push(newTask);
  saveState();
  closeAllModals();
  renderDashboard();
  showToast('success', '✅ Task Added!', `"${title}" added to your tasks.`);
  document.getElementById('new-task-title').value = '';
  document.getElementById('new-task-desc').value = '';
}

// ─── CATEGORY PROGRESS ───
function renderCategoryProgress() {
  const categories = ['ML Basics', 'Deep Learning', 'NLP', 'Computer Vision', 'Practice'];
  const colors = ['grad-primary', 'pink', 'green', 'orange', 'pink'];
  const container = document.getElementById('category-progress');
  if (!container) return;
  container.innerHTML = categories.map((cat, i) => {
    const catTasks = appState.tasks.filter(t => t.category === cat);
    const done = catTasks.filter(t => t.completed).length;
    const total = catTasks.length || 1;
    const pct = Math.round((done/total)*100);
    return `
      <div class="progress-item">
        <div class="progress-header">
          <span class="progress-label">${cat}</span>
          <span class="progress-value" style="color:${pct===100?'var(--green)':pct>50?'var(--orange)':'var(--text-muted)'}">${done}/${catTasks.length || 0} <strong>${pct}%</strong></span>
        </div>
        <div class="progress-bar"><div class="progress-fill ${colors[i]}" style="width:${pct}%"></div></div>
      </div>`;
  }).join('');
}

// ─── AI SUGGESTIONS ───
const suggestions = [
  { level:'BEGINNER', color:'var(--green)', icon:'⚡', title:'Implement Gradient Descent', desc:'Build gradient descent optimization from scratch to understand how models learn.', time:'2 hours' },
  { level:'INTERMEDIATE', color:'var(--orange)', icon:'⚡', title:'Build a CNN Image Classifier', desc:'Create a convolutional neural network to classify images using PyTorch.', time:'4 hours' },
  { level:'ADVANCED', color:'var(--red)', icon:'⚡', title:'Fine-tune a BERT Model', desc:'Learn transfer learning by fine-tuning BERT for custom text classification.', time:'5 hours' },
  { level:'BEGINNER', color:'var(--green)', icon:'⚡', title:'K-Means Clustering', desc:'Implement K-Means from scratch and visualize clusters on real datasets.', time:'2 hours' },
  { level:'INTERMEDIATE', color:'var(--orange)', icon:'⚡', title:'Attention Mechanism', desc:'Implement self-attention from scratch to understand transformer architecture.', time:'3 hours' },
  { level:'ADVANCED', color:'var(--red)', icon:'⚡', title:'Generative Adversarial Network', desc:'Build and train a GAN to generate realistic images from noise.', time:'6 hours' },
];

let suggestionIdx = 0;
function renderAISuggestions() {
  const container = document.getElementById('ai-suggestions');
  if (!container) return;
  const shown = [suggestions[suggestionIdx % suggestions.length], suggestions[(suggestionIdx+1) % suggestions.length], suggestions[(suggestionIdx+2) % suggestions.length]];
  container.innerHTML = shown.map(s => `
    <div class="suggestion-item" onclick="addSuggestionTask('${s.title}','${s.desc}','${s.level}')">
      <div class="suggestion-level" style="color:${s.color}">${s.icon} ${s.level}</div>
      <div class="suggestion-title">${s.title}</div>
      <div class="suggestion-desc">${s.desc}</div>
      <div class="suggestion-footer">
        <span class="suggestion-time">⏱️ ${s.time}</span>
        <button class="btn btn-sm" style="background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.3);color:var(--indigo);padding:4px 12px;font-size:11px;">+ Add</button>
      </div>
    </div>`).join('');
}

function refreshSuggestions() {
  suggestionIdx = (suggestionIdx + 3) % suggestions.length;
  renderAISuggestions();
  showToast('info', '🤖 Refreshed!', 'New AI suggestions generated.');
}

function addSuggestionTask(title, desc, level) {
  const diffMap = { 'BEGINNER':'Beginner','INTERMEDIATE':'Intermediate','ADVANCED':'Advanced' };
  const newTask = { id: Date.now(), title, desc, category:'ML Basics', difficulty: diffMap[level]||'Beginner', time:2, completed:false, aiPick:true, icon:'⚡', color:'#6366f1' };
  appState.tasks.push(newTask);
  saveState();
  renderDashboard();
  showToast('success', '✅ Task Added!', `"${title}" added via AI suggestion.`);
}

// ─── COURSES ───
const coursesData = [
  { id:1, title:'Introduction to Machine Learning', desc:'Master the fundamentals of ML including supervised, unsupervised, and reinforcement learning.', category:'ML Basics', difficulty:'Beginner', time:'8h', rating:4.9, emoji:'📊', grad:'grad-bg-2', progress:50, lessons:12 },
  { id:2, title:'Deep Learning with PyTorch', desc:'Build and train deep neural networks using the powerful PyTorch framework.', category:'Deep Learning', difficulty:'Intermediate', time:'12h', rating:4.8, emoji:'🔥', grad:'grad-bg-1', progress:0, lessons:18 },
  { id:3, title:'Natural Language Processing', desc:'Explore text processing, sentiment analysis, and transformer-based language models.', category:'NLP', difficulty:'Intermediate', time:'10h', rating:4.7, emoji:'💬', grad:'grad-bg-5', progress:25, lessons:15 },
  { id:4, title:'Computer Vision with OpenCV', desc:'Learn image processing, object detection, and face recognition techniques.', category:'Computer Vision', difficulty:'Intermediate', time:'9h', rating:4.6, emoji:'👁️', grad:'grad-bg-3', progress:0, lessons:14 },
  { id:5, title:'Kaggle Competitions Masterclass', desc:'Learn winning strategies for ML competitions with hands-on practice.', category:'Practice', difficulty:'Advanced', time:'15h', rating:4.9, emoji:'🏆', grad:'grad-bg-4', progress:100, lessons:20 },
  { id:6, title:'Reinforcement Learning Fundamentals', desc:'Understand Q-learning, policy gradients, and build your own game-playing AI.', category:'Reinforcement', difficulty:'Advanced', time:'14h', rating:4.7, emoji:'🎮', grad:'grad-bg-6', progress:0, lessons:16 },
  { id:7, title:'Feature Engineering & Selection', desc:'Master the art of creating and selecting the right features for ML models.', category:'ML Basics', difficulty:'Beginner', time:'6h', rating:4.5, emoji:'🔧', grad:'grad-bg-2', progress:75, lessons:10 },
  { id:8, title:'Transformers & Attention Mechanism', desc:'Deep dive into the transformer architecture powering modern AI breakthroughs.', category:'Deep Learning', difficulty:'Advanced', time:'16h', rating:4.9, emoji:'🤖', grad:'grad-bg-1', progress:0, lessons:22 },
  { id:9, title:'Text Generation with GPT', desc:'Build your own text generation models using GPT architecture from scratch.', category:'NLP', difficulty:'Advanced', time:'12h', rating:4.8, emoji:'✍️', grad:'grad-bg-5', progress:0, lessons:18 },
];

let activeCourseFilter = 'all';

function setCourseFilter(cat, el) {
  activeCourseFilter = cat;
  document.querySelectorAll('#course-cat-filters .cat-filter').forEach(f => f.classList.remove('active'));
  if (el) el.classList.add('active');
  renderCourses();
}

function filterCourses() {
  renderCourses();
}

function renderCourses() {
  const search = (document.getElementById('course-search')?.value || '').toLowerCase();
  let courses = coursesData;
  if (activeCourseFilter !== 'all') courses = courses.filter(c => c.category === activeCourseFilter);
  if (search) courses = courses.filter(c => c.title.toLowerCase().includes(search) || c.desc.toLowerCase().includes(search));
  const grid = document.getElementById('courses-grid');
  if (!grid) return;
  if (courses.length === 0) { grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">📚</div><p>No courses found.</p></div>'; return; }
  grid.innerHTML = courses.map(c => `
    <div class="course-card" onclick="openCourse(${c.id})">
      <div class="course-thumb ${c.grad}" style="font-size:56px;">${c.emoji}</div>
      <div class="course-body">
        <div class="course-title">${c.title}</div>
        <div class="course-desc">${c.desc}</div>
        <div class="course-meta">
          <span class="badge badge-${c.difficulty.toLowerCase()}">${c.difficulty}</span>
          <span class="badge badge-category">${c.category}</span>
          <span class="task-time">⏱️ ${c.time}</span>
          <span class="task-time">📖 ${c.lessons} lessons</span>
        </div>
        <div class="course-footer">
          <span class="course-rating">★★★★★ ${c.rating}</span>
          ${c.progress === 100 ? '<span class="badge badge-beginner" style="background:rgba(16,185,129,0.2)">✅ Completed</span>' : c.progress > 0 ? `<span style="font-size:11px;color:var(--text-muted)">${c.progress}% done</span>` : '<span style="font-size:11px;color:var(--text-muted)">Not started</span>'}
        </div>
        ${c.progress > 0 ? `<div class="course-progress-bar"><div class="course-progress-fill" style="width:${c.progress}%"></div></div>` : ''}
      </div>
    </div>
  `).join('');
}

function openCourse(id) {
  const c = coursesData.find(c => c.id === id);
  if (!c) return;
  showToast('info', `📚 ${c.title}`, `Opening course... ${c.lessons} lessons available.`);
}

// ─── GAMES (entry points rendered from games.js) ───
function renderGames() {
  const grid = document.getElementById('games-grid');
  if (!grid) return;
  grid.innerHTML = `
    <div class="game-card" onclick="openQuizGame()">
      <div class="game-thumb grad-bg-1" style="font-size:72px;">🧠</div>
      <div class="game-body">
        <div class="game-title">ML Quiz Arena</div>
        <div class="game-desc">Test your AI & ML knowledge with timed multiple-choice questions. Race against the clock!</div>
        <div class="game-stats">
          <div class="game-stat">Questions: <span>30+</span></div>
          <div class="game-stat">High Score: <span id="quiz-hs">${localStorage.getItem('nt_quiz_hs')||0} pts</span></div>
          <div class="game-stat">Difficulty: <span>Mixed</span></div>
        </div>
        <button class="btn btn-primary btn-full">🎯 Play Now</button>
      </div>
    </div>
    <div class="game-card" onclick="openNNBuilder()">
      <div class="game-thumb grad-bg-6" style="font-size:72px;">🔬</div>
      <div class="game-body">
        <div class="game-title">Neural Network Builder</div>
        <div class="game-desc">Design neural network architectures by adding layers, neurons, and activations. See it come alive!</div>
        <div class="game-stats">
          <div class="game-stat">Mode: <span>Interactive</span></div>
          <div class="game-stat">Layers: <span>Unlimited</span></div>
          <div class="game-stat">Visual: <span>Real-time</span></div>
        </div>
        <button class="btn btn-primary btn-full">🏗️ Build Now</button>
      </div>
    </div>
    <div class="game-card" onclick="openPatternGame()">
      <div class="game-thumb grad-bg-3" style="font-size:72px;">🔡</div>
      <div class="game-body">
        <div class="game-title">Pattern Recognition</div>
        <div class="game-desc">Recognize and complete visual patterns the way AI does. Trains your intuition for ML concepts!</div>
        <div class="game-stats">
          <div class="game-stat">Rounds: <span>10</span></div>
          <div class="game-stat">Best: <span id="pat-hs">${localStorage.getItem('nt_pat_hs')||0} pts</span></div>
          <div class="game-stat">Difficulty: <span>Progressive</span></div>
        </div>
        <button class="btn btn-primary btn-full">🎮 Play Now</button>
      </div>
    </div>
    <div class="game-card" onclick="openDetectiveGame()">
      <div class="game-thumb grad-bg-4" style="font-size:72px;">🕵️</div>
      <div class="game-body">
        <div class="game-title">Data Detective</div>
        <div class="game-desc">Spot anomalies and outliers in data tables. Build your intuition for data cleaning and EDA!</div>
        <div class="game-stats">
          <div class="game-stat">Datasets: <span>5+</span></div>
          <div class="game-stat">Best: <span id="det-hs">${localStorage.getItem('nt_det_hs')||0} pts</span></div>
          <div class="game-stat">Mode: <span>Detective</span></div>
        </div>
        <button class="btn btn-primary btn-full">🔍 Investigate</button>
      </div>
    </div>
  `;
}

// ─── VIDEOS ───
const videosData = [
  { id:1, title:'Machine Learning Full Course', channel:'StatQuest', youtubeId:'Gv9_4yMHFhI', duration:'3h 55m', level:'Beginner', category:'Fundamentals', desc:'A complete introduction to machine learning covering all core algorithms with visual explanations.' },
  { id:2, title:'Neural Networks from Scratch', channel:'3Blue1Brown', youtubeId:'aircAruvnKk', duration:'19m', level:'Intermediate', category:'Deep Learning', desc:'Beautiful visual explanation of how neural networks work — the best intro on the internet.' },
  { id:3, title:'But what is a Neural Network?', channel:'3Blue1Brown', youtubeId:'aircAruvnKk', duration:'19m', level:'Beginner', category:'Fundamentals', desc:'An incredibly intuitive visual explanation of what neural networks are and how they learn.' },
  { id:4, title:'Transformers Explained Visually', channel:'Andrej Karpathy', youtubeId:'kCc8FmEb1nY', duration:'1h 56m', level:'Advanced', category:'Deep Learning', desc:'Karpathy builds a GPT from scratch, explaining every detail of the transformer architecture.' },
  { id:5, title:'Natural Language Processing with Deep Learning', channel:'Stanford CS224N', youtubeId:'rmVRLeJRkl4', duration:'1h 20m', level:'Intermediate', category:'NLP', desc:'Stanford\'s world-class NLP course covering word vectors, RNNs, and transformers.' },
  { id:6, title:'Convolutional Neural Networks Explained', channel:'Andrej Karpathy', youtubeId:'AgkfIQ4IGaM', duration:'1h 30m', level:'Intermediate', category:'Computer Vision', desc:'Deep dive into CNNs, how they detect features, and why they work so well for images.' },
  { id:7, title:'The Mathematics of Machine Learning', channel:'Zach Star', youtubeId:'8onB7rPG4Pk', duration:'13m', level:'Beginner', category:'Math', desc:'A quick overview of the key math concepts behind machine learning: linear algebra, calculus, stats.' },
  { id:8, title:'Linear Algebra for Machine Learning', channel:'3Blue1Brown', youtubeId:'fNk_zzaMoSs', duration:'15m', level:'Beginner', category:'Math', desc:'Visual introduction to vectors, matrices and linear transformations - the backbone of ML.' },
  { id:9, title:'Gradient Descent, Step by Step', channel:'StatQuest', youtubeId:'sDv4f4s2SB8', duration:'10m', level:'Beginner', category:'Fundamentals', desc:'StatQuest\'s clear explanation of gradient descent with easy examples and visualizations.' },
  { id:10, title:'Attention Is All You Need - Paper Explained', channel:'Yannic Kilcher', youtubeId:'iDulhoQ2pro', duration:'1h 26m', level:'Advanced', category:'NLP', desc:'Deep dive into the landmark attention paper that gave birth to modern language models.' },
  { id:11, title:'Object Detection with YOLO', channel:'Roboflow', youtubeId:'ag3DLKsl2vk', duration:'25m', level:'Intermediate', category:'Computer Vision', desc:'Hands-on tutorial implementing YOLO for real-time object detection in images and video.' },
  { id:12, title:'Statistics for Machine Learning', channel:'StatQuest', youtubeId:'qBigTkjLIaY', duration:'20m', level:'Beginner', category:'Math', desc:'Probability, distributions, hypothesis testing and how they apply to machine learning.' },
];

let activeVideoFilter = 'all';
function setVideoFilter(cat, el) {
  activeVideoFilter = cat;
  document.querySelectorAll('#video-cat-filters .cat-filter').forEach(f => f.classList.remove('active'));
  if (el) el.classList.add('active');
  renderVideos();
}

function renderVideos() {
  let videos = videosData;
  if (activeVideoFilter !== 'all') videos = videos.filter(v => v.category === activeVideoFilter);
  const grid = document.getElementById('videos-grid');
  if (!grid) return;
  const levelColors = { 'Beginner':'var(--green)', 'Intermediate':'var(--orange)', 'Advanced':'var(--red)' };
  grid.innerHTML = videos.map(v => `
    <div class="video-card" onclick="openVideo('${v.youtubeId}','${v.title}','${v.desc.replace(/'/g,"&apos;")}')">
      <div class="video-thumb">
        <div class="video-thumb-placeholder">
          <div class="play-btn-overlay">▶</div>
          <div style="font-size:11px;color:var(--text-secondary);text-align:center;padding:0 12px;">${v.channel}</div>
        </div>
      </div>
      <div class="video-body">
        <div class="video-title">${v.title}</div>
        <div class="video-meta">
          <span class="video-duration">⏱ ${v.duration}</span>
          <span class="video-level badge" style="background:${levelColors[v.level]}22;color:${levelColors[v.level]}">${v.level}</span>
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:6px;">📺 ${v.channel} · ${v.category}</div>
      </div>
    </div>
  `).join('');
}

function openVideo(youtubeId, title, desc) {
  document.getElementById('video-modal').classList.add('open');
  document.getElementById('backdrop').classList.add('open');
  document.getElementById('video-modal-iframe').src = `https://www.youtube.com/embed/${youtubeId}?autoplay=1`;
  document.getElementById('video-modal-title').textContent = title;
  document.getElementById('video-modal-title2').textContent = title;
  document.getElementById('video-modal-desc').textContent = desc;
  appState.learningHours += 0.5;
  appState.xp += 10;
  saveState();
}

function closeVideoModal() {
  document.getElementById('video-modal').classList.remove('open');
  document.getElementById('backdrop').classList.remove('open');
  document.getElementById('video-modal-iframe').src = '';
}

// ─── PROGRESS ───
function renderProgress() {
  const tasks = appState.tasks;
  const completed = tasks.filter(t => t.completed).length;
  const total = tasks.length;
  setTimeout(() => {
    // Completion Donut
    const ctx1 = document.getElementById('completion-chart')?.getContext('2d');
    if (ctx1) {
      new Chart(ctx1, {
        type: 'doughnut',
        data: {
          labels: ['Completed', 'Remaining'],
          datasets: [{ data: [completed, total - completed], backgroundColor: ['#6366f1','rgba(255,255,255,0.08)'], borderWidth: 0, hoverOffset: 4 }]
        },
        options: {
          plugins: { legend: { labels: { color: '#94a3b8', font: { size: 12 } } } },
          cutout: '70%',
          responsive: true, maintainAspectRatio: false
        }
      });
    }
    // Category Bar Chart
    const categories = ['ML Basics', 'Deep Learning', 'NLP', 'Computer Vision', 'Practice'];
    const ctx2 = document.getElementById('category-chart')?.getContext('2d');
    if (ctx2) {
      const data = categories.map(cat => {
        const catTasks = tasks.filter(t => t.category === cat);
        const done = catTasks.filter(t => t.completed).length;
        return catTasks.length > 0 ? Math.round((done/catTasks.length)*100) : 0;
      });
      new Chart(ctx2, {
        type: 'bar',
        data: {
          labels: categories.map(c => c.split(' ')[0]),
          datasets: [{ label: 'Completion %', data, backgroundColor: ['#6366f1','#8b5cf6','#06b6d4','#f59e0b','#ec4899'], borderRadius: 6, borderWidth: 0 }]
        },
        options: {
          plugins: { legend: { display: false } },
          scales: { y: { max: 100, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b' } }, x: { grid: { display: false }, ticks: { color: '#64748b' } } },
          responsive: true, maintainAspectRatio: false
        }
      });
    }
  }, 100);

  // Heatmap
  const heatmap = document.getElementById('heatmap');
  if (heatmap) {
    heatmap.innerHTML = Array.from({ length: 365 }, (_, i) => {
      const level = Math.random() < 0.3 ? 0 : Math.floor(Math.random() * 4) + 1;
      return `<div class="heatmap-cell ${level > 0 ? 'level-' + level : ''}" title="Day ${i+1}: ${level * 2}h" style="aspect-ratio:1;"></div>`;
    }).join('');
  }

  // Achievements
  const achievements = [
    { icon:'🏆', name:'First Task', desc:'Complete your first learning task', unlocked:completed>=1 },
    { icon:'🔥', name:'Streak Starter', desc:'Maintain a 3-day streak', unlocked:appState.streak>=3 },
    { icon:'📚', name:'Course Explorer', desc:'Start 3 different courses', unlocked:true },
    { icon:'🧠', name:'Neural Ninja', desc:'Complete a Deep Learning task', unlocked:tasks.some(t=>t.completed&&t.category==='Deep Learning') },
    { icon:'⚡', name:'Speed Learner', desc:'Complete 5 tasks in a week', unlocked:completed>=5 },
    { icon:'🎮', name:'Game Master', desc:'Score 80+ in ML Quiz', unlocked:parseInt(localStorage.getItem('nt_quiz_hs')||0)>=80 },
    { icon:'💬', name:'NLP Pioneer', desc:'Start an NLP course or task', unlocked:true },
    { icon:'🏅', name:'Top 10', desc:'Reach top 10 on leaderboard', unlocked:false },
    { icon:'🌟', name:'1000 XP', desc:'Earn 1000 XP points', unlocked:appState.xp>=1000 },
    { icon:'🎯', name:'Perfect Score', desc:'Get 100% in any quiz', unlocked:false },
    { icon:'🤖', name:'AI Whisperer', desc:'Use 5 AI suggestions', unlocked:false },
    { icon:'📈', name:'Progress Pro', desc:'Complete all categories', unlocked:false },
  ];
  const grid = document.getElementById('achievements-grid');
  if (grid) {
    grid.innerHTML = achievements.map(a => `
      <div class="achievement-card ${!a.unlocked?'locked':''}">
        <div class="achievement-icon">${a.icon}</div>
        <div class="achievement-name">${a.name}</div>
        <div class="achievement-desc">${a.desc}</div>
        ${a.unlocked ? '<div style="font-size:11px;color:var(--green);margin-top:6px;font-weight:600;">✅ Unlocked</div>' : '<div style="font-size:11px;color:var(--text-muted);margin-top:6px;">🔒 Locked</div>'}
      </div>
    `).join('');
  }
}

// ─── LEADERBOARD ───
const leaderboardData = {
  weekly: [
    { name:'Priya Sharma', country:'🇮🇳 India', xp:3240, streak:21, badges:['🏆','⚡','🔥'], change:'up', avatar:'PS', color:'#6366f1' },
    { name:'Aiden Chen', country:'🇨🇳 China', xp:3100, streak:18, badges:['🧠','⚡'], change:'up', avatar:'AC', color:'#06b6d4' },
    { name:'Sofia Rossi', country:'🇮🇹 Italy', xp:2980, streak:15, badges:['💬','🏅'], change:'down', avatar:'SR', color:'#ec4899' },
    { name:'You', country:'🇮🇳 India', xp:appState.xp, streak:appState.streak, badges:['📊'], change:'up', avatar:'ME', color:'#8b5cf6', isMe:true },
    { name:'Raj Patel', country:'🇮🇳 India', xp:2600, streak:12, badges:['🎮'], change:'same', avatar:'RP', color:'#10b981' },
    { name:'Emma Wilson', country:'🇬🇧 UK', xp:2450, streak:9, badges:['📈'], change:'up', avatar:'EW', color:'#f59e0b' },
    { name:'Luca Ferrari', country:'🇮🇹 Italy', xp:2300, streak:7, badges:['🔬'], change:'down', avatar:'LF', color:'#ef4444' },
    { name:'Mei Lin', country:'🇨🇳 China', xp:2100, streak:6, badges:['🤖'], change:'up', avatar:'ML', color:'#06b6d4' },
    { name:'Carlos Silva', country:'🇧🇷 Brazil', xp:1990, streak:5, badges:['🌟'], change:'same', avatar:'CS', color:'#8b5cf6' },
    { name:'Anna Kowalski', country:'🇵🇱 Poland', xp:1850, streak:4, badges:['💡'], change:'down', avatar:'AK', color:'#f59e0b' },
  ]
};
leaderboardData.monthly = leaderboardData.weekly.map(u => ({...u, xp: u.xp * 4}));
leaderboardData.alltime = leaderboardData.weekly.map(u => ({...u, xp: u.xp * 12}));

function setLBFilter(filter, el) {
  appState.lbFilter = filter;
  document.querySelectorAll('#page-leaderboard .filter-tab').forEach(t=>t.classList.remove('active'));
  if(el) el.classList.add('active');
  renderLeaderboard();
}

function renderLeaderboard() {
  const data = leaderboardData[appState.lbFilter] || leaderboardData.weekly;
  const sorted = [...data].sort((a,b) => b.xp - a.xp);

  // Podium
  const podium = document.getElementById('lb-podium');
  if (podium && sorted.length >= 3) {
    const [first, second, third] = sorted;
    podium.innerHTML = `
      <div class="podium-item second">
        <div style="position:relative;">
          <div class="podium-avatar" style="width:60px;height:60px;background:linear-gradient(135deg,#94a3b8,#64748b)">${second.avatar}</div>
        </div>
        <div class="podium-name">${second.name}</div>
        <div class="podium-xp">${second.xp.toLocaleString()} XP</div>
        <div class="podium-base" style="height:60px;width:80px;">2</div>
      </div>
      <div class="podium-item first">
        <div style="position:relative;">
          <div style="font-size:24px;text-align:center;">👑</div>
          <div class="podium-avatar" style="width:72px;height:72px;background:linear-gradient(135deg,#f59e0b,#ef4444)">${first.avatar}</div>
        </div>
        <div class="podium-name" style="font-size:15px;font-weight:700;">${first.name}</div>
        <div class="podium-xp">${first.xp.toLocaleString()} XP</div>
        <div class="podium-base" style="height:80px;width:80px;">1</div>
      </div>
      <div class="podium-item third">
        <div style="position:relative;">
          <div class="podium-avatar" style="width:56px;height:56px;background:linear-gradient(135deg,#cd7c2f,#b45309)">${third.avatar}</div>
        </div>
        <div class="podium-name">${third.name}</div>
        <div class="podium-xp">${third.xp.toLocaleString()} XP</div>
        <div class="podium-base" style="height:44px;width:80px;">3</div>
      </div>
    `;
  }

  // Table
  const tbody = document.getElementById('lb-table-body');
  if (tbody) {
    tbody.innerHTML = sorted.map((u, i) => `
      <tr class="${u.isMe?'current-user':''}">
        <td class="lb-rank" style="color:${i===0?'#f59e0b':i===1?'#94a3b8':i===2?'#cd7c2f':'var(--text-primary)'}">
          ${i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}
        </td>
        <td>
          <div class="lb-user">
            <div class="lb-avatar" style="background:${u.color}">${u.avatar}</div>
            <div>
              <div class="lb-name">${u.name}${u.isMe?' <span style="font-size:10px;color:var(--cyan);">(You)</span>':''}</div>
              <div class="lb-country">${u.country}</div>
            </div>
          </div>
        </td>
        <td class="lb-xp">${u.xp.toLocaleString()}</td>
        <td class="lb-streak">🔥 ${u.streak} days</td>
        <td class="lb-badges">${u.badges.map(b=>`<span class="lb-badge">${b}</span>`).join('')}</td>
        <td class="lb-change ${u.change}">
          ${u.change==='up'?'▲ +2':u.change==='down'?'▼ -1':'— 0'}
        </td>
      </tr>
    `).join('');
  }
}

// ─── RESOURCES ───
function renderResources() {
  const resources = [
    { icon:'📖', title:'fast.ai Practical DL', desc:'World-class practical deep learning course — free and top-rated globally.', tag:'Course', link:'https://fast.ai', color:'var(--green)' },
    { icon:'🤗', title:'Hugging Face', desc:'The AI community hub for models, datasets, and demos. Essential for NLP.', tag:'Platform', link:'https://huggingface.co', color:'var(--orange)' },
    { icon:'📊', title:'Kaggle', desc:'The world\'s largest data science platform with competitions, datasets, and notebooks.', tag:'Platform', link:'https://kaggle.com', color:'var(--cyan)' },
    { icon:'🧮', title:'Scikit-learn Docs', desc:'Complete documentation and user guide for the most popular ML library.', tag:'Docs', link:'https://scikit-learn.org', color:'var(--orange)' },
    { icon:'🔥', title:'PyTorch Tutorials', desc:'Official PyTorch tutorials from beginner to advanced. Hands-on and practical.', tag:'Tutorial', link:'https://pytorch.org/tutorials', color:'var(--red)' },
    { icon:'📐', title:'Linear Algebra — 3B1B', desc:'Visual, intuitive linear algebra course by 3Blue1Brown. Math made beautiful.', tag:'Video', link:'https://youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab', color:'var(--indigo)' },
    { icon:'🧠', title:'Deep Learning Book', desc:'The authoritative deep learning textbook by Goodfellow, Bengio & Courville. Free online.', tag:'Book', link:'https://www.deeplearningbook.org', color:'var(--purple)' },
    { icon:'🎓', title:'Stanford CS229: ML', desc:'Andrew Ng\'s legendary Stanford ML course with all lecture notes and videos free.', tag:'Course', link:'https://cs229.stanford.edu', color:'var(--cyan)' },
    { icon:'⚡', title:'Papers with Code', desc:'ML research papers with code implementations. Stay up to date with SOTA.', tag:'Research', link:'https://paperswithcode.com', color:'var(--green)' },
    { icon:'🎯', title:'Distill.pub', desc:'Clear, beautiful explanations of ML concepts by top researchers. Visual goldmine.', tag:'Articles', link:'https://distill.pub', color:'var(--pink)' },
    { icon:'🌐', title:'Google ML Crash Course', desc:'Google\'s free practical machine learning crash course with TensorFlow.', tag:'Course', link:'https://developers.google.com/machine-learning/crash-course', color:'var(--orange)' },
    { icon:'📱', title:'ML Glossary', desc:'Definitions and visual explanations of machine learning terms and concepts.', tag:'Reference', link:'https://ml-cheatsheet.readthedocs.io', color:'var(--indigo)' },
  ];

  const grid = document.getElementById('resources-grid');
  if (!grid) return;
  grid.innerHTML = resources.map(r => `
    <div class="resource-card" onclick="window.open('${r.link}','_blank')">
      <div class="resource-icon">${r.icon}</div>
      <div class="resource-title">${r.title}</div>
      <div class="resource-desc">${r.desc}</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px;">
        <span class="tag" style="background:${r.color}22;color:${r.color}">${r.tag}</span>
        <a class="resource-link" href="${r.link}" target="_blank" onclick="event.stopPropagation()">Visit →</a>
      </div>
    </div>
  `).join('');
}

// ─── PROFILE ───
function renderProfile() {
  const u = appState.user;
  const name = u?.name || u?.displayName || u?.email?.split('@')[0] || 'Learner';
  document.getElementById('profile-name-display').textContent = name;
  document.getElementById('profile-email-display').textContent = u?.email || '';
  document.getElementById('p-completed').textContent = appState.tasks.filter(t=>t.completed).length;
  document.getElementById('p-hours').textContent = appState.learningHours + 'h';
  document.getElementById('p-streak').textContent = appState.streak;
  document.getElementById('p-xp').textContent = appState.xp.toLocaleString();
  if (document.getElementById('settings-name')) document.getElementById('settings-name').value = name;
  if (u?.photo) {
    document.getElementById('profile-avatar-display').innerHTML = `<img src="${u.photo}" alt="Avatar">`;
  } else {
    document.getElementById('profile-avatar-display').textContent = name.charAt(0).toUpperCase();
  }
}

function saveSettings() {
  const name = document.getElementById('settings-name')?.value;
  if (name && appState.user) {
    appState.user.name = name;
    localStorage.setItem('neuraltask_user', JSON.stringify(appState.user));
    initUser();
    renderProfile();
  }
  showToast('success', '💾 Saved!', 'Your settings have been updated.');
}

function showEditProfile() {
  navigate('profile', document.querySelector('[data-page=profile]'));
  document.getElementById('settings-name')?.focus();
}

function handleLogout() {
  if (confirm('Are you sure you want to log out?')) {
    localStorage.removeItem('neuraltask_user');
    window.location.href = 'login.html';
  }
}

// ─── SEARCH ───
function handleSearch(query) {
  if (!query) return;
  navigate('courses', document.querySelector('[data-page=courses]'));
  document.getElementById('course-search').value = query;
  filterCourses();
}

// ─── NOTIFICATIONS ───
function showNotifications() {
  showToast('info', '🔔 Notifications', 'You have 3 new updates! Daily goal achieved.');
}

// ─── MODALS ───
function closeAllModals() {
  document.querySelectorAll('.game-modal, .add-task-modal, .video-modal').forEach(m => m.classList.remove('open'));
  document.getElementById('backdrop').classList.remove('open');
  document.getElementById('video-modal-iframe').src = '';
}

// ─── TOAST ───
function showToast(type, title, msg) {
  const toast = document.getElementById('toast');
  document.getElementById('toast-title').textContent = title;
  document.getElementById('toast-msg').textContent = msg;
  document.getElementById('toast-icon').textContent = type==='success'?'✅':type==='error'?'❌':'ℹ️';
  toast.className = `toast ${type}`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

// ─── PARTICLES ───
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];
  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize(); window.addEventListener('resize', resize);
  for(let i=0; i<50; i++) {
    particles.push({ x:Math.random()*window.innerWidth, y:Math.random()*window.innerHeight, vx:(Math.random()-0.5)*0.3, vy:(Math.random()-0.5)*0.3, r:Math.random()*1.5+0.5, color:Math.random()>0.5?'99,102,241':'6,182,212' });
  }
  function anim() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    particles.forEach(p => {
      p.x+=p.vx; p.y+=p.vy;
      if(p.x<0)p.x=canvas.width; if(p.x>canvas.width)p.x=0;
      if(p.y<0)p.y=canvas.height; if(p.y>canvas.height)p.y=0;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(${p.color},0.4)`; ctx.fill();
    });
    requestAnimationFrame(anim);
  }
  anim();
}

window.addEventListener('keydown', e => { if(e.key === 'Escape') closeAllModals(); });
