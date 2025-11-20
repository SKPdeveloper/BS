// Утиліти для роботи з XML файлами
const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const libxml = require('libxmljs2');
const { logQueries } = require('../database');

const dataDir = path.join(__dirname, '..', 'data');

/**
 * Завантажити XML файл
 */
function loadXMLFile(filename) {
  try {
    const filePath = path.join(dataDir, filename);
    const xmlContent = fs.readFileSync(filePath, 'utf-8');
    return xmlContent;
  } catch (error) {
    console.error(`Помилка завантаження XML файлу ${filename}:`, error.message);
    throw new Error(`Не вдалося завантажити файл ${filename}`);
  }
}

/**
 * Зберегти XML файл
 */
function saveXMLFile(filename, xmlContent) {
  try {
    const filePath = path.join(dataDir, filename);
    fs.writeFileSync(filePath, xmlContent, 'utf-8');
    console.log(`✅ Файл ${filename} успішно збережено`);
    return true;
  } catch (error) {
    console.error(`Помилка збереження XML файлу ${filename}:`, error.message);
    throw new Error(`Не вдалося зберегти файл ${filename}`);
  }
}

/**
 * Валідувати XML за XSD схемою
 */
function validateXMLAgainstXSD(xmlContent, xsdFilename) {
  try {
    // Завантажити XSD схему
    const xsdPath = path.join(dataDir, xsdFilename);
    const xsdContent = fs.readFileSync(xsdPath, 'utf-8');

    // Парсинг XML та XSD
    const xmlDoc = libxml.parseXml(xmlContent);
    const xsdDoc = libxml.parseXml(xsdContent);

    // Валідація
    const isValid = xmlDoc.validate(xsdDoc);

    if (isValid) {
      return { valid: true, errors: [] };
    } else {
      const errors = xmlDoc.validationErrors.map(err => ({
        message: err.message,
        line: err.line,
        column: err.column
      }));
      return { valid: false, errors };
    }
  } catch (error) {
    console.error('Помилка валідації XML:', error.message);
    return {
      valid: false,
      errors: [{ message: error.message, line: 0, column: 0 }]
    };
  }
}

/**
 * Парсити XML в JavaScript об'єкт
 */
async function parseXMLToObject(xmlContent) {
  try {
    const parser = new xml2js.Parser({
      explicitArray: false,
      mergeAttrs: false,
      attrkey: '$',
      charkey: '_'
    });
    const result = await parser.parseStringPromise(xmlContent);
    return result;
  } catch (error) {
    console.error('Помилка парсингу XML:', error.message);
    throw new Error('Не вдалося розпарсити XML');
  }
}

/**
 * Конвертувати JavaScript об'єкт в XML
 */
function objectToXML(obj, rootName = 'root') {
  try {
    const builder = new xml2js.Builder({
      xmldec: { version: '1.0', encoding: 'UTF-8' },
      renderOpts: { pretty: true, indent: '  ' },
      attrkey: '$',
      charkey: '_',
      headless: false
    });

    // Якщо об'єкт вже має кореневий елемент
    if (obj[rootName]) {
      return builder.buildObject(obj);
    }

    // Інакше обгортаємо
    const wrapped = { [rootName]: obj };
    return builder.buildObject(wrapped);
  } catch (error) {
    console.error('Помилка конвертації об\'єкта в XML:', error.message);
    throw new Error('Не вдалося створити XML');
  }
}

/**
 * Отримати всі книги з каталогу
 */
async function getCatalogBooks() {
  try {
    const xmlContent = loadXMLFile('catalog.xml');
    const catalog = await parseXMLToObject(xmlContent);

    // Перевірка структури
    if (!catalog.catalog || !catalog.catalog.book) {
      return [];
    }

    // Якщо одна книга - перетворимо в масив
    const books = Array.isArray(catalog.catalog.book)
      ? catalog.catalog.book
      : [catalog.catalog.book];

    return books;
  } catch (error) {
    console.error('Помилка отримання книг:', error.message);
    return [];
  }
}

/**
 * Зберегти каталог книг
 */
async function saveCatalogBooks(books) {
  try {
    const catalogObj = {
      catalog: {
        book: books
      }
    };

    const xmlContent = objectToXML(catalogObj, 'catalog');

    // Валідація перед збереженням
    const validation = validateXMLAgainstXSD(xmlContent, 'catalog.xsd');
    if (!validation.valid) {
      console.error('Помилки валідації каталогу:', validation.errors);
      throw new Error('XML не пройшов валідацію');
    }

    saveXMLFile('catalog.xml', xmlContent);
    return true;
  } catch (error) {
    console.error('Помилка збереження каталогу:', error.message);
    throw error;
  }
}

/**
 * Отримати всі замовлення
 */
async function getOrders() {
  try {
    const xmlContent = loadXMLFile('orders.xml');
    const ordersData = await parseXMLToObject(xmlContent);

    // Перевірка структури
    if (!ordersData.orders) {
      return [];
    }

    // Якщо немає замовлень
    if (!ordersData.orders.order) {
      return [];
    }

    // Якщо одне замовлення - перетворимо в масив
    const orders = Array.isArray(ordersData.orders.order)
      ? ordersData.orders.order
      : [ordersData.orders.order];

    return orders;
  } catch (error) {
    console.error('Помилка отримання замовлень:', error.message);
    return [];
  }
}

/**
 * Зберегти замовлення
 */
async function saveOrders(orders) {
  try {
    // Нормалізація структури замовлень для xml2js
    const normalizedOrders = orders.map((order, index) => {
      // Переконатися що items.item завжди масив
      if (order.items && order.items.item) {
        if (!Array.isArray(order.items.item)) {
          order.items.item = [order.items.item];
        }

        // Перевірка що всі items мають атрибути
        order.items.item = order.items.item.map(item => {
          if (!item.$) {
            console.warn(`Замовлення ${index}: item без атрибутів, додаю пусті атрибути`, item);
            return {
              $: {
                book_id: item.book_id || item.bookId || 'unknown',
                quantity: item.quantity || '1'
              },
              title: item.title,
              price: item.price,
              subtotal: item.subtotal
            };
          }
          return item;
        });
      }

      // Переконатися що statusHistory.statusChange завжди масив
      if (order.statusHistory && order.statusHistory.statusChange && !Array.isArray(order.statusHistory.statusChange)) {
        order.statusHistory.statusChange = [order.statusHistory.statusChange];
      }

      return order;
    });

    const ordersObj = {
      orders: {
        order: normalizedOrders
      }
    };

    const xmlContent = objectToXML(ordersObj, 'orders');

    // Валідація перед збереженням
    const validation = validateXMLAgainstXSD(xmlContent, 'orders.xsd');
    if (!validation.valid) {
      console.error('Помилки валідації замовлень:', validation.errors);
      console.error('Згенерований XML:', xmlContent.substring(0, 500));
      throw new Error('XML замовлень не пройшов валідацію');
    }

    saveXMLFile('orders.xml', xmlContent);
    return true;
  } catch (error) {
    console.error('Помилка збереження замовлень:', error.message);
    throw error;
  }
}

/**
 * Генерувати унікальний ID для книги
 */
function generateBookId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `book_${timestamp}_${random}`;
}

/**
 * Генерувати унікальний ID для замовлення
 */
function generateOrderId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `ORD-${random.toString().padStart(6, '0')}`;
}

/**
 * Логувати зміни в XML
 */
function logXMLChange(fileType, operation, entityId, changedBy, description) {
  try {
    logQueries.logChange(fileType, operation, entityId, changedBy, description);
  } catch (error) {
    console.error('Помилка логування змін:', error.message);
  }
}

module.exports = {
  loadXMLFile,
  saveXMLFile,
  validateXMLAgainstXSD,
  parseXMLToObject,
  objectToXML,
  getCatalogBooks,
  saveCatalogBooks,
  getOrders,
  saveOrders,
  generateBookId,
  generateOrderId,
  logXMLChange
};
