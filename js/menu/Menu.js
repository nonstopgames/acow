/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * Menu.js
 *
 * Menu control code. 
 *
 * creation date: 20-06-2012
 */

"use strict";

/**
 * Menu system constructor.
 *
 */
function Menu() {
	
	this._elem = g_env.createDiv('menu');
	this._background = g_assets.getImage('menu-background');
	this._background.style.opacity = "0.5";
	
	this._mainMenu = new MainMenu();
	this._highscore = new HighscoreMenu();
	
};

/**
 * First-run setup code
 * 
 */
Menu.prototype.init = function() {
	g_engine.setRunlevelMaxFramerate(g_runlevel_menu,25);
	g_engine.setRunlevelMaxFramerate(g_runlevel_menu_highscore,25);
	this.start();
};

/**
 * Startup code - tells Environment to remove whatever it's currently
 * displaying (if anything) and replace it with Menu. Then display
 * the main menu.
 *
 * @returns a reference to self
 */
Menu.prototype.start = function() {

	var that = this;
	g_env.clearWindowSizeChangeListeners();
	g_env.addWindowSizeChangeListener(function() {
		var w = g_env.getWidth();
		var h = g_env.getHeight();

		that._mainMenu.windowResized(w,h);
		that._highscore.windowResized(w,h);
		
		if(w > h) {
			that._background.style.height = "";
			that._background.style.width = "100%";
			that._background.style.height = $(that._background).width() + "px";
		} else {
			that._background.style.width = "";
			that._background.style.height = "100%";
		}
	});
	
	g_env.clear();
	g_env.add(this._background);
	this.setActiveMenu(this._mainMenu);
	
	g_engine.setRunlevel(g_runlevel_menu);
	trace("Menu started");

	g_env.update();
	g_env.runSizeChangeListeners();
	
};

/**
 * Cleanup code - ends whatever stuff may be running before
 * asking Environment to remove us from the display list.
 * 
 * @returns a reference to self
 */
Menu.prototype.end = function() {
	
	g_env.clear();
	
};

Menu.prototype.showHighScore = function() {
	this._highscore.load();
	this.setActiveMenu(this._highscore);
};

/**
 * Remove all current menu screens
 * 
 */
Menu.prototype.removeCurrentMenu = function() {
	var children = $(this._elem).find("#menu-child");
	for(var i = 0; i < children.length; ++i) {
		children[i].remove();
	}
};

/**
 * Set active menu screen
 * 
 */
Menu.prototype.setActiveMenu = function(menu) {
	var el = menu.getElement();
	$(el).addClass("before");
	g_env.add(el);
	setTimeout(function(){
		$(el).removeClass("before");
	},0);
};
