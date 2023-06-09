import { PluginType } from "@/assets/scripts/PageEditor";
import { GeneralSection } from "../sections/GeneralSection";
import { OutlookSection } from "../sections/OutlookSection";
import { ImportCSVPlugin } from "../plugins/ImportCSVPlugin";
import { KeyPointsSection } from "../sections/KeyPointsSection";
import { TextMetricsPlugin } from "../plugins/TextMetricsPlugin";
import { AssessmentSection } from "../sections/AssessmentSection";
import { DataSourcesSection } from "../sections/DataSourcesSection";
import { ExecutiveSummarySection } from "../sections/ExecutiveSummarySection";
import { KeyIntelligenceGapsSection } from "../sections/KeyIntelligenceGapsSection";
import { IntelligenceRequirementsSection } from "../sections/IntelligenceRequirementsSection";

export const Executive: any = {
    id: "790fc5be-f24c-4fd7-a7e1-20a761c37812",
    name: "Executive Report",
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
            name: "Executive Report",
            ...GeneralSection
        },
        ExecutiveSummarySection,
        KeyPointsSection,
        AssessmentSection,
        OutlookSection,
        KeyIntelligenceGapsSection,
        IntelligenceRequirementsSection,
        DataSourcesSection
    ],
    description: "Inform: The Executive Report is designed to inform senior decision makers about a particular risk. This should be focused on executive audiences and in support of strategic problems. It will focus on why and how, rather than what and when."
}
