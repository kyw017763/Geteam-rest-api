export interface DeleteBeforeSignUp {
    id: string;
}

export interface SignUp {
    id: string;
    pwd: string;
    name: string;
    sNum: number;
    interests: string[];
    profile: string;
    verifyKey: string;
}

export interface SignIn {
    id: string;
}

export interface GetItem {
    _id: string;
}

export interface GetInterests {
    id: string;
}

export interface GetPassword {
    _id: string;
}

export interface GetCompareEmail {
    id: string;
}

export interface IsExist {
    _id?: string;
    id?: string;
    sNum?: number;
}

export interface UpdateRefreshToken {
    id: string;
    refreshToken: string;
}

export interface ResetRefreshToken {
    _id: string;
}

export interface UpdateIsVerified {
    id: string;
    verifyKey: string;
}

export interface UpdateVerifyKey {
    id: string;
    verifyKey: string;
}

export interface UpdatePassword {
    _id: string;
    pwd: string;
}

export interface UpdateInfo {
    _id: string;
    name: string;
    sNum: number;
    interests: string[];
    profile: string;
}

export interface UpdateNotifications {
    _id?: string;
    notifications: { applied?: boolean, accepted?: boolean, team?: boolean };
}

export interface Delete {
    _id: string;
}