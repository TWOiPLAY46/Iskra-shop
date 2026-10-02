import { Product, Order } from '../types/store';
import { formatUnit, normalizeStorageUnit } from './unitFormatter';

export interface UkrSkladParsedData {
  products: Partial<Product>[];
  categories: { id: string; name: string; parentId?: string }[];
  totalParsed: number;
  errors: string[];
}

/**
 * Robustly parses UkrSklad CSV export (semicolon separated) or XML CommerceML feed
 */
export function parseUkrSkladFeed(rawText: string): UkrSkladParsedData {
  const trimmed = rawText.trim();
  if (trimmed.startsWith('<?xml') || trimmed.startsWith('<') || trimmed.includes('<КоммерческаяИнформация')) {
    return parseUkrSkladXML(trimmed);
  } else {
    return parseUkrSkladCSV(trimmed);
  }
}

/**
 * Parses UkrSklad CSV export (semicolon separated, Windows-1251 or UTF-8)
 */
export function parseUkrSkladCSV(csvText: string): UkrSkladParsedData {
  const result: UkrSkladParsedData = {
    products: [],
    categories: [],
    totalParsed: 0,
    errors: []
  };

  try {
    const rawLines = csvText.split(/\r\n|\n/).map(l => l.trim()).filter(Boolean);
    if (rawLines.length < 1) {
      result.errors.push('Файл CSV порожній.');
      return result;
    }

    // Detect delimiter
    const firstLine = rawLines[0] || '';
    let delimiter = ';';
    if (firstLine.includes(';') && firstLine.split(';').length >= firstLine.split(',').length) {
      delimiter = ';';
    } else if (firstLine.includes(',') && firstLine.split(',').length > firstLine.split(';').length) {
      delimiter = ',';
    } else if (firstLine.includes('\t')) {
      delimiter = '\t';
    }

    // Helper to parse CSV line with quotes and delimiter
    const parseCSVLine = (line: string): string[] => {
      const row: string[] = [];
      let inQuotes = false;
      let currentVal = '';
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          row.push(currentVal.trim().replace(/^["']|["']$/g, ''));
          currentVal = '';
        } else {
          currentVal += char;
        }
      }
      row.push(currentVal.trim().replace(/^["']|["']$/g, ''));
      return row;
    };

    const firstRowCols = parseCSVLine(rawLines[0]).map(h => h.toLowerCase());
    const hasHeader = firstRowCols.some(h => 
      h.includes('код') || h.includes('sku') || h.includes('арт') ||
      h.includes('назв') || h.includes('наймен') || h.includes('товар') ||
      h.includes('цін') || h.includes('цен') || h.includes('кол') || h.includes('остат')
    );

    let codeIdx = firstRowCols.findIndex(h => h.includes('код') || h.includes('sku') || h.includes('арт'));
    let nameIdx = firstRowCols.findIndex(h => h.includes('назв') || h.includes('наймен') || h.includes('товар'));
    let stockIdx = firstRowCols.findIndex(h => h.includes('кол') || h.includes('остаток') || h.includes('кіл') || h.includes('залиш'));
    let priceIdx = firstRowCols.findIndex(h => h.includes('цен') || h.includes('цін') || h.includes('розниц') || h.includes('грн') || h.includes('вартість'));
    let unitIdx = firstRowCols.findIndex(h => h.includes('ед') || h.includes('од') || h.includes('один'));
    let catIdx = firstRowCols.findIndex(h => h.includes('катег') || h.includes('груп'));

    if (!hasHeader) {
      codeIdx = 0;
      nameIdx = 1;
      stockIdx = 2;
      priceIdx = 3;
      unitIdx = 4;
    } else {
      if (nameIdx === -1) nameIdx = 1;
      if (codeIdx === -1) codeIdx = 0;
    }

    const startLineIdx = hasHeader ? 1 : 0;

    for (let i = startLineIdx; i < rawLines.length; i++) {
      const line = rawLines[i].trim();
      if (!line) continue;

      const cols = parseCSVLine(line);
      if (cols.length < 2) continue;

      // Find best name
      let rawName = (nameIdx >= 0 && cols[nameIdx]) ? cols[nameIdx] : (cols[1] || cols[0]);
      const name = cleanCyrillicText(rawName);
      if (!name || name.length < 2 || name === '(Blob)') continue;

      // Find SKU
      let sku = (codeIdx >= 0 && cols[codeIdx]) ? cols[codeIdx] : `SKU-${i}`;
      if (sku === name && cols[0] && cols[0] !== name) sku = cols[0];

      // Parse stock
      let stock = 10;
      if (stockIdx >= 0 && cols[stockIdx]) {
        const num = parseFloat(cols[stockIdx].replace(',', '.').replace(/[^\d.-]/g, ''));
        if (!isNaN(num)) stock = Math.round(num);
      }

      // Parse price
      let price = 0;
      if (priceIdx >= 0 && cols[priceIdx]) {
        const num = parseFloat(cols[priceIdx].replace(',', '.').replace(/[^\d.]/g, ''));
        if (!isNaN(num) && num > 0) price = num;
      }
      if (price === 0) {
        for (let c = 0; c < cols.length; c++) {
          if (c === nameIdx || c === codeIdx) continue;
          const val = (cols[c] || '').replace(',', '.').replace(/[^\d.]/g, '');
          const num = parseFloat(val);
          if (!isNaN(num) && num > 0 && num < 1000000) {
            price = num;
            break;
          }
        }
      }
      if (price === 0) price = 100;

      const rawUnit = unitIdx >= 0 && cols[unitIdx] ? cols[unitIdx] : 'шт';
      const unit = normalizeStorageUnit(rawUnit);

      // Smart category mapping
      let mainCategory = 'Сантехніка та опалення';
      let category = 'Змішувачі та комплектуючі';
      const lower = name.toLowerCase();

      if (lower.includes('led') || lower.includes('ламп') || lower.includes('світил') || lower.includes('прожект') || lower.includes('розетк') || lower.includes('вимикач') || lower.includes('кабел') || lower.includes('провід') || lower.includes('автомат') || lower.includes('трон') || lower.includes('etron')) {
        mainCategory = 'Електротовари';
        if (lower.includes('ламп') || lower.includes('led') || lower.includes('стріч')) {
          category = 'Освітлення';
        } else if (lower.includes('розетк') || lower.includes('вимикач')) {
          category = 'Електрофурнітура';
        } else if (lower.includes('автомат') || lower.includes('реле')) {
          category = 'Електрообладнання';
        } else {
          category = 'Кабель, провід, монтаж';
        }
      } else if (lower.includes('інструмент') || lower.includes('дриль') || lower.includes('шуруп') || lower.includes('болгарк') || lower.includes('перфоратор') || lower.includes('молот') || lower.includes('ключ') || lower.includes('свердл') || lower.includes('бур')) {
        mainCategory = 'Інструменти та обладнання';
        if (lower.includes('інструмент') || lower.includes('дриль') || lower.includes('шуруп') || lower.includes('болгарк')) {
          category = 'Електроінструмент';
        } else if (lower.includes('свердл') || lower.includes('бур') || lower.includes('диск')) {
          category = 'Витратні матеріали та оснастка';
        } else {
          category = 'Ручний інструмент';
        }
      } else if (lower.includes('замок') || lower.includes('дюбел') || lower.includes('шуруп') || lower.includes('відр') || lower.includes('швабр') || lower.includes('драбин') || lower.includes('рукавич')) {
        mainCategory = 'Господарчі товари';
        if (lower.includes('замок') || lower.includes('дюбел') || lower.includes('шуруп')) {
          category = 'Кріплення та замки';
        } else {
          category = 'Господарський інвентар';
        }
      }

      result.products.push({
        id: `ukr-csv-${i}-${Math.random().toString(36).substr(2, 4)}`,
        name,
        sku,
        category,
        mainCategory,
        subCategory: category,
        price,
        stock,
        unit: normalizeStorageUnit(unit),
        desc: `Товар з облікової програми УкрСклад (Артикул: ${sku})`,
        image: '',
        badge: ''
      });
    }

    result.totalParsed = result.products.length;
  } catch (err: any) {
    result.errors.push('Помилка читання CSV: ' + err.message);
  }

  return result;
}

/**
 * Helper to clean broken encoding characters if uploaded CSV is CP1251 decoded as UTF-8
 */
function cleanCyrillicText(text: string): string {
  if (!text) return '';
  // If it contains typical mojibake characters, return clean string or fallback
  return text.replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim();
}

/**
 * Parses UkrSklad CommerceML 2.0 XML (import.xml or offers.xml)
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
      result.errors.push('Помилка XML: ' + parseError.textContent?.slice(0, 100));
      return result;
    }

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

    const itemElements = doc.querySelectorAll('Товары > Товар, offers > offer, items > item, Каталог > Товар');

    itemElements.forEach((el, index) => {
      try {
        const id = el.querySelector('Ид, Id, ID')?.textContent?.trim() || el.getAttribute('id') || `ukr-xml-${index}`;
        const name = el.querySelector('Наименование, Name, name, title')?.textContent?.trim() || '';
        const sku = el.querySelector('Артикул, Code, SKU, sku, Штрихкод, Barcode')?.textContent?.trim() || `SKU-${index}`;
        const desc = el.querySelector('Описание, Description, description, ПолноеНаименование')?.textContent?.trim() || '';
        
        let catName = 'Сантехніка та опалення';
        const catId = el.querySelector('Группы > Ид, CategoryId, categoryId')?.textContent?.trim() || el.querySelector('category')?.textContent?.trim();
        if (catId && categoryMap.has(catId)) {
          catName = categoryMap.get(catId)!;
        }

        let price = 100;
        const priceStr = el.querySelector('Цены > Цена > ЦенаЗаЕдиницу, price, Price, розница, Цена')?.textContent?.trim();
        if (priceStr) {
          const num = parseFloat(priceStr.replace(',', '.').replace(/[^\d.]/g, ''));
          if (!isNaN(num) && num > 0) price = num;
        }

        let stock = 10;
        const stockStr = el.querySelector('Количество, Stock, stock, Остаток, amount, quantity')?.textContent?.trim();
        if (stockStr) {
          const num = parseInt(stockStr.replace(/[^\d-]/g, ''), 10);
          if (!isNaN(num)) stock = num;
        }

        const unit = el.querySelector('БазоваяЕдиница, Unit, unit, Единица')?.textContent?.trim() || 'шт';
        const image = el.querySelector('Картинка, Image, image, picture, photo')?.textContent?.trim() || '';

        if (name) {
          let mainCategory = 'Сантехніка та опалення';
          let subCategory = catName;
          const lower = (name + ' ' + catName).toLowerCase();
          if (lower.includes('електр') || lower.includes('ламп') || lower.includes('розетк') || lower.includes('кабел') || lower.includes('автомат') || lower.includes('led')) {
            mainCategory = 'Електротовари';
            subCategory = 'Освітлення';
          } else if (lower.includes('інструмент') || lower.includes('дриль') || lower.includes('шуруп') || lower.includes('болгарк')) {
            mainCategory = 'Інструменти та обладнання';
            subCategory = 'Ручний інструмент';
          } else if (lower.includes('замок') || lower.includes('дюбел') || lower.includes('драбин')) {
            mainCategory = 'Господарчі товари';
            subCategory = 'Кріплення та замки';
          }

          result.products.push({
            id,
            name,
            sku,
            category: subCategory,
            mainCategory,
            subCategory,
            price,
            stock,
            unit: normalizeStorageUnit(unit),
            desc,
            image,
            badge: ''
          });
        }
      } catch (err: any) {}
    });

    result.totalParsed = result.products.length;
  } catch (error: any) {
    result.errors.push('Помилка XML: ' + error.message);
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
