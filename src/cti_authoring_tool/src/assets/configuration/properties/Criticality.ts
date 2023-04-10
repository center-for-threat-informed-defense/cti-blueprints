import { PropertyType } from "@/assets/scripts/AppConfiguration";

export const Criticality = { 
    id: "criticality", 
    name: "Criticality", 
    type: PropertyType.Enum,
    options: [ 
        { id: "fysa", text: "FYSA", value: "fysa" }, 
        { id: "low", text: "Low", value: "low" }, 
        { id: "medium", text: "Medium", value: "medium" }, 
        { id: "high", text: "High", value: "high" }, 
        { id: "critical", text: "Critical", value: "critical" }, 
    ] 
}
