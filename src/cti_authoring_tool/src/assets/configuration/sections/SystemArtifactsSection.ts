import { SystemArtifactTable } from "../properties/SystemArtifactTable";

export const SystemArtifactSection = {
    name: "System Artifacts",
    layout: {
        rows: 1,
        cols: 1
    },
    properties: [
        {
            ...SystemArtifactTable,
            row: 1,
            col: 1
        }
    ]
}
