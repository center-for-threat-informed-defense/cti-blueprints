import { Signatures } from "../properties/Signatures";

export const SignaturesSection = {
    name: "Tabes",
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
