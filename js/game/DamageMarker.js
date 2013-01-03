/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * DamageMarker.js
 *
 * A number that rises slowly upwards from a successful hit.
 * Quick and dirty copy/paste job from ScoreMarker.js.
 *
 * creation date: 01-10-2012
 */


function DamageMarker() {
	
	if(!DamageMarker.text_static_init) {
		DamageMarker.text_r = g_config.getInteger('effects.damageMarker.color.@r',255);
		DamageMarker.text_g = g_config.getInteger('effects.damageMarker.color.@g',255);
		DamageMarker.text_b = g_config.getInteger('effects.damageMarker.color.@b',255);
		DamageMarker.text_a = g_config.getInteger('effects.damageMarker.color.@a',255) / 255.0;
		DamageMarker.text_outline = g_config.getBoolean('effects.damageMarker.outline',false);
		DamageMarker.text_outline_r = g_config.getInteger('effects.damageMarker.outline.@r',255);
		DamageMarker.text_outline_g = g_config.getInteger('effects.damageMarker.outline.@g',255);
		DamageMarker.text_outline_b = g_config.getInteger('effects.damageMarker.outline.@b',255);
		DamageMarker.text_outline_a = g_config.getInteger('effects.damageMarker.outline.@a',255) / 255.0;
		DamageMarker.text_glow = g_config.getBoolean('effects.damageMarker.glow',false);
		DamageMarker.text_glow_r = g_config.getInteger('effects.damageMarker.glow.@r',255);
		DamageMarker.text_glow_g = g_config.getInteger('effects.damageMarker.glow.@g',255);
		DamageMarker.text_glow_b = g_config.getInteger('effects.damageMarker.glow.@b',255);
		DamageMarker.text_glow_a = g_config.getInteger('effects.damageMarker.glow.@a',255) / 255.0;
		DamageMarker.text_glow_size = g_config.getInteger('effects.damageMarker.glow.@radius',10);
		DamageMarker.text_size = g_config.getInteger('effects.damageMarker.font.@size',20);
		DamageMarker.text_font = g_config.getString('effects.damageMarker.font.@name','Arial Bold');
		DamageMarker.text_duration = g_config.getInteger('effects.damageMarker.movement.@duration',1000) / 1000.0;
		DamageMarker.text_delta_x = g_config.getInteger('effects.damageMarker.movement.@delta_x');
		DamageMarker.text_delta_y = g_config.getInteger('effects.damageMarker.movement.@delta_y');
		DamageMarker.text_offset_x = g_config.getInteger('effects.damageMarker.position.@offset_x',0);
		DamageMarker.text_offset_y = g_config.getInteger('effects.damageMarker.position.@offset_y',0);
		DamageMarker.text_static_init = true;
	}
	
	this._sprite = new TextSprite(DamageMarker.text_font,DamageMarker.text_size,"0");
	this._sprite.setFontWeight("bold");
	
	this._sprite.setTextColor(DamageMarker.text_r,DamageMarker.text_g,DamageMarker.text_b,DamageMarker.text_a);
	if(DamageMarker.text_outline) {
		this._sprite.setTextOutlineColor(DamageMarker.text_outline_r,DamageMarker.text_outline_g,DamageMarker.text_outline_b,DamageMarker.text_outline_a);
	}
	if(DamageMarker.text_glow) {
		this._sprite.setShadow(DamageMarker.text_glow_r,DamageMarker.text_glow_g,DamageMarker.text_glow_b,DamageMarker.text_glow_a,DamageMarker.text_glow_size);
	}
	this._sprite.setOffset(DamageMarker.text_offset_x,DamageMarker.text_offset_y);
	this._sprite.setDrawMode(TextSprite.DrawMode.ALPHA);

	this._timer = new Timer();

	this._x0 = 0;
	this._y0 = 0;
	this._x1 = 0;
	this._y1 = 0;
	
};

DamageMarker.text_r = 255;
DamageMarker.text_g = 255;
DamageMarker.text_b = 255;
DamageMarker.text_a = 1;
DamageMarker.text_outline = false;
DamageMarker.text_outline_r = 0;
DamageMarker.text_outline_g = 0;
DamageMarker.text_outline_b = 0;
DamageMarker.text_outline_a = 0;
DamageMarker.text_glow = false;
DamageMarker.text_glow_r = 0;
DamageMarker.text_glow_g = 0;
DamageMarker.text_glow_b = 0;
DamageMarker.text_glow_a = 0;
DamageMarker.text_glow_size = 0;
DamageMarker.text_size = 20;
DamageMarker.text_font = 'Arial';
DamageMarker.text_duration = 1.0;
DamageMarker.text_delta_x = 0;
DamageMarker.text_delta_y = 35;
DamageMarker.text_offset_x = -20;
DamageMarker.text_offset_y = 0;
DamageMarker.text_static_init = false;

DamageMarker.prototype.isActive = function()  {
	return (this._sprite.getParent() !== null);
};

DamageMarker.prototype.spawn = function(x,y,score) {
	g_game.getPointerLayer().addChild(this._sprite);
	this._x0 = x;
	this._y0 = y;
	this._x1 = x;
	this._y1 = y - DamageMarker.text_delta_y;
	this._sprite.setPosition(x,y);
	this._sprite.setText("" + score);
	this._timer.setTarget(DamageMarker.text_duration).reset().start();
	return this;
};

DamageMarker.prototype.setColor = function(r,g,b,a) {
	if(r !== undefined) {
		this._sprite.setTextColor(r,g,b,a);
	} else {
		this._sprite.setTextColor(DamageMarker.text_r,DamageMarker.text_g,DamageMarker.text_b,DamageMarker.text_a);
	}
};

DamageMarker.prototype.update = function(sync) {
	this._timer.update(sync);
	
	var bias = this._timer.getProgress();
	var x0 = this._x0;
	var y0 = this._y0;
	var x1 = this._x1;
	var y1 = this._y1;
	var lerp = Ease.lerp;
	var slerp = Ease.sin_lerp;
	
	this._sprite.setPosition(slerp(bias,x0,x1),lerp(bias,y0,y1));
	this._sprite.setOpacity(lerp(bias,1,0));
	
	if(this._timer.isComplete()) {
		this._sprite.removeFromParent();
	}
	
};
