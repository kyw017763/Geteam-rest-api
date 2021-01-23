import { connection } from 'mongoose'
import { ObjectId } from 'mongodb'
import { MESSAGE } from './models'
import IMessage from '../ts/IMessage'

const Message = connection.collection(MESSAGE)

export default {
  Create: (params: any = {}) => {
    const { recvAccountId, sendAccountId, content, originalId } = params

    return Message.insertOne({
      originalId: new ObjectId(originalId),
      receiveAccount: new ObjectId(recvAccountId),
      sendAccount: new ObjectId(sendAccountId),
      content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  },
  GetList: (params: any = {}, options: any = {}) => {
    const { recvAccountId, sendAccountId } = params
    const { skip, limit } = options

    const filter: any = {}
    if (recvAccountId) filter['recvAccountId'] = new ObjectId(recvAccountId)
    if (sendAccountId) filter['sendAccountId'] = new ObjectId(sendAccountId)

    return Message.find(filter, { skip, limit }).toArray()
  },
  UpdateIsReaded: (params: any = {}) => {
    const { _id, recvAccountId } = params

    return Message.updateOne(
      { _id: new ObjectId(_id), recvAccountId: new ObjectId(recvAccountId) },
      { $set: { isRead: 1, updatedAt: Date.now() } },
    )
  },
  DeleteList: (params: any = {}) => {
    const { ids, accountId } = params

    return Message.deleteMany(
      {
        _id: { $in: ids.map((id: string) => new ObjectId(id)) },
        $or: [
          { recvAccountId: new ObjectId(accountId) },
          { sendAccountId: new ObjectId(accountId) }
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
          { recvAccountId: new ObjectId(accountId) },
          { sendAccountId: new ObjectId(accountId) }
        ]
      }
    )
  }
}
