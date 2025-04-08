export default interface GroupConfig {
    name: string;
    fields: string[];
    convertToDate?: boolean;    //  If we convert full date and time to just date (or not)
}
