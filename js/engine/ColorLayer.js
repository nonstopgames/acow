/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * ColorLayer.js
 *
 * SceneNode, that fills the entire screen (or a certain area) with a certain color.
 *
 * creation date: 30-08-2012
 */

function ColorLayer() {
	
	SceneNode.call(this);
	
	this._fillScreen = true;
	
	this._rect_x0 = 0;
	this._rect_x1 = 0;
	this._rect_y0 = 0;
	this._rect_y1 = 0;
	
	this._color_str = "rgba(0,0,0,0.5)";
	this._color_r = 0;
	this._color_g = 0;
	this._color_b = 0;
	this._color_a = 0;
	
};
ColorLayer.inherits(SceneNode);

ColorLayer.prototype.setArea = function(x0,y0,x1,y1) {
	if(x0 || y0 || x1 || y1) {
		this._rect_x0 = x0 || 0;
		this._rect_y0 = y0 || 0;
		this._rect_x1 = x1 || 0;
		this._rect_y1 = y1 || 0;
		this._fillScreen = false;
	} else {
		this._fillScreen = true;
	}
	return this;
};

ColorLayer.prototype.setColor = function(r,g,b,a) {
	this._color_r = (r && (r > 255 ? 255 : r < 0 ? 0 : r)) || 0;
	this._color_g = (g && (g > 255 ? 255 : g < 0 ? 0 : g)) || 0;
	this._color_b = (b && (b > 255 ? 255 : b < 0 ? 0 : b)) || 0;
	this._color_a = (a && (a > 255 ? 255 : a < 0 ? 0 : a)) || 0;
	this._color_str = "rgba(" + r + "," + g + "," + b + "," + a + ")";
	return this;
};

ColorLayer.prototype.draw = function(canvas,context,matrix) {
	
	if(this._fillScreen) {
		context.setTransform(1,0,0,1,0,0);
		context.fillStyle = this._color_str;
		context.fillRect(0,0,canvas.width,canvas.height);
	} else {
		matrix.applyTo(context);
		context.fillStyle = this._color_str;
		context.beginPath();
		context.rect(this._rect_x0,this._rect_y0,this._rect_x1 - this._rect_x0,this._rect_y1 - this._rect_y0);
		context.closePath();
		context.fill();
	}
	context.fillStyle = "";
	
};

