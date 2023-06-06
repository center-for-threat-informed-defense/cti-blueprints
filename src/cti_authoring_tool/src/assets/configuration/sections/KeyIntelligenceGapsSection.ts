import { KeyIntelligenceGaps } from "../properties/KeyIntelligenceGaps";

export const KeyIntelligenceGapsSection = {
    id: "key_intelligence_gaps",
    name: "Key Intelligence Gaps",
    layout: {
        rows: 1,
        cols: 1
    },
    properties: [
        {
            ...KeyIntelligenceGaps,
            row: 1,
            col: 1
        }
    ]
}
