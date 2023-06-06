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
    id: "e4e907ac-f845-4b51-a73f-ab511456ce74",
    name: "Threat Actor Profile",
    keys: [
        "general.report_title"
    ],
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
