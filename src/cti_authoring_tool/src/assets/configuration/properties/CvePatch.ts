import { PropertyType } from "@/assets/scripts/AppConfiguration";

export const CvePatch = {       
    id: "cve_patch",
    name: "Patch Available",
    type: PropertyType.Enum,
    options: [
        { id: "Yes", text: "Yes", value: "Yes" },
        { id: "No", text: "No", value: "No" }
    ]
}
