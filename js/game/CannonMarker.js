/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * CannonMarker.js
 *
 * Cannon placement marker handling code, for cannon placement phase.
 * 
 * creation date: 26-06-2012
 */

"use strict";

/**
 * Cannon placement marker
 */
function CannonMarker() {
	Actor.call(this);

	this._bitmap = g_assets.getBitmap('cannon-marker');
	this._bitmap_error = g_assets.getBitmap('cannon-marker-error');
	this._sprite = new Sprite(this._bitmap);
	this._sprite.setOpacity(0.75);

	this._grid_x = 0;
	this._grid_y = 0;

	this._grabOffsetX = 0;
	this._grabOffsetY = 0;

	this._move_tm       = 0;
	this._move_duration = 250;
	this._move_x0       = 0;
	this._move_y0       = 0;
	this._move_x1       = 0;
	this._move_y1       = 0;

	this._visible = false;

	this._followMouse = false;

	this._tileMarker = new TileMarker();
	this._tileMarker.setGridSize(2,1);
	
	this._error = false;
	
	this._sound_grab = g_assets.getSound('pieceGrabbed');
	this._sound_place = g_assets.getSound('cannonPlaced');
}
CannonMarker.inherits(Actor);

/**
 * Initialize parameters
 */
CannonMarker.prototype.init = function() {
	
	// Copy/paste from BlockMarker.js init
	this._sprite.setOffset(0,this._sprite.getHeight() * 0.5);

	return this;
};

CannonMarker.prototype.show = function() {
	this._sprite.visible = true;
	this._tileMarker.visible = true;
	this._visible = true;
	return this;
};

CannonMarker.prototype.hide = function() {
	this._sprite.visible = false;
	this._tileMarker.visible = false;
	this._visible = false;
	return this;
};

CannonMarker.prototype.isVisible = function() {
	return this._visible;
};

/**
 * Get a direct reference to the cannon sprite
 */
CannonMarker.prototype.getSprite = function() {
	return this._sprite;
};

CannonMarker.prototype.getMarker = function() {
	return this._tileMarker;
};

/**
 * Returns the cannon marker's current grid X coordinate
 */
CannonMarker.prototype.getGridX = function() {
	return this._grid_x;
};

/**
 * Returns the cannon marker's current grid Y coordinate
 */
CannonMarker.prototype.getGridY = function() {
	return this._grid_y;
};

CannonMarker.prototype.setPositon = function(world_x,world_y) {
	this._sprite.setPosition(world_x,world_y);
};

/**
 *
 */
CannonMarker.prototype.canPlaceCannon = function() {
	return this._error === false;
};

/**
 * Update position of the cannon marker
 */
CannonMarker.prototype.update = function(sync) {

	if(!this._visible) return;

	var x,y,d;
	if(this._followMouse) {
		x = g_game.getWorldX(g_input.getX()) + this._grabOffsetX;
		y = g_game.getWorldY(g_input.getY()) + this._grabOffsetY;
	} else {
		d = g_engine.getTimeCurrent() - this._move_tm;
		if(d >= this._move_duration) {
			x = this._sprite.getX();
			y = this._sprite.getY();
		} else {
			d /= this._move_duration;
			x = Ease.sin_lerp(d,this._move_x0,this._move_x1);
			y = Ease.sin_lerp(d,this._move_y0,this._move_y1);
		}
	}

	var grid_x = ((x + (this._sprite.getWidth()  * -0.5)) / g_game.getGridSizeX()) | 0;
	var grid_y = ((y + (this._sprite.getHeight() *  0.5)) / g_game.getGridSizeY()) | 0;
	var lw = g_game.getLevelWidth();
	var lh = g_game.getLevelHeight();
	if(grid_x < 0) grid_x = 0;
	if(grid_y < 0) grid_y = 0;
	if(grid_x > lw - 1) grid_x = lw - 1;
	if(grid_y > lh - 1) grid_y = lh - 1;
	this._grid_x = grid_x;
	this._grid_y = grid_y;
	
	if(g_game.getWalls().canAddCannon(grid_x + 1,grid_y)) {
		if(this._error) {
			this._sprite.setImageSource(this._bitmap);
			this._tileMarker.setColor(0,255,0,192);
			this._error = false;
		}
	} else {
		if(!this._error) {
			this._sprite.setImageSource(this._bitmap_error);
			this._tileMarker.setColor(255,0,0,192);
			this._error = true;
		}
	}

	this._tileMarker.setGridPosition(grid_x,grid_y);
	this._sprite.setPosition(x,y);

	if(g_game.isMessageVisible()) {
		this._sprite.visible = false;
	} else {
		this._sprite.setOpacity(0.8 + (Math.sin(Math.float_mod(g_engine.getTimeCurrent() / 250.0,Math.PI * 2)) * 0.2));
		this._sprite.visible = true;
	}
	this._tileMarker.visible = this._sprite.visible;

};

/**
 * Call for placing a cannon at found coordinates
 */
CannonMarker.prototype.placeCannon = function() {
	if(g_game.placeCannon(this._grid_x + 1, this._grid_y)) {
		this.init();
	}
};

CannonMarker.prototype.setPosition = function(world_x,world_y) {
	var gx = g_game.getGridSizeX();
	var gy = g_game.getGridSizeY();

	this._grid_x = (world_x / gx) | 0;
	this._grid_y = (world_y / gy) | 0;
	this._tileMarker.setPosition(this._grid_x - 1,this._grid_y);
	this._sprite.setPosition(this._grid_x * gx,this._grid_y * gy);
};

CannonMarker.prototype.followMouse = function() {
	this._followMouse = true;
	this._grabOffsetX = this._sprite.getX() - g_game.getWorldX(g_input.getX());
	this._grabOffsetY = this._sprite.getY() - g_game.getWorldY(g_input.getY());
	this._sound_grab.play();
};

CannonMarker.prototype.unfollowMouse = function() {
	this._followMouse = false;
	this._move_x0 = this._sprite.getX();
	this._move_x1 = (this._grid_x + 1) * g_game.getGridSizeX();
	this._move_y0 = this._sprite.getY();
	this._move_y1 = this._grid_y * g_game.getGridSizeY();
	this._move_tm = g_engine.getTimeCurrent();
};

/**
 * Test if a click is inside the block
 */
CannonMarker.prototype.testClick = function(world_x,world_y) {
	var s = this._sprite;
	var x = world_x;
	var y = world_y;

	var sx = s.getX();
	var sy = s.getY();
	var sw = s.getWidth();
	var sh = s.getHeight();

	var x0 = sx - sw * 1.25;
	var y0 = sy - sh * 0.75;
	var x1 = sx + sw * 1.25;
	var y1 = sy + sh * 2.75;

	return (x > x0 && x < x1 && y > y0 && y < y1);
};
