import AbstractFileManager from '../less/environment/abstract-file-manager.js';
import type { BrowserOption } from './browserOption';
import type { Logger } from '../less/logger'

let options: BrowserOption;
let logger: Logger;
let fileCache: Record<string, string> = {};

// TODOS - move log somewhere. pathDiff and doing something similar in node. use pathDiff in the other browser file for the initial load
class FileManager extends AbstractFileManager {
    alwaysMakePathsAbsolute() {
        return true;
    }

    join(basePath: string, laterPath: string) {
        if (!basePath) {
            return laterPath;
        }
        return this.extractUrlParts(laterPath, basePath).path;
    }

    private doXHR(url: string, type: string | undefined | null, callback: (responseText: string, responseHeader?: string | null) => unknown, errback: (status: number, url: string) => unknown) {
        const xhr = new XMLHttpRequest();
        const async = options.isFileProtocol ? options.fileAsync : true;

        if (typeof xhr.overrideMimeType === 'function') {
            xhr.overrideMimeType('text/css');
        }
        logger.debug(`XHR: Getting '${url}'`);
        xhr.open('GET', url, async);
        xhr.setRequestHeader('Accept', type || 'text/x-less, text/css; q=0.9, */*; q=0.5');
        xhr.send(null);

        function handleResponse() {
            if (xhr.status >= 200 && xhr.status < 300) {
                callback(xhr.responseText, xhr.getResponseHeader('Last-Modified'));
            } else if (typeof errback === 'function') {
                errback(xhr.status, url);
            }
        }

        if (options.isFileProtocol && !options.fileAsync) {
            if (xhr.status === 0 || (xhr.status >= 200 && xhr.status < 300)) {
                callback(xhr.responseText);
            } else {
                errback(xhr.status, url);
            }
        } else if (async) {
            xhr.onreadystatechange = () => {
                if (xhr.readyState == 4) {
                    handleResponse();
                }
            };
        } else {
            handleResponse();
        }
    }

    supports() {
        return true;
    }

    clearFileCache() {
        fileCache = {};
    }

    loadFile(filename: string, currentDirectory: string | null, options: { ext?: string; useFileCache?: boolean; mime?: string; }): Promise<{
        contents: string;
        filename: string;
        webInfo: {
            lastModified: Date | null | string | undefined
        }
    }> {
        // TODO: Add prefix support like less-node?
        // What about multiple paths?

        if (currentDirectory && !this.isPathAbsolute(filename)) {
            filename = currentDirectory + filename;
        }

        filename = options.ext ? this.tryAppendExtension(filename, options.ext) : filename;

        options = options || {};

        // sheet may be set to the stylesheet for the initial load or a collection of properties including
        // some context variables for imports
        const hrefParts = this.extractUrlParts(filename, window.location.href);
        const href      = hrefParts.url;
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self      = this;

        return new Promise((resolve, reject) => {
            if (options.useFileCache && fileCache[href]) {
                try {
                    const lessText = fileCache[href];
                    // !!!
                    return resolve({ contents: lessText!, filename: href, webInfo: { lastModified: new Date() }});
                } catch (e) {
                    const message = e instanceof Error ? e.message : ''
                    return reject({ filename: href, message: `Error loading file ${href} error was ${message}` });
                }
            }

            self.doXHR(
                href,
                options.mime,
                function doXHRCallback(data, lastModified) {
                    // per file cache
                    fileCache[href] = data;

                    // Use remote copy (re-parse)
                    resolve({ contents: data, filename: href, webInfo: { lastModified }});
                },
                function doXHRError(status, url) {
                    reject({ type: 'File', message: `'${url}' wasn't found (${status})`, href });
                }
            );
        });
    }

    supportsSync(): boolean {
        return false;
    }
    loadFileSync(): { error?: unknown; filename: string; contents: string; } {
        throw Error('loadFileSync has not impl')
    }
}

export default (opts: BrowserOption, log: Logger): typeof FileManager => {
    options = opts;
    logger = log;
    return FileManager;
}
