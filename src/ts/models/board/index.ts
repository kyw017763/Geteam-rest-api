import { ObjectId } from 'mongodb'
import { Position } from '../../Board'
import Account from '../../Account'

export interface Create {
    author: Account['_id'];
    kind: string;
    category: string;
    topic: string;
    title: string;
    content: string;
    positions: Position[];
    wantCnt: number;
    endDate: Date;
}

export interface GetList {
    kind: string;
    category: string;
    author: Account['_id'];
}

export interface GetItem {
    _id: ObjectId;
}

export interface GetBoardCount {
    author: Account['_id'];
}

export interface GetTeamCount {
    author: Account['_id'];
}

export interface UpdateItem {
    _id: ObjectId;
    author: Account['_id'];
    kind: string;
    category: string;
    topic: string;
    title: string;
    content: string;
    positions: Position[];
    wantCnt: number;
    endDate: Date;
}

export interface UpdateIsCompleted {
    _id: ObjectId;
    author: Account['_id'];
}

export interface UpdateApplicationCnt {
    _id: ObjectId;
    diff: number;
}

export interface UpdateAcceptCnt {
    _id: ObjectId;
    diff: number;
}

export interface UpdateHit {
    _id: ObjectId;
    diff: number;
}

export interface Delete {
    _id: ObjectId;
    author: Account['_id'];
}