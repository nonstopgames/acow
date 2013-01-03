/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * Map.js
 *
 * Map (battlefield) handling code.
 *
 * creation date: 21-06-2012
 * 
 */

"use strict";

/**
 * Handle drawing and state of map.
 *
 * Only handles drawing of terrain and related stuff. One map tile should equal
 * four grid tiles.
 *
 * Sand drawing is removed from Map, and is instead moved to Wall, since these objects
 * operate on different grids.
 *
 * Requires a tilemap asset called 'level-tiles', which needs to contain
 * a full tile list (grass, water, sand, bank-{up,down,left,right,upright,upleft,downright,downleft} and
 * bank-inner-{upright,upleft,downright,downleft}
 * 
 */
function Map() {

	this._width = 16;
	this._height = 12;
	this._tileset = g_assets.getTileset('level-tiles');
	this._container = new SceneNode();
	this._map_data = [];
	this._shore_data = [];
	this._tile_data = [];
	this._wall_data = [];

	// Get local aliases for tileset's tiledefs
	this.tiles = {
		grass:                this._tileset.getTileIndex('grass'),
		water:                this._tileset.getTileIndex('water'),
		sand:                 this._tileset.getTileIndex('sand'),
		bank_up:              this._tileset.getTileIndex('bank-up'),
		bank_down:            this._tileset.getTileIndex('bank-down'),
		bank_left:            this._tileset.getTileIndex('bank-left'),
		bank_right:           this._tileset.getTileIndex('bank-right'),
		bank_upright:         this._tileset.getTileIndex('bank-upright'),
		bank_upleft:          this._tileset.getTileIndex('bank-upleft'),
		bank_downright:       this._tileset.getTileIndex('bank-downright'),
		bank_downleft:        this._tileset.getTileIndex('bank-downleft'),
		bank_inner_upright:   this._tileset.getTileIndex('bank-inner-upright'),
		bank_inner_upleft:    this._tileset.getTileIndex('bank-inner-upleft'),
		bank_inner_downright: this._tileset.getTileIndex('bank-inner-downright'),
		bank_inner_downleft:  this._tileset.getTileIndex('bank-inner-downleft')
	};

	this._tilemap = new Tilemap(this._tileset,this._width,this._height,this._tile_data);
	this._container.addChild(this._tilemap);
};

Map.prototype.init = function() {

	// The reader may wish to move the data to a more comfortable place

	this._width = 26;
	this._height = 20;
	this._map_data = [
		1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
		1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
		1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 4, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
		1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 4, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
		1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 4, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
		1, 1, 1, 1, 1, 1, 1, 3, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
		1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
		1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 4, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
		1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 4, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
		1, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 4, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
		1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
		1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
		1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
		1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
		1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 1, 1, 1, 1, 1, 4, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
		1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 4, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
		1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 4, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
		1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
		1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
		1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 4, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
	];

	this.findShoreline();
	this.recalcTileMap();
};

/**
 * Process shoreline (i.e. store possible landing coordinates).
 * Store the result in this._shore_data.
 */
Map.prototype.findShoreline = function() {
	
	for(var i = 0, l = this._width * this._height; i < l; ++i) {
		if(this._map_data[i] === 4) {
			this._shore_data.push({
				x: (i % this._width) | 0,
				y: (i / this._width) | 0,
				idx: i | 0
			});
			this._map_data[i] = 2;
		}
	}
	
};

/**
 *
 */
Map.prototype.getWidth = function() {
	return this._width;
};

/**
 *
 */
Map.prototype.getHeight = function() {
	return this._height;
};

/**
 * Get a reference to the tilemap object, used for rendering
 * 
 */
Map.prototype.getSprite = function() {
	return this._container;
};

/**
 * Recalculate tile map based on map data
 *
 */
Map.prototype.recalcTileMap = function() {

	var idx = 0;
	var t = 0;
	for(var y = 0; y < this._height; ++y) {
		for(var x = 0; x < this._width; ++x) {
			var c = this._map_data[idx];
			
			switch(c) {
				case 1:
					t = this.tiles.grass;
				break;
				case 2:
					
					// Four main directions
					var nw = this.getTile(x - 1,y) === 1;
					var ne = this.getTile(x + 1,y) === 1;
					var nn = this.getTile(x,y - 1) === 1;
					var ns = this.getTile(x,y + 1) === 1;
					
					// Angles
					var nnw = this.getTile(x - 1, y - 1) === 1;
					var nne = this.getTile(x + 1, y - 1) === 1;
					var nsw = this.getTile(x - 1, y + 1) === 1;
					var nse = this.getTile(x + 1, y + 1) === 1;
					 
					if(ns && !(ne || nw || nn)) t = this.tiles.bank_up;
					else if(nn && !(ne || nw || ns)) t = this.tiles.bank_down;
					else if(nw && !(ne || nn || ns)) t = this.tiles.bank_right;
					else if(ne && !(nw || nn || ns)) t = this.tiles.bank_left;
					else if(nw && ns && !nn) t = this.tiles.bank_inner_upright;
					else if(nw && nn && !ns) t = this.tiles.bank_inner_downright;
					else if(!nn && !nw && !ns && nsw) t = this.tiles.bank_upright;
					else if(!nn && !nw && !ns && nnw) t = this.tiles.bank_downright;

					else if(ne && ns && !nn) t = this.tiles.bank_inner_upleft;
					else if(ne && nn && !ns) t = this.tiles.bank_inner_downleft;
					else if(!nn && !nw && !ns && nse) t = this.tiles.bank_upleft;
					else if(!nn && !nw && !ns && nne) t = this.tiles.bank_downleft;
					
					else t = this.tiles.water;
					
				break;
				case 3:
					 t = this.tiles.grass;
				break;
			}

			this._tile_data[idx++] = (t instanceof Array ? t[Math.rand(t.length)] : t);
		}
	}

	this._tilemap.setMapSize(this._width,this._height);
	this._tilemap.optimize();
	this._tilemap.cache(true);
};

/**
 * Get map tile type at x,y.
 * Possible types are: 1: ground, 2: water, 3: castle spot
 *
 * @returns 1, 2 or 3 on success, 0 on error.
 */
Map.prototype.getTile = function(x,y) {
	if(y < 0 || y > this._height || x < 0 || x >= this._width) return 0;
	return this._map_data[(y * this._width) + x];
};

/**
 * Get the 'terrain type' of the tile at coordinates x,y.
 * This is done so that shooting at the shoreline doesn't look so silly :F
 *
 * @returns 1 if ground, 2 if water
 */
Map.prototype.getTerrainType = function(x,y) {
	
	// Four main directions
	var nw = this.getTile(x - 1,y) === 1;
	var ne = this.getTile(x + 1,y) === 1;
	var nn = this.getTile(x,y - 1) === 1;
	var ns = this.getTile(x,y + 1) === 1;

	// Angles
	var nnw = this.getTile(x - 1, y - 1) === 1;
	var nne = this.getTile(x + 1, y - 1) === 1;
	var nsw = this.getTile(x - 1, y + 1) === 1;
	var nse = this.getTile(x + 1, y + 1) === 1;

	return (nw || ne || nn || ns || nnw || nne || nsw || nse) ? 1 : 2;
	
};

/**
 * Remove a castle tile from the map data. This is a run-once operation,
 * used by Wall, to avoid spawning four castles/towers instead of one.
 */
Map.prototype.invalidateCastle = function(x,y) {
	if(y < 0 || y > this._height || x < 0 || x >= this._width) return 0;
	if(this._map_data[(y * this._width) + x] === 3) {
		this._map_data[(y * this._width) + x] = 1;
	}
	return this;
};

Map.prototype.getWaterVerticalMin = function() {
	for(var x = 0; x < this._width; ++x) {
		var ok = true;
		for(var y = 0; y < this._height; ++y) {
			if((this._map_data[(y * this._width) + x]) !== 2) {
				ok = false;
				break;
			}
		}
		if(ok) return (x << 1) + 1;
	}
	return -1;
};

Map.prototype.getWaterVerticalMax = function() {
	for(var x = this._width - 1; x >= 0; --x) {
		var ok = true;
		for(var y = 0; y < this._height; ++y) {
			if((this._map_data[(y * this._width) + x]) !== 2) {
				ok = false;
				break;
			}
		}
		if(ok) return (x << 1) - 1;
	}
	return -1;
};

/**
 * Find landing zone for troop transport. Requires two squares of room between shore
 * tile coordinate and nearest wall. Finds all possible zones and picks one at random.
 * Direclty interfaces with Wall
 */
Map.prototype.findAvailableLandingZone = function() {
	
	var point = this._shore_data[Math.rand(this._shore_data.length)];
	
	return {
		x: point.x << 1,
		y: point.y << 1
	};
	
};
