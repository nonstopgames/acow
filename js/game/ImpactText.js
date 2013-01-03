/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * Expanding text for visual impact
 *
 */


function ImpactText(){
	
	this._sprite = new TextSprite("Germania One",40,"");
	this._sprite.setFontWeight("bold");
	
	this._sprite.setTextColor(255, 255, 255, 1);
	this._sprite.setDrawMode(TextSprite.DrawMode.ADDITIVE);

	this._sprite.setRotation(Math.PI / 30);

	this._sprite.setOffset(0, -50);

	this._timer = new Timer();

	this._sprite.setTextOutlineColor(0,0,0,1);
}

ImpactText.prototype.isActive = function()  {
	return (this._sprite.getParent() !== null);
};

ImpactText.prototype.spawn = function(text) {
	g_game._uiScene.addChild(this._sprite);
	this._sprite.setText(text);
	this._timer.setTarget(1).reset().start();
	return this;
};

ImpactText.prototype.update = function(sync) {
	this._timer.update(sync);
	
	var bias = this._timer.getProgress();
	var lerp = Ease.lerp;
	
	this._sprite.setOpacity(lerp(bias,1,0));
	this._sprite.setScale(lerp(bias, 1, 5));
	this._sprite.setPosition(g_game.getMid(),g_game.getBottom());

	if(this._timer.isComplete()) {
		this._sprite.removeFromParent();
	}else{
		this._sprite.getParent().addChild(this._sprite);
	}
};
