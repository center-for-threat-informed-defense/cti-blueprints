import { ReportCitations } from "../properties/ReportCitations";
import { InternalTelemetryTable } from "../properties/InternalTelemetryTable";

export const DataSourcesSection = {
    id: "data_sources",
    name: "Data Sources",
    layout: {
        rows: 2,
        cols: 1
    },
    properties: [
        {
            ...ReportCitations,
            row: 1,
            col: 1
        },
        {
            ...InternalTelemetryTable,
            row: 2,
            col: 1
        }
    ]
}
