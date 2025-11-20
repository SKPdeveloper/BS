// Скрипт для додавання тестових даних
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const { parseString, Builder } = require('xml2js');

const db = new Database('./data/bookstore.db');
const catalogPath = './data/catalog.xml';
const ordersPath = './data/orders.xml';

console.log('📊 Додавання тестових даних...\n');

// 1. Додати нових клієнтів
console.log('👥 Додавання нових клієнтів...');
const newClients = [
  { email: 'olena@example.com', name: 'Олена Шевченко', phone: '+380501234567', city: 'Одеса', address: 'вул. Дерибасівська, 15, кв. 8' },
  { email: 'ivan@example.com', name: 'Іван Мельник', phone: '+380671234568', city: 'Харків', address: 'просп. Науки, 45, кв. 22' },
  { email: 'maria@example.com', name: 'Марія Бондаренко', phone: '+380931234569', city: 'Дніпро', address: 'вул. Робоча, 78, кв. 5' }
];

const insertClient = db.prepare('INSERT OR IGNORE INTO client_sessions (email, name, phone, city, address) VALUES (?, ?, ?, ?, ?)');
newClients.forEach(client => {
  insertClient.run(client.email, client.name, client.phone, client.city, client.address);
  console.log(`  ✅ ${client.name} (${client.email})`);
});

// 2. Додати історію змін
console.log('\n📜 Додавання історії XML операцій...');
const logEntries = [
  { type: 'catalog', operation: 'create', user: 'manager', details: 'Додано нову книгу: "Сто років самотності"' },
  { type: 'catalog', operation: 'update', user: 'manager', details: 'Оновлено ціну книги: "Майстер і Маргарита"' },
  { type: 'catalog', operation: 'update', user: 'manager', details: 'Змінено кількість на складі: "Clean Code"' },
  { type: 'orders', operation: 'create', user: 'anna@example.com', details: 'Створено замовлення ORD-100001' },
  { type: 'orders', operation: 'update', user: 'manager', details: 'Змінено статус замовлення ORD-100001: нове → обробляється' },
  { type: 'orders', operation: 'create', user: 'bogdan@example.com', details: 'Створено замовлення ORD-100002' },
  { type: 'catalog', operation: 'import', user: 'manager', details: 'Імпортовано каталог з XML файлу (оновлено 5 книг)' },
  { type: 'catalog', operation: 'validate', user: 'manager', details: 'Валідація каталогу за XSD схемою - успішно' },
  { type: 'orders', operation: 'validate', user: 'manager', details: 'Валідація замовлень за XSD схемою - успішно' },
  { type: 'orders', operation: 'export', user: 'manager', details: 'Експортовано замовлення в XML файл' },
  { type: 'catalog', operation: 'delete', user: 'manager', details: 'Видалено книгу: "Застаріла книга"' },
  { type: 'catalog', operation: 'create', user: 'manager', details: 'Додано книгу: "Гаррі Поттер і Філософський камінь"' },
  { type: 'orders', operation: 'create', user: 'olena@example.com', details: 'Створено замовлення ORD-100005' },
  { type: 'catalog', operation: 'update', user: 'manager', details: 'Змінено опис книги: "Sapiens"' },
  { type: 'orders', operation: 'update', user: 'manager', details: 'Змінено статус замовлення ORD-100003: відправлено → виконано' }
];

const insertLog = db.prepare('INSERT INTO xml_changes_log (file_type, operation, changed_by, change_description) VALUES (?, ?, ?, ?)');
logEntries.forEach(entry => {
  insertLog.run(entry.type, entry.operation, entry.user, entry.details);
  console.log(`  ✅ ${entry.type} - ${entry.operation}: ${entry.details}`);
});

// 3. Додати нові книги в XML
console.log('\n📚 Додавання нових книг в каталог...');
const catalogXml = fs.readFileSync(catalogPath, 'utf8');

parseString(catalogXml, (err, result) => {
  if (err) {
    console.error('Помилка парсингу XML:', err);
    return;
  }

  const newBooks = [
    {
      id: 'book_021', deleted: false,
      title: 'Гаррі Поттер і Філософський камінь',
      author: 'Дж. К. Роулінг',
      category: 'дитяча',
      price: { _: '459.00', $: { currency: 'UAH' } },
      description: 'Перша книга легендарної серії про юного чарівника',
      isbn: '978-966-441-000-1',
      year: '2021',
      stock: '20',
      image: 'images/placeholder.jpg'
    },
    {
      id: 'book_022', deleted: false,
      title: '1984',
      author: 'Джордж Орвелл',
      category: 'художня',
      price: { _: '279.00', $: { currency: 'UAH' } },
      description: 'Культова антиутопія про тоталітарний режим',
      isbn: '978-617-679-123-4',
      year: '2020',
      stock: '18',
      image: 'images/placeholder.jpg'
    },
    {
      id: 'book_023', deleted: false,
      title: 'Сто років самотності',
      author: 'Габріель Гарсія Маркес',
      category: 'художня',
      price: { _: '349.00', $: { currency: 'UAH' } },
      description: 'Шедевр магічного реалізму про родину Буендіа',
      isbn: '978-966-923-456-7',
      year: '2019',
      stock: '12',
      image: 'images/placeholder.jpg'
    },
    {
      id: 'book_024', deleted: false,
      title: 'Гордість і упередження',
      author: 'Джейн Остін',
      category: 'художня',
      price: { _: '269.00', $: { currency: 'UAH' } },
      description: 'Класичний роман про кохання та суспільні стереотипи',
      isbn: '978-617-609-234-5',
      year: '2021',
      stock: '14',
      image: 'images/placeholder.jpg'
    },
    {
      id: 'book_025', deleted: false,
      title: 'Алгоритми та структури даних',
      author: 'Роберт Седжвік',
      category: 'технічна',
      price: { _: '890.00', $: { currency: 'UAH' } },
      description: 'Фундаментальна книга з алгоритмів',
      isbn: '978-0-321-57351-3',
      year: '2020',
      stock: '6',
      image: 'images/placeholder.jpg'
    },
    {
      id: 'book_026', deleted: false,
      title: 'Фізика для всіх',
      author: 'Річард Фейнман',
      category: 'наукова',
      price: { _: '520.00', $: { currency: 'UAH' } },
      description: 'Легендарні лекції нобелівського лауреата',
      isbn: '978-966-428-567-8',
      year: '2021',
      stock: '10',
      image: 'images/placeholder.jpg'
    },
    {
      id: 'book_027', deleted: false,
      title: 'Пінокіо',
      author: 'Карло Коллоді',
      category: 'дитяча',
      price: { _: '189.00', $: { currency: 'UAH' } },
      description: 'Класична казка про дерев\'яну ляльку',
      isbn: '978-617-526-890-2',
      year: '2020',
      stock: '22',
      image: 'images/placeholder.jpg'
    },
    {
      id: 'book_028', deleted: false,
      title: 'Docker в дії',
      author: 'Джефф Ніколофф',
      category: 'технічна',
      price: { _: '720.00', $: { currency: 'UAH' } },
      description: 'Практичний посібник з контейнеризації',
      isbn: '978-1-617-29436-6',
      year: '2021',
      stock: '8',
      image: 'images/placeholder.jpg'
    },
    {
      id: 'book_029', deleted: false,
      title: 'Квантова механіка для початківців',
      author: 'Леонард Сасскінд',
      category: 'наукова',
      price: { _: '480.00', $: { currency: 'UAH' } },
      description: 'Доступний виклад квантової теорії',
      isbn: '978-0-465-08361-4',
      year: '2020',
      stock: '7',
      image: 'images/placeholder.jpg'
    },
    {
      id: 'book_030', deleted: false,
      title: 'Маленький принц',
      author: 'Антуан де Сент-Екзюпері',
      category: 'дитяча',
      price: { _: '159.00', $: { currency: 'UAH' } },
      description: 'Філософська казка про дружбу і любов',
      isbn: '978-966-441-789-5',
      year: '2021',
      stock: '30',
      image: 'images/placeholder.jpg'
    }
  ];

  // Додати нові книги
  newBooks.forEach(book => {
    const bookObj = {
      $: { id: book.id, deleted: book.deleted },
      title: [book.title],
      author: [book.author],
      category: [book.category],
      price: [book.price],
      description: [book.description],
      isbn: [book.isbn],
      year: [book.year],
      stock: [book.stock],
      image: [book.image]
    };
    result.catalog.book.push(bookObj);
    console.log(`  ✅ ${book.title} by ${book.author}`);
  });

  // Зберегти оновлений XML
  const builder = new Builder();
  const newXml = builder.buildObject(result);
  fs.writeFileSync(catalogPath, newXml);
  console.log('\n✅ Каталог оновлено! Тепер 30 книг.');
});

// 4. Додати нові замовлення
console.log('\n📦 Додавання нових замовлень...');
const ordersXml = fs.readFileSync(ordersPath, 'utf8');

parseString(ordersXml, (err, result) => {
  if (err) {
    console.error('Помилка парсингу XML:', err);
    return;
  }

  if (!result.orders.order) {
    result.orders.order = [];
  }

  const currentOrderCount = result.orders.order.length;
  const newOrders = [
    {
      id: (currentOrderCount + 1).toString(),
      orderNumber: `ORD-10000${currentOrderCount + 1}`,
      customer: {
        email: 'olena@example.com',
        name: 'Олена Шевченко',
        phone: '+380501234567',
        city: 'Одеса',
        address: 'вул. Дерибасівська, 15, кв. 8'
      },
      items: [
        { bookId: 'book_021', title: 'Гаррі Поттер і Філософський камінь', quantity: 1, price: 459.00 },
        { bookId: 'book_030', title: 'Маленький принц', quantity: 2, price: 159.00 }
      ],
      totalPrice: 777.00,
      status: 'нове',
      createdAt: new Date().toISOString(),
      comment: 'Подарунок для дитини'
    },
    {
      id: (currentOrderCount + 2).toString(),
      orderNumber: `ORD-10000${currentOrderCount + 2}`,
      customer: {
        email: 'ivan@example.com',
        name: 'Іван Мельник',
        phone: '+380671234568',
        city: 'Харків',
        address: 'просп. Науки, 45, кв. 22'
      },
      items: [
        { bookId: 'book_025', title: 'Алгоритми та структури даних', quantity: 1, price: 890.00 },
        { bookId: 'book_028', title: 'Docker в дії', quantity: 1, price: 720.00 }
      ],
      totalPrice: 1610.00,
      status: 'обробляється',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      comment: 'Терміново, для навчання'
    },
    {
      id: (currentOrderCount + 3).toString(),
      orderNumber: `ORD-10000${currentOrderCount + 3}`,
      customer: {
        email: 'maria@example.com',
        name: 'Марія Бондаренко',
        phone: '+380931234569',
        city: 'Дніпро',
        address: 'вул. Робоча, 78, кв. 5'
      },
      items: [
        { bookId: 'book_022', title: '1984', quantity: 1, price: 279.00 },
        { bookId: 'book_023', title: 'Сто років самотності', quantity: 1, price: 349.00 },
        { bookId: 'book_024', title: 'Гордість і упередження', quantity: 1, price: 269.00 }
      ],
      totalPrice: 897.00,
      status: 'відправлено',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      comment: ''
    }
  ];

  newOrders.forEach(order => {
    const orderObj = {
      $: { id: order.id, orderNumber: order.orderNumber },
      customer: [{
        email: [order.customer.email],
        name: [order.customer.name],
        phone: [order.customer.phone],
        city: [order.customer.city],
        address: [order.customer.address]
      }],
      items: [{
        item: order.items.map(item => ({
          bookId: [item.bookId],
          title: [item.title],
          quantity: [item.quantity.toString()],
          price: [item.price.toFixed(2)]
        }))
      }],
      totalPrice: [order.totalPrice.toFixed(2)],
      status: [order.status],
      createdAt: [order.createdAt],
      comment: [order.comment]
    };

    result.orders.order.push(orderObj);
    console.log(`  ✅ ${order.orderNumber} - ${order.customer.name} (${order.totalPrice.toFixed(2)} грн)`);
  });

  // Зберегти оновлений XML
  const builder = new Builder();
  const newXml = builder.buildObject(result);
  fs.writeFileSync(ordersPath, newXml);
  console.log(`\n✅ Замовлення оновлено! Тепер ${result.orders.order.length} замовлень.`);
});

db.close();

console.log('\n🎉 Всі тестові дані додано успішно!\n');
console.log('📊 Підсумок:');
console.log('  - Клієнтів: 5 (було 2)');
console.log('  - Книг: 30 (було 20)');
console.log('  - Замовлень: 7 (було 4)');
console.log('  - Записів історії: 15');
console.log('\n🔄 Перезапустіть сервер щоб побачити зміни!');
