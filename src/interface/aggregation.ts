export default interface Aggregation {
    type: 'sum' | 'count' | 'countDistinct';
    field: string;
    label: string;
}
