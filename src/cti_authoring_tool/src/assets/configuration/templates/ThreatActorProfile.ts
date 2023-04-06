
import { Body } from "../sections/Body";
import { General } from "../sections/General";
import { Metadata } from "../sections/Metadata";
import { CveSection } from "../sections/CveSection";
import { DataSources } from "../sections/DataSources";
import { ThreatActors } from "../sections/ThreatActorSummary";
import { AutomationTable } from "../sections/AutomationTable";
import { TimelineSection } from "../sections/TimelineTable";
import { IocMalwareSection } from "../sections/IocMalwareSection";
import { SignaturesSection } from "../sections/SignaturesSection";
import { IocNetworkSection } from "../sections/IocNetworkSection";
import { MITREAttackSection } from "../sections/MitreAttackSection";
import { SystemArtifactSection } from "../sections/SystemArtifactsSection";

export const ThreatActorProfile: any = {
    id: "threat_actor_profile",
    name: "Threat Actor Profile",
    sections: [
        General,
        Body,
        ThreatActors,
        AutomationTable,
        MITREAttackSection,
        TimelineSection,
        CveSection,
        IocMalwareSection,
        IocNetworkSection,
        SystemArtifactSection,
        SignaturesSection,
        Metadata,
        DataSources,
    ]
}
