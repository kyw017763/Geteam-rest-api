import OrderOption from './OrderOption'

export default interface Option {
    skip?: string | number;
    limit?: string | number;
    option?: string;
    order?: string | OrderOption;
    searchText?: string;
}