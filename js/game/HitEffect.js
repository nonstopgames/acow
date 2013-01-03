/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * HitEffect.js
 * 
 * Code for managing the various hit effects used in the game.
 *
 * creation date: 28-06-2012
 */

"use strict";

/**
 * Simple hit effect animation. Runs water splashes and explosions.
 *
 */
function HitEffect(type) {
	
	switch(type) {
		case HitEffect.types.explosion:
			this._animation = g_assets.getAnimation('hit-explosion');
		break;
		case HitEffect.types.splash:
			this._animation = g_assets.getAnimation('hit-splash');
		break;
		case HitEffect.types.groundHit:
			this._animation = g_assets.getAnimation('hit-ground');
		break;
		case HitEffect.types.blood:
			this._animation = g_assets.getAnimation('blood');
		break;
		default:
			throw new Error("No such hit effect " + type);
		break;
	}

	this._tm_duration_orig = this._animation.getDuration();
	this._tm_duration = this._tm_duration_orig;
	this._animation.setLooping(false);
	this._animation.play();
	
	if(type === HitEffect.types.explosion || type === HitEffect.types.blood) {
		this._sprite = new SceneNode();
		
		var sprite = new Sprite(this._animation);
		sprite.setOffset(0,-this._sprite.getHeight() * 0.5);
		
		var light = this._light = new Sprite(g_assets.getBitmap('hit-explosion-light'));
		light.setOpacity(0.25);
		light.setScale(0);
		light.setOffset(0,this._sprite.getHeight() * 0.5);
		light.setDrawMode(Sprite.DrawMode.ADDITIVE);
		this._sprite.addChild(light);
		this._sprite.addChild(sprite);
	} else {
		this._sprite = new Sprite(this._animation);
		this._sprite.setOffset(0,-this._sprite.getHeight() * 0.5);
	}
	
	this._tm = 0;

	this._scale_min = 0.5;
	this._scale_max = 1.5;
	this._offset = 0;
	
	this._active = false;
	
};

/**
 * Type definitions
 */
HitEffect.types = (function() {

	var idx = 0;
	return {
		explosion: idx++,
		splash: idx++,
		groundHit: idx++,
		blood: idx++
	};
	
})();

/**
 * Test if animation is ready to be re-used
 */
HitEffect.prototype.isReady = function() {
	return !this._active;
};

/**
 * Get direct reference to sprite
 */
HitEffect.prototype.getSprite = function() {
	return this._sprite;
};

/**
 * Create hit effect animation at x,y coordinates
 */
HitEffect.prototype.spawn = function(x,y) {
	if(!this._active) {
		this._active = true;
		
		this._offset = (Math.random() * 0.5);
		this._tm_duration = this._tm_duration_orig + this._offset;
		
		this._tm = 0;
		this._animation.setFrame(0);
		this._animation.setTimeElapsed(0);
		this._animation.setDuration(this._tm_duration);
		this._animation.play();
		
		this._sprite.setOpacity(1.0);
		this._sprite.setScale(this._scale_min);
		this._sprite.setPosition(x,y);
	}
};

/**
 * Update animation
 */
HitEffect.prototype.update = function(sync) {
	if(this._active) {
		this._tm += sync;
		this._animation.update(sync);

		var bias = this._tm / this._tm_duration;
		
		this._sprite.setOpacity(Ease.sin_lerp(bias,1,0));
		this._sprite.setScale(Ease.lerp(bias,this._scale_min,this._scale_max + this._offset));
		
		if(this._light) {
			this._light.setScale(Ease.parabola(bias,0.1,1.5));
		}

		if(this._tm >= this._tm_duration) {
			this._sprite.removeFromParent();
			this._active = false;
		}
	}
};
