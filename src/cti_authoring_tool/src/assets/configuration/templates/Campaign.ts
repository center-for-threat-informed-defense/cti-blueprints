import { PluginType } from "@/assets/scripts/PageEditor";
import { IocsSection } from "../sections/IocsSection";
import { GeneralSection } from "../sections/GeneralSection";
import { TimelineSection } from "../sections/TimelineSection";
import { ImportCSVPlugin } from "../plugins/ImportCSVPlugin";
import { KeyPointsSection } from "../sections/KeyPointsSection";
import { TextMetricsPlugin } from "../plugins/TextMetricsPlugin";
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
    plugins: {
        global: {
            [PluginType.StringProperty]: [
                { module: TextMetricsPlugin }
            ],
            [PluginType.BasicTableProperty]: [
                { module: ImportCSVPlugin }
            ],
            [PluginType.ComplexTableProperty]: [
                { module: ImportCSVPlugin }
            ]
        }
    },
    sections: [
        {
            name: "Campaign Report",
            ...GeneralSection
        },
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
    ],
    description: "Change: The Campaign Report is designed to highlight new information related to a threat actor or capabilities. This should focus on new information and highlight how it poses a changed risk to your organization."
}
