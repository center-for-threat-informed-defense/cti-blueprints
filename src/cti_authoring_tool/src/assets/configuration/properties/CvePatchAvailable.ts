import { PropertyType } from "@/assets/scripts/PageEditor";

export const CvePatchAvailable = {       
    id: "cve_patch_available",
    name: "Patch Available",
    type: PropertyType.Enum,
    options: [
        { value: "Yes", text: "Yes" },
        { value: "No",  text: "No" }
    ]
}
