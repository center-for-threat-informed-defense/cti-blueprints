import { PropertyType } from "@/assets/scripts/PageEditor";

export const CvePatchAvailable = {       
    id: "cve_patch_available",
    name: "Patch Available",
    type: PropertyType.Enum,
    options: [
        { id: "Yes", text: "Yes", value: "Yes" },
        { id: "No", text: "No", value: "No" }
    ]
}
