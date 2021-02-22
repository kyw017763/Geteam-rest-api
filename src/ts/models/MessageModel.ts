import { ObjectId } from 'mongodb'
import Account from './AccountModel'

export default interface Message {
  _id: ObjectId;
  
  originalId: Message['_id']; // reply
  recvAccountId: Account['_id'];
  sendAccountId: Account['_id'];
  content: string;
  isRead?: boolean;
  readAt?: Date;
  createdAt: Date;
}