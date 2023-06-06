import { PropertyType } from "@/assets/scripts/PageEditor";
import { ThreatActorName } from "./ThreatActorName";
import { ThreatActorAliases } from "./ThreatActorAliases";
import { ImportCSVPlugin } from "../plugins/ImportCSVPlugin";

export const ThreatActorAttributions = {        
    id: "threat_actors", 
    name: "Threat Actors", 
    type: PropertyType.BasicTable, 
    layout: { 
        cols: 3, 
    },
    plugins: [
        { module: ImportCSVPlugin }
    ],
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
