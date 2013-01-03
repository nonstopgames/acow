/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * TileMarker.js
 *
 * An additional scene node, for drawing placement markers under blocks to be placed..
 *
 * Code assumes TileMarker is added to a game-relative scene graph (i.e., that 0,0 in
 * the scene graph is 0,0 in game coordinate space).
 *
 * creation date: 04-07-2012 
 */

"use strict";

function TileMarker() {

	SceneNode.call(this);
	
	this._grid_x = 0;
	this._grid_y = 0;
	this._size_x = 1;
	this._size_y = 1;

	this.setColor(0,255,0,0.8);
	
};

TileMarker.inherits(SceneNode);



TileMarker.prototype.setGridPosition = function(gx,gy) {
	this._grid_x = gx;
	this._grid_y = gy;
	return this;
};

TileMarker.prototype.setGridSize = function(w,h) {
	this._size_x = w;
	this._size_y = h;
	return this;
};

// Disable the setPosition function...
TileMarker.prototype.setPosition = function(x,y) {
	this.setGridPosition((x / g_game.getGridSizeX()) | 0,(y / g_game.getGridSizeY()) | 0);
	return this;
};

TileMarker.prototype.setColor = function(r,g,b,a) {
	this._color_outline = 'rgba(' + (r) + ',' + (g) + ',' + (b) + ',' + (0.75) + ')';
	this._color_fill = 'rgba(' + (r) + ',' + (g) + ',' + (b) + ',' + (0.5) + ')';
	return this;
};

TileMarker.prototype.draw = function(canvas,context,matrix) {

	matrix.applyTo(context);

	var gx = g_game.getGridSizeX();
	var gy = g_game.getGridSizeY();
	
	var x = this._grid_x * gx;
	var y = this._grid_y * gy;
	var w = this._size_x * gx;
	var h = this._size_y * gy;

	// For some reason we need to do a beginPath and closePath call pair
	// to avoid an accidental buffer overrun
	context.strokeStyle = this._color_outline;
	context.fillStyle = this._color_fill;
	context.beginPath();
	context.rect(x,y,w,h);
	context.closePath();
	context.fill();
	context.stroke();
	
};
