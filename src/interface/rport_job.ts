import Aggregation from "./aggregation";
import FilterConfig from "./filter_config";
import GroupConfig from "./group_config";

export default interface ReportJob {
    to?: string;
    from?: string;
    status?: string;
    groupBy: GroupConfig[] | string[];
    aggregations: Aggregation[];
    filterConfig: FilterConfig
}
