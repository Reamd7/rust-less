import Environment from './environment/environment';
import * as utils from './utils';
type Options = {
    _defaults: {
      javascriptEnabled: false,
      depends: false,
      compress: false,
      lint: false,
      paths: [
        "/home/gemini/code/rust-less/packages/less/bin",
      ],
      color: true,
      strictImports: false,
      insecure: false,
      rootpath: "",
      rewriteUrls: false,
      math: 1,
      strictUnits: false,
      globalVars: null,
      modifyVars: null,
      urlArgs: "",
      plugins: [
      ],
      reUsePluginManager: true,
      filename: "/home/gemini/code/rust-less/packages/less/bin/test.less",
    },
    javascriptEnabled: false,
    depends: false,
    compress: false,
    lint: false,
    paths: [
      "/home/gemini/code/rust-less/packages/less/bin",
    ],
    color: true,
    strictImports: false,
    insecure: false,
    rootpath: "",
    rewriteUrls: false,
    math: 1,
    strictUnits: false,
    globalVars: null,
    modifyVars: null,
    urlArgs: "",
    plugins: [
    ],
    reUsePluginManager: true,
    filename: "/home/gemini/code/rust-less/packages/less/bin/test.less",
  }
export default function RenderFactory(environment: Environment, ParseTree) {
    const render = function (input: string, options: Options, callback?: (error: Error | null, result?: string) => void) {
        if (typeof options === 'function') {
            callback = options;
            options = utils.copyOptions(this.options, {});
        }
        else {
            options = utils.copyOptions(this.options, options || {});
        }

        if (!callback) {
            const self = this;
            return new Promise(function (resolve, reject) {
                render.call(self, input, options, function(err, output) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(output);
                    }
                });
            });
        } else {
            this.parse(input, options, function(err, root, imports, options) {
                if (err) { return callback(err); }

                let result;
                try {
                    const parseTree = new ParseTree(root, imports);
                    result = parseTree.toCSS(options);
                }
                catch (err) { return callback(err); }

                callback(null, result);
            });
        }
    };

    return render;
}
