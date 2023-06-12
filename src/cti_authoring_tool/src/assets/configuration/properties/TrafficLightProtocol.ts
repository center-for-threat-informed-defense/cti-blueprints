import { PropertyType } from "@/assets/scripts/PageEditor";

export const TrafficLightProtocol = { 
    id: "traffic_light_protocol", 
    name: "Traffic Light Protocol", 
    path: "*.traffic_light_protocol",
    type: PropertyType.Enum, 
    options: [ 
        { value: "red", text: "Red" }, 
        { value: "amber_strict", text: "Amber+Strict" }, 
        { value: "amber", text: "Amber" }, 
        { value: "green", text: "Green" }, 
        { value: "clear", text: "Clear" }, 
    ] 
}
