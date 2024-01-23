const enum MessageType {
    error = 'error',
    warn = 'warn',
    info = 'info',
    debug = 'debug'
}

type LoggerListener = (msg: string) => void;
type LoggerListeners = Partial<Record<MessageType, LoggerListener>>

class LoggerIns {
    private _listeners: LoggerListeners[] = [];
    private _fireEvent = (type: MessageType, msg: string) => {
        for (let i = 0; i < this._listeners.length; i++) {
            const logFunction = this._listeners[i]?.[type];
            if (logFunction) {
                logFunction(msg);
            }
        }
    }

    public error = (msg: string) => {
        this._fireEvent(MessageType.error, msg);
    }

    public warn = (msg: string) => {
        this._fireEvent(MessageType.warn, msg);
    }

    public info = (msg: string) => {
        this._fireEvent(MessageType.info, msg);
    }

    public debug = (msg: string) => {
        this._fireEvent(MessageType.debug, msg);
    }

    public addListener = (listener: LoggerListeners) => {
        this._listeners.push(listener);
    }

    public removeListener = (listener: LoggerListeners) => {
        for (let i = 0; i < this._listeners.length; i++) {
            if (this._listeners[i] === listener) {
                this._listeners.splice(i, 1);
                return;
            }
        }
    }
}
export type Logger = InstanceType<typeof LoggerIns>
export default new LoggerIns