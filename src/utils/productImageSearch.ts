/**
 * Smart image search utility for products.
 * Finds high-quality real product images via Web Image Search API (/api/search-images)
 * with graceful fallback to Wikimedia Commons and curated stock photos.
 */

export interface FoundImage {
  url: string;
  title: string;
  source: string;
  thumbnail?: string;
}

// Curated high-resolution electrical & hardware goods stock library
// Used for instant matching and robust fallbacks
const CURATED_ELECTRICAL_IMAGES: { keywords: string[]; url: string; title: string }[] = [
  // Cables & Wires
  {
    keywords: ['ввг', 'ввг-п', 'ввгнг', 'кабель силовий', 'мідний кабель'],
    url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    title: 'Кабель силовий мідний ВВГнг'
  },
  {
    keywords: ['пвс', 'шввп', 'гнучкий кабель'],
    url: 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&w=600&q=80',
    title: "Провід з'єднувальний ПВС / ШВВП"
  },
  {
    keywords: ['utp', 'вита пара', 'патч корд', 'інтернет кабель', 'lan'],
    url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80',
    title: 'Кабель вита пара UTP Cat5e/6'
  },

  // Circuit Breakers & Switchboards
  {
    keywords: ['дифреле', 'дифавтомат', 'узо', 'пзв', 'автоматичний вимикач'],
    url: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=600&q=80',
    title: 'Автоматичний вимикач модульний DIN'
  },
  {
    keywords: ['щит', 'щиток', 'бокс', 'розподільчий щит', 'шафа обліку'],
    url: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=600&q=80',
    title: 'Щит розподільчий електричний'
  },
  {
    keywords: ['лічильник', 'електролічильник', 'облік електроенергії', 'меркурій', 'нік'],
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    title: 'Лічильник електроенергії'
  },

  // Sockets & Switches
  {
    keywords: ['розетка', 'розетка подвійна', 'розетка з заземленням', 'блок розеток'],
    url: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?auto=format&fit=crop&w=600&q=80',
    title: 'Розетка електрична з заземленням'
  },
  {
    keywords: ['вимикач', 'клавішний', 'перемикач', 'прохідний'],
    url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=600&q=80',
    title: 'Вимикач світла настінний'
  },
  {
    keywords: ['подовжувач', 'колодка', 'мережевий фільтр', 'переноска'],
    url: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=600&q=80',
    title: 'Подовжувач електричний із колодкою'
  },

  // Lighting & Lamps
  {
    keywords: ['лампа led', 'світлодіодна лампа', 'лампа e27', 'лампа e14', 'філамент'],
    url: 'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?auto=format&fit=crop&w=600&q=80',
    title: 'Світлодіодна LED лампа'
  },
  {
    keywords: ['прожектор', 'led прожектор', 'вуличний прожектор'],
    url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80',
    title: 'LED прожектор вуличний'
  },
  {
    keywords: ['світильник', 'люстра', 'плафон', 'бра', 'підвісний'],
    url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80',
    title: 'Світильник стельовий'
  },
  {
    keywords: ['led стрічка', 'світлодіодна стрічка', 'rgb стрічка'],
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=600&q=80',
    title: 'Світлодіодна стрічка LED 12V'
  },

  // Plumbing
  {
    keywords: ['змішувач', 'кран для кухні', 'кран для ванни', 'гусак'],
    url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
    title: 'Змішувач сантехнічний'
  },
  {
    keywords: ['унітаз', 'компакт', 'інсталяція', 'бачок'],
    url: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=600&q=80',
    title: 'Сантехніка для санвузла'
  },
  {
    keywords: ['радіатор', 'батарея', 'опалення', 'котел'],
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
    title: 'Радіатор секційний опалення'
  },
  {
    keywords: ['труба ппр', 'поліпропілен', 'фітинг', 'муфта', 'коліно', 'трійник'],
    url: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=600&q=80',
    title: 'Труби та фітинги сантехнічні'
  },

  // Tools & Instruments
  {
    keywords: ['мультиметр', 'тестер', 'струмові кліщі', 'вольтметр'],
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    title: 'Цифровий мультиметр тестер'
  },
  {
    keywords: ['паяльник', 'припій', 'каніфоль'],
    url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80',
    title: 'Електричний паяльник'
  },
  {
    keywords: ['дриль', 'шуруповерт', 'перфоратор', 'болгарка', 'кшм'],
    url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80',
    title: 'Електроінструмент монтажний'
  },
  {
    keywords: ['викрутка', 'плоскогубці', 'кусачки', 'стріпер'],
    url: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=600&q=80',
    title: 'Ручний інструмент електрика'
  },

  // Installation Supplies
  {
    keywords: ['ізострічка', 'ізолента'],
    url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80',
    title: 'Ізоляційна стрічка ПВХ'
  },
  {
    keywords: ['гофра', 'гофротруба', 'металорукав'],
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    title: 'Гофрована труба для кабелю'
  },
  {
    keywords: ['клемник', 'wago', 'ваго', 'клемна колодка'],
    url: 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&w=600&q=80',
    title: "З'єднувальні клеми Wago"
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

// Production cloud backend URL for external static hostings like GitHub Pages
const CLOUD_API_BASE = 'https://ais-pre-6zl6cy3md7nka2qwlrffos-472272282956.europe-west2.run.app';

export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') return '';
  const host = window.location.hostname;
  // If running locally, in dev container or on Cloud Run directly:
  if (host === 'localhost' || host === '127.0.0.1' || host.includes('run.app')) {
    return '';
  }
  // If running on GitHub Pages (twoiplay46.github.io) or any other static hosting:
  return CLOUD_API_BASE;
}

/**
 * Search images online using Web Image Search engine with rich multi-provider fallbacks
 */
export async function searchImagesOnline(query: string, limit: number = 16): Promise<FoundImage[]> {
  const cleaned = cleanSearchQuery(query);
  if (!cleaned) return [];

  const results: FoundImage[] = [];
  const seenUrls = new Set<string>();
  const apiBase = getApiBaseUrl();

  // 1. First priority: Real Web Image Search via Backend API (/api/search-images)
  try {
    const res = await fetch(`${apiBase}/api/search-images?q=${encodeURIComponent(cleaned)}&limit=${limit}`, {
      signal: AbortSignal.timeout(7000)
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
  } catch (err) {
    console.warn('Backend image search request error:', err);
  }

  // If we found images from web search, return them immediately!
  if (results.length > 0) {
    return results.slice(0, limit);
  }

  // 2. Query Wikimedia Commons API
  try {
    const wikiTerms = encodeURIComponent(cleaned.split(' ').slice(0, 3).join(' '));
    const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch=${wikiTerms}&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url&iiurlwidth=500`;

    const resp = await fetch(commonsUrl, { signal: AbortSignal.timeout(4000) });
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
  } catch (err) {
    console.warn('Wikimedia search skipped:', err);
  }

  // 3. Query Ukrainian Wikipedia for product articles
  if (results.length < 4) {
    try {
      const wikiTerms = encodeURIComponent(cleaned.split(' ').slice(0, 2).join(' '));
      const wikiUrl = `https://uk.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch=${wikiTerms}&gsrlimit=4&prop=pageimages&piprop=thumbnail&pithumbsize=600`;

      const resp = await fetch(wikiUrl, { signal: AbortSignal.timeout(3500) });
      if (resp.ok) {
        const data = await resp.json();
        const pages = data?.query?.pages;
        if (pages) {
          Object.values(pages).forEach((page: any) => {
            const thumbUrl = page.thumbnail?.source;
            if (thumbUrl && !seenUrls.has(thumbUrl)) {
              seenUrls.add(thumbUrl);
              results.push({
                url: thumbUrl,
                thumbnail: thumbUrl,
                title: page.title || 'Фото товару',
                source: 'Wikipedia'
              });
            }
          });
        }
      }
    } catch (err) {
      console.warn('Wikipedia search skipped:', err);
    }
  }

  // 4. Fill with high-quality curated stock matches if still empty
  if (results.length === 0) {
    const lowerCleaned = cleaned.toLowerCase();
    for (const item of CURATED_ELECTRICAL_IMAGES) {
      const isMatch = item.keywords.some((kw) => lowerCleaned.includes(kw.toLowerCase()));
      if (isMatch && !seenUrls.has(item.url)) {
        seenUrls.add(item.url);
        results.push({
          url: item.url,
          thumbnail: item.url,
          title: item.title,
          source: 'Каталог'
        });
        if (results.length >= 3) break;
      }
    }
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
