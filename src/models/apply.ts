import { connection } from 'mongoose'
import { ObjectId } from 'mongodb'
import * as models from './models'
import IApply from '../ts/IApply'

const Apply = connection.collection(models.APPLY)

export default {
  IsApplied: async (params: IApply = {}) => {
    const { accountId, boardId } = params
    return (await Apply.countDocuments({
      accountId: new ObjectId(accountId),
      boardId: new ObjectId(boardId)
    })) > 0
  },
  IsAccepted: async (params: IApply = {}) => {
    const { accountId, boardId } = params
    return (await Apply.countDocuments({
      accountId: new ObjectId(accountId),
      boardId: new ObjectId(boardId),
      isAccepted: true,
    })) > 0
  },
}
