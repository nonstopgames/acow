/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * Ease.js
 *
 * Easing functions.
 * These are not borrowed from licence-encumbered
 * libraries (like TweenMAX), but have been created
 * by good old-fashioned hard work and math.
 *
 * creation date: 12-06-2012
 */


"use strict";

window.Ease = {

	// Linear interpolation
	lerp: function(bias,min,max) {
		return min + (bias * (max - min));
	},
	
	// Linear interpolation smoothed over sine curve (function grows and peaks smoothly)
	sin_lerp: function(bias,min,max) {
		return Ease.lerp((Math.sin((bias * Math.PI) + (1.5 * Math.PI) ) + 1.0) * 0.5,min,max);
	},

	// Linear interpolation over falling half sine wave
	sin_lerp_out: function(bias,min,max) {
		if(bias >= 0.0 && bias <= 1.0) {
			bias = Math.sin(bias * Math.PI * 0.5);
		}
		return min + (bias * (max - min));
	},

	// Linear interpolation over rising half sine wave
	sin_lerp_in: function(bias,min,max) {
		if(bias >= 0.0 && bias <= 1.0) {
			bias = 1.0 - Math.cos(bias * Math.PI * 0.5);
		}
		return min + (bias * (max - min));
	},
	
	// Parabolic interpolation (starts at min, reaches max at 0.5, then goes towards min again)
	parabola: function(bias,min,max) {
		// Y = a(X^2) + c, where x is between -0.5 and 0.5
		var c = max - min;
		var a = -4 * c;
		var x = bias - 0.5;
		return (a * (x * x) + c) + min;
	}
	
};
