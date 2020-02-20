import mongoose from 'mongoose';
import connection from './Connection';

export interface IMember extends mongoose.Document {
  id: string;
  name: string;
  pwd: string;
  sNum: number;
  interest1: string;
  interest2: string;
  interest3: string;
  profile: string;
  listNum: number;
  notiApply: number;
  notiRecv: number;
  notiVol: number;
  active: boolean;
  isVerified: boolean;
  verifyKey: string;
  imageUrl: string;
}

const memberSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  pwd: { type: String, required: true },
  sNum: { type: Number, required: true },
  interest1: { type: String, required: true },
  interest2: { type: String, required: true },
  interest3: { type: String, required: true },
  profile: { type: String, required: true },
  listNum: { type: Number, default: 0 },
  // 가입일은 createdAt 으로 대신한다
  notiApply: { type: Number, default: 1 },
  notiRecv: { type: Number, default: 1 },
  notiVol: { type: Number, default: 1 },
  active: { type: Boolean, default: true },
  // 인증여부
  isVerified: { type: Boolean, required: true, default: false },
  // 인증코드
  verifyKey: { type: String, required: true },
  verifyExpireAt: {
    type: Date,
    required: true,
    default: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), new Date().getHours() + 24),
  },
  imageUrl: { type: String },
}, { minimize: false, timestamps: true });

memberSchema.statics = {
  createMember: function (id: string, name: string, pwd: string, sNum: number, interest1: string, interest2: string, interest3: string, profile: string, verifyKey: string) {
    return this.create({
      id, name, pwd, sNum, interest1, interest2, interest3, profile, verifyKey,
    });
  },
  getMemberById: function (userId: string) {
    return this.find({ id: userId });
  },
  updateMember: function (userId: string, name: string, sNum: number, interest1: string, interest2: string, interest3: string, profile: string) {
    return this.findOneAndUpdate({ id: userId }, {
      $set: {
        name, sNum, interest1, interest2, interest3, profile,
      },
    });
  },
  updatePwd: function (userId: string, newPwd: string) {
    const pwd = this.find({ id: userId }).select('pwd');

    if (pwd === newPwd) {
      return false;
    // eslint-disable-next-line no-else-return
    } else {
      this.findOneAndUpdate(
        { id: userId },
        { $set: { pwd: newPwd } },
      );
      return true;
    }
  },
  updateNoti: function (userId: string, notiApply: number, notiRecv: number, notiVol: number) {
    return this.findOneAndUpdate(
      { id: userId },
      {
        $set: {
          notiApply, notiRecv, notiVol,
        },
      },
    );
  },
  secession: function (userId: string) {
    return this.findOneAndUpdate({ id: userId }, { active: false });
  },
  getMemberListNumById: function (userId: string) {
    return this.findOne({ id: userId }).select('listNum').lean().exec()
      .then((user: { listNum: string; }) => {
        return user.listNum;
      });
  },
};

export const Member: mongoose.Model<IMember> = mongoose.model<IMember>('members', memberSchema);
