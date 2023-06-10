import { PropertyType } from "@/assets/scripts/PageEditor";

export const Criticality = { 
    id: "criticality", 
    name: "Criticality", 
    path: "*.criticality",
    type: PropertyType.Enum,
    options: [ 
        { value: "fysa", text: "FYSA" }, 
        { value: "low", text: "Low" }, 
        { value: "medium", text: "Medium" }, 
        { value: "high", text: "High" }, 
        { value: "critical", text: "Critical" }, 
    ] 
}
