/**
 * @todo Document why this abstraction exists, and the relationship between
 *       environment, file managers, and plugin manager
 */

import logger from '../logger';
import AbstractFileManager from './abstract-file-manager';

class Environment {
    public fileManagers: AbstractFileManager[];

    /**
     * @description Converts a string to a base 64 string
     * @abstract
     */
    encodeBase64(str: string): string {
        logger.warn('missing required function in environment - encodeBase64');
        return str;
    }
    /**
     * @description Lookup the mime-type of a filename
     * @abstract
     */
    mimeLookup(filename: string): string {
        logger.warn('missing required function in environment - mimeLookup');
        return filename
    }
    /**
     * @abstract
     * @description Look up the charset of a mime type
     * @param mime
     */
    charsetLookup(mime: string): string {
        logger.warn('missing required function in environment - charsetLookup');
        return mime
    }
    /**
     * @abstract
     * @description Gets a source map generator
     *
     * @todo - Figure out precise type
     */
    getSourceMapGenerator(): any {
        logger.warn('missing required function in environment - getSourceMapGenerator');
    }

    constructor(fileManagers: AbstractFileManager[] = []) {
        this.fileManagers = fileManagers;

        // const optionalFunctions = ['encodeBase64', 'mimeLookup', 'charsetLookup', 'getSourceMapGenerator'];
        // const requiredFunctions = [];
        // const functions = requiredFunctions.concat(optionalFunctions);

        // for (let i = 0; i < functions.length; i++) {
        //     const propName = functions[i];
        //     const environmentFunc = externalEnvironment[propName];
        //     if (environmentFunc) {
        //         this[propName] = environmentFunc.bind(externalEnvironment);
        //     } else if (i < requiredFunctions.length) {
        //         this.warn(`missing required function in environment - ${propName}`);
        //     }
        // }
    }

    getFileManager(filename: string, currentDirectory: string, options: {
        pluginManager?: {
            getFileManagers(): AbstractFileManager
        },
    }, environment: Environment, isSync?: boolean): AbstractFileManager | null {

        if (!filename) {
            logger.warn('getFileManager called with no filename.. Please report this issue. continuing.');
        }
        if (currentDirectory === undefined) {
            logger.warn('getFileManager called with null directory.. Please report this issue. continuing.');
        }

        let fileManagers = this.fileManagers;
        if (options.pluginManager) {
            fileManagers = [...fileManagers].concat(options.pluginManager.getFileManagers());
        }
        for (let i = fileManagers.length - 1; i >= 0 ; i--) {
            const fileManager = fileManagers[i];
            if (fileManager && fileManager[isSync ? 'supportsSync' : 'supports']?.(filename, currentDirectory, options, environment)) {
                return fileManager;
            }
        }
        return null;
    }

    addFileManager(fileManager: AbstractFileManager): void {
        this.fileManagers.push(fileManager);
    }

    clearFileManagers(): void {
        this.fileManagers = [];
    }
}

export default Environment;
