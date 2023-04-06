import { Cves } from "../properties/Cves";

export const CveSection = {
    name: "CVE",
    layout: {
        rows: 1,
        cols: 1
    },
    properties: [
        {
            ...Cves,
            row: 1,
            col: 1
        }
    ]
}
