import { connection } from 'mongoose'
import { ObjectId } from 'mongodb'
import { MESSAGE } from './models'
import IMessage from '../ts/IMessage'

const Message = connection.collection(MESSAGE)

export default {
  Create: (params: any = {}) => {
    const {
      receiveAccount,
      sendAccount,
      content,
      originalId,
    } = params

    return Message.insertOne({
      originalId: new ObjectId(originalId),
      receiveAccount: new ObjectId(receiveAccount),
      sendAccount: new ObjectId(sendAccount),
      content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  },
  GetMessageByReceiveAccount: (params: any = {}, options: any = {}) => {
    const { accountId } = params

    return Message.find({ receiveAccount: new ObjectId(accountId) }).toArray()
  },
  GetMessageBySendAccount: (params: any = {}, options: any = {}) => {
    const { accountId } = params
    
    return Message.find({ sendAccount: new ObjectId(accountId) }).toArray()
  },
  UpdateIsReaded: (params: any = {}) => {
    const { _id, receiveAccount } = params

    return Message.updateOne(
      { _id: new ObjectId(_id), receiveAccount: new ObjectId(receiveAccount) },
      { $set: { receiveCheck: 1, updatedAt: Date.now() } },
    )
  },
  DeleteList: (params: any = {}) => {
    const { ids, accountId } = params

    return Message.deleteMany(
      {
        _id: { $in: ids.map((id: string) => new ObjectId(id)) },
        $or: [
          { receiveAccount: new ObjectId(accountId) },
          { sendAccount: new ObjectId(accountId) }
        ]
      }
    )
  },
  DeleteItem: (params: any = {}) => {
    const { _id, accountId } = params
    
    return Message.deleteOne(
      {
        _id: new ObjectId(_id),
        $or: [
          { receiveAccount: new ObjectId(accountId) },
          { sendAccount: new ObjectId(accountId) }
        ]
      }
    )
  }
}
