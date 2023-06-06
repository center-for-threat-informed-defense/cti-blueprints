import { Assessment } from "../properties/Assessment";

export const AssessmentSection = {
    id: "assessment",
    name: "Assessment",
    layout: {
        rows: 7,
        cols: 1
    },
    properties: [
        {
            ...Assessment,
            row: [1, 7],
            col: 1
        }
    ]
}
