/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * Soldier.js
 *
 * Land troop base class - more specialized units
 * can be derived from this. The basic Land Troop
 * is a soldier with a spear.
 *
 * creation date: 06-08-2012
 * 
 */

"use strict";

/**
 * Land troop class. A soldier is a small, slow dude with a spear or something,
 * who walks in straight lines for short distances, stopping to attack any and
 * all obstacles he can reach. 
 * @returns
 */
function Soldier() {
	Enemy.call(this);
	
	this._anim_idle = [ g_assets.getAnimation('enemy-soldier-idle-left'),
					    g_assets.getAnimation('enemy-soldier-idle-right') ];
	this._anim_walk = [ g_assets.getAnimation('enemy-soldier-walk-left'),
					    g_assets.getAnimation('enemy-soldier-walk-right') ];
	this._anim_attack = [ g_assets.getAnimation('enemy-soldier-attack-left'),
						  g_assets.getAnimation('enemy-soldier-attack-right') ];
	this._anim_death = [ g_assets.getAnimation('enemy-soldier-death-left'),
						 g_assets.getAnimation('enemy-soldier-death-right') ];
	
	this._animation = this._anim_idle;
	
	this._maxWalkDistance = g_config.enemies.soldier.maxWalkDistance;
	
	this._state = Soldier.state.idle;
	this._direction = 0; // 0: left, 1: right
	
	this._sprite = new Sprite(this._anim_idle[0]);
	
	this._last_x = 0;
	this._last_y = 0;
	
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
	
	this.setHitRectSize(this._sprite.getWidth(),this._sprite.getHeight());
	this.setHitOffset(this._sprite.getWidth() * -0.5,this._sprite.getHeight() * -0.5);
	this._sprite.setOffset(this._sprite.getWidth() * 0.5,0);
	
	this._currentTarget = null;
	
	this._moveTimer = new Timer();
	this._moveTimer.setTarget(g_config.enemies.soldier.moveDelay);
	this._moveTimer.start();
	
	this._attackTimer = new Timer();
	this._attackTimer.setTarget(g_config.enemies.soldier.attackDelay);
	this._attackTimer.start();
	
	this._deathTimer = new Timer();
	this._deathTimer.setTarget(g_config.enemies.soldier.deathDelay);
	
	this.setScoreValue(g_config.enemies.soldier.score);
	this.setHitpoints(g_config.enemies.soldier.health);
	this.setAccuracy(g_config.enemies.soldier.accuracy);
	this.setShotDamage(g_config.enemies.soldier.damage.value);
	this.setShotDamageVariance(g_config.enemies.soldier.damage.variance);
	this.setAttackRadius(g_config.enemies.soldier.range);
	this.setSpeed(Math.rand(g_config.enemies.soldier.speed.min,g_config.enemies.soldier.speed.max));
	
}
Soldier.inherits(Enemy);

/**
 * A pseudo-enum for soldier internal state.
 */
Soldier.state = (function() {
	var idx = 0;
	return {
		idle: idx++,
		walking: idx++,
		attacking: idx++,
		dying: idx++
	};
})();

/**
 * Set state of the soldier. Also re-sets animation.
 * @param state
 * @returns {Soldier}
 */
Soldier.prototype.setState = function(state) {
	var dir = this._direction;
	var a = null;
	var states = Soldier.state;
	switch(state) {
		case states.idle: // Idle
			a = this._anim_idle[dir];
		break;
		case states.walking: // Moving
			a = this._anim_walk[dir];
		break;
		case states.attacking: // Attacking
			a = this._anim_attack[dir];
		break;
		case states.dying:	// Dying
			a = this._anim_death[dir];
		break;
	}
	this._sprite.setImageSource(a);
	this._sprite.setOffset(0,0);
	this._animation = a;
	this._state = state;
	a.stop().reset().play();
	return this;
};

/**
 * Set direction for the soldier to face
 * @param bleft if true, soldier faces left. If false, soldier faces right.
 * @returns {Soldier} a reference to self
 */
Soldier.prototype.setDirection = function(bleft) {
	var dir = bleft ? 0 : 1;
	if(dir !== this._direction) {
		this._direction = dir;
		var states = Soldier.state;
		var a = null;
		switch(this._state) {
			case states.idle: // Idle
				a = this._anim_idle[dir];
			break;
			case states.walking: // Moving
				a = this._anim_walk[dir];
			break;
			case states.attacking: // Attacking
				a = this._anim_attack[dir];
			break;
			case states.dying:	// Dying
				a = this._anim_death[dir];
			break;
		}
		this._sprite.setImageSource(a);
		this._sprite.setOffset(0,0);
		this._animation = a;
		a.stop().reset().play();
	}
	return this;
};

/**
 * Spawn a new soldier at x,y coordinates
 * @param x
 * @param y
 */
Soldier.prototype.spawn = function(x,y) {
	
	this.setScoreValue(g_config.enemies.soldier.score);
	this.setHitpoints(g_config.enemies.soldier.health);
	this.setAccuracy(g_config.enemies.soldier.accuracy);
	this.setAttackRadius(g_config.enemies.soldier.range);
	this.setSpeed(Math.rand(g_config.enemies.soldier.speed.min,g_config.enemies.soldier.speed.max));
	
	this.setAlive(true);
	this.setActive(true);
	
	this.setPosition(x,y);
	this.setState(Soldier.state.idle);
	
	this._moveTimer.stop().reset().start();
	this._deathTimer.stop().reset();
	
	this._last_x = x;
	this._last_y = y;
	
	this._sprite.setOpacity(1);
	
	this.update(0);
	
};

/**
 * Main update routine
 * @param sync
 */
Soldier.prototype.update = function(sync) {
	
	var states = Soldier.state;
	var radius = this.getAttackRadius();
	var x,y;
	
	switch(this._state) {
	case states.idle:
		// do-nothing-loop
		this._moveTimer.update(sync);
		
		// Wait until the move timer completes to give a more organic feel to troop movement
		if(this._moveTimer.isComplete()) {
			
			// Get target coordinates
			x = this.getX();
			y = this.getY();
			var target_wp = g_game.getNearestControlledCastleCoordinates(x,y); // vec2 object (these function names are getting longer and longer)
			
			if(target_wp) {
			
				// Add random offset to target coordinates for nicer movement
				var offset = new vec2((Math.random() - 0.5) * 2,(Math.random() - 0.5) * 2);
				offset.normalize();
				offset.setLength(Math.random() * g_config.enemies.soldier.waypointOffset);
				target_wp.x += offset.x;
				target_wp.y += offset.y;

				target_wp.x -= x;
				target_wp.y -= y;
				
				// Make sure we don't walk too far along a single straight line
				if(target_wp.length() > this._maxWalkDistance) {
					target_wp.setLength(this._maxWalkDistance);
				}
				
				// Create waypoint
				this.clearWaypoints();
				this.addWaypoint(x,y);
				this.addWaypoint(x + target_wp.x,y + target_wp.y);
	
				// Switch to walking state
				this.setState(states.walking);
			
			}
			
			this._moveTimer.reset().start();
		}
	break;
	case states.walking:
		this.moveForward(sync,this._sprite);

		x = this.getX();
		y = this.getY();
		var nearest_wall = g_game.getNearestWallTileCoordinates(x,y); // vec2 object //S: löytääkö oikean reunan eikä seinän keskustaa?
		
		// Test if there is a wall tile near enough to hit it
		if(nearest_wall && nearest_wall.distanceTo(x,y) < radius) {
			this._currentTarget = nearest_wall;
			this.setState(states.attacking);
		} else {
			// Regular logic - if we have no more waypoints, idle for a while, then pick a new one.
			if(!this.hasWaypoints()) {
				this.clearWaypoints();
				this.setState(states.idle);
			}
		}
		
	break;
	case states.attacking:
		
		this._attackTimer.update(sync);
		
		// Register attack only once the attack timer has completed
		if(this._attackTimer.isComplete()) {
			g_game.meleeHit(this,this._currentTarget.x,this._currentTarget.y);
			this._attackTimer.reset().start();
		}
		
		// End attack mode once our target has been destroyed
		if(!(g_game.getWalls().isWallTileAlive(this._currentTarget.x,this._currentTarget.y))) {
			this.setState(states.walking);
		}
		
	break;
	case states.dying:
		if(!this._animation.isPlaying()) {
			this._deathTimer.start(); // .start() just sets the 'active' state to true; we can keep calling this function..
		}
		this._deathTimer.update(sync);
		
		// Start fading out when HALF the death time is spent. This is a bit of an ugly solution; feel free to improve it.
		if(this._deathTimer.getProgress() > 0.5) { 
			this._sprite.setOpacity(1.0 - ((this._deathTimer.getProgress() - 0.5) * 2));
		} else {
			this._sprite.setOpacity(1);
		}
		
		if(this._deathTimer.isComplete()) {
			this.remove();
		}
	break;
	}
	
	// Update direction
	x = this.getX();
	y = this.getY();
	if(x < this._last_x)
		this.setDirection(true);
	else if(x > this._last_x)
		this.setDirection(false);
	this._last_x = x;
	this._last_y = y;
	
	this._animation.update(sync);
	this._sprite.setPosition(this.getX(),this.getY());
	
};

/**
 * Get X coordinate on game grid
 * @returns integer
 */
Soldier.prototype.getGridX = function() {
	return (this.getX() / g_game.getGridSizeX()) | 0;
};

/**
 * Get Y coordinate on game grid
 * @returns integer
 */
Soldier.prototype.getGridY = function() {
	return (this.getY() / g_game.getGridSizeY()) | 0;
};

/**
 * Get a reference to the object's sprite 
 * @returns a Sprite reference
 */
Soldier.prototype.getSprite = function() {
	return this._sprite;
};

/**
 * Find out if this troop can be spawned
 * @returns true, if object is in an inactive state
 */
Soldier.prototype.isReady = function() {
	return !this.isActive();
};

/**
 * Function that gets called when the Soldier gets hit
 * @param bullet a Bullet object (most likely from player)
 * @param x X coordinate of hit
 * @param y Y coordinate of hit
 * @returns {Boolean} true if hit, false if missed
 */
Soldier.prototype.processHit = function(bullet, x, y) {
	
	if(this._state != Soldier.state.dying) {
		if(this.testHit(this._sprite.getX(),this._sprite.getY(),x,y,bullet.getRadius())) {
			this.gotHitByBullet(bullet);
			return true;
		}
	}

	return false;
};

Soldier.prototype.isDying = function(){
	return this._state === Soldier.state.dying;
};

Soldier.prototype.occupyTiles = function(gx, gy, callback){
	// note that the solider's height is slightly larger than a tile
	// also its width
	var x = this.getX() / gx,
		rx = Math.round(x),
		fx = x | 0;
	if(rx === fx && fx !== x){
		rx--;
	}
	var xs = [rx, fx],
		ys = [this.getY() - this._sprite.getHeight() / 2, this.getY(), this.getY() + this._sprite.getHeight() / 2].map(function(elm){
			return elm / gy | 0;
		});
	xs.forEach(function(ex){
		ys.forEach(function(ey){
			callback(ex, ey);
		});
	});
	// for the spear
	// which is slighly below the center
	if(this._direction === 0){
		fx--;
	}else{
		fx++;
	}
	ys.shift();
	ys.forEach(function(ey){
		callback(fx, ey);
	});
};

/**
 * Remove self from game area and mark object as inactive
 */
Soldier.prototype.remove = function() {
	g_game.removeEnemy(this);
	this._sprite.removeFromParent();
	this.setActive(false);
	this._currentTarget = null;
};

/**
 * Make Soldier die. Sets state to 'dying', rewards score to player and creates floating
 * score marker.
 */
Soldier.prototype.destroy = function() {

	this.setState(Soldier.state.dying);
	
	var sx = this.getX();
	var sy = this.getY();

	g_game.addScore(this.getScoreValue());
	g_game.createScoreMarker(sx,sy,this.getScoreValue());
	
};



// Eclipse doesn't let you scroll the buffer past EOL...

