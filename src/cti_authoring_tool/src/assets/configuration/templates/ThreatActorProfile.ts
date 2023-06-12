import { PluginType } from "@/assets/scripts/PageEditor";
import { IocsSection } from "../sections/IocsSection";
import { VictimsSection } from "../sections/VictimsSection";
import { GeneralSection } from "../sections/GeneralSection";
import { ImportCSVPlugin } from "../plugins/ImportCSVPlugin";
import { TimelineSection } from "../sections/TimelineSection";
import { KeyPointsSection } from "../sections/KeyPointsSection";
import { SignaturesSection } from "../sections/SignaturesSection";
import { TextMetricsPlugin } from "../plugins/TextMetricsPlugin";
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
            name: "Threat Actor Profile",
            ...GeneralSection
        },
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
    ],
    description: "Know: The Threat Actor Report is designed to be an encyclopedia for the organization for a given threat actor or category of activity. This report should be treated as a living document that should be maintained on a periodic basis by the intelligence team."
}
