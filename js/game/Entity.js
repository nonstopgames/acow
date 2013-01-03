/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * Entity.js
 *
 * Base class for friendlies and enemies.
 * Provides common functionality for any
 * interactive element in the game.
 *
 * 
 * creation date: 12-06-2012
 * 
 */

"use strict";

function Entity() {
	Actor.call(this);

	// Simple game-related stuff
	this._alive = true;         //
	this._hitpoints = 0;        // Health
	this._damage = 0;           // Damage base
	this._damageVariance = 0;   // Random damage variance
	this._accuracy = 0;         // Accuracy, or rather, non-accuracy (shot spread) value
	this._attack_radius = 0;	// Attack radius
	
	// Hitbox
	this._hit_r = 0;            // Hit circle radius
	this._hit_w = 0;            // Hit box width
	this._hit_h = 0;            // Hit box height
	this._hit_xoffs = 0;        // Hit box/circle offset from X coordinate
	this._hit_yoffs = 0;        // Hit box/circle offset from Y coordinate
	this._useHitRect = true;    // If false, we use circle detection instead of box detection
	
};

// Inherit the Actor class to be eligible for inclusion in the Engine...
Entity.inherits(Actor);

/**
 * Set alive state. Usage of this state is left up to the coder..
 *
 * @param b a boolean value
 * @returns a reference to self
 */
Entity.prototype.setAlive = function(b) {
	this._alive = (b == true);
	return this;
};

/**
 * See status of alive variable
 */
Entity.prototype.isAlive = function() {
	return this._alive;
};

/**
 * Set the current amount of hitpoints
 *
 * @param hp a value
 * @returns a reference to self
 */
Entity.prototype.setHitpoints = function(hp) {
	this._hitpoints = hp;
	return this;
};

/**
 * Get the current amount of hitpoints
 *
 * @returns a number value
 */
Entity.prototype.getHitpoints = function() {
	return this._hitpoints;
};

/**
 * Run this function to set the Entity to use box detection.
 * Box detection is slightly slower than circle detection.
 * Box detection is the default.
 *
 * @returns a reference to self
 */
Entity.prototype.useHitRect = function() {
	this._useHitRect = true;
	return this;
};

/**
 * Run this function to set the Entity to use hit circle detection.
 * Circle detection is slightly faster than box detection.
 * The default is to use box detection.
 *
 * @returns a reference to self
 */
Entity.prototype.useHitCircle = function() {
	this._useHitRect = false;
	return this;
};

/**
 * Set the size of the hit box
 *
 * @returns a reference to self
 */
Entity.prototype.setHitRectSize = function(w,h) {
	this._hit_w = Math.abs(w) || 0;
	this._hit_h = Math.abs(h) || 0;
	return this;
};

/**
 * Set the radius of the hit circle.
 *
 * @returns a reference to self
 */
Entity.prototype.setHitCircleRadius = function(r) {
	this._hit_r = Math.abs(r) || 0;
	return this;
};

/**
 * Set hitbox offset. This is so that you can define the
 * hitbox to be a certain size box around a point, instead
 * of onwards from a point, and save a lot of trouble..
 *
 * Works a bit different for hit circles - this moves the
 * circle's center away from the object's center; perfect
 * for testing for hits on larger boss enemies' gun turrets
 * or whatever.
 *
 * @param dx X offset value
 * @param dy Y offset value
 * @returns a reference to self
 */
Entity.prototype.setHitOffset = function(dx,dy) {
	this._hit_xoffs = dx || 0;
	this._hit_yoffs = dy || 0;
	return this;
};

/**
 * Perform hit testing - Entity is at ex,ey and gets hit
 * at hit_x,hit_y, with a hit radius of hit_r.
 *
 * Hits always use a circle. For box testing, a box width of
 * (4/3) * r is assumed, and the box of the hit point is centered
 * on hit_x, hit_y.
 *
 * @param ex X coordinate of entity
 * @param ey Y coordinate of entity
 * @param hit_x X coordinate of hit
 * @param hit_y Y coordinate of hit
 * @param hit_r Radius of hit circle/box
 *
 * @returns true if hit, false if missed.
 */
Entity.prototype.testHit = function(ex,ey,hit_x,hit_y,hit_r) {
	
	if(this._useHitRect) {
		
		// Perform hit box detection
		var hit_w, hit_h;
		hit_w = hit_h = hit_r * (4/3) * 0.5;
		
		var x0 = ex + this._hit_xoffs;
		var x1 = x0 + this._hit_w;
		var y0 = ey + this._hit_yoffs;
		var y1 = y0 + this._hit_h;


		var result = (x0 <= (hit_x + hit_w) && x1 >= (hit_x - hit_w) &&
		              y0 <= (hit_y + hit_h) && y1 >= (hit_y - hit_h)  );

		return result;
		
	} else {
		// Perform hit circle detection

		var dx = (ex + this._hit_xoffs) - hit_x;
		var dy = (ey + this._hit_yoffs) - hit_y;
		var dr = hit_r + this._hit_r;
		
		return (dx * dx) + (dy * dy) < (dr * dr);
		
	}

	return false;
	
};

/**
 * Get the base value for shot damage.
 *
 * @returns a floating-point value
 */
Entity.prototype.getShotDamage = function() {
	return this._damage;
};

/**
 * Set the base value for shot damage. Actual damage per-shot is
 * base shot damage + a random value based on shot damage variance.
 *
 * @param damage a floating-point value
 * @returns a reference to self
 */
Entity.prototype.setShotDamage = function(damage) {
	this._damage = damage;
	return this;
};

/**
 * Get the shot damage variance value. Defaults to 0.
 *
 * @returns a floating-point value
 */
Entity.prototype.getShotDamageVariance = function() {
	return this._damageVariance;
};

/**
 * Set the shot damage variance value. This is the upper limit of a
 * positive or negative factor which is added to the actual shot damage
 * for any given bullet.
 *
 * @param damage a floating-point value
 * @returns a reference to self
 */
Entity.prototype.setShotDamageVariance = function(damage) {
	this._damageVariance = damage;
	return this;
};

/**
 * Return a single-time damage value, calculated as damage + random(-damageVariance,damageVariance)
 *
 * @returns a floating-point value
 */
Entity.prototype.getDamage = function() {
	return this._damage + ((Math.random() * this._damageVariance * 2) - this._damageVariance);
};

/**
 * Set shot accuracy value. This is used when calculating hit coordinates.
 *
 * @param a a floating-point value
 * @returns a reference to self
 */
Entity.prototype.setAccuracy = function(a) {
	this._accuracy = +a;
	return this;
};

/**
 * Get shot accuracy value.
 *
 * @returns a floating-point value
 */
Entity.prototype.getAccuracy = function() {
	return this._accuracy;
};

/**
 * Get point-of-impact for this Entity for a shot that is fired at aim_x,aim_y
 *
 * @param aim_x a floating-point vlaue
 * @param aim_y a floating-point value
 * @returns a vec2 object
 */
Entity.prototype.getImpactCoordinates = function(aim_x,aim_y) {
	
	var v = new vec2(Math.random() - 0.5,Math.random() - 0.5).setLength(Math.random() * this._accuracy);
	v.x += aim_x;
	v.y += aim_y;
	return v;
	
};

/**
 * Set the attack radius parameter - on Entity-level, this affects nothing,
 * and must be handled manually by subclasses.
 *
 * @param radius a value in world points
 */
Entity.prototype.setAttackRadius = function(radius) {
	this._attack_radius = +radius;
	return this;
};

/**
 * Get the attack radius value.
 */
Entity.prototype.getAttackRadius = function() {
	return this._attack_radius;
};

/**
 * Placeholder for a proper hit processing routine
 */
Entity.prototype.processHit = function(bullet, real_x, real_y) {
	throw new Error("This entity does not know how to process a hit at " + real_x + "," + real_y + "!");
};

/**
 * Process hit from a bullet. Removes the bullet's damage amount from
 * available health, then tests if health went to 0. If so, calls the
 * destroy function.
 *
 * @returns a reference to self
 */
Entity.prototype.gotHitByBullet = function(bullet) {

	this.setHitpoints(this.getHitpoints() - bullet.getDamage());
	if(this.getHitpoints() <= 0) {
		this.destroy();
		this.setAlive(false);
	}
	
	return this;
};

/**
 * Destroy the entity.
 *
 * Implementing this is left to extending classes.
 */
Entity.prototype.destroy = function() {
	throw new Error("Destroy entity!");
};
