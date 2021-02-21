import { ObjectId } from 'mongodb'
import Account from './Account'
import Board from './Board'

export default interface Application {
  _id: ObjectId;

  applicant: Account['_id'];
  boardId: Board['_id'];
  author: Account['_id'];
  position?: string; // only contest
  portfolio?: string; // link. only contest
  portfolioText?: string; // only contest
  wantedText: string;
  isAccepted: boolean;
  acceptedAt: Date;
  active: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}
