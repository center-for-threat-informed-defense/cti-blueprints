export class EventEmitter {
    
    /**
     * The event emitter's index of event listeners.
     */
    private _listeners: Map<string, Function[]>;

    
    /**
     * Creates a new {@link EventEmitter}. 
     */
    constructor(){
        this._listeners = new Map();
    }
    

    /**
     * Dispatches the event listeners associated with a given event.
     * @param event
     *  The name of the event to raise.
     * @param args
     *  The arguments to pass to the event listeners.
     */
    public emit(event: string, ...args: any[]) {
        if(this._listeners.has(event)) {
            let listeners = this._listeners.get(event)!;
            for(let i = listeners.length - 1; 0 <= i; i--) {
                listeners[i](...args);
            }
        }
    }

    /**
     * Adds an event listener to an event.
     * @param event
     *  The name of the event.
     * @param callback
     *  The function to call when the event is raised.
     */
    public on(event: string, callback: Function) {
        if(!this._listeners.has(event)) {
            this._listeners.set(event, []);
        }
        this._listeners.get(event)!.unshift(callback);
    }

    /**
     * Adds a one-time event listener to an event.
     * @param event
     *  The name of the event.
     * @param callback
     *  The function to call when the event is raised.
     */
    public once(event: string, callback: Function) {
        if(!this._listeners.has(event)) {
            this._listeners.set(event, []);
        }
        let once = (...args: any[]) => {
            let listeners = this._listeners.get(event)!;
            listeners.splice(listeners.indexOf(once), 1);
            callback(...args);
        }
        this._listeners.get(event)!.unshift(once);
    }

    /**
     * Removes an event listener from an event.
     * @param event
     *  The name of the event.
     * @param callback
     *  The function to remove.
     */
    public off(event: string, callback: Function) {
        if(this._listeners.has(event)) {
            let listeners = this._listeners.get(event)!;
            listeners.splice(listeners.indexOf(callback), 1);
        }
    }

}
