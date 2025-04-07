import FilterModel from './filter_model';

export default interface FilterConfig {
    logic: 'AND' | 'OR';
    filters: FilterModel[];
}
