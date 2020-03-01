import mongoose from 'mongoose';
import { IAccount } from './account'
import { connection } from './Database';

export interface IStudy extends mongoose.Document {
  _id: string;
  kind: string;
  account: IAccount['_id'];
  topic: string;
  title: string;
  content: string;
  wantNum: number;
  applyNum: number;
  acceptNum: number;
  endDay: Date;
  hit: number;
  teamChk: number;
  active: boolean;
}

const studySchema = new mongoose.Schema({
  kind: { type: String, required: true },
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  topic: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  wantNum: {  type: Number, required: true },
  applyNum: { type: Number, default: 0 },
  acceptNum: { type: Number, default: 0 },
  // startDay는 createdAt 으로 대신한다
  endDay: { type: Date, required: true },
  hit: { type: Number, default: 0 },
  teamChk: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
}, {
  timestamps: true,
});

export const Study: mongoose.Model<IStudy> = connection.model<IStudy>('Study', studySchema);
