/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * Castle.js
 *
 * Castle/tower handling code
 * 
 * creation date: 21-06-2012
 */

"use strict";

function Castle() {
	Friendly.call(this);

	this._bitmap = g_assets.getBitmap('castle');
	this._animation = g_assets.getAnimation('castle-anim');
	this._disabled_animation = g_assets.getAnimation('castle-disabled-anim');
	this._sprite = new Sprite(this._animation);
	this._animation.setLooping(true).play();
	this._disabled_animation.setLooping(true).play();
	
	this._grid_x = 0;
	this._grid_y = 0;

};

Castle.inherits(Friendly);


/**
 * (re)initialization function. Ensures you get a fresh Castle.
 */
Castle.prototype.init = function() {
	
};

Castle.prototype.getSprite = function() {
	return this._sprite;
};

Castle.prototype.getX = function() {
	return this._sprite.getX();
};

Castle.prototype.getY = function() {
	return this._sprite.getY();
};

Castle.prototype.getWidth = function() {
	return this._sprite.getWidth();
};

Castle.prototype.getHeight = function() {
	return this._sprite.getHeight();
};

/**
 * Get grid X coordinate
 *
 * @returns an integer value
 */
Castle.prototype.getGridX = function() {
	return this._grid_x;
};

/**
 * Get grid Y coordinate
 *
 * @returns an integer value
 */
Castle.prototype.getGridY = function() {
	return this._grid_y;
};

Castle.prototype.setActive = function(b_active) {
	this._active = (b_active == true);
	if(this._active) {
		this._sprite.setImageSource(this._animation);
	} else {
		this._sprite.setImageSource(this._disabled_animation);
	}
	return this;
};

Castle.prototype.setPosition = function(grid_x,grid_y) {

	var xres = g_game.getGridSizeX();
	var yres = g_game.getGridSizeY();
	this._grid_x = grid_x;
	this._grid_y = grid_y;
	
	this._sprite.setPosition(grid_x * xres,grid_y * yres);
	
};

/**
 * Any update logic here..
 */
Castle.prototype.update = function(sync) {
	if(this.isActive())
		this._animation.update(sync);
	else
		this._disabled_animation.update(sync);
};


