/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * Cannon.js
 *
 * Friendly cannon entity handling code.
 *
 * creation date: 20-06-2012
 */

"use strict";

function Cannon() {

	Friendly.call(this);

	this._animation = g_assets.getAnimation('cannon-anim');
	this._animation.setLooping(false);
	this._disabled_image = g_assets.getBitmap('cannon-disabled');
	
	this._sprite = new Sprite(this._animation);
	
	this._sound_shoot = g_assets.getSound('playerCannonFire');
	
	if(g_config.global.debug) {
		var that = this;	
		var debug_draw = function(canvas,context,matrix) {
			Sprite.prototype.draw.call(this,canvas,context,matrix);
			
			var scale = this.getScale();
			var iscale = 1.0 / scale;
			
			context.beginPath();
			context.strokeStyle = "rgba(128,255,128,1)";
			context.arc(0, 0, that.getAttackRadius() * iscale, 0, Math.PI * 2, true); 
			context.stroke();
			
			if(that._currentTarget) {
				var x = ((that._currentTarget.x - this._x) * iscale) - (that._muzzle_offset_x * scale);
				var y = ((that._currentTarget.y - this._y) * iscale) - (that._muzzle_offset_y * scale);
				context.strokeStyle = "rgba(255,64,64,1)";
				context.beginPath();
				context.moveTo(0,0);
				context.lineTo(x,y);
				context.stroke();
				context.beginPath();
				context.arc(x,y,that.getAccuracy() * iscale,0,Math.PI * 2,true);
				context.stroke();
			}
			
		};
		
		this._sprite.draw = debug_draw;
	}

	this._sprite_offset_x = -25;
	this._sprite_offset_y = 0;
	
	this._grid_x = 0;
	this._grid_y = 0;
	this._real_x = 0;
	this._real_y = 0;

	this._muzzle_offset_x = g_config.cannons.basic.muzzleOffset.x;
	this._muzzle_offset_y = g_config.cannons.basic.muzzleOffset.x;
	
	this._flightTime = 0;
	this._speed = g_config.cannons.basic.speed;
	this._loadingTimer = new Timer();
	this._currentTarget = null;

	// Get damage values
	this.setAccuracy(g_config.cannons.basic.accuracy);
	this.setShotDamage(g_config.cannons.basic.damage.value);
	this.setShotDamageVariance(g_config.cannons.basic.damage.variance);
	this.setAttackRadius(g_config.cannons.basic.range);
};

Cannon.inherits(Friendly);

Cannon.prototype.setPosition = function(grid_x,grid_y) {
	var xres = g_game.getGridSizeX();
	var yres = g_game.getGridSizeY();
	
	this._grid_x = grid_x;
	this._grid_y = grid_y;
	this._real_x = grid_x * xres;
	this._real_y = grid_y * yres;
	
	this._sprite.setPosition(this._real_x + this._sprite_offset_x,this._real_y + this._sprite_offset_y);
};


Cannon.prototype.getX = function() {
	return this._real_x;
};

Cannon.prototype.getY = function() {
	return this._real_y;
};

Cannon.prototype.getGridX = function() {
	return this._grid_x;
};

Cannon.prototype.getGridY = function() {
	return this._grid_y;
};

Cannon.prototype.getSprite = function() {
	return this._sprite;
};

Cannon.prototype.getFlightTime = function() {
	return this._flightTime;
};

/**
 * Override the setActive function in Actor.js
 * @param b_active
 */
Cannon.prototype.setActive = function(b_active) {
	this._active = b_active == true;
	if(this._active) {
		this._sprite.setImageSource(this._animation);
	} else {
		this._sprite.setImageSource(this._disabled_image);
	}
};

Cannon.prototype.isReady = function() {
	return this.isActive() && this._loadingTimer.isComplete();
};

/**
 * Shooting function. 
 *
 * @param x X coordinate of target (in pixels)
 * @param y Y coordinate of target (in pixels)
 * @returns true on success, false on failure
 */
Cannon.prototype.shootAt = function(x,y) {

	var dx = x - this._real_x;
	var dy = y - this._real_y;
	var dr = this.getAttackRadius();
	
	if(this._loadingTimer.isComplete() && ((dx * dx) + (dy * dy)) <= (dr * dr)) {
		
		this._currentTarget = new vec2(x,y);
		
		var bullet = g_game.getBullet();
		var v = this.getImpactCoordinates(x,y);
		var from_x = this._real_x + (this._muzzle_offset_x * this._sprite.getScale());
		var from_y = this._real_y + (this._muzzle_offset_y * this._sprite.getScale());

		bullet.shoot(this,from_x,from_y,v.x,v.y,this._speed);
		this._loadingTimer.setTarget(bullet.getFlightTime()).reset().start();
		this._animation.setFrame(0);
		this._animation.reset().play();
		
		this._sound_shoot.play();
		
		return true;
	}
	
	return false;
};

Cannon.prototype.update = function() {
	var sync = g_engine.getTimeSync();
	this._loadingTimer.update(sync);
	this._animation.update(sync);

	if(!this._animation.isPlaying()) {
		this._animation.setFrame(0);
	}
	if(this._loadingTimer.isComplete()) this._currentTarget = null;
};
