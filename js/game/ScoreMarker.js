/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * ScoreMarker.js
 *
 * A number that rises slowly upwards from a destroyed enemy.
 *
 * creation date: 16-08-2012
 */


function ScoreMarker() {
	
	if(!ScoreMarker.text_static_init) {
		ScoreMarker.text_r = g_config.effects.scoreMarker.color.r;
		ScoreMarker.text_g = g_config.effects.scoreMarker.color.g;
		ScoreMarker.text_b = g_config.effects.scoreMarker.color.b;
		ScoreMarker.text_a = g_config.effects.scoreMarker.color.a / 255.0;
		ScoreMarker.text_outline = g_config.effects.scoreMarker.outline.value;
		ScoreMarker.text_outline_r = g_config.effects.scoreMarker.outline.r;
		ScoreMarker.text_outline_g = g_config.effects.scoreMarker.outline.g;
		ScoreMarker.text_outline_b = g_config.effects.scoreMarker.outline.b;
		ScoreMarker.text_outline_a = g_config.effects.scoreMarker.outline.a / 255.0;
		ScoreMarker.text_glow = g_config.effects.scoreMarker.glow.value;
		ScoreMarker.text_glow_r = g_config.effects.scoreMarker.glow.r;
		ScoreMarker.text_glow_g = g_config.effects.scoreMarker.glow.g;
		ScoreMarker.text_glow_b = g_config.effects.scoreMarker.glow.b;
		ScoreMarker.text_glow_a = g_config.effects.scoreMarker.glow.a / 255.0;
		ScoreMarker.text_glow_size = g_config.effects.scoreMarker.glow.radius;
		ScoreMarker.text_size = g_config.effects.scoreMarker.font.size;
		ScoreMarker.text_font = g_config.effects.scoreMarker.font.name;
		ScoreMarker.text_duration = g_config.effects.scoreMarker.movement.duration / 1000.0;
		ScoreMarker.text_delta_x = g_config.effects.scoreMarker.movement.delta_x;
		ScoreMarker.text_delta_y = g_config.effects.scoreMarker.movement.delta_y;
		ScoreMarker.text_offset_x = g_config.effects.scoreMarker.position.offset_x;
		ScoreMarker.text_offset_y = g_config.effects.scoreMarker.position.offset_y;
		ScoreMarker.text_static_init = true;
	}
	
	this._sprite = new TextSprite(ScoreMarker.text_font,ScoreMarker.text_size,"0");
	this._sprite.setFontWeight("bold");
	
	this._sprite.setTextColor(ScoreMarker.text_r,ScoreMarker.text_g,ScoreMarker.text_b,ScoreMarker.text_a);
	if(ScoreMarker.text_outline) {
		this._sprite.setTextOutlineColor(ScoreMarker.text_outline_r,ScoreMarker.text_outline_g,ScoreMarker.text_outline_b,ScoreMarker.text_outline_a);
	}
	if(ScoreMarker.text_glow) {
		this._sprite.setShadow(ScoreMarker.text_glow_r,ScoreMarker.text_glow_g,ScoreMarker.text_glow_b,ScoreMarker.text_glow_a,ScoreMarker.text_glow_size);
	}
	this._sprite.setOffset(ScoreMarker.text_offset_x,ScoreMarker.text_offset_y);
	this._sprite.setDrawMode(TextSprite.DrawMode.ADDITIVE);

	this._timer = new Timer();

	this._x0 = 0;
	this._y0 = 0;
	this._x1 = 0;
	this._y1 = 0;
	
};

ScoreMarker.text_r = 255;
ScoreMarker.text_g = 255;
ScoreMarker.text_b = 255;
ScoreMarker.text_a = 1;
ScoreMarker.text_outline = false;
ScoreMarker.text_outline_r = 0;
ScoreMarker.text_outline_g = 0;
ScoreMarker.text_outline_b = 0;
ScoreMarker.text_outline_a = 0;
ScoreMarker.text_glow = false;
ScoreMarker.text_glow_r = 0;
ScoreMarker.text_glow_g = 0;
ScoreMarker.text_glow_b = 0;
ScoreMarker.text_glow_a = 0;
ScoreMarker.text_glow_size = 0;
ScoreMarker.text_size = 20;
ScoreMarker.text_font = 'Arial';
ScoreMarker.text_duration = 1.0;
ScoreMarker.text_delta_x = 0;
ScoreMarker.text_delta_y = 35;
ScoreMarker.text_offset_x = -20;
ScoreMarker.text_offset_y = 0;
ScoreMarker.text_static_init = false;

ScoreMarker.prototype.isActive = function()  {
	return (this._sprite.getParent() !== null);
};

ScoreMarker.prototype.spawn = function(x,y,score) {
	g_game.getPointerLayer().addChild(this._sprite);
	this._x0 = x;
	this._y0 = y;
	this._x1 = x;
	this._y1 = y - ScoreMarker.text_delta_y;
	this._sprite.setPosition(x,y);
	this._sprite.setText("" + score);
	this._timer.setTarget(ScoreMarker.text_duration).reset().start();
	return this;
};

ScoreMarker.prototype.update = function(sync) {
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
