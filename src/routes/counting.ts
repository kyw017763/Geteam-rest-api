import express from 'express'
import redisClient from '../lib/redisClient'
import { SuccessResponse, InternalErrorResponse } from './../lib/responseForm'
import ICounting from '../ts/ICounting';

const router = express.Router()
export default router

router.get('/counting', async (req, res, next) => {
  try {
    let counting: ICounting = {}

    await redisClient.incCnt('visitCnt')

    counting.visit = await redisClient.getCnt('visitCnt')
    counting.account = await redisClient.getCnt('accountCnt')
    counting.list = await redisClient.getCnt('listCnt')
    counting.apply = await redisClient.getCnt('applyCnt')
    counting.team = await redisClient.getCnt('teamCnt')
    
    res.send(SuccessResponse(counting))
  } catch (err) {
    console.log(err)
    res.status(500).json(InternalErrorResponse)
  }
})
