import express from 'express'
import { SuccessResponse, FailureResponse, InternalErrorResponse } from './../lib/responseForm'
import models from '../models'
import { validateKind, validateCategory, validateModifyOrder } from '../lib/validateValue'
import { sendTeamEmail } from 'src/lib/sendEmail'
import redisClient from '../lib/redisClient'
import IApply from 'src/ts/IApply'

const BoardDB = models.board
const ApplyDB = models.apply
const TeamDB = models.team

const router = express.Router()
export default router

router.get('/boards', async (req, res) => {
  try {
    const me = req!.session!.passport.user.toString()
    let { offset, limit, order } = req.query

    offset = isNaN(offset) ? 0 : offset
    limit = isNaN(limit) ? 12 : limit
    order = validateModifyOrder(order)

    const result = await BoardDB.GetList({ me }, { offset, limit, order })
    res.send(SuccessResponse(result))
  }
  catch (err) {
    res.status(500).send(InternalErrorResponse)
  }
})

// in my page
router.get('/boards/me', async (req, res) => {
  try {
    const me = req!.session!.passport.user.toString()
    let { offset, limit, order } = req.query

    offset = isNaN(offset) ? 0 : offset
    limit = isNaN(limit) ? 12 : limit
    order = validateModifyOrder(order)

    const result = await BoardDB.GetListByMe({ me }, { offset, limit, order })
    res.send(SuccessResponse(result))
  }
  catch (err) {
    res.status(500).send(InternalErrorResponse)
  }
})

router.get('/boards/:kind', async (req, res) => {
  try {
    const me = req!.session!.passport.user.toString()
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
    res.status(500).send(InternalErrorResponse)
  }
})

router.get('/boards/:kind/:category', async (req, res) => {
  try {
    const me = req!.session!.passport.user.toString()
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
    res.status(500).send(InternalErrorResponse)
  }
})

router.get('/board/:id', async (req, res) => {
  try {
    const me = req!.session!.passport.user.toString()
    const { id } = req.params

    if (!id || id.length !== 24) {
      return res.status(400) // INVALID_PARAM
    }
    
    const result = await BoardDB.GetItem({ _id: id })

    if (!result) {
      return res.status(404) // NOT_FOUND
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
    res.status(500).send(InternalErrorResponse)
  }
})

router.post('/board/:kind/:category', async (req, res, next) => {
  try {
    const me = req!.session!.passport.user.toString()
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
      return res.status(400) // BAD_REQUEST
    }

    await BoardDB.Create({
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

    await redisClient.incCnt('listCnt')

    res.status(201) // Response 하기
  } catch (err) {
    res.status(500).send(InternalErrorResponse)
  }
})

router.patch('/board/:id', async (req, res) => {
  try {
    const me = req!.session!.passport.user.toString()
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
      return res.status(400) // INVALID_PARAM
    }

    if (me !== modifyAuthor) {
      throw new Error('옳지 않은 권한입니다!')
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

    res.send() // Response 하기
  } catch (err) {
    res.status(500).send(InternalErrorResponse)
  }
})

router.delete('/board/:id', async (req, res) => {
  try {
    const me = req!.session!.passport.user.toString()
    const { id } = req.params
    
    await BoardDB.Delete({ _id: id, accountId: me })

    res.send()
  } catch (err) {
    res.status(500).send(InternalErrorResponse)
  }
})

router.post('/:id/team', async (req, res) => {
  try {
    const me = req!.session!.passport.user.toString()
    const { id } = req.params
    const { kind } = req.query
    const { teamName, teamMessage } = req.body

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

    let members = await ApplyDB.GetList({
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
      members,
    })

    await redisClient.incCnt('teamCnt')

    sendTeamEmail(kind, board, teamMessage)
  }
  catch (err) {
    res.status(500).send(InternalErrorResponse)
  }
})
