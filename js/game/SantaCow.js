/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * SantaCow.js
 *
 * Similar to cow, but more Christmas looking
 * Also negative score if destroyed
 */

function SantaCow(){
	Enemy.call(this);

	this._anim_idle = [ g_assets.getAnimation('enemy-santa-cow-idle-left'),
					    g_assets.getAnimation('enemy-santa-cow-idle-right') ];
	this._anim_death = [ g_assets.getAnimation('enemy-santa-cow-death-left'),
						 g_assets.getAnimation('enemy-santa-cow-death-right') ];

	this._anim_walk = SantaCow.getWalk();

	this._anim_mooing = SantaCow.getMoo();


	this._animation = this._anim_idle;
	
	this._sprite = new Sprite(this._anim_idle[0]);

	this._dy = 12;
	
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
	this._moveTimer.setTarget(g_config.enemies.cow.moveDelay / 3);
	this._moveTimer.start();
	
	this._deathTimer = new Timer();
	this._deathTimer.setTarget(g_config.enemies.cow.deathDelay);

	this._mooTimer = new Timer();
	this._mooTimer.setTarget(g_config.enemies.cow.mooDelay);
	this._mooTimer.start();
	
	this.setShotDamage(g_config.enemies.cow.damage.value);
	this.setShotDamageVariance(g_config.enemies.cow.damage.variance);
	this.setSpeed(Math.rand(g_config.enemies.cow.speed.min * 1.5,g_config.enemies.cow.speed.max * 1.5));
}

SantaCow.inherits(Cow);

SantaCow.prototype.spawn = function(x, y){
	Cow.prototype.spawn.call(this, x, y);
	this.setScoreValue(-2 * g_config.enemies.cow.score);
	this.setSpeed(Math.rand(g_config.enemies.cow.speed.min * 1.5,g_config.enemies.cow.speed.max * 1.5));
}

/*
 * Generated animations for cows
 */

SantaCow.genGenani = function(){
	SantaCow.genAni = {};
	var idl = g_assets.getAnimation("enemy-santa-cow-idle-left"),
		idr = g_assets.getAnimation("enemy-santa-cow-idle-right").source_data,
		w = idl.getWidth(),
		h = idl.getHeight();
	idl = idl.source_data;
	SantaCow.genAni['walk_left'] = Animation.createWooblingAnimation(idl, Math.PI / 24, w, h);
	SantaCow.genAni['walk_right'] = Animation.createWooblingAnimation(idr, Math.PI / 24, w, h);
	SantaCow.genAni['moo_left'] = Animation.createWooblingAnimation(idl, Math.PI / 16, w, h);
	SantaCow.genAni['moo_right'] = Animation.createWooblingAnimation(idr, Math.PI / 16, w, h);
};

SantaCow.getWalk = function(){
	if(!SantaCow.genAni){
		SantaCow.genGenani();
	}
	return [SantaCow.genAni['walk_left'].copy(), SantaCow.genAni['walk_right'].copy()];
};

SantaCow.getMoo = function(){
	if(!SantaCow.genAni){
		SantaCow.genGenani();
	}
	return [SantaCow.genAni['moo_left'].copy(), SantaCow.genAni['moo_right'].copy()];
};
