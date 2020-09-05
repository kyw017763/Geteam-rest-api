import { Request, Response } from 'express'
import { SuccessResponse, FailureResponse, InternalErrorResponse } from './../lib/responseForm'
import { INVALID_PARAM, NOT_FOUND, BAD_REQUEST } from '../lib/failureResponse'
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
      const { _id: me } = req!.session!.passport.user
      let { offset, limit, order } = req.query
  
      offset = isNaN(offset) ? 0 : offset
      limit = isNaN(limit) ? 12 : limit
      order = validateModifyOrder(order)
  
      const result = await BoardDB.GetList({ me }, { offset, limit, order })
      res.send(SuccessResponse(result))
    }
    catch (err) {
      console.log(err)
      res.status(500).send(InternalErrorResponse)
    }
}

export const GetListByMe = async (req: Request, res: Response) => {
    try {
      const { _id: me } = req!.session!.passport.user
      let { offset, limit, order } = req.query
  
      offset = isNaN(offset) ? 0 : offset
      limit = isNaN(limit) ? 12 : limit
      order = validateModifyOrder(order)
  
      const result = await BoardDB.GetListByMe({ me }, { offset, limit, order })
      res.send(SuccessResponse(result))
    }
    catch (err) {
      console.log(err)
      res.status(500).send(InternalErrorResponse)
    }
}

export const GetListByKind = async (req: Request, res: Response) => {
    try {
      const { _id: me } = req!.session!.passport.user
      let { kind } = req.params
      let { offset, limit, order } = req.query
  
      kind = validateKind(kind) ? kind : 'study'
      offset = isNaN(offset) ? 0 : offset
      limit = isNaN(limit) ? 12 : limit
      order = validateModifyOrder(order)
  
      const result = await BoardDB.GetList({ kind, me }, { offset, limit, order })
      res.send(SuccessResponse(result))
    }
    catch (err) {
      console.log(err)
      res.status(500).send(InternalErrorResponse)
    }
}

export const GetListByCategory = async (req: Request, res: Response) => {
    try {
      const { _id: me } = req!.session!.passport.user
      let { kind, category } = req.params
      let { offset, limit, order } = req.query
  
      kind = validateKind(kind) ? kind : 'study'
      category = validateCategory(kind, category) ? category : 'develop'
      offset = isNaN(offset) ? 0 : offset
      limit = isNaN(limit) ? 12 : limit
      order = validateModifyOrder(order)
  
      const result = await BoardDB.GetList({ kind, category, me }, { offset, limit, order })
      res.send(SuccessResponse(result))
    }
    catch (err) {
      console.log(err)
      res.status(500).send(InternalErrorResponse)
    }
}

export const GetItem = async (req: Request, res: Response) => {
    try {
      const { _id: me } = req!.session!.passport.user
      const { id } = req.params
  
      if (!id || id.length !== 24) {
        return res.status(400).send(FailureResponse(INVALID_PARAM))
      }
      
      const result = await BoardDB.GetItem({ _id: id })
  
      if (!result) {
        return res.status(404).send(FailureResponse(NOT_FOUND))
      }
  
      await BoardDB.UpdateHit({ _id: id, diff: 1 })
  
      const isApplied = await ApplyDB.IsApplied({ accountId: me, boardId: id })
      const isAccepted = await ApplyDB.IsAccepted({ accountId: me, boardId: id })
      
      const data = {
        board: result,
        isApplied, // if applier
        isAccepted, // if applier
        isEnableModify: result.applyCnt === 0, // if author
        isEnableApply: !result.isCompleted, // if applier
      }
  
      res.send(SuccessResponse(data))
    } catch (err) {
      console.log(err)
      res.status(500).send(InternalErrorResponse)
    }
}

export const Create = async (req: Request, res: Response) => {
    try {
      const { _id: me } = req!.session!.passport.user
      let { kind, category } = req.params
      const {
        writeAccountId,
        writeTopic,
        writeTitle,
        writeContent,
        writePosition,
        writeWantCnt,
        writeEndDate
      } = req.body
  
      kind = validateKind(kind) ? kind : 'study'
      category = validateKind(category) ? category : 'develop'
  
      if (me !== writeAccountId) {
        return res.status(400).send(FailureResponse(BAD_REQUEST))
      }
  
      const result = await BoardDB.Create({
        accountId: me,
        kind,
        category,
        topic: writeTopic,
        title: writeTitle,
        content: writeContent,
        position: writePosition,
        wantCnt: writeWantCnt,
        endDate: new Date(writeEndDate).getTime(),
      })
  
      if (!result || !result.insertedId) {
        throw new Error()
      }
  
      await redisClient.incCnt('listCnt')
  
      res.status(201).send(SuccessResponse(result.insertedId))
    } catch (err) {
      res.status(500).send(InternalErrorResponse)
    }
}

export const Update = async (req: Request, res: Response) => {
    try {
      const { _id: me } = req!.session!.passport.user
      const { id } = req.params
      const {
        modifyAuthor,
        modifyCategory,
        modifyTopic,
        modifyTitle,
        modifyContent,
        modifyPosition,
        modifyWantCnt,
        modifyEndDate,
      } = req.body
  
      if (!id || id.length !== 24) {
        return res.status(400).send(FailureResponse(INVALID_PARAM))
      }
  
      if (me !== modifyAuthor) {
        return res.status(400).send(FailureResponse(BAD_REQUEST))
      }
  
      await BoardDB.UpdateItem({
        _id: id,
        category: modifyCategory,
        topic: modifyTopic,
        title: modifyTitle,
        content: modifyContent,
        position: modifyPosition,
        wantCnt: modifyWantCnt,
        endDate: new Date(modifyEndDate).getTime(),
      })
  
      res.end()
    } catch (err) {
      res.status(500).send(InternalErrorResponse)
    }
}

export const Delete = async (req: Request, res: Response) => {
    try {
      const { _id: me } = req!.session!.passport.user
      const { id } = req.params
  
      if (!id || id.length !== 24) {
        return res.status(400).send(FailureResponse(INVALID_PARAM))
      }
      
      await BoardDB.Delete({ _id: id, accountId: me })
  
      res.send()
    } catch (err) {
      res.status(500).send(InternalErrorResponse)
    }
}

export const CreateTeam = async (req: Request, res: Response) => {
    try {
      const { _id: me } = req!.session!.passport.user
      const { id } = req.params
      let { kind } = req.query
      const { teamName, teamMessage } = req.body
  
      kind = validateKind(kind) ? kind : 'develop'
  
      if (!id || id.length !== 24) {
        return res.status(400).send(FailureResponse(INVALID_PARAM))
      }
  
      if (!teamName || !teamName) {
        return res.status(400).send(FailureResponse(INVALID_PARAM))
      }
  
      const board = await BoardDB.GetItem({ _id: id })
  
      if (!board) {
        return res.status(400) // NOT_FOUND
      }
  
      if (me !== board.accountId) {
        return res.status(400) // BAD_REQUEST
      }
  
      if (board.isCompleted) {
        res.status(400) // BAD_REQUEST
      }
  
      await BoardDB.UpdateIsCompleted({ _id: id })
  
      let { list: members, count } = await ApplyDB.GetList({
        authorAccountId: me,
        boardId: id,
        active: true,
      })
  
      members = members.map((elem: IApply) => {
        return { accountId: elem.accountId, position: elem.position }
      })
      
      await TeamDB.Create({
        name: teamName,
        master: me,
        list: members,
        count
      })
  
      await redisClient.incCnt('teamCnt')
  
      sendTeamEmail(kind, board, teamMessage)
    }
    catch (err) {
      console.log(err)
      res.status(500).send(InternalErrorResponse)
    }
}