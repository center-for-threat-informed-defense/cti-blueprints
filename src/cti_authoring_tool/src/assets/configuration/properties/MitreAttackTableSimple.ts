import { Defend } from "./Defend";
import { Tactic } from "./Tactic";
import { Procedure } from "./Procedure";
import { Techniques } from "./Technique";
import { PropertyType } from "@/assets/scripts/PageEditor";
import { SubTechniques } from "./SubTechnique";
import { ImportCSVPlugin } from "../plugins/ImportCSVPlugin";

export const MitreAttackTableSimple = {
    id: "mitre_attack_table",
    name: "MITRE ATT&CK Table",
    type: PropertyType.ComplexTable,
    layout: {
        summary: "{{ tactic }}\n**{{ technique }}**",
        rows: 4,
        cols: 2
    },
    plugins: [
        { module: ImportCSVPlugin }
    ],
    properties: [
        {
            ...Tactic,
            row: 1,
            col: [1,2]
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
            row: 4,
            col: 1,
        },
        {
            ...Defend,
            row: 4, 
            col: 2
        }
    ]
}
