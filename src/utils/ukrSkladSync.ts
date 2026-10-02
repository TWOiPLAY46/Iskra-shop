import { Product, Order } from '../types/store';

export interface UkrSkladParsedData {
  products: Partial<Product>[];
  categories: { id: string; name: string; parentId?: string }[];
  totalParsed: number;
  errors: string[];
}

/**
 * Parses UkrSklad CommerceML 2.0 XML (import.xml or offers.xml) or standard XML product feed
 */
export function parseUkrSkladXML(xmlString: string): UkrSkladParsedData {
  const result: UkrSkladParsedData = {
    products: [],
    categories: [],
    totalParsed: 0,
    errors: []
  };

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'application/xml');

    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      result.errors.push('Помилка структури XML: ' + parseError.textContent?.slice(0, 100));
      return result;
    }

    // 1. Extract Categories / Groups (<Группы> / <Группа> or <category>)
    const groupElements = doc.querySelectorAll('Группы > Группа, Groups > Group, categories > category');
    const categoryMap = new Map<string, string>();

    groupElements.forEach(el => {
      const id = el.querySelector('Ид, Id, ID')?.textContent?.trim() || el.getAttribute('id') || '';
      const name = el.querySelector('Наименование, Name, name')?.textContent?.trim() || el.textContent?.trim() || '';
      const parentId = el.querySelector('ИдРодителя, ParentId')?.textContent?.trim();

      if (id && name) {
        categoryMap.set(id, name);
        result.categories.push({ id, name, parentId });
      }
    });

    // 2. Extract Products (<Товар> or <offer> or <item>)
    const itemElements = doc.querySelectorAll('Товары > Товар, offers > offer, items > item, Каталог > Товар');

    itemElements.forEach((el, index) => {
      try {
        const id = el.querySelector('Ид, Id, ID')?.textContent?.trim() || el.getAttribute('id') || `ukr-${Date.now()}-${index}`;
        const name = el.querySelector('Наименование, Name, name, title')?.textContent?.trim() || '';
        const sku = el.querySelector('Артикул, Code, SKU, sku, Штрихкод, Barcode')?.textContent?.trim() || `SKU-${index + 100}`;
        const desc = el.querySelector('Описание, Description, description, ПолноеНаименование')?.textContent?.trim() || '';
        
        // Category resolution
        let catName = 'Сантехніка та опалення';
        const catId = el.querySelector('Группы > Ид, CategoryId, categoryId')?.textContent?.trim() || el.querySelector('category')?.textContent?.trim();
        if (catId && categoryMap.has(catId)) {
          catName = categoryMap.get(catId)!;
        } else if (el.querySelector('Категория, Category')?.textContent?.trim()) {
          catName = el.querySelector('Категория, Category')?.textContent?.trim()!;
        }

        // Price resolution (<Цены> or <price>)
        let price = 0;
        const priceStr = el.querySelector('Цены > Цена > ЦенаЗаЕдиницу, price, Price, розница, Цена')?.textContent?.trim();
        if (priceStr) {
          const num = parseFloat(priceStr.replace(',', '.').replace(/[^\d.]/g, ''));
          if (!isNaN(num) && num > 0) price = num;
        }

        // Stock quantity (<Количество> or <stock> or <amount>)
        let stock = 10;
        const stockStr = el.querySelector('Количество, Stock, stock, Остаток, amount, quantity')?.textContent?.trim();
        if (stockStr) {
          const num = parseInt(stockStr.replace(/[^\d]/g, ''), 10);
          if (!isNaN(num)) stock = num;
        }

        // Unit (<БазоваяЕдиница> or <unit>)
        const unit = el.querySelector('БазоваяЕдиница, Unit, unit, Единица')?.textContent?.trim() || 'шт';

        // Image URL (<Картинка> or <image> or <picture>)
        const image = el.querySelector('Картинка, Image, image, picture, photo')?.textContent?.trim() || '';

        // Brand resolution
        let brand = '';
        const brandStr = el.querySelector('Изготовитель > Наименование, Производитель, Brand, brand, vendor')?.textContent?.trim();
        if (brandStr) brand = brandStr;

        if (name) {
          // Automatic smart mainCategory assignment
          let mainCategory = 'Сантехніка та опалення';
          const lowerName = (name + ' ' + catName).toLowerCase();
          if (lowerName.includes('електр') || lowerName.includes('ламп') || lowerName.includes('розетк') || lowerName.includes('кабел') || lowerName.includes('автомат') || lowerName.includes('led')) {
            mainCategory = 'Електротовари';
          } else if (lowerName.includes('інструмент') || lowerName.includes('дриль') || lowerName.includes('молот') || lowerName.includes('болгарк') || lowerName.includes('шуруп')) {
            mainCategory = 'Інструменти та обладнання';
          } else if (lowerName.includes('замок') || lowerName.includes('відр') || lowerName.includes('швабр') || lowerName.includes('господар')) {
            mainCategory = 'Господарчі товари';
          }

          result.products.push({
            id,
            name,
            sku,
            desc,
            category: catName,
            mainCategory,
            subCategory: catName,
            price: price || 100,
            stock: stock,
            unit: unit || 'шт',
            image: image || '',
            brand: brand || undefined,
            badge: ''
          });
        }
      } catch (err: any) {
        result.errors.push(`Помилка рядка товару: ${err.message}`);
      }
    });

    result.totalParsed = result.products.length;
  } catch (error: any) {
    result.errors.push(`Не вдалося розібрати XML: ${error.message}`);
  }

  return result;
}

/**
 * Generates CommerceML 2.0 orders.xml for UkrSklad
 */
export function generateCommerceMLOrdersXML(orders: Order[]): string {
  const currentDate = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toTimeString().split(' ')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<КоммерческаяИнформация ВерсияСхемы="2.09" ДатаФормирования="${currentDate}T${currentTime}">\n`;

  orders.forEach(order => {
    xml += `  <Документ>\n`;
    xml += `    <Ид>${order.id}</Ид>\n`;
    xml += `    <Номер>${order.id}</Номер>\n`;
    xml += `    <Дата>${order.date || currentDate}</Дата>\n`;
    xml += `    <ХозОперация>Заказ товара</ХозОперация>\n`;
    xml += `    <Роль>Продавец</Роль>\n`;
    xml += `    <Валюта>UAH</Валюта>\n`;
    xml += `    <Курс>1</Курс>\n`;
    xml += `    <Сумма>${order.total}</Сумма>\n`;
    
    // Counterparty / Client
    xml += `    <Контрагенты>\n`;
    xml += `      <Контрагент>\n`;
    xml += `        <Ид>${order.phone.replace(/[^\d]/g, '')}</Ид>\n`;
    xml += `        <Наименование>${escapeXML(order.fio)}</Наименование>\n`;
    xml += `        <ПолноеНаименование>${escapeXML(order.fio)}</ПолноеНаименование>\n`;
    xml += `        <Роль>Покупатель</Роль>\n`;
    xml += `        <Контакты>\n`;
    xml += `          <Контакт>\n`;
    xml += `            <Тип>Телефон</Тип>\n`;
    xml += `            <Значение>${escapeXML(order.phone)}</Значение>\n`;
    xml += `          </Контакт>\n`;
    xml += `        </Контакты>\n`;
    xml += `        <АдресДоставки>\n`;
    xml += `          <Представление>${escapeXML(order.city + ', ' + order.delivery)}</Представление>\n`;
    xml += `        </АдресДоставки>\n`;
    xml += `      </Контрагент>\n`;
    xml += `    </Контрагенты>\n`;

    // Items
    xml += `    <Товары>\n`;
    order.items.forEach(item => {
      xml += `      <Товар>\n`;
      xml += `        <Ид>${escapeXML(item.sku || item.name)}</Ид>\n`;
      xml += `        <Артикул>${escapeXML(item.sku || '')}</Артикул>\n`;
      xml += `        <Наименование>${escapeXML(item.name)}</Наименование>\n`;
      xml += `        <БазоваяЕдиница Код="796" НаименованиеПолное="${escapeXML(item.unit || 'шт')}">${escapeXML(item.unit || 'шт')}</БазоваяЕдиница>\n`;
      xml += `        <ЦенаЗаЕдиницу>${item.price}</ЦенаЗаЕдиницу>\n`;
      xml += `        <Количество>${item.qty}</Количество>\n`;
      xml += `        <Сумма>${item.price * item.qty}</Сумма>\n`;
      xml += `      </Товар>\n`;
    });
    xml += `    </Товары>\n`;

    // Notes and status
    xml += `    <Комментарий>Статус: ${order.status}. Оплата: ${order.isPaid ? 'ОПЛАЧЕНО' : 'Очікує оплати'}. ${escapeXML(order.notes || '')}</Комментарий>\n`;
    xml += `  </Документ>\n`;
  });

  xml += `</КоммерческаяИнформация>`;
  return xml;
}

function escapeXML(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
