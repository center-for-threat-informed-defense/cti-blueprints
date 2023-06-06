import { GeneralSection } from "../sections/GeneralSection";
import { OutlookSection } from "../sections/OutlookSection";
import { KeyPointsSection } from "../sections/KeyPointsSection";
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
    sections: [
        GeneralSection,
        ExecutiveSummarySection,
        KeyPointsSection,
        AssessmentSection,
        OutlookSection,
        KeyIntelligenceGapsSection,
        IntelligenceRequirementsSection,
        DataSourcesSection
    ],
}
