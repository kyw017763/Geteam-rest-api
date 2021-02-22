import { connection } from 'mongoose'
import { ObjectId } from 'mongodb'
import models from './models'
import Option from '../ts/Option'
import {
  Create,
  GetList,
  IsApplied,
  IsAccepted,
  UpdateIsAccepted,
  Delete
} from '../ts/models/application'
import { ContestApplication } from '../ts/models/ApplicationModel'
import Filter from '../ts/models/application/Filter'

const applicationColl = connection.collection(models.APPLICATION)
const boardColl = connection.collection(models.BOARD)

export default {
  Create: (params: Create) => {
    const { applicant, author, boardId, wantedText, position, portfolio, portfolioText } = params

    const contestObj: ContestApplication = {}
    if (position) contestObj.position = position
    if (portfolio) contestObj.portfolio = portfolio
    if (portfolioText) contestObj.portfolioText = portfolioText

    return applicationColl.insertOne({
      applicant: new ObjectId(applicant),
      author: new ObjectId(author),
      boardId: new ObjectId(boardId),
      wantedText,
      ...contestObj,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  },

  GetList: async (params: GetList, options: Option = {}) => {
    const { applicant, kind, author, isAccepted, active, boardId } = params
    const { skip, limit, option } = options

    const filter: Filter = {}
    if (isAccepted) filter.isAccepted = isAccepted
    if (active) filter.active = active
    if (boardId) filter.boardId = new ObjectId(boardId)

    switch (option) {
      case 'applied':
        if (author) filter.author = new ObjectId(author)
        break
      case 'accepted': case 'unaccpeted':
        if (applicant) filter.applicant = new ObjectId(applicant)
        break
      default: break
    }

    if (kind && kind !== 'all') {
      let boardIds, listByKind
      if (filter.author) {
        listByKind = await boardColl.find({ author: new ObjectId(filter.author), kind }, { projection: { _id: true } }).toArray()
        filter.boardId = listByKind.map(board => new ObjectId(board._id))
      }
      if (filter.applicant) {
        boardIds = await applicationColl.find({ applicant: new ObjectId(filter.applicant) }, { projection: { boardId: true } }).toArray()
        listByKind = await boardColl.find({ _id: boardIds.map(board => new ObjectId(board._id)), kind }, { projection: { _id: true } }).toArray()
        filter.boardId = listByKind.map(board => new ObjectId(board._id))
      }
    }

    const list = await applicationColl.find(filter, { skip, limit, sort: { createdAt: -1 } }).toArray()
    const count = await applicationColl.countDocuments(filter)

    return { list, count }
  },
  IsApplied: async (params: IsApplied) => {
    const { applicant, boardId } = params

    return (await applicationColl.countDocuments({ applicant: new ObjectId(applicant), boardId: new ObjectId(boardId), active: true })) > 0
  },
  IsAccepted: async (params: IsAccepted) => {
    const { applicant, boardId } = params

    return (await applicationColl.countDocuments({ applicant: new ObjectId(applicant), boardId: new ObjectId(boardId), isAccepted: true })) > 0
  },

  UpdateIsAccepted: (params: UpdateIsAccepted) => {
    const { _id, boardId, author } = params
    
    return applicationColl.updateOne(
      { _id: new ObjectId(_id), boardId: new ObjectId(boardId), author: new ObjectId(author) },
      { $set: { isAccepted: true, updatedAt: new Date() }
    })
  },

  Delete: async (params: Delete) => {
    const { _id, boardId, author } = params

    const boardCount = (await boardColl.countDocuments({ _id: new ObjectId(boardId), author: new ObjectId(author), $or: [{ endDate: { $lte: new Date() } }, { active: true }]})) > 0
    const applicationCount = (await applicationColl.countDocuments({ _id: new ObjectId(_id), boardId: new ObjectId(boardId) })) > 0
    if (boardCount || applicationCount) return false
    
    return await applicationColl.updateOne({ _id: new ObjectId(_id) }, { $set: { active: false } })
  }
}
