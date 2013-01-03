/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * TextSprite.js
 *
 * A scene graph node that draws text on a canvas.
 * Name suggestions welcome.
 *
 * creation date: 30-06-2012
 *
 */

"use strict";

/**
 * Class for drawing text on a canvas. Fits into the scene graph. :)
 *
 * @param fontname name of font to use
 * @param fontsize pointsize of font to use
 * @text optional string to display
 */
function TextSprite(fontname,fontsize,text) {
	SceneNode.call(this);

	this._font_name = "" + fontname;
	this._font_size = fontsize;
	this._font_string = this._font_size + "px " + this._font_name;
	this._font_weight = "normal";
	this._text = null;
	this.setText(text ? ("" + text) : "");
	this._fillColor = "Black";
	this._strokeColor = null;
	this._shadowColor = null;
	this._shadowRadius = 0;
	this._drawmode = TextSprite.DrawMode.ALPHA;
	this.updateFontString();
};
TextSprite.inherits(SceneNode);

TextSprite.DrawMode = (function() {
	var i = 0;
	return {
		ALPHA: i++,
		ADDITIVE: i++
	};
})();

/**
 * Set drawmode of this text sprite. Only affects fill color.
 * Mode must be a value in TextSprite.DrawMode.
 */
TextSprite.prototype.setDrawMode = function(mode) {
	this._drawmode = mode;
	return this;
};

TextSprite.prototype.setTextColor = function(r,g,b,a) {
	this._fillColor = "rgba(" + r + "," + g + "," + b + "," + a + ")";
	return this;
};

TextSprite.prototype.setTextOutlineColor = function(r,g,b,a) {
	if(r === null || r === undefined) {
		this._strokeColor = null;
	} else {
		this._strokeColor = "rgba(" + r + "," + g + "," + b + "," + a + ")";
	}
	return this;
};

TextSprite.prototype.setShadow = function(r,g,b,a,radius) {
	// NOTE: 30-08-2012: Disabled text shadows on mobiles due to some kind of hardware acceleration bug in webkit.
	if(r === null || r === undefined || Engine.getInstance().getEnvironment().isMobile()) {
		this._shadowColor = null;
		this._shadowRadius = 0;
	} else {
		this._shadowColor = "rgba(" + r + "," + g + "," + b + "," + a + ")";
		this._shadowRadius = +radius;
	}
	
};

TextSprite.prototype.setFontWeight = function(str) {
	this._font_weight = "" + str;
	this.updateFontString();
	return this;
};

TextSprite.prototype.setFontName = function(name) {
	this._font_name = "" + name;
	this.updateFontString();
	return this;
};

TextSprite.prototype.setFontSize = function(size) {
	this._font_size = +size;
	this.updateFontString();
	return this;
};

TextSprite.prototype.updateFontString = function() {
	this._font_string = this._font_weight + " " + this._font_size + "px " + this._font_name;
	this.updateSize();
	return this;
};

TextSprite.prototype.setText = function(text) {
	this._text = "" + text;
	this.updateFontString();
	return this;
};

/*
 * One more nasty function.. You need to pass the canvas context to this function
 * to get the text size.
 */
TextSprite.prototype.updateSize = function() {
	var context = Engine.getDummyContext();
	context.setTransform(1,0,0,1,0,0);
	context.font = this._font_string;
	var measure = context.measureText(this._text);
	var w = measure.width;
	var h = measure.height;
	this.setSize(w,h);
};

TextSprite.prototype.draw = function(canvas,context,matrix) {

	matrix.applyTo(context);

	var w = this.getRealWidth() * 0.5;
	var h = this.getRealHeight() * 0.5;
	
	if(this._drawmode === TextSprite.DrawMode.ADDITIVE) {
		context.globalCompositeOperation = 'lighter';
	}
	
	if(this._shadowColor) {
		context.shadowColor = this._shadowColor;
		context.shadowBlur = this._shadowRadius;
	}
	
	context.font = this._font_string;
	context.fillStyle = this._fillColor;
	context.fillText(this._text,-w,-h);
	
	if(this._shadowColor) {
		context.shadowColor = "";
		context.shadowBlur = 0;
	}
	
	if(this._drawmode === TextSprite.DrawMode.ADDITIVE) {
		context.globalCompositeOperation = 'source-over';
	}
	
	if(this._strokeColor) {
		context.strokeStyle = this._strokeColor;
		context.strokeText(this._text,-w,-h);
		context.strokeStyle = "";
	}
	
};
