import { ObjectId } from 'mongodb'

export default interface AccountModelFilter {
    _id?: ObjectId;
    id?: string;
    sNum?: number;
}