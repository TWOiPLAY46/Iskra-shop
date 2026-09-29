import { Product } from '../types/store';

export const getProductBrand = (product: Product): string => {
  if (product.brand && product.brand.trim() !== '') {
    return product.brand.trim();
  }
  
  if (product.specs) {
    for (const key of ['Виробник', 'Бренд', 'Manufacturer', 'Brand', 'Марка']) {
      if (product.specs[key] && product.specs[key].trim() !== '') {
        return product.specs[key].trim();
      }
    }
  }

  // Detect brand by substring
  const combined = `${product.name} ${product.desc || ''}`.toLowerCase();
  if (combined.includes('grohe')) return 'Grohe';
  if (combined.includes('valtec')) return 'Valtec';
  if (combined.includes('wavin') || combined.includes('ekoplastik')) return 'Wavin';
  if (combined.includes('schneider')) return 'Schneider Electric';
  if (combined.includes('kermi')) return 'Kermi';
  if (combined.includes('cersanit')) return 'Cersanit';
  if (combined.includes('atlantic')) return 'Atlantic';
  if (combined.includes('danfoss')) return 'Danfoss';
  if (combined.includes('aquafilter')) return 'Aquafilter';
  if (combined.includes('mirado')) return 'Mirado';
  if (combined.includes('dnipro-m') || combined.includes('дніпро-м')) return 'Dnipro-M';
  if (combined.includes('eurolamp')) return 'Eurolamp';
  if (combined.includes('biom')) return 'Biom';
  if (combined.includes('ззцм')) return 'ЗЗЦМ';
  if (combined.includes('одескабель')) return 'Одескабель';
  if (combined.includes('kolo')) return 'Kolo';
  if (combined.includes('kraft')) return 'Kraft';
  if (combined.includes('tucai')) return 'Tucai';
  if (combined.includes('wago')) return 'WAGO';
  if (combined.includes('3m')) return '3M';
  if (combined.includes('zubr')) return 'ZUBR';
  if (combined.includes('ariston')) return 'Ariston';
  if (combined.includes('bosch')) return 'Bosch';
  if (combined.includes('eaton')) return 'Eaton';
  if (combined.includes('hager')) return 'Hager';

  return 'Інші виробники';
};
