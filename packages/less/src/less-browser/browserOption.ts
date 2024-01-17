import { LessOptions } from "../less/default-options";

export type BrowserOption = {
    async: boolean; // default: false
    env: string;
    errorReporting: "html" | "console" | "function"; // html
    fileAsync: boolean; // false

    /**
     * @deprecated
     */
    functions?: Record<string, VoidFunction>
    logLevel: 0 | 1 | 2 | 3 | 4 // 2
    poll: number; // 1000
    relativeUrls: boolean; // false
    useFileCache: true;
    onReady: boolean;
} & LessOptions