const path = require('path')
const glob = require('glob')


/**
 * @param {string} env.target  The platform to build for. Possible values: chrome, firefox
 * @param {boolean} env.production  True to build a production-optimized extesion. Default: false
 * @returns {object}  Webpack configuration
 */
module.exports = async env =>{
    const production = !!env.production
    switch(env.target){
        case 'chrome':
            return {
                entry: await entryFiles('src/chrome'),
                output: {
                    filename: '[name].js',
                    path: path.resolve(__dirname, 'dist'),
                },
                mode: (production ? 'production' : 'development')
            }
        case 'firefox':
        case 'edge':
        case 'userscript':
            throw new Error("Build target not yet configured")
        default:
            throw new Error("Unrecognized build target")
    }
}


/**
 * @param dir string  Directory to scan (relative to project root)
 * @param type string  File type to scan for
 */
async function entryFiles(dir, type = 'js'){
    const pattern = path.resolve(__dirname, dir, '*.'+type)
    return new Promise((resolve, reject) =>{
        glob(pattern, {}, (err, files) =>{
            if(err) return reject()
            let entry = {}
            files.forEach(file =>{
                const name = path.basename(file, path.extname(file))
                entry[name] = file
            })
            resolve(entry)
        })
    })
}

