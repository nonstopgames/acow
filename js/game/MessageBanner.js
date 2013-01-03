/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * MessageBanner.js
 *
 * Ugly text banner for displaying messages.
 * Rendered directly to canvas. Contains a
 * text SceneNode for drawing the message text..
 *
 * creation date: 20-06-2012
 * 
 */

"use strict";

function MessageBanner() {

	Actor.call(this);

	this._container = new Sprite(g_assets.getBitmap('message-background'));
	this._container.setOffset(0,0);
	
	this._text  = 'Text';

	this._fontSize = 35;
	
	this._textNode = new TextSprite('Germania One','30',"");
	this._container.addChild(this._textNode);

	this._timer = new Timer();
	this._state = 0;
	this._transitionTime = 0.6;
	this._displayTime = 2.0;
	
};
MessageBanner.inherits(Actor);

MessageBanner.prototype.showMessage = function(text, display_time) {

	// Init...

	this._displayTime = display_time;
	
	this._textNode.setText(text);
	this._textNode.updateSize(g_game.getCanvas().getContext('2d'));
	this._textNode.setOffset(40,0);
	//this._textNode.setPosition(-this._textNode.getWidth() * 0.5,0);
	this._textNode.setPosition(0,0);
	this._container.setOpacity(0);
	g_game.getUIScene().addChild(this._container);

	this._state = 0;
	this._timer.setTarget(this._transitionTime).reset().start();

	this.setActive(true);
	
};

MessageBanner.prototype.update = function(sync) {
	if(this.isActive()) {

		this._timer.update(sync);

		if(this._timer.isComplete()) {
			switch(this._state) {
				case 0:
					//trace("message fade-in complete");
					this._timer.setTarget(this._displayTime).reset().start();
					this._state++;
				break;
				case 1:
					//trace("show message complete");
					this._timer.setTarget(this._transitionTime).reset().start();
					this._state++;
				break;
				case 2:
					//trace("message fade-out complete");
					this._timer.reset().stop();
					this._container.removeFromParent();
					this._state = 0;
					this.setActive(false);
				break;
			}
		}

		var yoffs = 0;
		var opacity = 1;

		var bias = this._timer.getElapsed() / this._transitionTime;
		
		if(this._state === 0) {
			yoffs = Ease.sin_lerp(bias,-50,0);
			opacity = Ease.sin_lerp(bias,0,1);
		} else if(this._state === 2) {
			yoffs = Ease.sin_lerp(bias,0,50);
			opacity = Ease.sin_lerp(bias,1,0);
		}

		this._container.setOpacity(opacity);
		this._container.setPosition(g_env.getWidth() * 0.5,g_env.getHeight() * 0.45 + yoffs);
	}
};

