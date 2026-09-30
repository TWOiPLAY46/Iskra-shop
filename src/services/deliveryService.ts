/**
 * Nova Poshta & Ukrposhta API & Delivery helper service
 * Enables search for settlements (cities/villages) and warehouses/postomats
 */

export interface DeliveryCity {
  ref: string;
  name: string;
  area: string;
  region?: string;
  settlementType?: string;
}

export interface DeliveryWarehouse {
  ref: string;
  number: string;
  name: string;
  shortAddress: string;
  type: 'branch' | 'postomat' | 'cargo';
  maxWeightKg?: number;
}

// Popular Ukrainian regional centers & local settlements for instant offline/fallback cache
export const POPULAR_CITIES: DeliveryCity[] = [
  { ref: 'orativ-vin', name: 'Оратів', area: 'Вінницька область', region: 'Вінницький р-н', settlementType: 'смт / село' },
  { ref: 'vinnytsia', name: 'Вінниця', area: 'Вінницька область', region: '', settlementType: 'місто' },
  { ref: 'kyiv', name: 'Київ', area: 'Київська область', region: '', settlementType: 'місто' },
  { ref: 'lviv', name: 'Львів', area: 'Львівська область', region: '', settlementType: 'місто' },
  { ref: 'odesa', name: 'Одеса', area: 'Одеська область', region: '', settlementType: 'місто' },
  { ref: 'dnipro', name: 'Дніпро', area: 'Дніпропетровська область', region: '', settlementType: 'місто' },
  { ref: 'kharkiv', name: 'Харків', area: 'Харківська область', region: '', settlementType: 'місто' },
  { ref: 'zaporizhzhia', name: 'Запоріжжя', area: 'Запорізька область', region: '', settlementType: 'місто' },
  { ref: 'zhytomyr', name: 'Житомир', area: 'Житомирська область', region: '', settlementType: 'місто' },
  { ref: 'khmelnytskyi', name: 'Хмельницький', area: 'Хмельницька область', region: '', settlementType: 'місто' },
  { ref: 'cherkasy', name: 'Черкаси', area: 'Черкаська область', region: '', settlementType: 'місто' },
  { ref: 'poltava', name: 'Полтава', area: 'Полтавська область', region: '', settlementType: 'місто' },
  { ref: 'chernivtsi', name: 'Чернівці', area: 'Чернівецька область', region: '', settlementType: 'місто' },
  { ref: 'ivano-frankivsk', name: 'Івано-Франківськ', area: 'Івано-Франківська область', region: '', settlementType: 'місто' },
  { ref: 'ternopil', name: 'Тернопіль', area: 'Тернопільська область', region: '', settlementType: 'місто' },
  { ref: 'rivne', name: 'Рівне', area: 'Рівненська область', region: '', settlementType: 'місто' },
  { ref: 'lutsk', name: 'Луцьк', area: 'Волинська область', region: '', settlementType: 'місто' },
  { ref: 'uzhhorod', name: 'Ужгород', area: 'Закарпатська область', region: '', settlementType: 'місто' },
  { ref: 'bila-tserkva', name: 'Біла Церква', area: 'Київська область', region: '', settlementType: 'місто' },
  { ref: 'uman', name: 'Умань', area: 'Черкаська область', region: '', settlementType: 'місто' },
  { ref: 'illintsi', name: 'Іллінці', area: 'Вінницька область', region: '', settlementType: 'місто' },
  { ref: 'lypovets', name: 'Липовець', area: 'Вінницька область', region: '', settlementType: 'місто' },
  { ref: 'pohrebyshche', name: 'Погребище', area: 'Вінницька область', region: '', settlementType: 'місто' },
  { ref: 'koziatyn', name: 'Козятин', area: 'Вінницька область', region: '', settlementType: 'місто' },
  { ref: 'zhmerynka', name: 'Жмеринка', area: 'Вінницька область', region: '', settlementType: 'місто' }
];

// Fallback branches for key cities if no internet or API key is not configured yet
export const DEFAULT_WAREHOUSES: Record<string, DeliveryWarehouse[]> = {
  'orativ-vin': [
    { ref: 'orativ-1', number: '1', name: 'Відділення №1: вул. Героїв Майдану, 14 (до 30 кг)', shortAddress: 'вул. Героїв Майдану, 14', type: 'branch', maxWeightKg: 30 },
    { ref: 'orativ-post-1', number: '31520', name: 'Поштомат №31520: вул. Героїв Майдану, 14', shortAddress: 'вул. Героїв Майдану, 14', type: 'postomat', maxWeightKg: 20 }
  ],
  'vinnytsia': [
    { ref: 'vin-1', number: '1', name: 'Відділення №1: вул. Якова Шепеля, 1 (Вантажне, без обмежень)', shortAddress: 'вул. Якова Шепеля, 1', type: 'cargo' },
    { ref: 'vin-2', number: '2', name: 'Відділення №2: вул. Соборна, 69 (до 30 кг)', shortAddress: 'вул. Соборна, 69', type: 'branch', maxWeightKg: 30 },
    { ref: 'vin-4', number: '4', name: 'Відділення №4: вул. Келецька, 84 (до 30 кг)', shortAddress: 'вул. Келецька, 84', type: 'branch', maxWeightKg: 30 },
    { ref: 'vin-post-10', number: '10250', name: 'Поштомат №10250: вул. 600-річчя, 17', shortAddress: 'вул. 600-річчя, 17', type: 'postomat', maxWeightKg: 20 }
  ],
  'kyiv': [
    { ref: 'kiev-1', number: '1', name: 'Відділення №1: вул. Пирогівський шлях, 135 (Вантажне)', shortAddress: 'вул. Пирогівський шлях, 135', type: 'cargo' },
    { ref: 'kiev-5', number: '5', name: 'Відділення №5: вул. Федорова, 32 (до 30 кг)', shortAddress: 'вул. Федорова, 32', type: 'branch', maxWeightKg: 30 },
    { ref: 'kiev-14', number: '14', name: 'Відділення №14: бульв. Лесі Українки, 24 (до 30 кг)', shortAddress: 'бульв. Лесі Українки, 24', type: 'branch', maxWeightKg: 30 },
    { ref: 'kiev-post-1', number: '5001', name: 'Поштомат №5001: вул. Хрещатик, 15', shortAddress: 'вул. Хрещатик, 15', type: 'postomat', maxWeightKg: 20 }
  ]
};

/**
 * Search settlements via Nova Poshta Official API (or intelligent local fallback)
 */
export async function searchNovaPoshtaCities(
  query: string,
  apiKey?: string
): Promise<DeliveryCity[]> {
  const cleanQ = query.trim().toLowerCase();
  if (!cleanQ || cleanQ.length < 2) {
    return POPULAR_CITIES.slice(0, 10);
  }

  // 1. If API Key is provided, call Nova Poshta API 2.0
  if (apiKey && apiKey.trim().length > 10) {
    try {
      const response = await fetch('https://api.novaposhta.ua/v2.0/json/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          modelName: 'Address',
          calledMethod: 'searchSettlements',
          methodProperties: {
            CityName: cleanQ,
            Limit: '20',
            Page: '1'
          }
        })
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data && json.data[0]?.Addresses) {
          const apiCities: DeliveryCity[] = json.data[0].Addresses.map((item: any) => ({
            ref: item.DeliveryCity || item.Ref,
            name: item.MainDescription,
            area: item.Area,
            region: item.Region,
            settlementType: item.SettlementTypeCode || 'н.п.'
          }));
          if (apiCities.length > 0) {
            return apiCities;
          }
        }
      }
    } catch (err) {
      console.warn('Nova Poshta API searchSettlements error, falling back:', err);
    }
  }

  // 2. Intelligent local search fallback
  return POPULAR_CITIES.filter((c) => 
    c.name.toLowerCase().includes(cleanQ) || 
    c.area.toLowerCase().includes(cleanQ) || 
    (c.region && c.region.toLowerCase().includes(cleanQ))
  );
}

/**
 * Search warehouses/branches/postomats in selected city
 */
export async function getNovaPoshtaWarehouses(
  cityRefOrName: string,
  filterType: 'all' | 'branch' | 'postomat' = 'all',
  apiKey?: string
): Promise<DeliveryWarehouse[]> {
  if (!cityRefOrName) return [];

  // 1. If API Key provided, query live Nova Poshta warehouses
  if (apiKey && apiKey.trim().length > 10) {
    try {
      const response = await fetch('https://api.novaposhta.ua/v2.0/json/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          modelName: 'Address',
          calledMethod: 'getWarehouses',
          methodProperties: {
            CityName: cityRefOrName.includes('(') ? cityRefOrName.split('(')[0].trim() : cityRefOrName,
            Limit: '50',
            Page: '1'
          }
        })
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          let list: DeliveryWarehouse[] = json.data.map((w: any) => {
            const isPostomat = w.TypeOfWarehouse === 'f9316480-5f2d-425d-bc2c-ac7cd29de70f' || 
                               w.Description?.toLowerCase().includes('поштомат');
            const isCargo = w.Description?.toLowerCase().includes('вантажне') || 
                            w.TotalMaxWeightAllowed > 200;

            const type: 'branch' | 'postomat' | 'cargo' = isPostomat ? 'postomat' : isCargo ? 'cargo' : 'branch';

            return {
              ref: w.Ref,
              number: String(w.Number),
              name: w.Description,
              shortAddress: w.ShortAddress || w.Description,
              type,
              maxWeightKg: w.TotalMaxWeightAllowed ? Number(w.TotalMaxWeightAllowed) : undefined
            };
          });

          if (filterType === 'postomat') {
            list = list.filter(w => w.type === 'postomat');
          } else if (filterType === 'branch') {
            list = list.filter(w => w.type !== 'postomat');
          }

          if (list.length > 0) {
            return list;
          }
        }
      }
    } catch (err) {
      console.warn('Nova Poshta getWarehouses API warning:', err);
    }
  }

  // 2. Check predefined local warehouses
  const lower = cityRefOrName.toLowerCase();
  for (const [key, list] of Object.entries(DEFAULT_WAREHOUSES)) {
    if (lower.includes(key) || key.includes(lower)) {
      if (filterType === 'postomat') return list.filter(w => w.type === 'postomat');
      if (filterType === 'branch') return list.filter(w => w.type !== 'postomat');
      return list;
    }
  }

  // 3. Smart generic fallback for any city when API is not responding
  const cityName = cityRefOrName.split(',')[0].replace(/^(м\.|с\.|смт\.)\s*/i, '').trim();
  const genericList: DeliveryWarehouse[] = [
    {
      ref: `gen-${cityName}-1`,
      number: '1',
      name: `Відділення №1: ${cityName} (до 30 кг)`,
      shortAddress: `Центральне відділення`,
      type: 'branch',
      maxWeightKg: 30
    },
    {
      ref: `gen-${cityName}-2`,
      number: '2',
      name: `Відділення №2: ${cityName} (до 30 кг)`,
      shortAddress: `Відділення №2`,
      type: 'branch',
      maxWeightKg: 30
    },
    {
      ref: `gen-${cityName}-post`,
      number: 'Поштомат',
      name: `Поштомат ${cityName}: найближчий до вашої адреси`,
      shortAddress: `Поштомат`,
      type: 'postomat',
      maxWeightKg: 20
    }
  ];

  return genericList.filter(w => {
    if (filterType === 'postomat') return w.type === 'postomat';
    if (filterType === 'branch') return w.type !== 'postomat';
    return true;
  });
}
