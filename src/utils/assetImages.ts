import heroStoreImg from '../assets/images/hero_iskra_store_1790671594961.jpg';
import circuitBreakerImg from '../assets/images/product_circuit_breaker_1790671628425.jpg';
import copperCableImg from '../assets/images/product_copper_cable_1790671618296.jpg';
import faucetMixerImg from '../assets/images/product_faucet_mixer_1790671605777.jpg';

export const ASSET_IMAGES = {
  hero: heroStoreImg,
  circuitBreaker: circuitBreakerImg,
  copperCable: copperCableImg,
  faucetMixer: faucetMixerImg,
};

/**
 * Returns a bundled Vite asset URL for internal images or safe fallback.
 * Works seamlessly in development, production build, and GitHub Pages.
 */
export function getSafeImageUrl(imgUrl?: string, categoryOrName?: string): string {
  if (imgUrl && typeof imgUrl === 'string' && imgUrl.trim() !== '') {
    const trimmed = imgUrl.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:image/')) {
      return trimmed;
    }
    if (trimmed.includes('faucet_mixer') || trimmed.includes('ORT-104') || trimmed.includes('ORT-101') || trimmed.includes('ORT-105')) {
      return ASSET_IMAGES.faucetMixer;
    }
    if (trimmed.includes('circuit_breaker') || trimmed.includes('ELE-201') || trimmed.includes('автомат')) {
      return ASSET_IMAGES.circuitBreaker;
    }
    if (trimmed.includes('copper_cable') || trimmed.includes('ELE-202') || trimmed.includes('кабель') || trimmed.includes('ВВГнг')) {
      return ASSET_IMAGES.copperCable;
    }
    if (trimmed.includes('hero_iskra_store')) {
      return ASSET_IMAGES.hero;
    }
  }

  // Fallback by category or name context
  const context = (categoryOrName || '').toLowerCase();
  if (
    context.includes('змішувач') || 
    context.includes('кран') || 
    context.includes('сантех') || 
    context.includes('підводк') || 
    context.includes('фум') || 
    context.includes('сифон') ||
    context.includes('радіатор') ||
    context.includes('труб')
  ) {
    return ASSET_IMAGES.faucetMixer;
  }
  if (
    context.includes('кабель') || 
    context.includes('провід') || 
    context.includes('ізострічк') || 
    context.includes('гофр')
  ) {
    return ASSET_IMAGES.copperCable;
  }
  if (
    context.includes('автомат') || 
    context.includes('електро') || 
    context.includes('вимикач') || 
    context.includes('розетк') ||
    context.includes('wago') ||
    context.includes('щит') ||
    context.includes('пзв')
  ) {
    return ASSET_IMAGES.circuitBreaker;
  }

  return ASSET_IMAGES.hero;
}
