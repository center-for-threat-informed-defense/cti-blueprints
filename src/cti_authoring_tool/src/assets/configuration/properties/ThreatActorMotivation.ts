import { PropertyType } from "@/assets/scripts/PageEditor";

export const ThreatActorMotivation = {
    id: "threat_actor_motivation",
    name: "Motivation",
    type: PropertyType.Enum,
    options: [
        { id: "Espionage", text: "Cyber Espionage", value: "Espionage" },
        { id: "Data Theft", text: "Data Theft", value: "Data Theft" },
        { id: "Cyber Crime", text: "Cyber Crime", value: "Cyber Crime" },
        { id: "Ransomware", text: "Ransomware", value: "Ransomware" },
        { id: "Destructive Attack", text: "Destructive Attack", value: "Destructive Attack" },
        { id: "Hacktivism", text: "Hacktivism", value: "Hacktivism" },
        { id: "Unknown", text: "Unknown", value: "Unknown" }
    ]
}
