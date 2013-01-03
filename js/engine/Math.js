/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * Math.js
 *
 * A few necessary math things..
 *
 * creation date: 06-06-2012
 */

"use strict";

(function(ns) {

	//
	// Add degree->radian->degree conversion factors to window (so as to
	// be accessible from the global namespace)
	//
	
	if(ns.RAD_TO_DEG === undefined) ns.RAD_TO_DEG = 57.2957795130832892;
	if(ns.DEG_TO_RAD === undefined) ns.DEG_TO_RAD = 0.01745329251994329;
	
})(window);

// Add random integer function
if(Math.rand === undefined) {

	/**
	 * Return random value between min and max
	 * or 0 and min
	 *
	 * @param min an integer value
	 * @param max an integer value
	 * @returns an integer between 0 and max
	 */
	Math.rand = function(min,max) {
		if(max === undefined)
			return (Math.random() * min) | 0;
		return (min + (Math.random() * (max - min))) | 0;
	};
	
	
	
};

// Add a degree->radian conversion function to Math
if(Math.toRadian === undefined) {

	/**
	 * Convert angle value in degrees to radians
	 *
	 * @param value angle value, in degrees.
	 * @returns angle value in radians
	 */
	Math.toRadian = function(value) {
		return value * DEG_TO_RAD;
	};
}

// Add a radian->degree conversion function to Math
if(Math.toDegree === undefined) {

	/**
	 * Convert angle value in radians to degrees
	 *
	 * @param value angle value, in radians.
	 * @returns angle value in degrees
	 */
	Math.toDegree = function(value) {
		return value * RAD_TO_DEG;
	};
}

// Add a floating-point pseudo-mod function to Math
if(Math.float_mod === undefined) {

	/**
	 * Floating-point pseudo-modulo (used for wrapping values).
	 * Returns positive value between 0 and y.
	 * NOTE: assumes y is nonzero
	 * 
	 * See http://stackoverflow.com/questions/4633177/c-how-to-wrap-a-float-to-the-interval-pi-pi
	 *
	 * @param x operand value
	 * @param y bound value
	 * @returns a floating point value between 0 and y
	 */
	Math.float_mod = function(x,y) {
		return x - (y * ((x / y) | 0));
	};
}

// Add a floating-point value wrapping function to Math
if(Math.float_wrap === undefined) {
	
	/**
	 * Floating-point value wrapping function based on
	 * pseudo-modulo.
	 *
	 * NOTE: assumes min and max are not equal
	 *
	 * @param value value to wrap
	 * @param min minimum bound
	 * @param max maximum bound
	 * @returns a floating point value wrapped to the range [min,max[
	 */
	Math.float_wrap = function(value,min,max) {
		var y = max - min;
		var x = value - min;
		return min + (x - (y * ((x / y) | 0)));
	};
}

// Add a [0..360] wrapping function to Math
if(Math.wrap360 === undefined) {

	/**
	 * Confine a value to interval [0..360], wrapping around
	 * to uppoer or lower bound on overflow.
	 * Useful for eliminating uncontrolled value growth in angle calculations.
	 *
	 * @param value any floating-point vlaue
	 * @returns a value between 0 and 360
	 */
	Math.wrap360 = function(value) {
		return Math.float_mod(value,360.0);
	};
};

// Add a function to find the minimum values in an array of vectors to Math
if(Math.min_vec2 === undefined) {

	/**
	 * Find the minimum component values in an array of vectors (vec2 objects).
	 * See Vector.js
	 * <p>
	 * Actually, this function can be used to find the minimum x and y properties of any
	 * object containing those. Don't tell mommy.
	 * 
	 * @param array an array containing ONLY vec2 objects. NO checks are done to confirm this.
	 * @param result optional result vector.
	 * @returns a vec2 object, or result, if defined. x and y components will be the minimum x and y components of vectors in array.
	 */
	Math.min_vec2 = function(array,result) {
		var r = result;
		if(result === undefined) r = new vec2();

		if(array.length) {

			var v = array[0];
			r.x = v.x;
			r.y = v.y;
			for(var i = 1; i < array.length; ++i) {
				v = array[i];
				if(v.x < r.x) r.x = v.x;
				if(v.y < r.y) r.y = v.y;
			}
			
		}

		return r;
	};
};

// Add a function to find the maximum values in an array of vectors to Math
if(Math.max_vec2 === undefined) {

	/**
	 * Find the maximum component values in an array of vectors (vec2 objects).
	 * See Vector.js
	 * <p>
	 * Actually, this function can be used to find the maximum x and y properties of any
	 * object containing those. Don't tell mommy.
	 *
	 * @param array an array containing ONLY vec2 objects. NO checks are done to confirm this.
	 * @param result optional result vector.
	 * @returns a vec2 object, or result, if defined. x and y components will be the maximum x and y components of vectors in array.
	 */
	Math.max_vec2 = function(array,result) {
		var r = result;
		if(result === undefined) r = new vec2();

		if(array.length) {

			var v = array[0];
			r.x = v.x;
			r.y = v.y;
			for(var i = 1; i < array.length; ++i) {
				v = array[i];
				if(v.x > r.x) r.x = v.x;
				if(v.y > r.y) r.y = v.y;
			}

		}

		return r;
	};
};
