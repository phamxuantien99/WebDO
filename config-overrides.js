const webpack = require("webpack");

module.exports = {
  webpack: function (config) {
    config.resolve.fallback = {
      fs: false,
      child_process: false,
      net: false,
      tls: false,
      framer: require.resolve('framer'),
      https: require.resolve("https-browserify"),
      http: require.resolve("stream-http"),
      http2: require.resolve("http2"),
      buffer: require.resolve("buffer/"),
      stream: require.resolve("stream-browserify"),
      url: require.resolve("url/"),
      zlib: require.resolve("browserify-zlib"),
      process: require.resolve("process/browser"),
      querystring: require.resolve("querystring-es3"),
      os: require.resolve("os-browserify/browser"),
      path: require.resolve("path-browserify"),
      crypto: require.resolve("crypto-browserify"),
      assert: require.resolve("assert/"),
    };

    config.plugins = [
      ...config.plugins,
      new webpack.ProvidePlugin({
        process: "process/browser",
        Buffer: ["buffer", "Buffer"],
      }),
    ];

    return config;
  },
};
