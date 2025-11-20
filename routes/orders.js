// Роутер для роботи із замовленнями
const express = require('express');
const router = express.Router();
const {
  getOrders,
  saveOrders,
  generateOrderId,
  logXMLChange,
  validateXMLAgainstXSD,
  loadXMLFile
} = require('../utils/xmlUtils');
const { clientQueries } = require('../database');

/**
 * GET /api/orders
 * Отримати всі замовлення або замовлення конкретного клієнта
 */
router.get('/', async (req, res) => {
  try {
    const orders = await getOrders();
    const email = req.query.email;

    // Фільтрація за email клієнта
    if (email) {
      const clientOrders = orders.filter(order =>
        order.customer && order.customer.email === email
      );
      return res.json({ success: true, count: clientOrders.length, orders: clientOrders });
    }

    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/orders/:id
 * Отримати замовлення за ID
 */
router.get('/:id', async (req, res) => {
  try {
    const orders = await getOrders();
    const order = orders.find(o => (o.$ && o.$.id === req.params.id) || o.id === req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Замовлення не знайдено' });
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/orders
 * Створити нове замовлення
 */
router.post('/', async (req, res) => {
  try {
    const { customer, items } = req.body;

    // Валідація
    if (!customer || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Не вистачає даних для створення замовлення'
      });
    }

    // Підрахунок загальної суми
    const total = items.reduce((sum, item) => {
      const price = parseFloat(item.price);
      const quantity = parseInt(item.quantity);
      return sum + (price * quantity);
    }, 0);

    const orders = await getOrders();
    const currentDate = new Date().toISOString();
    const orderId = generateOrderId();

    const newOrder = {
      $: {
        id: orderId,
        date: currentDate,
        status: 'нове'
      },
      customer: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        city: customer.city,
        address: customer.address
      },
      items: {
        item: items.map(item => {
          const price = parseFloat(item.price);
          const quantity = parseInt(item.quantity);
          const subtotal = price * quantity;
          return {
            $: {
              book_id: item.bookId || item.book_id,
              quantity: quantity
            },
            title: item.title,
            price: price.toFixed(2),
            subtotal: subtotal.toFixed(2)
          };
        })
      },
      total: total.toFixed(2),
      statusHistory: {
        statusChange: [{
          $: {
            date: currentDate,
            status: 'нове',
            comment: 'Замовлення створено клієнтом'
          }
        }]
      },
      notes: ''
    };

    orders.push(newOrder);
    await saveOrders(orders);

    // Оновити інформацію про клієнта
    clientQueries.updateClientInfo(
      customer.email,
      customer.name,
      customer.phone,
      customer.city,
      customer.address
    );

    logXMLChange('orders', 'CREATE', orderId, customer.email,
      `Створено замовлення на суму ${total.toFixed(2)} грн`);

    res.json({
      success: true,
      message: 'Замовлення успішно створено',
      order: {
        id: orderId,
        orderNumber: orderId,
        date: currentDate,
        status: 'нове',
        customer: newOrder.customer,
        items: newOrder.items,
        total: total.toFixed(2),
        totalPrice: total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/orders/:id/status
 * Змінити статус замовлення (тільки для менеджера)
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, comment } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Статус не вказано'
      });
    }

    const orders = await getOrders();
    const orderIndex = orders.findIndex(o => (o.$ && o.$.id === req.params.id) || o.id === req.params.id);

    if (orderIndex === -1) {
      return res.status(404).json({ success: false, error: 'Замовлення не знайдено' });
    }

    // Оновлення статусу (підтримка обох форматів)
    if (orders[orderIndex].$) {
      orders[orderIndex].$.status = status;
    } else {
      orders[orderIndex].status = status;
    }

    // Додавання запису в історію
    const currentDate = new Date().toISOString();
    const newStatusChange = {
      $: {
        date: currentDate,
        status: status,
        comment: comment || `Статус змінено на "${status}"`
      }
    };

    // Перевірка структури statusHistory
    if (!orders[orderIndex].statusHistory) {
      orders[orderIndex].statusHistory = { statusChange: [] };
    }

    if (!Array.isArray(orders[orderIndex].statusHistory.statusChange)) {
      orders[orderIndex].statusHistory.statusChange = [orders[orderIndex].statusHistory.statusChange];
    }

    orders[orderIndex].statusHistory.statusChange.push(newStatusChange);

    await saveOrders(orders);

    logXMLChange('orders', 'UPDATE_STATUS', req.params.id, req.body.manager || 'manager',
      `Змінено статус на "${status}"`);

    res.json({
      success: true,
      message: 'Статус замовлення оновлено',
      order: orders[orderIndex]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/orders/:id/notes
 * Додати або оновити примітки до замовлення
 */
router.patch('/:id/notes', async (req, res) => {
  try {
    const { notes } = req.body;

    const orders = await getOrders();
    const orderIndex = orders.findIndex(o => (o.$ && o.$.id === req.params.id) || o.id === req.params.id);

    if (orderIndex === -1) {
      return res.status(404).json({ success: false, error: 'Замовлення не знайдено' });
    }

    orders[orderIndex].notes = notes || '';
    await saveOrders(orders);

    logXMLChange('orders', 'UPDATE_NOTES', req.params.id, req.body.manager || 'manager',
      'Оновлено примітки до замовлення');

    res.json({
      success: true,
      message: 'Примітки оновлено',
      order: orders[orderIndex]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/orders/validate/xsd
 * Валідувати замовлення за XSD схемою
 */
router.get('/validate/xsd', async (req, res) => {
  try {
    const xmlContent = loadXMLFile('orders.xml');
    const validation = validateXMLAgainstXSD(xmlContent, 'orders.xsd');

    res.json({
      success: true,
      valid: validation.valid,
      errors: validation.errors
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
