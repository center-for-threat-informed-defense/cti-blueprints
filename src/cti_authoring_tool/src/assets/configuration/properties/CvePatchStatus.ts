import { PropertyType } from "@/assets/scripts/AppConfiguration";

export const CvePatchStatus =  {       
    id: "cve_patch_status",
    name: "Patch Status",
    type: PropertyType.Enum,
    options: [
        { id: "Yes", text: "Yes", value: "Yes" },
        { id: "No", text: "No", value: "No" },
        { id: "UNK", text: "Unknown", value: "UNK" },
        { id: "NA", text: "Not Applicable", value: "NA" }
    ]
}
