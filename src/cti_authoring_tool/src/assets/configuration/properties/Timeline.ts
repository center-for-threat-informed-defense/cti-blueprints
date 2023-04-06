import { Country } from "./Country";
import { Industry } from "./Industry";
import { Activity } from "./Activity";
import { Timestamp } from "./Timestamp";
import { Techniques } from "./Techniques";
import { Attribution } from "./Attribution";
import { PropertyType } from "@/assets/scripts/AppConfiguration";

export const Timeline = {
    id: "timeline",
    name: "Timeline of Activity",
    type: PropertyType.ComplexTable,
    layout: {
        summary: "{{ attribution }}: {{ technique }}\n**{{ country }}: {{ industry }}**",
        rows: 5,
        cols: 2
    },
    properties: [
        {
            ...Attribution,
            row: 1,
            col: 1
        },
        {
            ...Timestamp,
            row: 1,
            col: 2
        },
        {
            ...Country,
            row: 2,
            col: [1, 2]
        },
        {
            ...Industry,
            row: 3,
            col: [1, 2]
        },
        {
            ...Techniques,
            row: 4,
            col: [1, 2]
        },
        {
            ...Activity,
            row: 5,
            col: [1, 2]
        },
    ]
}
