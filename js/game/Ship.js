/**
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * Ship.js
 *
 * Control code for pirate ships.
 * 
 * creation date: 22-06-2012
 */

"use strict";

/**
 * 
 */
function Ship() {
	Enemy.call(this);

	this._firingTimer = new Timer();
	
	this._up_anim = g_assets.getAnimation('enemy-ship-up');
	this._down_anim = g_assets.getAnimation('enemy-ship-down');
	this._up_framerate = this._up_anim.getFramerate();
	this._down_framerate = this._down_anim.getFramerate();
	this._up_anim.setLooping(true).play();
	this._down_anim.setLooping(true).play();
	this._sprite = new Sprite(this._up_anim);

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
				context.beginPath();
				context.arc(tx * scale,ty * scale,that.getAccuracy() * scale,0,Math.PI * 2,true);
				context.stroke();
			}
			
			that.debug_drawWaypoints(context,this._x,this._y,scale);
			
		};
		
		this._sprite.draw = debug_draw;
	}
	
	this._sprite.setScale(g_config.enemies.ship.scale);
	this._sprite.setOffset(0,0);

	// Set hit rectangle size
	this.setHitRectSize(this._sprite.getWidth(),this._sprite.getHeight());
	this.setHitOffset(-this._sprite.getWidth() * 0.5,-this._sprite.getHeight() * 0.5);

	this._direction = 0;
	this._currentTarget = null;
	
	this._sound_destroy = g_assets.getSound('destroyShip');
	
	this.setScoreValue(g_config.enemies.ship.score);
	this.setHitpoints(g_config.enemies.ship.health);
	this.setAccuracy(g_config.enemies.ship.accuracy);
	this.setShotDamage(g_config.enemies.ship.damage.value);
	this.setShotDamageVariance(g_config.enemies.ship.damage.variance);
	this.setAttackRadius(g_config.enemies.ship.range);

	this._sound_shoot = g_assets.getSound('enemyCannonFire');

	this.setActive(false);
};

Ship.inherits(Enemy);

/**
 * Get a direct reference to the ship sprite
 *
 */
Ship.prototype.getSprite = function() {
	return this._sprite;
};

Ship.prototype.isReady = function() {
	return !this.isActive();
};

/**
 * We assume all levels are top-to-bottom, and provide minimum and maximum
 * X coordinate for the water area.
 * 
 */ 
Ship.prototype.spawn = function() {

	// Reset params
	this.setHitpoints(g_config.enemies.ship.health);
	this.setAccuracy(g_config.enemies.ship.accuracy);
	this.setShotDamage(g_config.enemies.ship.damage.value);
	this.setSpeed(Math.rand(g_config.enemies.ship.speed.min,g_config.enemies.ship.speed.max));
	this._firingTimer.setTarget(g_config.enemies.ship.reloadTime).reset().addTime(Math.random() * -1.5).start();

	var gsizex = g_game.getGridSizeX();
	var gsizey = g_game.getGridSizeY();
	
	var water_min_gx = g_game.getMap().getWaterVerticalMin() + 1;
	var water_max_gx = g_game.getMap().getWaterVerticalMax();

	var gx  = Math.rand(water_min_gx,water_max_gx);
	var step = 4; // One waypoint every 4 grid tiles

	this.clearWaypoints();
	
	// Decide whether to build a path from up to down or from down to up
	if(Math.random() >= 0.5) {
		
		var gy0 = g_game.getLevelHeight() + (((this._sprite.getHeight() / g_game.getGridSizeY()) + 1) | 0);
		var gy1 = -(((this._sprite.getHeight() / g_game.getGridSizeY()) + 1) | 0);
		
		this._direction = 0;
		
		// Build path from down to up
		for(var gy = gy0; gy >= gy1; gy -= step) {
			var move_chance = Math.random();
			if(gx > water_min_gx) {
				
				// Magic chance values ftw (:E)
				if(move_chance > 0.6) {
					gx--;
				} else if(move_chance > 0.225) {
					// nothing
				} else {
					gx++;
				}
				
			} else {
				var move_chance = Math.random();
				if(gx > water_min_gx) {
					
					// Magic chance values ftw (:E)
					if(move_chance > 0.6) {
						gx++;
					} else if(move_chance > 0.225) {
						// nothing
					} else {
						gx--;
					}
				}
			}
			
			this.addWaypoint(gx * gsizex + (gsizex * 0.5),gy * gsizey + (gsizey * 0.5));
		}
		
		this._sprite.setImageSource(this._up_anim);
		
	} else {
		
		var gy0 = -(((this._sprite.getHeight() / g_game.getGridSizeY()) + 1) | 0);
		var gy1 = g_game.getLevelHeight() + (((this._sprite.getHeight() / g_game.getGridSizeY()) + 1) | 0);
		
		this._direction = 1;
		
		// Build path from up to down
		for(var gy = gy0; gy <= gy1; gy += step) {
			var move_chance = Math.random();
			if(gx > water_min_gx) {
				
				// Magic chance values ftw (:E)
				if(move_chance > 0.6) {
					gx--;
				} else if(move_chance > 0.225) {
					// nothing
				} else {
					gx++;
				}
				
			} else {
				var move_chance = Math.random();
				if(gx > water_min_gx) {
					
					// Magic chance values ftw (:E)
					if(move_chance > 0.6) {
						gx++;
					} else if(move_chance > 0.225) {
						// nothing
					} else {
						gx--;
					}
				}
			}
			this.addWaypoint(gx * gsizex + (gsizex * 0.5),gy * gsizey + (gsizey * 0.5));
		}
		
		this._sprite.setImageSource(this._down_anim);
	}
	
	this.moveToFirstWaypoint();
	this.setActive(true);
	this.update(0);

};

/**
 * Overridden update function. Will be called
 * from Engine update loop.
 */
Ship.prototype.update = function(sync) {
	if(this.isActive()) {
		
		this._up_anim.update(sync);
		this._down_anim.update(sync);
		
		this._firingTimer.update(sync);

		//var sw = this._sprite.getWidth();
		var sh = this._sprite.getHeight();
		
		this.moveForward(sync,this._sprite);
		var x = this.getX();
		var y = this.getY();
		
		// Make ship face the next waypoint
		if(this._direction) {
			this._sprite.setRotation(Math.atan2(this.getNextWaypointY() - y,this.getNextWaypointX() - x) * RAD_TO_DEG - 90);
		} else {
			this._sprite.setRotation(90 + Math.atan2(this.getNextWaypointY() - y,this.getNextWaypointX() - x) * RAD_TO_DEG);
		}
		
		// See if we're ready to shoot...
		if(this._firingTimer.isComplete()) {

			if(y > sh && y < (g_game.getLevelHeight() * g_game.getGridSizeY())) {
				
				// Find something to shoot at
				var target = g_game.getWalls().getRandomWallCoordinates();
				if(target) {
					var dx = target.x - x;
					var dy = target.y - y;
					var dr = this.getAttackRadius();
					if(Math.sqrt((dx * dx) + (dy * dy)) <= dr ) {
						
						this._currentTarget = target;
						
						// Target is non-null only if there's something left to shoot...
						target = this.getImpactCoordinates(target.x,target.y);
						
						// Actually shoot it..
						var bullet;
						if(Math.random() < g_game.getCowProbability()){
							bullet = g_game.getCowBullet();
						}else{
							bullet = g_game.getBullet();
						}
						bullet.shoot(this,this._sprite.getX(),this._sprite.getY(),target.x,target.y,350);
						this._firingTimer.reset().addTime(Math.random() * -1.5).start();
						this._sound_shoot.play();
					} else {
						this._currentTarget = null;
					}
				} else {
					this._currentTarget = null;
				}
			}
		}
		
		if(!this.hasWaypoints()) this.remove();
	}
};

/**
 * Process a potential hit by a bullet at x,y
 */
Ship.prototype.processHit = function(bullet, x, y) {
	
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
Ship.prototype.remove = function() {
	g_game.removeEnemy(this);
	this._sprite.removeFromParent();
	this.setActive(false);
	this._currentTarget = null;
};


/**
 * Destruction function.
 */
Ship.prototype.destroy = function() {

	this._sprite.removeFromParent();
	this.setActive(false);
	
	var w = this._sprite.getWidth();
	var h = this._sprite.getHeight();
	
	for(var i = 0; i < 9; ++i) {
		var x = (Math.random() * w) + this._sprite.getX() - (w * 0.5);
		var y = (Math.random() * h) + this._sprite.getY() - (h * 0.5);
		g_game.createExplosion(x,y);
	}

	g_game.removeEnemy(this);
	g_game.addScore(this.getScoreValue());
	g_game.createScoreMarker(this._sprite.getX(),this._sprite.getY(),this.getScoreValue());
	
	this._sound_destroy.play();
	
};
