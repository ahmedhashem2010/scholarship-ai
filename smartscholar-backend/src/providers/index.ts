import { ProviderAdapter } from '../acquisition/types';
import { erasmusAdapter } from './erasmus';
import { mextAdapter } from './mext';

/**
 * Registered scholarship providers for the acquisition engine.
 * Add a provider here once its adapter compiles and is verified.
 */
export const PROVIDERS: ProviderAdapter[] = [erasmusAdapter, mextAdapter];

export function getProviders(): ProviderAdapter[] {
  return PROVIDERS;
}
