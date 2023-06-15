const path = require("path");
const Configuration = require("./src/assets/configuration/app.config");

module.exports = {
    publicPath: './',
    configureWebpack: {
        resolve: {
            alias: {
                "~": path.resolve(__dirname, "./")
            }
        }
    },
    chainWebpack: config => {
        config
            .plugin('html')
            .tap(args => {
                // Merge app configuration
                args[0] = { 
                    ...args[0], 
                    ...Configuration.default
                }
                // Return args
                return args;
            });
    }
};
