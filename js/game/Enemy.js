/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 *
 * Enemy.js
 *
 * Base class for enemies.
 *
 * creation date: 12-06-2012
 * 
 */

"use strict";

/**
 * Enemy base class
 *
 */
function Enemy() {
	Entity.call(this);

	this._scoreValue = 0;

	this._position_x = 0;
	this._position_y = 0;
	this._speed = 50;	
	this._waypoints = [];
	this._waypoint_current = 0;
	this._waypoint_progress = 0; // adjusted to 0..1 for subnormal precision
	this._interrupt_counter = 0;
	
	/**
	 * Waypoint interrupt handler.
	 * 
	 * NOTE: handler will NOT fire even if there is an interrupt
	 * placed on the FIRST waypoint. Every other waypoint after
	 * that will trigger it, however.
	 */
	this.onWaypointInterrupt = function(x,y,interrupt_id) {
		trace("Waypoint interrupt " + interrupt_id + " reached at " + x + "," + y);
	};
	
};

Enemy.inherits(Entity);

Enemy.prototype.setPosition = function(x,y) {
	this._position_x = x || 0;
	this._position_y = y || 0;
	return this;
};

Enemy.prototype.moveToFirstWaypoint = function() {
	this._position_x = this._waypoints[0].x;
	this._position_y = this._waypoints[0].y;
	this._waypoint_current = 0;
	this._waypoint_progress = 0;
	return this;
};

Enemy.prototype.getX = function() {
	return this._position_x;
};

Enemy.prototype.getY = function() {
	return this._position_y;
};

Enemy.prototype.clearWaypoints = function() {
	this._waypoints.splice(0,this._waypoints.length);
	this._waypoint_current = 0;
	this._waypoint_progress = 0;
	this._interrupt_counter = 0;
	return this;
};

Enemy.prototype.addWaypoint = function(x,y,interrupt) {
	this._waypoints.push({ x: +x, y: +y, interrupt: (interrupt ? ++this._interrupt_counter : 0)});
	return this;
};

Enemy.prototype.setCurrentWaypoint = function(num) {
	this._waypoint_current = +num;
	this._waypoint_progress = 0;
	return this;
};

Enemy.prototype.getCurrentWaypoint = function(){
	return this._waypoint_current;
};

Enemy.prototype.getNextWaypointX = function() {
	if(this._waypoint_current < this._waypoints.length - 1) {
		return this._waypoints[this._waypoint_current + 1].x;	
	}
	return this._waypoints[this._waypoint_current].x;
};

Enemy.prototype.getNextWaypointY = function() {
	if(this._waypoint_current < this._waypoints.length - 1) {
		return this._waypoints[this._waypoint_current + 1].y;	
	}
	return this._waypoints[this._waypoint_current].y;
};

Enemy.prototype.setWaypointProgress = function(percent) {
	this._waypoint_progress = +percent;
	return this;
};

Enemy.prototype.hasWaypoints = function() {
	return this._waypoint_current < this._waypoints.length - 1;
};

Enemy.prototype.setSpeed = function(speed) {
	this._speed = +speed;
	return this;
};

Enemy.prototype.getSpeed = function(speed) {
	return this._speed;
};

/**
 * Advance toward the next waypoint
 *
 * @param sync engine sync value
 * @param sprite sprite to apply coordinates to (optional)
 * 
 */
Enemy.prototype.moveForward = function(sync,sprite) {
	
	var wp_array = this._waypoints;
	var num_waypoints = wp_array.length;
	var current = this._waypoint_current;
	var progress = this._waypoint_progress;
	var distance = this._speed * sync;
	var next_distance = 0;
	var lerp = Ease.lerp;
	
	if(num_waypoints === 0) {
		return this;
	}
	
	if(current >= num_waypoints - 1) {
		this._position_x = wp_array[num_waypoints - 1].x;
		this._position_y = wp_array[num_waypoints - 1].y;
		progress = 0;
		current = num_waypoints - 1;
	} else {
		
		while(num_waypoints > current + 1) {
			
			// Figure out length of the current node delta
			var v0 = wp_array[current];
			var v1 = wp_array[current + 1];
			var dx = v1.x - v0.x;
			var dy = v1.y - v0.y;
			
			var l = Math.sqrt((dx * dx) + (dy * dy));
			if(next_distance) {
				progress += next_distance / l;
			} else {
				progress += distance / l;
			}
			
			if(progress > 1) {
				// We're over 100%; we need to convert progress back into actual distance
				// and figure out how far we've come on the next iteration...
				next_distance = (progress * l) - l;
				progress = 0;
				++current;
				var c = wp_array[current];
				if(c.interrupt) {
					// NOTE: interrupt will NOT fire on first waypoint.
					this.onWaypointInterrupt.call(this,c.x,c.y,c.interrupt);
				}
			} else {
				break;
			}
		}
		
		if(num_waypoints > current + 1) {
			this._position_x = lerp(progress,wp_array[current].x,wp_array[current + 1].x);
			this._position_y = lerp(progress,wp_array[current].y,wp_array[current + 1].y);
		} else {
			this._position_x = wp_array[current].x;
			this._position_y = wp_array[current].y;
		}
	}
	
	this._waypoint_current = current;
	this._waypoint_progress = progress;
	
	if(sprite) {
		sprite.setPosition(this._position_x,this._position_y);
	}
	
	return this;
};

Enemy.prototype.occupyTiles = function(gx, gy, callback){
	var x = this.getX(),
		y = this.getY(),
		lx = x - this._sprite.getHeight() / 2,
		mx = x + this._sprite.getHeight() / 2,
		ly = y - this._sprite.getHeight() / 2,
		my = y + this._sprite.getHeight() / 2;
	lx = lx / gx | 0;
	mx = mx / gx | 0;
	ly = ly / gy | 0;
	my = my / gy | 0;
	var xs = [], ys = [];
	for(var i = lx; i <= mx; i++){
		xs.push(i);
	}
	for(var i = ly; i <= my; i++){
		ys.push(i);
	}
	xs.forEach(function(ex){
		ys.forEach(function(ey){
			callback(ex, ey);
		});
	});
};

/**
 * Debug drawing routine for world-space display of waypoints
 * Remebmer to un-rotate the matrix first.
 *
 * @param context 2d drawing context
 * @param x x offset (i.e. x position of sprite, since we're drawing in sprite-space)
 * @param y y offset (i.e. y position of sprite, since we're drawing in sprite-space)
 * @param iscale inverted scaling factor (i.e. 1.0 / sprite.getScale())
 */
Enemy.prototype.debug_drawWaypoints = function(context,x,y,iscale) {
	
	var wp = this._waypoints;
	
	if(wp.length) {
	
		context.strokeStyle = "rgba(32,255,64,1)";
		context.beginPath();
		
		context.moveTo((wp[0].x - x) * iscale,(wp[0].y - y) * iscale);
		for(var i = 1; i < wp.length; ++i) {
			context.lineTo((wp[i].x - x) * iscale,(wp[i].y - y) * iscale);
		}
		
		context.stroke();
		
	}
};

/**
 * 
 */
Enemy.prototype.setScoreValue = function(value) {
	this._scoreValue = +value;
	return this;
};

/**
 * 
 */
Enemy.prototype.getScoreValue = function() {
	return this._scoreValue;
};

