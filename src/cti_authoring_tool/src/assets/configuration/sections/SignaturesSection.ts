import { Signatures } from "../properties/Signatures";

export const SignaturesSection = {
    id: "signatures",
    name: "Signatures",
    layout: {
        rows: 1,
        cols: 1
    },
    properties: [
        {
            ...Signatures,
            row: 1,
            col: 1
        }
    ]
}
