import { IndicatorAnalysis } from "../properties/IndicatorAnalysis";

export const IndicatorAnalysisSection = {
    name: "Indicator Analysis",
    layout: {
        rows: 7,
        cols: 1
    },
    properties: [
        {
            ...IndicatorAnalysis,
            row: [1, 7],
            col: 1
        }
    ]
}