import { PropertyType } from "@/assets/scripts/PageEditor";

export const NetworkIntrusionPhase = {       
    id: "network_intrusion_phase",
    name: "Intrusion Phase",
    type: PropertyType.Enum,
    options: [
        { id: "TA0001", text: "Initial Access", value: "TA0001" },
        { id: "TA0011", text: "Command and Control", value: "TA0011" },
        { id: "TA0010", text: "Exfiltration", value: "TA0010" },
    ]
}
