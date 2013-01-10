/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * MainMenu.js
 *
 * Main menu handling code.
 *
 * creation date: 22-06-2012
 */

"use strict";

/**
 *
 */
function MainMenu() {

	this._elem = g_env.createDiv('menu-main');

	var logo = g_assets.getImage("main-logo");
	logo.className = "logo";

	var playButton = this._playButton = new UIButton("Play");
	var highscoreButton = this._highscoreButton = new UIButton("High Score");

	var description = document.createElement("div");
	description.className = "description";
	description.innerHTML = g_config.global.description;

	var bottomContainer = document.createElement("div");
	bottomContainer.className = "bottom-container";

	var nsglink = document.createElement('a');
	nsglink.innerHTML = "NonStop Games";
	nsglink.className = "nsglink";
	nsglink.href = "http://www.nonstop-games.com";
	nsglink.target = "_blank";

	bottomContainer.appendChild(nsglink);

	this._elem.appendChild(logo);
	this._elem.appendChild(bottomContainer);
	this._elem.appendChild(playButton.getElement());
	this._elem.appendChild(highscoreButton.getElement());
	this._elem.appendChild(description);


	var that = this;
	playButton.onClick = function() {
		if(bozz.usingWebAudio){
			bozz.unmuteiOS();
		}
		that.doStartGame();
	};

	highscoreButton.onClick = function() {
		g_menu.showHighScore();
	};
	
};

MainMenu.prototype.getElement = function() {
	return this._elem;
};

MainMenu.prototype.windowResized = function(w,h) {
	var playButton_x = Math.max(w * 0.65 - this._playButton.getWidth() / 2, w / 2);
	var playButton_y = h * 0.5 + this._playButton.getHeight();

	var highscore_x = Math.min(w * 0.35 - this._highscoreButton.getWidth() / 2, w / 2 - this._highscoreButton.getWidth());
	var highscore_y = h * 0.5 + this._highscoreButton.getHeight();

	this._playButton.setPosition(Math.min(playButton_x,w - this._playButton.getWidth()),Math.min(h - this._playButton.getHeight(),playButton_y));
	this._highscoreButton.setPosition(Math.max(highscore_x, 0),Math.min(h - this._highscoreButton.getHeight(),highscore_y));
};

/*
 * Handle start game button click
 *
 */
MainMenu.prototype.doStartGame = function() {

	trace("Quitting menu, starting game");

	g_menu.end();
	g_game.init();
	g_game.start();
};
