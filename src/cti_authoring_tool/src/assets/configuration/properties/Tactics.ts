import { PropertyType } from "@/assets/scripts/AppConfiguration";

export const Tactics = {        
    id: "tactics", 
    name: "Tactics", 
    type: PropertyType.Enum, 
    options: [ 
        { id: "TA0001", text: "Initial Access - TA0001", value: "TA0001" },
        { id: "TA0002", text: "Execution - TA0002", value: "TA0002" },
        { id: "TA0003", text: "Persistence - TA0003", value: "TA0003" },
        { id: "TA0004", text: "Privilege Escalation - TA0004", value: "TA0004" },
        { id: "TA0005", text: "Defense Evasion - TA0005", value: "TA0005" },
        { id: "TA0006", text: "Credential Access - TA0006", value: "TA0006" },
        { id: "TA0007", text: "Discovery - TA0007", value: "TA0007" },
        { id: "TA0008", text: "Lateral Movement - TA0008", value: "TA0008" },
        { id: "TA0009", text: "Collection - TA0009", value: "TA0009" },
        { id: "TA0011", text: "Command and Control - TA0011", value: "TA0011" },
        { id: "TA0010", text: "Exfiltration - TA0010", value: "TA0010" },
        { id: "TA0040", text: "Impact - TA0040", value: "TA0040" }
    ] 
}
