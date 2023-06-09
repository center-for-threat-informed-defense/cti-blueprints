import { Campaign } from "./templates/Campaign";
import { Executive } from "./templates/Executive";
import { AppConfiguration } from "@/assets/scripts/Application";
import { IntrusionAnalysis } from "./templates/IntrusionAnalysis";
import { ThreatActorProfile } from "./templates/ThreatActorProfile";

const config: AppConfiguration = {
    is_web_hosted: false,
    file_type_name: "CTI Template",
    file_type_extension: "json",
    branding: {
        product: "./product.png",
        organization: "./organization.png",
    },
    templates: [
        ThreatActorProfile,
        Campaign,
        IntrusionAnalysis,
        Executive
    ],
    menus: {
        help_menu: {
            help_links: [
                {
                    text: "GitHub Repository",
                    url: "https://github.com/center-for-threat-informed-defense/cti-blueprints"
                },
                {
                    text: "Change Log",
                    url: "https://github.com/center-for-threat-informed-defense/cti-blueprints/blob/main/src/cti_authoring_tool/CHANGELOG.md"
                }
            ]
        }
    }
}

export default config;
