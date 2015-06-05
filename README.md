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
.findpicks()
```

### use like this
```javascript

var histogram1D = HistogramAnalyze.histogram1D

histogram1D([1,2,3,4,7,4,3,3,1]))
	.smoothing(3)
	.flatten(0.1)
	.findpicks()
	
//	[ { x: 4,
//	    size: 22.555,
//      rangeL: 0,
//      rangeR: 5,
//      rate: 0.4413117063530885 },
//    { x: 8,
//      size: 4.444,
//      rangeL: 7,
//      rangeR: 9,
//      rate: 0.08695141755855133 } ]

// same on hist2D cirHist1D.
	
```

