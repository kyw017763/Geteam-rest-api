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

applyStudySchema.statics = {
  createApplyStudy:
  function (kind: string, itemNum: number, applyAccount: string, recvAccount: string, topic: string, title: string, portfolio: string, want: string) {
    return this.create({
      kind, itemNum, applyAccount, recvAccount, topic, title, portfolio, want,
    });
  },
  // 모든 신청 받아오기
  getApplyStudies: function () {
    return this.find({});
  },
  // 내가 한 모든 신청 받아오기
  getApplyStudyById: function (userId: string) {
    return this.find({ applyAccount: userId });
  },
  // 내가 한 신청 종류별로 받아오기
  getApplyStudyByIdAndKind: function (userId: string, kind: string) {
    return this.find({ applyAccount: userId, kind });
  },
  // 내가 한 신청 변경하기
  updateApplyStudy: function (userId: string, itemNum: number, topic: string, title: string, portfolio: string, want: string) {
    return this.findOneAndUpdate({ applyAccount: userId, itemNum }, {
      topic, title, portfolio, want,
    }, { returnNewDocument: true });
  },
  // 내가 한 신청 삭제하기
  removeApplyContest: function (userId: string, itemNum: number) {
    return this.findOneAndDelete({ applyAccount: userId, itemNum });
  },
  // 신청 한 게시물인지 확인
  isApplied: function (userId: string, kind: string, itemNum: number) {
    this.find({
      kind,
      itemNum,
      applyAccount: userId,
    }, (err: any, result: string | string[]) => {
      if (err) {
        return false;
      }
      if (!result.length) {
        return true;
      }
    });
  },
  // 신청한 게시물이 받아들여졌는지 확인
  isConfirmed: function (userId: string, kind: string, itemNum: number) {
    this.find({
      kind,
      itemNum,
      applyAccount: userId,
      applyChk: 1,
    }, (err: any, result: string | string[]) => {
      if (err) {
        return false;
      }
      if (!result.length) {
        return true;
      }
    });
  },
};

export const StudyApply: mongoose.Model<IStudyApply> = connection.model<IStudyApply>('StudyApply', applyStudySchema);
