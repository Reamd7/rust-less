import mime from 'mime';
import sourceMap from 'source-map';

export default {
    encodeBase64: function encodeBase64(str: string) {
        // Avoid Buffer constructor on newer versions of Node.js.
        const buffer = (Buffer.from ? Buffer.from(str) : (new Buffer(str)));
        return buffer.toString('base64');
    },
    mimeLookup: function mimeLookup(filename: string) {
        return mime.lookup(filename);
    },
    charsetLookup: function charsetLookup(charset: string, fallback: string) {
        return mime.charsets.lookup(charset, fallback);
    },
    getSourceMapGenerator: function getSourceMapGenerator() {
        return sourceMap.SourceMapGenerator;
    }
};
