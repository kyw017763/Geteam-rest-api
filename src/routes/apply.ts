import express from 'express'
import { SuccessResponse, FailureResponse, InternalErrorResponse } from './../lib/responseForm'
import { validateKind } from '../lib/validateValue'
import redisClient from '../lib/redisClient'
import models from '../models'

const ApplyDB = models.apply
const BoardDB = models.board

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

    let result = await ApplyDB.GetList({
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

    let result = await ApplyDB.GetList({
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

    let result = await ApplyDB.GetList({
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

    let result = await ApplyDB.GetList({
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

    let result = await ApplyDB.GetList({
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

router.post('/', async (req, res) => {
  try {
    const me = req!.session!.passport.user.toString()
    let {
      authorAccountId,
      boardId,
      boardKind,
      applyAccountId,
      applyPosition, // only contest
      applyPortfolio, // only contest
      applyPortfolioText, // only contest
      wantedText,
    } = req.body
  
    if (me !== applyAccountId) {
      return res.status(400) // BAD_REQUEST
    }
  
    if (authorAccountId === me) {
      return res.status(400) // BAD_REQUEST
    }
  
    if (!boardKind || !validateKind(boardKind)) {
      return res.status(400) // INVALID_PARAM
    }
  
    if (!boardId || boardId.length !== 24) {
      return res.status(400) // INVALID_PARAM
    }
  
    if (boardKind === 'study' && (applyPosition || applyPortfolio || applyPortfolioText)) {
      return res.status(400) // INVALID_PARAM
    }
  
    wantedText = wantedText || ''
  
    const isApplied = await ApplyDB.IsApplied({
      accountId: me,
      boardId,
    })

    if (isApplied) {
      return res.status(400) // BAD_REQUEST
    }

    const contestObj: any = {}
    if (boardKind === 'contest') {
      contestObj['applyPosition'] = applyPosition
      contestObj['applyPortfolio'] = applyPortfolio
      contestObj['applyPortfolioText'] = applyPortfolioText
    }

    await ApplyDB.Create({
      accountId: me,
      boardId,
      boardKind,
      authorAccountId,
      wantedText,
      ...contestObj,
    })

    await BoardDB.UpdateApplyCnt({ _id: boardId, diff: 1 })

    await redisClient.incCnt('applyCnt')

    res.status(201) // TODO: Resopnse 처리. _id는 보내야함
  }
  catch {
    res.status(500).send(InternalErrorResponse)
  }
})

router.patch('/:id/accept', async (req, res) => {
  try {
    const me = req!.session!.passport.user.toString()
    const { id } = req.params
    const { applyAccountId } = req.body

    if (!id || id.length !== 24) {
      return res.status(400) // INVALID_PARAM
    }

    if (!applyAccountId || applyAccountId.length !== 24) {
      return res.status(400) // INVALID_PARAM
    }

    if (await ApplyDB.IsAccepted({ accountId: applyAccountId, boardId: id })) {
      return res.status(400) // BAD_REQUEST
    }

    await ApplyDB.UpdateApplyIsAccepted({
      accountId: applyAccountId,
      authorAccountId: me,
      boardId: id,
    })

    await BoardDB.UpdateAcceptCnt({ _id: id, diff: 1 })

    res.send(SuccessResponse({ _id: id }))
  }
  catch (err) {
    res.status(500).send(InternalErrorResponse)
  } 
})

router.delete('/:boardId/:applyId', async (req, res) => {
  try {
    const me = req!.session!.passport.user.toString()
    const { boardId, applyId } = req.params
    
    if (!boardId || boardId.length !== 24) {
      return res.status(400) // INVALID_PARAM
    }

    if (!applyId || applyId.length !== 24) {
      return res.status(400) // INVALID_PARAM
    }

    const boardDoc = await BoardDB.GetItem({ _id: boardId })
    const applyDoc = await ApplyDB.GetItem({ _id: applyId })

    if (boardDoc.endDate < Date.now()) {
      return res.status(400) // BAD_REQUEST
    }

    if (boardDoc.active === false) {
      return res.status(400) // BAD_REQUEST
    }

    if (applyDoc.isAccepted === true) {
      return res.status(400) // BAD_REQUEST
    }

    await ApplyDB.Delete({
      _id: applyId,
    })

    await BoardDB.UpdateApplyCnt({ _id: boardId, diff: -1 })

    res.send() // TODO: Resopnse 처리
  }
  catch (err) {
    res.status(500).send(InternalErrorResponse)
  }
})
