import { Sector } from "./Sector";
import { VictimName } from "./VictimName";
import { DateReported } from "./DateReported";
import { PropertyType } from "@/assets/scripts/AppConfiguration";
import { LocationRegion } from "./LocationRegion";
import { LocationGranular } from "./LocationGranular";

export const Victims = {
    id: "victims",
    name: "Victims",
    type: PropertyType.ComplexTable,
    layout: {
        summary: "{{ victim_name }}\n**{{ location_region }} :: {{ sector }}**",
        rows: 3,
        cols: 2
    },
    properties: [
        {
            ...VictimName,
            row: 1,
            col: 1
        },
        {
            ...DateReported,
            row: 1,
            col: 2
        },
        {
            ...Sector,
            row: 2,
            col: [1,2]
        },
        {

            ...LocationGranular,
            id: "location_granular",
            name: "City / State / Province / etc.",
            row: 3,
            col: 1
        },
        {
            ...LocationRegion,
            id: "location_region",
            name: "Country / Region",
            row: 3,
            col: 2
        }
    ]
}
