-- Додавання нових тестових клієнтів
INSERT OR IGNORE INTO client_sessions (email, name, phone, city, address) VALUES
('olena@example.com', 'Олена Шевченко', '+380501234567', 'Одеса', 'вул. Дерибасівська, 15, кв. 8'),
('ivan@example.com', 'Іван Мельник', '+380671234568', 'Харків', 'просп. Науки, 45, кв. 22'),
('maria@example.com', 'Марія Бондаренко', '+380931234569', 'Дніпро', 'вул. Робоча, 78, кв. 5');

-- Додавання записів в xml_changes_log для історії
INSERT INTO xml_changes_log (type, operation, user, details) VALUES
('catalog', 'create', 'manager', 'Додано нову книгу: "Сто років самотності"'),
('catalog', 'update', 'manager', 'Оновлено ціну книги: "Майстер і Маргарита"'),
('catalog', 'update', 'manager', 'Змінено кількість на складі: "Clean Code" (було 12, стало 8)'),
('orders', 'create', 'anna@example.com', 'Створено замовлення ORD-100001'),
('orders', 'update', 'manager', 'Змінено статус замовлення ORD-100001: нове → обробляється'),
('orders', 'create', 'bogdan@example.com', 'Створено замовлення ORD-100002'),
('catalog', 'import', 'manager', 'Імпортовано каталог з XML файлу (оновлено 5 книг)'),
('catalog', 'validate', 'manager', 'Валідація каталогу за XSD схемою - успішно'),
('orders', 'validate', 'manager', 'Валідація замовлень за XSD схемою - успішно'),
('orders', 'export', 'manager', 'Експортовано замовлення в XML файл');
