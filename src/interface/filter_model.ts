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
}
