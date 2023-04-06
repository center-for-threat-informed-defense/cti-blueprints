
import { Body } from "../sections/Body";
import { General } from "../sections/General";
import { Metadata } from "../sections/Metadata";
import { CveSection } from "../sections/CveSection";
import { DataSources } from "../sections/DataSources";
import { AutomationTable } from "../sections/AutomationTable";
import { TimelineSection } from "../sections/TimelineTable";
import { IocMalwareSection } from "../sections/IocMalwareSection";
import { SignaturesSection } from "../sections/SignaturesSection";
import { IocNetworkSection } from "../sections/IocNetworkSection";
import { MITREAttackSection } from "../sections/MitreAttackSection";
import { SystemArtifactSection } from "../sections/SystemArtifactsSection";

export const IntrusionAnalysis: any = {
    id: "intrusion_analysis_report",
    name: "Intrusion Analysis Report",
    sections: [
        General,
        Body,
        MITREAttackSection,
        TimelineSection,
        CveSection,
        IocMalwareSection,
        IocNetworkSection,
        SystemArtifactSection,
        SignaturesSection,
        Metadata,
        DataSources,
        AutomationTable,
    ]
}
