import redis from 'redis'
import { promisify } from 'util'
import config from '../../config'

class RedisClient {
  public client: redis.RedisClient
  private existsAsync: (arg1: string) => Promise<number>
  private getAsync: (arg1: string) => Promise<string>
  private setAsync: (arg1: string, arg2: string) => Promise<unknown>
  private expireAsync: (arg1: string, arg2: number) => Promise<number>

	constructor () {
    this.client = redis.createClient(process.env.REDIS_URL || config.REDIS_URL)

    // this.client.auth('', (err) => {
    //   if (err) console.error(err)
    // })

    this.client.on('connect', () => console.log('connected'))
    
    this.client.on('error', (err) => {
      if (err) console.error(err)
    })

    this.existsAsync = promisify(this.client.EXISTS).bind(this.client)
    this.getAsync= promisify(this.client.GET).bind(this.client)
    this.setAsync = promisify(this.client.SET).bind(this.client)
    this.expireAsync = promisify(this.client.EXPIRE).bind(this.client)
  }

  async blacklistToken(accessToken: string, exp: number): Promise<void> {
    await this.setAsync(`jwt-blacklist-${accessToken}`, Number(0).toString())
    await this.expireAsync(`jwt-blacklist-${accessToken}`, exp - (new Date().getTime() / 1000))
  }

  async checkToken(accessToken: string): Promise<boolean> {
    if (await this.existsAsync(`jwt-blacklist-${accessToken}`)) {
      return true
    } else {
      return false
    }
  }

  async getCnt(key: string): Promise<number> {
    if (await this.existsAsync(key)) {
      return Number(await this.getAsync(key))
    } else {
      await this.setAsync(key, '0')
      return 0
    }
  }

  async incCnt(key: string): Promise<number> {
    if (await this.existsAsync(key)) {
      let cnt = Number(await this.getAsync(key))
      let cntNum = cnt + 1
      await this.setAsync(key, cntNum.toString())
      return cnt
    } else {
      await this.setAsync(key, '1')
      return 1
    }
  }
}

const redisClient = new RedisClient()

export default redisClient
