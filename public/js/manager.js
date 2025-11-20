// Глобальні змінні
let currentManager = null;
let allBooks = [];
let allOrders = [];

// DOM елементи
const elements = {
    loginModal: document.getElementById('loginModal'),
    usernameInput: document.getElementById('usernameInput'),
    passwordInput: document.getElementById('passwordInput'),
    loginBtn: document.getElementById('loginBtn'),
    userName: document.getElementById('userName'),

    // Статистика
    statsBooks: document.getElementById('statsBooks'),
    statsOrders: document.getElementById('statsOrders'),
    statsClients: document.getElementById('statsClients'),
    statsRevenue: document.getElementById('statsRevenue'),

    // Каталог
    catalogTableBody: document.getElementById('catalogTableBody'),
    addBookBtn: document.getElementById('addBookBtn'),

    // Замовлення
    ordersGrid: document.getElementById('ordersGrid'),
    orderStatusFilter: document.getElementById('orderStatusFilter'),

    // XML операції
    importXMLFile: document.getElementById('importXMLFile'),
    importXMLBtn: document.getElementById('importXMLBtn'),
    importResult: document.getElementById('importResult'),
    validateCatalogBtn: document.getElementById('validateCatalogBtn'),
    validateOrdersBtn: document.getElementById('validateOrdersBtn'),
    validationResult: document.getElementById('validationResult'),
    viewCatalogXMLBtn: document.getElementById('viewCatalogXMLBtn'),
    viewOrdersXMLBtn: document.getElementById('viewOrdersXMLBtn'),
    xmlViewer: document.getElementById('xmlViewer'),

    // Історія
    historyTableBody: document.getElementById('historyTableBody'),

    // Модалки
    editBookModal: document.getElementById('editBookModal'),
    editBookTitle: document.getElementById('editBookTitle'),
    closeEditBook: document.getElementById('closeEditBook'),
    cancelEditBook: document.getElementById('cancelEditBook'),
    bookForm: document.getElementById('bookForm'),

    orderDetailsModal: document.getElementById('orderDetailsModal'),
    orderDetailsTitle: document.getElementById('orderDetailsTitle'),
    closeOrderDetails: document.getElementById('closeOrderDetails'),
    orderDetailsContent: document.getElementById('orderDetailsContent'),

    overlay: document.getElementById('overlay')
};

// Ініціалізація
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initEventListeners();
    initTabs();
});

// ==================== АВТЕНТИФІКАЦІЯ ====================

function initAuth() {
    const savedManager = localStorage.getItem('currentManager');
    if (savedManager) {
        currentManager = JSON.parse(savedManager);
        updateManagerUI();
        loadAllData();
    } else {
        // Перенаправлення на сторінку входу
        window.location.href = '/login.html';
    }
}

function updateManagerUI() {
    if (currentManager) {
        elements.userName.textContent = currentManager.username;
    }
}

async function login() {
    const username = elements.usernameInput.value.trim();
    const password = elements.passwordInput.value.trim();

    if (!username || !password) {
        alert('Введіть логін та пароль');
        return;
    }

    try {
        const response = await fetch('/api/auth/login/manager', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
            currentManager = data.user;
            localStorage.setItem('currentManager', JSON.stringify(currentManager));
            updateManagerUI();
            hideModal('loginModal');
            loadAllData();
        } else {
            alert('Помилка входу: ' + data.error);
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Помилка підключення до сервера');
    }
}

// ==================== ЗАВАНТАЖЕННЯ ДАНИХ ====================

async function loadAllData() {
    await Promise.all([
        loadCatalog(),
        loadOrders(),
        loadHistory()
    ]);
    updateStatistics();
}

async function loadCatalog() {
    try {
        const response = await fetch('/api/catalog');
        const data = await response.json();

        if (data.success) {
            allBooks = data.books.filter(book => {
                const deleted = book.$?.deleted || book.deleted;
                return deleted !== 'true' && deleted !== true;
            });
            renderCatalogTable();
        }
    } catch (error) {
        console.error('Load catalog error:', error);
    }
}

async function loadOrders() {
    try {
        const response = await fetch('/api/orders');
        const data = await response.json();

        if (data.success) {
            allOrders = data.orders;
            renderOrders();
        }
    } catch (error) {
        console.error('Load orders error:', error);
    }
}

async function loadHistory() {
    // Історія змін зберігається в БД, можна було б додати окремий endpoint
    // Поки що залишимо заглушку
    elements.historyTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Історія змін доступна через базу даних</td></tr>';
}

function updateStatistics() {
    const totalBooks = allBooks.length;
    const totalOrders = allOrders.length;

    // Унікальні клієнти
    const uniqueClients = new Set(allOrders.map(o => o.customer.email));
    const totalClients = uniqueClients.size;

    // Загальна виручка
    const totalRevenue = allOrders.reduce((sum, order) => sum + parseFloat(order.total || order.totalPrice || 0), 0);

    elements.statsBooks.textContent = totalBooks;
    elements.statsOrders.textContent = totalOrders;
    elements.statsClients.textContent = totalClients;
    elements.statsRevenue.textContent = totalRevenue.toFixed(2) + ' грн';
}

// ==================== КАТАЛОГ ====================

function renderCatalogTable() {
    elements.catalogTableBody.innerHTML = '';

    if (allBooks.length === 0) {
        elements.catalogTableBody.innerHTML = '<tr><td colspan="8" class="text-center">Каталог порожній</td></tr>';
        return;
    }

    allBooks.forEach(book => {
        const row = document.createElement('tr');

        const bookId = book.$?.id || book.id;
        const stock = parseInt(book.stock) || 0;
        const price = parseFloat(book.price?._ || book.price) || 0;
        const stockClass = stock === 0 ? 'danger' : (stock < 5 ? 'warning' : 'success');

        row.innerHTML = `
            <td>${bookId}</td>
            <td><img src="/${book.image}" alt="${book.title}" onerror="this.src='/images/placeholder.svg'"></td>
            <td>${book.title}</td>
            <td>${book.author}</td>
            <td>${book.category}</td>
            <td>${price.toFixed(2)} грн</td>
            <td><span class="badge ${stockClass}">${stock} шт</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editBook('${bookId}')">✏️</button>
                <button class="btn btn-sm btn-danger" onclick="deleteBook('${bookId}', '${book.title}')">🗑️</button>
            </td>
        `;

        elements.catalogTableBody.appendChild(row);
    });
}

function addBook() {
    elements.editBookTitle.textContent = 'Додати нову книгу';
    document.getElementById('bookId').value = '';
    elements.bookForm.reset();

    // Встановити значення за замовчуванням
    document.getElementById('bookImage').value = 'images/placeholder.jpg';

    showModal('editBookModal');
}

function editBook(bookId) {
    const book = allBooks.find(b => (b.$?.id || b.id) === bookId);
    if (!book) return;

    elements.editBookTitle.textContent = 'Редагувати книгу';

    const id = book.$?.id || book.id;
    const price = parseFloat(book.price?._ || book.price) || 0;

    document.getElementById('bookId').value = id;
    document.getElementById('bookTitle').value = book.title;
    document.getElementById('bookAuthor').value = book.author;
    document.getElementById('bookCategory').value = book.category;
    document.getElementById('bookISBN').value = book.isbn;
    document.getElementById('bookPrice').value = price;
    document.getElementById('bookYear').value = book.year;
    document.getElementById('bookStock').value = book.stock;
    document.getElementById('bookDescription').value = book.description || '';
    document.getElementById('bookImage').value = book.image || 'images/placeholder.jpg';

    showModal('editBookModal');
}

async function saveBook(e) {
    e.preventDefault();

    const bookId = document.getElementById('bookId').value;
    const bookData = {
        title: document.getElementById('bookTitle').value.trim(),
        author: document.getElementById('bookAuthor').value.trim(),
        category: document.getElementById('bookCategory').value,
        isbn: document.getElementById('bookISBN').value.trim(),
        price: parseFloat(document.getElementById('bookPrice').value),
        year: parseInt(document.getElementById('bookYear').value),
        stock: parseInt(document.getElementById('bookStock').value),
        description: document.getElementById('bookDescription').value.trim(),
        image: document.getElementById('bookImage').value.trim() || 'images/placeholder.jpg'
    };

    try {
        let response;
        if (bookId) {
            // Оновлення існуючої книги
            response = await fetch(`/api/catalog/${bookId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookData)
            });
        } else {
            // Додавання нової книги
            response = await fetch('/api/catalog', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookData)
            });
        }

        const data = await response.json();

        if (data.success) {
            alert(bookId ? 'Книгу успішно оновлено!' : 'Книгу успішно додано!');
            hideModal('editBookModal');
            loadCatalog();
        } else {
            alert('Помилка збереження: ' + data.error);
        }
    } catch (error) {
        console.error('Save book error:', error);
        alert('Помилка підключення до сервера');
    }
}

async function deleteBook(bookId, bookTitle) {
    if (!confirm(`Видалити книгу "${bookTitle}"?`)) {
        return;
    }

    try {
        const response = await fetch(`/api/catalog/${bookId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            alert('Книгу успішно видалено!');
            loadCatalog();
        } else {
            alert('Помилка видалення: ' + data.error);
        }
    } catch (error) {
        console.error('Delete book error:', error);
        alert('Помилка підключення до сервера');
    }
}

// ==================== ЗАМОВЛЕННЯ ====================

function renderOrders() {
    const statusFilter = elements.orderStatusFilter.value;

    let filteredOrders = allOrders;
    if (statusFilter) {
        filteredOrders = allOrders.filter(order => {
            const status = order.$?.status || order.status;
            return status === statusFilter;
        });
    }

    elements.ordersGrid.innerHTML = '';

    if (filteredOrders.length === 0) {
        elements.ordersGrid.innerHTML = '<div class="text-center">Замовлення не знайдено</div>';
        return;
    }

    filteredOrders.forEach(order => {
        const orderCard = createOrderCard(order);
        elements.ordersGrid.appendChild(orderCard);
    });
}

function createOrderCard(order) {
    const card = document.createElement('div');
    card.className = 'order-card';

    const statusMap = {
        'нове': 'new',
        'обробляється': 'processing',
        'відправлено': 'shipped',
        'виконано': 'completed'
    };

    const orderId = order.$?.id || order.id;
    const orderStatus = order.$?.status || order.status;
    const orderDate = order.$?.date || order.createdAt || order.date;
    const statusClass = statusMap[orderStatus] || 'new';
    const date = new Date(orderDate).toLocaleString('uk-UA');

    card.innerHTML = `
        <div class="order-header">
            <span class="order-number">${orderId}</span>
            <span class="order-status ${statusClass}">${orderStatus}</span>
        </div>

        <div class="order-info">
            <div class="order-info-item">
                <div class="order-info-label">Клієнт</div>
                <div class="order-info-value">${order.customer.name}</div>
            </div>
            <div class="order-info-item">
                <div class="order-info-label">Email</div>
                <div class="order-info-value">${order.customer.email}</div>
            </div>
            <div class="order-info-item">
                <div class="order-info-label">Телефон</div>
                <div class="order-info-value">${order.customer.phone}</div>
            </div>
            <div class="order-info-item">
                <div class="order-info-label">Місто</div>
                <div class="order-info-value">${order.customer.city}</div>
            </div>
            <div class="order-info-item">
                <div class="order-info-label">Дата</div>
                <div class="order-info-value">${date}</div>
            </div>
        </div>

        <div class="order-items">
            <strong>Товари:</strong>
            ${(() => {
                let items = [];
                if (Array.isArray(order.items)) {
                    items = order.items;
                } else if (order.items?.item) {
                    items = Array.isArray(order.items.item) ? order.items.item : [order.items.item];
                }
                return items.map(item => {
                    const quantity = item.$?.quantity || item.quantity || 1;
                    const price = parseFloat(item.price?._ || item.price) || 0;
                    return `
                        <div class="order-item">
                            <span>${item.title} × ${quantity}</span>
                            <span>${(price * parseInt(quantity)).toFixed(2)} грн</span>
                        </div>
                    `;
                }).join('');
            })()}
        </div>

        <div class="order-total">
            <span>Всього:</span>
            <span>${parseFloat(order.total || order.totalPrice || 0).toFixed(2)} грн</span>
        </div>

        <div class="order-actions">
            <select class="select" id="status-${orderId}" onchange="updateOrderStatus('${orderId}', this.value)">
                <option value="нове" ${orderStatus === 'нове' ? 'selected' : ''}>Нове</option>
                <option value="обробляється" ${orderStatus === 'обробляється' ? 'selected' : ''}>Обробляється</option>
                <option value="відправлено" ${orderStatus === 'відправлено' ? 'selected' : ''}>Відправлено</option>
                <option value="виконано" ${orderStatus === 'виконано' ? 'selected' : ''}>Виконано</option>
            </select>
            <button class="btn btn-sm btn-info" onclick="viewOrderDetails('${orderId}')">Деталі</button>
        </div>
    `;

    return card;
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await fetch(`/api/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        const data = await response.json();

        if (data.success) {
            alert(`Статус змінено на "${newStatus}"`);
            loadOrders();
        } else {
            alert('Помилка оновлення: ' + data.error);
            // Повернути попереднє значення
            loadOrders();
        }
    } catch (error) {
        console.error('Update status error:', error);
        alert('Помилка підключення до сервера');
        loadOrders();
    }
}

function viewOrderDetails(orderId) {
    const order = allOrders.find(o => (o.$?.id || o.id) === orderId);
    if (!order) return;

    const orderNumber = order.$?.id || order.orderNumber || order.id;
    const orderDate = order.$?.date || order.createdAt || order.date;
    const orderStatus = order.$?.status || order.status;

    elements.orderDetailsTitle.textContent = `Замовлення ${orderNumber}`;

    const date = new Date(orderDate).toLocaleString('uk-UA');

    // Handle order items structure
    let items = [];
    if (Array.isArray(order.items)) {
        items = order.items;
    } else if (order.items?.item) {
        items = Array.isArray(order.items.item) ? order.items.item : [order.items.item];
    }

    const total = parseFloat(order.total || order.totalPrice || 0);

    elements.orderDetailsContent.innerHTML = `
        <div class="order-info">
            <div class="order-info-item">
                <div class="order-info-label">Статус</div>
                <div class="order-info-value"><span class="order-status ${getStatusClass(orderStatus)}">${orderStatus}</span></div>
            </div>
            <div class="order-info-item">
                <div class="order-info-label">Дата створення</div>
                <div class="order-info-value">${date}</div>
            </div>
        </div>

        <h3 style="margin: 20px 0 10px 0;">Клієнт:</h3>
        <div class="order-info">
            <div class="order-info-item">
                <div class="order-info-label">Ім'я</div>
                <div class="order-info-value">${order.customer.name}</div>
            </div>
            <div class="order-info-item">
                <div class="order-info-label">Email</div>
                <div class="order-info-value">${order.customer.email}</div>
            </div>
            <div class="order-info-item">
                <div class="order-info-label">Телефон</div>
                <div class="order-info-value">${order.customer.phone}</div>
            </div>
            <div class="order-info-item">
                <div class="order-info-label">Місто</div>
                <div class="order-info-value">${order.customer.city}</div>
            </div>
        </div>
        <div style="margin: 10px 0;">
            <div class="order-info-label">Адреса доставки:</div>
            <div style="padding: 10px; background: var(--bg-light); border-radius: 6px; margin-top: 5px;">
                ${order.customer.address}
            </div>
        </div>

        <h3 style="margin: 20px 0 10px 0;">Товари:</h3>
        <div class="order-items" style="background: var(--bg-light); padding: 15px; border-radius: 8px;">
            ${items.map(item => {
                const quantity = parseInt(item.$?.quantity || item.quantity || 1);
                const price = parseFloat(item.price?._ || item.price || 0);
                return `
                    <div class="order-item">
                        <span>${item.title} × ${quantity} (${price.toFixed(2)} грн/шт)</span>
                        <span>${(price * quantity).toFixed(2)} грн</span>
                    </div>
                `;
            }).join('')}
            <div class="order-total" style="margin-top: 15px;">
                <strong>Всього:</strong>
                <strong>${total.toFixed(2)} грн</strong>
            </div>
        </div>

        ${order.comment ? `
            <h3 style="margin: 20px 0 10px 0;">Коментар:</h3>
            <div style="padding: 10px; background: var(--bg-light); border-radius: 6px;">
                ${order.comment}
            </div>
        ` : ''}

        ${order.notes ? `
            <h3 style="margin: 20px 0 10px 0;">Примітки менеджера:</h3>
            <div style="padding: 10px; background: #fff3e0; border-radius: 6px;">
                ${order.notes}
            </div>
        ` : ''}

        <div style="margin-top: 20px;">
            <button class="btn btn-success" onclick="window.open('/api/xml/orders')">
                📥 Завантажити XML
            </button>
        </div>
    `;

    showModal('orderDetailsModal');
}

function getStatusClass(status) {
    const map = {
        'нове': 'new',
        'обробляється': 'processing',
        'відправлено': 'shipped',
        'виконано': 'completed'
    };
    return map[status] || 'new';
}

// ==================== XML ОПЕРАЦІЇ ====================

// Імпорт XML
async function importXML() {
    const file = elements.importXMLFile.files[0];
    if (!file) {
        alert('Виберіть XML файл для імпорту');
        return;
    }

    const formData = new FormData();
    formData.append('xmlFile', file);

    try {
        const response = await fetch('/api/xml/import/catalog', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            showAlert('importResult', 'success', `✅ Імпорт успішний! Імпортовано ${data.importedCount} книг.`);
            loadCatalog();
        } else {
            showAlert('importResult', 'error', `❌ Помилка імпорту: ${data.error}`);
        }
    } catch (error) {
        console.error('Import error:', error);
        showAlert('importResult', 'error', '❌ Помилка підключення до сервера');
    }
}

// Валідація XML
async function validateXML(type) {
    const endpoint = type === 'catalog' ? '/api/catalog/validate/xsd' : '/api/orders/validate/xsd';

    try {
        const response = await fetch(endpoint);
        const data = await response.json();

        if (data.success) {
            if (data.valid) {
                showAlert('validationResult', 'success', `✅ ${type === 'catalog' ? 'Каталог' : 'Замовлення'} валідний! XML відповідає XSD схемі.`);
            } else {
                showAlert('validationResult', 'error', `❌ Помилка валідації: ${data.errors.join(', ')}`);
            }
        } else {
            showAlert('validationResult', 'error', `❌ Помилка валідації: ${data.error}`);
        }
    } catch (error) {
        console.error('Validation error:', error);
        showAlert('validationResult', 'error', '❌ Помилка підключення до сервера');
    }
}

// Перегляд XML
async function viewXML(type) {
    const endpoint = type === 'catalog' ? '/api/xml/catalog' : '/api/xml/orders';

    try {
        const response = await fetch(endpoint);
        const xmlText = await response.text();

        // Форматування XML для відображення
        const formatted = formatXML(xmlText);

        elements.xmlViewer.innerHTML = `<pre>${escapeHtml(formatted)}</pre>`;
        elements.xmlViewer.classList.add('active');
    } catch (error) {
        console.error('View XML error:', error);
        elements.xmlViewer.innerHTML = '<p class="error">Помилка завантаження XML</p>';
        elements.xmlViewer.classList.add('active');
    }
}

// Допоміжна функція для форматування XML
function formatXML(xml) {
    let formatted = '';
    let indent = 0;
    const tab = '  ';

    xml.split(/>\s*</).forEach(node => {
        if (node.match(/^\/\w/)) indent--;
        formatted += tab.repeat(indent) + '<' + node + '>\n';
        if (node.match(/^<?\w[^>]*[^\/]$/)) indent++;
    });

    return formatted.substring(1, formatted.length - 2);
}

// Допоміжна функція для екранування HTML
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Показати алерт
function showAlert(elementId, type, message) {
    const alert = document.getElementById(elementId);
    alert.className = `alert ${type} active`;
    alert.textContent = message;

    // Автоматично сховати через 10 секунд
    setTimeout(() => {
        alert.classList.remove('active');
    }, 10000);
}

// ==================== ВКЛАДКИ ====================

function initTabs() {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;

            // Приховати всі вкладки
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(tc => tc.classList.remove('active'));

            // Показати вибрану вкладку
            tab.classList.add('active');
            document.getElementById(tabName + 'Tab').classList.add('active');
        });
    });
}

// ==================== МОДАЛЬНІ ВІКНА ====================

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('open');
        elements.overlay.classList.add('open');
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('open');
    }

    // Сховати оверлей якщо немає відкритих модалок
    const openModals = document.querySelectorAll('.modal.open');
    if (openModals.length === 0) {
        elements.overlay.classList.remove('open');
    }
}

// ==================== ОБРОБНИКИ ПОДІЙ ====================

function initEventListeners() {
    // Логін
    elements.loginBtn.addEventListener('click', login);
    elements.passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') login();
    });

    // Каталог
    elements.addBookBtn.addEventListener('click', addBook);
    elements.bookForm.addEventListener('submit', saveBook);
    elements.closeEditBook.addEventListener('click', () => hideModal('editBookModal'));
    elements.cancelEditBook.addEventListener('click', () => hideModal('editBookModal'));

    // Замовлення
    elements.orderStatusFilter.addEventListener('change', renderOrders);
    elements.closeOrderDetails.addEventListener('click', () => hideModal('orderDetailsModal'));

    // XML операції
    elements.importXMLBtn.addEventListener('click', importXML);
    elements.validateCatalogBtn.addEventListener('click', () => validateXML('catalog'));
    elements.validateOrdersBtn.addEventListener('click', () => validateXML('orders'));
    elements.viewCatalogXMLBtn.addEventListener('click', () => viewXML('catalog'));
    elements.viewOrdersXMLBtn.addEventListener('click', () => viewXML('orders'));

    // Оверлей
    elements.overlay.addEventListener('click', () => {
        elements.overlay.classList.remove('open');
        document.querySelectorAll('.modal.open').forEach(modal => {
            modal.classList.remove('open');
        });
    });
}

// Експортувати функції для використання в HTML onclick
window.editBook = editBook;
window.deleteBook = deleteBook;
window.updateOrderStatus = updateOrderStatus;
window.viewOrderDetails = viewOrderDetails;
