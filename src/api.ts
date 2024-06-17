import { BaseAuthStore, Client } from '@crisvp/pocketbase-js';

import { CollectionDescription, CollectionDescriptionRaw } from './types';
import { normalizeDescriptions } from './translations.js';

export interface ConnectOptions {
  authStore?: BaseAuthStore;
  lang?: string;
}

export interface ClientOptions {
  adminUser: string;
  adminPassword: string;
}

export async function connectDatabase(
  url: string = 'http://127.0.0.1:8090/',
  adminUser: string,
  adminPassword: string,
  connectOptions: ConnectOptions = {}
): Promise<Client> {
  const opts = {
    ...connectOptions,
  };
  const pb = new Client(url, opts.authStore, opts.lang);

  try {
    await pb.admins.authWithPassword(adminUser, adminPassword);
  } catch (e) {
    if (e.status === 401) throw new Error('Failed to authenticate admin user');
    else throw e;
  }
  return pb;
}

async function collectionsTable(pb: Client): Promise<CollectionDescriptionRaw[]> {
  const allCollections = (await pb.collections.getFullList()) as unknown as CollectionDescriptionRaw[];
  const collections = allCollections.filter(r => !r.name.startsWith('_'));

  return collections;
}

export async function readCollections(
  url: string,
  { adminUser, adminPassword }: ClientOptions
): Promise<CollectionDescription[]> {
  const pb = await connectDatabase(url, adminUser, adminPassword);
  const collections = await collectionsTable(pb);
  const normalizedCollections = normalizeDescriptions(collections);
  return normalizedCollections;
}
