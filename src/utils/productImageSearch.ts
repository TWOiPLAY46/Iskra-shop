/**
 * Smart image search utility for products.
 * Finds high-quality real product images via Web Image Search API (/api/search-images)
 * with graceful fallback to an extensive curated stock catalog, Wikimedia Commons, and Wikipedia.
 * Fully compatible with local dev, Docker/Cloud Run, and static GitHub Pages hosting.
 */

export interface FoundImage {
  url: string;
  title: string;
  source: string;
  thumbnail?: string;
}

// Curated high-resolution electrical, plumbing & hardware goods stock library
// Used for instant matching and robust offline/static fallbacks (especially on GitHub Pages)
const CURATED_ELECTRICAL_IMAGES: { keywords: string[]; url: string; title: string }[] = [
  // Lighting: ETRON, NORTE, LED Panels, Downlights, Ceiling & Wall Fixtures
  {
    keywords: ['1-ndp', 'ndp-1604', '1-edp', 'edp-605', 'norte', 'etron', 'світильник світлодіодний', 'круг', 'панель led', 'downlight', 'врізний', 'круглий світильник'],
    url: 'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?auto=format&fit=crop&w=600&q=80',
    title: 'Світильник світлодіодний круглий LED врізний / накладний'
  },
  {
    keywords: ['люстра', 'підвіс', 'стельовий світильник', 'плафон', 'бра', 'настінний світильник'],
    url: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=600&q=80',
    title: 'Стельовий світильник / Люстра сучасна'
  },
  {
    keywords: ['лампа led', 'світлодіодна лампа', 'лампа e27', 'лампа e14', 'філамент', 'економка'],
    url: 'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?auto=format&fit=crop&w=600&q=80',
    title: 'Світлодіодна LED лампа побутова'
  },
  {
    keywords: ['прожектор', 'led прожектор', 'вуличний прожектор', 'ip65', 'освітлення території'],
    url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80',
    title: 'LED прожектор вуличний вологозахищений IP65'
  },
  {
    keywords: ['led стрічка', 'світлодіодна стрічка', 'rgb стрічка', 'стрічка 12v', 'неон'],
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=600&q=80',
    title: 'Світлодіодна стрічка LED 12V гнучка'
  },
  {
    keywords: ['настільна лампа', 'лампа для школяра', 'ліхтарик', 'акумуляторний ліхтар'],
    url: 'https://images.unsplash.com/photo-1540932239986-30128078f3c5?auto=format&fit=crop&w=600&q=80',
    title: 'Настільна світлодіодна лампа'
  },

  // Automation, Relays & Circuit Breakers: ZUBR, Schneider, IEK, Hager
  {
    keywords: ['zubr', 'зубр', 'реле напруги', 'відсікач', 'd40', 'd63', 'd25', 'd32', 'бар\'єр', 'барьер'],
    url: 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&w=600&q=80',
    title: 'Реле напруги ZUBR D на DIN-рейку'
  },
  {
    keywords: ['дифреле', 'дифавтомат', 'узо', 'пзв', 'автоматичний вимикач', 'автомат 16a', 'автомат 25a', 'автомат 10a', 'автомат c16', 'автомат c25', 'schneider', 'hager', 'abb', 'iek'],
    url: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=600&q=80',
    title: 'Модульний автоматичний вимикач 1P/2P/3P'
  },
  {
    keywords: ['щит', 'щиток', 'бокс', 'розподільчий щит', 'шафа обліку', 'пластиковий бокс', 'металевий щит'],
    url: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=600&q=80',
    title: 'Щит розподільчий електричний навісний/врізний'
  },
  {
    keywords: ['лічильник', 'електролічильник', 'облік електроенергії', 'меркурій', 'нік', '220v'],
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    title: 'Лічильник електроенергії електронний'
  },

  // Cables & Wires: Одескабель, ВВГ, ПВС, ШВВП, UTP
  {
    keywords: ['одескабель', 'ввг', 'ввг-п', 'ввгнг', 'ввг-пнг', 'кабель силовий', 'мідний кабель', '3х2.5', '3х1.5', '2х1.5', '2х2.5'],
    url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    title: 'Кабель силовий мідний монолітний ВВГнг-П'
  },
  {
    keywords: ['пвс', 'шввп', 'гнучкий кабель', 'провід', 'мідний дріт', 'багатожильний'],
    url: 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&w=600&q=80',
    title: "Провід мідний з'єднувальний ПВС / ШВВП"
  },
  {
    keywords: ['utp', 'вита пара', 'патч корд', 'інтернет кабель', 'lan', 'cat5e', 'cat6'],
    url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80',
    title: 'Мережевий кабель вита пара UTP Cat5e'
  },
  {
    keywords: ['гофра', 'гофротруба', 'металорукав', 'кабель-канал', 'короб'],
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    title: 'Гофрована труба з протяжкою для кабелю'
  },
  {
    keywords: ['ізострічка', 'ізолента', 'термоусадка', 'стяжки', 'хомути'],
    url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80',
    title: 'Ізоляційна стрічка ПВХ професійна'
  },
  {
    keywords: ['клемник', 'wago', 'ваго', 'клемна колодка', 'гільза', 'наконечник'],
    url: 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&w=600&q=80',
    title: "Монтажні з'єднувальні клеми Wago"
  },

  // Sockets, Switches & Electrical Accessories
  {
    keywords: ['розетка', 'розетка подвійна', 'розетка з заземленням', 'блок розеток', 'розетка біла'],
    url: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?auto=format&fit=crop&w=600&q=80',
    title: 'Розетка електрична з заземленням та захисними шторками'
  },
  {
    keywords: ['вимикач', 'клавішний', 'перемикач', 'прохідний', 'кнопка дзвінка'],
    url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=600&q=80',
    title: 'Вимикач світла настінний клавішний'
  },
  {
    keywords: ['подовжувач', 'колодка', 'мережевий фільтр', 'переноска', 'котушка'],
    url: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=600&q=80',
    title: 'Подовжувач електричний із захистом'
  },

  // Plumbing: Faucets, Mixers & Showers
  {
    keywords: ['змішувач для ванни', 'ванна', 'змішувач з душем', 'довгий гусак', 'вилив'],
    url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
    title: 'Змішувач для ванної кімнати з душовим комплектом'
  },
  {
    keywords: ['змішувач для кухні', 'кухонний змішувач', 'змішувач для мийки', 'кран для кухні'],
    url: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=600&q=80',
    title: 'Змішувач кухонний високий поворотний латунний'
  },
  {
    keywords: ['змішувач', 'кран', 'душова стійка', 'душовий гарнітур', 'лійка'],
    url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
    title: 'Змішувач сантехнічний хромований'
  },
  {
    keywords: ['сифон', 'гофра для умивальника', 'трап', 'донний клапан'],
    url: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=600&q=80',
    title: 'Сифон для умивальника та мийки'
  },

  // Plumbing: Heating, Radiators & Boilers
  {
    keywords: ['радіатор', 'батарея', 'біметал', 'алюмінієвий радіатор', 'секційний радіатор', '500/80'],
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
    title: 'Радіатор біметалевий опалювальний секційний'
  },
  {
    keywords: ['бойлер', 'водонагрівач', 'атлантік', 'аристон', 'теси', 'електричний бойлер'],
    url: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=600&q=80',
    title: 'Водонагрівач електричний накопичувальний (Бойлер)'
  },
  {
    keywords: ['котел', 'газовий котел', 'електрокотел', 'котел твердопаливний'],
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    title: 'Котел опалювальний настінний'
  },
  {
    keywords: ['насос', 'циркуляційний насос', 'насосна станція', 'глибинний насос'],
    url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80',
    title: 'Циркуляційний насос для опалення та водопостачання'
  },

  // Plumbing: Pipes, Fittings & Valves
  {
    keywords: ['труба', 'поліпропілен', 'ппр', 'фітинг', 'муфта', 'коліно', 'трійник', 'труба армована'],
    url: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=600&q=80',
    title: 'Поліпропіленові труби PPR та фітинги для пайки'
  },
  {
    keywords: ['кран кульовий', 'кран 1/2', 'кран 3/4', 'valtec', 'латунний кран', 'вентиль'],
    url: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=600&q=80',
    title: 'Кран кульовий сантехнічний латунний повнопрохідний'
  },
  {
    keywords: ['фільтр', 'фільтр для води', 'колба', 'картридж', 'осмос', 'пом\'якшувач'],
    url: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=600&q=80',
    title: 'Фільтр магістральний для очищення води'
  },

  // Sanitary ware
  {
    keywords: ['унітаз', 'компакт', 'інсталяція', 'бачок', 'умивальник', 'раковина для ванної'],
    url: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=600&q=80',
    title: 'Санфаянс / Унітаз керамічний з косим випуском'
  },

  // Tools & Hardware
  {
    keywords: ['мультиметр', 'тестер', 'струмові кліщі', 'вольтметр', 'індикатор напруги'],
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    title: 'Цифровий мультиметр тестер електрика'
  },
  {
    keywords: ['паяльник', 'припій', 'каніфоль', 'паяльник для труб'],
    url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80',
    title: 'Електричний паяльник з регулюванням'
  },
  {
    keywords: ['дриль', 'шуруповерт', 'перфоратор', 'болгарка', 'кшм', 'лобзик'],
    url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80',
    title: 'Електроінструмент монтажний акумуляторний'
  },
  {
    keywords: ['викрутка', 'плоскогубці', 'кусачки', 'стріпер', 'набір інструментів'],
    url: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=600&q=80',
    title: 'Ручний інструмент слюсаря та електрика'
  },
  {
    keywords: ['диск відрізний', 'диск по металу', 'алмазний диск', 'свердло', 'бур'],
    url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80',
    title: 'Диск відрізний по металу для КШМ'
  }
];

/**
 * Clean product name into optimal search keywords
 */
export function cleanSearchQuery(rawName: string): string {
  if (!rawName) return '';
  return rawName
    .replace(/\(.*?\)/g, ' ') // remove brackets like (BLOB), (шт), (10шт)
    .replace(/\[.*?\]/g, ' ')
    .replace(/[«»"'`]/g, ' ')
    .replace(/\b(шт|пач|уп|м|компл|од|грн|BLOB)\b\.?/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const STOP_WORDS = new Set([
  'для', 'від', 'під', 'про', 'при', 'без', 'через', 'над', 'між', 'як', 'чи', 'або', 'із', 'зі', 'та', 'на', 'по', 'що', 'до', 'і', 'й', 'в', 'у', 'з'
]);

/**
 * Search curated product stock images by keyword scoring
 */
export function searchCuratedImages(query: string, maxResults: number = 8): FoundImage[] {
  const clean = cleanSearchQuery(query).toLowerCase();
  if (!clean) return [];

  const words = clean.split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));

  // Score each curated item based on keyword matches
  const scored = CURATED_ELECTRICAL_IMAGES.map((item) => {
    let score = 0;
    for (const kw of item.keywords) {
      const lowerKw = kw.toLowerCase();
      // Exact full phrase match
      if (clean.includes(lowerKw)) {
        score += lowerKw.length * 4;
      }
      // Word matches
      for (const w of words) {
        if (lowerKw.split(/\s+/).includes(w)) {
          score += w.length * 3;
        } else if (lowerKw.includes(w) && w.length >= 4) {
          score += w.length * 1.5;
        }
      }
    }
    return { item, score };
  });

  const matches = scored
    .filter(s => s.score >= 5)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(s => ({
      url: s.item.url,
      thumbnail: s.item.url,
      title: s.item.title,
      source: 'Каталог товарів'
    }));

  return matches;
}

/**
 * Search images online using Web Image Search engine with rich multi-provider fallbacks.
 * Seamlessly handles GitHub Pages (static client) and Dev/Server environments.
 */
export async function searchImagesOnline(query: string, limit: number = 16): Promise<FoundImage[]> {
  const cleaned = cleanSearchQuery(query);
  if (!cleaned) return [];

  const results: FoundImage[] = [];
  const seenUrls = new Set<string>();

  const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');

  // 1. If NOT on static GitHub Pages, attempt real backend search (/api/search-images)
  if (!isGitHubPages) {
    try {
      const res = await fetch(`/api/search-images?q=${encodeURIComponent(cleaned)}&limit=${limit}`, {
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.results) && data.results.length > 0) {
          for (const item of data.results) {
            if (item.url && !seenUrls.has(item.url)) {
              seenUrls.add(item.url);
              results.push({
                url: item.url,
                thumbnail: item.thumbnail || item.url,
                title: item.title || cleaned,
                source: item.source || 'Інтернет'
              });
            }
          }
        }
      }
    } catch {
      // Backend not running or timeout; seamlessly continue to curated & public catalog fallbacks
    }

    if (results.length > 0) {
      return results.slice(0, limit);
    }
  }

  // 2. Curated store catalog matching (Fast, reliable, zero CORS issues, perfect for GitHub Pages)
  const curatedMatches = searchCuratedImages(cleaned, 6);
  for (const item of curatedMatches) {
    if (!seenUrls.has(item.url)) {
      seenUrls.add(item.url);
      results.push(item);
    }
  }

  // 3. Query Wikimedia Commons API (CORS enabled worldwide with origin=*)
  try {
    const wikiKeywords = cleaned.split(' ').slice(0, 3).join(' ');
    const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch=${encodeURIComponent(wikiKeywords)}&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url&iiurlwidth=500`;

    const resp = await fetch(commonsUrl, { signal: AbortSignal.timeout(3000) });
    if (resp.ok) {
      const data = await resp.json();
      const pages = data?.query?.pages;
      if (pages) {
        Object.values(pages).forEach((page: any) => {
          const imgInfo = page.imageinfo?.[0];
          const thumbUrl = imgInfo?.thumburl || imgInfo?.url;
          if (thumbUrl && !seenUrls.has(thumbUrl)) {
            const lowerUrl = thumbUrl.toLowerCase();
            if (lowerUrl.includes('.jpg') || lowerUrl.includes('.jpeg') || lowerUrl.includes('.png') || lowerUrl.includes('.webp')) {
              seenUrls.add(thumbUrl);
              const cleanTitle = (page.title || 'Товар').replace(/^File:/i, '').replace(/\.[a-z0-9]+$/i, '');
              results.push({
                url: thumbUrl,
                thumbnail: thumbUrl,
                title: cleanTitle,
                source: 'Wikimedia Commons'
              });
            }
          }
        });
      }
    }
  } catch {
    // skip on network glitch
  }

  return results.slice(0, limit);
}

/**
 * Automatically determine the best single image URL for a product
 */
export async function autoFindBestImageForProduct(productName: string): Promise<string | null> {
  try {
    const list = await searchImagesOnline(productName, 4);
    if (list.length > 0 && list[0].url) {
      return list[0].url;
    }
  } catch (e) {
    console.warn('Auto image find error for:', productName, e);
  }
  return null;
}
