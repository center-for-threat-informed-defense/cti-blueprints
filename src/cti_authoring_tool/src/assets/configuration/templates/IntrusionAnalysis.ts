import { PluginType } from "@/assets/scripts/PageEditor";
import { IocsSection } from "../sections/IocsSection";
import { GeneralSection } from "../sections/GeneralSection";
import { ImportCSVPlugin } from "../plugins/ImportCSVPlugin";
import { KeyPointsSection } from "../sections/KeyPointsSection";
import { TextMetricsPlugin } from "../plugins/TextMetricsPlugin";
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
            name: "Intrusion Analysis Report",
            ...GeneralSection
        },
        ExecutiveSummarySection,
        KeyPointsSection,
        IndicatorAnalysisSection,
        MitreAttackTableIaSection,
        IocsSection,
        SignaturesSection,
        IntelligenceRequirementsSection,
        DataSourcesSection,
        IntrusionAnalysisMetadataSection,
    ],
    description: "Find: The Intrusion Analysis Report is designed to be used in support of active hunting and incident response operations. This report should be treated as an iterative document that focuses more on speed to publication than completeness of information."
}
