import { Attribution } from "./Attribution";
import { IocMalwareName } from "./IocMalwareName";
import { PropertyType } from "@/assets/scripts/AppConfiguration";
import { SignatureDescription } from "./SignatureDescription";

export const Signatures = {
    id: "signatures",
    name: "Signatures",
    type: PropertyType.ComplexTable,
    layout: {
        summary: "{{ attribution }}\n**{{ ioc_malware_name }}**",
        rows: 2,
        cols: 2
    },
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
