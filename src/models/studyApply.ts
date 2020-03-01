import mongoose from 'mongoose';
import { IAccount } from './account';
import { IStudy } from './study';
import { connection } from './Database';

export interface IStudyApply extends mongoose.Document {
  _id: IAccount['_id'];
  kind: string;
  item: IStudy['_id'];
  applyAccount: IAccount['_id'];
  recvAccount: IAccount['_id'];
  topic: string;
  title: string;
  portfolio: string;
  want: string;
  accept: boolean;
  active: boolean;
};

const applyStudySchema = new mongoose.Schema({
  kind: { type: String, required: true },
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'Study', required: true },
  applyAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  recvAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  topic: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  portfolio: { type: String, required: true, trim: true },
  want: { type: String, required: true, trim: true },
  accept: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
}, {
  timestamps: true,
});

export const StudyApply: mongoose.Model<IStudyApply> = connection.model<IStudyApply>('StudyApply', applyStudySchema);
