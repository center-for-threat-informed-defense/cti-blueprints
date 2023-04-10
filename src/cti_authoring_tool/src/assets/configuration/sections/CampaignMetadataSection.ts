import { Sector } from "../properties/Sector";
import { PropertyType } from "@/assets/scripts/AppConfiguration";
import { LocationRegion } from "../properties/LocationRegion";
import { ThreatActorMotivation } from "../properties/ThreatActorMotivation";
import { ThreatActorAttributions } from "../properties/ThreatActorAttributions";
import { Infrastructure } from "../properties/Infrastructure";

export const CampaignMetadataSection = {
    name: "Metadata",
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
            name: "Victim Location",
            type: PropertyType.BasicTable,
            row: 2,
            col: 1,
            layout: {
                cols: 1  
            },
            properties: [
                {
                    ...LocationRegion,
                    row: 0,
                    col: 1
                }
            ]
        },
        {
            name: "Sectors",
            type: PropertyType.BasicTable,
            row: 3,
            col: 1,
            layout: {
                cols: 1
            },
            properties: [
                {
                    ...Sector,
                    row: 0,
                    col: 1
                }
            ]
        },
        {
            name: "Infrastructure Used",
            type: PropertyType.BasicTable,
            row: 4,
            col: 1,
            layout: {
                cols: 1
            },
            properties: [
                {
                    ...Infrastructure,
                    row: 0,
                    col: 1
                }
            ]
        },
        {
            name: "Threat Actor Motivation",
            type: PropertyType.BasicTable,
            row: 5,
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
