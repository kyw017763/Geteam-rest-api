import mongoose from 'mongoose';
import autoIncrement from 'mongoose-auto-increment';
import db from './Connection';

autoIncrement.initialize(mongoose.connection);

export interface IStudyApply extends mongoose.Document {
  num: number;
  kind: string;
  itemNum: number;
  memApply: string;
  memRecv: string;
  topic: string;
  title: string;
  portfolio: string;
  want: string;
  applyChk: number;
};

const applyStudySchema = new mongoose.Schema({
  num: { type: Number, required: true, unique: true }, // A.I
  kind: { type: String, required: true },
  itemNum: { type: Number, required: true },
  memApply: { type: String, required: true },
  memRecv: { type: String, required: true },
  topic: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  portfolio: { type: String, required: true, trim: true },
  want: { type: String, required: true, trim: true },
  applyChk: { type: Number, default: 0 },
}, {
  timestamps: true,
});

applyStudySchema.plugin(autoIncrement.plugin, {
  model: 'ApplyStudy',
  field: 'num',
  startAt: 1,
  incrementBy: 1,
});

applyStudySchema.statics = {
  createApplyStudy:
  function (kind: string, itemNum: number, memApply: string, memRecv: string, topic: string, title: string, portfolio: string, want: string) {
    return this.create({
      kind, itemNum, memApply, memRecv, topic, title, portfolio, want,
    });
  },
  // 모든 신청 받아오기
  getApplyStudies: function () {
    return this.find({});
  },
  // 내가 한 모든 신청 받아오기
  getApplyStudyById: function (userId: string) {
    return this.find({ memApply: userId });
  },
  // 내가 한 신청 종류별로 받아오기
  getApplyStudyByIdAndKind: function (userId: string, kind: string) {
    return this.find({ memApply: userId, kind });
  },
  // 내가 한 신청 변경하기
  updateApplyStudy: function (userId: string, itemNum: number, topic: string, title: string, portfolio: string, want: string) {
    return this.findOneAndUpdate({ memApply: userId, itemNum }, {
      topic, title, portfolio, want,
    }, { returnNewDocument: true });
  },
  // 내가 한 신청 삭제하기
  removeApplyContest: function (userId: string, itemNum: number) {
    return this.findOneAndDelete({ memApply: userId, itemNum });
  },
  // 신청 한 게시물인지 확인
  isApplied: function (userId: string, kind: string, itemNum: number) {
    this.find({
      kind,
      itemNum,
      memApply: userId,
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
      memApply: userId,
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

export const ApplyStudy: mongoose.Model<IStudyApply> = mongoose.model<IStudyApply>('studyApplies', applyStudySchema);
