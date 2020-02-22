import redis from 'redis';
import config from './../config';

const redisClient = redis.createClient({
  host: '127.0.0.1',
  port: 6379,
});

redisClient.auth(process.env.REDIS_PWD || config.REDIS_PWD, (err) => {
  if (err) {
    throw err;
  }
});

redisClient.on('error', (err) => {
  if (err) {
    throw new Error(err);
  }
});

export default redisClient;
