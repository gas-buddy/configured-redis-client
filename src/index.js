import assert from 'assert';
import Redis from 'ioredis';

const Ttl = {
  oneMinute: 60,
  fiveMinutes: 60 * 5,
  thirtyMinutes: 60 * 30,
  oneHour: 60 * 60,
  fourHours: 60 * 60 * 4,
  eightHours: 60 * 60 * 8,
  oneDay: 60 * 60 * 24,
};

async function memoize(redisClient, valueFunction, { key, ttlSeconds = Ttl.oneMinute }) {
  const keyName = key || valueFunction.name;
  if (!keyName) {
    throw new Error('memoize must have a key option or use a named function');
  }
  const cacheValue = await redisClient.get(keyName);
  if (cacheValue) {
    return JSON.parse(cacheValue);
  }

  const sourceValue = await valueFunction();

  if (sourceValue !== undefined) {
    await redisClient.setex(keyName, ttlSeconds, JSON.stringify(sourceValue));
  }

  return sourceValue;
}

export default class RedisClient {
  constructor(context, opts) {
    // We have defaults (host/port) and must-haves (lazyConnect)
    this.redisClient = new Redis(Object.assign({}, {
      host: process.env.REDIS_HOST || 'redis',
      port: process.env.REDIS_PORT || 6379,
    }, opts, {
      lazyConnect: true, // We'll manage this ourselves.
    }));
  }

  async start(context) {
    assert(!this.started, 'start called multiple times on configured-redis-client instance');
    this.started = true;
    try {
      await this.redisClient.connect();

      // Add our helpers. At some point we'll front the ioredis API with our own that tracks
      // various things, but for now just muck with the instance
      this.redisClient.Ttl = Ttl;
      this.redisClient.memoize = (fn, opts) => memoize(this.redisClient, fn, opts || {});
      this.redisClient.makeKey = (...args) => args.join(':');
      this.redisClient.makeServiceKey = (...args) => `${context.service.name}:${args.join(':')}`;

      return this.redisClient;
    } catch (error) {
      if (context && context.logger && context.logger.error) {
        context.logger.error('Failed to connect to redis', {
          message: error.message,
          code: error.code,
        });
      }
      throw error;
    }
  }

  stop() {
    assert(this.started, 'stop called multiple times on configured-redis-client instance');
    delete this.started;
    this.redisClient.quit();
  }
}
