import { Assessment } from "../properties/Assessment";

export const AssessmentSection = {
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
