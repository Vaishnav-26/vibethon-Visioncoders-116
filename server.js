const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'ai_learn_explorer_super_secret_jwt_key_2024';

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── MongoDB Connection (auto in-memory fallback) ─────────────────────────────
async function connectDB() {
  const localUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai_learn_explorer';
  try {
    await mongoose.connect(localUri, { serverSelectionTimeoutMS: 3000 });
    console.log('✅  MongoDB connected (local)');
  } catch {
    console.log('⚠️  Local MongoDB not found — starting in-memory database…');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const memServer = await MongoMemoryServer.create();
    const memUri = memServer.getUri();
    await mongoose.connect(memUri);
    console.log('✅  MongoDB connected (in-memory) — data resets on server restart');
  }
}
connectDB();

// ─── Mongoose Schema ───────────────────────────────────────────────────────────
const progressEntrySchema = new mongoose.Schema({
  moduleId:    { type: String, required: true },
  moduleName:  { type: String, required: true },
  completed:   { type: Number, default: 0 },   // lessons completed
  total:       { type: Number, default: 0 },   // total lessons
  lastStudied: { type: Date, default: Date.now }
});

const studentSchema = new mongoose.Schema(
  {
    name:      { type: String, required: true, trim: true },
    studentID: { type: String, required: true, unique: true, trim: true },
    email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:  { type: String, required: true },
    level:     {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    xp:        { type: Number, default: 0 },
    streak:    { type: Number, default: 0 },
    lastLogin: { type: Date },
    progress: [progressEntrySchema],
    completedModules: [{
      moduleId:    String,
      moduleName:  String,
      score:       Number,
      completedAt: { type: Date, default: Date.now }
    }]
  },
  { timestamps: true }
);

// Hash password before saving
studentSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const Student = mongoose.model('Student', studentSchema);

// ─── Auth Middleware ───────────────────────────────────────────────────────────
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ─── Helper ────────────────────────────────────────────────────────────────────
function issueToken(student) {
  return jwt.sign(
    { id: student._id, studentID: student.studentID, email: student.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// ─── Routes ───────────────────────────────────────────────────────────────────

/** POST /api/register */
app.post('/api/register', async (req, res) => {
  try {
    const { name, studentID, email, password, level } = req.body;

    if (!name || !studentID || !email || !password)
      return res.status(400).json({ error: 'All fields are required.' });

    const exists = await Student.findOne({ $or: [{ email }, { studentID }] });
    if (exists)
      return res.status(409).json({ error: 'Email or Student ID already registered.' });

    const student = await Student.create({ name, studentID, email, password, level: level || 'beginner' });
    const token = issueToken(student);

    res.status(201).json({
      message: 'Registration successful!',
      token,
      student: {
        id: student._id,
        name: student.name,
        studentID: student.studentID,
        email: student.email,
        level: student.level,
        xp: student.xp,
        streak: student.streak
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

/** POST /api/login */
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required.' });

    const student = await Student.findOne({ email });
    if (!student) return res.status(401).json({ error: 'Invalid credentials.' });

    const match = await bcrypt.compare(password, student.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials.' });

    // Update streak logic
    const now = new Date();
    if (student.lastLogin) {
      const diffMs = now - student.lastLogin;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 1) student.streak += 1;
      else if (diffDays > 1) student.streak = 1;
    } else {
      student.streak = 1;
    }
    student.lastLogin = now;
    await student.save();

    const token = issueToken(student);

    res.json({
      message: 'Login successful!',
      token,
      student: {
        id: student._id,
        name: student.name,
        studentID: student.studentID,
        email: student.email,
        level: student.level,
        xp: student.xp,
        streak: student.streak,
        progress: student.progress
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

/** GET /api/profile  (protected) */
app.get('/api/profile', authenticate, async (req, res) => {
  try {
    const student = await Student.findById(req.user.id).select('-password');
    if (!student) return res.status(404).json({ error: 'Student not found.' });
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

/** PATCH /api/progress  (protected) – update a module's progress */
app.patch('/api/progress', authenticate, async (req, res) => {
  try {
    const { moduleId, moduleName, completed, total } = req.body;
    const student = await Student.findById(req.user.id);
    if (!student) return res.status(404).json({ error: 'Student not found.' });

    const entry = student.progress.find((p) => p.moduleId === moduleId);
    if (entry) {
      entry.completed = completed;
      entry.total = total;
      entry.lastStudied = new Date();
    } else {
      student.progress.push({ moduleId, moduleName, completed, total });
    }

    // Award XP (10 per completed lesson)
    student.xp = student.progress.reduce((acc, p) => acc + p.completed * 10, 0);

    await student.save();
    res.json({ xp: student.xp, progress: student.progress });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── Gemini Mock Lessons ──────────────────────────────────────────────────────
function getMockLesson(topic, level) {
  const bank = {
    'Decision Trees': {
      title: 'Decision Trees: Branch-Based Learning',
      level,
      concept: 'A Decision Tree is a supervised ML algorithm that splits data using a tree-like flowchart. At each internal node a feature is evaluated; branches represent outcomes; leaf nodes hold predictions.\n\nThe key insight: metrics like Information Gain (entropy) and Gini Impurity guide which feature creates the "purest" split — separating classes most cleanly.\n\nAt the ' + level + ' level, mastering pruning (limiting depth, min_samples_split) is crucial to prevent overfitting and build generalizable models.',
      keyPoints: ['Splits data by maximising Information Gain or minimising Gini Impurity', 'Leaf nodes hold class labels (classification) or mean values (regression)', 'Deep trees overfit — control with max_depth, pruning, or min_samples_leaf', 'Foundation for Random Forest and Gradient Boosting ensembles'],
      useCase: { title: 'Spam Email Detection', description: 'Decision trees classify e-mails as spam/ham by evaluating features like keyword presence, sender reputation, and link count — interpretable enough for regulatory review.', example: "Gmail's spam filter uses hundreds of tree-based rules: 'subject contains \"FREE\"' → weight 0.8 → spam probability high." },
      quiz: [
        { question: 'Which metric does a Decision Tree primarily use to choose the best split?', options: ['Mean Squared Error', 'Information Gain / Gini Impurity', 'Cosine Similarity', 'Pearson Correlation'], correct: 1, explanation: 'Information Gain (entropy-based) and Gini Impurity both measure how well a split separates classes into pure subsets.' },
        { question: 'What problem arises when a Decision Tree grows too deep?', options: ['Underfitting', 'Overfitting', 'Gradient explosion', 'Vanishing gradients'], correct: 1, explanation: 'A very deep tree memorises training noise, losing generalisation. Solved with max_depth, pruning, or min_samples_split.' },
        { question: 'Which ensemble method trains many Decision Trees in parallel on data subsets?', options: ['AdaBoost', 'XGBoost', 'Random Forest', 'Gradient Boosting'], correct: 2, explanation: 'Random Forest uses bagging — training trees on random subsets and averaging outputs — to reduce variance dramatically.' }
      ]
    },
    'Neural Networks': {
      title: 'Neural Networks: Learning Like the Brain',
      level,
      concept: 'Artificial Neural Networks (ANNs) stack layers of neurons: input → hidden → output. Each connection carries a learnable weight updated through training.\n\nThe core training loop: forward pass (compute prediction) → loss function (measure error) → backpropagation (chain-rule gradients) → gradient descent (update weights).\n\nAt ' + level + ' level, understanding activation functions (ReLU, sigmoid, softmax) is essential — they introduce the non-linearity that lets networks approximate any function.',
      keyPoints: ['Neurons apply a weighted sum then an activation function (ReLU, sigmoid)', 'Backpropagation computes ∂Loss/∂weight via the chain rule', 'Deeper networks learn hierarchical representations: edges → shapes → objects', 'Dropout and Batch Normalisation are key regularisation techniques'],
      useCase: { title: 'Medical Image Diagnosis', description: 'CNNs detect tumours in X-rays, MRI scans, and retinal images with radiologist-level accuracy, processing thousands of scans faster than any human.', example: 'Google DeepMind\'s CNN detected 50+ eye diseases from retinal scans with 94% accuracy, trained on 128,000 images.' },
      quiz: [
        { question: 'Why do neural networks use non-linear activation functions?', options: ['To speed up training', 'To introduce non-linearity so networks can learn complex patterns', 'To normalise input data', 'To reduce the number of parameters'], correct: 1, explanation: 'Without non-linear activations, stacking layers is equivalent to a single linear transformation — incapable of learning complex mappings.' },
        { question: 'What does backpropagation compute?', options: ['The final output', 'Optimal learning rate', 'Gradients of loss with respect to each weight', 'Number of hidden layers needed'], correct: 2, explanation: 'Backprop applies the chain rule backwards through the network, computing how much each weight contributed to the total error.' },
        { question: 'Which activation is most commonly used in hidden layers of modern networks?', options: ['Sigmoid', 'Tanh', 'ReLU', 'Softmax'], correct: 2, explanation: 'ReLU (max(0,x)) avoids vanishing gradients, is computationally cheap, and converges faster than sigmoid/tanh in deep networks.' }
      ]
    },
    'Transformers': {
      title: 'Transformers & Attention Mechanisms',
      level,
      concept: 'The Transformer architecture, introduced in "Attention Is All You Need" (2017), replaced RNNs with self-attention — allowing every token in a sequence to attend to every other token simultaneously.\n\nSelf-attention computes Query, Key, Value matrices: Attention(Q,K,V) = softmax(QKᵀ/√d)V. This captures long-range dependencies in O(n²) time regardless of sequence distance.\n\nAt ' + level + ' level, understanding multi-head attention (learning multiple representation subspaces) and positional encoding (injecting sequence order) is critical.',
      keyPoints: ['Self-attention lets each token attend to all others — captures long-range dependencies', 'Multi-head attention learns different relationship types in parallel subspaces', 'Positional encoding adds order information (sine/cosine or learned embeddings)', 'BERT uses encoder-only; GPT uses decoder-only; T5 uses full encoder-decoder'],
      useCase: { title: 'Large Language Models (ChatGPT, Gemini)', description: 'LLMs like GPT-4 and Gemini are Transformers trained on trillions of tokens, enabling fluent conversation, code generation, and complex reasoning.', example: 'GPT-4 has ~1.8T parameters across 120 Transformer layers, trained on 13 trillion tokens — generating text token-by-token using causal self-attention.' },
      quiz: [
        { question: 'What is the core operation in a Transformer\'s self-attention mechanism?', options: ['Convolution over input windows', 'Recurrent hidden state update', 'Query-Key-Value dot-product attention', 'Max-pooling across time steps'], correct: 2, explanation: 'Self-attention computes Attention(Q,K,V) = softmax(QKᵀ/√d)V, letting each token create a weighted mix of all other tokens\' values.' },
        { question: 'Why do Transformers need positional encoding?', options: ['To reduce model size', 'Because attention is permutation-invariant and needs order information', 'To speed up matrix multiplication', 'To prevent gradient explosion'], correct: 1, explanation: 'Self-attention treats input as a set (order-agnostic). Positional encodings inject sequence position so the model understands word order.' },
        { question: 'Which architecture uses encoder-only Transformers?', options: ['GPT-4', 'BERT', 'T5', 'Whisper'], correct: 1, explanation: 'BERT (Bidirectional Encoder Representations from Transformers) uses only the encoder stack, enabling bidirectional context for classification/NER.' }
      ]
    }
  };
  const key = Object.keys(bank).find(k => topic.toLowerCase().includes(k.toLowerCase())) || 'Decision Trees';
  return bank[key];
}

/** POST /api/generate-lesson (protected) */
async function handleLessonGeneration(req, res) {
  try {
    const { topic, level } = req.body;
    if (!topic || !level) return res.status(400).json({ error: 'topic and level are required.' });

    // ── Try Gemini if API key is configured ──────────────────
    if (process.env.GEMINI_API_KEY) {
      try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `You are an AI/ML educational content creator. Generate a lesson.\nTopic: ${topic}\nLevel: ${level}\n\nReturn ONLY valid JSON — no markdown, no backticks, no extra text. Use this exact structure:\n{\n  "title": "concise lesson title",\n  "level": "${level}",\n  "concept": "Clear 2-3 paragraph explanation appropriate for ${level} level",\n  "keyPoints": ["insight 1", "insight 2", "insight 3", "insight 4"],\n  "useCase": {\n    "title": "Real-world application name",\n    "description": "How ${topic} is applied in the real world (2-3 sentences)",\n    "example": "A specific concrete example with numbers or context"\n  },\n  "quiz": [\n    { "question": "Q1?", "options": ["A","B","C","D"], "correct": 0, "explanation": "Why A" },\n    { "question": "Q2?", "options": ["A","B","C","D"], "correct": 1, "explanation": "Why B" },\n    { "question": "Q3?", "options": ["A","B","C","D"], "correct": 2, "explanation": "Why C" }\n  ]\n}`;

        const result = await model.generateContent(prompt);
        const text   = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const lesson = JSON.parse(jsonMatch[0]);
          return res.json(lesson);
        }
      } catch (geminiErr) {
        console.warn('Gemini API error, falling back to mock:', geminiErr.message);
      }
    }

    // ── Mock fallback (no API key or Gemini error) ────────────
    res.json(getMockLesson(topic, level));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lesson generation failed.' });
  }
}

app.post('/api/generate-lesson', authenticate, handleLessonGeneration);
app.post('/api/lesson', authenticate, handleLessonGeneration);

/** POST /api/quiz (protected) */
app.post('/api/quiz', authenticate, async (req, res) => {
  try {
    const { moduleId, moduleName, score, total } = req.body;
    if (!moduleId || !moduleName || typeof score !== 'number' || typeof total !== 'number') {
      return res.status(400).json({ error: 'moduleId, moduleName, score and total are required.' });
    }

    const student = await Student.findById(req.user.id);
    if (!student) return res.status(404).json({ error: 'Student not found.' });

    const entry = student.progress.find(p => p.moduleId === moduleId);
    const completed = Math.min(score, total);

    if (entry) {
      entry.completed = completed;
      entry.total = total;
      entry.lastStudied = new Date();
    } else {
      student.progress.push({ moduleId, moduleName, completed, total });
    }

    student.xp += score;
    await student.save();

    res.json({ xp: student.xp, progress: student.progress });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Quiz submission failed.' });
  }
});

/** POST /api/complete-module (protected) */
app.post('/api/complete-module', authenticate, async (req, res) => {
  try {
    const { moduleId, moduleName, score } = req.body;
    const student = await Student.findById(req.user.id);
    if (!student) return res.status(404).json({ error: 'Student not found.' });

    const already = student.completedModules.find(m => m.moduleId === moduleId);
    if (!already) {
      student.completedModules.push({ moduleId, moduleName, score: score || 100 });
      student.xp += 50; // Module completion bonus
    }
    await student.save();
    res.json({ xp: student.xp, completedModules: student.completedModules });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── Page routing ───────────────────────────────────────────────────────────
app.get('/', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
);
app.get('/auth', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'auth.html'))
);
app.get('/dashboard', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'))
);
app.get('*', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
);

// ─── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () =>
  console.log(`🚀  AI-Learn Explorer server running at http://localhost:${PORT}`)
);
