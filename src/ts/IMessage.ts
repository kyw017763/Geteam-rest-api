import IAccount from './IAccount'

export default interface IMessage {
  _id: string
  recvAccountId: IAccount['_id']
  sendAccountId: IAccount['_id']
  content: string
  isRead: boolean
  readAt: Date
  isReply: IMessage['_id']
  createdAt: Date
}
