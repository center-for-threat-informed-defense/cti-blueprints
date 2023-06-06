import { CveNumber } from "./CveNumber";
import { Attribution } from "./Attribution";
import { CveCvssScore } from "./CveCvssScore";
import { DateOfReport } from "./DateOfReport";
import { PropertyType } from "@/assets/scripts/PageEditor";
import { CveRemediation } from "./CveRemediation";
import { CvePatchApplied } from "./CvePatchApplied";
import { CvePatchAvailable } from "./CvePatchAvailable";
import { ImportCSVPlugin } from "../plugins/ImportCSVPlugin";

export const Cves = {
    id: "cves",
    name: "Common Vulnerabilities and Exposures (CVE)",
    path: "*.iocs.cves",
    type: PropertyType.ComplexTable,
    layout: {
        summary: "{{ attribution }}\n**{{ cve_number }}**",
        rows: 4,
        cols: 2
    },
    plugins: [
        { module: ImportCSVPlugin }
    ],
    properties: [
        {
            ...Attribution,
            row: 1,
            col: 1
        },
        {
            ...CveNumber,
            row: 1,
            col: 2
        },
        {
            ...CvePatchAvailable,
            row: 2,
            col: 1
        },
        {
            ...CveCvssScore,
            row: 2,
            col: 2
        },
        {
            ...CvePatchApplied,
            row: 3,
            col: 1
        },
        {
            ...DateOfReport,
            row: 4,
            col: 1
        },
        {
            ...CveRemediation,
            row: [3, 4],
            col: 2
        }
    ]
}
