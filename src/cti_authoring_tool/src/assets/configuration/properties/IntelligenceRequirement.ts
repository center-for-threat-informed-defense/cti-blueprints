import { PropertyType } from "@/assets/scripts/PageEditor";

export const IntelligenceRequirement = {
    id: "intelligence_requirement",
    name: "Intelligence Requirement",
    type: PropertyType.Enum,
    options: [
        { value: "S-TA-1", text: "S-TA-1 Nation state activity related to China" },
        { value: "S-TA-2", text: "S-TA-2 Nation state activity related to Russia" },
        { value: "S-TA-3", text: "S-TA-2 Nation state activity related to Iran" },
        { value: "S-TA-4", text: "S-TA-2 Nation state activity related to DPRK" },
        { value: "OP-1",   text: "OP-1 Operational Activity related to Ransomware" },
        { value: "OP-2",   text: "OP-2 Operational Activity related to Banking Trojans" },
        { value: "OP-3",   text: "OP-3 Operational Activity related to Initial Access Brokers" },
        { value: "TAC-1",  text: "TAC-1 New technical developments related to initial access" },
        { value: "TAC-2",  text: "TAC-2 New technical developments related to 0day vulnerabilities" },
        { value: "TAC-3",  text: "TAC-3 New technical developments related to MFA bypass" },
    ]
}
