const path = require('path')
const glob = require('glob')
const CopyPlugin = require('copy-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin')


/**
 * @param {string} env.target  The platform to build for. Possible values: chrome, firefox
 * @param {boolean} env.production  True to build a production-optimized extesion. Default: false
 * @param {boolean} env.watch  True to enable webpack's watch mode. Default: false
 * @returns {object|Promise<object>}  Webpack configuration
 */
module.exports = env =>{
    const production = !!env.production
    const watch = !!env.watch
    switch(env.target){
        case 'chrome':  return chromeConfig(production, watch)
        case 'firefox':
        case 'edge':
        case 'userscript':  throw new Error("Build target not yet configured")
        default:  throw new Error("Unrecognized build target")
    }
}


/**
 * @param {boolean} production
 * @param {boolean} watch
 * @returns {Promise<object>}
 */
async function chromeConfig(production, watch){
    const src = 'src/chrome'
    const dist = 'dist/chrome'
    const entryFiles = await findEntryFiles(src)
    return {
        devtool: "source-map",
        watch,
        entry: createEntryConfig(entryFiles),
        output: {
            filename: '[name].js',
            path: path.resolve(__dirname, dist),
        },
        mode: (production ? 'production' : 'development'),
        plugins: [
            new CleanWebpackPlugin(),
            new CopyPlugin([
                {
                    from: src+'/**/*',
                    ignore: entryFiles,
                    transformPath: targetPath => targetPath.substr(src.length)
                },
                {
                    from: 'src/shared/images/**/*',
                    transformPath: targetPath => targetPath.substr(3)
                },
            ]),
        ],
    }
}


/**
 * @param dir string  Directory to scan (relative to project root)
 * @param type string  File type to scan for
 * @return {Promise<string[]>}  Resolves to a list of file paths
 */
async function findEntryFiles(dir, type = 'js'){
    const pattern = path.resolve(__dirname, dir, '*.'+type)
    return new Promise((resolve, reject) =>{
        glob(pattern, {}, (err, files) =>{
            if(err) return reject(err)
            resolve(
                files.map( file => path.relative(__dirname, file) )
            )
        })
    })
}

/**
 * @param {string[]} files  List of files to convert to webpack entry config
 * @return {object}
 */
function createEntryConfig(files){
    let entry = {}
    files.forEach(file =>{
        const name = path.basename(file, path.extname(file))
        entry[name] = './'+file
    })
    return entry
}