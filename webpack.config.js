const path = require('path');

module.exports = {
    mode: 'production',
    entry: path.resolve(__dirname, "./app.js"),
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'index.js',
    },
    target: 'node',
};