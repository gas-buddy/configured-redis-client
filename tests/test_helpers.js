import tap from 'tap';
import winston from 'winston';
import RedisClient from '../src/index';

const context = {
  service: { name: 'servName' },
  logger: winston,
};

tap.test('test_helpers', async (tester) => {
  const redis = new RedisClient(context, {});
  const client = await redis.start(context);

  tester.test('makeKey', (t) => {
    t.strictEqual(client.makeKey('servName', 'fnName'), 'servName:fnName');
    t.strictEqual(client.makeKey('servName', 'fnName', 'param1'), 'servName:fnName:param1');
    t.strictEqual(client.makeServiceKey('fnName', 'param1', 'param2', 3), 'servName:fnName:param1:param2:3');
    t.end();
  });

  tester.test('getOrSetJSON', async (t) => {
    const v = { a: '123', b: 1234, c: { d: true } };
    const k = `testkey-${Date.now()}`;
    let called = false;
    const value = await client.getOrSetJSON(k, client.Ttl.oneMinute, () => {
      called = true;
      return v;
    });
    t.deepEqual(v, value, 'Value should match original');
    t.ok(called, 'Should call data function');
    const cacheValue = await client.getOrSetJSON(k, client.Ttl.oneMinute, () => {
      t.fail('Should not call data function after caching');
    });
    t.deepEqual(v, cacheValue, 'Value should match original');
  });

  tester.test('shutdown', async () => {
    await redis.stop();
  });
});
