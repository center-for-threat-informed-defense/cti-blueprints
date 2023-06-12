import { PropertyType } from "@/assets/scripts/PageEditor";
import { ThreatActorName } from "./ThreatActorName";
import { ThreatActorAliases } from "./ThreatActorAliases";

export const ThreatActorAttributions = {        
    id: "threat_actors", 
    name: "Threat Actors", 
    type: PropertyType.BasicTable, 
    layout: { 
        cols: 3, 
    },
    properties: [ 
        {        
            ...ThreatActorName,
            row: 0, 
            col: 1 
        },
        {
            ...ThreatActorAliases,
            row: 0,
            col: [2, 3]
        }
    ] 
}
