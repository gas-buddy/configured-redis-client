configured-redis-client
=======================

A small wrapper around redis to allow configuration from confit.

```json
{
  "connections": {
    "redis": {
      "module": "require:@gasbuddy/configured-redis-client",
      "hosts":
    }
  }
}
```

API
---
The redis client attached to `req.gb.db` is an [ioredis](https://github.com/luin/ioredis) Redis object.

Additional Utilities
--------------------

### Ttl
Common redis ttl values can be found in `Ttl`.
```javascript
req.gb.db.redis.Ttl.oneMinute // => 60
req.gb.db.redis.Ttl.oneHour // => 3600
```

### Redis Keys
To make a key, use `makeKey()`
```javascript
req.gb.db.redis.makeKey('redis', 'is', 'cool') // => 'redis:is:cool'
```

To create a key that begins with the name of your service, use `makeServiceKey()`
```javascript
req.gb.db.redis.makeServiceKey('redis', 'is', 'cool') // => 'my-serv:redis:is:cool'
```

### Caching the Result of a Function Call
Use `memoize()` to cache the result of a function call.

```javascript
const redisClient = req.gb.db.redis;

const mySlowDataFunction = async () => {
  // slow things here
};

// return cached value. on cache miss, cache and return result of mySlowdataFunction()
const myVal = redisClient.memoize(
  mySlowDataFunction,
  {
    key: redisClient.makeKey('redis', 'is', 'cool'), // defaults to name of function
    ttlSeconds: redisClient.Ttl.fiveMinutes, // defaults to one minute
  },
);
