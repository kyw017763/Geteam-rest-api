export default interface QueryString {
    offset: string | number | undefined;
    limit: string | number | undefined;
    option: string | undefined;
    order: string | undefined;
    kind: string | undefined;
    author: string | undefined;
    is_accepted: string | undefined;
    active: string | undefined;
    searchText: string | undefined;
}