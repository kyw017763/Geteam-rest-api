import { connection } from 'mongoose'
import { ObjectId } from 'mongodb'
import models from './models'
import Message from '../ts/Message'
import MessageModelCreate from '../ts/MessageModelCreate'
import MessageModelGetList from '../ts/MessageModelGetList'
import MessageModelFilter from '../ts/MessageModelFilter'
import MessageModelUpdateIsReaded from '../ts/MessageModelUpdateIsReaded'
import MessageModelDeleteList from '../ts/MessageModelDeleteList'
import MessageModelDeleteItem from '../ts/MessageModelDeleteItem'
import PaginationOption from '../ts/PaginationOption'

const Message = connection.collection(models.MESSAGE)

export default {
  Create: (params: MessageModelCreate) => {
    const { originalId, recvAccountId, sendAccountId, content } = params

    return Message.insertOne({
      originalId: new ObjectId(originalId),
      recvAccount: new ObjectId(recvAccountId),
      sendAccount: new ObjectId(sendAccountId),
      content,
      createdAt: new Date()
    })
  },
  GetList: (params: MessageModelGetList, options: PaginationOption) => {
    const { recvAccountId, sendAccountId } = params
    const { skip, limit } = options

    const filter: MessageModelFilter = {}
    if (recvAccountId) filter.recvAccountId = new ObjectId(recvAccountId)
    if (sendAccountId) filter.sendAccountId = new ObjectId(sendAccountId)

    return Message.find(filter, { skip, limit }).toArray()
  },
  UpdateIsReaded: (params: MessageModelUpdateIsReaded) => {
    const { _id, recvAccountId } = params

    return Message.updateOne(
      { _id: new ObjectId(_id), recvAccountId: new ObjectId(recvAccountId) },
      { $set: { isRead: true, readAt: new Date() } },
    )
  },
  DeleteList: (params: MessageModelDeleteList) => {
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
  DeleteItem: (params: MessageModelDeleteItem) => {
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
