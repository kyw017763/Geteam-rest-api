import { ObjectId } from 'mongodb'
import IAccount from './IAccount'

export default interface IMessage {
  _id: ObjectId
  
  originalId: IMessage['_id'] // reply
  recvAccountId: IAccount['_id']
  sendAccountId: IAccount['_id']
  content: string
  isRead?: boolean
  readAt?: Date
  createdAt: Date
}
