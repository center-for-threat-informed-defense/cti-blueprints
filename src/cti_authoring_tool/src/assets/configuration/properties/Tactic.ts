import { PropertyType } from "@/assets/scripts/PageEditor";

export const Tactic = {        
    id: "tactic", 
    name: "Tactic", 
    type: PropertyType.Enum, 
    options: [
        { value: "TA0001", text: "TA0001 - Initial Access" },
        { value: "TA0002", text: "TA0002 - Execution" },
        { value: "TA0003", text: "TA0003 - Persistence" },
        { value: "TA0004", text: "TA0004 - Privilege Escalation" },
        { value: "TA0005", text: "TA0005 - Defense Evasion" },
        { value: "TA0006", text: "TA0006 - Credential Access" },
        { value: "TA0007", text: "TA0007 - Discovery" },
        { value: "TA0008", text: "TA0008 - Lateral Movement" },
        { value: "TA0009", text: "TA0009 - Collection" },
        { value: "TA0010", text: "TA0010 - Exfiltration" },
        { value: "TA0011", text: "TA0011 - Command and Control" },
        { value: "TA0040", text: "TA0040 - Impact" }
    ]
}
