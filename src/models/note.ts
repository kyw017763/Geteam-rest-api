import mongoose from 'mongoose';
import { IAccount } from './account'
import { connection } from './Database';

export interface INote extends mongoose.Document {
  _id: IAccount['_id'];
  accountRecv: string;
  accountSend: string;
  content: string;
  recvChk: string;
  reChk: INote['_id'];
}

const noteSchema = new mongoose.Schema({
  // idx 는 createdAt 으로 sort 해서 대체함
  accountRecv: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  accountSend: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  content: { type: String, required: true },
  recvChk: { type: Number, default: 0 }, // 읽음 체크
  reChk: { type: mongoose.Schema.Types.ObjectId, ref: 'Note' }, // 대답인지
}, {
  timestamps: true,
});

noteSchema.statics = {
  getNotesByRecvId: function (userId: string) {
    return this.find({
      accountRecv: userId,
    });
  },
  getNotesBySendId: function (userId: string) {
    return this.find({
      accountSend: userId,
    });
  },
  createNote: function (recvId: string, sendId: string, content: string) {
    return this.create({
      accountRecv: recvId,
      accountSend: sendId,
      content,
    });
  },
  createNoteReturned: function (recvId: string, sendId: string, content: string, returnedId: string) {
    return this.create({
      accountRecv: recvId,
      accountSend: sendId,
      content,
      reChk: returnedId,
    });
  },
  updateReadChk: function (id: string) {
    this.update(
      { _id: id },
      { $set: { recvChk: 1 } },
    );
  },
  removeNote: function (id: string) {
    return this.findOneAndDelete({ _id: id });
  },
};

export const Note: mongoose.Model<INote> = connection.model<INote>('Note', noteSchema);
