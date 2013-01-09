/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * BlockMarker.js
 *
 * Tetris-style block for placement on map.
 *
 * creation date: 22-06-2012
 */

"use strict";

/**
 * BlockMarker structure. Used as placement marker for walls.
 * 
 */
function BlockMarker() {
	Actor.call(this);
	
	if(!BlockMarker.tileset) BlockMarker.tileset = g_assets.getTileset('wall-tiles');
	if(!BlockMarker.error_tileset) BlockMarker.error_tileset = g_assets.getTileset('wall-tiles-place-error');
	
	this._data = [];                    // BlockMarker data
	this._size = 0;                     // Amount of tiles in a block
	this._sprites = [];                 // List of sprites we use for this block
	this._markers = [];                 // Sprite markers
	this._scale = 1.0;                  // Scaling factor (blocks should fit inside the game grid)
	this._container = new SceneNode();  // Graphics engine node, used as container for sprites
	this._container.setOffset(0,0);
	this.setActive(false);

	// Figure out virtual width and height for sprite placement
	this._tile_w = BlockMarker.tileset.getTileWidth() + BlockMarker.tileset.getOffsetX();
	this._tile_h = BlockMarker.tileset.getTileHeight() + BlockMarker.tileset.getOffsetY();

	this._max_x = 0;
	this._max_y = 0;

	this._grid_x = 0;
	this._grid_y = 0;

	this._grabOffsetX   = 0;
	this._grabOffsetY   = 0;
	this._move_tm       = 0;
	this._move_duration = 250;
	this._move_x0       = 0;
	this._move_y0       = 0;
	this._move_x1       = 0;
	this._move_y1       = 0;

	this._visible = true;
	this._error = false;

	this._followMouse = false;
	
	this._sound_grab = g_assets.getSound('pieceGrabbed');
	this._sound_place = g_assets.getSound('wallPlaced');
	this._sound_rotate = g_assets.getSound('pieceRotate');
	
};

BlockMarker.inherits(Actor);

/**
 * Get grid X coordinate
 */
BlockMarker.prototype.getGridX = function() {
	return this._grid_x;
};

/**
 * Get grid Y coordinate
 */
BlockMarker.prototype.getGridY = function() {
	return this._grid_y;
};


/**
 * Initialize our shape. It's less expensive (machine power-wise) to just
 * re-use a single block for placement - just call init() again to get a
 * fresh, new block, without incurring the extra overhead of allocing a bunch
 * of new sprites and display nodes.
 */
BlockMarker.prototype.init = function() {

	// Create random shape and rotate it up to three times
	this.setRandomShape();
	var i, sz = BlockMarker.mtx_size * BlockMarker.mtx_size;

	// Count the number of blocks in the shape
	this._size = 0;
	for(i = 0; i < sz; ++i) {
		if(this._data[i]) this._size++;
	}

	// Remove existing markers from parent...
	for(var i = 0; i < this._markers.length; ++i) {
		this._markers[i].removeFromParent();
	}
	
	// See to that we have enough sprites
	if(this._sprites.length < this._size) {
		for(var i = this._size - this._sprites.length; i; --i) {
			var sprite = new Sprite(BlockMarker.tileset);
			this._sprites.push(sprite);
			this._markers.push(new TileMarker());
		}
	}

	// Add a necessary number of sprites to an _empty_ container..
	this._container.clearChildren();
	for(var i = 0; i < this._size; ++i) {
		this._container.addChild(this._sprites[i]);
		g_game.getPointerLayer().addChildAt(this._markers[i],0);
	}

	// Figure out scaling factor
	this._scale = Math.min(g_game.getGridSizeX() / this._tile_w,g_game.getGridSizeY() / this._tile_h);

	this._container.setOffset(0,0);
	this._container.setScale(this._scale);
	this._container.setOpacity(0.75);

	// Rotate the shape a random amount of times
	var r = Math.rand(4);
	for(var i = 0; i < r; ++i) {
		this.rotate(true);
	}

	// Update the sprite so that it can be displayed correctly
	this.updateSprite();
};

BlockMarker.prototype.isVisible = function() {
	return this._visible;
};

BlockMarker.prototype.show = function() {
	this._container.visible = true;
	for(var i = 0; i < this._markers.length; ++i) {
		this._markers[i].visible = true;
	}
	this._visible = true;
	return this;
};

BlockMarker.prototype.hide = function() {
	this._container.visible = false;
	for(var i = 0; i < this._markers.length; ++i) {
		this._markers[i].visible = false;
	}
	this._visible = false;
	return this;
};

BlockMarker.prototype.canPlaceBlock = function() {
	return this._error === false;
};

/**
 * Returns the scene node the sprites are housed in. Slight misnomer.
 *
 */
BlockMarker.prototype.getSprite = function() {
	return this._container;
};


/**
 * Update the sprites representing the block in-game
 * 
 */
BlockMarker.prototype.updateSprite = function() {
	
	// Place sprites
	var min_x = null, min_y = null, max_x = null, max_y = null, n = 0;
	var nw = false,ne = false,nn = false,ns = false;
	for(var y = 0; y < 5; ++y) {
		for(var x = 0; x < 5; ++x) {
			var c = this._data[(y * 5) + x];
			if(c) {
				
				// Adjust bounds
				if(min_x === null || min_x > x) min_x = x;
				if(max_x === null || max_x < x) max_x = x;
				if(min_y === null || min_y > y) min_y = y;
				if(max_y === null || max_y < y) max_y = y;
				
				var s = this._sprites[n++];

				// Place tiles
				s.setPosition(x * this._tile_w,y * this._tile_h);
				
				
				// To produce a proper wall segment, we test neighborship
				// of each tile. The following variables test if there is
				// a neighbor to the west, east, north or south, respectively.
				//
				// This is a crude first version of a proper algorithm, which
				// should interface with Map, to give real-time preview of
				// walls.
				nw = (x > 0) && (this._data[ ((y + 0) * 5) + (x - 1) ]) > 0;
				ne = (x < 4) && (this._data[ ((y + 0) * 5) + (x + 1) ]) > 0;
				nn = (y > 0) && (this._data[ ((y - 1) * 5) + (x + 0) ]) > 0;
				ns = (y < 4) && (this._data[ ((y + 1) * 5) + (x + 0) ]) > 0;

				///trace("nw:",nw," ne:",ne," nn:",nn," ns:",ns);
				
				// Set sprite tile according to neighborship
				     if(nw && ne && nn && ns)    { s.setTile('center'); }
				else if(!(nw || ne || nn || ns)) { s.setTile('none');   }
				else if(nw && !(ne || nn || ns)) { s.setTile('left');   }
				else if(ne && !(nw || nn || ns)) { s.setTile('right');  }
				else if(nn && !(nw || ne || ns)) { s.setTile('up');     }
				else if(ns && !(nw || ne || nn)) { s.setTile('down');   }
				else if(!nn && ne && ns && nw) { s.setTile('t-up');    }
				else if(nn && ne && !ns && nw) { s.setTile('t-down');  }
				else if(nn && !ne && ns && nw) { s.setTile('t-right'); }
				else if(nn && ne && ns && !nw) { s.setTile('t-left');  }
				else if(nw && ne) { s.setTile('leftright'); }
				else if(ns && nn) { s.setTile('updown');    }
				else if(nw && nn) { s.setTile('upleft');    }
				else if(ne && nn) { s.setTile('upright');   }
				else if(nw && ns) { s.setTile('downleft');  }
				else if(ne && ns) { s.setTile('downright'); }
				else s.setTile('center'); // This should never happen
			}
		}
	}

	// Adjust sprite placement
	var offs_x = -min_x * this._tile_w;
	var offs_y = -min_y * this._tile_h;

	this._max_x = max_x - min_x + 1;
	this._max_y = max_y - min_y + 1;

	for(var i = 0; i < this._size; ++i) {
		this._sprites[i].move(offs_x,offs_y);
	}
};

/**
 * Update screen representation
 * 
 */
BlockMarker.prototype.update = function(sync) {

	if(!this._visible) return;
	
	var x,y,d;
	if(this._followMouse) {
		x = g_game.getWorldX(g_input.getX()) + this._grabOffsetX;
		y = g_game.getWorldY(g_input.getY()) + this._grabOffsetY;
	} else {
		d = g_engine.getTimeCurrent() - this._move_tm;
		if(d >= this._move_duration) {
			x = this._container.getX();
			y = this._container.getY();
		} else {
			d /= this._move_duration;
			x = Ease.sin_lerp(d,this._move_x0,this._move_x1);
			y = Ease.sin_lerp(d,this._move_y0,this._move_y1);
		}
	}

	this._container.setPosition(x,y);

	var gx = g_game.getGridSizeX();
	var gy = g_game.getGridSizeY();
	var lw = g_game.getLevelWidth();
	var lh = g_game.getLevelHeight();

	x += this._tile_w * 0.5;
	y += this._tile_h * 0.5;
	x = (x / gx);
	y = (y / gy);
	if(x < 0) x = 0;
	if(y < 0) y = 0;
	if(x >= lw - this._max_x) x = lw - this._max_x;
	if(y >= lh - this._max_y) y = lh - this._max_y;
	x |= 0;
	y |= 0;

	this._grid_x = x;
	this._grid_y = y;

	// Place tile markers
	for(var i = 0; i < this._size; ++i) {
		var m = this._markers[i];
		var s = this._sprites[i];
		m.setPosition(s.getX() + this._grid_x * gx,s.getY() + this._grid_y * gy);
	}
	
	// Update to see if block can be placed...
	if(!g_game.getWalls().canAddShape(this._data,x,y)) {
		if(!this._error) {
			for(var i = 0; i < this._size; ++i) {
				this._sprites[i].setImageSource(BlockMarker.error_tileset);
			}
			this.updateSprite();
			this._error = true;
		}
	} else {
		if(this._error) {
			for(var i = 0; i < this._size; ++i) {
				this._sprites[i].setImageSource(BlockMarker.tileset);
			}
			this.updateSprite();
			this._error = false;
		}
	}

	// Make the sprite flash
	if(g_game.isMessageVisible()) {
		this._container.visible = false;
	} else {
		this._container.setOpacity(0.8 + (Math.sin(Math.float_mod(g_engine.getTimeCurrent() / 250.0,Math.PI * 2)) * 0.2));
		this._container.visible = true;
	}

	for(var i = 0; i < this._size; ++i) {
		var m = this._markers[i];
		var s = this._sprites[i];
		m.setPosition(s.getX() + this._grid_x * gx,s.getY() + this._grid_y * gy);
		if(this._error) {
			m.setColor(255,0,0,192);
		} else {
			m.setColor(0,255,0,192);
		}
		m.visible = this._container.visible;
	}

};

/**
 * Place a block.
 */
BlockMarker.prototype.placeBlock = function() {
	if(!this.canPlaceBlock())return;
	if(!g_game.isMessageVisible()) {
		if(g_game.getWalls().addShape(this._data,this._grid_x,this._grid_y)) {
			
			g_game.updateCannonState();
			g_game.updateCastleState();
			
			this.init();
			
			for(var i = 0; i < this._size; ++i) {
				this._sprites[i].setImageSource(BlockMarker.error_tileset);
			}
			this._error = true;
			
			this.updateSprite();
			this._sound_place.play();
			
		}
	}
};

/*
 * Perform 90-degree rotation of our block.
 * Basically, we swap X and Y coordinates to create
 * a new block, then copy that back to data.
 * This is, effectively, a 90 degree rotation.
 */
BlockMarker.prototype.rotate = function(skipUpdate) {
	var sz = BlockMarker.mtx_size;
	var sz2 = sz * sz;
	var x,y,i;
	var wall = g_game.getWalls();
	
	for(i = 0; i < sz2; ++i) {
		BlockMarker.temp[i] = 0;
	}
	
	for(y = 0; y < sz; ++y) {
		for(x = 0; x < sz; ++x) {
			BlockMarker.temp[(x * sz) + y] = this._data[((sz - y) * sz) + x];
		}
	}

	for(i = 0; i < sz2; ++i) {
		this._data[i] = BlockMarker.temp[i];
	}

	if(!skipUpdate) {
		
		if(!wall.canAddShape(this._data,this._grid_x,this._grid_y)) {
			if(!this._error) {
				for(var i = 0; i < this._size; ++i) {
					this._sprites[i].setImageSource(BlockMarker.error_tileset);
				}
				this.updateSprite();
				this._error = true;
			}
		} else {
			if(this._error) {
				for(var i = 0; i < this._size; ++i) {
					this._sprites[i].setImageSource(BlockMarker.tileset);
				}
				this.updateSprite();
				this._error = false;
			}
		}
		
		this.update();
		this.updateSprite();
	}

	if(!skipUpdate) {
		wall.clearWallMarks().addShape(this._data,this._grid_x,this._grid_y,true);
		wall.update();
		this._sound_rotate.play();
		g_game.updateCannonState();
		g_game.updateCastleState();
	}
};

/**
 * Set our block to be a random shape. Max
 * tells us how high in the Shape list we can go.
 * More complex shapes should be higher up in the
 * shape list.
 *
 * @param max an integer value
 */
BlockMarker.prototype.setRandomShape = function(max) {
	if(max === undefined) max = BlockShape.length;
	var idx = Math.rand(Math.min(max,BlockShape.length));
	var sz = BlockMarker.mtx_size * BlockMarker.mtx_size;
	for(var i = 0; i < sz; ++i) {
		this._data[i] = BlockShape[idx][i];
	}
};

/**
 *
 */
BlockMarker.prototype.setShape = function(shape_idx) {
	
	if(shape_idx instanceof Array) {
		// We might call this function from ShelfBlock, and pass in block data instaead.
		// If that is the case, we just copy the data over; otherwise, we'll copy it from
		// the block data source.
		for(var i = 0; i < 25; ++i) {
		this._data[i] = shape_idx[i];
		}
	} else {
		for(var i = 0; i < 25; ++i) {
			this._data[i] = BlockShape[shape_idx][i];
		}
	}

	// Create random shape and rotate it up to three times
	var i, sz = BlockMarker.mtx_size * BlockMarker.mtx_size;

	// Count the number of blocks in the shape
	this._size = 0;
	for(i = 0; i < sz; ++i) {
		if(this._data[i]) this._size++;
	}

	// Remove existing markers from parent...
	for(var i = 0; i < this._markers.length; ++i) {
		this._markers[i].removeFromParent();
	}

	// See to that we have enough sprites
	if(this._sprites.length < this._size) {
		for(var i = this._size - this._sprites.length; i; --i) {
			var sprite = new Sprite(BlockMarker.tileset);
			this._sprites.push(sprite);
			this._markers.push(new TileMarker());
		}
	}

	// Add a necessary number of sprites to an _empty_ container..
	this._container.clearChildren();
	for(var i = 0; i < this._size; ++i) {
		this._container.addChild(this._sprites[i]);
		g_game.getPointerLayer().addChildAt(this._markers[i],0);
	}
	
	this.update();	
	this.updateSprite();
};

/**
 * Test if a click is inside the block
 */
BlockMarker.prototype.testClick = function(world_x,world_y) {
	// Translate coordinates to container-local
	var x = world_x - this._container.getX();
	var y = world_y - this._container.getY();

	for(var i = 0, l = this._size; i < l; ++i) {
		var b = this._sprites[i];
		var sx = b.getX();
		var sy = b.getY();
		var sw = b.getWidth();
		var sh = b.getHeight();
		var x0 = sx - sw * 0.75;
		var y0 = sy - sh * 0.75;
		var x1 = sx + sw * 1.75;
		var y1 = sy + sh * 2.75;
		if(x > x0 && x < x1 && y > y0 && y < y1) return true;
	}
	return false;
};

BlockMarker.prototype.setPosition = function(world_x,world_y) {
	var gx = g_game.getGridSizeX();
	var gy = g_game.getGridSizeY();

	this._grid_x = (world_x / gx) | 0;
	this._grid_y = (world_y / gy) | 0;

	this._container.setPosition(gx * this._grid_x, gy * this._grid_y);
};

BlockMarker.prototype.followMouse = function() {
	this._followMouse = true;
	this._grabOffsetX = this._container.getX() - g_game.getWorldX(g_input.getX());
	this._grabOffsetY = this._container.getY() - g_game.getWorldY(g_input.getY());
	this._sound_grab.play();
};

BlockMarker.prototype.unfollowMouse = function() {
	this._followMouse = false;
	this._move_x0 = this._container.getX();
	this._move_x1 = this._grid_x * g_game.getGridSizeX();
	this._move_y0 = this._container.getY();
	this._move_y1 = this._grid_y * g_game.getGridSizeY();
	this._move_tm = g_engine.getTimeCurrent();
	var w = g_game.getWalls();
	w.clearWallMarks();
	w.addShape(this._data,this._grid_x,this._grid_y,true);
	w.update();
	g_game.updateCannonState();
	g_game.updateCastleState();
};

/*
 * Static size definition of block shape matrix (for now,
 * it's 5x5, since that's what the original dev(s) used).
 */
BlockMarker.mtx_size = 5;

/*
 * A static temp array. Even though we have a very good garbage
 * collector, we don't want to stress it (or the memory allocator)
 * any more than necessary..
 */
BlockMarker.temp = [
               0, 0, 0, 0, 0,
               0, 0, 0, 0, 0,
               0, 0, 0, 0, 0,
               0, 0, 0, 0, 0,
               0, 0, 0, 0, 0 ];

