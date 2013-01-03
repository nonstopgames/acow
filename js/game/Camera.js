/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * Camera.js
 * 
 * Camera control code.
 *
 * creation date: 19-07-2012
 */

"use strict";

/**
 * Camera class, making it possible to pan and zoom the game area
 *
 * X and Y coordinates are always in unscaled world-space
 * Width and height of the center point (i.e. half the window size) are
 * always scaled (since they should reflect how much world area half the
 * window covers).
 *
 * Camera may NOT move outside client area (i.e. x - scaled_center_w, y - scaled_center_h should be
 * greater than or equal to 0, and x + scaled_center_w, y + scaled_center_h should be less than or
 * equal to client_w, client_h
 * 
 */
function Camera() {

	this._locked = false;

	this._scale_x = 1;
	this._scale_y = 1;
	this._offset_x = 0;
	this._offset_y = 0;
	
	this._client_w = g_env.getWidth();
	this._client_h = g_env.getHeight();
	this._window_w = this._client_w;
	this._window_h = this._client_h;
	this._center_wx = this._client_w >> 1;
	this._center_wy = this._client_h >> 1;

	this._x = this._client_w >> 1;
	this._y = this._client_h >> 1;
	this._z = 1.0;
	this._z_min = 0.5;
	this._z_max = 2.0;
	this._z_from = 1.0;
	this._z_to = 1.0;
	this._z_step_up   = 1.2;
	this._z_step_down = 0.8;

	this._grab_x = 0;
	this._grab_y = 0;
	
	this._pinch_start_x0 = 0;
	this._pinch_start_y0 = 0;
	this._pinch_start_x1 = 0;
	this._pinch_start_y1 = 0;
	
	this._drag_delta_buffer = [];
	this._pinch_delta_buffer = [];

	// Inertia-related..
	this._friction = 0.8;
	this._grabbed = false;
	this._last_x = this._x;
	this._last_y = this._y;
	this._last_z = this._z;
	this._delta_x = 0;
	this._delta_y = 0;
	this._delta_z = 0;
	
	this._dragHandler = null;
	this._wheelHandler = null;
	this._pinchHandler = null;
	
	Object.seal && Object.seal(this);
};

/**
 * Lock the camera controls. The camera won't pan or zoom when locked.
 */
Camera.prototype.lock = function() {
	this._locked = true;
	return this;
};

/**
 * Unlock camera controls
 */
Camera.prototype.unlock = function() {
	this._locked = false;
	return this;
};

/**
 * Find out if camera is locked or not
 */
Camera.prototype.isLocked = function() {
	return this._locked;
};

/**
 * Set the bounds of the camera's operating area.
 * All values are unscaled.
 *
 * @param win_w width of window
 * @param win_h height of window
 * @param client_w width of client (game area)
 * @param cleint_h height of client (game area)
 */
Camera.prototype.setBounds = function(win_w,win_h,client_w,client_h) {
	if(client_w !== undefined) this._client_w = client_w;
	if(client_h !== undefined) this._client_h = client_h;
	if(win_w !== undefined) this._window_w = win_w;
	if(win_h !== undefined) this._window_h = win_h;
	this._center_wx = this._window_w >> 1;
	this._center_wy = this._window_h >> 1;
	this._z_min = Math.max((this._window_w / this._client_w),(this._window_h / this._client_h));
	this._z_max = Math.max(2.0,this._z_min);

	//trace("Bounds are now window: (" + win_w + "," + win_h + "), client: (" + client_w  + "," + client_h + ")");
	return this;
};

Camera.prototype.applyTo = function(node) {
	node.setPosition(this._center_wx - (this._x * this._scale_x),this._center_wy - (this._y * this._scale_y));
	node.setScale(this._scale_x,this._scale_y);
};

Camera.prototype.getWorldX = function(screen_x) {
	return this._x + ((screen_x - this._center_wx) / this._scale_x);
};

Camera.prototype.getWorldY = function(screen_y) {
	return this._y + ((screen_y - this._center_wy) / this._scale_y);
};

Camera.prototype.start = function() {

	// Dragging moves the camera
	var fn_drag_start = function(x,y) {
		if(!this._locked) {
			this._grabbed = true;
			this._grab_x = this.getWorldX(x);
			this._grab_y = this.getWorldY(y);
			x = this._grab_x - this.getWorldX(x);
			y = this._grab_y - this.getWorldY(y);
			this._x += x;
			this._y += y;
			
			// Reset drag delta buffer. NOTE: modify this to add Z-delta.
			this._delta_x = 0;
			this._delta_y = 0;
			this._delta_z = 0;
			for(var i = 0; i < 10; ++i) {
				this._drag_delta_buffer[i] = 0;
			}
		}
	};
	
	var fn_drag_update = function(x,y) {
		if(!this._locked) {
			x = this._grab_x - this.getWorldX(x);
			y = this._grab_y - this.getWorldY(y);
			this._x += x;
			this._y += y;
		}
	};
	
	var fn_drag_end = function(x,y) {
		if(!this._locked) {
			x = this._grab_x - this.getWorldX(x);
			y = this._grab_y - this.getWorldY(y);
			this._x += x;
			this._y += y;
			this._grabbed = false;
			
			// Calculate inertia delta..
			this._delta_x = 0;
			this._delta_y = 0;
			for(var i = 0; i < 10; i += 2) {
				this._delta_x += this._drag_delta_buffer[i];
				this._delta_y += this._drag_delta_buffer[i + 1];
			}
		}
	};
	
	this._dragHandler = g_input.addDragHandler(fn_drag_start,fn_drag_update,fn_drag_end,this);
	
	// Mouse wheel handles stepwise zoom in/out
	this._wheelHandler = g_input.addWheelHandler(function(delta) {
		if(!this._locked) {
			if(delta > 0) {
				this.zoomIn(g_input.getX(),g_input.getY());
			} else {
				this.zoomOut(g_input.getX(),g_input.getY());
			}
		}
	},this);
	
	return this;
};

Camera.prototype.stop = function() {
	g_input.removeDragHandler(this._dragHandler);
	g_input.removeWheelHandler(this._wheelHandler);
	g_input.removePinchHandler(this._pinchHandler);
	this._dragHandler = null;
	this._wheelHandler = null;
	this._pinchHandler = null;
	return this;
};

/**
 */
Camera.prototype.getX = function() {
	return this._x;
};

/**
 */
Camera.prototype.getY = function() {
	return this._y;
};

/**
 */
Camera.prototype.getZ = function() {
	return this._z;
};

Camera.prototype.setZoom = function(value) {
	this._z = value;
	this.update();
};

/**
 * Set zooming factor
 */
Camera.prototype.setPosition = function(x,y,z) {
	this._x = x;
	this._y = y;
	this._z = z;
	return this;
	
};

/**
 * Immediately center camera
 */
Camera.prototype.center = function() {
	this._x = this._client_w >> 1;
	this._y = this._client_h >> 1;
	this._z = 1;
	return this;
};

/**
 * Perform smooth interpolation from current position and zoom level
 * to new position and zoom level.
 * 
 * NOTE: unfinished code.
 * 
 * @param x
 * @param y
 * @param z
 * @param time
 */
Camera.prototype.moveTo = function(x,y,z,time) {

	// Verify coordinate bounds
	if(z < this._z_min) z = this._z_min;
	if(z > this._z_max) z = this._z_max;
	var ww = this._center_wx / z;
	var wh = this._center_wy / z;
	var max_x = this._client_w;
	var max_y = this._client_h;
	if(x - ww < 0) x = ww;
	if(x + ww > max_x) x = max_x - ww;
	if(y - wh < 0) y = wh;
	if(y + wh > max_y) y = max_y - wh;
	
	
	
};

/**
 * Zoom in on point x,y
 *
 */
Camera.prototype.zoomIn = function(x,y) {

	if(x === undefined) x = this._center_wx;
	if(y === undefined) y = this._center_wy;
	
	if(this._z < this._z_max) {
		var cz = this._z;
		cz *= this._z_step_up;
		if(Math.abs(cz - 1.0) < 0.15) cz = 1.0;
		if(cz < this._z_min) cz = this._z_min;
		if(cz > this._z_max) cz = this._z_max;
		this._z = cz;
		this.update();
		this._x = (this._x + this.getWorldX(x)) * 0.5;
		this._y = (this._y + this.getWorldY(y)) * 0.5;
	}
};

/**
 * Zoom out at point x,y
 */
Camera.prototype.zoomOut = function(x,y) {

	if(x === undefined) x = this._center_wx;
	if(y === undefined) y = this._center_wy;
	
	if(this._z > this._z_min) {
		var cz = this._z;
		cz *= this._z_step_down;
		if(Math.abs(cz - 1.0) < 0.15) cz = 1.0;
		if(cz < this._z_min) cz = this._z_min;
		if(cz > this._z_max) cz = this._z_max;
		this._z = cz;
		this.update();
		this._x = (this._x + this.getWorldX(x)) * 0.5;
		this._y = (this._y + this.getWorldY(y)) * 0.5;
	}
};

/**
 * Camera loop. Runs once every frame.
 */
Camera.prototype.update = function() {

	var sync = g_engine.getTimeSync();
	
	// Re-check camera bounds...
	var cz = this._z;
	if(cz < this._z_min) cz = this._z_min;
	if(cz > this._z_max) cz = this._z_max;
	this._z = cz;
	this._scale_x = cz;
	this._scale_y = cz;

	var ww = this._center_wx / this._scale_x;
	var wh = this._center_wy / this._scale_y;

	var cx = this._x + this._delta_x * sync;
	var cy = this._y + this._delta_y * sync;
	var max_x = this._client_w;
	var max_y = this._client_h;
	if(cx - ww < 0) cx = ww;
	if(cx + ww > max_x) cx = max_x - ww;
	if(cy - wh < 0) cy = wh;
	if(cy + wh > max_y) cy = max_y - wh;
	this._last_x = this._x;
	this._last_y = this._y;
	this._x = cx;
	this._y = cy;

	// Update delta buffer if grabbed
	if(this._grabbed) {
		for(var i = 8; i > 0; i -= 2) {
			this._drag_delta_buffer[i + 0] = this._drag_delta_buffer[i - 2];
			this._drag_delta_buffer[i + 1] = this._drag_delta_buffer[i - 1];
		}
		this._drag_delta_buffer[0] = this._last_x - this._x;
		this._drag_delta_buffer[1] = this._last_y - this._y;
	}
	
};
