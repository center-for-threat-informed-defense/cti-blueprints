import { IocsSection } from "../sections/IocsSection";
import { GeneralSection } from "../sections/GeneralSection";
import { KeyPointsSection } from "../sections/KeyPointsSection";
import { SignaturesSection } from "../sections/SignaturesSection";
import { DataSourcesSection } from "../sections/DataSourcesSection";
import { ExecutiveSummarySection } from "../sections/ExecutiveSummarySection";
import { IndicatorAnalysisSection } from "../sections/IndicatorAnalysisSection";
import { MitreAttackTableIaSection } from "../sections/MitreAttackTableIaSection";
import { IntelligenceRequirementsSection } from "../sections/IntelligenceRequirementsSection";
import { IntrusionAnalysisMetadataSection } from "../sections/IntrusionAnalysisMetadataSection";

export const IntrusionAnalysis: any = {
    id: "99664720-25a7-474f-b4ea-a6db68039203",
    name: "Intrusion Analysis Report",
    keys: [
        "general.report_title"
    ],
    sections: [
        GeneralSection,
        ExecutiveSummarySection,
        KeyPointsSection,
        IndicatorAnalysisSection,
        MitreAttackTableIaSection,
        IocsSection,
        SignaturesSection,
        IntelligenceRequirementsSection,
        DataSourcesSection,
        IntrusionAnalysisMetadataSection,
    ]
}
