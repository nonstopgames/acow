/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * Wall.js
 *
 * Wall rendering and handling code. Contrary to
 * what the name implies, this code handles ALL
 * walls, not just one segment. :P
 * 
 * It turns out that this code is actually a good
 * chunk of all game logic, which is why this file
 * is nearly as long as Game.js...
 *
 * creation date: 27-06-2012
 */

"use strict";

/*
 * Wall data values:
 *
 * 0: unclaimed tile   (grass)
 * 1: unavailable tile (water,trees)
 * 2: claimed tile     (sand)
 * 3: wall tile        
 * 4: destroyed wall tile 
 * 5: Castle tile 
 * 6: Tower tile 
 * 7: Cannon tile 
 */

/**
 *
 *
 */
function Wall() {
	Actor.call(this);

	this._wall_tileset = g_assets.getTileset('wall-tiles');
	this._sand_tileset = g_assets.getTileset('sand-tiles');
	this._wall_data  = [];     // information about where walls are built, where castles are, where cannons are
	this._sand_data  = [];     // indicates placement of sand tiles, used by enclocedness detector
	this._land_data  = [];     // indicates what part of the level is buildable (where land is)
	this._wall_tiles = [];     // tilemap data for walls
	this._sand_tiles = [];     // tilemap data for sand (this might be worked around and be rendered unnecessary)
	this._wall_health_data = []; // Health data for all tiles... Added late in development, to support land troops
	
	this._wall_tilemap = new Tilemap(this._wall_tileset,0,0,this._wall_tiles);
	this._sand_tilemap = new Tilemap(this._sand_tileset,0,0,this._sand_tiles);
	
	this._width = 0;
	this._height = 0;
	
	this._container = new SceneNode();
	this._castles = [];
	this._towers = [];
	this._cannons = [];

	this._destruct_markers = [];
	this._used_destruct_markers = 0;

	this._used_castles = 0;
	this._used_towers = 0;
	this._used_cannons = 0;
	this._num_walltiles = 0;

	this._walltype_health = g_config.global.wallHealth;
	
	/*
	 * One-time operation: store tile indices in a hashmap for faster access
	 */
	if(!Wall.tiles) Wall.tiles = {
		center:    this._wall_tileset.getTileIndex('center'),
		none:      this._wall_tileset.getTileIndex('none'),
		left:      this._wall_tileset.getTileIndex('left'),
		right:     this._wall_tileset.getTileIndex('right'),
		up:        this._wall_tileset.getTileIndex('up'),
		down:      this._wall_tileset.getTileIndex('down'),
		t_up:      this._wall_tileset.getTileIndex('t-up'),
		t_down:    this._wall_tileset.getTileIndex('t-down'),
		t_left:    this._wall_tileset.getTileIndex('t-left'),
		t_right:   this._wall_tileset.getTileIndex('t-right'),
		leftright: this._wall_tileset.getTileIndex('leftright'),
		updown:    this._wall_tileset.getTileIndex('updown'),
		upleft:    this._wall_tileset.getTileIndex('upleft'),
		upright:   this._wall_tileset.getTileIndex('upright'),
		downleft:  this._wall_tileset.getTileIndex('downleft'),
		downright: this._wall_tileset.getTileIndex('downright'),
		sand:      this._wall_tileset.getTileIndex('sand'),
		destroyed: this._wall_tileset.getTileIndex('destroyed-center')
	};
	
};
Wall.inherits(Actor);

/*
 * Create a pseudo-enum for easier map tile value manipulation
 */
Wall.types = (function() {
	var idx = 0;
	return {
		land: idx++,					// Land (buildable, unoccupied)
		land_occupied: idx++,			// Land occupied by an enemy ground unit
		water: idx++,					// Water (unbuildable)
		sand: idx++,					// Sand (player controlled area)
		wall: idx++,					// Wall (player fortrification)
		destroyed_wall: idx++,			// Destroyed wall (graphical effect; equivalent to land in most cases)
		castle: idx++,					// Area occupied by a castle
		castle_orphan: idx++,			// Area occupied by a castle that is no longer under player control
		tower: idx++,					// Area occupied by a tower
		tower_orphan: idx++,			// Area occupied by a tower that is no longer under player control
		cannon: idx++,					// Area occupied by a cannon
		cannon_orphan: idx++,			// Area occupied by a cannon that is no longer under player control
		wallMark: idx++,				// An area marked for wall placement (hack, to provide proper updating of sand)
		destroyed_wall_occupied: idx++	// Destroyed wall tile, occupied by an enemy ground unit (required for proper game logic)
	};
})();

Wall.tiles = null;

/**
 * Initialize wall data, pulling in information from the Game's map object.
 * 
 */
Wall.prototype.init = function() {
	
	var lw = g_game.getLevelWidth();
	var lh = g_game.getLevelHeight();
	var map = g_game.getMap();

	this._container.clearChildren();

	this._width = lw;
	this._height = lh;
	
	this._used_castles = 0;
	this._used_towers = 0;
	this._used_cannons = 0;

	// "ei näin" :)
	this._wall_data.splice(0,this._wall_data.length);
	this._sand_data.splice(0,this._sand_data.length);
	this._land_data.splice(0,this._land_data.length);
	this._wall_tiles.splice(0,this._wall_tiles.length);
	this._sand_tiles.splice(0,this._sand_tiles.length);

	this._wall_tilemap.setMapSize(lw,lh);
	this._sand_tilemap.setMapSize(lw,lh);
	
	var castle_coords = [];
	
	// Fill level with map data
	for(var y = 0; y < lh; ++y) {
		for(var x = 0; x < lw; ++x) {
			var t = -1;
			switch(map.getTile(x >> 1, y >> 1)) {
				case 1:
					t = Wall.types.land;
					this._land_data[(y * lw) + x] = 1;  // Mark tile as available land
				break;
				case 2:
					t = Wall.types.water;
					this._land_data[(y * lw) + x] = 0;
				break;
				case 3:
					t = Wall.types.land;
					castle_coords.push({ x: x, y: y });   // Mark coordinates for a new castle
					map.invalidateCastle(x >> 1,y >> 1);  // Then remove that castle from the Map data
					this._land_data[(y * lw) + x] = 1;    // Set that area as land
				break;
				default:
					throw new Error("outside level bounds");
				break;
			}
			
			this.setTile(x,y,t);
			this._wall_health_data.push(0);
		}
	}

	// Add tilemap to container
	this._container.addChild(this._sand_tilemap);
	this._container.addChild(this._wall_tilemap);
	
	// NOTE: Hack to create a castle..
	for(var i = 0; i < castle_coords.length; ++i) {
		this.createCastle(castle_coords[i].x,castle_coords[i].y);
	}

	trace("used castles: " + this._used_castles);
	this._castles.splice(this._used_castles,this._castles.length - this._used_castles);
	this.surroundCastle(this._castles[0]);


	// Update wall tile data
	this.updateSand();
	this.update();
};

/**
 * Get a direct reference to the wall container scene node
 */
Wall.prototype.getSprite = function() {
	return this._container;
};

/**
 * Update position information for possible cannon placement spots
 * (i.e. mark tiles enclosed by walls as sand).
 *
 * The algorithm for this is a variation of an 8-way flood fill;
 * we're testing, for each tile, if the map's edge is reachable from that tile.
 * If it isn't, we mark it (and all tiles traveled thus far), as sand.
 * We continue this, until the entire buildable map area has been exhausted.
 *
 * Slow, so only run when build phase is initialized, or when a wall segment
 * is placed.
 *
 * For now, we're running on JavaScript's stack, but since a stack overflow
 * is quite likely, especially in a use-case like this, this will need to
 * be re-written as an iterative function at some point.
 */
Wall.prototype.updateSand = function() {

	var that = this;
	var land = this._land_data;
	var sand = this._sand_data;
	var wall = this._wall_data;
	var lw = this._width;
	var lh = this._height;

	
	var test_id = 1;        // Unique color for drawing into the 'sand' structure
	var test_result = true; // Result of recursive flood_fill, set once for all IDs
	
	var sand_test = function(x,y) {

		// We've failed if we've ventured outside the level before being stopped by a wall or sand
		if(x < 0 || y < 0 || x > lw || y > lh) {
			test_result = false;
			return;
		}

		var idx = (y * lw) + x;

		if(sand[idx]) return;     // If tile has been set to sand or visited, good. Success.
		
		if(land[idx] === 1) {
			// We're on land - check if there's a wall stopping us
			var w = wall[idx];
			
			sand[idx] = test_id;
			
			if(w === Wall.types.wall || w === Wall.types.wallMark) {
				// There's a wall stopping us. Success.
				return;
			}

		} else {
			// Since we've ventured off into the water, we've failed
			test_result = false;
			return;
		}

		// Recurse
		sand_test(x - 1,y - 1);
		sand_test(x + 0,y - 1);
		sand_test(x + 1,y - 1);
		sand_test(x - 1,y + 0);
		sand_test(x + 0,y + 0);
		sand_test(x + 1,y + 0);
		sand_test(x - 1,y + 1);
		sand_test(x + 0,y + 1);
		sand_test(x + 1,y + 1);
		
	};

	// Mark tiles as sand...
	var mark_sand = function() {
		for(var y = 0; y < lh; ++y) {
			for(var x = 0; x < lw; ++x) {
				var idx = (y * lw) + x;
				if(sand[idx] === test_id) {
					if(test_result) {
						switch(wall[idx]) {
							case Wall.types.land:
								wall[idx] = Wall.types.sand;
								that.removeDestructMarker(x,y);								
							break;
							case Wall.types.cannon_orphan:
								wall[idx] = Wall.types.cannon;
							break;
							case Wall.types.castle_orphan:
								wall[idx] = Wall.types.castle;
							break;
						}
					} else {
						switch(wall[idx]) {
							case Wall.types.sand:
								wall[idx] = Wall.types.land;
							break;
							case Wall.types.cannon:
								wall[idx] = Wall.types.cannon_orphan;
							break;
							case Wall.types.castle:
								wall[idx] = Wall.types.castle_orphan;
							break;
						}
					}
				}
			}
		}
	};

	// Clear sand info
	for(var i = 0, l = lw * lh; i < l; ++i) {
		sand[i] = 0;
		
		// Clear wall data (make all sand -> land)
		if(wall[idx] === Wall.types.sand) {
			wall[idx] = Wall.types.land;
		}
		
		// Clear wall tilemap data
		if(this._wall_tiles[idx] === Wall.tiles.sand) {
			this._wall_tiles[idx] = -1;
		}
	}

	// Go through level, looking for a tile that's both on accessible land
	// and not sand-tested
	for(var y = 0; y < lh; ++y) {
		for(var x = 0; x < lw; ++x) {
			var idx = (y * lw) + x;
			if(land[idx] === 1 && sand[idx] === 0) {
				test_result = true;
				sand_test(x,y);
				mark_sand();
				test_id++;
			}
		}
	}
};

/**
 * Update wall tilemap data.
 */
Wall.prototype.update = function() {

	this.updateSand();
	
	var idx = 0;
	var wd = this._wall_data;
	var wt = this._wall_tiles;
	var st = this._sand_tiles;
	var t = 0, t0 = -1;

	var nw, ne, nn, ns;
	
	// Draw walls
	for(var y = 0, h = this._height; y < h; ++y) {
		for(var x = 0, w = this._width; x < w; ++x) {

			t = -1;

			// Update Wall data
			t0 = wd[idx];
			if(t0 === Wall.types.wall) {
				
				// Copy/paste from BlockMarker.js

				// Determine proper wall tile by looking at neighboring walls.
				nw = (this.getTile(x - 1,y) === Wall.types.wall);
				ne = (this.getTile(x + 1,y) === Wall.types.wall);
				nn = (this.getTile(x,y - 1) === Wall.types.wall);
				ns = (this.getTile(x,y + 1) === Wall.types.wall);

				// Set tile according to neighborship
				     if(nw && ne && nn && ns)    { t = Wall.tiles.center; }
				else if(!(nw || ne || nn || ns)) { t = Wall.tiles.none;   }
				else if(nw && !(ne || nn || ns)) { t = Wall.tiles.left;   }
				else if(ne && !(nw || nn || ns)) { t = Wall.tiles.right;  }
				else if(nn && !(nw || ne || ns)) { t = Wall.tiles.up;     }
				else if(ns && !(nw || ne || nn)) { t = Wall.tiles.down;   }
				else if(!nn && ne && ns && nw) { t = Wall.tiles.t_up;    }
				else if(nn && ne && !ns && nw) { t = Wall.tiles.t_down;  }
				else if(nn && !ne && ns && nw) { t = Wall.tiles.t_right; }
				else if(nn && ne && ns && !nw) { t = Wall.tiles.t_left;  }
				else if(nw && ne) { t = Wall.tiles.leftright; }
				else if(ns && nn) { t = Wall.tiles.updown;    }
				else if(nw && nn) { t = Wall.tiles.upleft;    }
				else if(ne && nn) { t = Wall.tiles.upright;   }
				else if(nw && ns) { t = Wall.tiles.downleft;  }
				else if(ne && ns) { t = Wall.tiles.downright; }
				else t = Wall.tiles.center; // This should never happen
			
			}
			
			wt[idx] = t;
			
			// Update Sand tile data
			t = -1;
			if(t0 === Wall.types.wall ||
			   t0 === Wall.types.castle ||
			   t0 === Wall.types.sand ||
			   t0 === Wall.types.cannon ||
			   t0 === Wall.types.tower) {
				t = 0; // There's only one kind of sand tile...
			}
			st[idx] = t;
			idx++;
		}
	}

	this._wall_tilemap.optimize();
	this._sand_tilemap.optimize();
	/*
	this._wall_tilemap.cache();
	this._sand_tilemap.cache();
	*/
};

/**
 * Set a tile at x,y to some type value
 */
Wall.prototype.setTile = function(grid_x,grid_y,type) {
	if(grid_x >= 0 && grid_x < this._width && grid_y >= 0 && grid_y < this._height) {
		this._wall_data[(grid_y * this._width) + grid_x] = type;
	} else {
		throw new Error("set tile at " + grid_x + "," + grid_y + " failed, OOB");
	}
};

/**
 * Get tile value at x,y
 */
Wall.prototype.getTile = function(grid_x,grid_y) {
	if(grid_x >= 0 && grid_x < this._width && grid_y >= 0 && grid_y < this._height) {
		return this._wall_data[(grid_y * this._width) + grid_x];
	}
	return -1;
};

/**
 * test is a tile can be walked on (for land units)
 */

Wall.canWalkType = {};
Wall.canWalkType[Wall.types.land] = true;
Wall.canWalkType[Wall.types.land_occupied] = true;
Wall.canWalkType[Wall.types.sand] = true;
Wall.canWalkType[Wall.types.destroyed_wall] = true;
Wall.canWalkType[Wall.types.castle] = true;
Wall.canWalkType[Wall.types.castle_orphan] = true;
Wall.canWalkType[Wall.types.destroyed_wall_occupied] = true;

Wall.prototype.canWalk = function(grid_x, grid_y){
	return this.getTile(grid_x, grid_y) in Wall.canWalkType;
};

/**
 * Sets a tile as a wall tile. No error checking is performed.
 *
 * This should only be used internally!
 */
Wall.prototype.createWall = function(grid_x,grid_y) {
	
	var data = this._wall_data;
	var idx = grid_y * this._width + grid_x;
	var orig = data[idx];
	var wtype = Wall.types.wall;
	if(orig !== wtype) {
		data[idx] = wtype;
		this._wall_health_data[idx] = this._walltype_health;
		this._num_walltiles++;
		this.removeDestructMarker(grid_x,grid_y);
	}
};

/**
 * Place a temporary mark for sand testing.
 */
Wall.prototype.markWall = function(grid_x,grid_y) {
	var d = this._wall_data;
	var t = Wall.types;
	var i = (grid_y * this._width) + grid_x;
	if(d[i] === t.land) d[i] = t.wallMark;
	return this;
};

/**
 * Remove all wall marks from data
 * 
 */
Wall.prototype.clearWallMarks = function() {
	var d = this._wall_data;
	var m = Wall.types.wallMark;
	var l = Wall.types.land;
	for(var i = d.length - 1; i + 1; --i) {
		if(d[i] === m) {
			d[i] = l;
		}
	}
	return this;
};

/**
 * Mark a grid position as being occupied by an enemy unit.
 * @param grid_x
 * @param grid_y
 */
Wall.prototype.markTileOccupied = function(grid_x,grid_y) {
	var type = this.getTile(grid_x,grid_y);
	if(type === Wall.types.land)
		this.setTile(grid_x,grid_y,Wall.types.land_occupied);
	if(type === Wall.types.destroyed_wall)
		this.setTile(grid_x,grid_y,Wall.types.destroyed_wall_occupied);
};

/**
 * Remove all tiles marked 'occupied'.
 */
Wall.prototype.clearOccupationMarks = function() {
	var data = this._wall_data;
	for(var i = 0, l = data.length; i < l; ++i) {
		var t = data[i];
		if(t === Wall.types.land_occupied) data[i] = Wall.types.land;
		if(t === Wall.types.destroyed_wall_occupied) data[i] = Wall.types.destroyed_wall;
	}
};

/**
 * Mark all destroyed tiles as available, update tilemap..
 * 
 */
Wall.prototype.cleanup = function() {
	for(var i = 0; i < this._wall_data.length; ++i) {
		if(this._wall_data[i] === Wall.types.destroyed_wall) {
			this._wall_data[i] = Wall.types.land;
			this.createDestructMarker((i % this._width) | 0, (i / this._width) | 0);
		}
	}
	this.update();
};

/**
 * Mark castle location and surround it with walls.
 * Also create (or re-use) a Castle object.
 * Castles take up a 4x4 grid area, starting at grid_x,grid_y
 * 
 */
Wall.prototype.createCastle = function(grid_x, grid_y) {

	// Add a castle sprite
	var c = null;
	if(this._castles[this._used_castles]) {
		c = this._castles[this._used_castles];
	} else {
		c = new Castle();
		this._castles.push(c);
	}
	this._container.addChildAt(c.getSprite(),1);
	c.setPosition(grid_x,grid_y);
	this._used_castles++;

	g_game.addCastle(c);
	
	// Mark castle ground
	var data = this._wall_data;
	for(var y = grid_y; y < grid_y + 4; ++y) {
		for(var x = grid_x; x < grid_x + 4; ++x) {
			data[y * this._width + x] = Wall.types.castle;
		}
	}
};

/**
 * Surround a castle with walls.
 *
 */
Wall.prototype.surroundCastle = function(castle) {
	var grid_x = castle.getGridX();
	var grid_y = castle.getGridY();
	
	// Create a wall around the castle
	for(var y = grid_y - 2; y < grid_y + 6; ++y) {
		var x = grid_x - 2;
		this.createWall(x,y);
		this.createWall(x + 7,y);
	}

	for(var x = grid_x - 2; x < grid_x + 6; ++x) {
		var y = grid_y - 2;
		this.createWall(x,y);
		this.createWall(x,y + 7);
	}
	
};

/**
 * Mark tower location and surround it with walls.
 * Also create (or re-use) a Tower object.
 * Towers take up a 2x2 grid area, starting at grid_x,grid_y
 */
Wall.prototype.createTower = function(grid_x, grid_y) {

	alert("Wall::createTower is not implemented");
	
};

/**
 *
 */
Wall.prototype.surroundTower = function(tower) {

	alert("Wall::surrondTower is not implemented");
	
};


//----------------------------------------------------------------------------
//
// Cannon-related
//
//----------------------------------------------------------------------------



/**
 * Systematically test if a cannon can be placed _anywhere_.
 *
 * Used to test if cannon placement phase is necessary.
 * 
 * NOTE: Somewhat good candidate for optimization.
 *
 */
Wall.prototype.canPlaceCannon = function() {
	
	var cac = this.canAddCannon; // Store local pointer to avoid unnecessary function re-fetch
	
	for(var y = 0; y < this._height; ++y) {
		for(var x = 0; x < this._width; ++x) {
			if(cac.call(this,x,y)) {
				return true;
			}
		}
	}

	return false;
};

Wall.prototype.getNumPlacableCannons = function() {
	
};


/**
 * See if we can add a cannon to the wall structure.
 *
 * @param grid_x X coordinate on grid
 * @param grid_y Y coordinate on grid
 * @returns true on success, false on failure (i.e. something is preventing the cannon from being added)
 */
Wall.prototype.canAddCannon = function(grid_x,grid_y) {
	var sand = Wall.types.sand;
	var t0 = this.getTile(grid_x - 1,grid_y);
	var t1 = this.getTile(grid_x    ,grid_y);
	return t0 === t1 && t1 === sand;
};

/**
 * Try to add a cannon to the wall structure.
 *
 *
 * @param grid_x X coordinate on grid
 * @param grid_y Y coordinate on grid
 * @returns true on success, false on failure (i.e. something is preventing the cannon from being added)
 */
Wall.prototype.addCannon = function(grid_x,grid_y) {

	if(!this.canAddCannon(grid_x,grid_y)) return false;

	// Get a cannon sprite
	var c = null;
	if(this._cannons[this.used_cannons]) {
		c = this._cannons[this._used_cannons];
	} else {
		c = new Cannon();
		this._cannons.push(c);
	}

	// Place the sprite
	this._container.addChildAt(c.getSprite(),1);
	//this._container.addChild(c.getSprite());
	c.setPosition(grid_x,grid_y);
	this._used_cannons++;

	// Mark the ground as a cannon spot
	this.setTile(grid_x    ,grid_y,Wall.types.cannon);
	this.setTile(grid_x - 1,grid_y,Wall.types.cannon);
	
	// Register the new Cannon with Game
	g_game.addCannon(c);

	// Update tilemap..
	this.update();

	return true;
};


//----------------------------------------------------------------------------
//
// Wall-block related
//
//----------------------------------------------------------------------------


/**
 * See if we can add a shape to the wall structure.
 * a Shape can ONLY be added if it is touching at least one wall tile.
 * This makes the game harder to play, and makes the land troops more intimidating.
 * 
 *
 * @param block_data the data found in the BlockMarker - the data area is clipped to only include active blocks, starting from given coordinates
 * @param grid_x X coordinate on grid
 * @param grid_y Y coordinate on grid
 * @returns true on success, false on failure (i.e. something is preventing the shape from being added)
 */
Wall.prototype.canAddShape = function(block_data,grid_x,grid_y) {
	
	// Find shape bounds (min/max coordinates)
	var min_x = null, max_x = null, min_y = null, max_y = null;
	for(var x = 0; x < 5; ++x) {
		for(var y = 0; y < 5; ++y) {
			if(block_data[(y * 5) + x]) {
				if(min_x === null || x < min_x) min_x = x;
				if(max_x === null || x > max_x) max_x = x;
				if(min_y === null || y < min_y) min_y = y;
				if(max_y === null || y > max_y) max_y = y;
			}
		}
	}
	var w = max_x - min_x;
	var h = max_y - min_y;
	var xx, yy, neighbor = false;

	var land = Wall.types.land;
	var sand = Wall.types.sand;
	var mark = Wall.types.wallMark;
	var wall = Wall.types.wall;

	// See that each block is on empty ground
	for(var y = 0; y <= h; ++y) {
		for(var x = 0; x <= w; ++x) {
			var b = block_data[((y + min_y) * 5 + (x + min_x))];
			xx = x + grid_x;
			yy = y + grid_y;
			var t = this.getTile(xx, yy);
			if(b === 1) { // If block in the matrix is set
				// If tile is not land, sand or mark we can't place the tile
				if((t !== land && t !== sand && t !== mark)) { 
					return false;
				}
				
				// Since the previous test succeeded, we test to see if at least one
				// neighbor to the north, west, south or east is a wall tile.
				// We only do this is a neighborship has not already been established,
				// to avoid unnecessary tile queries
				FIND_NEIGHBOR: {
					if(!neighbor) {
						// A bit of an ugly codeblock.. but it does the job
						t = this.getTile(xx + 1,yy);
						if(t === wall) { neighbor = true; break FIND_NEIGHBOR; }
						t = this.getTile(xx - 1,yy);
						if(t === wall) { neighbor = true; break FIND_NEIGHBOR; }
						t = this.getTile(xx,yy + 1);
						if(t === wall) { neighbor = true; break FIND_NEIGHBOR; }
						t = this.getTile(xx,yy - 1);
						if(t === wall) { neighbor = true; break FIND_NEIGHBOR; }
					}
				}
			}
		}
	}

	//return true;
	return neighbor;

};

/**
 * Tries to add a shape to the wall structure. 
 *
 * @param block_data the data found in the BlockMarker - the data area is clipped to only include active blocks, starting from given coordinates
 * @param grid_x X coordinate on grid
 * @param grid_y Y coordinate on grid
 * @param temporary if set to true, adds an invisible wall placeholder instead of an actual wall. Used for sand testing while placing blocks.
 * @returns true on success, false on failure (i.e. something is preventing the shape from being added)
 */
Wall.prototype.addShape = function(block_data,grid_x,grid_y,temporary) {

	if(temporary === undefined) temporary = false;
	else temporary = (temporary == true);
	
	// Find shape bounds (min/max coordinates)
	var min_x = null, max_x = null, min_y = null, max_y = null;
	for(var x = 0; x < 5; ++x) {
		for(var y = 0; y < 5; ++y) {
			if(block_data[(y * 5) + x]) {
				if(min_x === null || x < min_x) min_x = x;
				if(max_x === null || x > max_x) max_x = x;
				if(min_y === null || y < min_y) min_y = y;
				if(max_y === null || y > max_y) max_y = y;
			}
		}
	}
	var w = max_x - min_x;
	var h = max_y - min_y;

	var land = Wall.types.land;
	var sand = Wall.types.sand;
	var mark = Wall.types.wallMark;
	
	for(var y = 0; y <= h; ++y) {
		for(var x = 0; x <= w; ++x) {
			var b = block_data[((y + min_y) * 5 + (x + min_x))];
			var t = this.getTile(x + grid_x, y + grid_y);
			if(b === 1) {
				if((t !== land && t !== sand && t !== mark)) {
					trace("Placement failure - block at " + (x + grid_x) + "," + (y + grid_y) + " has type " + t);
					return false;
				}
			}
		}
	}

	// Second run-through: actually place the shape
	// We already know that the test will succeed, so we don't need to check
	// the existing tile...
	for(var y = 0; y <= h; ++y) {
		for(var x = 0; x <= w; ++x) {
			var b = block_data[((y + min_y) * 5 + (x + min_x))];
			if(b === 1) {
				if(temporary === true) {
					this.markWall(x + grid_x, y + grid_y);
				} else {
					this.createWall(x + grid_x, y + grid_y);
				}
			}
		}
	}

	// Update visuals to get nice-looking walls and proper placement of sand
	this.update();

	return true;
	
};


//----------------------------------------------------------------------------
//
// Hit detection
//
//----------------------------------------------------------------------------


/**
 * Pixel level hit detection. If the bullet hits
 * walls, an appropriate wall tile is destroyed.
 *
 * @returns true on hit, false on miss
 */

Wall.adjacent = [
	[0, 1],
	[1, 0],
	[1, 1],
	[-1, 0],
	[0, -1],
	[-1, -1]
];

Wall.prototype.processHit = function(real_x,real_y,damage, radius) {
	
	var gx = Math.floor(real_x / g_game.getGridSizeX());
	var gy = Math.floor(real_y / g_game.getGridSizeY());

	var ggx, ggy;

	radius = radius | 0;

	var idx = ((gy * this._width) + gx) | 0; 

	var hit = [];

	if(this.getTile(gx,gy) === Wall.types.wall) {
		
		this._wall_health_data[idx] -= damage;
		if(this._wall_health_data[idx] <= 0) {
			this.destroyWall(gx,gy);
		}
		hit.push([real_x, real_y]);
	}


	var adj = Wall.adjacent;

	for(var r = 1; r <= radius; r++){
		for(var a = 0; a < adj.length; a++){
			ggx = gx + adj[a][0] * r;
			ggy = gy + adj[a][1] * r;
			idx = ((ggy * this._width) + ggx) | 0;
			if(this.getTile(ggx,ggy) === Wall.types.wall) {
				this._wall_health_data[idx] -= damage;
				if(this._wall_health_data[idx] <= 0) {
					this.destroyWall(ggx,ggy);
				}
				hit.push([ggx * g_game.getGridSizeX(), ggy * g_game.getGridSizeY()]);
			}
		}
	}

	return hit;
	
};

/**
 * Mark a tile as destroyed, create explosion effect..
 * 
 */
Wall.prototype.destroyWall = function(grid_x,grid_y) {
	
	if(this.getTile(grid_x,grid_y) === Wall.types.wall) {

		this.setTile(grid_x,grid_y,Wall.types.destroyed_wall);
		
		var idx = ((grid_y * this._width) + grid_x) | 0;
		
		this._wall_tiles[idx] = Wall.tiles.destroyed;
		this._wall_health_data[idx]  = 0;
		this._num_walltiles--;

		// Create a small explosion
		var gsx = g_game.getGridSizeX();
		var gsy = g_game.getGridSizeY();
		for(var i = 0; i < 8; ++i) {
			g_game.createExplosion((grid_x * gsx) + (Math.random() * gsx),
			                       (grid_y * gsx) + (Math.random() * gsy));
		}
	}
	
};


//----------------------------------------------------------------------------
//
// Gamestate related queries
//
//----------------------------------------------------------------------------


/**
 * Test if a wall tile is alive or not. Returns false if wall tile
 * has been destroyed or none exists at the given coordinates.
 * @param world_x X coordinate in world-space
 * @param world_y Y coordinate in world-space
 */
Wall.prototype.isWallTileAlive = function(world_x,world_y) {
	return this.getTile((world_x / g_game.getGridSizeX()) | 0,(world_y / g_game.getGridSizeY()) | 0) === Wall.types.wall;
};

/**
 * Test if a particular cannon is in a player-controlled area.
 * @param cannon a Cannon object
 * @returns {Boolean} 
 */
Wall.prototype.isCannonControlled = function(cannon) {
	return this._wall_data[(cannon.getGridY() * this._width) + cannon.getGridX()] === Wall.types.cannon;
};

/**
 * Test if a particular castle is in a player-controlled area.
 * @param castle a Castle object
 * @returns {Boolean}
 */
Wall.prototype.isCastleControlled = function(castle) {
	return this._wall_data[(castle.getGridY() * this._width) + castle.getGridX()] === Wall.types.castle;
};

/**
 * Test whether or not any castle or tower is being
 * controlled by the player (i.e. if castle and tower
 * tiles are surrounded by walls or sand).
 *
 * This is, effectively, an end game condition.
 */
Wall.prototype.areCastlesControlled = function() {
	
	this.update();

	var ok = false;
	OUTER: for(var c = 0; c < this._used_castles; ++c) {
		
		var cgx = this._castles[c].getGridX();
		var cgy = this._castles[c].getGridY();

		// Castles are four by four tiles in size
		for(var y = cgy; y < cgy + 4; ++y) {
			for(var x = cgx; x < cgx + 4; ++x) {
				if(this.getTile(x,y) !== Wall.types.castle)
					continue OUTER;
			}
		}

		ok = true;
	}
	
	return ok;
};


/**
 * Return the coordinates of a random, undamaged wall tile.
 * Used by enemies to find targets to shoot at.
 *
 * @returns a vec2 object
 */
Wall.prototype.getRandomWallCoordinates = function() {
	
	if(!this._num_walltiles) return null;
	
	var idx = (Math.random() * (this._num_walltiles - 1)) | 0;
	var type_w = Wall.types.wall;
	var i = 0;
	while(idx--) {
		do {
			i++;
		} while(this._wall_data[i] !== type_w);
	}

	var gx = g_game.getGridSizeX();
	var gy = g_game.getGridSizeY();
	
	var v = new vec2();
	v.x = ((i % this._width) | 0) * gx + gx * 0.5;
	v.y = ((i / this._width) | 0) * gy + gy * 0.5;
	return v;

};

/**
 * Create a destruction marker 
 *
 */
Wall.prototype.createDestructMarker = function(gx,gy) {

	if(!Wall.destructMarkerBitmap) {
		Wall.destructMarkerBitmap = g_assets.getBitmap('warning-marker');
	}
	var bmp = Wall.destructMarkerBitmap;
	var idx = this._used_destruct_markers;
	var marker = null;
	
	if(this._destruct_markers[idx]) {
		// Re-purpose existing marker
		marker = this._destruct_markers[idx];
	} else {
		// Create new marker
		marker = new Sprite(bmp);
		marker.setOffset(0,0);
		marker._grid_x = 0;
		marker._grid_y = 0;
		this._destruct_markers.push(marker);
	}


	var ts = this._wall_tileset;
	var offsx = ts.getOffsetX();
		offsx *= g_game.getGridSizeX() / (ts.getTileWidth() - offsx);
	var offsy = ts.getOffsetY();
	    offsy *= g_game.getGridSizeY() / (ts.getTileHeight() - offsy);
	
	
	marker.visible = true;
	marker.setScale(1);
	marker.setPosition(gx * g_game.getGridSizeX() + marker.getWidth() * 0.5 + offsx,
					   gy * g_game.getGridSizeY() + marker.getHeight() * 0.5 + offsy);
	marker._grid_x = gx;
	marker._grid_y = gy;
	this._container.addChild(marker);
	this._used_destruct_markers++;
	
	
};

/**
 * 
 * 
 */
Wall.prototype.clearDestructMarkers = function() {
	for(var i = 0, l = this._used_destruct_markers; i < l; ++i) {
		this._destruct_markers[i].removeFromParent();
	}
	this._used_destruct_markers = 0;
};

/**
 *
 *
 */
Wall.prototype.updateDestructMarkers = function(sync) {

	var bias = (0.8 + (Math.sin(Math.float_mod(g_engine.getTimeCurrent() / 250.0,Math.PI * 2)) * 0.2));
	
	for(var i = 0, l = this._used_destruct_markers; i < l; ++i) {
		var m = this._destruct_markers[i];
		m.setScale(bias - 0.15);
		m.setOpacity(bias);
	}
	
};

/**
 * 
 * 
 */
Wall.prototype.removeDestructMarker = function(grid_x,grid_y) {
	for(var i = 0, l = this._used_destruct_markers; i < l; ++i) {
		var m = this._destruct_markers[i];
		if(m._grid_x === grid_x && m._grid_y === grid_y) {
			this._destruct_markers.push(this._destruct_markers.splice(i,1)[0]);
			this._used_destruct_markers--;
			m.removeFromParent();
			--i;
			--l;
		}
	}
};

/**
 * Function to find the wall tile nearest to a position in the game world.
 * Used for target aquisition by land troops. Function needs to run fast
 * in order to not hog all processing time.
 * 
 * This function returns the GRID COORDINATES of the nearest wall tile;
 * see Game::getgetNearestWallTileCoordinates() for the function that
 * translates the output of this function into world-space coordinates.
 * 
 * @param from_x Grid x-coordinate
 * @param from_y Grid y-coordinate
 * @return vec2, with the x and y coordinates of the closest wall tile, or null, if none was found (this can THEORETICALLY happen).
 */
Wall.prototype.getNearestWallTileTo = function(from_x,from_y) {
	
	//
	// Since this function needs to run frequently, possibly several times
	// per frame, we're trying a slightly more optimized approach than a
	// brute force search through the data array.
	//
	
	var gx = (from_x) | 0;
	var gy = (from_y) | 0;
	var v = new vec2();
	var type_w = Wall.types.wall;
	var getTile = this.getTile; // Retrieve local function reference for faster access
	
	// Begin by checking that the given coordinates are not already a wall tile
	// (whereby that wall tile is the closest one by default - a small rounding
	// error notwithstanding; we can live with it).

	if(this.getTile(gx, gy) === type_w) {
		v.x = gx;
		v.y = gy;
		return v;
	} 

	// If this is not the case, start searching in an expanding rectangle.
	// For faster processing, we first process the horizontal edges, and
	// then the vertical edges, in separate loops.

	// To speed up processing, we precalculate the x and y bounds, as well as set up
	// tests to find out which x and y edges need to be tested (since the function will,
	// eventually, bleed outside the level's confines (and, therefore, that edge
	// will not need to be tested).
	
	var radius = 1, x0, x1, y0, y1, x, y;
	var test_x0, test_y0, test_x1, test_y1;
	var max_radius = Math.max(this._width,this._height);
	var w = this._width;
	var h = this._height;
	var tiles = [];
	
	while(radius < max_radius) {
		
		x0 = gx - radius;
		x1 = gx + radius;
		y0 = gy - radius;
		y1 = gy + radius;
	
		test_x0 = x0 > -1;
		test_y0 = y0 > -1;
		test_x1 = x1 < w;
		test_y1 = y1 < h;
	
		// Test upper horizontal line 
		if(test_y0) {
			if(!test_x0) x0 = 0;
			if(!test_x1) x1 = w;
			for(x = x0; x <= x1; ++x) {
				if(this.getTile(x,y0) === type_w) {
					tiles.push({
						x: x,
						y: y0,
						d: (x * x) + (y0 * y0)
					});
				}
			}
		}
		
		// Test lower horizontal line
		if(test_y1) {
			if(!test_x0) x0 = 0;
			if(!test_x1) x1 = w;
			for(x = x0; x <= x1; ++x) {
				if(this.getTile(x,y1) === type_w) {
					tiles.push({
						x: x,
						y: y1,
						d: (x * x) + (y1 * y1)
					});
				}
			}
		}
		
		// Test left vertical line
		if(test_x0) {
			if(!test_y0) y0 = 0;
			if(!test_y1) y1 = h;
			for(y = y0 + 1; y < y1; ++y) { // We don't need to test y0,x0 and y1,x0 again
				if(this.getTile(x0,y) === type_w) {
					tiles.push({
						x: x0,
						y: y,
						d: (x0 * x0) + (y * y)
					});
				}
			}
		}
		
		// Test right vertical line
		if(test_x1) {
			if(!test_y0) y0 = 0;
			if(!test_y1) y1 = h;
			for(y = y0 + 1; y < y1; ++y) { // Same as above 
				if(this.getTile(x1,y) === type_w) {
					tiles.push({
						x: x1,
						y: y,
						d: (x1 * x1) + (y * y)
					});
				}
			}
		}

		// If we have any tiles in, sort them by distance to origin,
		// then pick the first tile in the sorted list
		if(tiles.length) {
			tiles.sort(function(a,b) {
				return a.d - b.d;
			});
			var t = tiles[0];
			v.x = t.x;
			v.y = t.y;
			return v;
		}
		
		radius++;
		
	}
	
	return null;
};
