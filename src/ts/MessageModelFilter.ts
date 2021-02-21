import { ObjectId } from 'mongodb'

export default interface MessageModelGetList {
    recvAccountId?: ObjectId;
    sendAccountId?: ObjectId;
}