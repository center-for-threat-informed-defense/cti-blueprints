
import { Body } from "../sections/Body";
import { General } from "../sections/General";
import { Metadata } from "../sections/Metadata";
import { DataSources } from "../sections/DataSources";
import { AutomationTable } from "../sections/AutomationTable";

export const Executive: any = {
    id: "executive_report",
    name: "Executive Report",
    sections: [
        General,
        Body,
        Metadata,
        DataSources,
        AutomationTable,
    ],
}
