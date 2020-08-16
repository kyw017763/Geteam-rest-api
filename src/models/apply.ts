import { connection } from 'mongoose'
import { ObjectId } from 'mongodb'
import { APPLY } from './models'
import IApply from '../ts/IApply'
import { IOption } from '../ts/common';

const Apply = connection.collection(APPLY)

export default {
  GetApplyList: (params: any = {}, options: IOption = {}) => {
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

    return Apply
      .find(query, {
        skip,
        limit,
        sort: { createdAt: -1 },
      })
      .toArray()
  },
  IsApplied: async (params: any = {}) => {
    const { accountId, boardId } = params
    return (await Apply.countDocuments({
      accountId: new ObjectId(accountId),
      boardId: new ObjectId(boardId)
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
}
