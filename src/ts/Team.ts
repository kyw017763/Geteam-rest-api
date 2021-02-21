import { ObjectId } from 'mongodb'
import Account from './Account'

interface IMember {
  accountId: Account['_id'];
  position: string;
}

export default interface Team {
  _id: ObjectId;

  name: string;
  master: Account['_id'];
  members: IMember[];
  content: string;
  
  createdAt: Date;
}
