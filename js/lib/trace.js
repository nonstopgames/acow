/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * trace.js
 *
 * Simple devtime tracing function. Provides
 * environment-dependent debugging output.
 * Named after ActionScript's trace function
 * (although it's a bit inaccurate).
 *
 * Logging is enabled if the global variable DEBUG is set.
 *
 */

"use strict";

(function(ns) {

	// Detect client
	var client = 'unknown';
	var agent = navigator.userAgent;

	if(agent.indexOf("Safari") != 0-1) client = 'safari';
	if(agent.indexOf('Chrome')  != -1) client = 'chrome';
	if(agent.indexOf('Firefox') != -1) client = 'firefox';
	if(window.opera) client = 'opera';

	// Assign actual tracing function
	var doTrace = null;
	switch(client) {
		case 'safari':
		case 'chrome':
		case 'firefox':
			doTrace = function(arg) {
				console.log('>> ' + arg);
			};
		break;
		case 'opera':
			doTrace = function(args) {
				opera.postError('>> ' + arg);
			};
		break;
		default:
			// Don't know how to log
			doTrace = function() {};
		break;
	}

	// Create front-end
	ns.trace = function() {
		if(ns.DEBUG) {
			doTrace((Array.prototype.splice.call(arguments,0)).join(' '));
		}
	};
	
})(window);
