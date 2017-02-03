import assert from 'assert';
import Redis from 'ioredis';

export default class RedisClient {
  constructor(context, opts) {
    // We have defaults (host/port) and must-haves (lazyConnect)
    this.redisClient = new Redis(Object.assign({}, {
      host: 'redis',
      port: 6379,
    }, opts, {
      lazyConnect: true, // We'll manage this ourselves.
    }));
  }

  async start(context) {
    assert(!this.started, 'start called multiple times on configured-redis-client instance');
    this.started = true;
    try {
      await this.redisClient.connect();
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
