/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * Cloud.js
 *
 * Simple class for cloud control logic
 *
 * creation date: 23-07-2012
 */

"use strict";

Cloud.bitmaps = [];
function Cloud() {

	if(!Cloud.bitmaps.length) {
		Cloud.bitmaps.push(g_assets.getBitmap('cloud-1'));
		Cloud.bitmaps.push(g_assets.getBitmap('cloud-2'));
		Cloud.bitmaps.push(g_assets.getBitmap('cloud-3'));
	}

	var layer = (Math.random() * 3) & 2;
	
	Sprite.call(this,Cloud.bitmaps[layer]);
	
	this._cloud_speed = (layer + 1 + (Math.random() * 0.25)) * 4.7;
	
};
Cloud.inherits(Sprite);

Cloud.prototype.init = function() {
	var w = this.getWidth();
	var h = this.getHeight();

	this.setPosition(Math.random() * (g_game.getLevelRealWidth() + (w * 2)) - w, Math.random() * (g_game.getLevelRealHeight() + (h * 2)) - h);
};

Cloud.prototype.update = function(sync) {
	
	var w = this.getWidth();
	var h = this.getHeight();
	var x = this.getX();
	var y = this.getY();
	//var d = this._cloud_speed;
	
	// NOTE: WORK IN PROGRESS
	
	x += this._cloud_speed * sync;
	y += this._cloud_speed * -0.075 * sync;

	x = Math.float_wrap(x,-w,g_game.getLevelRealWidth() + w);
	y = Math.float_wrap(y,-h,g_game.getLevelRealHeight() + h);
	
	this.setPosition(x,y);
	
};
