import { ExecutiveSummary } from "../properties/ExecutiveSummary";

export const ExecutiveSummarySection = {
    id: "executive_summary",
    name: "Executive Summary",
    layout: {
        rows: 4,
        cols: 1
    },
    properties: [
        {
            ...ExecutiveSummary,
            row: [1, 4],
            col: 1
        }
    ]
}
