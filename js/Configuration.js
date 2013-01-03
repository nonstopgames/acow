/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * Configuration.js
 *
 * XML-based global game settings interface. Replaces the old
 * settings.js global variable file, hopefully improving readability
 * and maintainability. Lends itself to automatic error checking, at
 * the cost of some execution speed.
 * 
 * Also provides basic separation between game settings and
 * client code, making cheating just a bit harder, if done right.
 *
 * creation date: 15-06-2012
 * 
 */

"use strict";

/**
 *
 *
 */
function Configuration(xml) {
	this._xml_path = xml;
	this._xml_data = null;
	
	this.onLoadComplete = function(){};
}

/*
 * Start loading configuration data
 */
Configuration.prototype.load = function() {
	XMLLoader.load(this._xml_path,this.__parseXML,this);
	return this;
};

/**
 * Extract a boolean value from the loaded configuration data
 *
 * @param id dot-separated path string in the XML tree (eg. 'game.playerName')
 * @param default_value default value, if parameter is not found. If omitted, the function will throw an error indicating what part of the configuration string did not exist.
 * @returns a boolean value
 * 
 */
Configuration.prototype.getBoolean = function(id,default_value) {
	var val = null;
	try {
		val = XMLLoader.getValue(this._xml_data,id);
		return (val == true) || (val.toString().toLowerCase() == 'true');
	} catch(err) {
		return default_value;
	}
	
};

Configuration.prototype.getInteger = function(id,default_value) {
	var val = null;
	try {
		val  = XMLLoader.getValue(this._xml_data,id);
		return parseInt(val);
	} catch(err) {
		trace("Configuration: Error fetching " + id + ", error code: " + err);
		return default_value;
	}
};

Configuration.prototype.getFloat = function(id,default_value) {
	var val = null;
	try {
		val  = XMLLoader.getValue(this._xml_data,id);
		return parseFloat(val);
	} catch(err) {
		return default_value;
	}
};

Configuration.prototype.getString = function(id,default_value) {
	var val = null;
	try {
		val  = XMLLoader.getValue(this._xml_data,id);
		return "" + val;
	} catch(err) {
		return default_value;
	}
};

/**
 * Callback function from XML Loader. XML parameter is the XML document root
 * as returned from the XMLHttpRequest.
 */
Configuration.prototype.__parseXML = function(xml) {
	// trace("Configuration: got " + xml);
	this._xml_data = XMLLoader.toObject(xml);
	trace("Configuration loaded.");
	this.onLoadComplete.call(this);
};
