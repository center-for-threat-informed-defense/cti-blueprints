import { PropertyType } from "@/assets/scripts/PageEditor";
import { IntelligenceRequirement } from "./IntelligenceRequirement";

export const IntelligenceRequirements = {
    id: "intelligence_requirements",
    name: "Intelligence Requirements",
    path: "*.intelligence_requirements",
    type: PropertyType.BasicTable,
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
