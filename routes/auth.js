// Роутер для аутентифікації та тестових даних
const express = require('express');
const router = express.Router();
const { userQueries, clientQueries } = require('../database');

/**
 * POST /api/auth/login/manager
 * Вхід для менеджера
 */
router.post('/login/manager', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Введіть логін та пароль'
      });
    }

    const user = userQueries.authenticate(username, password);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Невірний логін або пароль'
      });
    }

    res.json({
      success: true,
      user: {
        username: user.username,
        role: user.role
      },
      message: 'Успішний вхід'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/auth/login/client
 * Вхід для клієнта (за email)
 */
router.post('/login/client', (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Введіть email'
      });
    }

    // Валідація email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Невірний формат email'
      });
    }

    const session = clientQueries.getOrCreateSession(email);

    res.json({
      success: true,
      user: {
        email: session.email,
        name: session.name,
        phone: session.phone,
        city: session.city,
        address: session.address,
        role: 'client'
      },
      message: 'Успішний вхід'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/auth/test-users
 * Отримати список тестових користувачів
 */
router.get('/test-users', (req, res) => {
  try {
    const testUsers = {
      manager: {
        username: 'manager',
        password: 'manager123',
        role: 'manager',
        description: 'Тестовий менеджер з повним доступом'
      },
      clients: [
        {
          email: 'anna@example.com',
          name: 'Анна Коваленко',
          city: 'Київ',
          description: 'Тестовий клієнт 1'
        },
        {
          email: 'bogdan@example.com',
          name: 'Богдан Петренко',
          city: 'Львів',
          description: 'Тестовий клієнт 2'
        }
      ]
    };

    res.json({
      success: true,
      testUsers
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
