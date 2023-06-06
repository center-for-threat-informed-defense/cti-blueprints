import { PropertyType } from "@/assets/scripts/PageEditor";
import { ImportCSVPlugin } from "../plugins/ImportCSVPlugin";

export const ReportCitations = {
    id: "report_citations",
    name: "Report Citations",
    path: "*.data_sources.report_citations",
    type: PropertyType.BasicTable,
    layout: {
        cols: 3
    },
    plugins: [
        { module: ImportCSVPlugin }
    ],
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
