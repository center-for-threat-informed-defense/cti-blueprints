import { PropertyType } from "@/assets/scripts/PageEditor";
import { ReportNumberPlugin } from "../plugins/ReportNumberPlugin";

export const ReportNumber = {
    id: "report_number",
    name: "Report Number",
    path: "*.report_number",
    type: PropertyType.String,
    plugins: [
        { module: ReportNumberPlugin }
    ]
}
