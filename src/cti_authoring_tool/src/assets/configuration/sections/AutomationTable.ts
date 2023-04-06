import { Country } from "../properties/Country";
import { Industry } from "../properties/Industry";
import { PropertyType } from "@/assets/scripts/AppConfiguration";
import { ThreatActorMotivation } from "../properties/ThreatActorMotivation";
import { PrimaryThreatActorAttribution } from "../properties/PrimaryThreatActorAttribution";

export const AutomationTable = {
    name: "Automation Table",
    layout: {
        rows: 4,
        cols: 1
    },
    properties: [
        {
            ...PrimaryThreatActorAttribution,
            row: 1,
            col: 1
        },
        {
            name: "Victim Country",
            type: PropertyType.BasicTable,
            row: 2,
            col: 1,
            layout: {
                cols: 1  
            },
            properties: [
                {
                    ...Country,
                    row: 0,
                    col: 1
                }
            ]
        },
        {
            name: "Victim Industry",
            type: PropertyType.BasicTable,
            row: 3,
            col: 1,
            layout: {
                cols: 1
            },
            properties: [
                {
                    ...Industry,
                    row: 0,
                    col: 1
                }
            ]
        },
        {
            name: "Threat Actor Motivation",
            type: PropertyType.BasicTable,
            row: 4,
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
