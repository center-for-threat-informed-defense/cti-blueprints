import { PropertyType } from "@/assets/scripts/AppConfiguration";
import { ThreatActorMotivation } from "../properties/ThreatActorMotivation";
import { ThreatActorAttributions } from "../properties/ThreatActorAttributions";

export const IntrusionAnalysisMetadataSection = {
    name: "Metadata",
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
            name: "Threat Actor Motivation",
            type: PropertyType.BasicTable,
            row: 2,
            col: 1,
            layout: {
                cols: 1,
            },
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
