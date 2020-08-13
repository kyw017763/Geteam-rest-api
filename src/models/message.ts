import { connection } from 'mongoose'
import { ObjectId } from 'mongodb'
import * as models from './models'
import IMessage from '../ts/IMessage'

const Board = connection.collection(models.MESSAGE)

export default {
  Create: (params: IMessage = {}) => {
    const {
      receiveAccount,
      sendAccount,
      content,
      originalId,
    } = params
    return Board.insertOne({
      originalId: new ObjectId(originalId),
      receiveAccount: new ObjectId(receiveAccount),
      sendAccount: new ObjectId(sendAccount),
      content,
      createdAt: Date.now(),
    })
  },
  GetMessageByReceiveAccount: (params: IMessage = {}) => {
    const { accountId } = params
    return Board.find({
      receiveAccount: new ObjectId(accountId)
    })

  },
  GetMessageBySendAccount: (params: IMessage = {}) => {
    const { accountId } = params
    return Board.find({
      sendAccount: new ObjectId(accountId)
    })
  },
  UpdateIsReaded: (params: IMessage = {}) => {
    const { _id } = params
    return Board.updateOne(
      { _id: new ObjectId(_id) },
      { $set: { receiveCheck: 1 } },
    )
  },
  Delete: (params: IMessage = {}) => {
    const { ids } = params
    return Board.deleteMany({
      _id: { $in: ids.map((id: string) => new ObjectId(id)) }
    })
  },
}
