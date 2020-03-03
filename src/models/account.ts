import mongoose from 'mongoose';
import { connection } from './Database';
import bcrypt from 'bcryptjs';

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
  notiApply: boolean;
  notiWrite: boolean;
  active: boolean;
  refreshToken: string;
  isVerified: boolean;
  verifyKey: string;
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
  notiApply: { type: Boolean, default: true },
  notiWrite: { type: Boolean, default: true },
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
}, { minimize: false, timestamps: true });

accountSchema.pre<IAccount>('save', function (next) {
  this.pwd = bcrypt.hashSync(this.pwd);
  next();
});

accountSchema.methods.compareHash = function (pwd: string) {
  return bcrypt.compareSync(pwd, this.pwd);
}

export const Account: mongoose.Model<IAccount> = connection.model<IAccount>('Account', accountSchema);
