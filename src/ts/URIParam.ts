interface ApplicationURIParam {
    boardid?: string;
    applicationid?: string;
}

interface BoardURIParam {
    kind?: string;
    category?: string;
    id?: string;
}

interface MessageURIParam {
    id: string;
}

export { ApplicationURIParam, BoardURIParam, MessageURIParam }