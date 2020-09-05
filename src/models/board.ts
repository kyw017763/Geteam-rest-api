import { connection } from 'mongoose'
import { ObjectId } from 'mongodb'
import { BOARD } from './models'
import IBoard from '../ts/IBoard'

const Board = connection.collection(BOARD)

export default {
  Create: async (params: any = {}) => {
    const {
      accountId,
      kind,
      category,
      topic,
      title,
      content,
      position,
      wantCnt,
      endDate,
    } = params

    return Board.insertOne({
      accountId: new ObjectId(accountId),
      kind,
      category,
      topic,
      title,
      content,
      position,
      wantCnt,
      applyCnt: 0,
      acceptCnt: 0,
      startDate: Date.now(),
      endDate,
      isCompleted: false,
      active: true,
      hit: 0,
      updatedAt: Date.now(),
    })
  },
  GetListByMe: async (params: any = {}, options: any = {}) => {
    const { me } = params
    const { skip, limit, sort } = options

    const list = await Board.find({
      accountId: new ObjectId(me)
    }, {
      skip,
      limit,
      sort
    }).toArray()
    const count = await Board.countDocuments({
      accountId: new ObjectId(me)
    })

    return { list, count }
  },
  GetList: async (params: any = {}, options: any = {}) => {
    const { kind, category, me } = params
    const { skip, limit, sort } = options

    // 종료일을 지나지 않았거나, 종료일을 지났지만 내가 쓴 글
    const query: any = {
      active: true,
      isCompleted: false,
    }

    if (me) {
      query['$or'] = [
        {
          accountId: new ObjectId(me) || null,
          endDay: { $lt: Date.now() }
        },
        {
          endDay: { $gt: Date.now() }
        }
      ]
    }
    else {
      query['endDay'] = { $gt: Date.now() }
    }

    if (kind) {
      query['kind'] = kind
    }

    if (category) {
      query['category'] = category
    }

    const list = await Board.find(query, {
      skip,
      limit,
      sort
    }).toArray()
    const count = await Board.countDocuments(query)

    return { list, count }
  },
  GetItem: async (params: any = {}) => {
    const { _id } = params
    return Board.findOne({ _id: new ObjectId(_id) })
  },
  IsEnableModify: async (params: any = {}) => {
    const { _id } = params
    const board = await Board.findOne({ _id: new ObjectId(_id) })
    return board.applyCnt === 0
  },
  IsEnableApply: async (params: any = {}) => {
    const { _id } = params
    const board = await Board.findOne({ _id: new ObjectId(_id) })
    return !board.isCompleted
  },
  UpdateItem: (params: any = {}) => {
    const {
      _id,
      category,
      topic,
      title,
      content,
      position,
      wantCnt,
      endDate,
    } = params

    return Board.updateOne({
      _id: new ObjectId(_id)
    }, {
      $set: {
        category,
        topic,
        title,
        content,
        position,
        wantCnt,
        endDate,
        updatedAt: Date.now()
      }
    })
  },
  UpdateIsCompleted: (params: any = {}) => {
    const { _id } = params
    return Board.updateOne({
      _id: new ObjectId(_id)
    }, {
      $set: {
        isCompleted: true,
        updatedAt: Date.now()
      }
    })
  },
  UpdateApplyCnt: (params: any = {}) => {
    const { _id, diff } = params
    return Board.updateOne({
      _id: new ObjectId(_id)
    }, {
      $set: {
        $inc: { applyCnt: diff },
        updatedAt: Date.now()
      }
    })
  },
  UpdateAcceptCnt: (params: any = {}) => {
    const { _id, diff } = params
    return Board.updateOne({
      _id: new ObjectId(_id)
    }, {
      $set: {
        $inc: { acceptCnt: diff },
        updatedAt: Date.now()
      }
    })
  },
  UpdateHit: (params: any = {}) => {
    const { _id, diff } = params
    return Board.updateOne({
      _id: new ObjectId(_id)
    }, {
      $set: {
        $inc: { hit: diff },
        updatedAt: Date.now()
      }
    })
  },
  Delete: (params: any = {}) => {
    const { _id, accountId } = params
    return Board.updateOne({
      _id: new ObjectId(_id),
      accountId: new ObjectId(accountId)
    }, {
      $set: {
        active: false,
      }
    })
  },
}
