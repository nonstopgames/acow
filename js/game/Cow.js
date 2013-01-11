/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * Cow.js
 *
 * Annoying animals that occupy tiles to prevent walls from being built there.
 * Does nothing but walking.
 * Explodes upon getting hit!
 *
 * A lot of copy-paste from soldier.js
 *
 * creation date: 17-12-2012
 * 
 */

"use strict";

function Cow() {
	Enemy.call(this);
	
	this._anim_idle = [ g_assets.getAnimation('enemy-cow-idle-left'),
					    g_assets.getAnimation('enemy-cow-idle-right') ];
	this._anim_walk = [ g_assets.getAnimation('enemy-cow-walk-left'),
					    g_assets.getAnimation('enemy-cow-walk-right') ];
	this._anim_mooing = [ g_assets.getAnimation('enemy-cow-mooing-left'),
						  g_assets.getAnimation('enemy-cow-mooing-right') ];
	this._anim_death = [ g_assets.getAnimation('enemy-cow-death-left'),
						 g_assets.getAnimation('enemy-cow-death-right') ];

	this._anim_walk = Cow.getWalk();

	this._anim_mooing = Cow.getMoo();

	this._dy = 12;
	
	this._animation = this._anim_idle;
	
	this._maxWalkDistance = g_config.enemies.cow.maxWalkDistance;
	
	this._state = Cow.state.idle;
	this._direction = 0; // 0: left, 1: right
	
	this._sprite = new Sprite(this._anim_idle[0]);
	
	this._last_x = 0;
	this._last_y = 0;

	this._off_x = 0;
	this._off_y = 0;

	this._mooProbability = g_config.enemies.cow.mooProbability;

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
	
	this._moo_sound = g_assets.getSound('moo');

	this._currentTarget = null;
	
	this._moveTimer = new Timer();
	this._moveTimer.setTarget(g_config.enemies.cow.moveDelay);
	this._moveTimer.start();
	
	this._deathTimer = new Timer();
	this._deathTimer.setTarget(g_config.enemies.cow.deathDelay);

	this._mooTimer = new Timer();
	this._mooTimer.setTarget(g_config.enemies.cow.mooDelay);
	this._mooTimer.start();
	
	this.setScoreValue(g_config.enemies.cow.score);
	this.setHitpoints(g_config.enemies.cow.health);
	this.setShotDamage(g_config.enemies.cow.damage.value);
	this.setShotDamageVariance(g_config.enemies.cow.damage.variance);
	this.setSpeed(Math.rand(g_config.enemies.cow.speed.min, g_config.enemies.cow.speed.max));
	
}
Cow.inherits(Enemy);

/**
 * A pseudo-enum for cow internal state.
 */
Cow.state = (function() {
	var idx = 0;
	return {
		idle: idx++,
		walking: idx++,
		dying: idx++,
		mooing: idx++
	};
})();

/*
 * Generated animations for cows
 * To avoid recreating animation during every initialisation
 */

Cow.genGenani = function(){
	Cow.genAni = {};
	var idl = g_assets.getAnimation("enemy-cow-idle-left"),
		idr = g_assets.getAnimation("enemy-cow-idle-right").source_data,
		w = idl.getWidth(),
		h = idl.getHeight();
	idl = idl.source_data;
	Cow.genAni['walk_left'] = Animation.createWooblingAnimation(idl, Math.PI / 24, w, h);
	Cow.genAni['walk_right'] = Animation.createWooblingAnimation(idr, Math.PI / 24, w, h);
	Cow.genAni['moo_left'] = Animation.createWooblingAnimation(idl, Math.PI / 16, w, h);
	Cow.genAni['moo_right'] = Animation.createWooblingAnimation(idr, Math.PI / 16, w, h);
};

Cow.getWalk = function(){
	if(!Cow.genAni){
		Cow.genGenani();
	}
	return [Cow.genAni['walk_left'].copy(), Cow.genAni['walk_right'].copy()];
};

Cow.getMoo = function(){
	if(!Cow.genAni){
		Cow.genGenani();
	}
	return [Cow.genAni['moo_left'].copy(), Cow.genAni['moo_right'].copy()];
};

/**
 * Set state of the cow. Also re-sets animation.
 * @param state
 * @returns {Cow}
 */
Cow.prototype.setState = function(state) {
	var dir = this._direction;
	var a = null;
	var states = Cow.state;
	switch(state) {
		case states.idle: // Idle
			a = this._anim_idle[dir];
		break;
		case states.walking: // Moving
			a = this._anim_walk[dir];
		break;
		case states.mooing: //mooing
			a = this._anim_mooing[dir];
			break;
		case states.dying:	// Dying
			a = this._anim_death[dir];
		break;
	}
	this._sprite.setImageSource(a);
	this._sprite.setOffset(this.off_y,this._off_y);
	this._animation = a;
	this._state = state;
	a.stop().reset().play();
	return this;
};

/**
 * Set direction for the cow to face
 * @param bleft if true, cow faces left. If false, cow faces right.
 * @returns {cow} a reference to self
 */
Cow.prototype.setDirection = function(bleft) {
	var dir = bleft ? 0 : 1;
	if(dir !== this._direction) {
		this._direction = dir;
		var states = Cow.state;
		var a = null;
		switch(this._state) {
			case states.idle: // Idle
				a = this._anim_idle[dir];
			break;
			case states.walking: // Moving
				a = this._anim_walk[dir];
			break;
			case states.mooing:
				a = this._anim_mooing[dir];
			break;
			case states.dying:	// Dying
				a = this._anim_death[dir];
			break;
		}
		this._sprite.setImageSource(a);
		this._sprite.setOffset(0,this._off_y);
		this._animation = a;
		a.stop().reset().play();
	}
	return this;
};

/**
 * Spawn a new cow at x,y coordinates
 * @param x
 * @param y
 */
Cow.prototype.spawn = function(x, y) {
	if(!x || !y){
		do{
			// assume water is always at the right
			x = Math.floor(Math.random() * g_game.getMap().getWaterVerticalMin());
			y = Math.floor(Math.random() * g_game.getLevelHeight());
		}while(!g_game.getWalls().canWalk(x, y));

		x *= g_game.getGridSizeX();
		y *= g_game.getGridSizeY();
	}
	
	this.setScoreValue(g_config.enemies.cow.score);
	this.setHitpoints(g_config.enemies.cow.health);
	this.setAccuracy(g_config.enemies.cow.accuracy);
	this.setAttackRadius(g_config.enemies.cow.range);
	this.setSpeed(Math.rand(g_config.enemies.cow.speed.min, g_config.enemies.cow.speed.max));
	
	this.setAlive(true);
	this.setActive(true);
	
	this.setPosition(x,y);
	this.setState(Cow.state.idle);
	
	this._moveTimer.stop().reset().start();
	this._deathTimer.stop().reset();
	
	this._last_x = x;
	this._last_y = y;
	
	this._sprite.setOpacity(1);
	
	this.update(0);
	
};

Cow.prototype.isDying = function(){
	return this._state === Cow.state.dying;
};

/**
 * randomly decides if the cow moos
 */

Cow.prototype.mooMaybe = function(){
	if(Math.random() < this._mooProbability){
		this._mooTimer.reset().start();
		this._moo_sound.play();
		this.setState(Cow.state.mooing);
	}else{
		this.setState(Cow.state.idle);
	}
};

Cow.adj = [
	[0, 1],
	[1, 0],
	[0, -1],
	[-1, 0]
];

/*
 * Get the next target to move
 */

Cow.prototype.tryToMove = function(){
	// Get target coordinates
	var x = this.getX(),
		y = this.getY();

	var tx = Math.floor(x / g_game.getGridSizeX()),
		ty = Math.floor((y + this._dy) / g_game.getGridSizeY());

	var adj = Cow.adj;

	var ps = [], nx, ny;

	for(var i = 0; i < adj.length; i++){
		nx = tx + adj[i][0];
		ny = ty + adj[i][1];
		if(g_game.getWalls().canWalk(nx, ny)){
			ps.push([nx, ny]);
		}
	}
	if(ps.length){
		var i = Math.random() * ps.length | 0;
		nx = ps[i][0] * g_game.getGridSizeX();
		ny = ps[i][1] * g_game.getGridSizeY() + this._dy;
		// Create waypoint
		this.clearWaypoints();
		this.addWaypoint(x,y);
		this.addWaypoint(nx, ny);
		// Switch to walking state
		this.setState(Cow.state.walking);
		this._moveTimer.reset().start();
	}else{
		this.mooMaybe();
	}
};

/**
 * Main update routine
 * @param sync
 */
Cow.prototype.update = function(sync) {
	
	var states = Cow.state;
	var radius = this.getAttackRadius();
	var x,y;
	
	switch(this._state) {
	case states.idle:
		// do-nothing-loop
		this._moveTimer.update(sync);
		
		// Wait until the move timer completes to give a more organic feel to troop movement
		if(this._moveTimer.isComplete()) {
			this.tryToMove();			
		}
	break;
	case states.walking:
		this.moveForward(sync,this._sprite);

		if(!this.hasWaypoints()) {
			this.clearWaypoints();
			this.mooMaybe();
		}
		
	break;
	case states.dying:
		if(!this._animation.isPlaying()) {
			this._deathTimer.start(); // .start() just sets the 'active' state to true; we can keep calling this function..
		}
		this._deathTimer.update(sync);
		
		var bias = this._deathTimer.getElapsed() / this._deathTimer.getTarget();
		
		this._sprite.setOpacity(Ease.lerp(bias,1, 0.5));
		this._sprite.setOffset(this._off_x, this._off_y + Ease.lerp(bias, 0, -40));

		if(this._deathTimer.isComplete()) {
			this.remove();
		}
	break;
	case states.mooing:
		this._mooTimer.update(sync);

		if(this._mooTimer.isComplete()) {
			this.setState(states.idle);
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
Cow.prototype.getGridX = function() {
	return (this.getX() / g_game.getGridSizeX()) | 0;
};

/**
 * Get Y coordinate on game grid
 * @returns integer
 */
Cow.prototype.getGridY = function() {
	return (this.getY() / g_game.getGridSizeY()) | 0;
};

/**
 * Get a reference to the object's sprite 
 * @returns a Sprite reference
 */
Cow.prototype.getSprite = function() {
	return this._sprite;
};

/**
 * Find out if this cow can be spawned
 * @returns true, if object is in an inactive state
 */
Cow.prototype.isReady = function() {
	return !this.isActive();
};

/**
 * Function that gets called when the Cow gets hit
 * @param bullet a Bullet object (most likely from player)
 * @param x X coordinate of hit
 * @param y Y coordinate of hit
 * @returns {Boolean} true if hit, false if missed
 */
Cow.prototype.processHit = function(bullet, x, y) {
	
	if(this._state != Cow.state.dying) {
		if(this.testHit(this._sprite.getX(),this._sprite.getY(),x,y,bullet.getRadius())) {
			this.gotHitByBullet(bullet);
			return true;
		}
	}

	return false;
};

/**
 * Remove self from game area and mark object as inactive
 */
Cow.prototype.remove = function() {
	g_game.removeEnemy(this);
	this._sprite.removeFromParent();
	this.setActive(false);
	this._currentTarget = null;
};

/**
 * Make cow die. Sets state to 'dying', rewards score to player and creates floating
 * score marker.
 */
Cow.prototype.destroy = function() {

	this.setState(Cow.state.dying);
	
	var sx = this.getX();
	var sy = this.getY();
	var w = this._sprite.getWidth();
	var h = this._sprite.getHeight();

	g_game.addScore(this.getScoreValue());
	g_game.createScoreMarker(sx,sy,this.getScoreValue());

	g_game.createBlood(sx, sy);
	
};
