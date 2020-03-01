import mongoose from 'mongoose';
import { IAccount } from './account'
import { connection } from './Database';

export interface IContest extends mongoose.Document {
  _id: string;
  kind: string;
  account: IAccount['_id'];
  topic: string;
  part: string;
  title: string;
  content: string;
  wantNum: number;
  applyNum: number;
  acceptNum: number;
  endDay: Date;
  hit: number;
  teamChk: boolean;
  active: boolean;

  enableModify(): boolean;
  enableApply(): boolean;
}

const partSchema = new mongoose.Schema({
  name: { type: [String] },
  num: { type: Number },
}, { _id : false });

const contestSchema = new mongoose.Schema({
  kind: { type: String, required: true },
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  topic: { type: String, required: true },
  part: { type: partSchema, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  wantNum: { type: Number, required: true },
  applyNum: { type: Number, default: 0 },
  acceptNum: { type: Number, default: 0 },
  // startDay는 createdAt 으로 대신한다
  endDay: { type: Date, required: true },
  hit: { type: Number, default: 0 },
  teamChk: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
}, {
  timestamps: true,
});

contestSchema.methods = {
  enableModify: function (): boolean {
    if (this.applyNum === 0) {
      return true;
    } else {
      return false;
    }
  },
  enableApply: function (): boolean {
    return !this.teamChk;
  },
}

export const Contest: mongoose.Model<IContest> = connection.model<IContest>('Contest', contestSchema);
