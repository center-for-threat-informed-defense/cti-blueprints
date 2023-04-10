import { Timeline } from "../properties/Timeline";

export const TimelineSection = {
    name: "Timeline of Activity",
    layout: {
        rows: 1,
        cols: 1
    },
    properties: [
        {
            ...Timeline,
            row: 1,
            col: 1,
        }
    ]
}
