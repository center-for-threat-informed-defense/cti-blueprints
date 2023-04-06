import { Feedback } from "../properties/Feedback";
import { PropertyType } from "@/assets/scripts/AppConfiguration";
import { IntelligenceGaps } from "../properties/IntelligenceGaps";
import { IntelligenceRequirements } from "../properties/IntelligenceRequirements";

export const Metadata = {
    name: "Metadata",
    layout: {
        rows: 3,
        cols: 1
    },
    properties: [
        {
            name: "Intelligence Requirements",
            type: PropertyType.BasicTable,
            row: 1,
            col: 1,
            layout: {
                cols: 1,
            },
            properties: [
                {
                    ...IntelligenceRequirements,
                    row: 0,
                    col: 1
                }
            ]
        },
        {
            ...IntelligenceGaps,
            row: 2,
            col: 1
        },
        {
            ...Feedback,
            row: 3,
            col: 1
        }
    ]
}
