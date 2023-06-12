import { StringProperty } from "@/assets/scripts/Page";

export class TextMetricsPlugin {

    /**
     * Creates a new {@link TextMetricsPlugin}.
     * @param property
     *  The atomic property.
     */
    constructor(property: StringProperty) {
        property.registerMetric("word-count", "Words", 0);
        property.on("update", () => {
            property.updateMetric("word-count", this.getWordCount(property.value));
        });
    }


    /**
     * Returns the number of words in a string.
     * @param text
     *  The string.
     * @returns
     *  The number of words in a string.
     */
    private getWordCount(text: string | null): number {
        let count = (text?.match(/\s+\S/g)?.length ?? -1) + 1;
        return !count && text ? 1 : count;
    }

}
