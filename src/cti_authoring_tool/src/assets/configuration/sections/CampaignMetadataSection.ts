import { Sector } from "../properties/Sector";
import { PropertyType } from "@/assets/scripts/PageEditor";
import { LocationRegion } from "../properties/LocationRegion";
import { Infrastructure } from "../properties/Infrastructure";
import { ImportCSVPlugin } from "../plugins/ImportCSVPlugin";
import { ThreatActorMotivation } from "../properties/ThreatActorMotivation";
import { ThreatActorAttributions } from "../properties/ThreatActorAttributions";

export const CampaignMetadataSection = {
    id: "metadata",
    name: "Metadata",
    path: "*.metadata",
    layout: {
        rows: 5,
        cols: 1
    },
    properties: [
        {
            ...ThreatActorAttributions,
            row: 1,
            col: 1
        },
        {
            id: "victim_location",
            name: "Victim Location",
            type: PropertyType.BasicTable,
            row: 2,
            col: 1,
            layout: {
                cols: 1  
            },
            plugins: [
                { module: ImportCSVPlugin }
            ],
            properties: [
                {
                    ...LocationRegion,
                    row: 0,
                    col: 1
                }
            ]
        },
        {
            id: "sectors",
            name: "Sectors",
            type: PropertyType.BasicTable,
            row: 3,
            col: 1,
            layout: {
                cols: 1
            },
            plugins: [
                { module: ImportCSVPlugin }
            ],
            properties: [
                {
                    ...Sector,
                    row: 0,
                    col: 1
                }
            ]
        },
        {
            id: "infrastructure_used",
            name: "Infrastructure Used",
            type: PropertyType.BasicTable,
            row: 4,
            col: 1,
            layout: {
                cols: 1
            },
            plugins: [
                { module: ImportCSVPlugin }
            ],
            properties: [
                {
                    ...Infrastructure,
                    row: 0,
                    col: 1
                }
            ]
        },
        {
            id: "threat_actor_motivation",
            name: "Threat Actor Motivation",
            type: PropertyType.BasicTable,
            row: 5,
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
