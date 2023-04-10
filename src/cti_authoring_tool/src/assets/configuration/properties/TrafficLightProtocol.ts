import { PropertyType } from "@/assets/scripts/AppConfiguration";

export const TrafficLightProtocol = { 
    id: "traffic_light_protocol", 
    name: "Traffic Light Protocol", 
    type: PropertyType.Enum, 
    options: [ 
        { id: "red", text: "Red", value: "red" }, 
        { id: "amber_strict", text: "Amber+Strict", value: "amber_strict" }, 
        { id: "amber", text: "Amber", value: "amber" }, 
        { id: "green", text: "Green", value: "green" }, 
        { id: "clear", text: "Clear", value: "clear" }, 
    ] 
}
