import { Redis } from 'ioredis';
import { env } from '../config/env.js';
import { logger } from './logger.js';

const PREFIX = 'starlife:';

const client = env.REDIS_URL
  ? new Redis(env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1, enableOfflineQueue: false })
  : null;

if (client) {
  client.on('error', (err) => logger.warn({ err: err.message }, 'redis unavailable'));
  client.connect().catch(() => {});
}

// if redis is down every call is a no-op and requests fall through to the db
const ready = () => client?.status === 'ready';

async function get(key) {
  if (!ready()) return null;
  const raw = await client.get(PREFIX + key).catch(() => null);
  return raw ? JSON.parse(raw) : null;
}

async function set(key, value, ttl = env.CACHE_DEFAULT_TTL) {
  if (!ready()) return;
  await client.set(PREFIX + key, JSON.stringify(value), 'EX', ttl).catch(() => {});
}

async function remember(key, loader, ttl = env.CACHE_DEFAULT_TTL) {
  const hit = await get(key);
  if (hit !== null) return hit;

  const value = await loader();
  await set(key, value, ttl);
  return value;
}

async function forget(key) {
  if (!ready()) return;
  await client.del(PREFIX + key).catch(() => {});
}

async function forgetPrefix(prefix) {
  if (!ready()) return;
  const stream = client.scanStream({ match: `${PREFIX}${prefix}*`, count: 100 });
  for await (const keys of stream) {
    if (keys.length) await client.del(...keys);
  }
}

async function ping() {
  if (!ready()) return false;
  return (await client.ping().catch(() => null)) === 'PONG';
}

async function disconnect() {
  await client?.quit().catch(() => {});
}

export const cache = { get, set, remember, forget, forgetPrefix, ping, disconnect };
