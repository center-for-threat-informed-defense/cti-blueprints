import { Tactic } from "./Tactic";
import { Details } from "./Details";
import { Artifact } from "./Artifact";
import { Attribution } from "./Attribution";
import { LastReported } from "./LastReported";
import { PropertyType } from "@/assets/scripts/PageEditor";
import { FirstReported } from "./FirstReported";
import { SystemArtifactType } from "./SystemArtifactType";

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
            name: "Host Artifact",
            row: 2,
            col: 1
        },
        {
            ...SystemArtifactType,
            row: 2,
            col: 2
        },
        {
            ...Details,
            row: 3,
            col: [1, 2]
        },
        {
            ...FirstReported,
            row: 4,
            col: 1
        },
        {
            ...LastReported,
            row: 4,
            col: 2
        },
    ]
}
