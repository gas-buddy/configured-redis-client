import tap from 'tap';
import RedisClient from '../src/index';

const context = {
  service: { name: 'servName' },
  logger: console,
};

const v = { a: '123', b: 1234, c: { d: true } };

tap.test('test_helpers', async (tester) => {
  const redis = new RedisClient(context, {});
  const client = await redis.start(context);

  tester.test('makeKey', (t) => {
    t.strictEqual(client.makeKey('servName', 'fnName'), 'servName:fnName');
    t.strictEqual(client.makeKey('servName', 'fnName', 'param1'), 'servName:fnName:param1');
    t.strictEqual(client.makeServiceKey('fnName', 'param1', 'param2', 3), 'servName:fnName:param1:param2:3');
    t.end();
  });

  tester.test('memoize with named function', async (t) => {
    function makeItRain() {
      return v;
    }
    const value = await client.memoize(makeItRain);
    t.deepEqual(v, value, 'Value should match original');
    const value2 = await client.memoize(makeItRain);
    t.deepEqual(v, value2, 'Value should match original');
  });

  tester.test('memoize with key', async (t) => {
    const key = `testkey-${Date.now()}`;
    let called = false;
    const value = await client.memoize(() => {
      called = true;
      return v;
    }, { key });
    t.deepEqual(v, value, 'Value should match original');
    t.ok(called, 'Should call data function');
    const cacheValue = await client.memoize(() => {
      t.fail('Should not call data function after caching');
    }, { key });
    t.deepEqual(v, cacheValue, 'Value should match original');
  });

  tester.test('shutdown', async () => {
    await redis.stop();
  });
});
