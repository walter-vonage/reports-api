export default interface GroupResult {
    group: Record<string, string>;
    count: number;
    aggregations: Record<string, any>;
    messages?: any[];
}
