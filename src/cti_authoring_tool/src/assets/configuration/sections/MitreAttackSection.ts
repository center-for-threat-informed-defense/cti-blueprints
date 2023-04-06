import { MITREAttackTable } from "../properties/MITREAttackTable";

export const MITREAttackSection = {
    name: "MITRE ATT&CK",
    layout: {
        rows: 1,
        cols: 1,
    },
    properties: [
        {
            ...MITREAttackTable,
            row: 1,
            col: 1
        }
    ]
}
