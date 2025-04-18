const HtmlWebpackPlugin = require("html-webpack-plugin");
const HtmlInlineCssPlugin = require("html-inline-css-webpack-plugin");
const HtmlInlineScriptPlugin = require("html-inline-script-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const webpack = require("webpack");
const devMode = process.env.NODE_ENV !== "production";
module.exports = {
    entry: [
        "./src/app.js",
        "./src/app.css"
    ],
    output: {
        path: __dirname + "/dist"
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                exclude: /node_modules/,
                use: [
                    {loader: 'style-loader'}, // devMode ?  : MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                        options: {
                            importLoaders: 1,
                        }
                    },
                    {
                        loader: 'postcss-loader'
                    }
                ]
            }
        ]
    },
    devServer: {
        open: true,
        compress: true,
        port: 56860,
        hot: false,
        liveReload: false,
        webSocketServer: false
    },
    plugins: [
        new CssMinimizerPlugin({
            minimizerOptions: {
                preset: [
                    "default",
                    {
                        discardComments: {removeAll: true},
                    },
                ],
            }
        }),
        new HtmlWebpackPlugin({
            template: "./src/app.ejs",
            scriptLoading: "blocking",
            inject: true
        }),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
        }),
        ...(function() {
            let plugins = [];
            if (process.env.NODE_ENV === "production") {
                // plugins.push(new HtmlInlineCssPlugin.default());
                // plugins.push(new HtmlInlineScriptPlugin());
            } else {
                plugins.push(new MiniCssExtractPlugin())
            }
            return plugins
        })()
    ]
}
