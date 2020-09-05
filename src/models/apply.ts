import { connection } from 'mongoose'
import { ObjectId } from 'mongodb'
import { APPLY } from './models'
import IApply from '../ts/IApply'
import { IOption } from '../ts/common';

const Apply = connection.collection(APPLY)

export default {
  Create: (params: any = {}) => {
    return Apply.insertOne({
      ...params,
      
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  },
  GetList: async (params: any = {}, options: IOption = {}) => {
    const {
      accountId,
      authorAccountId,
      boardKind,
      isAccepted,
      active
    } = params
    const { skip, limit } = options

    const query: any = {}
    Object.keys(params).forEach(param => {
      if (param.includes('Id')) {
        query[param] = new ObjectId(params[param])
      }
      query[param] = params[param]
    })

    const list = await Apply
      .find(query, {
        skip,
        limit,
        sort: { createdAt: -1 },
      })
      .toArray()

    const count = await Apply.countDocuments(query)

    return { list, count }
  },
  GetItem: async (params: any = {}) => {
    const { _id } = params
    return Apply.findOne({ _id: new ObjectId(_id) })
  },
  IsApplied: async (params: any = {}) => {
    const { accountId, boardId } = params

    return (await Apply.countDocuments({
      accountId: new ObjectId(accountId),
      boardId: new ObjectId(boardId),
      active: true,
    })) > 0
  },
  IsAccepted: async (params: any = {}) => {
    const { accountId, boardId } = params

    return (await Apply.countDocuments({
      accountId: new ObjectId(accountId),
      boardId: new ObjectId(boardId),
      isAccepted: true,
    })) > 0
  },
  UpdateApplyIsAccepted: async (params: any = {}) => {
    const { accountId, authorAccountId, boardId } = params
    
    return Apply.updateOne({
      accountId: new ObjectId(accountId),
      authorAccountId: new ObjectId(authorAccountId),
      boardId: new ObjectId(boardId),
    }, {
      $set: {
        isAccepted: true,
        updatedAt: Date.now()
      }
    })
  },
  Delete: (params: any = {}) => {
    const { _id } = params
    
    return Apply.updateOne({
      _id: new ObjectId(_id),
    }, {
      $set: {
        active: false,
      }
    })
  },
}
