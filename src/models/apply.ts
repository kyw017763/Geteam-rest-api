import { connection } from 'mongoose'
import { ObjectId } from 'mongodb'
import { APPLY } from './models'
import IApply from '../ts/IApply'

const Apply = connection.collection(APPLY)

export default {
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
