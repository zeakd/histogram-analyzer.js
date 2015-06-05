(function(test){
    var root = (typeof self == 'object' && self.self == self && self) ||
            (typeof global == 'object' && global.global == global && global);
    
    var isNode = typeof module !== 'undefined' && module.exports;
    var isRequirejs = typeof define === 'function' && define.amd;

    var HA;
    var env;
    var should;
    if(isRequirejs){
        define(['histogram-analyze', 'chai'], function(HA, chai){
            should = chai.should();
            env = 'Requirejs';
            test(HA, should, env);
        })
    } else if(isNode){
        HA = require("../histogram-analyze");
        var should = require("chai").should();
        env = "Node";
        test(HA, should, env);
            
    }else{
        HA = root.HistogramAnalyze;
        env = "Only Browser"
        test(HA, should, env);
    } 
    
}(function(HA, should, env){
    describe('Open with '+env, function(){
        describe('#histogram module', function(){
            it('is ok', function(){
                HA.should.be.ok;
            })
        })
        describe('#histogram1D()', function(){
            it('is function', function(){
                HA.histogram1D.should.be.a('function');   
            })
        })
        describe('#histogram1DCircular()', function(){
            it('is function', function(){
                HA.circularHistogram1D.should.be.a('function');      
            })
        })
        describe('#histogram2D()', function(){
            it('is function', function(){
                HA.histogram2D.should.be.a('function');      
            })
        })
    })
    
    describe('Construct Test', function(){
        describe("# Width : 0 init : 0", function(){
            it('is ok', function(){
                (new HA.histogram1D(0, 0)).should.be.ok;   
            })
            
        })
    }) 
    describe('Max Test', function(){
        var hist1 = new HA.histogram1D(5);
        hist1[0] = 1;
        hist1[1] = 2;
        hist1[2] = 3;
        hist1[3] = 4;
        hist1[4] = 5;
        var hist2 = new HA.histogram1D(5);
        hist2[0] = 2;
        hist2[1] = 3;
        hist2[2] = 8;
        hist2[3] = 7;
        hist2[4] = 6;
        var hist3 = new HA.histogram1D(5);
        hist3[0] = 6;
        hist3[1] = 6;
        hist3[2] = 6;
        hist3[3] = 6;
        hist3[4] = 6;
        describe(' [1,2,3,4,5] ', function(){
            it('Max is equal to 5', function(){
                hist1.max().should.equal(5);
            })
        })
        describe(' [2,3,8,7,6] ', function(){
            it('Max is equal to 8', function(){
                hist2.max().should.equal(8);
            })
        })
        describe(' [6,6,6,6,6] ', function(){
            it('Max is equal to 6', function(){
                hist3.max().should.equal(6);
            })
        })
        describe(' [1,2,3,4,5] ', function(){
            it('min is equal to 1', function(){
                hist1.min().should.equal(1);
            })
        })
    })
}))

