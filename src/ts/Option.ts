export interface OrderOption {
    createdAt?: number;
    endDay?: number;
    hit?: number;
    title?: number;
}

export default interface Option {
    skip?: number;
    limit?: number;
    option?: string;
    order?: OrderOption;
    searchText?: string;
}