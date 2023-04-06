import { PropertyType } from "@/assets/scripts/AppConfiguration";

export const PrimaryThreatActorAttribution = {        
    id: "threat_actor", 
    name: "Threat Actor", 
    type: PropertyType.BasicTable, 
    layout: { 
        cols: 3, 
    },
    properties: [ 
        {        
            id: "threat_actor_name", 
            name: "Threat Actor", 
            type: PropertyType.String, 
            row: 0, 
            col: 1 
        }, 
        {        
            id: "threat_actor_alias", 
            name: "Aliases", 
            type: PropertyType.String, 
            row: 0, 
            col: [2,3] 
        }, 
    ] 
}
