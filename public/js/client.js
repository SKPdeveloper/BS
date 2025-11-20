// Глобальні змінні
let currentUser = null;
let allBooks = [];
let filteredBooks = [];
let cart = [];

// DOM елементи
const elements = {
    userName: document.getElementById('userName'),
    logoutBtn: document.getElementById('logoutBtn'),

    booksGrid: document.getElementById('booksGrid'),
    loading: document.getElementById('loading'),
    emptyState: document.getElementById('emptyState'),
    searchInput: document.getElementById('searchInput'),

    cartBtn: document.getElementById('cartBtn'),
    cartSidebar: document.getElementById('cartSidebar'),
    closeCart: document.getElementById('closeCart'),
    cartCount: document.getElementById('cartCount'),
    cartItems: document.getElementById('cartItems'),
    cartEmpty: document.getElementById('cartEmpty'),
    cartFooter: document.getElementById('cartFooter'),
    cartTotal: document.getElementById('cartTotal'),

    checkoutBtn: document.getElementById('checkoutBtn'),
    checkoutModal: document.getElementById('checkoutModal'),
    closeCheckout: document.getElementById('closeCheckout'),
    cancelCheckout: document.getElementById('cancelCheckout'),
    confirmOrder: document.getElementById('confirmOrder'),

    ordersLink: document.getElementById('ordersLink'),
    ordersModal: document.getElementById('ordersModal'),
    closeOrders: document.getElementById('closeOrders'),
    ordersList: document.getElementById('ordersList'),
    ordersEmpty: document.getElementById('ordersEmpty'),

    overlay: document.getElementById('overlay'),

    applyFilters: document.getElementById('applyFilters'),
    resetFilters: document.getElementById('resetFilters'),
    resetFiltersEmpty: document.getElementById('resetFiltersEmpty'),
    sortSelect: document.getElementById('sortSelect')
};

// Ініціалізація
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initEventListeners();
    loadCart();
});

// ==================== АВТЕНТИФІКАЦІЯ ====================

function initAuth() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUserUI();
        loadCatalog();
    } else {
        // Перенаправлення на сторінку входу
        window.location.href = '/login.html';
    }
}

function updateUserUI() {
    const quickButtons = document.getElementById('quickLoginButtons');
    if (currentUser) {
        elements.userName.textContent = currentUser.name;
        elements.userName.style.display = 'inline';
        elements.logoutBtn.style.display = 'inline';
        if (quickButtons) quickButtons.style.display = 'none';
    } else {
        elements.userName.style.display = 'none';
        elements.logoutBtn.style.display = 'none';
        if (quickButtons) quickButtons.style.display = 'flex';
    }
}

// Швидкий вхід
function quickLogin(email) {
    login(email);
}

async function login(email) {
    try {
        const response = await fetch('/api/auth/login/client', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (data.success) {
            currentUser = data.user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateUserUI();
            hideModal('loginModal');
            loadCatalog();
        } else {
            alert('Помилка входу: ' + data.error);
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Помилка підключення до сервера');
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    cart = [];
    saveCart();
    updateCartUI();
    window.location.href = '/';
}

// ==================== КАТАЛОГ ====================

async function loadCatalog() {
    try {
        elements.loading.style.display = 'block';
        elements.booksGrid.innerHTML = '';
        elements.emptyState.style.display = 'none';

        const response = await fetch('/api/catalog');
        const data = await response.json();

        if (data.success) {
            allBooks = data.books.filter(book => {
                const deleted = book.$?.deleted || book.deleted;
                return deleted !== 'true' && deleted !== true;
            });
            filteredBooks = [...allBooks];
            applyFiltersAndSort();
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('Load catalog error:', error);
        alert('Помилка завантаження каталогу');
    } finally {
        elements.loading.style.display = 'none';
    }
}

function applyFiltersAndSort() {
    let books = [...allBooks];

    // Пошук
    const searchTerm = elements.searchInput.value.toLowerCase();
    if (searchTerm) {
        books = books.filter(book =>
            book.title.toLowerCase().includes(searchTerm) ||
            book.author.toLowerCase().includes(searchTerm)
        );
    }

    // Фільтр за категоріями
    const selectedCategories = Array.from(document.querySelectorAll('input[name="category"]:checked'))
        .map(cb => cb.value);

    if (selectedCategories.length > 0) {
        books = books.filter(book => selectedCategories.includes(book.category));
    }

    // Фільтр за ціною
    const priceMin = parseFloat(document.getElementById('priceMin')?.value) || 0;
    const priceMax = parseFloat(document.getElementById('priceMax')?.value) || Infinity;
    books = books.filter(book => {
        const price = parseFloat(book.price?._ || book.price) || 0;
        return price >= priceMin && price <= priceMax;
    });

    // Сортування
    const sortBy = elements.sortSelect?.value || '';
    books.sort((a, b) => {
        switch (sortBy) {
            case 'title':
                return a.title.localeCompare(b.title, 'uk');
            case 'price-asc':
                const priceA = parseFloat(a.price?._ || a.price) || 0;
                const priceB = parseFloat(b.price?._ || b.price) || 0;
                return priceA - priceB;
            case 'price-desc':
                const priceA2 = parseFloat(a.price?._ || a.price) || 0;
                const priceB2 = parseFloat(b.price?._ || b.price) || 0;
                return priceB2 - priceA2;
            case 'year':
                return parseInt(b.year) - parseInt(a.year);
            default:
                return 0;
        }
    });

    filteredBooks = books;
    renderBooks();
}

function renderBooks() {
    elements.booksGrid.innerHTML = '';

    if (filteredBooks.length === 0) {
        elements.emptyState.style.display = 'block';
        return;
    }

    elements.emptyState.style.display = 'none';

    filteredBooks.forEach(book => {
        const bookCard = createBookCard(book);
        elements.booksGrid.appendChild(bookCard);
    });
}

function createBookCard(book) {
    const card = document.createElement('div');
    card.className = 'book-card';

    // Підтримка обох форматів (з $ та без)
    const bookId = book.$?.id || book.id;
    const deleted = book.$?.deleted || book.deleted;

    const stock = parseInt(book.stock) || 0;
    const stockClass = stock === 0 ? 'out' : (stock < 5 ? 'low' : '');
    const stockText = stock === 0 ? 'Немає в наявності' : `В наявності: ${stock} шт`;
    const isInCart = cart.some(item => item.id === bookId);
    const price = parseFloat(book.price?._ || book.price) || 0;

    card.innerHTML = `
        <img src="/${book.image}" alt="${book.title}" class="book-image" onerror="this.src='/images/placeholder.svg'">
        <div class="book-content">
            <span class="book-category">${book.category}</span>
            <h3 class="book-title">${book.title}</h3>
            <p class="book-author">${book.author}</p>
            <p class="book-stock ${stockClass}">${stockText}</p>
            <div class="book-footer">
                <span class="book-price">${price.toFixed(2)} грн</span>
            </div>
            <button class="btn btn-primary btn-add-cart"
                    ${stock === 0 || isInCart ? 'disabled' : ''}
                    data-book-id="${bookId}">
                ${isInCart ? 'У кошику' : (stock === 0 ? 'Немає в наявності' : 'Додати в кошик')}
            </button>
        </div>
    `;

    const addBtn = card.querySelector('.btn-add-cart');
    if (stock > 0 && !isInCart) {
        addBtn.addEventListener('click', () => addToCart(book));
    }

    return card;
}

// ==================== КОШИК ====================

function loadCart() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartUI();
    }
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function addToCart(book) {
    // Підтримка обох форматів
    const bookId = book.$?.id || book.id;

    const existingItem = cart.find(item => item.id === bookId);
    const stock = parseInt(book.stock) || 0;
    const price = parseFloat(book.price?._ || book.price) || 0;

    if (existingItem) {
        if (existingItem.quantity < stock) {
            existingItem.quantity++;
        } else {
            alert('Неможливо додати більше товару, ніж є в наявності');
            return;
        }
    } else {
        cart.push({
            id: bookId,
            title: book.title,
            author: book.author,
            price: price,
            image: book.image,
            stock: stock,
            quantity: 1
        });
    }

    saveCart();
    updateCartUI();
    renderBooks(); // Перемалювати щоб показати "У кошику"

    // Показати кошик
    if (elements.cartSidebar && elements.overlay) {
        elements.cartSidebar.classList.add('open');
        elements.overlay.classList.add('open');
    }
}

function updateCartQuantity(bookId, delta) {
    const item = cart.find(item => item.id === bookId);
    if (!item) return;

    const newQuantity = item.quantity + delta;

    if (newQuantity <= 0) {
        removeFromCart(bookId);
        return;
    }

    if (newQuantity > item.stock) {
        alert('Неможливо додати більше товару, ніж є в наявності');
        return;
    }

    item.quantity = newQuantity;
    saveCart();
    updateCartUI();
}

function removeFromCart(bookId) {
    cart = cart.filter(item => item.id !== bookId);
    saveCart();
    updateCartUI();
    renderBooks(); // Перемалювати щоб прибрати "У кошику"
}

function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    elements.cartCount.textContent = totalItems;
    elements.cartTotal.textContent = `${totalPrice.toFixed(2)} грн`;

    if (cart.length === 0) {
        elements.cartEmpty.style.display = 'flex';
        elements.cartFooter.style.display = 'none';
        elements.cartItems.innerHTML = '';
    } else {
        elements.cartEmpty.style.display = 'none';
        elements.cartFooter.style.display = 'block';
        renderCartItems();
    }
}

function renderCartItems() {
    elements.cartItems.innerHTML = '';

    cart.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';

        cartItem.innerHTML = `
            <img src="/${item.image}" alt="${item.title}" class="cart-item-image" onerror="this.src='/images/placeholder.svg'">
            <div class="cart-item-details">
                <div class="cart-item-title">${item.title}</div>
                <div class="cart-item-author">${item.author}</div>
                <div class="cart-item-controls">
                    <button class="quantity-btn" data-id="${item.id}" data-delta="-1">-</button>
                    <span class="cart-item-quantity">${item.quantity}</span>
                    <button class="quantity-btn" data-id="${item.id}" data-delta="1">+</button>
                    <span class="cart-item-price">${(item.price * item.quantity).toFixed(2)} грн</span>
                    <span class="cart-item-remove" data-id="${item.id}">🗑️</span>
                </div>
            </div>
        `;

        elements.cartItems.appendChild(cartItem);
    });

    // Додати обробники
    document.querySelectorAll('.quantity-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const bookId = e.target.dataset.id;
            const delta = parseInt(e.target.dataset.delta);
            updateCartQuantity(bookId, delta);
        });
    });

    document.querySelectorAll('.cart-item-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const bookId = e.target.dataset.id;
            if (confirm('Видалити товар з кошика?')) {
                removeFromCart(bookId);
            }
        });
    });
}

// ==================== ОФОРМЛЕННЯ ЗАМОВЛЕННЯ ====================

function openCheckout() {
    if (cart.length === 0) return;

    // Заповнити дані користувача
    if (currentUser) {
        document.getElementById('checkoutName').value = currentUser.name || '';
        document.getElementById('checkoutPhone').value = currentUser.phone || '';
        document.getElementById('checkoutCity').value = currentUser.city || '';
        document.getElementById('checkoutAddress').value = currentUser.address || '';
    }

    // Показати товари
    renderCheckoutItems();

    showModal('checkoutModal');
}

function renderCheckoutItems() {
    const checkoutItems = document.getElementById('checkoutItems');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    checkoutItems.innerHTML = '<h3>Ваше замовлення:</h3>';

    cart.forEach(item => {
        const div = document.createElement('div');
        div.className = 'checkout-item';
        div.innerHTML = `
            <span>${item.title} × ${item.quantity}</span>
            <span>${(item.price * item.quantity).toFixed(2)} грн</span>
        `;
        checkoutItems.appendChild(div);
    });

    document.getElementById('checkoutItemsCount').textContent = `${totalItems} шт`;
    document.getElementById('checkoutTotal').textContent = `${totalPrice.toFixed(2)} грн`;
}

async function confirmOrder() {
    if (!currentUser) {
        alert('Будь ласка, увійдіть до системи');
        return;
    }

    const name = document.getElementById('checkoutName').value.trim();
    const phone = document.getElementById('checkoutPhone').value.trim();
    const city = document.getElementById('checkoutCity').value.trim();
    const address = document.getElementById('checkoutAddress').value.trim();

    if (!name || !phone || !city || !address) {
        alert('Будь ласка, заповніть всі обов\'язкові поля');
        return;
    }

    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const orderData = {
        customer: {
            email: currentUser.email,
            name: name,
            phone: phone,
            city: city,
            address: address
        },
        items: cart.map(item => ({
            bookId: item.id,
            title: item.title,
            quantity: item.quantity,
            price: item.price
        })),
        totalPrice: totalPrice,
        comment: document.getElementById('checkoutComment').value.trim()
    };

    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        const data = await response.json();

        if (data.success) {
            alert(`✅ Замовлення ${data.order.orderNumber} успішно оформлено!\n\nСтатус: ${data.order.status}\nСума: ${data.order.totalPrice.toFixed(2)} грн`);

            // Очистити кошик
            cart = [];
            saveCart();
            updateCartUI();

            hideModal('checkoutModal');
            elements.cartSidebar.classList.remove('open');
            elements.overlay.classList.remove('open');

            // Оновити каталог (склад міг змінитись)
            loadCatalog();
        } else {
            alert('Помилка оформлення замовлення: ' + data.error);
        }
    } catch (error) {
        console.error('Order error:', error);
        alert('Помилка підключення до сервера');
    }
}

// ==================== МОЇ ЗАМОВЛЕННЯ ====================

async function loadOrders() {
    if (!currentUser) return;

    try {
        const response = await fetch(`/api/orders?email=${encodeURIComponent(currentUser.email)}`);
        const data = await response.json();

        if (data.success) {
            renderOrders(data.orders);
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('Load orders error:', error);
        alert('Помилка завантаження замовлень');
    }
}

function renderOrders(orders) {
    const userOrders = orders.filter(order => order.customer.email === currentUser.email);

    if (userOrders.length === 0) {
        elements.ordersList.style.display = 'none';
        elements.ordersEmpty.style.display = 'block';
        return;
    }

    elements.ordersList.style.display = 'block';
    elements.ordersEmpty.style.display = 'none';
    elements.ordersList.innerHTML = '';

    userOrders.forEach(order => {
        const orderCard = createOrderCard(order);
        elements.ordersList.appendChild(orderCard);
    });
}

function createOrderCard(order) {
    const card = document.createElement('div');
    card.className = 'order-card';

    const statusMap = {
        'нове': 'new',
        'обробляється': 'processing',
        'відправлено': 'shipped',
        'виконано': 'completed',
        'скасовано': 'cancelled'
    };

    // Отримуємо дані з правильної структури
    let orderId, orderStatus, orderDate;

    if (order.$) {
        // Новий формат з атрибутами в $
        orderId = order.$.id;
        orderStatus = order.$.status;
        orderDate = order.$.date;
    } else {
        // Старий формат або відповідь з сервера
        orderId = order.id || order.orderNumber;
        orderStatus = order.status;
        orderDate = order.createdAt || order.date || order.created_at;
    }

    const statusClass = statusMap[orderStatus] || 'new';
    const date = orderDate ? new Date(orderDate).toLocaleDateString('uk-UA') : 'Невідома дата';

    card.innerHTML = `
        <div class="order-header">
            <span class="order-number">Замовлення ${orderId}</span>
            <span class="order-status ${statusClass}">${orderStatus || 'нове'}</span>
        </div>
        <div class="order-date">📅 ${date}</div>
        <div class="order-items">
            ${(() => {
                let items = [];
                if (Array.isArray(order.items)) {
                    items = order.items;
                } else if (order.items?.item) {
                    items = Array.isArray(order.items.item) ? order.items.item : [order.items.item];
                }
                return items.map(item => {
                    // Отримуємо quantity з $ або напряму
                    const quantity = item.$?.quantity || item.quantity || 1;
                    // Отримуємо price з різних можливих структур
                    const price = parseFloat(item.price?._ || item.price) || 0;

                    return `
                        <div class="order-item">
                            <span>${item.title || 'Невідома книга'} × ${quantity}</span>
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
    `;

    return card;
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
    // Логаут
    elements.logoutBtn.addEventListener('click', logout);

    // Кошик
    elements.cartBtn.addEventListener('click', () => {
        elements.cartSidebar.classList.add('open');
        elements.overlay.classList.add('open');
    });

    elements.closeCart.addEventListener('click', () => {
        elements.cartSidebar.classList.remove('open');
        elements.overlay.classList.remove('open');
    });

    elements.checkoutBtn.addEventListener('click', openCheckout);

    // Оформлення замовлення
    elements.closeCheckout.addEventListener('click', () => hideModal('checkoutModal'));
    elements.cancelCheckout.addEventListener('click', () => hideModal('checkoutModal'));
    elements.confirmOrder.addEventListener('click', confirmOrder);

    // Мої замовлення
    elements.ordersLink.addEventListener('click', (e) => {
        e.preventDefault();
        loadOrders();
        showModal('ordersModal');
    });

    elements.closeOrders.addEventListener('click', () => hideModal('ordersModal'));

    // Оверлей
    elements.overlay.addEventListener('click', () => {
        elements.cartSidebar.classList.remove('open');
        elements.overlay.classList.remove('open');
        document.querySelectorAll('.modal.open').forEach(modal => {
            modal.classList.remove('open');
        });
    });

    // Фільтри та пошук
    elements.searchInput.addEventListener('input', applyFiltersAndSort);
    elements.applyFilters.addEventListener('click', applyFiltersAndSort);
    elements.resetFilters.addEventListener('click', resetFilters);
    elements.resetFiltersEmpty.addEventListener('click', resetFilters);
    elements.sortSelect.addEventListener('change', applyFiltersAndSort);

    // Фільтр категорій
    document.querySelectorAll('input[name="category"]').forEach(cb => {
        cb.addEventListener('change', applyFiltersAndSort);
    });
}

function resetFilters() {
    elements.searchInput.value = '';
    document.getElementById('priceMin').value = '';
    document.getElementById('priceMax').value = '';
    document.querySelectorAll('input[name="category"]').forEach(cb => {
        cb.checked = true;
    });
    elements.sortSelect.value = 'title';
    applyFiltersAndSort();
}

// Експорт функції для HTML onclick
window.quickLogin = quickLogin;
