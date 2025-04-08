export type FilterType = 'split' | 'text';

export type Operator =
    | 'equals'
    | 'regex'
    | 'beforeDash'
    | 'exists'
    | 'includes'
    | 'afterChar';

export default interface FilterModel {
    field: string;
    type: FilterType;
    separator?: string;
    position?: number | 'last';
    operator: Operator;
    value?: string;
    options?: string;
    convertToDate?: boolean; // This one is used to trim a value and make it: YYYY-MM-DD
}
