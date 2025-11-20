// Модуль для роботи з SQLite базою даних
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'bookstore.db');
const db = new Database(dbPath);

// Ініціалізація таблиць
function initDatabase() {
  console.log('📊 Ініціалізація бази даних SQLite...');

  // Таблиця користувачів (менеджери)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'manager',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Таблиця сесій клієнтів
  db.exec(`
    CREATE TABLE IF NOT EXISTS client_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      phone TEXT,
      city TEXT,
      address TEXT,
      last_login DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Таблиця для логування змін XML
  db.exec(`
    CREATE TABLE IF NOT EXISTS xml_changes_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_type TEXT NOT NULL,
      operation TEXT NOT NULL,
      entity_id TEXT,
      changed_by TEXT,
      change_description TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Перевірка наявності менеджера за замовчуванням
  const managerExists = db.prepare('SELECT * FROM users WHERE username = ?').get('manager');

  if (!managerExists) {
    // Створення менеджера за замовчуванням (manager/manager123)
    db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)')
      .run('manager', 'manager123', 'manager');
    console.log('✅ Створено акаунт менеджера: manager/manager123');
  }

  // Додавання тестових клієнтів
  const testClients = [
    { email: 'anna@example.com', name: 'Анна Коваленко', phone: '+380671234567', city: 'Київ', address: 'вул. Хрещатик, 10, кв. 5' },
    { email: 'bogdan@example.com', name: 'Богдан Петренко', phone: '+380931234567', city: 'Львів', address: 'пр. Свободи, 25, кв. 12' }
  ];

  testClients.forEach(client => {
    const exists = db.prepare('SELECT * FROM client_sessions WHERE email = ?').get(client.email);
    if (!exists) {
      db.prepare('INSERT INTO client_sessions (email, name, phone, city, address) VALUES (?, ?, ?, ?, ?)')
        .run(client.email, client.name, client.phone, client.city, client.address);
      console.log(`✅ Створено тестового клієнта: ${client.name} (${client.email})`);
    }
  });

  console.log('✅ База даних ініціалізована');
}

// Функції для роботи з користувачами
const userQueries = {
  authenticate: (username, password) => {
    return db.prepare('SELECT * FROM users WHERE username = ? AND password = ?')
      .get(username, password);
  },

  getUserByUsername: (username) => {
    return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  }
};

// Функції для роботи з клієнтськими сесіями
const clientQueries = {
  getOrCreateSession: (email) => {
    let session = db.prepare('SELECT * FROM client_sessions WHERE email = ?').get(email);

    if (!session) {
      const result = db.prepare('INSERT INTO client_sessions (email) VALUES (?)').run(email);
      session = db.prepare('SELECT * FROM client_sessions WHERE id = ?').get(result.lastInsertRowid);
    } else {
      // Оновлення часу останнього входу
      db.prepare('UPDATE client_sessions SET last_login = CURRENT_TIMESTAMP WHERE email = ?').run(email);
    }

    return session;
  },

  updateClientInfo: (email, name, phone, city, address) => {
    return db.prepare(
      'UPDATE client_sessions SET name = ?, phone = ?, city = ?, address = ? WHERE email = ?'
    ).run(name, phone, city, address, email);
  },

  getClientInfo: (email) => {
    return db.prepare('SELECT * FROM client_sessions WHERE email = ?').get(email);
  }
};

// Функції для логування змін
const logQueries = {
  logChange: (fileType, operation, entityId, changedBy, description) => {
    return db.prepare(
      'INSERT INTO xml_changes_log (file_type, operation, entity_id, changed_by, change_description) VALUES (?, ?, ?, ?, ?)'
    ).run(fileType, operation, entityId, changedBy, description);
  },

  getChangeLogs: (limit = 100) => {
    return db.prepare('SELECT * FROM xml_changes_log ORDER BY timestamp DESC LIMIT ?').all(limit);
  },

  getChangeLogsByEntity: (entityId) => {
    return db.prepare('SELECT * FROM xml_changes_log WHERE entity_id = ? ORDER BY timestamp DESC').all(entityId);
  }
};

// Ініціалізація при завантаженні модуля
initDatabase();

module.exports = {
  db,
  userQueries,
  clientQueries,
  logQueries
};
