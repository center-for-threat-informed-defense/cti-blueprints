import { IocsSection } from "../sections/IocsSection";
import { VictimsSection } from "../sections/VictimsSection";
import { GeneralSection } from "../sections/GeneralSection";
import { TimelineSection } from "../sections/TimelineSection";
import { KeyPointsSection } from "../sections/KeyPointsSection";
import { SignaturesSection } from "../sections/SignaturesSection";
import { AssessmentSection } from "../sections/AssessmentSection";
import { DataSourcesSection } from "../sections/DataSourcesSection";
import { MitreAttackTableSection } from "../sections/MitreAttackTableSection";
import { ExecutiveSummarySection } from "../sections/ExecutiveSummarySection";
import { ThreatActorSummarySection } from "../sections/ThreatActorSummarySection";
import { ThreatActorMetadataSection } from "../sections/ThreatActorMetadataSection";
import { KeyIntelligenceGapsSection } from "../sections/KeyIntelligenceGapsSection";
import { IntelligenceRequirementsSection } from "../sections/IntelligenceRequirementsSection";

export const ThreatActorProfile: any = {
    id: "threat_actor_profile",
    name: "Threat Actor Profile",
    sections: [
        GeneralSection,
        ExecutiveSummarySection,
        KeyPointsSection,
        AssessmentSection,
        ThreatActorSummarySection,
        TimelineSection,
        KeyIntelligenceGapsSection,
        MitreAttackTableSection,
        VictimsSection,
        IocsSection,
        SignaturesSection,
        IntelligenceRequirementsSection,
        DataSourcesSection,
        ThreatActorMetadataSection,
    ]
}
