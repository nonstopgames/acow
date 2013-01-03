/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * CoolButton.js
 *
 * A button that uses nice graphics!
 * A lot of copy-paste from SoftButton
 * Consider making a Button class that serves as the prototype for both buttons
 *
 * creation date: 13-12-2012
 */

"use strict";

function CoolButton(text, padding) {
	SceneNode.call(this);

	if(!CoolButton.backend_ready){
		CoolButton.onleft = g_assets.getBitmap('button-on-left');
		CoolButton.onright = g_assets.getBitmap('button-on-right');
		CoolButton.onfill = g_assets.getBitmap('button-on-fill');
		CoolButton.offleft = g_assets.getBitmap('button-off-left');
		CoolButton.offright = g_assets.getBitmap('button-off-right');
		CoolButton.offfill = g_assets.getBitmap('button-off-fill');
		CoolButton.height = CoolButton.offfill.getHeight();
		CoolButton.padding = CoolButton.offleft.getWidth();
		CoolButton.backend_ready = true;
	}

	padding = padding || 5;

	this._padding = padding;
	
	this._text = new TextSprite('Germania One',32,text);
	this._text.setTextColor(255,255,255,1);
	this._text.setShadow(0,0,0, 1, 3);
	this.setSize(Math.floor(this._text.getWidth() + this._padding * 2 + CoolButton.padding * 2), CoolButton.height);
	this._text.setPosition(0, this.getHeight() / 2 - 24);
	this.setOffset(-this.getWidth() / 2, -this.getHeight() / 2);

	this._locked = false;
	
	this._real_x = 0;
	this._real_y = 0;
	this._real_width = this.getWidth();
	this._real_height = this.getHeight();

	this._pressed = false;
	
	this.onClick = null;

	this._cache_on = new Image();
	this._cache_off = new Image();

	this.updateCache();

	this.addChild(this._text);
	
};
CoolButton.inherits(SceneNode);

CoolButton.prototype.setLocked = function(b) {
	this._locked = (b == true);
	return this;
};

CoolButton.prototype.isLocked = function() {
	return this._locked;
};

CoolButton.prototype.update = function(mouse_x,mouse_y,mouse_down) {

	if(this._locked) return;
	
	// We assume we're operating in 1:1 coordinate space with regards to input coordinates
	// This changes once we have working local-to-global-to-local functionality

	var x = this.getX();
	var w = this.getWidth();
	var y = this.getY();
	var h = this.getHeight();
	var r = false;

	x -= w / 2;
	y -= h / 2;

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

CoolButton.prototype.updateCache = function() {
	var cimg = document.createElement('canvas');
	cimg.setAttribute('width', this.getWidth());
	cimg.setAttribute('height', this.getHeight());
	var context = cimg.getContext('2d');

	var w = this.getWidth();
	var h = this.getHeight();
	var mw = CoolButton.padding;
	var sw = CoolButton.offfill.getWidth();

	for(var i = mw - 1; i < w - mw; i+= sw){
		context.drawImage(CoolButton.offfill.getSource(), 0, 0, sw, h, i, 0, sw, h);
	}

	context.drawImage(CoolButton.offleft.getSource(), 0, 0, mw, h, 0, 0, mw, h);
	context.drawImage(CoolButton.offright.getSource(), 0, 0, mw, h, w - mw, 0, mw, h);
	this._cache_off.src = cimg.toDataURL();

	context.clearRect(0, 0, w, h);

	for(var i = mw - 1; i < w - mw; i+= sw){
		context.drawImage(CoolButton.onfill.getSource(), 0, 0, sw, h, i, 0, sw, h);
	}

	context.drawImage(CoolButton.onleft.getSource(), 0, 0, mw, h, 0, 0, mw, h);
	context.drawImage(CoolButton.onright.getSource(), 0, 0, mw, h, w - mw, 0, mw, h);
	this._cache_on.src = cimg.toDataURL();
};

CoolButton.prototype.draw = function(canvas,context,matrix) {
	
	matrix.applyTo(context);
	
	var w = this.getRealWidth();
	var h = this.getRealHeight();
	var hw = w * 0.5;
	var hh = h * 0.5;
	var img = this._pressed ? this._cache_on : this._cache_off;

	context.drawImage(img, 0, 0, w, h, -hw, -hh, w, h);
	
};

CoolButton.backend_ready = false;
