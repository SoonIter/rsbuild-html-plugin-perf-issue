const path = require("path")
const { VueLoaderPlugin } = require("vue-loader")
const CopyPlugin = require("copy-webpack-plugin")
const rspack = require("@rspack/core")

const HTMLWebpackPlugin = require("html-webpack-plugin")
const { RsdoctorRspackPlugin } = require("@rsdoctor/rspack-plugin")

const isDev = process.env.NODE_ENV === "development"
const pages = require("./config/pages.config-webpack.js") // 多页面配

console.log("pages: ", pages)

// 通过 html-webpack-plugin 生成的 HTML 集合
let HTMLPlugins = []
// 入口文件集合
let Entries = {}
// 生成多页面的集合
for (const [pageName, page] of Object.entries(pages)) {
  const htmlPlugin = new rspack.HtmlRspackPlugin({
    template: path.resolve(__dirname, `./public/index.html`),
    filename: `${pageName}.html`,
    title: page.title,
    favicon: path.resolve(__dirname, `./public/favicon.ico`),
    chunks: [pageName],
  })
  HTMLPlugins.push(htmlPlugin)
  Entries[pageName] = page.import
}
console.log("Entries: ", Entries)

/** @type {import('webpack').Configuration} */
module.exports = {
  mode: isDev ? "development" : "production",
  entry: Entries,
  // 打包文件出口
  devServer: {
    port: 8089,
    compress: false,
    open: ["/index-1.html"],
    hot: true,
    historyApiFallback: true,
    static: {
      serveIndex: true,
      publicPath: "public",
      directory: path.join(__dirname, "public"),
    },
  },
  output: {
    filename: "static/js/[name].js",
    path: path.join(__dirname, "./dist"), // 打包结果输出路径
    clean: true,
    publicPath: "/",
  },
  module: {
    rules: [
      {
        test: /\.pug$/,
        loader: "vue-pug-loader",
      },
      {
        test: /\.vue/,
        use: [
          {
            loader: "vue-loader",
            options: { experimentalInlineMatchResource: true },
          },
        ],
      },
      {
        test: /\.ts$/,
        use: ["builtin:swc-loader"],
      },
      {
        test: /\.css$/, //匹配所有的 css 文件
        use: ["postcss-loader"],
      },
      {
        test: /\.scss$/,
        include: [path.resolve(__dirname, "./src")],
        use: ["postcss-loader"],
      },

      {
        test: /\.(jpe?g|png|gif|svg|woff|woff2|eot|ttf|otf)$/i, // 匹配图片文件
        type: "asset",
        parser: {
          dataUrlCondition: {
            maxSize: 10 * 1024, // 小于10kb转base64位
          },
        },
        generator: {
          filename: "static/images/[name].[contenthash:8][ext]", // 文件输出目录和命名
        },
      },
      {
        test: /.(woff2?|eot|ttf|otf)$/, // 匹配字体图标文件
        type: "asset", // type选择asset
        parser: {
          dataUrlCondition: {
            maxSize: 10 * 1024, // 小于10kb转base64位
          },
        },
        generator: {
          filename: "static/fonts/[name].[contenthash:8][ext]", // 文件输出目录和命名
        },
      },
      {
        test: /.(mp4|webm|ogg|mp3|wav|flac|aac)$/, // 匹配媒体文件
        type: "asset", // type选择asset
        parser: {
          dataUrlCondition: {
            maxSize: 10 * 1024, // 小于10kb转base64位
          },
        },
        generator: {
          filename: "static/media/[name].[contenthash:8][ext]", // 文件输出目录和命名
        },
      },
    ],
  },
  resolve: {
    extensions: [".vue", ".ts", ".js", ".json"],
    alias: {
      "@": path.resolve(__dirname, "./src/"),
      "/src": path.resolve(__dirname, "./src/"),
    },
  },
  plugins: [
    ...HTMLPlugins,
    new VueLoaderPlugin(),
    // new RsdoctorRspackPlugin()
  ],

  optimization: {
    splitChunks: {
      // 分隔代码
      cacheGroups: {
        vendors: {
          // 提取node_modules代码
          test: /node_modules/, // 只匹配node_modules里面的模块
          name: "vendors", // 提取文件命名为vendors,js后缀和chunkhash会自动加
          minChunks: 1, // 只要使用一次就提取出来
          chunks: "initial", // 只提取初始化就能获取到的模块,不管异步的
          minSize: 0, // 提取代码体积大于0就提取出来
          priority: 1, // 提取优先级为1
        },
        commons: {
          // 提取页面公共代码
          name: "commons", // 提取文件命名为commons
          minChunks: 2, // 只要使用两次就提取出来
          chunks: "initial", // 只提取初始化就能获取到的模块,不管异步的
          minSize: 0, // 提取代码体积大于0就提取出来
        },
      },
    },
  },
}
