const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3456;
const HOST = '127.0.0.1';
const DATA_FILE = path.join(__dirname, 'data.json');
const EMPTY_DATA = { todos: [], weekTodos: [], projects: [], goal: '' };

app.use(cors());
app.use(express.json());

// 初始化数据文件
function initData() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(EMPTY_DATA, null, 2));
  }
}

function normalizeData(data) {
  return {
    ...EMPTY_DATA,
    ...data,
    todos: Array.isArray(data.todos) ? data.todos : [],
    weekTodos: Array.isArray(data.weekTodos) ? data.weekTodos : [],
    projects: Array.isArray(data.projects) ? data.projects : [],
    goal: typeof data.goal === 'string' ? data.goal : ''
  };
}

// 读取数据
function readData() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return normalizeData(JSON.parse(data));
  } catch {
    return { ...EMPTY_DATA };
  }
}

// 保存数据
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// API 路由
app.get('/api/todos', (req, res) => {
  initData();
  const data = readData();
  res.json(data.todos);
});

app.post('/api/todos', (req, res) => {
  initData();
  const data = readData();
  data.todos = req.body;
  saveData(data);
  res.json({ success: true });
});

app.get('/api/goal', (req, res) => {
  initData();
  const data = readData();
  res.json({ goal: data.goal || '' });
});

app.post('/api/goal', (req, res) => {
  initData();
  const data = readData();
  data.goal = req.body.goal;
  saveData(data);
  res.json({ success: true });
});

// 周计划 API
app.get('/api/week-todos', (req, res) => {
  initData();
  const data = readData();
  res.json(data.weekTodos || []);
});

app.post('/api/week-todos', (req, res) => {
  initData();
  const data = readData();
  data.weekTodos = req.body;
  saveData(data);
  res.json({ success: true });
});

// 项目 API
app.get('/api/projects', (req, res) => {
  initData();
  const data = readData();
  res.json(data.projects || []);
});

app.post('/api/projects', (req, res) => {
  initData();
  const data = readData();
  data.projects = req.body;
  saveData(data);
  res.json({ success: true });
});

app.listen(PORT, HOST, () => {
  console.log('API server running on http://' + HOST + ':' + PORT);
});
