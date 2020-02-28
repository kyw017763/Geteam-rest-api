import mongoose from 'mongoose';
import autoIncrement from 'mongoose-auto-increment';
import { IAccount } from './account'
import { connection } from './Database';

autoIncrement.initialize(mongoose.connection);

export interface IStudy extends mongoose.Document {
  _id: IAccount['_id'];
  num: number;
  kind: string;
  account: string;
  topic: string;
  title: string;
  content: string;
  wantNum: number;
  applyNum: number;
  endDay: Date;
  hit: number;
  teamChk: number;
}

const studySchema = new mongoose.Schema({
  num: { type: Number, required: true, unique: true }, // A.I
  kind: { type: String, required: true },
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  topic: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  wantNum: {  type: Number, required: true },
  applyNum: { type: Number, default: 0 },
  // startDay는 createdAt 으로 대신한다
  endDay: { type: Date, required: true },
  hit: { type: Number, default: 0 },
  teamChk: { type: Number, default: 0 },
}, {
  timestamps: true,
});


studySchema.plugin(autoIncrement.plugin, {
  model: 'Study',
  field: 'num',
  startAt: 1,
  incrementBy: 1,
});

studySchema.statics = {
  // 내가 작성한 모든 study 받아오기 - listNum과 연결
  getStudyById: function (userId: any) {
    return this.find({ account: userId });
  },
  // 내가 작성한 study 종류별로 받아오기
  getSutydByKind: function (userId: any, kind: any) {
    return this.find({ account: userId, kind });
  },
  // 검색
  searchStudy: function (keyword: any) {
    // keyword 하나 받아서 id, 이름, 주제, 파트, 제목, 내용 검색
    return this.find().or(
      [
        { id: { $regex: keyword } },
        { name: { $regex: keyword } },
        { topic: { $regex: keyword } },
        { title: { $regex: keyword } },
        { content: { $regex: keyword } },
      ],
    );
  },
  // applyNum 하나 올리기
  updateApplyNum: function (num: any) {
    return this.findOneAndUpdate(
      { num },
      { $inc: { applyNum: 1 } },
    );
  },
  // 수정이 가능한지 확인 - 신청 인원이 한 명 이상이라면 수정할 수 없음
  enableModify: function (num: any) {
    this.find({
      num,
      applyNum: 0,
    }, (err: any, result: string | any[]) => {
      if (err) {
        return false;
      }
      // 조건을 충족하면 true
      if (result.length) {
        return true;
      }
    });
  },
  // 신청이 가능한지 확인
  enableApply: function (num: any) {
    this.find({
      num,
      teamChk: 0,
    }, (err: any, result: string | any[]) => {
      if (err) {
        return false;
      }
      // 조건을 충족하면 true
      if (!result.length) {
        return true;
      }
    });
  },
};

// 정렬 (1, -1)
studySchema.query.sortByNum = function (order: string) {
  return this.sort({ num: order });
};
studySchema.query.sortById = function (order: string) {
  return this.sort({ id: order });
};
studySchema.query.sortByAuthor = function (order: string) {
  return this.sort({ name: order });
};
studySchema.query.sortByTitle = function (order: string) {
  return this.sort({ title: order });
};

export const Study: mongoose.Model<IStudy> = connection.model<IStudy>('studies', studySchema);
