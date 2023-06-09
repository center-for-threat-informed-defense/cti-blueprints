import { Artifact } from "./Artifact";
import { Attribution } from "./Attribution";
import { LastReported } from "./LastReported";
import { PropertyType } from "@/assets/scripts/PageEditor";
import { FirstReported } from "./FirstReported";
import { NetworkIntrusionPhase } from "./NetworkIntrusionPhase";
import { Details } from "./Details";

export const IocsNetwork = {
    id: "ioc_network",
    name: "Network Indicators",
    path: "*.iocs.network",
    type: PropertyType.ComplexTable,
    layout: {
        summary: "{{ attribution }}\n**{{ artifact }}**",
        cols: 2,
        rows: 4
    },
    properties: [
        {
            ...Attribution,
            row: 1,
            col: 1,
        },
        {
            ...NetworkIntrusionPhase,
            row: 1,
            col: 2
        },
        {
            ...Artifact,
            name: "Network Artifact",
            row: 2,
            col: [1,2]
        },
        {
            ...Details,
            row: 3,
            col: [1,2]
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
        }
    ]
}
