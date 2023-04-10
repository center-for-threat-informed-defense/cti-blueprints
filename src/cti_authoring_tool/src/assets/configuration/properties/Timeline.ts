import { Sector } from "./Sector";
import { Activity } from "./Activity";
import { Attribution } from "./Attribution";
import { PropertyType } from "@/assets/scripts/AppConfiguration";
import { LocationRegion } from "./LocationRegion";
import { TimelineEndDate } from "./TimelineEndDate";
import { TimelineStartDate } from "./TimelineStartDate";

export const Timeline = {
    id: "timeline",
    name: "Timeline of Activity",
    type: PropertyType.ComplexTable,
    layout: {
        summary: "{{ attribution }}\n**{{ location }} :: {{ sector }}**",
        rows: 4,
        cols: 3
    },
    properties: [
        {
            ...Attribution,
            row: 1,
            col: 1
        },
        {
            ...TimelineStartDate,
            row: 1,
            col: 2
        },
        {
            ...TimelineEndDate,
            row: 1,
            col: 3
        },
        {
            ...LocationRegion,
            row: 2,
            col: [1, 3]
        },
        {
            ...Sector,
            row: 3,
            col: [1, 3]
        },
        {
            ...Activity,
            row: 4,
            col: [1, 3]
        },
    ]
}
