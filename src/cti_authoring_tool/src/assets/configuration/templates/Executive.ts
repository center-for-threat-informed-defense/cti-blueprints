import { GeneralSection } from "../sections/GeneralSection";
import { OutlookSection } from "../sections/OutlookSection";
import { KeyPointsSection } from "../sections/KeyPointsSection";
import { AssessmentSection } from "../sections/AssessmentSection";
import { DataSourcesSection } from "../sections/DataSourcesSection";
import { ExecutiveSummarySection } from "../sections/ExecutiveSummarySection";
import { KeyIntelligenceGapsSection } from "../sections/KeyIntelligenceGapsSection";
import { IntelligenceRequirementsSection } from "../sections/IntelligenceRequirementsSection";

export const Executive: any = {
    id: "executive_report",
    name: "Executive Report",
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
