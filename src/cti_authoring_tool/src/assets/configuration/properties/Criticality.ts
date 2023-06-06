import { PropertyType } from "@/assets/scripts/PageEditor";

export const Criticality = { 
    id: "criticality", 
    name: "Criticality", 
    path: "*.criticality",
    type: PropertyType.Enum,
    options: [ 
        { id: "fysa", text: "FYSA", value: "fysa" }, 
        { id: "low", text: "Low", value: "low" }, 
        { id: "medium", text: "Medium", value: "medium" }, 
        { id: "high", text: "High", value: "high" }, 
        { id: "critical", text: "Critical", value: "critical" }, 
    ] 
}
