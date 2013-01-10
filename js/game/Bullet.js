/**
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * Bullet.js
 *
 * Bullet handling code.
 *
 * creation date: 22-06-2012
 */

"use strict";

/**
 *
 *
 */
function Bullet() {

	Actor.call(this);

	if(Bullet.viewVector === null) {
		Bullet.viewVector = new vec2(
			g_config.global.cannonballViewOffset.x,
			g_config.global.cannonballViewOffset.y
		);
		Bullet.viewVector.normalize();
	}
	
	this._sprite = new Sprite(g_assets.getBitmap('cannonball'));
	this._shadow = new Sprite(g_assets.getBitmap('cannonball-shadow'));
	this._owner = null;
	this._sprite.setOffset(0,0);
	this._shadow.setOffset(0,0);
	
	this._flightTime = 0;             // Total flight time
	this._flightTimeCur = 0;          // Currently elapsed flight time

	this._from_x = 0;
	this._from_y = 0;
	this._to_x = 0;
	this._to_y = 0;
	this._current_x = 0;
	this._current_y = 0;

	this._scale_min = g_config.global.cannonballs.scaleMin;
	this._scale_max = g_config.global.cannonballs.scaleMax;

	this._damage = 0;

	this.setActive(false);
	
};

Bullet.inherits(Actor);

// Statics
Bullet.viewVector = null;


/**
 * Get current X coordinate
 *
 */
Bullet.prototype.getX = function() {
	return this._current_x;
};

/**
 * Get current Y coordinate
 * 
 */
Bullet.prototype.getY = function() {
	return this._current_y;
};

/**
 * Get approximation of radius of bullet in pixels..
 */
Bullet.prototype.getRadius = function() {
	return this._sprite.getWidth() * 0.75;
};

/**
 * Get damage value
 */
Bullet.prototype.getDamage = function() {
	return this._damage;
};

/**
 * Return the flight time of this particular cannonball.
 * Flight time is adjusted as a funciton of distance.
 *
 * @returns flight time, in seconds.
 */
Bullet.prototype.getFlightTime = function() {
	return this._flightTime;
};


/**
 * Called by Cannon or Ship to set a Bullet in motion.
 *
 * @param owner Cannon or Ship reference
 * @param from_x start X coordinate
 * @param from_y start Y coordinate
 * @param to_x end X coordinate
 * @param to_y end Y coordinate
 * @param speed traverse speed in pixels per second
 * @returns a reference to self
 */
Bullet.prototype.shoot = function(owner, from_x,from_y,to_x,to_y, speed) {

	// Insurance..
	if(!(owner instanceof Entity)) {
		throw new Error("Only Entities can shoot Bullets!");
	}
	
	this._owner = owner;
	this._from_x = from_x;
	this._from_y = from_y;
	this._to_x = to_x;
	this._to_y = to_y;

	var dx = to_x - from_x;
	var dy = to_y - from_y;
	var d = Math.sqrt(dx * dx + dy * dy);
	
	this._flightTime = d / speed;
	this._flightTimeCur = 0;
	this._altitude = d / (speed * 0.0125);

	// Get one-time damage value (defined in Entity.js)
	this._damage = owner.getDamage();
	
	this.setActive(true);

	g_game.getBulletLayer().addChild(this._sprite);
	g_game.getShadowLayer().addChild(this._shadow);
	
	this._sprite.setPosition(from_x,from_y);
	this._shadow.setPosition(from_x,from_y);
	
	return this;
};

/**
 * Updates cannonball flight..
 */
Bullet.prototype.update = function(sync) {
	
	this._flightTimeCur += sync;
	if(this._flightTimeCur >= this._flightTime) {

		this._sprite.removeFromParent();
		this._shadow.removeFromParent();
		g_game.bulletHit(this,this._owner,this._to_x,this._to_y);
		this.setActive(false);
		
	} else {
		
		var bias = this._flightTimeCur / this._flightTime;
		var a = this._altitude;
		
		var x = Ease.lerp(bias,this._from_x,this._to_x) + Ease.parabola(bias,0,Bullet.viewVector.x * a);
		var y = Ease.lerp(bias,this._from_y,this._to_y) + Ease.parabola(bias,0,Bullet.viewVector.y * a);
		var s = Ease.parabola(bias,this._scale_min,this._scale_max);
		
		this._sprite.setScale(s);
		this._sprite.setPosition(x,y);

		// Update shadow
		x = Ease.lerp(bias,this._from_x,this._to_x) + Ease.parabola(bias,0,Bullet.viewVector.x * a * -0.2);
		y = Ease.lerp(bias,this._from_y,this._to_y) + Ease.parabola(bias,0,Bullet.viewVector.y * a * -0.2);
		s = this._scale_min + (Ease.parabola(bias,this._scale_max - this._scale_min) * 0.5,0);
		a = Ease.parabola(bias,1,0.1);

		this._shadow.setScale(s);
		this._shadow.setOpacity(a);
		this._shadow.setPosition(x,y);
		
	}
	
};


