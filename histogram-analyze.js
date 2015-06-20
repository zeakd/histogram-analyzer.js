// Rothko Project
//
// histogram-analyze
//
// zeakd

(function(factory){
    'use strict'
    var root = (typeof self == 'object' && self.self == self && self) ||
            (typeof global == 'object' && global.global == global && global);
    
    var isNodeModule = typeof module !== 'undefined' && module.exports;
    var isRequirejs = typeof define === 'function' && define.amd;
    /* Export and Constructor Setting */
    
    if(isRequirejs){
        define(function(){ 
            //export requirejs Module
            return factory(root); 
        });
    }else if(isNodeModule){
        module.exports = factory(root);
        //Node module dependency
    }else {
        //export normal browser module.
        root.HistogramAnalyze = factory(root);    
    }    
}(function(root){
    /* add utility method */
    Math.mod = function(a, n){
        if( a < 0 ){
            return this.mod(a + n, n);   
        }else{
            return a%n;
        }
    }
    /* Histogram */    
    
    function histogram1D(length, init){
        var hist1D; 
        if(length instanceof Array){
            hist1D = length;
        }else {
            init = typeof init !== 'undefined' ? init : 0;
            hist1D = [];
            for(var x = 0; x< length; ++x){
                hist1D[x] = init;   
            }
        }
        hist1D.max = histogram1DFunctions.max;
        hist1D.min = histogram1DFunctions.min;
        hist1D.cv = histogram1DFunctions.cv;
        hist1D.medianSmoothing = histogram1DFunctions.medianSmoothing;
        hist1D.gaussianSmoothing = histogram1DFunctions.gaussianSmoothing;
        hist1D.flatten = histogram1DFunctions.flatten;
        hist1D.findPeaks = histogram1DFunctions.findPeaks;
        return hist1D;
    }
    
    var histogram1DFunctions = {
        max : function(cmp){
            return Math.max.apply(null, this);   
        },
        min : function(cmp){
            return Math.min.apply(null, this);   
        },
        cv : function(kernel){
            var _length = this.length;
            var resultHist = new histogram1D(_length);
            var half_kLength = kernel.length/2;
            var kRange = parseInt(half_kLength);
            for( var _Idx = 0; _Idx< _length; ++_Idx){
                for( var k_Idx = -kRange; k_Idx < half_kLength; ++k_Idx){
                    var _value; 
                    if( _Idx + k_Idx < 0 ){
                        _value = this[0];
                    } else if( _Idx + k_Idx > _length -1) {
                        _value = this[_length-1];
                    } else {
                        _value = this[_Idx + k_Idx];   
                    }
                    resultHist[_Idx] += _value * kernel[k_Idx + kRange];    
                }
                resultHist[_Idx] = Math.round(resultHist[_Idx] * 1000)/1000;
            }
            return resultHist;
        },
        medianSmoothing : function(kSize, repeat){
            repeat = typeof repeat !== "undefined"? repeat : 1;
            var resultHist = this;
            var kernel = [];
            for( var idx = 0; idx < kSize; ++idx ){
                kernel[idx] = 1/kSize;
            }
            for(var i=0; i< repeat; ++i){
                resultHist = resultHist.cv(kernel);    
            }
            return resultHist;
        },
        gaussianSmoothing : function(kSize, repeat){
            repeat = typeof repeat !== "undefined"? repeat : 1;
            var resultHist = this;
            var kernel;
            switch(kSize) {
                case 1 : 
                    kernel = [1];
                    break;
                case 3 :
                    kernel = [1,2,1];
                    break;
                case 5 :
                    kernel = [1,4,6,4,1];
                    break;
                case 7 : 
                    kernel = [1,6,15,20,15,6,1];
                    break;
                default : 
                    throw new Error("HAHAHA kSize should be 1,3,5, or 7");
            }
            var kernelSum = kernel.reduce(function(p, c){ return p+c; }); 
            for(var i=0; i< kernel.length; ++i){
                kernel[i] = kernel[i]/kernelSum;
            }
            for(var i=0; i< repeat; ++i){
                resultHist = resultHist.cv(kernel);    
            }
            return resultHist;
        },
        flatten : function(saturate){
            var resultHist = new histogram1D(this.length);
            saturate = saturate * this.max();

            for( var i = 0; i< this.length; ++i){
                if( this[i] > saturate ) resultHist[i] = this[i];
            }
            return resultHist;  
        },
        findPeaks : function(count){
            var self = this;
            var peaks = [];
            var total = 0;
            var state = 0; //0 normal // 1 increase // 2 decrease
            
            var x;
            var peak = {};
            for(x = 0; x< self.length ; ++x){
                total+= self[x];
                //피크의 시작은 넣되 끝은 넣지않는다.
                switch(state){
                    case 0:
                        if(self[x] < self[x+1]) {
                            peak.start = x;
                            peak.size = self[x];
                            state = 1;
                        }else if( x === 0 && self[x] > self[x+1] ) { // first and Decrease
                            peak.start = x;
                            peak.size = self[x];
                            peak.x = x;
                            state = 2;
                        } 
                        break;
                    case 1: // was increased
                        if(self[x] !== self[x+1]){
                            peak.size += self[x];   
                            if(self[x] > self[x+1]){
                                peak.x = x;
                                state = 2;     
                            } 
                        } else {
                            state = 0;
                            peak = {};
                        }
                        break;
                    case 2: // was decreased
                        if(self[x] > self[x+1]) { //still Decrease 
                            peak.size += self[x];
                        } else {
                            peak.end = x;
                            peaks[peaks.length] = peak;
                            peak = {}
                            
                            if(self[x] < self[x+1]) {
                                peak.start = x;
                                peak.size = self[x];
                                state = 1;
                            } else {
                                state = 0;
                            }
                        }
                        break;
                    default:
                        throw new Error("findpeak : unknown state");
                }
            }
            if('start' in peak) {
                peak.end = x;
                if(!('x' in peak)){
                    peak.x = x-1;   
                }
                peaks[peaks.length] = peak;
            }
//                switch(state){
//                    case 0:
//                        if( self[x] < self[x+1] ){ //is Inscreasing
//                            size = self[x];
//                            peak = { start : x };
//                            state = 1;
//                        } else if ( x === 0 && self[x] > self[x+1] ){
//                            size = self[x];
//                            peak = { start : x, x : x };
//                            state = 2;
//                        }
//                        break;
//                    case 1:
//                        size += self[x];
//                        if( self[x] > self[x+1] ){ //is Decreasing 
//                            peak.x = x;
//                            state = 2;
//                        } else if( self[x] === self[x+1] ){ // is normal. this is not peak;
//                            state = 0;
//                        } else if( x + 1 === self.length ){
//                            peak.x = x;
//                            peak.end = x;
//                            peak.size = size;
//                            peaks[peaks.length] = peak;  
//                        }
//                        break;
//                    case 2:
//                        size += self[x];
//                        if( self[x] === self[x+1] ){ //is Normal
//                            peak.end = x;
//                            peak.size = size;
//                            peaks[peaks.length] = peak;  
//                            
//                            state = 0;
//                        } else if ( self[x] < self[x+1] ){
//                            peak.end = x;
//                            peak.size = size;
//                            peaks[peaks.length] = peak;  
//                            
//                            size = self[x];
//                            peak = { start : x };   
//                            state = 1;
//                        }
//                        break;
//                    default:
//                        throw new Error("findpeak _ unknown state");
//                }
                
                
                
                //wow. this is peak.
                
//                if(isPeak.call(this,x)){
//                    var r, l;
//                    //let's find left and right end.
//                    var size = this[x];
//                    for(r = x+1; r < this.length && this[r] > this[r+1] ; ++r){
//                        size += this[r];   
//                    }
//                    for(l = x-1; 0 <= l && this[l] > this[l-1] ; --l){
//                        size += this[l];
//                    }
//                    //push to peaks array.
//                    peaks[peaks.length] = { x : x, size : size, start : l, end :r };   
//                }
                
        
            peaks.sort(function(f,b){ return b.size - f.size });
            for(var i = 0; i<peaks.length; ++i){
                peaks[i].rate = Math.round(peaks[i].size/total * 1000)/1000;   
            }
            return peaks;
            function isPeak(x){
                return (x-1 < 0 || this[x-1] < this[x]) && 
                    (x+1 > this.length || this[x] > this[x+1]);
            }
        }
    } 

    /* Circular1D Histogram */
    function circularHistogram1D(length, init){
        var circularHist1D; 
        if(length instanceof Array){
            circularHist1D = length;
        }else {
            init = typeof init !== 'undefined' ? init : 0;
            circularHist1D = [];
            for(var x = 0; x< length; ++x){
                circularHist1D[x] = init;   
            }
        }
        circularHist1D.circularIndex = circularHistogram1DFunctions.circularIndex;
        circularHist1D.max = circularHistogram1DFunctions.max;
        circularHist1D.min = circularHistogram1DFunctions.min;
        circularHist1D.cv = circularHistogram1DFunctions.cv;
        circularHist1D.medianSmoothing = circularHistogram1DFunctions.medianSmoothing;
        circularHist1D.gaussianSmoothing = circularHistogram1DFunctions.gaussianSmoothing;
        circularHist1D.flatten = circularHistogram1DFunctions.flatten;
        circularHist1D.findPeaks = circularHistogram1DFunctions.findPeaks;
        circularHist1D.normalize = circularHistogram1DFunctions.normalize;
        return circularHist1D;
    }
    
    var circularHistogram1DFunctions = {
        circularIndex: function(idx, assign){
            if( idx >= 0 && idx < this.length){
                if(assign){ 
                    this[idx] = assign;
                } 
                return this[idx];
            }else if(idx < 0){
                return this.circularIndex(idx + this.length);
            }else{
                return this.circularIndex(idx - this.length);
            }    
        },
        max: function(cmp){
            return Math.max.apply(null, this);
        },
        min: function(cmp){
            return Math.min.apply(null, this);
        },
        cv: function(kernel){
            console.log("cv start");
            var _length = this.length;
            var resultHist = new circularHistogram1D(_length);
            var half_kLength = kernel.length/2;
            var kRange = parseInt(half_kLength);
            for( var _Idx = 0; _Idx< _length; ++_Idx){
                for( var k_Idx = -kRange; k_Idx < half_kLength; ++k_Idx){
                    var _value; 
                    _value = this.circularIndex(_Idx + k_Idx);   
//                    if( _Idx + k_Idx < 0 ){
//                        _value = this[0];
//                    } else if( _Idx + k_Idx > _length -1) {
//                        _value = this[_length-1];
//                    } else {
//                        _value = this[_Idx + k_Idx];   
//                    }
//                    console.log(resultHist.circularIndex(_Idx))
                    resultHist.circularIndex(_Idx, (resultHist.circularIndex(_Idx) + _value * kernel[k_Idx + kRange]));
//                    console.log("first");
                }
                resultHist.circularIndex(_Idx, Math.round(resultHist.circularIndex(_Idx) * 1000)/1000);
            }
            return resultHist;
        },
        medianSmoothing : function(kSize, repeat){
            repeat = typeof repeat !== "undefined"? repeat : 1;
            var resultHist = this;
            var kernel = [];
            for( var idx = 0; idx < kSize; ++idx ){
                kernel[idx] = 1/kSize;
            }
            for(var i=0; i< repeat; ++i){
                resultHist = resultHist.cv(kernel);    
            }
            return resultHist;
        },   
        gaussianSmoothing : function(kSize, repeat){
            repeat = typeof repeat !== "undefined"? repeat : 1;
            var resultHist = this;
            var kernel;
            switch(kSize) {
                case 1 : 
                    kernel = [1];
                    break;
                case 3 :
                    kernel = [1,2,1];
                    break;
                case 5 :
                    kernel = [1,4,6,4,1];
                    break;
                case 7 : 
                    kernel = [1,6,15,20,15,6,1];
                    break;
                default : 
                    throw new Error("HAHAHA kSize should be 1,3,5, or 7");
            }
            var kernelSum = kernel.reduce(function(p, c){ return p+c; }); 
            for(var i=0; i< kernel.length; ++i){
                kernel[i] = kernel[i]/kernelSum;
            }
            for(var i=0; i< repeat; ++i){
                resultHist = resultHist.cv(kernel);    
            }
            return resultHist;
        }, 
        flatten: function(saturate){
            var resultHist = new circularHistogram1D(this.length);
            saturate = saturate * this.max();
            for( var i = 0; i< this.length; ++i){
                if( this[i] > saturate ) resultHist[i] = this[i];
            }
            return resultHist;  
        },
        findPeaks: function(count){
            var self = this;
            var peaks = [];
            var total = 0;
            var state = 0; //0 normal // 1 increase // 2 decrease
            
            //    var minDataIndex = this.indexOf(this.min()); // min is zero, ordinally.
            var min = this.min();
            var minDataIndex;
            for(var i=0; i< self.length; ++i){
                if(this[i] === min){
                    minDataIndex = i;
                    break;
                }
            }
            
            var x;
            var peak = {}; console.log(self.join());
            for(x = minDataIndex; x< self.length + minDataIndex; ++x){
                total+= self.circularIndex(x);
                //피크의 시작은 넣되 끝은 넣지않는다.
                switch(state){
                    case 0:
                        if(self.circularIndex(x) < self.circularIndex(x+1)) {
                            peak.start = x;
                            peak.size = self.circularIndex(x);
                            state = 1;
                            console.log( "0->1");
                        }
                        break;
                    case 1: // was increased
                        if(self.circularIndex(x) !== self.circularIndex(x+1)){
                            peak.size += self.circularIndex(x);   
                            if(self.circularIndex(x) > self.circularIndex(x+1)){
                                peak.x = x;
                                state = 2;   
                                console.log( "1->2");
                            } else {
                                console.log( "1->1");   
                            }
                        } else {
                            state = 0;
                            peak = {};
                            console.log( "1->0");
                        }
                        break;
                    case 2: // was decreased
                        if(self.circularIndex(x) > self.circularIndex(x+1)) { //still Decrease 
                            peak.size += self.circularIndex(x);
                            console.log( "2->2");
                        } else {
                            peak.end = x;
                            peaks[peaks.length] = peak;
                            peak = {}
                            
                            if(self.circularIndex(x) < self.circularIndex(x+1)) {
                                peak.start = x;
                                peak.size = self.circularIndex(x);
                                state = 1;
                                console.log( "2->1");
                            } 
                            else {
                                state = 0;
                                console.log( "2->0");
                            }
                        }
                        break;
                    default:
                        throw new Error("findpeak : unknown state");
                }
            }  
//            for(var i= 0; i< peaks.length; ++i){
//                console.log(peaks[i].x);   
//            }
            if('start' in peak) {
                peak.end = x;
                if(!('x' in peak)){
                    peak.x = x-1;   
                }
                peaks[peaks.length] = peak;
            }
            peaks.sort(function(f,b){ return b.size - f.size });
            for(var i = 0; i<peaks.length; ++i){
                peaks[i].rate = peaks[i].size/total;   
            }
            return peaks;
            function isPeak(x){
                return self.circularIndex(x-1) < self.circularIndex(x) && 
                    self.circularIndex(x) > self.circularIndex(x+1);
            }
        },
        normalize: function(idx){
            if( idx < 0 ){
                return this.normalize(idx + this.length)
            }else if( idx > this.length ){
                return this.normalize(idx - this.length);   
            }else{
                return idx;
            }
        } 
    }
//    function circularHistogram1D(width, init){
//        init = typeof init !== 'undefined' ? init : 0;
//        this.width = width;
//        for(var x = 0; x< width; ++x){
//            this[x] = init;   
//        }
//    }
//    circularHistogram1D.prototype.circleIndex = function(idx){
//        if( idx >= 0 && idx < this.width){
//            return this[idx];
//        }else if(idx < 0){
//            return this.circleIndex(idx + this.width);
//        }else{
//            return this.circleIndex(idx - this.width);
//        }    
//    };
//    circularHistogram1D.prototype.max = function(cmp){
//        var arr = [];
//        for( var i =0; i< this.width; ++i){
//            arr[i] = this[i];   
//        }
//        return Math.max.apply(null, arr);   
//    };
//    circularHistogram1D.prototype.min = function(cmp){
//        var arr = [];
//        for( var i =0; i< this.width; ++i){
//            arr[i] = this[i];   
//        }
//        return Math.min.apply(null, arr);   
//    };
//    circularHistogram1D.prototype.cv = function(coeff){
//        var resultHist = new circularHistogram1D(this.width);  
//        var coeffRange = parseInt(coeff.length / 2);
//        for( var i = 0; i< this.width; ++i){
//            for( var cvIdx = -coeffRange; cvIdx <= coeffRange; ++cvIdx){
//                resultHist[i] += this.circleIndex(i + cvIdx) * coeff[cvIdx + coeffRange];
//            }
//            resultHist[i] = Math.round(resultHist[i] * 100)/100;
//        }
//        return resultHist;
//    };
//    circularHistogram1D.prototype.medianSmoothing = function(repeat){
//        repeat = typeof repeat !== "undefined"? repeat : 1;
//        var resultHist = this;
//        var cvCoeff = [1,1,1,1,1];
//        var cvCoeffSum = cvCoeff.reduce(function(p, c){ return p+c; }); 
//        for(var i=0; i< cvCoeff.length; ++i){
//            cvCoeff[i] = cvCoeff[i]/cvCoeffSum;
//        }
//        for(var i=0; i< repeat; ++i){
//            resultHist = resultHist.cv(cvCoeff);    
//        }
//        return resultHist;
//    };    
//    circularHistogram1D.prototype.flatten = function(saturate){
//        var resultHist = new circularHistogram1D(this.width);
//        saturate = saturate * this.max();
//        for( var i = 0; i< this.width; ++i){
//            if( this[i] > saturate ) resultHist[i] = this[i];
//        }
//        return resultHist;  
//    };
//    circularHistogram1D.prototype.findPeaks = function(count){
//        var peaks = [];
//    //    var minDataIndex = this.indexOf(this.min()); // min is zero, ordinally.
//        var min = this.min();
//        var minDataIndex;
//        for(var i=0; i< this.width; ++i){
//            if(this[i] === min){
//                minDataIndex = i;
//                break;
//            }
//        }
//
//        //idx can be <0, or >histLength because loop is started from minDataIndex.
//        //it must be normalized.
//        var total = 0;
//        for(var x = minDataIndex; x< this.width + minDataIndex; ++x){
//            //wow. this is peak.
//            total+= this.circleIndex(x);
//            if(isPeak.call(this,x)){
//                var r, l;
//                //let's find left and right end.
//                var size = this.circleIndex(x);
//                for(r = x+1; this.circleIndex(r) > this.circleIndex(r+1) ; ++r){
//                    size += this.circleIndex(r);   
//                }
//                for(l = x-1; this.circleIndex(l) > this.circleIndex(l-1) ; --l){
//                    size += this.circleIndex(l);
//                }
//                //push to peaks array.
//                peaks.push({ x : this.normalize(x), size : size, 
//                     start : this.normalize(l), end :this.normalize(r) });   
//            }
//        }
//        peaks.sort(function(f,b){ return b.size - f.size });
//        for(var i = 0; i<peaks.length; ++i){
//            peaks[i].rate = peaks[i].size/total;   
//        }
//        return peaks;
//        function isPeak(x){
//            return this.circleIndex(x-1) < this.circleIndex(x) && 
//                this.circleIndex(x) > this.circleIndex(x+1);
//        }
//    }    
//    circularHistogram1D.prototype.normalize = function(idx){
//        if( idx < 0 ){
//            return this.normalize(idx + this.width)
//        }else if( idx > this.width ){
//            return this.normalize(idx - this.width);   
//        }else{
//            return idx;
//        }
//    }
    /* 2Dhistogram */
    function histogram2D(width, height, init){
        init = typeof init !== 'undefined' ? init : 0;
        this.width = width;
        this.height = height;
        for(var x = 0; x < width; ++x){
            this[x] = [];
            for(var y = 0; y <height; ++y){
                this[x][y] = init;    
            }
        }
    };
    histogram2D.prototype.max = function(cmp){
        var max = 0;
        for(var i = 0; i < this.width; ++i){
            var iMax = Math.max.apply(null, this[i]);
            if(max < iMax) max = iMax;
        }
        return max;
    };
    histogram2D.prototype.min = function(cmp){
        var min = 0;
        for(var i = 0; i < this.width; ++i){
            var iMin = Math.min.apply(null, this[i]);
            if(min < iMin) min = iMin;
        }
        return min;
    };
    histogram2D.prototype.loop = function(doing){
        for(var x =0; x< this.width; ++x){
            for(var y =0; y< this.height; ++y){
                doing.call(this,x,y);   
            }
        }
    };
    histogram2D.prototype.cv = function(mat, saturate){
        saturate = typeof saturate !== "undefined" ? saturate : 1;
        var resultHist = new histogram2D(this.width, this.height);
        var matSize = parseInt(Math.sqrt(mat.length));
        var cvRange = parseInt(matSize/2);
        for(var x =0; x< this.width; ++x){
            for(var y =0; y< this.height; ++y){
                if( x >= cvRange && y >= cvRange && 
                   x < this.width - cvRange && y < this.height - cvRange ){
                    for(var i = -cvRange; i <= cvRange; ++i ){
                        for(var j = -cvRange; j<= cvRange; ++j ){
                            var matIndex = (i+cvRange)*matSize + j + cvRange;
                            resultHist[x][y] += this[x+i][y+j] * mat[matIndex];
                        }
                    }
                }
                //소수점 6번째 자리까지.
                resultHist[x][y] = Math.round(resultHist[x][y]*1000000)/1000000;
            }      
        }
        return resultHist;
    };
    histogram2D.prototype.medianSmoothing = function(repeat){
        repeat = typeof repeat !== "undefined"? repeat : 1;
        var resultHist = this;
        var mat = [1,1,1,1,1,
                   1,1,1,1,1,
                   1,1,1,1,1,
                   1,1,1,1,1,
                   1,1,1,1,1];
        var matSum = mat.reduce(function(p, c){ return p+c; }); 
        for(var i=0; i< mat.length; ++i){
            mat[i] = mat[i]/matSum;
        }
        for(var i=0; i< repeat; ++i){
            resultHist = resultHist.cv(mat);    
        }
        return resultHist;
    };
    histogram2D.prototype.flatten = function(saturate){
        var resultHist = new histogram2D(this.width, this.height);
        saturate = saturate * this.max();
        for( var x = 0; x< this.width; ++x){
            for( var y =0; y< this.height; ++y){
                if( this[x][y] > saturate ) resultHist[x][y] = this[x][y];
            }
        }
        return resultHist;   
    };
    histogram2D.prototype.binary = function toBinary2DHist(saturate){
        var resultHist = new histogram2D(this.width, this.height);
        saturate = saturate * this.max();
        for( var x = 0; x< this.width; ++x){
            for( var y =0; y< this.height; ++y){
                if( this[x][y] > saturate ) resultHist[x][y] = 1;
            }
        }
        return resultHist;
    };
    histogram2D.prototype.findPeaks = function(){
        var peaks = [];
        var total = 0;
        for(var x = 0; x < this.width; ++x){
            for(var y =0; y< this.height; ++y){
                total += this[x][y];
                var r,l,u,d;

                if(isPeak.call(this,x,y)){
                    var size = this[x][y];
                    for(r = x+1; r < this.width && this[r][y] > this[r+1][y] ; ++r){
                        for(u = y+1; u < this.height && this[r][u] > this[r][u+1]; ++u){
                            size += this[r][u];   
                        }
                        for(d = y-1; 0 <= d && this[r][d] > this[r][d-1]; --d){
                            size += this[r][d];   
                        }
                    }
                    for(l = x-1; 0 <= l && this[l] > this[l-1] ; --l){
                        for(u = y+1; u < this.height && this[l][u] > this[l][u+1]; ++u){
                            size += this[l][u];   
                        }
                        for(d = y-1; 0 <= d && this[l][d] > this[l][d-1]; --d){
                            size += this[l][d];   
                        }
                    }
                    peaks[peaks.length] = {x: x, y: y, height: this[x][y], size: size};
                }
            }
        }

        peaks.sort(function(f,b){ return b.size - f.size });
        for(var i = 0; i<peaks.length; ++i){
            peaks[i].rate = peaks[i].size/total;   
        }
        return peaks;
        function isPeak(x,y){        
            var ul = 
                (x<=0|| y>=this.height-1) || 
                (this[x][y] > this[x-1][y+1]) ? true : false;
            var uu = 
                (y>=this.height-1) || 
                (this[x][y] > this[x][y+1])? true : false;
            var ur = 
                (x >= this.width-1 || y>=this.height-1) || 
                (this[x][y] > this[x+1][y+1])? true : false;
            var ll = 
                (x<=0) || 
                (this[x][y] > this[x-1][y])? true : false;
            var rr = 
                (x >= this.width-1) ||
                (this[x][y] > this[x+1][y])? true : false;
            var dl = 
                (x<=0 || y<=0) || 
                (this[x][y] > this[x-1][y-1])? true : false;
            var dd = 
                (y<=0) ||
                (this[x][y] > this[x][y-1])? true : false;
            var dr = 
                (x >= this.width-1 || y<=0) ||
                (this[x][y] > this[x+1][y-1])? true : false;
    //        if( x <= 0 ){
    //            
    //        }
    //        if( x >= this.length-1 ){
    //            
    //        }
    //        if( y <= 0){
    //            
    //        }
    //        if( y >= this[0].length-1 ){
    //            
    //        }
            return ul && uu && ur && ll && rr && dl && dd && dr;
        }
    };   
    var HistogramAnalyze = {
        histogram1D : histogram1D,
        circularHistogram1D : circularHistogram1D,
        histogram2D : histogram2D
    }
    return HistogramAnalyze;
}));
