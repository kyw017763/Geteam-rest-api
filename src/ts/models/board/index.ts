import { ObjectId } from 'mongodb'
import { Position } from '../BoardModel'
import Account from '../AccountModel'

export interface Create {
    author: string;
    kind: string;
    category: string;
    topic: string;
    title: string;
    content: string;
    positions?: Position[];
    wantCnt: number;
    endDate: Date;
}

export interface GetList {
    kind: string;
    category: string;
    author: string | null;
}

export interface GetItem {
    _id: string;
}

export interface GetBoardCount {
    author: string;
}

export interface GetTeamCount {
    author: string;
}

export interface UpdateItem {
    _id?: string;
    author?: string;
    kind: string;
    category: string;
    topic: string;
    title: string;
    content: string;
    positions?: Position[];
    wantCnt: number;
    endDate: Date;
    updatedAt?: Date;
}

export interface UpdateIsCompleted {
    _id: string;
    author?: Account['_id'];
}

export interface UpdateApplicationCnt {
    _id: string;
    diff: number;
}

export interface UpdateAcceptCnt {
    _id: string;
    diff: number;
}

export interface UpdateHit {
    _id: string;
    diff: number;
}

export interface Delete {
    _id: string;
    author: string;
}