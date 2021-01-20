import { connection } from 'mongoose'
import { ObjectId } from 'mongodb'
import { BOARD } from './models'
import IBoard from '../ts/IBoard'

const boardColl = connection.collection(BOARD)

export default {
  Create: (params: any = {}) => {
    const {
      accountId,
      kind,
      category,
      topic,
      title,
      content,
      positionTitle,
      positionDescription,
      positionCnt,
      wantCnt,
      endDate,
    } = params

    const item: IBoard = {
      accountId,
      kind,
      category,
      topic,
      title,
      content,
      wantCnt,
      startDate: new Date(),
      endDate,
      active: true,
      hit: 0,
      updatedAt: new Date()
    }

    if (kind === 'contest') {
      item['position'] = {
        title: positionTitle,
        description: positionDescription,
        cnt: positionCnt
      }
    }

    return boardColl.insertOne(item)
  },
  GetListByMe: async (params: any = {}, options: any = {}) => {
    const { me } = params
    const { skip, limit, sort } = options

    const list = await Board.find({ accountId: new ObjectId(me) }, { skip, limit, sort }).toArray()
    const count = await Board.countDocuments({ accountId: new ObjectId(me) })

    return { list, count }
  },
  GetList: async (params: any = {}, options: any = {}) => {
    const { kind, category, me } = params
    const { skip, limit, sort, searchText } = options

    // 종료일을 지나지 않았거나, 종료일을 지났지만 내가 쓴 글
    const filter: any = { active: true, isCompleted: false }

    if (me) {
      filter['$or'] = [
        { accountId: new ObjectId(me) || null, endDay: { $lt: Date.now() } },
        { endDay: { $gt: Date.now() } }
      ]
    }
    else {
      filter['endDay'] = { $gt: Date.now() }
    }

    if (kind) filter['kind'] = kind
    if (category) filter['category'] = category
    if (searchText) filter['$text'] = { $search: searchText }

    const list = await Board.find(filter, { skip, limit, sort }).toArray()
    const count = await Board.countDocuments(filter)

    return { list, count }
  },
  GetItem: async (params: any = {}) => {
    const { _id } = params

    return Board.findOne({ _id: new ObjectId(_id) })
  },
  GetBoardCount: (params: any = {}) => {
    const { accountId } = params

    return Board.countDocuments({ accountId: new ObjectId(accountId), endDate: { $le: Date.now() } })
  },
  GetTeamCount: (params: any = {}) => {
    const { accountId } = params

    return Board.countDocuments({ accountId: new ObjectId(accountId), isCompleted: true })
  },
  UpdateItem: (params: any = {}) => {
    const {
      _id,
      accountId,
      kind,
      category,
      topic,
      title,
      content,
      positionTitle,
      positionDescription,
      positionCnt,
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

    if (kind === 'contest') {
      updateQuery['$set']['position'] = {
        title: positionTitle,
        description: positionDescription,
        cnt: positionCnt
      }
    }

    return boardColl.updateOne({ _id: new ObjectId(_id), acceptCnt: { $lte: 0 } }, updateQuery)
  },
  UpdateIsCompleted: (params: any = {}) => {
    const { _id } = params

    return boardColl.updateOne({ _id: new ObjectId(_id) }, { $set: { isCompleted: true, updatedAt: new Date() } })
  },
  UpdateApplyCnt: (params: any = {}) => {
    const { _id, diff } = params

    return Board.updateOne({ _id: new ObjectId(_id) }, { $inc: { applyCnt: diff }, $set: { updatedAt: Date.now() } })
  },
  UpdateAcceptCnt: (params: any = {}) => {
    const { _id, diff } = params

    return Board.updateOne({ _id: new ObjectId(_id) }, { $inc: { acceptCnt: diff }, $set: { updatedAt: Date.now() } })
  },
  UpdateHit: (params: any = {}) => {
    const { _id, diff } = params

    return Board.updateOne({ _id: new ObjectId(_id) }, { $inc: { hit: diff }, $set: { updatedAt: Date.now() } })
  },
  Delete: (params: any = {}) => {
    const { _id, accountId } = params

    return boardColl.updateOne(
      { _id: new ObjectId(_id), accountId: new ObjectId(accountId) },
      { $set: { active: false } }
    )
  },
}
