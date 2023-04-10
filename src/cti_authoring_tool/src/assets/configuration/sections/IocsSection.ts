import { Cves } from "../properties/Cves";
import { IocsMalware } from "../properties/IocsMalware";
import { IocsNetwork } from "../properties/IocsNetwork";
import { SystemArtifacts } from "../properties/SystemArtifacts";

export const IocsSection = {
    name: "Indicators of Compromise for Hunting",
    layout: {
        rows: 4,
        cols: 1
    },
    properties: [
        {
            ...IocsMalware,
            row: 1,
            col: 1
        },
        {
            ...IocsNetwork,
            row: 2,
            col: 1
        },
        {
            ...SystemArtifacts,
            row: 3,
            col: 1
        },
        {
            ...Cves,
            row: 4,
            col: 1
        }
    ]
}
