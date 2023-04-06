import { CvePatch } from "./CvePatch";
import { CveNumber } from "./CveNumber";
import { Attribution } from "./Attribution";
import { CveCvssScore } from "./CveCvssScore";
import { DateOfReport } from "./DateOfReport";
import { PropertyType } from "@/assets/scripts/AppConfiguration";
import { CvePatchStatus } from "./CvePatchStatus";
import { CveRemediation } from "./CveRemediation";

export const Cves = {
    id: "cves",
    name: "Common Vulnerabilities and Exposures (CVE)",
    type: PropertyType.ComplexTable,
    layout: {
        summary: "{{ attribution }}\n**{{ cve_number }}**",
        rows: 4,
        cols: 2
    },
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
            ...CvePatch,
            row: 2,
            col: 1
        },
        {
            ...CveCvssScore,
            row: 2,
            col: 2
        },
        {
            ...CvePatchStatus,
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
