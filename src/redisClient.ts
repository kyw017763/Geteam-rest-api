import redis from 'redis';
import config from './config';

// 'visitCnt'
// 'accountCnt'
// 'listCnt'
// 'applyCnt'
// 'teamCnt'

class RedisClient {
  public client: redis.RedisClient;
	private pwd: string;

	constructor (pwd: string) {
    this.pwd = pwd;

    this.client = redis.createClient({
      host: '127.0.0.1',
      port: 6379,
    });

    this.client.auth(this.pwd, (err) => {
      if (err) {
        throw err;
      }
    });
    
    this.client.on('error', (err) => {
      if (err) {
        throw new Error(err);
      }
    });
  }

  blacklistToken(accessToken: string, exp: number): void {
    this.client.set(`jwt-blacklist-${accessToken}`, Number(0).toString());
    this.client.expire(`jwt-blacklist-${accessToken}`, exp - (new Date().getTime() / 1000));
  }

  checkToken(accessToken: string): boolean {
    if (this.client.EXISTS(`jwt-blacklist-${accessToken}`)) {
      return true;
    } else {
      return false;
    }
  }

  getCnt(key: string): number {
    if (this.client.EXISTS(key)) {
      return Number(this.client.GET(key));
    } else {
      this.client.SET(key, '0');
      return 0;
    }
  }

  incCnt(key: string): number {
    if (this.client.EXISTS(key)) {
      let cnt = Number(this.client.GET(key));
      let cntNum = Number(cnt) + 1;
      this.client.SET(key, cntNum.toString());
      return cnt;
    } else {
      this.client.SET(key, '1');
      return 1;
    }
  }
}

const redisClient = new RedisClient(process.env.REDIS_PWD || config.REDIS_PWD);

export default redisClient;
