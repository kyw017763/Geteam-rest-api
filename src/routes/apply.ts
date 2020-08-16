import express from 'express'
import { SuccessResponse, FailureResponse, InternalErrorResponse } from './../lib/responseForm'
import { sendTeamEmail } from './../lib/sendEmail'
import { validateKind, validateCategory } from '../lib/validateValue'
import redisClient from '../lib/redisClient'
import models from '../models'

const ApplyDB = models.apply

const router = express.Router()
export default router

// my all apply by kind
router.get('/', async (req, res) => {
  try {
    const me = req!.session!.passport.user.toString()
    let { kind, offset, limit } = req.query

    kind = validateKind(kind) ? kind : 'study'
    offset = isNaN(offset) ? 0 : offset
    limit = isNaN(limit) ? 12 : limit

    let result = await ApplyDB.GetApplyList({
      accountId: me,
      boardKind: kind,
    }, {
      skip: offset * limit,
      limit,
    })

    if (result!.length === 0) {
      return res.status(204) // EMPTY_RESULT
    }

    res.send(SuccessResponse(result))
  }
  catch {
    res.status(500).send(InternalErrorResponse)
  }
})

// all apply on my all board
router.get('/applied', async (req, res) => {
  try {
    const me = req!.session!.passport.user.toString()
    let { kind, offset, limit } = req.query

    kind = validateKind(kind) ? kind : 'study'
    offset = isNaN(offset) ? 0 : offset
    limit = isNaN(limit) ? 12 : limit

    let result = await ApplyDB.GetApplyList({
      authorAccountId: me,
      boardKind: kind,
    }, {
      skip: offset * limit,
      limit,
    })

    if (result.length === 0) {
      return res.status(204) // EMPTY_RESULT
    }

    res.send(SuccessResponse(result))
  }
  catch {
    res.status(500).send(InternalErrorResponse)
  }
})

// my accepted apply by kind
router.get('/accepted', async (req, res) => {
  try {
    const me = req!.session!.passport.user.toString()
    let { kind, offset, limit } = req.query

    kind = validateKind(kind) ? kind : 'study'
    offset = isNaN(offset) ? 0 : offset
    limit = isNaN(limit) ? 12 : limit

    let result = await ApplyDB.GetApplyList({
      accountId: me,
      isAccepted: true,
      boardKind: kind,
    }, {
      skip: offset * limit,
      limit,
    })

    if (result.length === 0) {
      return res.status(204) // EMPTY_RESULT
    }

    res.send(SuccessResponse(result))
  }
  catch {
    res.status(500).send(InternalErrorResponse)
  }
})

// my unaccepted apply by kind
router.get('/unaccpeted', async (req, res) => {
  try {
    const me = req!.session!.passport.user.toString()
    let { kind, offset, limit } = req.query

    kind = validateKind(kind) ? kind : 'study'
    offset = isNaN(offset) ? 0 : offset
    limit = isNaN(limit) ? 12 : limit

    let result = await ApplyDB.GetApplyList({
      accountId: me,
      isAccepted: false,
      boardKind: kind,
    }, {
      skip: offset * limit,
      limit,
    })

    if (result.length === 0) {
      return res.status(204) // EMPTY_RESULT
    }

    res.send(SuccessResponse(result))
  }
  catch {
    res.status(500).send(InternalErrorResponse)
  }
})

// apply on my particular board
router.get('/:id', async (req, res) => {
  try {
    const me = req!.session!.passport.user.toString()
    let { id } = req.query

    if (!id || id.length !== 24) {
      return res.status(400) // INVALID_PARAM
    }

    let result = await ApplyDB.GetApplyList({
      authorAccountId: me,
      boardId: id,
      active: true,
    })

    if (result.length === 0) {
      return res.status(204) // EMPTY_RESULT
    }

    res.send(SuccessResponse(result))
  }
  catch {
    res.status(500).send(InternalErrorResponse)
  }
})


router.post('/:kind', async (req, res, next) => {
  try {
    const { kind } = req.params
    const { applyKind, applyItem, applyAccount, recvAccount, applyPortfolio, applyWant } = req.body
    let cnt = null
    let result = null

    if (req!.session!.passport.user.toString() !== applyAccount) {
      throw new Error('옳지 않은 권한입니다!')
    }

    validateKind(kind)
    validateCategory(kind, applyKind)

    if (kind === 'study') {
      cnt = await models.StudyApply.countDocuments({ item: applyItem, applyAccount }).exec()
    } else if (kind === 'contest') {
      cnt = await models.ContestApply.countDocuments({ item: applyItem, applyAccount }).exec()
    }

    if (cnt! > 0 || !cnt) {
      throw new Error('한 게시글에 한 번 이상 신청할 수 없습니다')
    }

    if (kind === 'study') {
      result = await models.StudyApply.create({
          kind: applyKind,
          item: applyItem,
          applyAccount,
          recvAccount,
          portfolio: applyPortfolio,
          want: applyWant,
        })
        .then((result) => {
          return result.item
        })

      await models.Study.findByIdAndUpdate(result, {
        $inc: { applyNum: 1 }
      })
    } else if (kind === 'contest') {
      const { applyPart } = req.body
      result = await models.ContestApply.create({
          kind: applyKind,
          item: applyItem,
          part: applyPart,
          applyAccount,
          recvAccount,
          portfolio: applyPortfolio,
          want: applyWant,
        })
        .then((result) => {
          return result.item
        })

      await models.Contest.findByIdAndUpdate(result, {
        $inc: { applyNum: 1 }
      }, { new: true })
        .then((result) => {
          if (!result) {
            throw new Error()
          }
        })
    }

    await redisClient.incCnt('applyCnt')

    res.status(201).json(responseForm(true, '', result))
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()))
  }
})

router.patch('/:kind/:id', async (req, res, next) => {
  // accept
  try {
    const { kind, id } = req.params
    let applyDocument = null
    let boardDocument = null

    validateKind(kind)

    if (kind === 'study') {
      applyDocument = await models.StudyApply.findById(id)
    } else if (kind === 'contest') {
      applyDocument = await models.ContestApply.findById(id)
    }

    if (req!.session!.passport.user.toString() !== applyDocument!.recvAccount.toString()) {
      throw new Error('옳지 않은 권한입니다!')
    }

    applyDocument!.accept = true
    applyDocument?.save()

    if (kind === 'study') {
      boardDocument = await models.Study.findByIdAndUpdate(applyDocument!.item, {
          $inc: { acceptNum: 1 }
        }, { new: true })
        .then((result) => {
          if (!result) {
            throw new Error()
          }
          return result
        })
    } else if (kind === 'contest') {
      boardDocument = await models.Contest.findByIdAndUpdate(applyDocument!.item, {
          $inc: { acceptNum: 1 }
        }, { new: true })
        .then((result) => {
          if (!result) {
            throw new Error()
          }
          return result
        })
    }

    res.json(responseForm(true, '', boardDocument!._id))
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()))
  }
})

router.delete('/:kind/:id', async (req, res, next) => {
  try {
    const { kind, id } = req.params
    let applyDocument = null
    let boardDocument = null

    validateKind(kind)

    if (kind === 'study') {
      applyDocument = await models.StudyApply.findById(id)
    } else if (kind === 'contest') {
      applyDocument = await models.ContestApply.findById(id)
    }

    if (req!.session!.passport.user.toString() !== applyDocument?.applyAccount.toString()) {
      throw new Error('옳지 않은 권한입니다!')
    }

    if (applyDocument!.accept === true) {
      throw new Error('이미 수락된 신청은 취소할 수 없습니다')
    }

    if (kind === 'study') {
      boardDocument = await models.Study.findByIdAndUpdate(applyDocument!.item, {
          $inc: { applyNum: -1 }
        }, { new: true })
        .then((result) => {
          if (!result) {
            throw new Error()
          }
          return result
        })
    } else if (kind === 'contest') {
      boardDocument = await models.Contest.findByIdAndUpdate(applyDocument!.item, {
          $inc: { applyNum: -1 }
        }, { new: true })
        .then((result) => {
          if (!result) {
            throw new Error()
          }
          return result
        })
    }

    if (boardDocument!.endDay < new Date()) {
      throw new Error('신청기간이 지난 글의 신청을 취소할 수 없습니다')
    }

    if (boardDocument!.active === false) {
      throw new Error('삭제된 글의 신청을 취소할 수 없습니다')
    }

    applyDocument!.active = false
    applyDocument?.save()

    res.json(responseForm(true, '', boardDocument!._id))
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()))
  }
})

router.patch('/team/:kind/:id', async (req, res, next) => {
  try {
    const { kind, id } = req.params
    const { teamContent } = req.body
    let result = null

    validateKind(kind)

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

    sendTeamEmail(kind, result, teamContent)

    await redisClient.incCnt('teamCnt')

    res.status(200).json(responseForm(true, '', result))
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()))
  }
})