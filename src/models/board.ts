import { connection } from 'mongoose'
import { ObjectId } from 'mongodb'
import KIND_TYPE from '../lib/kindType'
import models from './models'
import Board from '../ts/Board'
import Position from '../ts/Position'
import Option from '../ts/Option'

const boardColl = connection.collection(models.BOARD)

export default {
  Create: (params: any = {}) => {
    const {
      author,
      kind,
      category,
      topic,
      title,
      content,
      positions,
      wantCnt,
      endDate,
    } = params

    const item: Board = {
      author: new ObjectId(author),
      kind,
      category,
      topic,
      title,
      content,
      positions: [],
      wantCnt,
      startDate: new Date(),
      endDate,
      active: true,
      hit: 0,
      updatedAt: new Date()
    }

    if (kind === KIND_TYPE.Contest) {
      positions.forEach((position: Position) => {
        if (position.title && position.description) item.positions.push(position)
      })
    }

    return boardColl.insertOne(item)
  },
  GetList: async (params: any = {}, options: Option = {}) => {
    const { kind, category, author } = params
    const { skip, limit, order, searchText } = options

    const filter: any = { active: true, isCompleted: false }

    if (author) { // 종료일을 지나지 않았거나, 종료일을 지났지만 내가 쓴 글
      filter.$or = [
        { author: new ObjectId(author), endDay: { $lte: new Date() } },
        { endDay: { $gte: new Date() } }
      ]
    }
    else filter.endDay = { $gte: new Date() }

    if (kind) filter.kind = kind
    if (category) filter.category = category
    if (searchText) filter.$text = { $search: searchText }

    const list = await boardColl.find(filter, { skip, limit, sort: order }).toArray()
    const count = await boardColl.countDocuments(filter)

    return { list, count }
  },
  GetItem: async (params: any = {}) => {
    const { _id } = params

    return boardColl.findOne({ _id: new ObjectId(_id) })
  },
  GetBoardCount: (params: any = {}) => {
    const { author } = params

    return boardColl.countDocuments({ author: new ObjectId(author), endDate: { $lte: new Date() } })
  },
  GetTeamCount: (params: any = {}) => {
    const { author } = params

    return boardColl.countDocuments({ author: new ObjectId(author), isCompleted: true })
  },
  UpdateItem: (params: any = {}) => {
    const {
      _id,
      author,
      kind,
      category,
      topic,
      title,
      content,
      positions,
      wantCnt,
      endDate,
    } = params

    const updateQuery: any = {
      $set: {
        kind,
        category,
        topic,
        title,
        content,
        wantCnt,
        endDate,
        updatedAt: new Date()
      }
    }

    if (kind === KIND_TYPE.Contest) {
      positions.forEach((position: Position) => {
        if (position.title && position.description) updateQuery.$set.positions.push(position)
      })
    }

    return boardColl.updateOne({ _id: new ObjectId(_id), author: new ObjectId(author), acceptCnt: { $lte: 0 } }, updateQuery)
  },
  UpdateIsCompleted: (params: any = {}) => {
    const { _id, author } = params

    return boardColl.updateOne({ _id: new ObjectId(_id), author: new ObjectId(author) }, { $set: { isCompleted: true, updatedAt: new Date() } })
  },
  UpdateApplicationCnt: (params: any = {}) => {
    const { _id, diff } = params

    return boardColl.updateOne({ _id: new ObjectId(_id) }, { $inc: { applicationCnt: diff }, $set: { updatedAt: new Date() } })
  },
  UpdateAcceptCnt: (params: any = {}) => {
    const { _id, diff } = params

    return boardColl.updateOne({ _id: new ObjectId(_id) }, { $inc: { acceptCnt: diff }, $set: { updatedAt: new Date() } })
  },
  UpdateHit: (params: any = {}) => {
    const { _id, diff } = params

    return boardColl.updateOne({ _id: new ObjectId(_id) }, { $inc: { hit: diff }, $set: { updatedAt: new Date() } })
  },
  Delete: (params: any = {}) => {
    const { _id, author } = params

    return boardColl.updateOne({ _id: new ObjectId(_id), author: new ObjectId(author) }, { $set: { active: false } })
  },
}
