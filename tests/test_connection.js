import tap from 'tap';
import RedisClient from '../src/index';

tap.test('test_connection', async (t) => {
  const redis = new RedisClient({
    logger: console,
  }, {});
  const client = await redis.start();
  t.ok(client.subscribe, 'Should have a subscribe method');
  await redis.stop();
  t.end();
});
