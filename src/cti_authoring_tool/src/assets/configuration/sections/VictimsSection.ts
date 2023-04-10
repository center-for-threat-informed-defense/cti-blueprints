import { Victims } from "../properties/Victims";

export const VictimsSection = {
    name: "Victims",
    layout: {
        rows: 1,
        cols: 1
    },
    properties: [
        {
            ...Victims,
            row: 1,
            col: 1
        }
    ]
}
