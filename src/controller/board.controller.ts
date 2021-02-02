import { Request, Response } from 'express'
import { SuccessResponse, FailureResponse, InternalErrorResponse } from './../lib/responseForm'
import FAILURE_RESPONSE from '../lib/failureResponse'
import { validateKind, validateCategory, validateModifyOrder } from '../lib/validateValue'
import { sendTeamEmail } from '../lib/sendEmail'
import KIND_TYPE from '../lib/kindType'
import redisClient from '../lib/redisClient'
import jwt from 'jsonwebtoken'
import config from '../../config'
import models from '../models'

const BoardDB = models.board
const ApplicationDB = models.application
const TeamDB = models.team

export const GetList = async (req: Request, res: Response) => {
  try {
    let { kind, category } = req.params
    let { searchText, offset, limit, order } = req.query
  
    kind = validateKind(kind)
    category = validateCategory(kind, category)
    offset = isNaN(offset) ? 0 : offset
    limit = isNaN(limit) ? 12 : limit
    order = validateModifyOrder(order)

    let me, payload
    try {
        const accessToken = (req.header('Authorization') || '').replace('Bearer ', '')
        payload = jwt.verify(accessToken, config.JWT_SECRET, { issuer: config.JWT_ISSUER })
        me = payload._id
    }
    catch (e) {}
  
    const result = await BoardDB.GetList({ kind, category, author: me }, { skip: limit * offset, limit, order, searchText })
    
    res.send(SuccessResponse(result))
  }
  catch (err) {
    console.log(err)
    res.status(500).send(InternalErrorResponse)
  }
}

export const GetItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
  
    if (!id || id.length !== 24) {
      return res.status(400).send(FailureResponse(FAILURE_RESPONSE.INVALID_PARAM))
    }
    
    let me, payload, isApplied, isAccepted
    try {
        const accessToken = (req.header('Authorization') || '').replace('Bearer ', '')
        payload = jwt.verify(accessToken, config.JWT_SECRET, { issuer: config.JWT_ISSUER })
        me = payload._id
    }
    catch (e) {}

    const board = await BoardDB.GetItem({ _id: id })
    if (!board) {
      return res.status(404).send(FailureResponse(FAILURE_RESPONSE.NOT_FOUND))
    }
  
    await BoardDB.UpdateHit({ _id: id, diff: 1 })

    if (me) {
      isApplied = await ApplicationDB.IsApplied({ applicant: me, boardId: id })
      isAccepted = await ApplicationDB.IsAccepted({ applicant: me, boardId: id })
    }

    const data: any = { board }
    if (isApplied || isApplied) {
      data['isApplied'] = isApplied
      data['isAccepted'] = isAccepted
    }

    res.send(SuccessResponse(data))
  } catch (err) {
    console.log(err)
    res.status(500).send(InternalErrorResponse)
  }
}

export const Create = async (req: Request, res: Response) => {
  try {
    const { _id: me } = req.user
    const {
      kind,
      category,
      topic,
      title,
      content,
      positions,
      wantCnt,
      endDate
    } = req.body

    const validatedKind = validateKind(kind)
    const validatedCategory = validateKind(category)

    if (
      !kind || !category || !topic || !title || !content || isNaN(wantCnt) || isNaN(Date.parse(endDate)) ||
      (positions && !Array.isArray(positions)) ||
      kind !== validatedKind ||
      category !== validatedCategory
    ) {
      return res.status(400).send(FailureResponse(FAILURE_RESPONSE.INVALID_PARAM))
    }
  
    const countBoardByMe = await BoardDB.GetBoardCount({ author: me })
    if (countBoardByMe > 3) {
      return res.status(400).send(FailureResponse(FAILURE_RESPONSE.EXCCED_LIMIT))
    }
  
    const result = await BoardDB.Create({
      author: me,
      kind,
      category,
      topic,
      title,
      content,
      positions,
      wantCnt,
      endDate
    })
  
    await redisClient.incCnt('listCnt')
  
    res.status(201).send(SuccessResponse(result.insertedId))
  } catch (err) {
    res.status(500).send(InternalErrorResponse)
  }
}

export const Update = async (req: Request, res: Response) => {
  try {
    const { _id: me } = req.user
    const { id } = req.params
    const {
      kind,
      category,
      topic,
      title,
      content,
      positions,
      wantCnt,
      endDate
    } = req.body

    const validatedKind = validateKind(kind)
    const validatedCategory = validateKind(category)
  
    if (
      (!id || id.length !== 24) ||
      !kind || !category || !topic || !title || !content || isNaN(wantCnt) || isNaN(Date.parse(endDate)) ||
      (positions && !Array.isArray(positions)) ||
      kind !== validatedKind ||
      category !== validatedCategory
    ) {
      return res.status(400).send(FailureResponse(FAILURE_RESPONSE.INVALID_PARAM))
    }

    const result = await BoardDB.UpdateItem({
      _id: id,
      author: me,
      kind,
      category,
      topic,
      title,
      content,
      positions,
      wantCnt,
      endDate
    })
    if (result.matchedCount === 0) {
      return res.status(404).send(FAILURE_RESPONSE.NOT_FOUND)
    }

    res.send(SuccessResponse())
  } catch (err) {
    res.status(500).send(InternalErrorResponse)
  }
}

export const Delete = async (req: Request, res: Response) => {
  try {
    const { _id: me } = req.user
    const { id } = req.params
  
    if (!id || id.length !== 24) {
      return res.status(400).send(FailureResponse(FAILURE_RESPONSE.INVALID_PARAM))
    }
    
    await BoardDB.Delete({ _id: id, author: me })
  
    res.send(SuccessResponse())
  } catch (err) {
    res.status(500).send(InternalErrorResponse)
  }
}

export const CreateTeam = async (req: Request, res: Response) => {
  try {
    const { _id: me } = req.user
    const { id } = req.params
    const { name, content, message } = req.body
  
    if ((!id || id.length !== 24) || !name || !content || !message) {
      return res.status(400).send(FailureResponse(FAILURE_RESPONSE.INVALID_PARAM))
    }
  
    const countTeamByMe = await BoardDB.GetTeamCount({ author: me })
    if (countTeamByMe > 2) {
      return res.status(400).send(FailureResponse(FAILURE_RESPONSE.EXCCED_LIMIT))
    }
  
    const board = await BoardDB.GetItem({ _id: id })
    if (!board) {
      return res.status(404).send(FailureResponse(FAILURE_RESPONSE.NOT_FOUND))
    }
  
    if (me !== board.author || board.isCompleted) {
      return res.status(400).send(FailureResponse(FAILURE_RESPONSE.BAD_REQUEST))
    }
  
    await BoardDB.UpdateIsCompleted({ _id: id })

    const result = await ApplicationDB.GetList({ author: me, active: true, boardId: id })
    const { list } = result

    await TeamDB.Create({ name, master: me, members: list, content })
    
    await redisClient.incCnt('teamCnt')
  
    sendTeamEmail(board.kind, board, message)
    
    res.send(SuccessResponse())
  }
  catch (err) {
    console.log(err)
    res.status(500).send(InternalErrorResponse)
  }
}