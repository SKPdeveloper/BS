<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

  <xsl:template match="/">
    <table class="catalog-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Назва</th>
          <th>Автор</th>
          <th>Категорія</th>
          <th>Ціна</th>
          <th>Склад</th>
          <th>Статус</th>
          <th>Дії</th>
        </tr>
      </thead>
      <tbody>
        <xsl:apply-templates select="catalog/book"/>
      </tbody>
    </table>
  </xsl:template>

  <xsl:template match="book">
    <tr data-book-id="{@id}">
      <xsl:if test="@deleted='true'">
        <xsl:attribute name="class">deleted-row</xsl:attribute>
      </xsl:if>
      <td><xsl:value-of select="@id"/></td>
      <td><xsl:value-of select="title"/></td>
      <td><xsl:value-of select="author"/></td>
      <td><span class="badge badge-{category}"><xsl:value-of select="category"/></span></td>
      <td><xsl:value-of select="price"/> грн</td>
      <td>
        <input type="number" class="stock-input" value="{stock}" min="0" data-book-id="{@id}"/>
      </td>
      <td>
        <xsl:choose>
          <xsl:when test="@deleted='true'">
            <span class="status-badge status-deleted">Видалено</span>
          </xsl:when>
          <xsl:when test="stock = 0">
            <span class="status-badge status-out">Немає</span>
          </xsl:when>
          <xsl:when test="stock &lt; 5">
            <span class="status-badge status-low">Мало</span>
          </xsl:when>
          <xsl:otherwise>
            <span class="status-badge status-ok">В наявності</span>
          </xsl:otherwise>
        </xsl:choose>
      </td>
      <td class="actions-cell">
        <button class="btn-icon btn-edit" data-book-id="{@id}" title="Редагувати">✏️</button>
        <button class="btn-icon btn-delete" data-book-id="{@id}" title="Видалити">🗑️</button>
      </td>
    </tr>
  </xsl:template>

</xsl:stylesheet>
