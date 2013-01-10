/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * Shelf.js
 *
 * Tile and cannon placement shelf.
 *
 * creation date: 06-08-2012
 * 
 */

"use strict";

/*
 * Base ShelfDraggable class (in case we need to (*gulp*) add something besides
 * cannons and walls.. and even if we don't, it's nice to have the nasty drag
 * handling in one place)
 */
function ShelfDraggable() {
	SceneNode.call(this);
	this._shelf = null;
	this._drag_return_timer = new Timer();
	this._drag_handler = null;
	this._dragged = false;
	this._dropped = false;
	this._locked = false;
	this._drag_thresh = 100;
	this._grab_x = 0;
	this._grab_y = 0;
	this._drag_x0 = 0;
	this._drag_y0 = 0;
	this._drag_x1 = 0;
	this._drag_y1 = 0;
	this._drag_return_timer.setTarget(0.25);

	this._x_extend = this._y_extend = 0;

	this.onDrop = function(x,y) {
	};
};
ShelfDraggable.inherits(SceneNode);

ShelfDraggable.prototype.init = function() {
	this.visible = true;
};

ShelfDraggable.prototype.lock = function() {
	this._locked = true;
	return this;
};

ShelfDraggable.prototype.unlock = function() {
	this._locked = false;
	return this;
};

ShelfDraggable.prototype.start = function() {
	var w = this.mainObject.getWidth();
	var h = this.mainObject.getHeight();
	this.object_is_out = false;
	this.mainObject.visible = true;
	this._drag_thresh = Math.sqrt((w * w) + (h * h));
	this._drag_handler = g_input.addDragHandler(this.dragStarted,this.dragMoved,this.dragStopped,this);
	return this;
};

ShelfDraggable.prototype.stop = function() {
	g_input.removeDragHandler(this._drag_handler);
	return this;
};

ShelfDraggable.prototype.dragStarted = function(x,y) {

	if(this._locked || !this._shelf.visible || !this.mainObject.visible) return;

	var lx = this.mainObject.getX();
	var ly = this.mainObject.getY();
	var p  = this.getParent();
	
	var x0 = lx + p.getX() + this.getX() + this.getOffsetX() - this._x_extend;
	var y0 = ly + p.getY() + this.getY() + this.getOffsetY() - this._y_extend;
	var x1 = x0 + this.mainObject.getWidth() + this._x_extend;
	var y1 = y0 + this.mainObject.getHeight() + this._y_extend;

	if(x > x0 && x < x1 && y > y0 && y < y1) {
		this._grab_x = x - lx;
		this._grab_y = y - ly;
		this._drag_x0 = lx;
		this._drag_y0 = ly;
		this._dragged = true;
		this._dropped = false;
		this._shelf._dragging = true;
		g_game.getCamera().lock();
	}
	
};

ShelfDraggable.prototype.dragMoved = function(x,y) {

	if(this._dragged && !this._dropped) {
		
		this._shelf._dragging = true;
		
		var thresh = this._drag_thresh;
			thresh *= thresh;
		
		var dx = x - this._grab_x - this._drag_x0;
		var dy = y - this._grab_y - this._drag_y0;
		var d = (dx * dx) + (dy * dy);
		
		this.mainObject.setPosition(x - this._grab_x,y - this._grab_y);
		
		if(d > thresh) {
			this._dropped = true;
			this.onDrop.call(this,x,y);
		}
		
	}
	
};

ShelfDraggable.prototype.dragStopped = function(x,y) {
	
	if(this._dragged) {
		
		if(this._dropped) {
			// Re-initialize the draggable
			this.mainObject.setPosition(this._drag_x0,this._drag_y0);
			this.init();
		} else {
			// Move the draggable back into its starting position.. and lock it
			this._drag_x1 = x - this._grab_x;
			this._drag_y1 = y - this._grab_y;
			this._drag_return_timer.stop().reset().start();
			this._locked = true;
		}
		
		this._dragged = false;
		window.setTimeout(function() {
			g_game.getCamera().unlock();
		},50);

		this._shelf._dragging = false;
	}
	
};

ShelfDraggable.prototype.update = function(sync) {
	if(this._locked) {

		var b = this._drag_return_timer.getProgress();
		var x = Ease.sin_lerp(b,this._drag_x1,this._drag_x0);
		var y = Ease.sin_lerp(b,this._drag_y1,this._drag_y0);
		
		if(this._drag_return_timer.isComplete()) {
			x = this._drag_x0;
			y = this._drag_y0;
			this._locked = false;
			this._drag_return_timer.stop();
		}
		
		this.mainObject.setPosition(x,y);
	}
	this._drag_return_timer.update(sync);
};

function ShelfBlock(maxFakeObjects) {
	ShelfDraggable.call(this);

	this._mainShapeDisplay = {
		data: [],
		sprites: [],
		container: {},
		shape: -1,
		rotate_count: 0
	};

	this._shapes = [];

	this._mainShapeDisplay.container = this.mainObject = new SceneNode();

	this.maxFakeObjects = maxFakeObjects = maxFakeObjects || 7;

	var fc = this._fakeShapeDisplay = [];

	var ts = g_assets.getTileset('wall-tiles');

	for(var i = 0; i < maxFakeObjects; i++){
		this._shapes.push([(Math.random() * BlockShape.length) | 0, (Math.random() * 4) | 0]);
		fc.push({
			data: [],
			sprites: [],
			container: new SceneNode(),
			shape: -1,
			rotate_count: 0
		});
		for(var j = 0; j < 25; j++){
			var s = new Sprite(ts);
			s.visible = false;
			fc[i].container.addChild(s);
			fc[i].container.setOpacity(0.5);
			fc[i].sprites.push(s);
		}
		this.addChild(fc[i].container);
	}

	for(var i = 0; i < 25; ++i) {
		var s = new Sprite(ts);
		s.visible = false;
		this._mainShapeDisplay.sprites.push(s);
		this._mainShapeDisplay.container.addChild(s);
	}
	this.addChild(this._mainShapeDisplay.container);
	
	this._tileset = ts;
	
	this.onDrop = function(x,y) {
		g_game.buildBlockDropped(x,y);
		this.init();
	};
	
	this.init = function() {
		this.visible = true;
		var xadd = this._tileset.getTileWidth() + this._tileset.getOffsetX();
		var yadd = this._tileset.getTileHeight() + this._tileset.getOffsetY();
		this.arrange();
		this._shelf && this._shelf.setInnerWidth((this._tileset.getTileWidth() + this._tileset.getOffsetX()) * 2 * this.maxFakeObjects);
	};

	this._sound_rotate = g_assets.getSound('pieceRotate');
	
	this.init();
};

ShelfBlock.inherits(ShelfDraggable);

ShelfBlock.prototype.arrange = function(){
	var num = this.maxFakeObjects - 1;

	var sw = (this._tileset.getTileWidth() + this._tileset.getOffsetX()) * 2,
		l = -sw * (num + 1) / 2,
		t = -(this._tileset.getTileHeight() + this._tileset.getOffsetY()) * 0.85;
	if(this.mainObject.visible){
		this.setShape(this._shapes[0][0], this._shapes[0][1], this._mainShapeDisplay);
		this.mainObject.setPosition(0,t);
		this._fakeShapeDisplay[num].container.visible = false;
	}else{
		this._fakeShapeDisplay[num].container.setPosition(0, t);
		this._fakeShapeDisplay[num].container.visible = true;
		this.setShape(this._shapes[0][0], this._shapes[0][1], this._fakeShapeDisplay[num]);
	}
	this.setOffset(l, 0);
	for(var i = 0; i < num; i++){
		this.setShape(this._shapes[i + 1][0], this._shapes[i + 1][1], this._fakeShapeDisplay[i]);
		this._fakeShapeDisplay[i].container.visible = true;
		this._fakeShapeDisplay[i].container.setPosition(sw + sw * i, t);
	}
};

ShelfBlock.prototype.popShapeData = function() {
	var r = [];
	for(var i = 0; i < 25; i++){
		r.push(this._mainShapeDisplay.data[i]);
	}
	this._shapes.shift();
	this._shapes.push([(Math.random() * BlockShape.length) | 0, (Math.random() * 4) | 0]);
	this.arrange();
	return r;
};

ShelfBlock.prototype.setShape = function(shape_idx, rotate_ind, obj) {
	
	obj.shape = shape_idx;
	for(var i = 0; i < 25; ++i) {
		obj.data[i] = BlockShape[shape_idx][i];
	}
	for(var i = 0; i < rotate_ind; ++i) {
		this.rotate(true, obj);
	}
	
	this.updateSprite(obj);

};

ShelfBlock.temp = [];
ShelfBlock.prototype.rotate = function(skipUpdate, obj) {
	var x,y,i;
	
	for(i = 0; i < 25; ++i) {
		ShelfBlock.temp[i] = 0;
	}
	
	for(y = 0; y < 5; ++y) {
		for(x = 0; x < 5; ++x) {
			ShelfBlock.temp[(x * 5) + y] = obj.data[((5 - y) * 5) + x];
		}
	}

	for(i = 0; i < 25; ++i) {
		obj.data[i] = ShelfBlock.temp[i];
	}
	if(!skipUpdate) {
		this.updateSprite(obj);
		this._sound_rotate.play();
	}
};

ShelfBlock.prototype.updateSprite = function(obj) {
	var shape = obj.data;
	var size = 0;
	var x0 = 5, x1 = 0, y0 = 5, y1 = 0;
	
	// Figure out size (number of blocks)
	for(var i = 0; i < 25; ++i) {
		obj.sprites[i].visible = false;
		if(shape[i]) size++;
	}
	
	// Figure out bounds (for centering)
	for(var y = 0; y < 5; ++y) {
		for(var x = 0; x < 5; ++x) {
			if(shape[(y * 5) + x]) {
				if(x < x0) x0 = x;
				if(x > x1) x1 = x;
				if(y < y0) y0 = y;
				if(y > y1) y1 = y;
			}
		}
	}
	
	var w = x1 - x0;
	var h = y1 - y0;
	
	var xadd = this._tileset.getTileWidth() + this._tileset.getOffsetX();
	var yadd = this._tileset.getTileHeight() + this._tileset.getOffsetY();
	var xx = 0.5 * xadd;
	var yy = 0.5 * yadd;
	
	var i = 0;
	for(var y = y0; y <= y1; ++y) {
		xx = 0.5 * xadd;
		for(var x = x0; x <= x1; ++x) {
			if(shape[(y * 5) + x]) {
				var s = obj.sprites[i++];
				s.setPosition(xx,yy);
				s.visible = true;
				
				// To produce a proper wall segment, we test neighborship
				// of each tile. The following variables test if there is
				// a neighbor to the west, east, north or south, respectively.
				//
				// This is a crude first version of a proper algorithm, which
				// should interface with Wall, to give real-time preview of
				// walls.
				var nw = (x > 0) && (shape[ ((y + 0) * 5) + (x - 1) ]) > 0;
				var ne = (x < 4) && (shape[ ((y + 0) * 5) + (x + 1) ]) > 0;
				var nn = (y > 0) && (shape[ ((y - 1) * 5) + (x + 0) ]) > 0;
				var ns = (y < 4) && (shape[ ((y + 1) * 5) + (x + 0) ]) > 0;
				
				// Set sprite tile according to neighborship
				if(nw && ne && nn && ns) { s.setTile('center'); }
				else if(!(nw || ne || nn || ns)) { s.setTile('none');   }
				
				else if(nw && !(ne || nn || ns)) { s.setTile('left');   }
				else if(ne && !(nw || nn || ns)) { s.setTile('right');  }
				else if(nn && !(nw || ne || ns)) { s.setTile('up');     }
				else if(ns && !(nw || ne || nn)) { s.setTile('down');   }
					 
				else if(!nn &&  ne &&  ns &&  nw) { s.setTile('t-up');    }
				else if( nn &&  ne && !ns &&  nw) { s.setTile('t-down');  }
				else if( nn && !ne &&  ns &&  nw) { s.setTile('t-right'); }
				else if( nn &&  ne &&  ns && !nw) { s.setTile('t-left');  }
					 
				else if(nw && ne) { s.setTile('leftright');             }
				else if(ns && nn) { s.setTile('updown');                }
				else if(nw && nn) { s.setTile('upleft');                }
				else if(ne && nn) { s.setTile('upright');               }
				else if(nw && ns) { s.setTile('downleft');              }
				else if(ne && ns) { s.setTile('downright');             }
					 
				else s.setTile('center'); // This should never happen
				
			}
			xx += xadd;
			
		}
		yy += yadd;
		
	}
	
	if(w < 2){
		w = 2;
	}
	if(h < 2){
		h = 2;
	}
	obj.container.setSize((w + 2) * xadd,(h + 2) * yadd);
	obj.container.setScale(0.6);
};

ShelfBlock.prototype.setAllowing = function(allowing){
	if(this.mainObject.visible != allowing){
		this.mainObject.visible = allowing;
		this.arrange();
	}
};

ShelfBlock.prototype.allowing = function(){
	return this.mainObject.visible;
};

ShelfBlock.prototype.update = function(sync) {
	ShelfDraggable.prototype.update.call(this,sync);
	
	if(this._dragged || this._locked) return;
	
	if(g_input.isClicked()) {
		
		var x = g_input.getX();
		var y = g_input.getY();
		var lx = this.getX() + this.mainObject.getX() + this.getOffsetX();
		var ly = this.getY() + this.mainObject.getY() + this.getOffsetY();
		var p  = this.getParent();
		
		var x0 = lx + p.getX();
		var y0 = ly + p.getY();
		var x1 = x0 + this.mainObject.getWidth();
		var y1 = y0 + this.mainObject.getHeight();
		
		if(x > x0 && x < x1 && y > y0 && y < y1) {
			this.rotate(false, this._mainShapeDisplay);
		}
	}
};
	
function ShelfCannon(maxFakeCannons) {
	ShelfDraggable.call(this);
	
	this._x_extend = this._y_extend = 20;

	this.maxFakeCannons = maxFakeCannons || 13;

	var sprite = this.mainObject = new Sprite(g_assets.getBitmap('cannon-marker'));

	this.onDrop = function(x,y) {
		trace("Cannon dropped at " + x,y);
		g_game.placeCannonDropped(x,y);
		this.object_is_out = true;
		this.setCannons(this.num);
	};

	var fakeSprites = [];
	for (var i = 0; i < this.maxFakeCannons; i++){
		fakeSprites.push(new Sprite(g_assets.getBitmap('cannon-marker')));
		fakeSprites[i].setOpacity(0.5);
		fakeSprites[i].visible = false;
	}
	this.fakeSprites = fakeSprites;
	
	this.init = function() {
		this.visible = true;
		this.addChild(sprite);
		this.setSize(sprite.getWidth() * 1.5,sprite.getHeight() * 1.5);
		for(var i = 0; i < this.maxFakeCannons; i++){
			this.addChild(fakeSprites[i]);
		}
	};

	this.init();
};

ShelfCannon.inherits(ShelfDraggable);

ShelfCannon.prototype.setCannons = function(num) {
	this.num = num;
	if(this.object_is_out){
		num--;
	}
	if(num < 0){
		num = 0;
	}
	var sw = this.fakeSprites[0].getWidth(),
		l = -sw * num / 2,
		t = this.fakeSprites[0].getHeight() * 0.25;
	if(this.mainObject.visible){
		this.mainObject.setPosition(0,t);
		this.fakeSprites[this.maxFakeCannons - 1].visible = false;
	}else{
		this.fakeSprites[this.maxFakeCannons - 1].setPosition(0, t);
		this.fakeSprites[this.maxFakeCannons - 1].visible = true;
	}
	this.setOffset(l, 0);
	for(var i = 0; i < num - 1; i++){
		this.fakeSprites[i].visible = true;
		this.fakeSprites[i].setPosition(sw + sw * i, t);
	}
	for(var i = Math.max(num - 1, 0); i < this.maxFakeCannons - 1; i++){
		this.fakeSprites[i].visible = false;
	}
	this._shelf.setInnerWidth(sw * num);
};

ShelfCannon.prototype.setAllowing = function(allowing) {
	this.mainObject.visible = allowing;
	this.setCannons(this.num);
};

ShelfCannon.prototype.allowing = function(){
	return this.mainObject.visible;
}

function Shelf() {
	SceneNode.call(this);

	this._innerWidth = 0;
	this._height = g_assets.getBitmap('ui-buildbar-fill').getHeight();
	this._marginWidth = g_assets.getBitmap('ui-buildbar-left').getWidth();

	this._block = new ShelfBlock();
	this._cannon = new ShelfCannon();
	this._cannon.setPosition(0, (-this.getHeight() + this._cannon.getHeight()) / 2);
	this._block._shelf = this;
	this._cannon._shelf = this;
	this._dragging = false;
	

	this._object = null;
	this._fillColor = "";
	this.setColor(g_config.ui.shelf.r,
				  g_config.ui.shelf.g,
				  g_config.ui.shelf.b,
				  g_config.ui.shelf.a);

	this._cache = new Image();

};

Shelf.inherits(SceneNode);

Shelf.prototype.setInnerWidth = function(w){
	if(this._innerWidth !== w){
		this._innerWidth = w;
		this.updateCache();
	}
};

Shelf.prototype.getBlock = function() {
	return this._block;
};

Shelf.prototype.getCannon = function() {
	return this._cannon;
};

Shelf.prototype.isDragging = function() {
	return this._dragging;
};

Shelf.prototype.setAvailableCannons = function(num) {
	this._cannon.setCannons(num);
};

Shelf.prototype.startCannonPlacement = function() {
	this.stop();
	this._object = this._cannon;
	this.addChild(this._cannon);
	this._cannon.start();
	return this;
};

Shelf.prototype.startBlockPlacement = function() {
	this.stop();
	this._object = this._block;
	this.addChild(this._block);
	this._block.start();
	this._block.init();
	return this;
};

Shelf.prototype.setAllowingItem = function(allowed){
	this._object.setAllowing(allowed);
};

Shelf.prototype.allowingItem = function(){
	return this._object.allowing();
};

Shelf.prototype.stop = function() {
	if(this._object) this._object.stop();
	this._object = null;
	this.clearChildren();
	return this;
};

Shelf.prototype.getWidth = function() {
	return this._innerWidth + 2 * this._marginWidth;
};

Shelf.prototype.getHeight = function() {
	return this._height;
};

Shelf.prototype.setColor = function(r,g,b,a) {
	this._fillColor = "rgba(" + r + "," + g + "," + b + "," + a + ")";
};

Shelf.prototype.draw = function(canvas, context, matrix) {

	matrix.applyTo(context);

	var w = this.getWidth();
	var h = this.getHeight();
	var hw = w * 0.5;
	var hh = h * 0.5;

	context.drawImage(this._cache, 0, 0, w, h, -hw, -hh, w, h);
};

Shelf.prototype.updateCache = function(){
	var cimg = document.createElement('canvas');
	cimg.setAttribute('width', this.getWidth());
	cimg.setAttribute('height', this.getHeight());
	var context = cimg.getContext('2d');

	var w = this.getWidth();
	var h = this.getHeight();
	var mw = this._marginWidth;
	var sw = g_assets.getBitmap('ui-buildbar-fill').getWidth() - 1;

	for(var i = mw - 1; i < w - mw; i+= sw){
		context.drawImage(g_assets.getBitmap('ui-buildbar-fill').getSource(), 0, 0, sw, h, i, 0, sw, h);
	}

	context.drawImage(g_assets.getBitmap('ui-buildbar-left').getSource(), 0, 0, mw, h, 0, 0, mw, h);
	context.drawImage(g_assets.getBitmap('ui-buildbar-right').getSource(), 0, 0, mw, h, w - mw, 0, mw, h);
	this._cache.src = cimg.toDataURL();
};

Shelf.prototype.update = function(sync) {
	if(this._object) {
		this._object.update(sync);
		this._shelf_width = this._object.getWidth();
		this._shelf_height = this._object.getHeight();
	} else {
		this._shelf_width = 0;
		this._shelf_height = 0;
	}
};
