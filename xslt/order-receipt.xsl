<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

  <xsl:template match="/order">
    <div class="receipt">
      <div class="receipt-header">
        <h1>ЧЕК ЗАМОВЛЕННЯ</h1>
        <p class="receipt-number">№ <xsl:value-of select="@id"/></p>
        <p class="receipt-date">Дата: <xsl:value-of select="substring(@date, 1, 10)"/> <xsl:value-of select="substring(@date, 12, 5)"/></p>
      </div>

      <div class="receipt-customer">
        <h2>Покупець:</h2>
        <p><strong>Ім'я:</strong> <xsl:value-of select="customer/name"/></p>
        <p><strong>Email:</strong> <xsl:value-of select="customer/email"/></p>
        <p><strong>Телефон:</strong> <xsl:value-of select="customer/phone"/></p>
        <p><strong>Адреса:</strong> <xsl:value-of select="customer/city"/>, <xsl:value-of select="customer/address"/></p>
      </div>

      <div class="receipt-items">
        <h2>Товари:</h2>
        <table class="receipt-table">
          <thead>
            <tr>
              <th>№</th>
              <th>Назва</th>
              <th>Ціна</th>
              <th>Кількість</th>
              <th>Сума</th>
            </tr>
          </thead>
          <tbody>
            <xsl:for-each select="items/item">
              <tr>
                <td><xsl:value-of select="position()"/></td>
                <td><xsl:value-of select="title"/></td>
                <td><xsl:value-of select="format-number(price, '0.00')"/> грн</td>
                <td><xsl:value-of select="@quantity"/></td>
                <td><xsl:value-of select="format-number(subtotal, '0.00')"/> грн</td>
              </tr>
            </xsl:for-each>
          </tbody>
        </table>
      </div>

      <div class="receipt-total">
        <h2>Разом до сплати: <xsl:value-of select="format-number(total, '0.00')"/> грн</h2>
      </div>

      <div class="receipt-status">
        <p><strong>Статус замовлення:</strong> <xsl:value-of select="@status"/></p>
      </div>

      <div class="receipt-footer">
        <p>Дякуємо за покупку!</p>
        <p>Книгарня онлайн - найкращі книги для вас</p>
        <p class="receipt-note">Цей документ є підтвердженням вашого замовлення</p>
      </div>
    </div>
  </xsl:template>

</xsl:stylesheet>
