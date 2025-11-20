// Головний серверний файл для книгарні онлайн
// Використовує Node.js, Express, SQLite

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Директорії для даних
const dataDir = path.join(__dirname, 'data');
const xsltDir = path.join(__dirname, 'xslt');

// Створення необхідних директорій
[dataDir, xsltDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Імпорт роутерів
const catalogRouter = require('./routes/catalog');
const ordersRouter = require('./routes/orders');
const xmlRouter = require('./routes/xml');
const authRouter = require('./routes/auth');

// Підключення роутерів
app.use('/api/catalog', catalogRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/xml', xmlRouter);
app.use('/api/auth', authRouter);

// Головна сторінка - вхід
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Каталог клієнта
app.get('/catalog', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Інформаційна сторінка
app.get('/info', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.old.html'));
});

// Сторінка менеджера
app.get('/manager', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'manager.html'));
});

// Обробка помилок 404
app.use((req, res) => {
  res.status(404).json({ error: 'Сторінку не знайдено' });
});

// Глобальний обробник помилок
app.use((err, req, res, next) => {
  console.error('Помилка сервера:', err.stack);
  res.status(500).json({ error: 'Внутрішня помилка сервера' });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер книгарні запущено на http://localhost:${PORT}`);
  console.log(`📚 Каталог: http://localhost:${PORT}/`);
  console.log(`⚙️  Панель менеджера: http://localhost:${PORT}/manager`);
});

module.exports = app;
