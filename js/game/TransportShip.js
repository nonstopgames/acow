/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * TransportShip.js
 *
 * A variant of the Ship, this one moves toward some
 * point of the shore, pauses for a bit, spawns land
 * troops, then departs.
 * 
 * creation date: 06-08-2012
 */

"use strict";

function TransportShip() {
	Enemy.call(this);
	
	// Load up both up- and downfacing animations. We need all of them, since
	// the ship objects are re-used throughout the game.
	this._anim_up_idle = g_assets.getAnimation('enemy-transport-up-idle');
	this._anim_up_moving = g_assets.getAnimation('enemy-transport-up-moving');
	this._anim_up_landing = g_assets.getAnimation('enemy-transport-up-landing');
	this._anim_up_departing = g_assets.getAnimation('enemy-transport-up-departing');
	
	this._anim_down_idle = g_assets.getAnimation('enemy-transport-down-idle');
	this._anim_down_moving = g_assets.getAnimation('enemy-transport-down-moving');
	this._anim_down_landing = g_assets.getAnimation('enemy-transport-down-landing');
	this._anim_down_departing = g_assets.getAnimation('enemy-transport-down-departing');

	this._anim_up_moving.setLooping(true).play();
	this._anim_up_idle.setLooping(true).play();
	this._anim_down_moving.setLooping(true).play();
	this._anim_down_idle.setLooping(true).play();

	this._sprite = new Sprite(this._anim_up_moving);
	
	// Debug draw hack
	if(g_config.global.debug) {
		var that = this;	
		var debug_draw = function(canvas,context,matrix) {
			Sprite.prototype.draw.call(this,canvas,context,matrix);
			
			// Undo rotation for correct display of lines
			matrix.rotate(this.getRotation() * DEG_TO_RAD);
			matrix.applyTo(context);
			
			var scale = 1.0 / this.getScale();
			
			context.beginPath();
			context.strokeStyle = "rgba(255,255,255,1)";
			context.arc(0, 0, that.getAttackRadius() * scale, 0, Math.PI * 2, true);
			context.stroke();
			
			if(that._currentTarget) {
				var tx = that._currentTarget.x - this._x;
				var ty = that._currentTarget.y - this._y;
				context.strokeStyle = "rgba(255,64,64,1)";
				context.beginPath();
				context.moveTo(0,0);
				context.lineTo(tx * scale,ty * scale);
				context.stroke();
			}
			
			that.debug_drawWaypoints(context,this._x,this._y,scale);
			
		};
		
		this._sprite.draw = debug_draw;
	}
	
	this._sprite.setScale(g_config.enemies.transport.scale);
	this._sprite.setOffset(0,0);
	
	// Set hit rectangle size
	this.setHitRectSize(this._sprite.getWidth(),this._sprite.getHeight());
	this.setHitOffset(-this._sprite.getWidth() * 0.5,-this._sprite.getHeight() * 0.5);

	this._sound_destroy = g_assets.getSound('destroyShip');
	
	this._direction = 0;
	this._unloading = false;		// If true, we're in 'unloading mode', i.e. spawning troops onto the shore
	this._landing_seq = 0;			// Landing sequence counter - when 0, extend planks, when 1, idle. when 2, retract planks.

	this._currentTarget = null;
	
	this._unload_timer = new Timer();
	this._unload_timer.setTarget(g_config.enemies.transport.unloadDelay);
	this._num_soldiers = 0;         // Number of carried soldiers
	
	this._unload_offset_x = g_config.enemies.transport.unloadOffset.x;
	this._unload_offset_y = g_config.enemies.transport.unloadOffset.y;
	
	this.setScoreValue(g_config.enemies.transport.score);
	this.setHitpoints(g_config.enemies.transport.health);
	this.setAccuracy(g_config.enemies.transport.accuracy);
	this.setShotDamage(g_config.enemies.transport.damage.value);
	this.setAttackRadius(g_config.enemies.transport.range);
	
	this._score_per_soldier = g_config.enemies.transport.scorePerSoldier;

	this.onWaypointInterrupt = function(x,y,interrupt_id) {
		//trace("TransportShip: Waypoint interrupt " + interrupt_id + " reached at " + x + "," + y);
		this.startLanding();
	};
	
	this.setActive(false);
};
TransportShip.inherits(Enemy);

TransportShip.prototype.getSprite = function() {
	return this._sprite;
};

TransportShip.prototype.spawn = function() {
	
	// Reset params
	this.setScoreValue(g_config.enemies.transport.score);
	this.setHitpoints(g_config.enemies.transport.health);
	this.setAccuracy(g_config.enemies.transport.accuracy);
	this.setShotDamage(g_config.enemies.transport.damage);
	this.setSpeed(Math.rand(g_config.enemies.transport.speed.min, g_config.enemies.transport.speed.max));
	this._num_soldiers = Math.rand(g_config.enemies.transport.soldierCapacity.min, g_config.enemies.transport.soldierCapacity.max);
	this._unloading = false;
	
	var sxoffs = g_config.enemies.transport.shoreOffset.x;
	var syoffs = g_config.enemies.transport.shoreOffset.y;
	
	var gsizex = g_game.getGridSizeX();
	var gsizey = g_game.getGridSizeY();
	
	var water_min_gx = g_game.getMap().getWaterVerticalMin() + 1;
	var water_max_gx = g_game.getMap().getWaterVerticalMax();

	var gx  = Math.rand(water_min_gx,water_max_gx);

	this.clearWaypoints();
	
	var landing = g_game.getMap().findAvailableLandingZone();
	
	// Decide whether to build a path from up to down or from down to up
	if(Math.random() >= 0.5) {
		
		var gy0 = g_game.getLevelHeight() + (((this._sprite.getHeight() / gsizey) + 1) | 0);
		var gy1 = -(((this._sprite.getHeight() / gsizey) + 1) | 0);
		
		this._direction = 0;
		this._sprite.setImageSource(this._anim_up_moving);

		this.addWaypoint(gx * gsizex + (gsizex * 0.5),gy0 * gsizey + (gsizey * 0.5))
		    .addWaypoint((landing.x + 1) * gsizex + (gsizex * 0.5) + sxoffs,(landing.y + 3) * gsizey + (gsizey * 0.5) + syoffs)
		    .addWaypoint(landing.x * gsizex + (gsizex * 0.5) + sxoffs,landing.y * gsizey + (gsizey * 0.5) + syoffs,true)
		    .addWaypoint((landing.x + 1) * gsizex + (gsizex * 0.5) + sxoffs,(landing.y - 3) * gsizey + (gsizey * 0.5) + syoffs)
		    .addWaypoint(gx * gsizex + (gsizex * 0.5),gy1 * gsizey + (gsizey * 0.5));
		
	} else {
		
		var gy0 = -(((this._sprite.getHeight() / gsizey) + 1) | 0);
		var gy1 = g_game.getLevelHeight() + (((this._sprite.getHeight() / gsizey) + 1) | 0);
		
		this._direction = 1;
		this._sprite.setImageSource(this._anim_down_moving);
		
		this.addWaypoint(gx * gsizex + (gsizex * 0.5),gy0 * gsizey + (gsizey * 0.5))
	        .addWaypoint((landing.x + 1) * gsizex + (gsizex * 0.5) + sxoffs,(landing.y - 3) * gsizey + (gsizey * 0.5) + syoffs)    
		    .addWaypoint(landing.x * gsizex + (gsizex * 0.5) + sxoffs,landing.y * gsizey + (gsizey * 0.5) + syoffs,true)
	        .addWaypoint((landing.x + 1) * gsizex + (gsizex * 0.5) + sxoffs,(landing.y + 3) * gsizey + (gsizey * 0.5) + syoffs)
	        .addWaypoint(gx * gsizex + (gsizex * 0.5),gy1 * gsizey + (gsizey * 0.5));

	}
	
	this.moveToFirstWaypoint();
	this.setActive(true);
	this.update(0);
	
};

TransportShip.prototype.startLanding = function() {
	this._unloading = true;	// For now we only do one delivery run, and can ignore checking the interrupt id
	this._landing_seq = 0;
	this._anim_down_departing.stop().reset().play();
	this._anim_down_landing.stop().reset().play();
	this._anim_down_idle.stop().reset().play();
	this._anim_up_departing.stop().reset().play();
	this._anim_up_landing.stop().reset().play();
	this._anim_up_idle.stop().reset().play();
	this._sprite.setImageSource(this._direction !== 0 ? this._anim_down_landing : this._anim_up_landing);
	this._sprite.setRotation(0);
	this._unload_timer.stop().reset().start();
};

TransportShip.prototype.endLanding = function() {
	this._landing_seq++;
	if(this._direction) {
		this._sprite.setImageSource(this._anim_down_departing);
		this._anim_down_departing.stop().reset().play();
	} else {
		this._sprite.setImageSource(this._anim_up_departing);
		this._anim_up_departing.stop().reset().play();
	}
};

/**
 * 
 * 
 * 
 * @param sync
 */
TransportShip.prototype.update = function(sync) {
	
	if(this.isActive()) {
		if(this._unloading) {
			this._sprite.setRotation(0);			
			if(this._direction) {
				switch(this._landing_seq) {
					case 0: {
						this._anim_down_landing.update(sync);
						if(this._anim_down_landing.isStopped()) {
							this._sprite.setImageSource(this._anim_down_idle);
							this._landing_seq++;
						}
					} break;
					case 1: {
						this._anim_down_idle.update(sync);
					} break;
					case 2: {
						this._anim_down_departing.update(sync);
						if(this._anim_down_departing.isStopped()) {
							this._sprite.setImageSource(this._anim_down_moving);
							this._landing_seq = 0;
							this._unloading = false;
						}
					} break;
				}
			} else {
				switch(this._landing_seq) {
					case 0: {
						this._anim_up_landing.update(sync);
						if(this._anim_up_landing.isStopped()) {
							this._sprite.setImageSource(this._anim_up_idle);
							this._landing_seq++;
						}
					} break;
					case 1: {
						this._anim_up_idle.update(sync);
					} break;
					case 2: {
						this._anim_up_departing.update(sync);
						if(this._anim_up_departing.isStopped()) {
							this._sprite.setImageSource(this._anim_up_moving);
							this._landing_seq = 0;
							this._unloading = false;
						}
					} break;
				}				
			}
			
			// Handle the actual unloading...
			if(this._landing_seq === 1) {

				this._unload_timer.update(sync);
				
				if(this._unload_timer.isComplete()) {
					
					this.unloadSoldier();
					
				}
				
			}
			
		} else {

			this.moveForward(sync,this._sprite);
			var x = this.getX();
			var y = this.getY();
	
			// Make ship face the next waypoint
			if(this._direction) {
				this._anim_down_moving.update(sync);
				this._sprite.setRotation(Math.atan2(this.getNextWaypointY() - y,this.getNextWaypointX() - x) * RAD_TO_DEG - 90);
			} else {
				this._anim_up_moving.update(sync);
				this._sprite.setRotation(90 + Math.atan2(this.getNextWaypointY() - y,this.getNextWaypointX() - x) * RAD_TO_DEG);
			}
			
			if(!this.hasWaypoints()) this.remove();
			
		}
	}
	
};

TransportShip.prototype.unloadSoldier = function() {
	var gsx = g_game.getGridSizeX();
	var gsy = g_game.getGridSizeY();
	
	this._num_soldiers--;
	g_game.spawnSoldier(this.getX() + this._unload_offset_x + Math.rand(-gsx,0),this.getY() + this._unload_offset_y + Math.rand(-gsy,gsy));
	
	this._unload_timer.stop();
	if(this._num_soldiers > 0) {
		this._unload_timer.reset().start();
	} else {
		this.endLanding();
	}
};

TransportShip.prototype.isReady = function() {
	return !this.isActive();
};

/**
 * Process a potential hit by a bullet at x,y
 */
TransportShip.prototype.processHit = function(bullet, x, y) {
	
	if(this.testHit(this._sprite.getX(),this._sprite.getY(),x,y,bullet.getRadius())) {
		this.gotHitByBullet(bullet);
		return true;
	}

	return false;
};

/**
 * Remove the ship from the playing area. Also mark the Ship as inactive.
 * 
 */
TransportShip.prototype.remove = function() {
	g_game.removeEnemy(this);
	this._sprite.removeFromParent();
	this.setActive(false);
};


/**
 * Destruction function.
 */
TransportShip.prototype.destroy = function() {

	this._sprite.removeFromParent();
	this.setActive(false);
	
	var sx = this.getX();
	var sy = this.getY();
	var w = this._sprite.getWidth();
	var h = this._sprite.getHeight();
	
	for(var i = 0; i < 9; ++i) {
		var x = (Math.random() * w) + sx - (w * 0.5);
		var y = (Math.random() * h) + sy - (h * 0.5);
		g_game.createExplosion(x,y);
	}

	var score = this.getScoreValue() + (this._num_soldiers * this._score_per_soldier);
	
	g_game.removeEnemy(this);
	g_game.addScore(score);
	g_game.createScoreMarker(sx,sy,score);
	
	this._sound_destroy.play();
	
};

