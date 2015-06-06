Histogram-analyze 
==========

Histogram-analyze is a simple histogram analyzing tool working on Browser, Requirejs, Node.


    
# How to use

Histogram-analyze have 3 features 
* histogram1D
* circularHistogram1D
* histogram2D

### constructor 
``` javascript
new HistogramAnalze.histogram1D( 5 ); //  [0,0,0,0,0]
new HistogramAnalze.circularHistogram1D( 5 , 1 ); //  [1,1,1,1,1]
new HistogramAnalyze.histogram2D( 3, 3, 1 ); // [  [1,1,1],  
										 //	   [1,1,1], 	
										 //	   [1,1,1] ]
```

### common 

``` javascript
.max() 
.min()
```

``` javascript
.cv(kernel) 
.medianSmoothing(kSize[, repeat])
.gaussianSmoothing(kSize[, repeat])
.flatten(saturate) // make 0 below saturate * max 
.findpeaks()
```

### use like this
```javascript

var histogram1D = HistogramAnalyze.histogram1D

histogram1D([1,0,4,5,20,4,3,3,11,1,2,1])
	.flatten(0.1)
	.findpeaks()
	
    
//  =  [{ l_end: 1, x: 4, r_end: 6, size: 36, rate: 0.72 }
//      { l_end: 7, x: 8, r_end: 9, size: 14, rate: 0.28 }]

histogram1D([1,0,4,5,20,4,3,3,11,1,2,1])
    .smoothing(3,2)
	.flatten(0.1)
	.findpeaks()
    
//  =  [{ l_end: 0, x: 4, r_end: 7, size: 42.446, rate: 0.791 }]

// size means the sum from l_end to r_end
// rate is size / total.

// same on hist2D cirHist1D.
	
```

