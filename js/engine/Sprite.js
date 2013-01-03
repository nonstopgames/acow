/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * Sprite.js
 *
 * A Sprite class that builds on functionality of
 * the Node class.
 *
 * creation date: 04-06-2012
 * 
 */

"use strict";

/**
 * Creates a Sprite node.
 *
 * @param src an ImageSource subclass.
 */
function Sprite(src) {
	SceneNode.call(this);

	this._src = null;
	this._tile_idx = 0;
	this._animation = false;
	this._tileset = false;
	
	// Set image source
	this.setImageSource(src);
	
	// Set size of our sprite
	this.setSize(this._src.getWidth(),this._src.getHeight());

	// Default to having all sprites top-left aligned
	this.setOffset(this.getWidth() * 0.5,this.getHeight() * 0.5);

	// Enable culling
	this.culling = false;

	this._sprite_drawmode = Sprite.DrawMode.ALPHA;
	
}
Sprite.inherits(SceneNode);

Sprite.DrawMode = (function() {
	var i = 0;
	return {
		ALPHA: i++,
		ADDITIVE: i++
	};
})();

Sprite.prototype.setDrawMode = function(mode) {
	this._sprite_drawmode = mode;
};

Sprite.prototype.setImageSource = function(src) {

	// Make sure we have a proper image data source
	if(!(src instanceof ImageSource)) throw new Error("Sprite must be have a subclass of ImageSource; src is " + src.toString());
	this._src = src;
	this._animation = (src instanceof Animation);
	this._tileset = (src instanceof Tileset);

};

/**
 *
 */
Sprite.prototype.setTile = function(tile) {
	if(!this._tileset) throw new Error("Sprite " + this.toString() + " does not have a Tileset image source");
	this._tile_idx = (typeof(tile) === 'string') ? this._src.getTileIndex(tile) : tile;
};

Sprite.prototype.getTile = function() {
	return this._tile_idx;
};

/**
 * Overridden drawing function.
 * Parameters are passed up from Node's recursive drawing function.
 *
 * @param canvas Canvas object we're drawing through
 * @param context Context of the Canvas we're drawing to
 * @param matrix Current world matrix (with object matrix concatenated) (local matrix can be gotten by Node.getMatrix())
 * 
 */
Sprite.prototype.draw = function(canvas,context,matrix) {

	matrix.applyTo(context);

	var w = this.getRealWidth();
	var h = this.getRealHeight();
	var hw = w * 0.5;
	var hh = h * 0.5;

	if(this._sprite_drawmode === Sprite.DrawMode.ADDITIVE) {
		context.globalCompositeOperation = 'lighter';
	}
	
	// Also handle special case for tileset (this is becoming Nasty)
	if(this._animation) {
		this._src.draw(context,-hw,-hh);
	} else if(this._tileset) {
		this._src.drawTile(this._tile_idx,context,-hw,-hh);
	} else {
		// Assume we have a Bitmap or other unknown image source, which doesn't need special treatment...
		context.drawImage(this._src.getSource(), this._src.getX(), this._src.getY(), w, h, -hw, -hh, w, h);
	}
	
};
