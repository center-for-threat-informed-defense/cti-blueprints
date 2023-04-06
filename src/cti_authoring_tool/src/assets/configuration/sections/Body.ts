import { KeyPoints } from "../properties/KeyPoints";
import { ExecutiveSummary } from "../properties/ExecutiveSummary";
import { IntelligenceAssessment } from "../properties/IntelligenceAssessment";

export const Body = {
    name: "Body",
    layout: {
        rows: 15,
        cols: 1
    },
    properties: [
        {
            ...ExecutiveSummary,
            row: [1, 4],
            col: 1
        },
        {
            ...KeyPoints,
            row: [5, 8],
            col: 1
        },
        {
            ...IntelligenceAssessment,
            row: [9, 15],
            col: 1
        },
    ]
}
