import { PropertyType } from "@/assets/scripts/AppConfiguration";
import { ReportCitation } from "../properties/ReportCitation";
import { InternalTelemetry } from "../properties/InternalTelemetry";

export const DataSources = {
    name: "Data Sources",
    layout: {
        rows: 2,
        cols: 1
    },
    properties: [
        {
            ...ReportCitation,
            row: 1,
            col: 1
        },
        {
            name: "Internal Telemetry",
            type: PropertyType.BasicTable,
            row: 2,
            col: 1,
            layout: {
                cols: 1,
            },
            properties: [
                {
                    ...InternalTelemetry,
                    row: 0,
                    col: 1
                }
            ]
        }
    ]
}
