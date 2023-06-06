import { Attribution } from "./Attribution";
import { IocMalwareName } from "./IocMalwareName";
import { PropertyType } from "@/assets/scripts/PageEditor";
import { SignatureDescription } from "./SignatureDescription";
import { ImportCSVPlugin } from "../plugins/ImportCSVPlugin";

export const Signatures = {
    id: "signatures",
    name: "Signatures",
    path: "*.signatures",
    type: PropertyType.ComplexTable,
    layout: {
        summary: "{{ attribution }}\n**{{ ioc_malware_name }}**",
        rows: 2,
        cols: 2
    },
    plugins: [
        { module: ImportCSVPlugin }
    ],
    properties: [
        {
            ...Attribution,
            row: 1,
            col: 1
        },
        {
            ...IocMalwareName,
            row: 1,
            col: 2
        },
        {
            ...SignatureDescription,
            row: 2,
            col: [1,2]
        }
    ]
}
