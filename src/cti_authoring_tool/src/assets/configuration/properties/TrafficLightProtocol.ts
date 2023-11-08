import { PropertyType } from "@/assets/scripts/PageEditor";

export const TrafficLightProtocol = { 
    id: "traffic_light_protocol", 
    name: "Traffic Light Protocol", 
    path: "*.traffic_light_protocol",
    type: PropertyType.Enum, 
    options: [ 
        { value: "red", text: "RED" }, 
        { value: "amber_strict", text: "AMBER+STRICT" }, 
        { value: "amber", text: "AMBER" }, 
        { value: "green", text: "GREEN" }, 
        { value: "clear", text: "CLEAR" }, 
    ] 
}
