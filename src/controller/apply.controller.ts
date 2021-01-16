import { Request, Response } from 'express'
import { SuccessResponse, FailureResponse, InternalErrorResponse } from './../lib/responseForm'
import { INVALID_PARAM, NOT_FOUND, BAD_REQUEST } from '../lib/failureResponse'
import { validateKind } from '../lib/validateValue'
import redisClient from '../lib/redisClient'
import models from '../models'

const ApplyDB = models.apply
const BoardDB = models.board

export const GetList = async (req: Request, res: Response) => {
  try {
    const { _id: me } = req!.user!
    let { kind, author, is_accepted: isAccepted, active, offset, limit, option } = req.query

    kind = validateKind(kind)
    offset = isNaN(offset) ? 0 : offset
    limit = isNaN(limit) ? 12 : limit

    const result = await ApplyDB.GetList(
      { accountId: me, kind, author, isAccepted, active },
      { skip: offset * limit, limit, option }
    )

    res.send(SuccessResponse(result))
  }
  catch (err) {
    console.log(err)
    res.status(500).send(InternalErrorResponse)
  }
}

export const GetListOnMyParticularBoard = async (req: Request, res: Response) => {
  try {
    const { _id: me } = req!.user!
    let { boardid: boardId } = req.query
  
    if (!boardId || boardId.length !== 24) {
      return res.status(400).send(FailureResponse(INVALID_PARAM))
    }
  
    const result = await ApplyDB.GetList({ author: me, boardId })
  
    res.send(SuccessResponse(result))
  }
  catch (err) {
    console.log(err)
    res.status(500).send(InternalErrorResponse)
  }
}

export const Create = async (req: Request, res: Response) => {
  try {
    const { _id: me } = req!.user!
    const { author, boardId, wantedText } = req.body
    let { kind, position, portfolio, portfolioText } = req.body

    if (!author || author.length !== 24 || !boardId || boardId.length !== 24 || !wantedText) {
      return res.status(400).send(FailureResponse(INVALID_PARAM))
    }
  
    const isApplied = await ApplyDB.IsApplied({ accountId: me, boardId })
    if (isApplied) {
      return res.status(400).send(FailureResponse(BAD_REQUEST))
    }

    const contestObj: any = {}
    kind = validateKind(kind)
    if (kind === 'contest') {
      contestObj.position = position
      contestObj.portfolio = portfolio
      contestObj.portfolioText = portfolioText
    }

    const result = await ApplyDB.Create({ accountId: me, author, boardId, wantedText, ...contestObj })

    await BoardDB.UpdateApplyCnt({ _id: boardId, diff: 1 })
  
    await redisClient.incCnt('applyCnt')
    
    res.status(201).send(SuccessResponse({ _id: result.insertedId }))
  }
  catch (err) {
    console.log(err)
    res.status(500).send(InternalErrorResponse)
  }
}

export const UpdateAccept = async (req: Request, res: Response) => {
  try {
    const { _id: me } = req!.user!
    const { boardid: boardId, applyid: applyId } = req.params

    if (!boardId || boardId.length !== 24 || !applyId || applyId.length !== 24) {
      return res.status(400).send(FailureResponse(INVALID_PARAM))
    }

    if (await ApplyDB.IsAccepted({ _id: applyId, boardId })) {
      return res.status(400).send(FailureResponse(BAD_REQUEST))
    }

    const updateIsAcceptedResult = await ApplyDB.UpdateIsAccepted({ _id: applyId, boardId, author: me })
    if (updateIsAcceptedResult.matchedCount === 0) {
      return res.status(404).send(FailureResponse(NOT_FOUND))
    }
  
    const updateAcceptCntResult = await BoardDB.UpdateAcceptCnt({ _id: boardId, diff: 1 })
    if (updateAcceptCntResult.matchedCount === 0) {
      return res.status(404).send(FailureResponse(NOT_FOUND))
    }
  
    res.send(SuccessResponse())
  }
  catch (err) {
    console.log(err)
    res.status(500).send(InternalErrorResponse)
  } 
}

export const Delete = async (req: Request, res: Response) => {
  try {
    const { _id: me } = req!.user!
    const { boardid: boardId, applyid: applyId } = req.params

    if (!boardId || boardId.length !== 24 || !applyId || applyId.length !== 24) {
      return res.status(400).send(FailureResponse(INVALID_PARAM))
    }

    const result = await ApplyDB.Delete({ _id: applyId, boardId })
    if (result === false) {
      return res.status(400).send(FailureResponse(BAD_REQUEST))
    }
    if (result.matchedCount === 0) {
      return res.status(404).send(FailureResponse(NOT_FOUND))
    }

    await BoardDB.UpdateApplyCnt({ _id: boardId, diff: -1 })
    
    res.send(SuccessResponse())
  }
  catch (err) {
    console.log(err)
    res.status(500).send(InternalErrorResponse)
  }
}