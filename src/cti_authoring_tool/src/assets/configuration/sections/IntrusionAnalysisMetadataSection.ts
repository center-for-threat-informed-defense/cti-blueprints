import { PropertyType } from "@/assets/scripts/PageEditor";
import { ImportCSVPlugin } from "../plugins/ImportCSVPlugin";
import { ThreatActorMotivation } from "../properties/ThreatActorMotivation";
import { ThreatActorAttributions } from "../properties/ThreatActorAttributions";

export const IntrusionAnalysisMetadataSection = {
    id: "metadata",
    name: "Metadata",
    path: "*.metadata",
    layout: {
        rows: 2,
        cols: 1
    },
    properties: [
        {
            ...ThreatActorAttributions,
            row: 1,
            col: 1
        },
        {
            id: "threat_actor_motivation",
            name: "Threat Actor Motivation",
            type: PropertyType.BasicTable,
            row: 2,
            col: 1,
            layout: {
                cols: 1,
            },
            plugins: [
                { module: ImportCSVPlugin }
            ],
            properties: [
                {
                    ...ThreatActorMotivation,
                    row: 0,
                    col: 1
                }
            ]
        }
    ]
}
