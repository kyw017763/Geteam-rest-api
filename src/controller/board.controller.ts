import { Request, Response } from 'express'
import { SuccessResponse, FailureResponse, InternalErrorResponse } from './../lib/responseForm'
import { INVALID_PARAM, NOT_FOUND, BAD_REQUEST, EXCCED_LIMIT } from '../lib/failureResponse'
import jwt from 'jsonwebtoken'
import config from '../../config'
import models from '../models'
import { validateKind, validateCategory, validateModifyOrder } from '../lib/validateValue'
import { sendTeamEmail } from '../lib/sendEmail'
import redisClient from '../lib/redisClient'
import IApply from 'src/ts/IApply'

const BoardDB = models.board
const ApplyDB = models.apply
const TeamDB = models.team

export const GetList = async (req: Request, res: Response) => {
  try {
    let { searchText, offset, limit, order } = req.query
  
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
  
    const result = await BoardDB.GetList({ me }, { offset, limit, order, searchText })
    
    res.send(SuccessResponse(result))
  }
  catch (err) {
    console.log(err)
    res.status(500).send(InternalErrorResponse)
  }
}

export const GetListByKind = async (req: Request, res: Response) => {
  try {
    let { kind } = req.params
    let { offset, limit, order } = req.query
  
    kind = validateKind(kind) ? kind : 'study'
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
  
    const result = await BoardDB.GetList({ me, kind }, { offset, limit, order })

    res.send(SuccessResponse(result))
  }
  catch (err) {
    console.log(err)
    res.status(500).send(InternalErrorResponse)
  }
}

export const GetListByCategory = async (req: Request, res: Response) => {
  try {
    let { kind, category } = req.params
    let { offset, limit, order } = req.query
  
    kind = validateKind(kind) ? kind : 'study'
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
  
    const result = await BoardDB.GetList({ me, kind, category }, { offset, limit, order })
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
      return res.status(400).send(FailureResponse(INVALID_PARAM))
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
      return res.status(404).send(FailureResponse(NOT_FOUND))
    }
  
    await BoardDB.UpdateHit({ _id: id, diff: 1 })

    if (me) {
      isApplied = await ApplyDB.IsApplied({ accountId: me, boardId: id })
      isAccepted = await ApplyDB.IsAccepted({ accountId: me, boardId: id })
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
      positionTitle,
      positionDescription,
      positionCnt,
      wantCnt,
      endDate
    } = req.body

    const validatedKind = validateKind(kind)
    const validatedCategory = validateKind(category)

    if (
      !kind || !category || !topic || !title || !content || isNaN(wantCnt) || isNaN(Date.parse(endDate)) ||
      (positionTitle && !Array.isArray(positionTitle)) ||
      (positionDescription && !Array.isArray(positionDescription)) ||
      (positionCnt && !Array.isArray(positionCnt)) ||
      (
        positionTitle && positionDescription && positionCnt && 
        positionTitle.length === positionDescription.length &&
        positionDescription.length === positionCnt.length
      ) ||
      kind !== validatedKind ||
      category !== validatedCategory
    ) {
      return res.status(400).send(FailureResponse(INVALID_PARAM))
    }
  
    const countBoardByMe = await BoardDB.GetBoardCount({ accountId: me })
    if (countBoardByMe > 3) {
      return res.status(400).send(FailureResponse(EXCCED_LIMIT))
    }
  
    const result = await BoardDB.Create({
      accountId: me,
      kind,
      category,
      topic,
      title,
      content,
      positionTitle,
      positionDescription,
      positionCnt,
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
      positionTitle,
      positionDescription,
      positionCnt,
      wantCnt,
      endDate
    } = req.body

    const validatedKind = validateKind(kind)
    const validatedCategory = validateKind(category)
  
    if (
      (!id || id.length !== 24) ||
      !kind || !category || !topic || !title || !content || isNaN(wantCnt) || isNaN(Date.parse(endDate)) ||
      (positionTitle && !Array.isArray(positionTitle)) ||
      (positionDescription && !Array.isArray(positionDescription)) ||
      (positionCnt && !Array.isArray(positionCnt)) ||
      (
        positionTitle && positionDescription && positionCnt && 
        positionTitle.length === positionDescription.length &&
        positionDescription.length === positionCnt.length
      ) ||
      kind !== validatedKind ||
      category !== validatedCategory
    ) {
      return res.status(400).send(FailureResponse(INVALID_PARAM))
    }

    const result = await BoardDB.UpdateItem({
      _id: id,
      kind,
      category,
      topic,
      title,
      content,
      positionTitle,
      positionDescription,
      positionCnt,
      wantCnt,
      endDate
    })
    if (result.matchedCount === 0) {
      return res.status(404).send(NOT_FOUND)
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
      return res.status(400).send(FailureResponse(INVALID_PARAM))
    }
    
    await BoardDB.Delete({ _id: id, accountId: me })
  
    res.send(SuccessResponse())
  } catch (err) {
    res.status(500).send(InternalErrorResponse)
  }
}

export const CreateTeam = async (req: Request, res: Response) => {
  try {
    const { _id: me } = req.user
    const { id } = req.params
    let { kind } = req.body
    const { name, content, message } = req.body
  
    kind = validateKind(kind)
  
    if (
      (!id || id.length !== 24) ||
      !name ||
      !content ||
      !message
    ) {
      return res.status(400).send(FailureResponse(INVALID_PARAM))
    }
  
    const countTeamByMe = await BoardDB.GetTeamCount({ accountId: me })
    if (countTeamByMe > 2) {
      return res.status(400).send(FailureResponse(EXCCED_LIMIT))
    }
  
    const board = await BoardDB.GetItem({ _id: id })
    if (!board) {
      return res.status(404).send(FailureResponse(NOT_FOUND))
    }
  
    if (me !== board.accountId || board.isCompleted) {
      return res.status(400).send(FailureResponse(BAD_REQUEST))
    }
  
    await BoardDB.UpdateIsCompleted({ _id: id })

    const result = await ApplyDB.GetList({ author: me, active: true, boardId: id })
    const { list } = result

    await TeamDB.Create({ name, master: me, members: list, content })
    
    await redisClient.incCnt('teamCnt')
  
    sendTeamEmail(kind, board, message)
    
    res.send(SuccessResponse())
  }
  catch (err) {
    console.log(err)
    res.status(500).send(InternalErrorResponse)
  }
}