import { IocNetwork } from "../properties/IocNetwork";

export const IocNetworkSection = {
    name: "IOC Network",
    layout: {
        rows: 1,
        cols: 1
    },
    properties: [
        {
            ...IocNetwork,
            row: 1,
            col: 1
        }
    ]
}
