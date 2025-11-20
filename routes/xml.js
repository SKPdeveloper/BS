// Роутер для роботи з XML (експорт/імпорт, XSLT трансформації)
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const {
  loadXMLFile,
  validateXMLAgainstXSD,
  parseXMLToObject,
  saveCatalogBooks,
  saveOrders
} = require('../utils/xmlUtils');

// Налаштування multer для завантаження файлів
const upload = multer({ dest: 'uploads/' });

/**
 * GET /api/xml/catalog
 * Експортувати каталог в XML
 */
router.get('/catalog', (req, res) => {
  try {
    const xmlContent = loadXMLFile('catalog.xml');
    res.set('Content-Type', 'application/xml');
    res.set('Content-Disposition', 'attachment; filename="catalog.xml"');
    res.send(xmlContent);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/xml/orders
 * Експортувати замовлення в XML
 */
router.get('/orders', (req, res) => {
  try {
    const xmlContent = loadXMLFile('orders.xml');
    res.set('Content-Type', 'application/xml');
    res.set('Content-Disposition', 'attachment; filename="orders.xml"');
    res.send(xmlContent);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/xml/xsd/:type
 * Отримати XSD схему
 */
router.get('/xsd/:type', (req, res) => {
  try {
    const type = req.params.type;
    const filename = type === 'catalog' ? 'catalog.xsd' : 'orders.xsd';
    const xsdPath = path.join(__dirname, '..', 'data', filename);

    if (!fs.existsSync(xsdPath)) {
      return res.status(404).json({ success: false, error: 'XSD схему не знайдено' });
    }

    const xsdContent = fs.readFileSync(xsdPath, 'utf-8');
    res.set('Content-Type', 'application/xml');
    res.send(xsdContent);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/xml/xslt/:name
 * Отримати XSLT файл
 */
router.get('/xslt/:name', (req, res) => {
  try {
    const name = req.params.name;
    const xsltPath = path.join(__dirname, '..', 'xslt', `${name}.xsl`);

    if (!fs.existsSync(xsltPath)) {
      return res.status(404).json({ success: false, error: 'XSLT файл не знайдено' });
    }

    const xsltContent = fs.readFileSync(xsltPath, 'utf-8');
    res.set('Content-Type', 'application/xml');
    res.send(xsltContent);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/xml/import/catalog
 * Імпортувати каталог з XML файлу
 */
router.post('/import/catalog', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Файл не завантажено' });
    }

    // Читання завантаженого файлу
    const xmlContent = fs.readFileSync(req.file.path, 'utf-8');

    // Валідація
    const validation = validateXMLAgainstXSD(xmlContent, 'catalog.xsd');
    if (!validation.valid) {
      fs.unlinkSync(req.file.path); // Видалити тимчасовий файл
      return res.status(400).json({
        success: false,
        error: 'XML файл не пройшов валідацію',
        errors: validation.errors
      });
    }

    // Парсинг XML
    const catalog = await parseXMLToObject(xmlContent);
    const importedBooks = Array.isArray(catalog.catalog.book)
      ? catalog.catalog.book
      : [catalog.catalog.book];

    // Імпорт книг
    const mode = req.body.mode || 'add'; // add, update, replace

    if (mode === 'replace') {
      await saveCatalogBooks(importedBooks);
    } else {
      // Завантажити існуючий каталог та об'єднати
      const existingBooks = await getCatalogBooks();

      if (mode === 'add') {
        // Додати тільки нові
        importedBooks.forEach(book => {
          if (!existingBooks.find(b => b.id === book.id)) {
            existingBooks.push(book);
          }
        });
      } else if (mode === 'update') {
        // Оновити існуючі та додати нові
        importedBooks.forEach(book => {
          const existingIndex = existingBooks.findIndex(b => b.id === book.id);
          if (existingIndex !== -1) {
            existingBooks[existingIndex] = book;
          } else {
            existingBooks.push(book);
          }
        });
      }

      await saveCatalogBooks(existingBooks);
    }

    // Видалити тимчасовий файл
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: 'Каталог успішно імпортовано',
      count: importedBooks.length
    });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/xml/validate/catalog
 * Валідувати каталог
 */
router.post('/validate/catalog', (req, res) => {
  try {
    const xmlContent = loadXMLFile('catalog.xml');
    const validation = validateXMLAgainstXSD(xmlContent, 'catalog.xsd');

    res.json({
      success: true,
      valid: validation.valid,
      errors: validation.errors,
      message: validation.valid ? 'Каталог валідний' : 'Каталог містить помилки'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/xml/validate/orders
 * Валідувати замовлення
 */
router.post('/validate/orders', (req, res) => {
  try {
    const xmlContent = loadXMLFile('orders.xml');
    const validation = validateXMLAgainstXSD(xmlContent, 'orders.xsd');

    res.json({
      success: true,
      valid: validation.valid,
      errors: validation.errors,
      message: validation.valid ? 'Замовлення валідні' : 'Замовлення містять помилки'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
