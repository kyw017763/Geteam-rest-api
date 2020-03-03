import redis from 'redis';
import { promisify } from 'util';
import config from './config';

// 'visitCnt'
// 'accountCnt'
// 'listCnt'
// 'applyCnt'
// 'teamCnt'

class RedisClient {
  public client: redis.RedisClient;
  private pwd: string;
  private existsAsync: any;
  private getAsync: any;
  private setAsync: any;
  private expireAsync: any;

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

    this.existsAsync = promisify(this.client.EXISTS).bind(this.client);
    this.getAsync= promisify(this.client.GET).bind(this.client);
    this.setAsync = promisify(this.client.SET).bind(this.client);
    this.expireAsync = promisify(this.client.EXPIRE).bind(this.client);
  }

  async blacklistToken(accessToken: string, exp: number): Promise<void> {
    await this.setAsync(`jwt-blacklist-${accessToken}`, Number(0).toString());
    await this.expireAsync(`jwt-blacklist-${accessToken}`, exp - (new Date().getTime() / 1000));
  }

  async checkToken(accessToken: string): Promise<boolean> {
    if (await this.existsAsync(`jwt-blacklist-${accessToken}`)) {
      return true;
    } else {
      return false;
    }
  }

  async getCnt(key: string): Promise<number> {
    if (await this.existsAsync(key)) {
      return Number(await this.getAsync(key));
    } else {
      await this.setAsync(key, '0');
      return 0;
    }
  }

  async incCnt(key: string): Promise<number> {
    if (await this.existsAsync(key)) {
      let cnt = Number(await this.getAsync(key));
      let cntNum = cnt + 1;
      await this.setAsync(key, cntNum.toString());
      return cnt;
    } else {
      await this.setAsync(key, '1');
      return 1;
    }
  }
}

const redisClient = new RedisClient(process.env.REDIS_PWD || config.REDIS_PWD);

export default redisClient;
