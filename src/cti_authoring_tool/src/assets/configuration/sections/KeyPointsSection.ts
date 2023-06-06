import { KeyPoints } from "../properties/KeyPoints";

export const KeyPointsSection = {
    id: "key_points",
    name: "Key Points",
    layout: {
        rows: 4,
        cols: 1
    },
    properties: [
        {
            ...KeyPoints,
            row: [1, 4],
            col: 1
        }
    ]
}
