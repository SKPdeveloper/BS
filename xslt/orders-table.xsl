<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

  <xsl:template match="/">
    <table class="orders-table">
      <thead>
        <tr>
          <th>№</th>
          <th>Дата</th>
          <th>Клієнт</th>
          <th>Email</th>
          <th>Товарів</th>
          <th>Сума</th>
          <th>Статус</th>
          <th>Дії</th>
        </tr>
      </thead>
      <tbody>
        <xsl:apply-templates select="orders/order"/>
      </tbody>
    </table>
  </xsl:template>

  <xsl:template match="order">
    <tr data-order-id="{@id}">
      <td><xsl:value-of select="@id"/></td>
      <td>
        <xsl:value-of select="substring(@date, 1, 10)"/>
        <br/>
        <span class="time-cell"><xsl:value-of select="substring(@date, 12, 5)"/></span>
      </td>
      <td><xsl:value-of select="customer/name"/></td>
      <td><xsl:value-of select="customer/email"/></td>
      <td class="center-text"><xsl:value-of select="count(items/item)"/></td>
      <td class="price-cell"><xsl:value-of select="format-number(total, '0.00')"/> грн</td>
      <td>
        <xsl:choose>
          <xsl:when test="@status='нове'">
            <span class="status-badge status-new">🔵 нове</span>
          </xsl:when>
          <xsl:when test="@status='обробляється'">
            <span class="status-badge status-processing">🟡 обробляється</span>
          </xsl:when>
          <xsl:when test="@status='відправлено'">
            <span class="status-badge status-shipped">⚫ відправлено</span>
          </xsl:when>
          <xsl:when test="@status='виконано'">
            <span class="status-badge status-completed">✅ виконано</span>
          </xsl:when>
          <xsl:when test="@status='скасовано'">
            <span class="status-badge status-cancelled">❌ скасовано</span>
          </xsl:when>
        </xsl:choose>
      </td>
      <td class="actions-cell">
        <button class="btn-icon btn-view" data-order-id="{@id}" title="Переглянути">👁️</button>
        <button class="btn-icon btn-status" data-order-id="{@id}" title="Змінити статус">✏️</button>
      </td>
    </tr>
  </xsl:template>

</xsl:stylesheet>
