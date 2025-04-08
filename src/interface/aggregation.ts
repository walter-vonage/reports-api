
type AggregationType = 'sum' | 'count' | 'countDistinct' | 'avg';

export default interface Aggregation {
    type: AggregationType;
    field: string;
    label: string;
}
