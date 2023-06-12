import { PropertyType } from "@/assets/scripts/PageEditor";

export const CvePatchApplied =  {       
    id: "cve_patch_applied",
    name: "Patch Applied",
    type: PropertyType.Enum,
    options: [
        { value: "Yes", text: "Yes" },
        { value: "No",  text: "No" },
        { value: "UNK", text: "Unknown" },
        { value: "NA",  text: "Not Applicable" }
    ]
}
