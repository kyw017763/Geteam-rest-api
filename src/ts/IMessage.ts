import { ObjectId } from 'mongodb'
import IAccount from './IAccount'

export default interface IMessage {
  _id: ObjectId
  
  recvId: IAccount['_id']
  sendId: IAccount['_id']
  content: string
  isRead: boolean
  readAt: Date
  originalId: IMessage['_id'] // reply
  
  createdAt: Date
}
