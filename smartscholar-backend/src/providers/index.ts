import { ProviderAdapter } from '../acquisition/types';
import { erasmusAdapter } from './erasmus';
import { mextAdapter } from './mext';
import { fulbrightAdapter } from './fulbright';
import { stipendiumHungaricumAdapter } from './stipendium-hungaricum';

/**
 * Registered scholarship providers for the acquisition engine.
 * Add a provider here once its adapter compiles and is verified.
 */
export const PROVIDERS: ProviderAdapter[] = [
  erasmusAdapter,
  mextAdapter,
  fulbrightAdapter,
  stipendiumHungaricumAdapter,
];

export function getProviders(): ProviderAdapter[] {
  return PROVIDERS;
}
