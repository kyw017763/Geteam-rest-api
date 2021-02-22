import OrderOption from './OrderOption'

export default interface Option {
    skip?: number;
    limit?: number;
    option?: string;
    order?: OrderOption;
    searchText?: string;
}