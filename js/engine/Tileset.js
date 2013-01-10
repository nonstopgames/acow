/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * Tileset.js
 *
 * A simple tile set object. Allows
 * picking tiles by name or index.
 *
 */

/**
 *
 */
function Tileset(image,tile_w,tile_h,offs_x,offs_y) {

	ImageSource.call(this);
	
	this._tile_names = {};

	this._image_w = image.width;
	this._image_h = image.height;
	this._offset_x = offs_x || 0;
	this._offset_y = offs_y || 0;
	
	this.source_data = image;
	this.source_x = 0;
	this.source_y = 0;
	this.source_w = tile_w;
	this.source_h = tile_h;
	
};
Tileset.inherits(ImageSource);

/**
 * Return a light-weight clone of this tileset (i.e. all fields
 * directly linked). Due to direct linking, adding names to this tileset
 * will result in those names being added to the copy aswell.
 *
 * @returns an object that looks and feels like this one.
 */
Tileset.prototype.copy = function() {
	var c = new Tileset(this.source_data,this.source_w,this.source_h,this._offset_x,this._offset_y);
	c._tile_names = this._tile_names;
	return c;
};

/**
 *
 */
Tileset.prototype.getTileWidth = function() {
	return this.source_w;
};

/**
 *
 */
Tileset.prototype.getTileHeight = function() {
	return this.source_h;
};

/**
 * 
 *
 */
Tileset.prototype.getOffsetX = function() {
	return this._offset_x;
};

/**
 *
 *
 */
Tileset.prototype.getOffsetY = function() {
	return this._offset_y;
};

/**
 *
 * 
 */
Tileset.prototype.addName = function(name,index) {
	this._tile_names[name] = index;
	return this;
};

/**
 *
 * 
 */
Tileset.prototype.getTileIndex = function(tile_name) {
	var idx = this._tile_names[tile_name];
	return idx === undefined ? 0 : idx;
};

/**
 * Set currently active tile
 * Useful, if using Tileset as image source for just one tile.
 */
Tileset.prototype.setTile = function(tile) {
	if(typeof(tile) === 'string') {
		tile = this._tile_names[tile] || 0;
	}
	if(tile instanceof Array) {
		tile = tile[Math.rand(tile.length)];
	}

	this.source_x = (tile * this.source_w) % (this._image_w);
	this.source_y = (((tile * this.source_w) / (this._image_w)) | 0) * this.source_h;
	
	//trace("tile: " + tile, "source_w: " + this.source_w, " source_h: " + this.source_h, " source_x: " + this.source_x, " source_y: " + this.source_y, " image_w: " + this._image_w, " image_h: " + this._image_h);
};

/**
 * Draw a single tile onto a context.
 *
 * @param tile name or index of tile
 * @param context a 2D Canvas drawing context
 * @param x X position of drawn tile
 * @param y Y position of drawn tile
 */
Tileset.prototype.drawTile = function(tile,context,x,y) {

	if(typeof(tile) === 'string') {
		tile = this._tile_names[tile] || 0;
	}
	if(tile instanceof Array) {
		tile = tile[Math.rand(tile.length)];
	}

	this.source_x = (tile * this.source_w) % (this._image_w);
	this.source_y = (((tile * this.source_w) / (this._image_w)) | 0) * this.source_h;

	context.drawImage(this.source_data,this.source_x,this.source_y,this.source_w,this.source_h,x + this._offset_x,y + this._offset_y,this.source_w,this.source_h);
	
};

