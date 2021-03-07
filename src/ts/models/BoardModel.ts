import { ObjectId } from 'mongodb'
import Account from './AccountModel'
import Category from '../Category'
import Kind from '../Kind'

export interface Position {
  title: string;
  description: string;
  cnt?: number;
}

export default interface Board {
  _id?: ObjectId;

  author: Account['_id'];
  kind: Kind;
  category: Category;
  topic: string;
  title: string;
  content: string;
  positions: Position[]; // only contest
  wantCnt: number;
  applicationCnt?: number;
  acceptCnt?: number;
  startDate: Date;
  endDate: Date;
  isCompleted?: boolean;
  active: boolean;
  hit: number;
  updatedAt: Date;
}