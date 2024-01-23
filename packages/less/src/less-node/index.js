import NodeEnvironment from './NodeEnvironment';
import FileManager from './file-manager';
import UrlFileManager from './url-file-manager';
import createFromEnvironment from '../less';
import lesscHelper from './lessc-helper';

const less = createFromEnvironment(new NodeEnvironment([new FileManager(), new UrlFileManager()]));

// allow people to create less with their own environment
less.createFromEnvironment = createFromEnvironment;
less.lesscHelper = lesscHelper;
less.PluginLoader = require('./plugin-loader').default;
less.fs = require('./fs').default;
less.FileManager = FileManager;
less.UrlFileManager = UrlFileManager;

// Set up options
less.options = require('../less/default-options').default();

// provide image-size functionality
require('./image-size').default(less.environment);

export default less;
