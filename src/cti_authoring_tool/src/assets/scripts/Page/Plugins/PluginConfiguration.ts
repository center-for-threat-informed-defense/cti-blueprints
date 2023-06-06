export class PluginConfiguration {

    /**
     * A function that returns an object's reactive proxy. This must be
     * specified if plugins are used in a reactive context.
     */
    public static makeReactive: (<O>(o: O) => O) | undefined;  

}
