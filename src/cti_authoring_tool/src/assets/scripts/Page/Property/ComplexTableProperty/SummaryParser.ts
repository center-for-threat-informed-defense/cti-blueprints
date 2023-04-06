import { Property } from "..";
import { FormattedText } from "./FormattedText";

export class SummaryParser {

    /**
     * The parser's symbols.
     */
    private static SYMBOLS = {
        BEG_ID : /(?<!\\)\{\{/,
        END_ID : /(?<!\\)\}\}/,
        BOLD   : /(?<!\\)\*\*/,
    };

    /**
     * The parser's reserved symbols.
     */
    private static RESERVED = new RegExp(
        `(${ Object.values(SummaryParser.SYMBOLS).map(o => o.source).join("|") })`
    );

    /**
     * Parses a summary expression.
     * @param summary
     *  The summary string template.
     * @param row
     *  The row.
     * @returns
     *  The generated summary.
     */
    public static parse(summary: string, row: Property[]): FormattedText[] {
        let text: FormattedText[] = [];
        this.parseExpression(row, summary.split(this.RESERVED).filter(Boolean), text);
        return text;
    }

    /**
     * Parses a summary expression.
     * @param row
     *  The property row.
     * @param tokens
     *  The summary expression's tokens.
     * @param text
     *  The summary expression's formatted text.
     */
    private static parseExpression(row: Property[], tokens: string[], text: FormattedText[]) {
        if(this.SYMBOLS.BOLD.test(tokens[0])) {
            text.push({ text: "", format: "bold" });
            this.parseBold(row, tokens, text);
            this.parseExpression(row, tokens, text);
        } else if(0 < tokens.length) {
            text.push({ text: "", format: "normal" });
            this.parseText(row, tokens, text);
            this.parseExpression(row, tokens, text);
        }
    }

    /**
     * Parses bold text.
     * @param row
     *  The property row.
     * @param tokens
     *  The summary expression's tokens.
     * @param text
     *  The summary expression's formatted text.
     */
    private static parseBold(row: Property[], tokens: string[], text: FormattedText[]) {
        this.accept(tokens, this.SYMBOLS.BOLD);
        this.parseText(row, tokens, text);
        this.accept(tokens, this.SYMBOLS.BOLD);
    }

    /**
     * Parses normal text.
     * @param row
     *  The property row.
     * @param tokens
     *  The summary expression's tokens.
     * @param text
     *  The summary expression's formatted text.
     */
    private static parseText(row: Property[], tokens: string[], text: FormattedText[]) {
        if(this.SYMBOLS.BEG_ID.test(tokens[0])) {
            this.parseIdentifier(row, tokens, text);
            this.parseText(row, tokens, text);
        } else if(!this.RESERVED.test(tokens[0])){
            text.at(-1)!.text += tokens[0];
            tokens.shift();
            this.parseText(row, tokens, text);
        }
    }

    /**
     * Parses identifier.
     * @param row
     *  The property row.
     * @param tokens
     *  The summary expression's tokens.
     * @param text
     *  The summary expression's formatted text.
     */
    private static parseIdentifier(row: Property[], tokens: string[], text: FormattedText[]) {
        // Read identifier opener
        if(!this.accept(tokens, this.SYMBOLS.BEG_ID)) {
            throw new Error(`Unexpected token: '${tokens[0]}'`)
        }
        // Read identifier
        let token = tokens[0].trim();
        let prop = row.find(o => o.id === token);
        if (prop === undefined) {
            text.at(-1)!.text += `[Error: Unknown property '${ token }']`;
        } else {
            let t = prop.toString() ?? prop.name;
            text.at(-1)!.text += t.replace(/\n/g, "");
        }
        tokens.shift();
        // Read identifier closer
        if(!this.accept(tokens, this.SYMBOLS.END_ID)) {
            throw new Error(`Unexpected token: '${ tokens[0] }'`)
        }
    }

    /**
     * Attempts to accept the first token from a list.
     * @param tokens
     *  The token list.
     * @param regex
     *  The regex the token must match.
     * @returns
     *  True if the token was accepted, false otherwise.
     */
    private static accept(tokens: string[], regex: RegExp): boolean {
        if (regex.test(tokens[0])) {
            tokens.shift();
            return true;
        }
        return false;
    }

}
