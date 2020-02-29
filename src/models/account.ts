import mongoose from 'mongoose';
import { connection } from './Database';
import bcrypt from 'bcryptjs';
import config from '../config';

export interface IAccount extends mongoose.Document {
  [x: string]: any;
  _id: string;
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
  refreshToken: string;
  isVerified: boolean;
  verifyKey: string;
  imageUrl: string;
}

const accountSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  pwd: { type: String, required: true },
  sNum: { type: Number, required: true, validate:[ (sNum) => sNum && sNum.toString().length === 4, `sNum's length is 4` ] },
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
  refreshToken: { type: String },
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

accountSchema.pre<IAccount>('save', function (next) {
  this.pwd = bcrypt.hashSync(this.pwd);
  next();
});

accountSchema.methods.compareHash = function (pwd: string) {
  return bcrypt.compareSync(pwd, this.pwd);
}

accountSchema.statics = {
  createAccount: function (id: string, name: string, pwd: string, sNum: number, interest1: string, interest2: string, interest3: string, profile: string, verifyKey: string) {
    return this.create({
      id, name, pwd, sNum, interest1, interest2, interest3, profile, verifyKey,
    });
  },
  getAccountById: function (userId: string) {
    return this.find({ id: userId });
  },
  updateAccount: function (userId: string, name: string, sNum: number, interest1: string, interest2: string, interest3: string, profile: string) {
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
};

export const Account: mongoose.Model<IAccount> = connection.model<IAccount>('Account', accountSchema);
