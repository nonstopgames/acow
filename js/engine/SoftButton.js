/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 *
 * SoftButton.js
 *
 * A button implemented as a scene graph object.
 * Done so as to fix a lot of input handler nastiness.
 *
 * creation date: 17-07-2012
 */

"use strict";

function SoftButton(image) {
	SceneNode.call(this);
	
	this._image = image;
	this.setSize(this._image.getWidth(),this._image.getHeight());
	this.setOffset(this.getWidth() * 0.5,this.getHeight() * 0.5);

	this._locked = false;
	
	this._real_x = 0;
	this._real_y = 0;
	this._real_width = this.getWidth();
	this._real_height = this.getHeight();

	this._pressed = false;
	
	this.onClick = null;
	
};
SoftButton.inherits(SceneNode);

SoftButton.prototype.setLocked = function(b) {
	this._locked = (b == true);
	return this;
};

SoftButton.prototype.isLocked = function() {
	return this._locked;
};

SoftButton.prototype.update = function(mouse_x,mouse_y,mouse_down) {

	if(this._locked) return;
	
	// We assume we're operating in 1:1 coordinate space with regards to input coordinates
	// This changes once we have working local-to-global-to-local functionality

	var x = this.getX();
	var w = this.getWidth();
	var y = this.getY();
	var h = this.getHeight();
	var r = false;

	// Mouse coordinates are inside the button
	if(mouse_x >= x && mouse_x < x + w && mouse_y >= y && mouse_y < y + h) {

		r = true;
		
		if(!mouse_down && this._pressed) {
			this._pressed = false;
			if(this.onClick) this.onClick.call(this);
		}

		if(mouse_down) {
			this._pressed = true;
		}

	} else {
		if(mouse_down && this._pressed) {
			this._pressed = false;
			r = true;
		}
	}

	return r;

};

SoftButton.prototype.draw = function(canvas,context,matrix) {
	
	matrix.applyTo(context);
	
	var w = this.getRealWidth();
	var h = this.getRealHeight();
	var hw = w * 0.5;
	var hh = h * 0.5;

	var xoffs = this._pressed ? 2 : 0;
	var yoffs = this._pressed ? 2 : 0;
	
	context.drawImage(this._image.getSource(), this._image.getX(), this._image.getY(), w, h, -hw + xoffs, -hh + yoffs, w, h);
	
};
