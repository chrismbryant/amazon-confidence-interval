const fs = require('fs')
const path = require('path')
const CopyPlugin = require('copy-webpack-plugin');


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
            clean: true,
        },
        mode: (production ? 'production' : 'development'),
        plugins: [
            new CopyPlugin({
                patterns: [
                    {
                        // Everything in src/chrome that isn't a bundle entry
                        // point (manifest.json, init.txt, ...).
                        context: src,
                        from: '**/*',
                        globOptions: {ignore: ['**/*.js']},
                    },
                    {
                        context: 'src/shared/images',
                        from: '**/*',
                        to: 'shared/images',
                    },
                ],
            }),
        ],
    }
}


/**
 * @param dir string  Directory to scan (relative to project root)
 * @param type string  File type to scan for
 * @return {Promise<string[]>}  Resolves to a list of file paths
 */
async function findEntryFiles(dir, type = 'js'){
    const absDir = path.resolve(__dirname, dir)
    const entries = await fs.promises.readdir(absDir, {withFileTypes: true})
    return entries
        .filter( entry => entry.isFile() && entry.name.endsWith('.'+type) )
        .map( entry => path.relative(__dirname, path.join(absDir, entry.name)) )
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