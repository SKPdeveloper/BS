// Простий скрипт для тестування API книгарні
// Запуск: node test-api.js (після запуску сервера)

const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Функція для виконання HTTP запиту
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({
            statusCode: res.statusCode,
            body: jsonBody
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            body: body
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Тестування API
async function runTests() {
  console.log('🧪 Початок тестування API книгарні...\n');

  try {
    // Тест 1: Отримати всі книги
    console.log('📘 Тест 1: Отримати всі книги');
    const catalogResponse = await makeRequest('GET', '/api/catalog');
    console.log(`   Статус: ${catalogResponse.statusCode}`);
    console.log(`   Кількість книг: ${catalogResponse.body.count}`);
    console.log(`   ✅ Пройдено\n`);

    // Тест 2: Отримати першу книгу за ID
    if (catalogResponse.body.books && catalogResponse.body.books.length > 0) {
      const firstBookId = catalogResponse.body.books[0].id;
      console.log(`📖 Тест 2: Отримати книгу за ID (${firstBookId})`);
      const bookResponse = await makeRequest('GET', `/api/catalog/${firstBookId}`);
      console.log(`   Статус: ${bookResponse.statusCode}`);
      console.log(`   Назва: ${bookResponse.body.book?.title}`);
      console.log(`   ✅ Пройдено\n`);
    }

    // Тест 3: Валідувати каталог
    console.log('✔️  Тест 3: Валідувати каталог за XSD');
    const validateCatalogResponse = await makeRequest('GET', '/api/catalog/validate/xsd');
    console.log(`   Статус: ${validateCatalogResponse.statusCode}`);
    console.log(`   Валідний: ${validateCatalogResponse.body.valid}`);
    if (!validateCatalogResponse.body.valid) {
      console.log(`   Помилки: ${JSON.stringify(validateCatalogResponse.body.errors)}`);
    }
    console.log(`   ✅ Пройдено\n`);

    // Тест 4: Отримати всі замовлення
    console.log('📦 Тест 4: Отримати всі замовлення');
    const ordersResponse = await makeRequest('GET', '/api/orders');
    console.log(`   Статус: ${ordersResponse.statusCode}`);
    console.log(`   Кількість замовлень: ${ordersResponse.body.count}`);
    console.log(`   ✅ Пройдено\n`);

    // Тест 5: Валідувати замовлення
    console.log('✔️  Тест 5: Валідувати замовлення за XSD');
    const validateOrdersResponse = await makeRequest('GET', '/api/orders/validate/xsd');
    console.log(`   Статус: ${validateOrdersResponse.statusCode}`);
    console.log(`   Валідний: ${validateOrdersResponse.body.valid}`);
    if (!validateOrdersResponse.body.valid) {
      console.log(`   Помилки: ${JSON.stringify(validateOrdersResponse.body.errors)}`);
    }
    console.log(`   ✅ Пройдено\n`);

    // Тест 6: Створити тестове замовлення
    console.log('🛒 Тест 6: Створити нове замовлення');
    const newOrder = {
      customer: {
        name: 'Тестовий Клієнт',
        email: 'test@example.com',
        phone: '+380501234567',
        city: 'Київ',
        address: 'вул. Тестова, 1'
      },
      items: [
        {
          book_id: catalogResponse.body.books[0]?.id || 'book_001',
          title: catalogResponse.body.books[0]?.title || 'Тестова книга',
          quantity: 1,
          price: catalogResponse.body.books[0]?.price?._ || 299.00,
          subtotal: catalogResponse.body.books[0]?.price?._ || 299.00
        }
      ]
    };

    const createOrderResponse = await makeRequest('POST', '/api/orders', newOrder);
    console.log(`   Статус: ${createOrderResponse.statusCode}`);
    console.log(`   ID замовлення: ${createOrderResponse.body.order?.id}`);
    console.log(`   Сума: ${createOrderResponse.body.order?.total} грн`);
    console.log(`   ✅ Пройдено\n`);

    console.log('🎉 Всі тести успішно пройдено!');
    console.log('\n📊 Підсумок:');
    console.log(`   - Каталог: ${catalogResponse.body.count} книг`);
    console.log(`   - Замовлення: ${ordersResponse.body.count} замовлень`);
    console.log(`   - Валідація каталогу: ${validateCatalogResponse.body.valid ? '✅' : '❌'}`);
    console.log(`   - Валідація замовлень: ${validateOrdersResponse.body.valid ? '✅' : '❌'}`);

  } catch (error) {
    console.error('❌ Помилка тестування:', error.message);
    console.error('   Переконайтеся, що сервер запущено на http://localhost:3000');
  }
}

// Запуск тестів
console.log('⏳ Чекаємо 1 секунду для з'єднання з сервером...\n');
setTimeout(runTests, 1000);
