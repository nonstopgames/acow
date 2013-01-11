/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * Cowzilla.js
 *
 * Similar to cow, but extremely large
 * Maybe should make it more destructive
 */

function Cowzilla(){
	Cow.call(this);

	this._off_y = -10;
	
	this._anim_idle = [ g_assets.getAnimation('enemy-cowzilla-idle-left'),
					    g_assets.getAnimation('enemy-cowzilla-idle-right') ];
	this._anim_death = [ g_assets.getAnimation('enemy-cowzilla-death-left'),
						 g_assets.getAnimation('enemy-cowzilla-death-right') ];

	this._anim_walk = Cowzilla.getWalk();

	this._anim_mooing = Cowzilla.getMoo();


	this._animation = this._anim_idle;
	
	this._sprite = new Sprite(this._anim_idle[0]);

	this._maxWalkDistance = g_config.enemies.cow.maxWalkDistance;
	
	this._state = Cow.state.idle;
	this._direction = 0; // 0: left, 1: right
	
	this._last_x = 0;
	this._last_y = 0;

	this._off_x = 0;
	this._off_y = 0;

	this._mooProbability = g_config.enemies.cow.mooProbability;

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
	
	this.setShotDamage(g_config.enemies.cow.damage.value);
	this.setShotDamageVariance(g_config.enemies.cow.damage.variance);
	this.setSpeed(Math.rand(g_config.enemies.cow.speed.min,g_config.enemies.cow.speed.max));

	this.setHitRectSize(this._sprite.getWidth(),this._sprite.getHeight());
	this.setHitOffset(this._sprite.getWidth() * -0.5,this._sprite.getHeight() * -0.5);

	this.setScoreValue(g_config.enemies.cow.score * 100);
	this.setHitpoints(g_config.enemies.cow.health * 30);
}

Cowzilla.inherits(Cow);


Cowzilla.genGenani = function(){
	Cowzilla.genAni = {};
	var idl = g_assets.getAnimation("enemy-cowzilla-idle-left"),
		idr = g_assets.getAnimation("enemy-cowzilla-idle-right").source_data,
		w = idl.getWidth(),
		h = idl.getHeight();
	idl = idl.source_data;
	Cowzilla.genAni['walk_left'] = Animation.createWooblingAnimation(idl, Math.PI / 24, w, h);
	Cowzilla.genAni['walk_right'] = Animation.createWooblingAnimation(idr, Math.PI / 24, w, h);
	Cowzilla.genAni['moo_left'] = Animation.createWooblingAnimation(idl, Math.PI / 16, w, h);
	Cowzilla.genAni['moo_right'] = Animation.createWooblingAnimation(idr, Math.PI / 16, w, h);
};

Cowzilla.getWalk = function(){
	if(!Cowzilla.genAni){
		Cowzilla.genGenani();
	}
	return [Cowzilla.genAni['walk_left'].copy(), Cowzilla.genAni['walk_right'].copy()];
};

Cowzilla.getMoo = function(){
	if(!Cowzilla.genAni){
		Cowzilla.genGenani();
	}
	return [Cowzilla.genAni['moo_left'].copy(), Cowzilla.genAni['moo_right'].copy()];
};


Cowzilla.prototype.spawn = function(x, y){
	Cow.prototype.spawn.call(this, x, y);
	this.setScoreValue(g_config.enemies.cow.score * 100);
	this.setHitpoints(g_config.enemies.cow.health * 30);
};

Cowzilla.prototype.tryToMove = function(){
	// Get target coordinates
	var x = this.getX(),
		y = this.getY();

	var tx = Math.floor(x / g_game.getGridSizeX()),
		ty = Math.floor((y + this._dy) / g_game.getGridSizeY());

	var adj = Cow.adj;

	var ps = [], nx, ny;

	var w = g_game.getWalls();

	for(var i = 0; i < adj.length; i++){
		nx = tx + adj[i][0] * 2;
		ny = ty + adj[i][1] * 1;
		if([1, 0, -1].every(function(elm){
			return w.canWalk(nx + elm, ny);
		})){
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
}
