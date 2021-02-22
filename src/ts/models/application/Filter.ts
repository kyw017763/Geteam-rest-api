import { ObjectId } from 'mongodb'

export default interface Filter {
    isAccepted?: boolean;
    active?: boolean;
    boardId?: ObjectId | ObjectId[];
    author?: ObjectId;
    applicant?: ObjectId;
}