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
  if (!imgUrl || typeof imgUrl !== 'string' || imgUrl.trim() === '') {
    return ASSET_IMAGES.circuitBreaker;
  }

  const trimmed = imgUrl.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:image/')) {
    return trimmed;
  }
  if (trimmed.includes('faucet_mixer')) {
    return ASSET_IMAGES.faucetMixer;
  }
  if (trimmed.includes('circuit_breaker')) {
    return ASSET_IMAGES.circuitBreaker;
  }
  if (trimmed.includes('copper_cable')) {
    return ASSET_IMAGES.copperCable;
  }
  if (trimmed.includes('hero_iskra_store')) {
    return ASSET_IMAGES.hero;
  }

  return trimmed;
}
