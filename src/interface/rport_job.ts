import Aggregation from "./aggregation";
import FilterConfig from "./filter_config";
import GroupConfig from "./group_config";

export default interface ReportJob {
    startDate: string;
    endDate: string;
    to?: string;
    from?: string;
    status?: string;
    groupBy: GroupConfig[] | string[];
    aggregations: Aggregation[];
    emailTo?: string;
    filterConfig: FilterConfig
}
