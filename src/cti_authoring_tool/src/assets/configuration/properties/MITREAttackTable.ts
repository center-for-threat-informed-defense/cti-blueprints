import { Defend } from "./Defend";
import { Control } from "./Control";
import { Tactics } from "./Tactics";
import { Procedure } from "./Procedure";
import { Techniques } from "./Techniques";
import { Attribution } from "./Attribution";
import { PropertyType } from "@/assets/scripts/AppConfiguration";
import { SubTechniques } from "./SubTechniques";

export const MITREAttackTable = {
    id: "mitre_attack_table",
    name: "MITRE ATT&CK Table",
    type: PropertyType.ComplexTable,
    layout: {
        summary: "{{ attribution }}\n**[{{ tactics }}]: {{ technique }}**",
        rows: 5,
        cols: 2
    },
    properties: [
        {
            ...Attribution,
            row: 1,
            col: 1
        },
        {
            ...Tactics,
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
