<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

  <xsl:template match="/">
    <div class="catalog-grid">
      <xsl:apply-templates select="catalog/book[@deleted='false' or not(@deleted)]"/>
    </div>
  </xsl:template>

  <xsl:template match="book">
    <div class="book-card" data-id="{@id}" data-category="{category}" data-price="{price}">
      <xsl:if test="image">
        <img src="{image}" alt="{title}" class="book-cover" onerror="this.src='images/placeholder.jpg'"/>
      </xsl:if>
      <xsl:if test="not(image)">
        <img src="images/placeholder.jpg" alt="{title}" class="book-cover"/>
      </xsl:if>
      <div class="book-info">
        <h3 class="book-title"><xsl:value-of select="title"/></h3>
        <p class="book-author"><xsl:value-of select="author"/></p>
        <span class="book-category badge-{category}">
          <xsl:value-of select="category"/>
        </span>
        <p class="book-description"><xsl:value-of select="description"/></p>
        <div class="book-details">
          <span class="book-year">Рік: <xsl:value-of select="year"/></span>
          <span class="book-isbn">ISBN: <xsl:value-of select="isbn"/></span>
        </div>
        <div class="book-footer">
          <span class="book-price"><xsl:value-of select="price"/> грн</span>
          <xsl:choose>
            <xsl:when test="stock &gt; 0">
              <span class="book-stock in-stock">В наявності: <xsl:value-of select="stock"/> шт</span>
              <button class="btn-add-cart" data-book-id="{@id}">До кошика</button>
            </xsl:when>
            <xsl:otherwise>
              <span class="book-stock out-of-stock">Немає в наявності</span>
              <button class="btn-add-cart" disabled="disabled">Недоступно</button>
            </xsl:otherwise>
          </xsl:choose>
        </div>
      </div>
    </div>
  </xsl:template>

</xsl:stylesheet>
