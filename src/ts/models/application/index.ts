import { ObjectId } from 'mongodb'

export interface Create {
    applicant: string;
    author: string;
    boardId: string | ObjectId;
    wantedText: string;
    position?: string;
    portfolio?: string;
    portfolioText?: string;
}

export interface GetList {
    applicant?: string;
    kind?: string;
    author?: string;
    isAccepted?: boolean;
    active?: boolean;
    boardId?: string;
}

export interface IsApplied {
    applicant: string;
    boardId: string;
}

export interface IsAccepted {
    applicant: string;
    boardId: string; 
}

export interface UpdateIsAccepted {
    _id: string;
    boardId: string;
    author: string;
}

export interface Delete {
    _id: string;
    boardId: string;
    author: string;
}