// Роутер для роботи з каталогом книг
const express = require('express');
const router = express.Router();
const {
  getCatalogBooks,
  saveCatalogBooks,
  generateBookId,
  logXMLChange,
  validateXMLAgainstXSD,
  loadXMLFile
} = require('../utils/xmlUtils');

/**
 * GET /api/catalog
 * Отримати всі книги з каталогу
 */
router.get('/', async (req, res) => {
  try {
    const books = await getCatalogBooks();

    // Фільтрація видалених книг (за замовчуванням не показуємо)
    const showDeleted = req.query.showDeleted === 'true';
    const filteredBooks = showDeleted
      ? books
      : books.filter(book => book.deleted !== 'true');

    res.json({
      success: true,
      count: filteredBooks.length,
      books: filteredBooks
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/catalog/:id
 * Отримати книгу за ID
 */
router.get('/:id', async (req, res) => {
  try {
    const books = await getCatalogBooks();
    const book = books.find(b => (b.$ && b.$.id === req.params.id) || b.id === req.params.id);

    if (!book) {
      return res.status(404).json({ success: false, error: 'Книгу не знайдено' });
    }

    res.json({ success: true, book });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/catalog
 * Додати нову книгу (тільки для менеджера)
 */
router.post('/', async (req, res) => {
  try {
    const { title, author, category, price, description, isbn, year, stock, image } = req.body;

    // Валідація обов'язкових полів
    if (!title || !author || !category || !price || !description || !isbn || !year || stock === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Не всі обов\'язкові поля заповнені'
      });
    }

    const books = await getCatalogBooks();

    // Генерація ID
    const newBook = {
      $: {
        id: generateBookId(),
        deleted: 'false'
      },
      title,
      author,
      category,
      price: {
        _: parseFloat(price).toFixed(2),
        $: { currency: 'UAH' }
      },
      description,
      isbn,
      year: parseInt(year),
      stock: parseInt(stock),
      image: image || ''
    };

    books.push(newBook);
    await saveCatalogBooks(books);

    // Логування
    logXMLChange('catalog', 'CREATE', newBook.id, req.body.manager || 'manager', `Додано книгу "${title}"`);

    res.json({
      success: true,
      message: 'Книгу успішно додано',
      book: newBook
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/catalog/:id
 * Оновити книгу (тільки для менеджера)
 */
router.put('/:id', async (req, res) => {
  try {
    const books = await getCatalogBooks();
    const bookIndex = books.findIndex(b => (b.$ && b.$.id === req.params.id) || b.id === req.params.id);

    if (bookIndex === -1) {
      return res.status(404).json({ success: false, error: 'Книгу не знайдено' });
    }

    const { title, author, category, price, description, isbn, year, stock, image } = req.body;

    // Оновлення даних
    const updatedBook = {
      ...books[bookIndex],
      title: title || books[bookIndex].title,
      author: author || books[bookIndex].author,
      category: category || books[bookIndex].category,
      price: price ? {
        _: parseFloat(price).toFixed(2),
        $: { currency: 'UAH' }
      } : books[bookIndex].price,
      description: description || books[bookIndex].description,
      isbn: isbn || books[bookIndex].isbn,
      year: year ? parseInt(year) : books[bookIndex].year,
      stock: stock !== undefined ? parseInt(stock) : books[bookIndex].stock,
      image: image !== undefined ? image : books[bookIndex].image
    };

    books[bookIndex] = updatedBook;
    await saveCatalogBooks(books);

    // Логування
    logXMLChange('catalog', 'UPDATE', updatedBook.id, req.body.manager || 'manager', `Оновлено книгу "${title}"`);

    res.json({
      success: true,
      message: 'Книгу успішно оновлено',
      book: updatedBook
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/catalog/:id
 * Видалити книгу (м'яке або жорстке видалення)
 */
router.delete('/:id', async (req, res) => {
  try {
    const books = await getCatalogBooks();
    const bookIndex = books.findIndex(b => (b.$ && b.$.id === req.params.id) || b.id === req.params.id);

    if (bookIndex === -1) {
      return res.status(404).json({ success: false, error: 'Книгу не знайдено' });
    }

    const hardDelete = req.query.hard === 'true';

    if (hardDelete) {
      // Жорстке видалення - повне видалення з XML
      const deletedBook = books[bookIndex];
      books.splice(bookIndex, 1);
      await saveCatalogBooks(books);

      logXMLChange('catalog', 'HARD_DELETE', req.params.id, req.body.manager || 'manager',
        `Жорстко видалено книгу "${deletedBook.title}"`);

      res.json({
        success: true,
        message: 'Книгу повністю видалено з каталогу'
      });
    } else {
      // М'яке видалення - позначка deleted="true"
      if (books[bookIndex].$) {
        books[bookIndex].$.deleted = 'true';
      } else {
        books[bookIndex].deleted = 'true';
      }
      await saveCatalogBooks(books);

      logXMLChange('catalog', 'SOFT_DELETE', req.params.id, req.body.manager || 'manager',
        `М'яко видалено книгу "${books[bookIndex].title}"`);

      res.json({
        success: true,
        message: 'Книгу позначено як видалену'
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/catalog/:id/stock
 * Оновити кількість на складі
 */
router.patch('/:id/stock', async (req, res) => {
  try {
    const { stock } = req.body;

    if (stock === undefined || stock < 0) {
      return res.status(400).json({
        success: false,
        error: 'Некоректна кількість'
      });
    }

    const books = await getCatalogBooks();
    const bookIndex = books.findIndex(b => (b.$ && b.$.id === req.params.id) || b.id === req.params.id);

    if (bookIndex === -1) {
      return res.status(404).json({ success: false, error: 'Книгу не знайдено' });
    }

    books[bookIndex].stock = parseInt(stock);
    await saveCatalogBooks(books);

    logXMLChange('catalog', 'UPDATE_STOCK', req.params.id, req.body.manager || 'manager',
      `Оновлено кількість до ${stock} шт.`);

    res.json({
      success: true,
      message: 'Кількість на складі оновлено',
      book: books[bookIndex]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/catalog/validate
 * Валідувати каталог за XSD схемою
 */
router.get('/validate/xsd', async (req, res) => {
  try {
    const xmlContent = loadXMLFile('catalog.xml');
    const validation = validateXMLAgainstXSD(xmlContent, 'catalog.xsd');

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
