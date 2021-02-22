export interface Create {
    recvAccountId: string;
    sendAccountId: string;
    content: string;
    originalId: string;
}

export interface GetList {
    recvAccountId?: string;
    sendAccountId?: string;
}

export interface UpdateIsReaded {
    _id: string;
    recvAccountId: string;
}

export interface DeleteList {
    ids: string[];
    accountId: string;
}

export interface DeleteItem {
    _id: string;
    accountId: string;
}