import { Defend } from "./Defend";
import { Control } from "./Control";
import { Tactic } from "./Tactic";
import { Procedure } from "./Procedure";
import { Techniques } from "./Technique";
import { Attribution } from "./Attribution";
import { PropertyType } from "@/assets/scripts/PageEditor";
import { SubTechniques } from "./SubTechnique";
import { ImportCSVPlugin } from "../plugins/ImportCSVPlugin";

export const MitreAttackTable = {
    id: "mitre_attack_table",
    name: "MITRE ATT&CK Table",
    path: "*.mitre_attack_table",
    type: PropertyType.ComplexTable,
    layout: {
        summary: "{{ attribution }}\n**{{ tactic }} :: {{ technique }}**",
        rows: 5,
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
            ...Tactic,
            row: 1,
            col: 2
        },
        {
            ...Techniques,
            row: 2,
            col: [1,2]
        },
        {
            ...SubTechniques,
            row: 3,
            col: [1,2],
        },
        {
            ...Procedure,
            row: [4,5],
            col: 1,
        },
        {
            ...Control,
            row: 4, 
            col: 2
        },
        {
            ...Defend,
            row: 5, 
            col: 2
        }
    ]
}
