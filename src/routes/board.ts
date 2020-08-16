import express from 'express'
import { SuccessResponse, FailureResponse, InternalErrorResponse } from './../lib/responseForm'
import { validateKind, validateCategory, validateModifyOrder } from '../lib/validateValue'
import redisClient from '../lib/redisClient'
import models from '../models'

const BoardDB = models.board
const ApplyDB = models.apply

const router = express.Router()
export default router

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
    res.status(SuccessResponse(result))
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
    res.status(SuccessResponse(result))
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
    const isAccepted = await ApplyDB.IsApplied({ accountId: me, boardId: id })
    
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

router.post('/board/:kind', async (req, res, next) => {
  try {
    const { kind } = req.params
    let result = null

    validateKind(kind)

    if (req!.session!.passport.user.toString() !== req.body.writeMem) {
      throw new Error('옳지 않은 권한입니다!')
    }

    validateCategory(kind, req.body.writeKind)

    const { writeMem, writeKind, writeTopic, writeTitle, writeContent, writeWantNum, writeEndDay } = req.body

    if (kind === 'study') {
      result = await models.Study.create({
          kind: writeKind,
          account: writeMem,
          topic: writeTopic,
          title: writeTitle,
          content: writeContent,
          wantNum: writeWantNum,
          endDay: writeEndDay,
        })
        .then((result) => {
          return result._id
        })
      
      await models.Account.findByIdAndUpdate(writeMem, { $inc: { listNum: 1 } }, { new: true })
        .then((result) => {
          if (!result) {
            throw new Error()
          }
        })
    } else if (kind === 'contest') {
      const { writePart } = req.body
      const tempPartArr = writePart.split(',').map((item: string) => item.trim())
      const partObj = {
        name: tempPartArr,
        num: tempPartArr.length,
      }

      result = await models.Contest.create({
          kind: writeKind,
          account: writeMem,
          topic: writeTopic,
          part: partObj,
          title: writeTitle,
          content: writeContent,
          wantNum: writeWantNum,
          endDay: writeEndDay,
        })
        .then((result) => {
          return result._id
        })

      await models.Account.findByIdAndUpdate(writeMem, { $inc: { listNum: 1 } }, { new: true})
        .then((result) => {
          if (!result) {
            throw new Error()
          }
        })
    }

    await redisClient.incCnt('listCnt')

    res.status(201).json(responseForm(true, '', result))
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()))
  }
})

router.patch('/board/:kind/:id', async (req, res, next) => {
  try {
    const { kind, id } = req.params
    let result = null

    validateKind(kind)

    if (req!.session!.passport.user.toString() !== req.body.modifyAuthor) {
      throw new Error('옳지 않은 권한입니다!')
    }

    const { modifyCategory, modifyWantNum, modifyEndDay, modifyTopic, modifyTitle, modifyContent } = req.body
    
    const updateObj = { 
      $set: 
      {
        kind: modifyCategory,
        topic: modifyTopic,
        title: modifyTitle,
        content: modifyContent,
        wantNum: modifyWantNum,
        endDay: modifyEndDay,
      }
    }

    if (kind === 'study') {
      result = await models.Study.findByIdAndUpdate(id, updateObj, { new: true })
      .then((result) => {
        return result ? result._id : result 
      })
    } else if (kind === 'contest') {
      result = await models.Contest.findByIdAndUpdate(id, updateObj, { new: true })
        .then((result) => {
          return result ? result._id : result
        })
    }

    res.json(responseForm(true, '', result))
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()))
  }
})

router.delete('/board/:kind/:id', async (req, res, next) => {
  try {
    const { kind, id } = req.params
    let result = null

    validateKind(kind)

    if (req!.session!.passport.user.toString() !== req.body.writeMem) {
      throw new Error('옳지 않은 권한입니다!')
    }

    if (kind === 'study') {
      result = await models.Study.findByIdAndUpdate(id, { active: false }, { new: true })
        .then((result) => {
          if (result) {
            return true
          }
          throw new Error()
        })
      
      await models.Account.findByIdAndUpdate(req.body.writeMem, { $inc: { listNum: -1 } })
    } else if (kind === 'contest') {
      result = await models.Contest.findByIdAndUpdate(id, { active: false }, { new: true })
        .then((result) => {
          if (result) {
            return true
          }
          throw new Error()
        })
      
      await models.Account.findByIdAndUpdate(req.body.writeMem, { $inc: { listNum: -1 } })
    }
    
    res.json(responseForm(true, '', result))
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()))
  }
})

router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { kind } = req.query
    const { teamMessage } = req.body
  
    await redisClient.incCnt('teamCnt')

    sendTeamEmail(kind, result, teamMessage)
  }
  catch (err) {
    res.status(500).send(InternalErrorResponse)
  }
})

router.patch('/team/:kind/:id', async (req, res, next) => {
  try {
    if (kind === 'study') {
      result = await models.Study.findById(id)
        .populate({
          path: 'account',
          select: ['name']
        })
        .exec()
        .then((result) => {
          if (result) {
            return result
          }
          throw new Error()
        })
    } else if (kind === 'contest') {
      result = await models.Contest.findById(id)
        .populate({
          path: 'account',
          select: ['name']
        })
        .exec()
        .then((result) => {
          if (result) {
            return result
          }
          throw new Error()
        })
    }

    if (!result) {
      throw new Error()
    }

    if (req!.session!.passport.user.toString() !== result!._id) {
      throw new Error('옳지 않은 권한입니다!')
    }

    if (result!.teamChk) {
      throw new Error('이미 팀 모집이 완료된 글입니다!')
    }

    result!.teamChk = true
    result!.save()
})

// TODO: isCompleted: true 로 만드는 end-point 하나