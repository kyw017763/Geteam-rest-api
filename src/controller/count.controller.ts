import { Request, Response } from 'express'
import { SuccessResponse, InternalErrorResponse } from '../lib/responseForm'
import redisClient from '../lib/redisClient'
import Counting from '../ts/models/CountingModel'

export const GetCount = async (req: Request, res: Response) => {
  try {
    let counting: Counting = { visit: 0, account: 0, list: 0, application: 0, team: 0 }

    await redisClient.incCnt('visitCnt')

    counting.visit = await redisClient.getCnt('visitCnt')
    counting.account = await redisClient.getCnt('accountCnt')
    counting.list = await redisClient.getCnt('listCnt')
    counting.application = await redisClient.getCnt('applicationCnt')
    counting.team = await redisClient.getCnt('teamCnt')
    
    res.send(SuccessResponse(counting))
  } catch (err) {
    console.log(err)
    res.status(500).json(InternalErrorResponse)
  }
}