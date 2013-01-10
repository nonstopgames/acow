/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * main.js
 *
 * Program entry point file.
 *
 * All entry point functionality and
 * static global variables should be
 * defined here.
 *
 */

"use strict";

//
// Global objects and vars
// Globals should ONLY be defined here! (aside from library functions and vars)
//

window.g_env         = null;   // Environment information
window.g_input       = null;   // Input object
window.g_engine      = null;   // Global engine reference (get from singleton to allow for some cowboy code if needed)
window.g_menu        = null;   // Global menu object ref
window.g_game        = null;   // Global game object ref

//
// Runlevel IDs
//
(function() {
	var idx = 0;
	window.g_runlevel_menu           = idx++;
	window.g_runlevel_menu_highscore = idx++;
	window.g_runlevel_menu_help      = idx++;
	window.g_runlevel_game_build     = idx++;
	window.g_runlevel_game_placement = idx++;
	window.g_runlevel_game_battle    = idx++;
	window.g_runlevel_game_defeat    = idx++;
	window.g_runlevel_game_victory   = idx++;
})();


/**
 * Game initializer function
 *
 */
function CastleDefense() {

	// Set global DEBUG variable
	// set this to true to get all the logging and stuff
	window.DEBUG = false;

	trace("Castle Defense loading...");

	// Set up globals
	detectEnvironment();   // Used for local runs, sets up iface and type meta tags
    if ( window.type == 'ios' ) {
        if ( window.typeMajorVersion <= 5 ) {
            // iOS HTML5 audio is totally messed up before iOS 6 that supports WebAudio
            bozz.isSupported = function() { return false; }
        }
    }

	// init web audio with dummy mp3
	bozz.initToWebAudio("media/snd/piece_rotate.mp3");
	var loader = AssetLoader(g_assets);
	loader.load(function(p){
		p = ~~(p * 100);
		$('#loading #bar').css('width', p + '%' );
	}, function(){
		g_main.init();
	});
}

/**
 * Initialization function, called when configuration data and all assets are loaded.
 */
CastleDefense.prototype.init = function() {
	trace("Castle Defense initializing...");

	// Remove loading placeholder
	$('#loading').remove();

	window.g_engine = new Engine('game-container','game');
	window.g_env = g_engine.getEnvironment();
	window.g_input = g_engine.getInput();
	window.g_game = new Game();

	// Create menu object - menu creates game object when play is pressed
	window.g_menu = new Menu();
	g_menu.init();              // Initialize menu
	g_engine.start();

	window.DEBUG = g_config.global.debug;

	trace("Castle Defense running.");

	if(window.innerWidth < 500){
		$("#nsglogo").hide();
	}
};

/*
 * Actual entry point..
 */
$(document).ready(function() {
	window.g_main = new CastleDefense();
	$(document).bind("contextmenu",function(e){ return false; });
});
