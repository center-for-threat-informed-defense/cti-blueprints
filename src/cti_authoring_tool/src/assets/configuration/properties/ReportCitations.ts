import { PropertyType } from "@/assets/scripts/AppConfiguration";

export const ReportCitations = {
    id: "report_citations",
    name: "Report Citations",
    type: PropertyType.BasicTable,
    layout: {
        cols: 3
    },
    properties: [
        {
            id: "description",
            name: "Description",
            type: PropertyType.String,
            row: 0,
            col: [1, 2]
        },
        {
            id: "hyperlink",
            name: "Hyperlink",
            type: PropertyType.String,
            row: 0,
            col: 3
        },
    ]
}
