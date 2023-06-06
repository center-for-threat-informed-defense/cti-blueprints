import { IntelligenceRequirements } from "../properties/IntelligenceRequirements";

export const IntelligenceRequirementsSection = {
    id: "intelligence_requirements",
    name: "Intelligence Requirements",
    layout: {
        rows: 1,
        cols: 1
    },
    properties: [
        {
            row: 1,
            col: 1,
            ...IntelligenceRequirements
        }
    ]
}
