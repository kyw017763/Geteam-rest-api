import { connection } from 'mongoose'
import { ObjectId } from 'mongodb'
import models from './models'
import Message from '../ts/models/MessageModel'
import { Create, GetList, UpdateIsReaded, DeleteList, DeleteItem } from '../ts/models/message'
import Filter from '../ts/models/message/Filter'
import PaginationOption from '../ts/models/PaginationOption'

const Message = connection.collection(models.MESSAGE)

export default {
  Create: (params: Create) => {
    const { originalId, recvAccountId, sendAccountId, content } = params

    return Message.insertOne({
      originalId: new ObjectId(originalId),
      recvAccount: new ObjectId(recvAccountId),
      sendAccount: new ObjectId(sendAccountId),
      content,
      createdAt: new Date()
    })
  },
  GetList: (params: GetList, options: PaginationOption) => {
    const { recvAccountId, sendAccountId } = params
    const { skip, limit } = options

    const filter: Filter = {}
    if (recvAccountId) filter.recvAccountId = new ObjectId(recvAccountId)
    if (sendAccountId) filter.sendAccountId = new ObjectId(sendAccountId)

    return Message.find(filter, { skip, limit }).toArray()
  },
  UpdateIsReaded: (params: UpdateIsReaded) => {
    const { _id, recvAccountId } = params

    return Message.updateOne(
      { _id: new ObjectId(_id), recvAccountId: new ObjectId(recvAccountId) },
      { $set: { isRead: true, readAt: new Date() } },
    )
  },
  DeleteList: (params: DeleteList) => {
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
  DeleteItem: (params: DeleteItem) => {
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
