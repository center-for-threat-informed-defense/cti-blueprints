export interface PropertyActionText {

    /**
     * The action's text.
     */
    text: string

}

export interface PropertyAction extends PropertyActionText {

    /**
     * The action.
     */
    function: () => void

}
