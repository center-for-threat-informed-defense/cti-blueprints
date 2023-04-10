import { ThreatActorsTtp } from "../properties/ThreatActorsTtp";
import { ThreatActorVictims } from "../properties/ThreatActorVictims";
import { ThreatActorSummary } from "../properties/ThreatActorSummary";
import { ThreatActorAttribution } from "../properties/ThreatActorAttribution";
import { ThreatActorInfrastructure } from "../properties/ThreatActorInfrastructure";

export const ThreatActorSummarySection = {
    name: "Threat Actor Summary",
    layout: {
        rows: 5,
        cols: 1,
    },
    properties: [
        {
            ...ThreatActorSummary,
            row: 1,
            col: 1
        },
        {
            ...ThreatActorsTtp,
            row: 2,
            col: 1
        },
        {
            ...ThreatActorInfrastructure,
            row: 3,
            col: 1
        },
        {
            ...ThreatActorVictims,
            row: 4,
            col: 1
        },
        {
            ...ThreatActorAttribution,
            row: 5,
            col: 1
        }
    ]
}
