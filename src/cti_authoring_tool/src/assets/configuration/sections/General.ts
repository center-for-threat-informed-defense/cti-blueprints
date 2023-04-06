import { Criticality } from "../properties/Criticality";
import { ReportTitle } from "../properties/ReportTitle";
import { Sensitivity } from "../properties/Sensitivity";
import { ReportNumber } from "../properties/ReportNumber";
import { TrafficLightProtocol } from "../properties/TrafficLightProtocol";

export const General = {
    name: "General",
    layout: {
        rows: 2,
        cols: 3
    },
    properties: [
        {
            ...ReportTitle,
            row: 1,
            col: [1, 2]
        },
        {
            ...ReportNumber,
            row: 1,
            col: 3
        },
        {
            ...Sensitivity,
            row: 2,
            col: 2
        },
        {
            ...TrafficLightProtocol,
            row: 2,
            col: 3
        },
        {
            ...Criticality,
            row: 2,
            col: 1,
        }
    ],
    is_primary: true
}
