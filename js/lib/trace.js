/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 *
 * trace.js
 *
 * A wrapper for console.log which only executes if window.DEBUG === true
 * Logging is enabled if the global variable DEBUG is set.
 *
 */

"use strict";

(function(ns) {
	if(ns.console && ns.console.log){
		ns.trace = function(){
			if(ns.DEBUG){
				ns.console.log.apply(ns.console, arguments);
			}
		};
	}else{
		ns.trace = function(){};
	}
})(window);
