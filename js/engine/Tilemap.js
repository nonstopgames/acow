/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * Tilemap.js
 *
 * Simple tilemap renderer
 *
 * creation date: 22-06-2012
 */

"use strict";


/**
 * Tilemap - a map renderer based on the Tileset image source.
 *
 * @param tileset a Tileset object - used for rendering
 * @param width width of map, in number of tiles
 * @param height height of map, in number of tiles
 * @param map_data an array containing tile indices. Stored as direct reference.
 */
function Tilemap(tileset,width,height,map_data) {
	SceneNode.call(this);
	
	if(!(tileset instanceof Tileset)) throw new Error("Tilemap must be initialized with a Tileset!");

	this._cache = null;
	
	this._tileset = tileset;
	this._map_data = map_data;
	this._rle_data = [];
	this._map_width = width || 0;
	this._map_height = height || 0;

	this._opt_bounds = false;   // Bound culling optimization

	this._min_x = 0;
	this._max_x = width;
	this._min_y = 0;
	this._max_y = height;
};
Tilemap.inherits(SceneNode);

Tilemap.cache = (function() {
	return document.createElement('canvas');
})();

Tilemap.temp_mtx = new mat2();

/**
 * Return a copy of this Tilemap - all relevant fields direclty linked.
 * 
 */
Tilemap.prototype.copy = function() {
	return new Tilemap(this._tileset,this._map_width,this._map_height,this._map_data);
};

/**
 * Assign new map data to this Tilemap. The data is stored
 * as a direct reference.
 */
Tilemap.prototype.setMapData = function(data) {
	this._map_data = data;
	return this;
};

/**
 * Set/change the size of this Tilemap
 */
Tilemap.prototype.setMapSize = function(w,h) {
	if(w !== undefined) this._map_width  = w;
	if(h !== undefined) this._map_height = h;
	return this;
};

/**
 * Get a direct reference to this Tilemap
 */
Tilemap.prototype.getMapData = function() {
	return this._map_data;
};

/**
 * Get current map width
 */
Tilemap.prototype.getMapWidth = function() {
	return this._map_width;
};

/**
 * Get current map height
 */
Tilemap.prototype.getMapHeight = function() {
	return this._map_height;
};

/**
 * Create or update a cache for the tilemap. Note, that the first time this function
 * is called, it allocates a canvas for temporary storage of the tilemap. The next
 * time it is called, the entire tilemap gets drawn again. If the cache exists, it will
 * be used for drawing the next time the tilemap gets rendered to screen.
 *
 * This can result in faster and/or more accurate drawing for large maps. Beware the
 * memory overhead.
 */
Tilemap.prototype.cache = function(noClear) {

	if(this._cache === null) {
		this._cache = document.createElement('canvas');
	}

	var w,h;
	w = this._map_width * (this._tileset.getTileWidth() + this._tileset.getOffsetX());
	h = this._map_height * (this._tileset.getTileHeight() + this._tileset.getOffsetY());
	
	this._cache.width = w;
	this._cache.height = h;
	var context = this._cache.getContext('2d');

	if(!noClear) {
		context.fillStyle = 'rgba(0,0,0,0)';
		context.fillRect(0,0,w,h);
	}
	
	// Perform brute-force drawing into cache
	this.draw_normal(context,this._min_x,this._min_y,this._max_x,this._max_y);

	trace("cached tilemap " + this);
	
};

/**
 * Delete the cache canvas used for faster (or more accurate) tilemap drawing.
 *
 * This returns the tilemap into normal operating mode; i.e. when drawn to screen,
 * the tilemap will be rendered to screen piece by piece.
 */
Tilemap.prototype.deleteCache = function() {
	this._cache = null;
};


/**
 * Optimize drawing area - go through map data, and find the bounding rectangle
 * of the drawable area. Then, 
 * Note, that this function MUST be called after every update
 * of the tilemap data, if used.
 *
 * @returns a reference to self.
 */
Tilemap.prototype.optimize = function(bounds,rle) {

	if(bounds === undefined) bounds = true;
	if(rle === undefined) rle = false;
	
	this._opt_bounds = (bounds == true);
	this._opt_rle = (rle == true);

	//
	// Perform bounds testing. This is used to minimize
	// drawing of unnecessary areas.
	//
	if(this._opt_bounds) {
		var w = this._map_width;
		var h = this._map_height;
		var data = this._map_data;

		FIND_MIN_X: {
			for(var x = 0; x < w; ++x) {
				for(var y = 0; y < h; ++y) {
					if(data[(y * w) + x] >= 0) {
						this._min_x = x;
						break FIND_MIN_X;
					}
				}
			}
		}

		FIND_MAX_X: {
			for(var x = w - 1; x >= 0; --x) {
				for(var y = 0; y < h; ++y) {
					if(data[(y * w) + x] >= 0) {
						this._max_x = x + 1;
						break FIND_MAX_X;
					}
				}
			}
		}

		FIND_MIN_Y: {
			for(var y = 0; y < h; ++y) {
				for(var x = 0; x < w; ++x) {
					if(data[(y * w) + x] >= 0) {
						this._min_y = y;
						break FIND_MIN_Y;
					}
				}
			}
		}

		FIND_MAX_Y: {
			for(var y = h - 1; y >= 0; --y) {
				for(var x = 0; x < w; ++x) {
					if(data[(y * w) + x] >= 0) {
						this._max_y = y + 1;
						break FIND_MAX_Y;
					}
				}
			}
		}
	}

	//
	// Create void-RLE data
	// Encode successive spans of void as negative
	// integers. Completely compatible with the default
	// scheme of marking void as -1; this just increases
	// the jump in the draw routine.
	//

	var data = this._map_data;
	
	for(var i = 0, l = data.length; i < l; ++i) {
		if(data[i] < 0) {
			var span = 1;
			for(var j = i; j < l; ++j) {
				if(data[j] >= 0) break;
				span++;
			}
			data[i] = -span;
			i += span - 1;
		}
	}
	
	return this;
	
};

/**
 * Overridden draw routine.
 * Selects between RLE drawing and regular drawing modes.
 * Calculates max draw rect.
 */
Tilemap.prototype.draw = function(canvas,context,matrix) {

	// Get minimum render area - this is _required_ when dealing with tilemaps that won't fit inside the window

	var imtx = matrix.invert(Tilemap.temp_mtx);
	var root = this.getRootNode();  // DANGER: we're GUESSING that the root node we've got is a) valid and b) a Scene object

	var iw = 1.0 / (this._map_width * this._scale);
	var ih = 1.0 / (this._map_height * this._scale);
	var sw = root.getSceneWidth();
	var sh = root.getSceneHeight();

	// Experimental inverse-matrix clipping code
	if(false) {

		// For some damn reason this still doesn't work - is the matrix inversion code wrong or what?
		
		var x0 = Math.max(imtx.projectX(0,0) * iw,0);
		var y0 = Math.max(imtx.projectY(0,0) * ih,0);
		var x1 = Math.min(imtx.projectX(sw,sh) * iw + 1,this._map_width);
		var y1 = Math.min(imtx.projectY(sw,sh) * ih + 1,this._map_height);

		if(this._opt_bounds) {
			x0 = Math.max(this._min_x,x0);
			y0 = Math.max(this._min_y,y0);
			x1 = Math.min(this._max_x,x1);
			y1 = Math.min(this._max_y,y1);
		}

		x0 |= 0;
		x1 |= 0;
		y0 |= 0;
		y1 |= 0;
		
	} else {
		
		var x0 = this._min_x;
		var y0 = this._min_y;
		var x1 = this._max_x;
		var y1 = this._max_y;
		
	}
	
	if(this._cache) {
		this.draw_cached(context,matrix,x0,y0,x1,y1);
	} else {
		matrix.applyTo(context);
		if(this._opt_rle) {
			this.draw_rle(context,x0,y0,x1,y1);
		} else {
			this.draw_normal(context,x0,y0,x1,y1);
		}
	}
};


/*
 * Straight-up regular draw routine - useful for dynamic data or small maps.
 *
 * NOTE: Tileset.drawTile has been inlined!
 */
Tilemap.prototype.draw_normal = function(context,x0,y0,x1,y1) {

	var data = this._map_data;
	var ts   = this._tileset;
	var w    = this._map_width;
	var x, y, xx, yy;
	var xadd = ts.getTileWidth() + ts.getOffsetX();
	var yadd = ts.getTileHeight() + ts.getOffsetY();
	var xx0 = x0 * xadd;
	var tile = -1;
	var tile_last = -1;
	var idx = 0;

	// Variables for inlined tileset render
	var tsdata = ts.source_data;
	var siw = ts._image_w;
	var tsw = 0;
	var sw = ts.source_w;
	var sh = ts.source_h;
	var sxoffs = ts._offset_x;
	var syoffs = ts._offset_y;
	var sx = 0, sy = 0;

	//tilemap rendering...
	yy = yadd * y0;
	for(y = y0; y < y1; ++y) {
		xx = xx0;
		idx = (y * w) + x0;
		for(x = x0; x < x1; ++x) {
			tile = data[idx++];
			if(tile >= 0) {
				if(tile != tile_last) {
					tsw = (tile * sw);
					sx = tsw % siw;
					sy = ((tsw / siw) | 0) * sh;
					tile_last = tile;
				}
				context.drawImage(tsdata,sx,sy,sw,sh,xx + sxoffs, yy + syoffs,sw,sh);
			}
			xx += xadd;
		}
		yy += yadd;
	}
};

Tilemap.prototype.draw_cached = function(context,matrix,x0,y0,x1,y1) {

	var t;
	var cache = this._cache;
	var ts = this._tileset;
	var tile_w = ts.getTileWidth() + ts.getOffsetX();
	var tile_h = ts.getTileHeight() + ts.getOffsetY();

	var dx = (x0 * tile_w);
	var dy = (y0 * tile_h);
	var dw = ((x1 * tile_w) - dx - ts.getOffsetX());
	var dh = ((y1 * tile_h) - dy - ts.getOffsetY());

	var sx = dx | 0;
	var sy = dy | 0;
	var sw = dw | 0;
	var sh = dh | 0;

	t = dx;
	dx = matrix.projectX(dx,dy) | 0;
	dy = matrix.projectY(t,dy) | 0;
	t = dw;
	dw = (matrix.projectX(dw,dh) - dx) | 0;
	dh = (matrix.projectY(t,dh) - dy) | 0;

	context.drawImage(cache,sx,sy,sw,sh,dx,dy,dw,dh);
	
};
