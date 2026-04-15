// ============================================================================
// DASHBOARD FUNCTIONS - Add functionality without changing UI
// ============================================================================

// ─── Database & API Configuration ─────────────────────────────────────────
const API_BASE = '/api';
const TOKEN = localStorage.getItem('aile_token');

async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TOKEN}`
        }
    };
    if (body) options.body = JSON.stringify(body);
    
    try {
        const response = await fetch(API_BASE + endpoint, options);
        if (!response.ok) {
            console.error(`API Error: ${response.status}`);
            return null;
        }
        return await response.json();
    } catch (err) {
        console.error('API call failed:', err);
        return null;
    }
}

// ─── Application State ──────────────────────────────────────────────────────
const appState = {
    student: null,
    videosWatched: 0,
    quizzesTaken: 0,
    totalXP: 0,
    streak: 0
};

function saveLocalState() {
    if (!appState.student) return;
    const state = {
        xp: appState.totalXP,
        streak: appState.streak,
        lessonsCompleted: appState.videosWatched + appState.quizzesTaken
    };
    localStorage.setItem('aile_learning_state', JSON.stringify(state));
    const student = JSON.parse(localStorage.getItem('aile_student') || '{}');
    student.xp = appState.totalXP;
    student.streak = appState.streak;
    localStorage.setItem('aile_student', JSON.stringify(student));
}

function loadLocalState() {
    const state = JSON.parse(localStorage.getItem('aile_learning_state') || '{}');
    if (state.xp != null) appState.totalXP = state.xp;
    if (state.streak != null) appState.streak = state.streak;
    if (state.lessonsCompleted != null) appState.videosWatched = state.lessonsCompleted;
}

// ─── Initialize Dashboard ──────────────────────────────────────────────────
async function initializeDashboard() {
    if (!TOKEN) {
        console.warn('No token found. Redirecting to login...');
        window.location.replace('/');
        return;
    }
    
    // Load local state first so the dashboard feels responsive
    loadLocalState();
    updateDashboardStats();
    renderVideoLibrary();
    setLessonLandingMessage();

    // Sync with database
    const profile = await apiCall('/profile');
    if (profile) {
        appState.student = profile;
        appState.videosWatched = profile.videosWatched || 0;
        appState.quizzesTaken = profile.quizzesTaken || 0;
        appState.totalXP = profile.xp || appState.totalXP;
        appState.streak = profile.streak || appState.streak;
        
        console.log('✅ Dashboard initialized:', {
            name: profile.name,
            xp: profile.xp,
            streak: profile.streak
        });
        
        updateDashboardStats();
        renderVideoLibrary();
        setLessonLandingMessage();
        saveLocalState();
    }
    
    // Initialize chart
    initializeProgressChart();
}

// ─── Update Dashboard Stats ────────────────────────────────────────────────
function updateDashboardStats() {
    // Update stat cards if they exist in the page
    const statElements = {
        'stat-xp': appState.totalXP,
        'stat-lessons': appState.videosWatched,
        'stat-streak': appState.streak,
        'xp-count': appState.totalXP,
        'streak-count': appState.streak
    };
    
    Object.entries(statElements).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    });
}

// ─── Video Integration ────────────────────────────────────────────────────
const videoLibrary = [
    {
        id: 'ai-fundamentals',
        title: 'AI Fundamentals',
        youtubeId: 'CqOfi41LfDw',
        module: 'decision-trees',
        duration: '12:45'
    },
    {
        id: 'neural-networks',
        title: 'Neural Networks Explained',
        youtubeId: 'aircAruvnKk',
        module: 'neural-networks',
        duration: '18:30'
    },
    {
        id: 'transformers',
        title: 'Transformers & LLMs',
        youtubeId: '4Bdc55j80l8',
        module: 'transformers',
        duration: '16:10'
    },
    {
        id: 'random-forests',
        title: 'Random Forests Explained',
        youtubeId: 'J4Wdy0Wc_xQ',
        module: 'random-forests',
        duration: '14:22'
    },
    {
        id: 'reinforcement-learning',
        title: 'Reinforcement Learning Basics',
        youtubeId: '2pWv7GOvuf0',
        module: 'reinforcement-learning',
        duration: '17:29'
    },
    {
        id: 'gans',
        title: 'GANs for Beginners',
        youtubeId: '8L11aMN5KY8',
        module: 'gans',
        duration: '15:03'
    }
];

const moduleLessons = {
    'decision-trees': {
        title: 'Decision Trees Explained',
        youtubeId: 'CqOfi41LfDw',
        description: 'Learn pruning, entropy, and how decision trees split data for accurate predictions.'
    },
    'neural-networks': {
        title: 'Neural Networks Breakdown',
        youtubeId: 'aircAruvnKk',
        description: 'Explore perceptrons, activation functions, and how neural networks learn from data.'
    },
    'transformers': {
        title: 'Transformers & LLMs Guide',
        youtubeId: '4Bdc55j80l8',
        description: 'Understand attention, encoder-decoder architecture, and modern language models.'
    },
    'random-forests': {
        title: 'Random Forests in Practice',
        youtubeId: 'J4Wdy0Wc_xQ',
        description: 'Discover how ensemble learning and bagging improve model accuracy.'
    },
    'reinforcement-learning': {
        title: 'Reinforcement Learning Basics',
        youtubeId: '2pWv7GOvuf0',
        description: 'Learn Q-learning, policies, and reward-driven training for intelligent agents.'
    },
    'gans': {
        title: 'GANs for Beginners',
        youtubeId: '8L11aMN5KY8',
        description: 'Explore generative adversarial networks and how to create realistic synthetic data.'
    }
};

function renderVideoLibrary() {
    const container = document.getElementById('video-library');
    if (!container) return;
    container.innerHTML = videoLibrary.map(video => `
      <article class="glass p-4 rounded-2xl hover:shadow-xl transition-shadow cursor-pointer"
               onclick="openLecture('${video.id}')">
        <div class="mb-4 rounded-2xl overflow-hidden" style="background:#0f172a;position:relative;aspect-ratio:16/9;">
          <img src="https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg" alt="${video.title}" style="width:100%;height:100%;object-fit:cover;">
          <div style="position:absolute;inset:0;background:linear-gradient(180deg,transparent,rgba(15,23,42,0.85));"></div>
          <div style="position:absolute;bottom:0;left:0;right:0;padding:0.75rem;color:#fff;font-size:0.8rem;display:flex;justify-content:space-between;align-items:center;">
            <span class="font-semibold">${video.duration}</span>
            <span style="background:rgba(255,255,255,0.12);padding:0.25rem 0.5rem;border-radius:999px;">Play</span>
          </div>
        </div>
        <h4 class="font-bold text-sm mb-1">${video.title}</h4>
        <p class="text-xs" style="color:var(--clr-muted)">Tap to launch and earn XP for each watched lesson.</p>
      </article>
    `).join('');
}

function openLecture(videoId) {
    const video = videoLibrary.find(v => v.id === videoId);
    if (!video) {
        showNotification('This lesson is not available yet.', 'error');
        return;
    }
    openModuleLesson(video.module);
}

function openModuleLesson(moduleId) {
    const lesson = moduleLessons[moduleId];
    if (!lesson) {
        showNotification('Module not found yet. Try another module.', 'error');
        return;
    }
    switchMainTab('lesson');
    const output = document.getElementById('lesson-output');
    if (!output) return;
    output.classList.remove('hidden');
    output.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        <div class="glass p-5 rounded-xl lg:col-span-2">
          <div class="flex items-center gap-3 mb-4">
            <span class="text-xs font-semibold px-3 py-1 rounded-full" style="background:rgba(108,99,255,0.18);color:#A78BFA;border:1px solid rgba(108,99,255,0.35)">🎥 Video Lecture</span>
            <h3 class="text-xl font-bold font-display">${lesson.title}</h3>
          </div>
          <p class="text-sm leading-relaxed" style="color:var(--clr-muted)">${lesson.description}</p>
          <button onclick="markVideoWatched('${moduleId}')" class="btn-primary mt-6 px-5 py-3">Mark as Watched & Earn XP</button>
        </div>
        <div class="glass p-5 rounded-xl" style="background:linear-gradient(135deg,rgba(0,212,255,0.08),rgba(108,99,255,0.04))">
          <h4 class="font-semibold mb-3">Video Preview</h4>
          <div class="rounded-2xl overflow-hidden" style="aspect-ratio:16/9;">
            <iframe width="100%" height="100%" src="https://www.youtube.com/embed/${lesson.youtubeId}?rel=0&modestbranding=1" title="${lesson.title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
          </div>
        </div>
      </div>
      <div class="glass p-5 rounded-xl">
        <h4 class="font-bold mb-3">More Learning</h4>
        <p class="text-xs" style="color:var(--clr-muted)">Switch between modules anytime by clicking the cards below or use the AI Lesson Generator to create a tailored lesson.</p>
      </div>
    `;
}

function setLessonLandingMessage() {
    const output = document.getElementById('lesson-output');
    if (!output) return;
    output.classList.remove('hidden');
    output.innerHTML = `
      <div class="text-center py-16" style="color:var(--clr-muted)">
        <p class="text-base font-semibold mb-3">Welcome to the AI Lesson Hub</p>
        <p class="text-sm max-w-xl mx-auto">Use the generator above to create a custom lesson, or choose a module from the library below to start watching curated lectures right inside the dashboard.</p>
      </div>
    `;
}

async function markVideoWatched(videoId) {
    const video = videoLibrary.find(v => v.id === videoId || v.module === videoId);
    if (!video) return;
    
    appState.videosWatched++;
    appState.totalXP += 50;
    
    // Sync to database
    await updateProgressInDB({
        moduleId: 'videos',
        moduleName: 'Video Library',
        completed: appState.videosWatched,
        total: videoLibrary.length
    });
    saveLocalState();
    
    updateDashboardStats();
    showNotification(`✅ ${video.title} marked as watched! (+50 XP)`, 'success');
    console.log('📹 Video watched:', video.title);
}

async function updateProgressInDB(progressData) {
    const result = await apiCall('/progress', 'PATCH', progressData);
    if (result) {
        appState.totalXP = result.xp || appState.totalXP;
        console.log('✅ Progress synced to MongoDB:', progressData.moduleName);
    }
}

// ─── Quiz Engine ──────────────────────────────────────────────────────────
const quizData = [
    {
        id: 1,
        question: 'What does AI stand for?',
        options: ['Artificial Intelligence', 'Artificial Integration', 'Advanced Insight', 'Automated Input'],
        correct: 0
    },
    {
        id: 2,
        question: 'Which algorithm is used for classification?',
        options: ['K-Means', 'Decision Tree', 'Linear Regression', 'Time Series'],
        correct: 1
    },
    {
        id: 3,
        question: 'What is the main goal of supervised learning?',
        options: ['Find patterns', 'Predict outcomes from labeled data', 'Reduce dimensions', 'Cluster data'],
        correct: 1
    },
    {
        id: 4,
        question: 'Which is a type of neural network?',
        options: ['RNN', 'CNN', 'GAN', 'All of the above'],
        correct: 3
    },
    {
        id: 5,
        question: 'What does overfitting mean?',
        options: ['Model too simple', 'Model too complex', 'Model learns too well', 'Model learns noise'],
        correct: 3
    },
    {
        id: 6,
        question: 'Which loss function is common for regression?',
        options: ['Mean Squared Error', 'Cross Entropy', 'Hinge Loss', 'KL Divergence'],
        correct: 0
    }
];

let currentQuiz = null;

function generateQuiz() {
    const shuffled = [...quizData].sort(() => Math.random() - 0.5).slice(0, 3);
    currentQuiz = {
        questions: shuffled,
        answers: [],
        startTime: Date.now()
    };
    console.log('📝 Quiz generated with', shuffled.length, 'questions');
    return currentQuiz;
}

function submitQuizAnswer(questionIndex, answerIndex) {
    if (!currentQuiz) return;
    currentQuiz.answers[questionIndex] = answerIndex;
}

async function completeQuiz() {
    if (!currentQuiz) return;
    
    let correctCount = 0;
    currentQuiz.questions.forEach((q, i) => {
        if (currentQuiz.answers[i] === q.correct) correctCount++;
    });
    
    const score = Math.round((correctCount / currentQuiz.questions.length) * 100);
    const timeSpent = Math.round((Date.now() - currentQuiz.startTime) / 1000);
    
    appState.quizzesTaken++;
    appState.totalXP += score;
    
    // Sync to database
    await updateProgressInDB({
        moduleId: 'quizzes',
        moduleName: 'Knowledge Assessment',
        completed: appState.quizzesTaken,
        total: 10
    });
    saveLocalState();
    
    updateDashboardStats();
    
    const result = {
        score: score,
        correctAnswers: correctCount,
        totalQuestions: currentQuiz.questions.length,
        timeSpent: timeSpent,
        xpEarned: score,
        timestamp: new Date().toISOString()
    };
    
    console.log('📊 Quiz Result:', result);
    showNotification(`Quiz Complete! Score: ${score}% (+${score} XP)`, 'success');
    
    return result;
}

// ─── Interactive Visualization & Tests ────────────────────────────────────
function initializeProgressChart() {
    const chartEl = document.getElementById('learningPathChart');
    if (!chartEl) return;
    
    const ctx = chartEl.getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Introduction', 'Data Preprocessing', 'Supervised Learning', 'Deep Learning'],
            datasets: [{
                label: 'Progress (%)',
                data: [85, 60, 40, 15],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.6)',
                    'rgba(168, 85, 247, 0.6)',
                    'rgba(236, 72, 153, 0.6)',
                    'rgba(34, 197, 94, 0.6)'
                ],
                borderColor: [
                    'rgba(59, 130, 246, 1)',
                    'rgba(168, 85, 247, 1)',
                    'rgba(236, 72, 153, 1)',
                    'rgba(34, 197, 94, 1)'
                ],
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                }
            }
        }
    });
}

// ─── AI Playground: House Price Predictor ────────────────────────────────
class HousePricePredictor {
    constructor() {
        this.coefficient = 200;
        this.intercept = 50000;
    }
    
    predict(squareFeet) {
        return squareFeet * this.coefficient + this.intercept;
    }
    
    formatPrice(price) {
        return '$' + price.toLocaleString();
    }
}

const predictor = new HousePricePredictor();

function predictPrice(squareFeet) {
    const price = predictor.predict(squareFeet);
    return {
        input: squareFeet,
        prediction: price,
        formatted: predictor.formatPrice(price),
        formula: `Area × $${predictor.coefficient} + $${predictor.intercept}`
    };
}

// ─── Neural Network Trainer Game ──────────────────────────────────────────
class NeuralNetworkTrainer {
    constructor() {
        this.weights = [0.5, 0.5];
        this.bias = 0;
    }
    
    setWeights(w1, w2) {
        this.weights = [w1, w2];
    }
    
    setBias(b) {
        this.bias = b;
    }
    
    predict(input) {
        const sum = this.weights[0] * input + this.weights[1] * input + this.bias;
        return Math.tanh(sum);
    }
    
    normalizeOutput(output) {
        return (output + 1) / 2;
    }
    
    getOutput() {
        return this.normalizeOutput(this.predict(0.5));
    }
}

const neuralNetwork = new NeuralNetworkTrainer();

function updateNeuralWeights(w1, w2, bias) {
    neuralNetwork.setWeights(w1, w2);
    neuralNetwork.setBias(bias);
    return neuralNetwork.getOutput();
}

// ─── Notifications ────────────────────────────────────────────────────────
function showNotification(message, type = 'info') {
    const notif = document.createElement('div');
    notif.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white font-semibold glow-effect`;
    
    if (type === 'success') {
        notif.style.background = 'linear-gradient(135deg, #10b981, #34d399)';
    } else if (type === 'error') {
        notif.style.background = 'linear-gradient(135deg, #ef4444, #f87171)';
    } else {
        notif.style.background = 'linear-gradient(135deg, #3b82f6, #60a5fa)';
    }
    
    notif.textContent = message;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
}

// ─── Lesson Generation (from backend) ──────────────────────────────────────
async function generateAILesson(topic, level) {
    const result = await apiCall('/lesson', 'POST', { topic, level });
    if (result) {
        console.log('🤖 Lesson Generated:', {
            title: result.title,
            level: result.level,
            keyPoints: result.keyPoints?.length || 0,
            quizQuestions: result.quiz?.length || 0,
            useCase: result.useCase?.title
        });
        return result;
    }
    return null;
}

// ─── Initialize on page load ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', initializeDashboard);

console.log('✅ Dashboard functions loaded');
