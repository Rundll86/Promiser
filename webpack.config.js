const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const WebpackBar = require("webpackbar");
const CopyPlugin = require("copy-webpack-plugin");
/**
 * @type {import('webpack').Configuration}
 */
module.exports = {
    entry: "./src/index.ts",
    output: {
        path: path.resolve(__dirname, "generated"),
        filename: "app.js"
    },
    module: {
        rules: [
            {
                test: /\.ts$/i,
                use: {
                    loader: "ts-loader",
                    options: {
                        transpileOnly: true
                    }
                },
            },
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"]
            },
            {
                test: /\.png$/i,
                use: "url-loader"
            },
            {
                test: /\.txt$/i,
                use: "raw-loader"
            }
        ]
    },
    resolve: {
        extensions: [".ts", ".js"],
        alias: {
            "@": path.resolve(__dirname, "src"),
            "@asyncWorker": path.resolve(__dirname, "asyncWorker/src")
        }
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "public/index.html",
            filename: "index.html"
        }),
        new WebpackBar({
            name: "Live",
            color: "green"
        }),
        new CopyPlugin({
            patterns: [
                {
                    from: "public",
                    to: ".",
                    globOptions: {
                        ignore: ["public/index.html"]
                    }
                }
            ]
        })
    ],
    stats: "errors-warnings",
    devServer: {
        port: 25565,
        setupExitSignals: false,
        client: {
            logging: "none"
        },
        static: "public"
    },
    mode: process.env.NODE_ENV
};