require.config({
    baseUrl: '../',
    paths: {
//        mocha: 'node_modules/gulp-mocha/node_modules/mocha/mocha',
        chai: 'node_modules/chai/chai',
        'histogram-analyze': 'histogram-analyze'
    }   
    
})

define(['module_open.test.js'], function() {
//    var chai = require('chai');
//    var mocha = require('mocha');
//    
//    var should = chai.should();
//    
//    mocha.ui('bdd')
//    mocha.reporter('html');
//    require(function(){

    if (window.mochaPhantomJS) {
        mochaPhantomJS.run();
    } else {
        mocha.run();
    }   
//    })
})