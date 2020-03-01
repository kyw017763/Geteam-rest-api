import mongoose from 'mongoose';
import { IAccount } from './account';
import { IContest } from './contest';
import { connection } from './Database';

export interface IContestApply extends mongoose.Document {
  _id: IAccount['_id'];
  kind: string;
  item: IContest['_id'];
  applyAccount: IAccount['_id'];
  recvAccount: IAccount['_id'];
  topic: string;
  title: string;
  part: string;
  portfolio: string;
  want: string;
  accept: boolean;
  active: boolean;
};

const applyContestSchema = new mongoose.Schema({
  kind: { type: String, required: true },
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'Contest', required: true },
  applyAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  recvAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  topic: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  part: { type: String, required: true, trim: true },
  portfolio: { type: String, required: true, trim: true },
  want: { type: String, required: true, trim: true },
  accept: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
}, {
  timestamps: true,
});

applyContestSchema.statics = {
  isApplied: async function (account: string, item: string) {
    return await this.exists({ applyAccount: account, item });
  },
  isAccepted: async function (account: string, item: string) {
    return await this.exists({ applyAccount: account, item, accept: true });
  },
}

export const ContestApply: mongoose.Model<IContestApply> = connection.model<IContestApply>('ContestApply', applyContestSchema);
