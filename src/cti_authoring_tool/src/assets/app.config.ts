import { AppConfiguration, PropertyType } from "./scripts/AppConfiguration";

const config: AppConfiguration = {
    is_web_hosted: false,
    file_type_name: "CTI Template",
    file_type_extension: "json",
    templates: [
        {
            id: "intrusion_analysis",
            name: "Intrusion Analysis",
            sections: [
                {
                    id: "general",
                    name: "General",
                    rows: 2,
                    cols: 3,
                    properties: [
                        {       
                            id: "report_title",
                            name: "Report Title",
                            type: PropertyType.String,
                            row: 1,
                            col: [1,3],
                            is_primary: true
                        },
                        {
                            id: "report_number",
                            name: "Report Number",
                            type: PropertyType.String,
                            row: 1,
                            col: 3
                        },
                        {
                            id: "date_of_report",
                            name: "Date of Report",
                            type: PropertyType.String,
                            row: 2,
                            col: 1
                        },
                        {
                            id: "date_of_intrusion_discovery",
                            name: "Date of Intrusion Discovery",
                            type: PropertyType.String,
                            row: 2,
                            col: 2,
                        },
                        {
                            id: "traffic_light_protocol",
                            name: "Traffic Light Protocol",
                            type: PropertyType.String,
                            row: 2,
                            col: 3,
                        },
                    ],
                    is_primary: true
                },
                {
                    id: "data_sources",
                    name: "Data Sources",
                    rows: 2,
                    cols: 1,
                    properties: [
                        {       
                            id: "data_sources_external_cti_reports",
                            name: "Data Sources - External CTI Reports",
                            type: PropertyType.Table,
                            row: 1,
                            col: 1,
                            table_columns: {
                                number: 3,
                                properties: [
                                    {       
                                        id: "description",
                                        name: "Description",
                                        type: PropertyType.String,
                                        row: 1,
                                        col: [1,3]
                                    },
                                    {       
                                        id: "hyperlink",
                                        name: "Hyperlink",
                                        type: PropertyType.String,
                                        row: 1,
                                        col: 3
                                    },
                                ]
                            }
                        },
                        {       
                            id: "data_sources_internal_telemetry",
                            name: "Data Sources - Internal Telemetry",
                            type: PropertyType.Table,
                            row: 2,
                            col: 1,
                            table_columns: {
                                number: 1,
                                properties: [
                                    {       
                                        id: "description",
                                        name: "Description",
                                        type: PropertyType.String,
                                        row: 1,
                                        col: 1
                                    }
                                ]
                            }
                        },
                    ]
                },
                {
                    id: "threat_actor",
                    name: "Threat Actor",
                    rows: 3,
                    cols: 3,
                    properties: [
                        {       
                            id: "primary_threat_actor",
                            name: "Primary Threat Actor",
                            type: PropertyType.String,
                            row: 1,
                            col: 1
                        },
                        {       
                            id: "primary_threat_actor_context",
                            name: "Context",
                            type: PropertyType.String,
                            row: 1,
                            col: [2,4]
                        },
                        
                        {       
                            id: "actor_motivation",
                            name: "Actor Motivation",
                            type: PropertyType.String,
                            row: 2,
                            col: 1
                        },
                        {       
                            id: "actor_motivation_context",
                            name: "Context",
                            type: PropertyType.String,
                            row: 2,
                            col: [2,4]
                        },
                        {       
                            id: "threat_actor_aliases",
                            name: "Actor Aliases",
                            type: PropertyType.Table,
                            row: 3,
                            col: [1,4],
                            table_columns: {
                                number: 1,
                                properties: [
                                    {       
                                        id: "alias",
                                        name: "Alias",
                                        type: PropertyType.String,
                                        row: 1,
                                        col: 1
                                    }
                                ]
                            }
                        }
                    ]
                },
                {
                    id: "malware",
                    name: "Malware",
                    rows: 1,
                    cols: 1,
                    properties: [
                        {       
                            id: "malware_tools",
                            name: "Malware Tools",
                            type: PropertyType.Table,
                            row: 1,
                            col: 1,
                            table_columns: {
                                number: 1,
                                properties: [
                                    {       
                                        id: "description",
                                        name: "Description",
                                        type: PropertyType.String,
                                        row: 1,
                                        col: 1
                                    }
                                ]
                            }
                        },
                    ]
                },
                {
                    id: "organization",
                    name: "Organization",
                    rows: 1,
                    cols: 1,
                    properties: [
                        {       
                            id: "organizational_impact",
                            name: "Organizational Impact",
                            type: PropertyType.String,
                            row: 1,
                            col: 1
                        },
                    ]
                },
                {
                    id: "summary",
                    name: "Summary",
                    rows: 1,
                    cols: 1,
                    properties: [
                        {       
                            id: "executive_summary",
                            name: "Executive Summary",
                            type: PropertyType.String,
                            row: 1,
                            col: 1
                        },
                    ]
                },
                {
                    id: "key_points",
                    name: "Key Points",
                    rows: 1,
                    cols: 1,
                    properties: [
                        {       
                            id: "key_points",
                            name: "Key Points",
                            type: PropertyType.Table,
                            row: 1,
                            col: 1,
                            table_columns: {
                                number: 1,
                                properties: [
                                    {       
                                        id: "summary",
                                        name: "Summary",
                                        type: PropertyType.String,
                                        row: 1,
                                        col: 1
                                    }
                                ]
                            }
                        },
                    ]
                },
                {
                    id: "intrusion_analysis",
                    name: "Intrusion Analysis",
                    rows: 1,
                    cols: 1,
                    properties: [
                        {       
                            id: "intrusion_analysis",
                            name: "Intrusion Analysis",
                            type: PropertyType.String,
                            row: 1,
                            col: 1
                        },
                    ]
                },
                {
                    id: "tables",
                    name: "Tabes",
                    rows: 3,
                    cols: 1,
                    properties: [
                        {       
                            id: "mitre_attack_table_observed",
                            name: "MITRE ATT&CK Table",
                            type: PropertyType.Table,
                            row: 1,
                            col: 1,
                            table_columns: {
                                number: 4,
                                properties: [
                                    {       
                                        id: "tactics",
                                        name: "Tactics",
                                        type: PropertyType.String,
                                        row: 1,
                                        col: 1
                                    },
                                    {       
                                        id: "technique",
                                        name: "Technique",
                                        type: PropertyType.String,
                                        row: 1,
                                        col: 2
                                    },
                                    {       
                                        id: "procedure",
                                        name: "Procedure",
                                        type: PropertyType.String,
                                        row: 1,
                                        col: 3
                                    },
                                    {       
                                        id: "control",
                                        name: "Control",
                                        type: PropertyType.String,
                                        row: 1,
                                        col: 4
                                    }
                                ]
                            }
                        },
                        {       
                            id: "cve",
                            name: "Common Vulnerabilities and Exposures (CVE)",
                            type: PropertyType.Table,
                            row: 2,
                            col: 1,
                            table_columns: {
                                number: 3,
                                properties: [
                                    {       
                                        id: "cve_number",
                                        name: "CVE Number",
                                        type: PropertyType.String,
                                        row: 1,
                                        col: 1
                                    },
                                    {       
                                        id: "status",
                                        name: "Status",
                                        type: PropertyType.String,
                                        row: 1,
                                        col: 2
                                    },
                                    {       
                                        id: "date_number",
                                        name: "Date Number",
                                        type: PropertyType.String,
                                        row: 1,
                                        col: 3
                                    }
                                ]
                            }
                        },
                        {       
                            id: "iocs",
                            name: "Indicators of Compromise",
                            type: PropertyType.Table,
                            row: 3,
                            col: 1,
                            table_columns: {
                                number: 4,
                                properties: [
                                    {       
                                        id: "file_name",
                                        name: "File Name",
                                        type: PropertyType.String,
                                        row: 1,
                                        col: 1
                                    },
                                    {       
                                        id: "details",
                                        name: "Details",
                                        type: PropertyType.String,
                                        row: 1,
                                        col: 2
                                    },
                                    {       
                                        id: "kill_chain_phase",
                                        name: "Kill Chain Phase",
                                        type: PropertyType.String,
                                        row: 1,
                                        col: 3
                                    },
                                    {       
                                        id: "date_observed",
                                        name: "Date Observed",
                                        type: PropertyType.String,
                                        row: 1,
                                        col: 4
                                    }
                                ]
                            }
                        },
                    ]
                },
                {
                    id: "intelligence_assessment",
                    name: "Intelligence Assessment",
                    rows: 2,
                    cols: 1,
                    properties: [
                        {       
                            id: "intelligence_assessment",
                            name: "Intelligence Assessment",
                            type: PropertyType.String,
                            row: 1,
                            col: 1
                        },
                        {       
                            id: "mitre_attack_table",
                            name: "MITRE ATT&CK Table",
                            type: PropertyType.Table,
                            row: 2,
                            col: 1,
                            table_columns: {
                                number: 4,
                                properties: [
                                    {       
                                        id: "tactics",
                                        name: "Tactics",
                                        type: PropertyType.String,
                                        row: 1,
                                        col: 1
                                    },
                                    {       
                                        id: "technique",
                                        name: "Technique",
                                        type: PropertyType.String,
                                        row: 1,
                                        col: 2
                                    },
                                    {       
                                        id: "procedure",
                                        name: "Procedure",
                                        type: PropertyType.String,
                                        row: 1,
                                        col: 3
                                    },
                                    {       
                                        id: "control",
                                        name: "Control",
                                        type: PropertyType.String,
                                        row: 1,
                                        col: 4
                                    }
                                ]
                            }
                        },
                    ]
                },
                {
                    id: "recommended_actions",
                    name: "Recommended Actions",
                    rows: 2,
                    cols: 1,
                    properties: [
                        {       
                            id: "recommended_actions",
                            name: "Recommended Actions",
                            type: PropertyType.String,
                            row: 1,
                            col: 1
                        },
                        {       
                            id: "mitre_attack_table",
                            name: "MITRE ATT&CK Table",
                            type: PropertyType.Table,
                            row: 2,
                            col: 1,
                            table_columns: {
                                number: 3,
                                properties: [
                                    {       
                                        id: "action",
                                        name: "Action",
                                        type: PropertyType.String,
                                        row: 1,
                                        col: 1
                                    },
                                    {       
                                        id: "by_whom",
                                        name: "By Whom",
                                        type: PropertyType.String,
                                        row: 1,
                                        col: 2
                                    },
                                    {       
                                        id: "timestamp",
                                        name: "Timestamp",
                                        type: PropertyType.String,
                                        row: 1,
                                        col: 3
                                    }
                                ]
                            }
                        },
                    ]
                },
                {
                    id: "key_intelligence_gap",
                    name: "Key Intelligence Gap",
                    rows: 1,
                    cols: 1,
                    properties: [
                        {       
                            id: "key_intelligence_gap",
                            name: "Key Intelligence Gap",
                            type: PropertyType.String,
                            row: 1,
                            col: 1
                        },
                    ]
                },
                {
                    id: "feedback",
                    name: "Feedback",
                    rows: 1,
                    cols: 1,
                    properties: [
                        {       
                            id: "feedback",
                            name: "Feedback",
                            type: PropertyType.String,
                            row: 1,
                            col: 1
                        },
                    ]
                }
            ]
        }
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