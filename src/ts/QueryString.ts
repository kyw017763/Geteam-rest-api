import OrderOption from '../ts/OrderOption'

export default interface QueryString {
    offset: string | number | undefined;
    limit: string | number | undefined;
    option: string | undefined;
    order: string | OrderOption | undefined;
    kind: string | undefined;
    author: string | undefined;
    is_accepted: string | undefined;
    active: string | undefined;
    searchText: string | undefined;
}