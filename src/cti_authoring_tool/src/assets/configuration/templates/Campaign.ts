import { IocsSection } from "../sections/IocsSection";
import { GeneralSection } from "../sections/GeneralSection";
import { TimelineSection } from "../sections/TimelineSection";
import { KeyPointsSection } from "../sections/KeyPointsSection";
import { AssessmentSection } from "../sections/AssessmentSection";
import { SignaturesSection } from "../sections/SignaturesSection";
import { DataSourcesSection } from "../sections/DataSourcesSection";
import { MitreAttackTableSection } from "../sections/MitreAttackTableSection";
import { ExecutiveSummarySection } from "../sections/ExecutiveSummarySection";
import { CampaignMetadataSection } from "../sections/CampaignMetadataSection";
import { KeyIntelligenceGapsSection } from "../sections/KeyIntelligenceGapsSection";
import { IntelligenceRequirementsSection } from "../sections/IntelligenceRequirementsSection";

export const Campaign: any = {
    id: "campaign_report",
    name: "Campaign Report",
    sections: [
        GeneralSection,
        ExecutiveSummarySection,
        KeyPointsSection,
        AssessmentSection,
        KeyIntelligenceGapsSection,
        MitreAttackTableSection,
        TimelineSection,
        IocsSection,
        SignaturesSection,
        IntelligenceRequirementsSection,
        DataSourcesSection,
        CampaignMetadataSection,
    ]
}
