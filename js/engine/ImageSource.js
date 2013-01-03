/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * ImageSource.js
 *
 * An interface for eg. the Sprite class to get image
 * drawing data from.
 *
 * Enables usage of arbitrary graphics data sources
 * without changes to actual drawing code.
 *
 * creation date: 05-06-2012
 */

"use strict";

/**
 * ImageSource interface class. Implementing classes should
 * inherit from this.
 */
function ImageSource() {

	this.source_data = null; // Reference to drawable data source
	this.source_x = 0;       // x coordinate of intended drawing rectangle
	this.source_y = 0;       // y coordinate of intended drawing rectangle
	this.source_w = 0;       // width of intended drawing rectangle
	this.source_h = 0;       // height of intended drawing rectangle
	
};

/**
 * Get a reference to the actual image data
 */
ImageSource.prototype.getSource = function() {
	return this.source_data;
};

/**
 * Get the X coordinate of the source drawing rectangle
 */
ImageSource.prototype.getX = function() {
	return this.source_x;
};

/**
 * Get the Y coordinate of the source drawing rectangle
 */
ImageSource.prototype.getY = function() {
	return this.source_y;
};

/**
 * Get the width of the source drawing rectangle
 */
ImageSource.prototype.getWidth = function() {
	return this.source_w;
};

/**
 * Get the height of the source drawing rectangle
 */
ImageSource.prototype.getHeight = function() {
	return this.source_h;
};

