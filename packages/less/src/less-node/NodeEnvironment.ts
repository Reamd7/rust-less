import Environment from '../less/environment/environment';
import mime from 'mime';
import sourceMap from 'source-map';

export default class NodeEnvironment extends Environment {
    encodeBase64(str: string): string {
        // Avoid Buffer constructor on newer versions of Node.js.
        const buffer = (Buffer.from ? Buffer.from(str) : (new Buffer(str)));
        return buffer.toString('base64');
    }
    mimeLookup(filename: string): string {
        return mime.lookup(filename);
    }
    charsetLookup(charset: string): string {
        return mime.charsets.lookup(charset, '');
    }
    getSourceMapGenerator(): typeof sourceMap['SourceMapGenerator'] {
        return sourceMap.SourceMapGenerator;
    }
}
