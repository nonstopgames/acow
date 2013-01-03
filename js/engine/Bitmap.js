/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * Bitmap.js
 *
 * A simple image as ImageSource.
 *
 * creation date: 05-06-2012
 */

"use strict";

/**
 * Bitmap - simplest possible image source.
 * Just wraps the JavaScript Image element.
 *
 * @param src source for the image data. If src is not an Image, will try to get Image from AssetManager.
 */
function Bitmap(src) {

	ImageSource.call(this);
	
	// Acquire a source
	if(src instanceof Image) {
		// A HTML image element. Extract the necessary parameters..
		this.source_data = src;
	} else {
		throw new Error("Bitmap has no image source");
	}

	this.source_x = 0;
	this.source_y = 0;
	this.source_w = this.source_data.width;
	this.source_h = this.source_data.height;
	
}
Bitmap.inherits(ImageSource);

