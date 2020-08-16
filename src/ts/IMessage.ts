import IAccount from './IAccount'

export default interface IMessage {
  _id: string
  
  recvAccountId: IAccount['_id']
  sendAccountId: IAccount['_id']
  content: string
  isRead: boolean
  readAt: Date
  originalId: IMessage['_id'] // reply
  
  createdAt: Date
}
