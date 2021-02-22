import { ObjectId } from 'mongodb'

export default interface Filter {
    _id?: ObjectId;
    id?: string;
    sNum?: number;
}