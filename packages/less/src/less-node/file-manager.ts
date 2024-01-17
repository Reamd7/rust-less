import path from 'path';
import fs from './fs';
import AbstractFileManager from '../less/environment/abstract-file-manager.js';

type Options = {
    paths?: string[]
    prefixes?: string[];
    syncImport?: boolean;
    ext?: string;
    rawBuffer?: boolean;
}

type LoadFileCb = (
    error: {
        type: 'File',
        message: string
    } | undefined,
    result: {
        contents: string | Buffer,
        filename: string
    }
) => unknown

class FileManager extends AbstractFileManager {
    supports() {
        return true;
    }

    supportsSync() {
        return true;
    }

    loadFile = (filename: string, currentDirectory: string, options: Options, _: unknown, callback?: LoadFileCb) => {
        let fullFilename: string;
        const isAbsoluteFilename = this.isPathAbsolute(filename);
        const filenamesTried: string[] = [];
        const self = this;
        const prefix = filename.slice(0, 1);
        const explicit = prefix === '.' || prefix === '/';
        let result: {
            contents: string | Buffer,
            filename: string
        } | {
            error: {
                type: 'File',
                message: string
            }
        } | null = null;
        let isNodeModule = false;
        const npmPrefix = 'npm://';

        options = options || {};

        const paths = isAbsoluteFilename ? [''] : [currentDirectory];

        if (options.paths) { paths.push.apply(paths, options.paths); }

        if (!isAbsoluteFilename && paths.indexOf('.') === -1) { paths.push('.'); }

        const prefixes = options.prefixes || [''];
        const fileParts = this.extractUrlParts(filename);

        if (options.syncImport) {
            getFileData(returnData, returnData);
            if (callback && result) {
                callback(('error' in result) ? (result as {
                    error: {
                        type: 'File',
                        message: string
                    }
                }).error : undefined, result);
            }
            else {
                return result;
            }
        }
        else {
            // promise is guaranteed to be asyncronous
            // which helps as it allows the file handle
            // to be closed before it continues with the next file
            return new Promise(getFileData);
        }

        function returnData(data: {
            contents: string | Buffer,
            filename: string
        } | {
            type: 'File',
            message: string
        }) {
            if (!('filename' in data)) {
                result = { error: data };
            }
            else {
                result = data;
            }
        }

        function getFileData(
            fulfill: (result: {
                contents: string | Buffer,
                filename: string
            }) => unknown, 
            reject: (error: {
                type: 'File',
                message: string
            }) => unknown, 
        ) {
            (function tryPathIndex(i) {
                function tryWithExtension() {
                    const extFilename = options.ext ? self.tryAppendExtension(fullFilename, options.ext) : fullFilename;

                    if (extFilename !== fullFilename && !explicit && paths[i] === '.') {
                        try {
                            fullFilename = require.resolve(extFilename);
                            isNodeModule = true;
                        }
                        catch (e) {
                            filenamesTried.push(npmPrefix + extFilename);
                            fullFilename = extFilename;
                        }
                    }
                    else {
                        fullFilename = extFilename;
                    }
                }
                if (i < paths.length) {
                    (function tryPrefix(j) {
                        if (j < prefixes.length) {
                            isNodeModule = false;
                            fullFilename = fileParts.rawPath + prefixes[j] + fileParts.filename;

                            const item = paths[i]
                            if (item) {
                                fullFilename = path.join(item, fullFilename);
                            }

                            if (!explicit && item === '.') {
                                try {
                                    fullFilename = require.resolve(fullFilename);
                                    isNodeModule = true;
                                }
                                catch (e) {
                                    filenamesTried.push(npmPrefix + fullFilename);
                                    tryWithExtension();
                                }
                            }
                            else {
                                tryWithExtension();
                            }                            

                            const readFileArgs: Parameters<typeof fs['readFileSync']> = [fullFilename];
                            if (!options.rawBuffer) {
                                readFileArgs.push('utf-8');
                            }
                            if (options.syncImport) {
                                try {
                                    const data = fs.readFileSync.apply(fs, readFileArgs);
                                    fulfill({ contents: data, filename: fullFilename});
                                }
                                catch (e) {
                                    filenamesTried.push(isNodeModule ? npmPrefix + fullFilename : fullFilename);
                                    return tryPrefix(j + 1);
                                }
                            }
                            else {
                                (readFileArgs as Parameters<typeof fs['readFile']>).push((e, data) => {
                                    if (e) {
                                        filenamesTried.push(isNodeModule ? npmPrefix + fullFilename : fullFilename);
                                        return tryPrefix(j + 1);
                                    }   
                                    fulfill({ contents: data, filename: fullFilename});
                                });
                                fs.readFile.apply(fs, (readFileArgs as Parameters<typeof fs['readFile']>));
                            }

                        }
                        else {
                            tryPathIndex(i + 1);
                        }
                    })(0);
                } else {
                    reject({ type: 'File', message: `'${filename}' wasn't found. Tried - ${filenamesTried.join(',')}` });
                }
            }(0));
        }

        return null
    }

    loadFileSync(filename: string, currentDirectory: string, options: Options, environment: unknown) {
        options.syncImport = true;
        return this.loadFile(filename, currentDirectory, options, environment);
    }
}

export default FileManager;
