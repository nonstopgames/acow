/**
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * CowBullet.js
 *
 * Cow as a bullet.
 * It rotates.
 *
 * creation date: 17-12-2012
 */

"use strict";

/**
 *
 *
 */
function CowBullet() {

	Bullet.call(this);

	this._spriteMega = new Sprite(g_assets.getBitmap('mega-cow-cannon'));
	this._spriteNormal = new Sprite(g_assets.getBitmap("cow-cannon"));

	this._spriteNormal.setOffset(0, 0);
	this._spriteMega.setOffset(0, 0);
	
	this._sprite = this._spriteNormal;

	this._scale_min = 1;

	this._megaProb = g_config.global.megaCowBulletProbability;
}

CowBullet.inherits(Bullet);

CowBullet.prototype.setActive = function(active){
	Bullet.prototype.setActive.call(this, active);
	if(active){
		if(Math.random() < this._megaProb){
			// this._scale_min = 2;
			// this._scale_max = 4;
			this._is_big = true;
			this._sprite = this._spriteMega;
		}else{
			// this._scale_min = 1;
			this._scale_max = g_config.global.cannonballs.scaleMax;
			this._is_big = false;
			this._sprite = this._spriteNormal;
		}
	}
};

/**
 * Updates cannonball flight..
 */
CowBullet.prototype.update = function(sync) {
	
	this._flightTimeCur += sync;
	if(this._flightTimeCur >= this._flightTime) {

		this._sprite.removeFromParent();
		this._shadow.removeFromParent();

		var gx = Math.floor(this._to_x / g_game.getGridSizeX()),
			gy = Math.floor((this._to_y + this._sprite.getHeight() / 2) / g_game.getGridSizeY()),
			w = g_game.getWalls();

		if(this._is_big){
			if(w.canWalk(gx, gy) && w.canWalk(gx - 1, gy)){
				g_game.spawnMegaCow(this._to_x, this._to_y);
			}else{
				g_game.bulletHit(this,this._owner,this._to_x,this._to_y, 1);
			}
		}else{
			if(g_game.getWalls().canWalk(gx, gy)){
				if(Math.random() < 0.5){
					g_game.spawnCow(this._to_x, this._to_y);
				}else{
					g_game.spawnSantaCow(this._to_x, this._to_y);
				}
			}else{
				g_game.bulletHit(this,this._owner,this._to_x,this._to_y);
			}
		}
		this.setActive(false);
		
	} else {
		
		var bias = this._flightTimeCur / this._flightTime;
		var a = this._altitude;
		
		var x = Ease.lerp(bias,this._from_x,this._to_x) + Ease.parabola(bias,0,Bullet.viewVector.x * a);
		var y = Ease.lerp(bias,this._from_y,this._to_y) + Ease.parabola(bias,0,Bullet.viewVector.y * a);
		var s = Ease.parabola(bias,this._scale_min,this._scale_max);
		var r = Ease.lerp(bias, -30, -1080);
		
		this._sprite.setScale(s);
		this._sprite.setPosition(x,y);
		this._sprite.setRotation(r);

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

