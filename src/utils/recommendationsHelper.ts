import { Product } from '../types/store';

// Helper rule definition for complementary accessory matching
interface RecommendationRule {
  // Triggers: words that indicate the target product belongs to this group
  triggers: string[];
  // Complementary keywords: words that accessories/related items usually contain
  keywords: string[];
  // Preferred price ceiling: impulse buys usually under this value (e.g. 500 UAH)
  preferredMaxPrice?: number;
}

const RECOMMENDATION_RULES: RecommendationRule[] = [
  // 1. Faucets & Sinks (Змішувачі, крани) -> hoses, siphons, sealants, fum tape, aerators
  {
    triggers: ['змішувач', 'кран для умивальника', 'кран для ванни', 'кран для кухні', 'душов', 'гарнітур', 'умивальник', 'раковина', 'мийка'],
    keywords: ['шланг', 'підводк', 'сифон', 'фум', 'стрічк', 'аератор', 'донний клапан', 'прокладк', 'герметик', 'ексцентрик', 'ключ'],
    preferredMaxPrice: 650
  },
  // 2. Radiators, Boilers, Heating (Радіатори, батареї, котли, бойлери) -> valves, brackets, seals, air vents
  {
    triggers: ['радіатор', 'батарея', 'котел', 'бойлер', 'водонагрівач', 'тепла підлога'],
    keywords: ['термоголовк', 'маєвськ', 'кран радіатор', 'комплект підключення', 'кронштейн', 'кріплення радіатор', 'фум', 'прокладк', 'пакля', 'герметик', 'муфта'],
    preferredMaxPrice: 850
  },
  // 3. Pipes, Fittings, Sewerage (Труби, каналізація, водопровід) -> fittings, couplings, elbows, glue, cutters, tape
  {
    triggers: ['труба', 'поліпропілен', 'каналізація', 'фітинг', 'металопластик', 'ппр'],
    keywords: ['муфта', 'коліно', 'трійник', 'кут', 'заглушка', 'фітинг', 'хомут', 'кріплення', 'ножиці для труб', 'фум', 'герметик', 'паяльник'],
    preferredMaxPrice: 400
  },
  // 4. Toilet & Sanitaryware (Унітази, інсталяції, бачки) -> corrugated pipes, valves, seals, bolts, hoses
  {
    triggers: ['унітаз', 'інсталяція', 'бачок', 'компакт', 'біде'],
    keywords: ['гофра', 'арматура бачка', 'кріплення унітаз', 'шланг', 'підводк', 'кран кульовий', 'силікон', 'прокладк', 'фум'],
    preferredMaxPrice: 500
  },
  // 5. Sockets & Switches (Розетки, вимикачі, фурнітура) -> flush-mount boxes, frames, terminals, cable
  {
    triggers: ['розетка', 'вимикач', 'перемикач', 'диммер', 'світлорегулятор'],
    keywords: ['підрозетник', 'коробка монтажна', 'рамка', 'wago', 'клем', 'ізострічк', 'індикатор', 'викрутка', 'кабель'],
    preferredMaxPrice: 350
  },
  // 6. Cables & Wiring (Кабель, провід, шнур) -> corrugated conduit, clips, cable ties, WAGO, breakers, tape
  {
    triggers: ['кабель', 'провід', 'шнур', 'ввг', 'шввп', 'пвс'],
    keywords: ['гофра', 'кліпса', 'стяжка', 'хомут', 'wago', 'клем', 'ізострічк', 'підрозетник', 'автомат', 'дюбель-ялинка'],
    preferredMaxPrice: 450
  },
  // 7. Circuit Breakers & Distribution Boards (Автомати, ПЗВ, щитки) -> DIN rails, busbars, boxes, WAGO
  {
    triggers: ['автомат', 'пзв', 'дифавтомат', 'щиток', 'бокс', 'реле напруги', 'зубр', 'лічильник'],
    keywords: ['din-рейк', 'гребінк', 'шина', 'wago', 'накінечник', 'гільза', 'ізострічк', 'стяжка', 'маркер'],
    preferredMaxPrice: 500
  },
  // 8. Lighting & Lamps (Лампи, світильники, прожектори, LED) -> bulbs, sockets, mounting accessories, sensors
  {
    triggers: ['лампа', 'світильник', 'прожектор', 'люстра', 'led', 'стрічка світлодіодна'],
    keywords: ['лампа', 'патрон', 'блок живлення', 'профіль для стрічки', 'wago', 'датчик руху', 'клем', 'ізострічк'],
    preferredMaxPrice: 300
  },
  // 9. Water Filters (Фільтри для води) -> replacement cartridges, keys, Teflon tape, fittings
  {
    triggers: ['фільтр', 'колба', 'осмос', 'пом\'якшувач'],
    keywords: ['картридж', 'ключ для колби', 'фум', 'фітинг', 'кран для фільтра', 'прокладк'],
    preferredMaxPrice: 450
  },
  // 10. Power tools (Дрилі, болгарки, шуруповерти) -> drill bits, discs, safety goggles, gloves
  {
    triggers: ['дриль', 'перфоратор', 'болгарка', 'шуруповерт', 'лобзик', 'інструмент'],
    keywords: ['диск', 'свердло', 'бур', 'біта', 'набір біт', 'рукавиці', 'окуляри захисні', 'подовжувач'],
    preferredMaxPrice: 500
  }
];

/**
 * Universal smart calculation for recommended complementary accessories.
 * Automatically adapts when new products are added to the store!
 */
export const getSmartRecommendedProducts = (
  targetProducts: Product | Product[],
  allProducts: Product[],
  limit: number = 4
): Product[] => {
  const targets = Array.isArray(targetProducts) ? targetProducts : [targetProducts];
  if (!targets.length || !allProducts.length) return [];

  const targetIds = new Set(targets.map((t) => t.id));

  // 1. Combine keywords & categories from target products
  const targetText = targets
    .map((p) => `${p.name} ${p.category} ${p.mainCategory || ''} ${p.subCategory || ''} ${p.desc || ''}`)
    .join(' ')
    .toLowerCase();

  // Find all matched rules
  const matchedRules = RECOMMENDATION_RULES.filter((rule) =>
    rule.triggers.some((tr) => targetText.includes(tr.toLowerCase()))
  );

  // Fallback to broad general plumbing or electrical rules if no specific rule matched
  const isBroadPlumbing = targetText.includes('сантех') || targetText.includes('вод') || targetText.includes('опален');
  const isBroadElectrical = targetText.includes('електр') || targetText.includes('освітл') || targetText.includes('струм');

  // Candidate pool: exclude products already in target (e.g. already in cart or the product itself)
  const candidatePool = allProducts.filter((p) => !targetIds.has(p.id));

  // Score each candidate product
  const scored = candidatePool.map((candidate) => {
    let score = 0;
    const cText = `${candidate.name} ${candidate.category} ${candidate.mainCategory || ''} ${candidate.subCategory || ''} ${candidate.desc || ''}`.toLowerCase();
    const hasStock = candidate.stock > 0;

    // A. Severe bonus for being in stock (+50 points)
    if (hasStock) score += 50;

    // B. Match against detected specific rules
    for (const rule of matchedRules) {
      for (const kw of rule.keywords) {
        if (cText.includes(kw.toLowerCase())) {
          score += 40;
          // Exact keyword match in title receives even higher boost
          if (candidate.name.toLowerCase().includes(kw.toLowerCase())) {
            score += 30;
          }
        }
      }

      // Bonus if price matches preferred impulse-buy ceiling
      if (rule.preferredMaxPrice && candidate.price <= rule.preferredMaxPrice) {
        score += 15;
      }
    }

    // C. General category affiliation boost (+20 points)
    if (isBroadPlumbing && (cText.includes('сантех') || cText.includes('опален') || cText.includes('вод') || cText.includes('труб'))) {
      score += 20;
    }
    if (isBroadElectrical && (cText.includes('електр') || cText.includes('кабел') || cText.includes('світл'))) {
      score += 20;
    }

    // D. Universal handy consumable accessories (+25 points)
    // Products like Teflon tape, mounting boxes, terminals, isolation tape are universally beneficial
    if (
      cText.includes('фум') ||
      cText.includes('ізострічк') ||
      cText.includes('wago') ||
      cText.includes('підрозетник') ||
      cText.includes('прокладк') ||
      cText.includes('шланг')
    ) {
      score += 25;
    }

    // E. Favor affordable items (under 400 UAH) for impulse addition
    if (candidate.price < 150) score += 12;
    else if (candidate.price < 400) score += 8;

    return { product: candidate, score };
  });

  // Sort by score descending; if score tied, prefer items in stock and lower price
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if ((b.product.stock > 0 ? 1 : 0) !== (a.product.stock > 0 ? 1 : 0)) {
      return (b.product.stock > 0 ? 1 : 0) - (a.product.stock > 0 ? 1 : 0);
    }
    return a.product.price - b.product.price;
  });

  // Return the top N unique products
  return scored.slice(0, limit).map((s) => s.product);
};
