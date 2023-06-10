import { PropertyType } from "@/assets/scripts/PageEditor";

export const NetworkIntrusionPhase = {       
    id: "network_intrusion_phase",
    name: "Intrusion Phase",
    type: PropertyType.Enum,
    options: [
        { value: "TA0001", text: "Initial Access" },
        { value: "TA0011", text: "Command and Control" },
        { value: "TA0010", text: "Exfiltration" },
    ]
}
