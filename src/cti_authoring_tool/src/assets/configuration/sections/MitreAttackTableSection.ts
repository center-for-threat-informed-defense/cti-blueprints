import { MitreAttackTable } from "../properties/MitreAttackTable";

export const MitreAttackTableSection = {
    name: "MITRE ATT&CK",
    layout: {
        rows: 1,
        cols: 1,
    },
    properties: [
        {
            ...MitreAttackTable,
            row: 1,
            col: 1
        }
    ]
}
