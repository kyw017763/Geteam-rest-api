import express from 'express'
import redisClient from '../lib/redisClient'
import responseForm from './../lib/responseForm'

const router = express.Router()
export default router

router.get('/counting', async (req, res, next) => {
  try {
    interface ICounting {
      visit?: number
      account?: number
      list?: number
      apply?: number
      team?: number
    }

    let counting: ICounting = {}

    await redisClient.incCnt('visitCnt')

    counting.visit = await redisClient.getCnt('visitCnt')
    counting.account = await redisClient.getCnt('accountCnt')
    counting.list = await redisClient.getCnt('listCnt')
    counting.apply = await redisClient.getCnt('applyCnt')
    counting.team = await redisClient.getCnt('teamCnt')
    
    res.json(responseForm(true, '', counting))
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()))
  }
})
