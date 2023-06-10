import { PropertyType } from "@/assets/scripts/PageEditor";

export const ThreatActorMotivation = {
    id: "threat_actor_motivation",
    name: "Motivation",
    type: PropertyType.Enum,
    options: [
        { value: "Espionage", text: "Cyber Espionage" },
        { value: "Data Theft", text: "Data Theft" },
        { value: "Cyber Crime", text: "Cyber Crime" },
        { value: "Ransomware", text: "Ransomware" },
        { value: "Destructive Attack", text: "Destructive Attack" },
        { value: "Hacktivism", text: "Hacktivism" },
        { value: "Unknown", text: "Unknown" }
    ]
}
