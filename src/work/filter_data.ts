import CsvRow from "../interface/csv_row";
import FilterConfig from "../interface/filter_config";
import FilterModel from "../interface/filter_model";

export function applyFilter(row: CsvRow, filter: FilterModel): boolean {
    
    let val = row[filter.field] || '';

    // Handle automatic date conversion (from YYYY:MM:DDTHH:MM:SS to simply YYYY:MM:DD)
    if (filter.convertToDate && /^\d{4}-\d{2}-\d{2}/.test(val)) {
        val = val.substring(0, 10); // Keep only the "YYYY-MM-DD"
    }

    if (filter.type === 'split') {
        const separator = filter.separator || '|';
        const segments = val.split(separator);
        let segment: string | undefined;

        if (filter.position === 'last') {
            segment = segments[segments.length - 1];
        } else if (typeof filter.position === 'number') {
            segment = segments[filter.position];
        }

        if (!segment) return false;

        switch (filter.operator) {
            case 'equals':
                return segment === filter.value;
            case 'regex':
                return new RegExp(filter.value || '', filter.options || '').test(segment);
            case 'beforeDash':
                return segment.split('-')[0] === filter.value;
            case 'exists':
                return segment.trim() !== '';
            default:
                return false;
        }
    }

    if (filter.type === 'text') {
        switch (filter.operator) {
            case 'regex':
                return new RegExp(filter.value || '', filter.options || '').test(val);
            case 'includes':
                return val.toLowerCase().includes((filter.value || '').toLowerCase());
            case 'equals':
                return val === filter.value;
            case 'afterChar':
                if (!filter.value) return false;
                const index = val.indexOf(filter.value);
                return index !== -1 && index < val.length - 1;
            default:
                return false;
        }
    }

    return false;
}

export function rowMatches(row: CsvRow, config: FilterConfig): boolean {
    if (config.logic === 'AND') {
        return config.filters.every((f) => applyFilter(row, f));
    } else {
        return config.filters.some((f) => applyFilter(row, f));
    }
}

export function filterDataRows(rows: CsvRow[], config: FilterConfig): CsvRow[] {
    return rows.filter((row) => rowMatches(row, config));
}
