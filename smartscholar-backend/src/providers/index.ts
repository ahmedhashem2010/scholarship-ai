import { ProviderAdapter } from '../acquisition/types';
import { erasmusAdapter } from './erasmus';

/**
 * Registered scholarship providers for the acquisition engine.
 * Add a provider here once its adapter compiles and is verified.
 */
export const PROVIDERS: ProviderAdapter[] = [erasmusAdapter];

export function getProviders(): ProviderAdapter[] {
  return PROVIDERS;
}
