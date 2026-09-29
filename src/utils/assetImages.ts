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
export function getSafeImageUrl(imgUrl?: string): string {
  if (!imgUrl || typeof imgUrl !== 'string') return ASSET_IMAGES.hero;
  
  const trimmed = imgUrl.trim();
  
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
  
  if (trimmed.startsWith('/src/assets/images/')) {
    if (trimmed.includes('faucet')) return ASSET_IMAGES.faucetMixer;
    if (trimmed.includes('breaker')) return ASSET_IMAGES.circuitBreaker;
    if (trimmed.includes('cable')) return ASSET_IMAGES.copperCable;
    return ASSET_IMAGES.hero;
  }
  
  return trimmed;
}
