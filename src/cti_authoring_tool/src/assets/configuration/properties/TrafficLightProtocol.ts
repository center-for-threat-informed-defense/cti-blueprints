import { PropertyType } from "@/assets/scripts/PageEditor";

export const TrafficLightProtocol = { 
    id: "traffic_light_protocol", 
    name: "Traffic Light Protocol", 
    path: "*.traffic_light_protocol",
    type: PropertyType.Enum, 
    options: [ 
        { id: "red", text: "Red", value: "red" }, 
        { id: "amber_strict", text: "Amber+Strict", value: "amber_strict" }, 
        { id: "amber", text: "Amber", value: "amber" }, 
        { id: "green", text: "Green", value: "green" }, 
        { id: "clear", text: "Clear", value: "clear" }, 
    ] 
}
