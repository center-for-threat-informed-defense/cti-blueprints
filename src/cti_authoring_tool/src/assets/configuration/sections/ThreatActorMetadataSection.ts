import { Sector } from "../properties/Sector";
import { PropertyType } from "@/assets/scripts/AppConfiguration";
import { LocationRegion } from "../properties/LocationRegion";
import { Infrastructure } from "../properties/Infrastructure";
import { ThreatActorName } from "../properties/ThreatActorName";
import { ThreatActorAliases } from "../properties/ThreatActorAliases";
import { ThreatActorMotivation } from "../properties/ThreatActorMotivation";

export const ThreatActorMetadataSection = {
    name: "Metadata",
    layout: {
        rows: 5,
        cols: 3
    },
    properties: [
        {
            ...ThreatActorName,
            row: 1,
            col: 1
        },
        {
            ...ThreatActorAliases,
            row: 1,
            col: [2,3]
        },
        {
            name: "Victim Location",
            type: PropertyType.BasicTable,
            row: 2,
            col: [1, 3],
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
            col: [1, 3],
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
            col: [1, 3],
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
            col: [1, 3],
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
