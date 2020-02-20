import mongoose from 'mongoose';
import autoIncrement from 'mongoose-auto-increment';
import db from './Connection';

autoIncrement.initialize(mongoose.connection);

export interface IStudy extends mongoose.Document {
  num: number;
  kind: string;
  mem: string;
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
  mem: { type: String, required: true },
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
  // study 등록
  createStudy: function (mem: any, kind: any, topic: any, title: any, content: any, wantNum: any, endDay: any) {
    return this.create({
      mem, kind, topic, title, content, wantNum, endDay,
    });
  },
  // 모든 study 받아오기
  getStydies: function () {
    return this.find({});
  },
  getStudiesByCategory: function (kind: any, page: number, listOrder: any) {
    return this.find({ kind }).sort(listOrder).skip(page * 10)
      .lean()
      .exec()
      .then((studies: any) => {
        return studies;
      });
  },
  // 내가 작성한 모든 study 받아오기 - listNum과 연결
  getStudyById: function (userId: any) {
    return this.find({ mem: userId });
  },
  // 내가 작성한 study 종류별로 받아오기
  getSutydByKind: function (userId: any, kind: any) {
    return this.find({ mem: userId, kind });
  },
  // 현재 study 받아오기'
  getStudyByNum: function (num: any) {
    return this.find({
      num,
    });
  },
  getStudyByItemId: function (id: any) {
    return this.findById(id);
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
  // 내가 작성한 study 변경하기
  updateStudy: function (userId: any, num: any, part: any, title: any, content: any, wantNum: any, endDay: any) {
    return this.findOneAndUpdate({ mem: userId, num }, {
      part, title, content, wantNum, endDay,
    }, { returnNewDocument: true });
  },
  // 내거 작성한 study 삭제하기
  removeStudy: function (itemId: any) {
    return this.findByIdAndRemove(itemId)
      .then((result: any) => {
        return result;
      });
  },
  // 조회수 하나 올리기
  updateHit: function (num: any) {
    return this.findOneAndUpdate(
      { num },
      { $inc: { hit: 1 } },
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

export const Study: mongoose.Model<IStudy> = mongoose.model<IStudy>('studies', studySchema);
