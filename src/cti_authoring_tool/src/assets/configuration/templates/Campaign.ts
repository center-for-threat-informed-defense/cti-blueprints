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
    id: "a2d30a3c-49b5-42e5-a4cb-649009fa4c9d",
    name: "Campaign Report",
    keys: [
        "general.report_title"
    ],
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
