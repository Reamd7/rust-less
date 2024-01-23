import Environment from './environment';

abstract class AbstractFileManager {
    getPath(filename: string): string {
        let j = filename.lastIndexOf('?');
        if (j > 0) {
            filename = filename.slice(0, j);
        }
        j = filename.lastIndexOf('/');
        if (j < 0) {
            j = filename.lastIndexOf('\\');
        }
        if (j < 0) {
            return '';
        }
        return filename.slice(0, j + 1);
    }

    tryAppendExtension(path: string, ext: string): string {
        return /(\.[a-z]*$)|([?;].*)$/.test(path) ? path : path + ext;
    }

    tryAppendLessExtension(path: string): string {
        return this.tryAppendExtension(path, '.less');
    }
    abstract supports(
        filename: string,
        currentDirectory: string,
        options?: {
            pluginManager?: {
                getFileManagers(): AbstractFileManager
            },
        },
        environment?: Environment
    ): boolean;

    abstract supportsSync(
        filename: string,
        currentDirectory: string,
        options?: {
            pluginManager?: {
                getFileManagers(): AbstractFileManager
            },
        },
        environment?: Environment
    ): boolean

    alwaysMakePathsAbsolute(): boolean {
        return false;
    }

    isPathAbsolute(filename: string): boolean {
        return (/^(?:[a-z-]+:|\/|\\|#)/i).test(filename);
    }

    // TODO: pull out / replace?
    join(basePath: string, laterPath: string): string {
        if (!basePath) {
            return laterPath;
        }
        return basePath + laterPath;
    }

    pathDiff(url: string, baseUrl: string): string {
        // diff between two paths to create a relative path

        const urlParts = this.extractUrlParts(url);

        const baseUrlParts = this.extractUrlParts(baseUrl);
        let i;
        let diff = '';
        if (urlParts.hostPart !== baseUrlParts.hostPart) {
            return '';
        }
        const max = Math.max(baseUrlParts.directories.length, urlParts.directories.length);
        for (i = 0; i < max; i++) {
            if (baseUrlParts.directories[i] !== urlParts.directories[i]) { break; }
        }
        const baseUrlDirectories = baseUrlParts.directories.slice(i);
        const urlDirectories = urlParts.directories.slice(i);
        for (i = 0; i < baseUrlDirectories.length - 1; i++) {
            diff += '../';
        }
        for (i = 0; i < urlDirectories.length - 1; i++) {
            diff += `${urlDirectories[i]}/`;
        }
        return diff;
    }

    /**
     * Helper function, not part of API.
     * This should be replaceable by newer Node / Browser APIs
     *
     * @param {string} url
     * @param {string} baseUrl
     */
    extractUrlParts(url: string, baseUrl?: string): {
        hostPart: string | undefined;
        directories: (string | undefined)[];
        rawPath: string;
        path: string;
        filename: string | undefined;
        fileUrl: string;
        url: string;
    } {
        // urlParts[1] = protocol://hostname/ OR /
        // urlParts[2] = / if path relative to host base
        // urlParts[3] = directories
        // urlParts[4] = filename
        // urlParts[5] = parameters

        const urlPartsRegex = /^((?:[a-z-]+:)?\/{2}(?:[^/?#]*\/)|([/\\]))?((?:[^/\\?#]*[/\\])*)([^/\\?#]*)([#?].*)?$/i;

        const urlParts = url.match(urlPartsRegex);
        let rawDirectories: string[] = [];
        const directories = [];
        let i;
        let baseUrlParts;

        if (!urlParts) {
            throw new Error(`Could not parse sheet href - '${url}'`);
        }

        // Stylesheets in IE don't always return the full path
        if (baseUrl && (!urlParts[1] || urlParts[2])) {
            baseUrlParts = baseUrl.match(urlPartsRegex);
            if (!baseUrlParts) {
                throw new Error(`Could not parse page url - '${baseUrl}'`);
            }
            urlParts[1] = urlParts[1] || baseUrlParts[1] || '';
            if (!urlParts[2]) {
                if (baseUrlParts[3]) {
                    urlParts[3] = baseUrlParts[3] + urlParts[3];
                }
            }
        }

        if (urlParts[3]) {
            rawDirectories = urlParts[3].replace(/\\/g, '/').split('/');

            // collapse '..' and skip '.'
            for (i = 0; i < rawDirectories.length; i++) {

                if (rawDirectories[i] === '..') {
                    directories.pop();
                }
                else if (rawDirectories[i] !== '.') {
                    directories.push(rawDirectories[i]);
                }

            }
        }

        const path = (urlParts[1] || '') + directories.join('/')
        const fileUrl = path + (urlParts[4] || '')
        const returner = {
            hostPart: urlParts[1],
            directories,
            rawPath: (urlParts[1] || '') + rawDirectories.join('/'),
            path,
            filename: urlParts[4],
            fileUrl,
            url: fileUrl + (urlParts[5] || '')
        };
        return returner;
    }

    /**
     * Loads a file asynchronously.
     */
    abstract loadFile(
        filename: string,
        currentDirectory: string,
        options: Record<string, any>,
        environment: Environment
    ): Promise<{ filename: string, contents: string | Uint8Array }>

    /**
     * Loads a file synchronously. Expects an immediate return with an object
     */
    abstract loadFileSync(
        filename: string,
        currentDirectory: string,
        options: Record<string, any>,
        environment: Environment
    ): { error?: unknown, filename: string, contents: string }
}

export default AbstractFileManager;
