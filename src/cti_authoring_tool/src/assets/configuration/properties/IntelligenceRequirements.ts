import { PropertyType } from "@/assets/scripts/AppConfiguration";

export const IntelligenceRequirements = {
    id: "intelligence_requirements",
    name: "Priority Intelligence Requirements",
    type: PropertyType.Enum,
    options: [
        { id: "Strat1", text: "S-TA-1 nation state activity related to China", value: "S-TA-1" },
        { id: "Strat2", text: "S-TA-2 nation state activity related to Russia", value: "S-TA-2" },
        { id: "Strat3", text: "S-TA-2 nation state activity related to Iran", value: "S-TA-3" },
        { id: "Strat4", text: "S-TA-2 nation state activity related to DPRK", value: "S-TA-4" },
        { id: "Op1", text: "OP-1 Operational Activity realted to Ransomware", value: "OP-1" },
        { id: "Op2", text: "OP-2 Operational Activity realted to Banking Trojans", value: "OP-2" },
        { id: "Op3", text: "OP-3 Operational Activity realted to Inital Access Brokers", value: "OP-3" },
        { id: "TAC1", text: "TAC-1 New technical developments related to intial access", value: "TAC-1" },
        { id: "TAC2", text: "TAC-2 New technical developments related to 0day vulnerabilities", value: "TAC-2" },
        { id: "TAC3", text: "TAC-3 New technical developments related to MFA bypass", value: "TAC-3" },
    ]
}
