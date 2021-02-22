import { ObjectId } from 'mongodb'

export default interface Filter {
    recvAccountId?: ObjectId;
    sendAccountId?: ObjectId;
}