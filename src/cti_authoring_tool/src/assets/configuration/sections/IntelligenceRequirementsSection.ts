import { PropertyType } from "@/assets/scripts/AppConfiguration";
import { IntelligenceRequirement } from "../properties/IntelligenceRequirement";

export const IntelligenceRequirementsSection = {
    name: "Intelligence Requirements",
    layout: {
        rows: 1,
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
                    ...IntelligenceRequirement,
                    row: 0,
                    col: 1
                }
            ]
        }
    ]
}
