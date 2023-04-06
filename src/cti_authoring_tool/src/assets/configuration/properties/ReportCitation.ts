import { PropertyType } from "@/assets/scripts/AppConfiguration";

export const ReportCitation = {
    id: "report_citation",
    name: "Data Sources - External CTI Reports",
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
