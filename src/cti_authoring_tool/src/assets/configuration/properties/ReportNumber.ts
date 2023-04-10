import { PropertyType } from "@/assets/scripts/AppConfiguration";
import { ReportNumberPlugin } from "../plugins/ReportNumberPlugin";

export const ReportNumber = {
    id: "report_number",
    name: "Report Number",
    type: PropertyType.String,
    plugins: [
        { plugin: ReportNumberPlugin }
    ]
}
