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
    id: "intrusion_analysis_report",
    name: "Intrusion Analysis Report",
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
