import 'server-only';
import { readBuildCache } from '../supabase/build-cache';
import santaFe from '@/content/destinos/santa-fe-capital.json';
import altaGracia from '@/content/destinos/alta-gracia.json';
import release from '@/content/destinos/release.json';
import { validatePublication, type DestinationRelease } from './publication-contract';
import type { EditorialDestinationPage } from './editorial-page';

const pages = [santaFe, altaGracia] as EditorialDestinationPage[];
const errors = validatePublication(release as DestinationRelease, pages);
if (errors.length) throw new Error('Destination publication blocked: ' + errors.join(','));
const cache = readBuildCache();
export const publishedDestinations: readonly EditorialDestinationPage[] = cache ? [...cache.payload.destinations, ...cache.extraDestinations] : pages;
export const getPublishedDestination = (slug: string) => publishedDestinations.find(p => p.slug === slug);
