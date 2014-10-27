// Test configuration for edp-test
// Generated on Mon Aug 25 2014 00:26:29 GMT+0800 (CST)
module.exports = {

    // base path, that will be used to resolve files and exclude
    basePath: '../',


    // frameworks to use
    frameworks: ['jasmine2', 'esl'],


    // list of files / patterns to load in the browser
    files: [
        'test/spec/*.spec.js'
    ],


    // list of files to exclude
    exclude: [

    ],


    // optionally, configure the reporter
    coverageReporter: {
        // text-summary | text | html | json | teamcity | cobertura | lcov
        // lcovonly | none | teamcity
        type : 'text|html',
        dir : 'test/coverage/'
    },

    // web server port
    port: 8120,


    // enable / disable watching file and executing tests whenever any file changes
    watch: true,


    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera (has to be installed with `npm install karma-opera-launcher`)
    // - Safari (only Mac; has to be installed with `npm install karma-safari-launcher`)
    // - PhantomJS
    // - IE (only Windows; has to be installed with `npm install karma-ie-launcher`)
    browsers: ['Chrome'],
    // browsers: ['Firefox'],
    // browsers: ['Safari'],
    // browsers: ['PhantomJS'],


    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    // singleRun: true
    singleRun: false
};
