import { connection } from 'mongoose'
import { ObjectId } from 'mongodb'
import models from './models'
import { IOption } from '../ts/common'

const applyColl = connection.collection(models.APPLY)
const boardColl = connection.collection(models.BOARD)

export default {
  Create: (params: any = {}) => {
    const { accountId, author, boardId, wantedText, position, portfolio, portfolioText } = params

    const contestObj: any = {}
    if (position) contestObj.position = position
    if (portfolio) contestObj.portfolio = portfolio
    if (portfolioText) contestObj.portfolioText = portfolioText

    return applyColl.insertOne({
      accountId,
      author,
      boardId,
      wantedText,
      ...contestObj,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  },

  GetList: async (params: any = {}, options: IOption = {}) => {
    const { accountId, kind, author, isAccepted, active, boardId } = params
    const { skip, limit, option } = options

    const filter: any = {}
    if (isAccepted) filter.isAccepted = isAccepted
    if (active) filter.active = active
    if (boardId) filter.boardId = new ObjectId(boardId)

    switch (option) {
      case 'applied':
        if (author) filter.author = new ObjectId(author)
        break
      case 'accepted': case 'unaccpeted':
        if (accountId) filter.accountId = new ObjectId(accountId)
        break
      default: break
    }

    if (kind && kind !== 'all') {
      let boardIds, listByKind
      if (filter.author) {
        listByKind = await boardColl.find({ accountId: filter.author, kind }, { projection: { _id: true } }).toArray()
        filter.boardId = listByKind.map(board => new ObjectId(board._id))
      }
      if (filter.accountId) {
        boardIds = await applyColl.find({ accountId: filter.accountId }, { projection: { boardId: true } }).toArray()
        listByKind = await boardColl.find({ _id: boardIds.map(board => new ObjectId(board._id)), kind }, { projection: { _id: true } }).toArray()
        filter.boardId = listByKind.map(board => new ObjectId(board._id))
      }
    }

    const list = await applyColl.find(filter, { skip, limit, sort: { createdAt: -1 } }).toArray()
    const count = await applyColl.countDocuments(filter)

    return { list, count }
  },
  IsApplied: async (params: any = {}) => {
    const { accountId, boardId } = params

    return (await applyColl.countDocuments({ accountId: new ObjectId(accountId), boardId: new ObjectId(boardId), active: true })) > 0
  },
  IsAccepted: async (params: any = {}) => {
    const { _id, boardId } = params

    return (await applyColl.countDocuments({ _id: new ObjectId(_id), boardId: new ObjectId(boardId), isAccepted: true })) > 0
  },

  UpdateIsAccepted: (params: any = {}) => {
    const { _id, boardId, author } = params
    
    return applyColl.updateOne(
      { _id: new ObjectId(_id), boardId: new ObjectId(boardId), author: new ObjectId(author) },
      { $set: { isAccepted: true, updatedAt: new Date() }
    })
  },

  Delete: async (params: any = {}) => {
    const { _id, boardId } = params

    const boardCount = (await boardColl.countDocuments({ _id: new ObjectId(boardId), $or: [{ endDate: { $lte: new Date() } }, { active: true }]})) > 0
    const applyCount = (await applyColl.countDocuments({ _id: new ObjectId(_id), boardId: new ObjectId(boardId), $or: [{ isAccepted: true }, { active: false }] })) > 0
    if (boardCount || applyCount) return false
    
    return await applyColl.updateOne({ _id: new ObjectId(_id) }, { $set: { active: false } })
  }
}
