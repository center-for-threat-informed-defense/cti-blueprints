import { Tactic } from "./Tactic";
import { Artifact } from "./Artifact";
import { Attribution } from "./Attribution";
import { PropertyType } from "@/assets/scripts/PageEditor";
import { LastObserved } from "./LastObserved";
import { FirstObserved } from "./FirstObserved";
import { SystemDetails } from "./SystemDetails";
import { ImportCSVPlugin } from "../plugins/ImportCSVPlugin";

export const SystemArtifacts = {
    id: "system_artifacts",
    name: "System Artifacts",
    path: "*.iocs.system_artifacts",
    type: PropertyType.ComplexTable,
    layout: {
        summary: "{{ attribution }}\n**{{ artifact }}**",
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
            ...Tactic,
            row: 1,
            col: 2
        },
        {
            ...Artifact,
            row: 2,
            col: [1, 2]
        },
        {
            ...SystemDetails,
            row: 3,
            col: [1, 2]
        },
        
        {
            ...FirstObserved,
            row: 4,
            col: 1
        },
        {
            ...LastObserved,
            row: 4,
            col: 2
        },
    ]
}
