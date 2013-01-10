/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 *
 * Game.js
 *
 * Game class - tracks main game logic, controls switching of engine's
 * runlevels and houses main loop.
 *
 * Constructor gets some constants from the configuration XML, sets up
 * some defaults for others, creates canvases, that sort of jazz.
 * Everything relating to system setup is handled in init, which has a
 * first-run block. This is done mostly so that the g_game global can
 * be used in game objects.
 *
 * creation date: 15-06-2012
 *
 */

"use strict";

function Game() {

	// Surfaces
	this._canvas = g_env.createCanvas('sprite-canvas');
	
	this._mid = this._bottom = 0;

	// Scenes
	this._mainScene = new Scene(this._canvas);
	this._uiScene   = new Scene(this._canvas);
	this._pauseScreen = new ColorLayer();
	this._pauseScreen.setColor(0, 0, 0, g_config.ui.pauseScreen.opacity);
	
	// Camera
	this._camera    = new Camera();

	// System related
	this._phase     = 0;   // 0: Build phase, 1: Place cannons, 2: Action, 3: Defeat, 4: Victory
	this._phaseName = "";
	this._firstRun  = true;
	this._grid_x    = g_config.global.grid.width;
	this._grid_y    = g_config.global.grid.height;
	this._level_w   = 32;  // default value
	this._level_h   = 24;  // default value
	this._wave_num  = 0;   // Current wave number..
	this._build_drag_handler = null;
	this._placement_drag_handler = null;
	this._last_placable_cannon = false;
	
	// Player related
	this._player_score  = 0;
	this._player_shots  = 0;
	this._player_hits   = 0;
	this._player_misses = 0;
	this._player_kills  = 0;

	this._cowProbability = this._initialCowProbability = g_config.global.initialCowProbability;

	// Cannons
	this._cannons            = [];
	this._cannons_available  = g_config.global.numCannons.initial;
	this._cannons_actual     = this._cannons_available;
	this._cannons_perWaveAdd = g_config.global.numCannons.perWave;
	this._cannons_max        = g_config.global.numCannons.max;

	// Fortrifications
	this._castles = [];
	this._towers  = [];

	// Shots
	this._bulletPool = new ActorPool(Bullet);
	this._cowBulletPool = new ActorPool(CowBullet);
	this._bulletLayer = new SceneNode();

	// Effects
	this._clouds = [];
	this._explosions = [];
	this._groundExplosions = [];
	this._splashes   = [];
	this._bloods   = [];
	this._scoreMarkers = [];
	this._damageMarkers = [];
	this._impactMarkers = [];
	this._explosionEffectLayer = new SceneNode();
	this._waterEffectLayer = new SceneNode();
	this._bloodEffectLayer = new SceneNode();
	this._shadowLayer = new SceneNode();
	this._cloudLayer = new SceneNode();
	this._buildBackground = new ColorLayer();
	this._buildBackground.setColor(0, 0, 0, g_config.ui.buildBackground.opacity);
	
	this._cowzillaSound = g_assets.getSound("cowzilla-entrance");

	this._shipPool = new ActorPool(Ship);
	this._transportShipPool = new ActorPool(TransportShip);
	this._cowTransportShipPool = new ActorPool(CowTransportShip);
	this._cowPool = new ActorPool(Cow);
	this._santaCowPool = new ActorPool(SantaCow);
	this._megaCowPool = new ActorPool(MegaCow);
	this._cowzillaPool = new ActorPool(Cowzilla);
	this._soldierPool = new ActorPool(Soldier);
	this._enemyLayer = new SceneNode();
	this._enemies = [];			// Primary enemy list - must be cleared for wave to finish
	this._landTroops = [];		// Secondary enemy list - updates enemy logic as normal, but will stay frozen on screen after the wave ends
	this._enemy_ships_num = 0;  // Set in init function..
	this._enemy_ships_num_perWaveAdd = 0;
	this._enemy_transports_num = 0;
	this._enemy_transports_num_perWaveAdd = 0;

	this._cowTransportProbability = g_config.global.cowTransportProbability;
	
	// For now, we spawn five land troops per wave
	this._enemy_land_troops = 5;

	// Game state related
	this._phaseTimer = new Timer();
	this._object_placed = false;

	this._firstMegaCow = true;
	this._hasCowzilla = false;


	// Objects
	this._pointerLayer = new SceneNode();
	this._blockMarker = new BlockMarker();
	this._cannonMarker = new CannonMarker();
	this._map = new Map();
	this._walls = new Wall();
	this._shelf = new Shelf();
	
	// Sounds
	this._sound_cannon_fire_player = g_assets.getSound("playerCannonFire");
	this._sound_cannon_fire_enemy  = g_assets.getSound("enemyCannonFire");
	this._sound_cannon_hit_ground  = g_assets.getSound("bulletHitGround");
	this._sound_cannon_hit_water   = g_assets.getSound("bulletHitWater");
	this._sound_cannon_hit_ship    = g_assets.getSound("bulletHitShip");
	this._sound_cannon_hit_wall    = g_assets.getSound("bulletHitWall");
	this._sound_destroy_ship       = g_assets.getSound("destroyShip");
	this._sound_grab_object        = g_assets.getSound("pieceGrabbed");
	this._sound_rotate_object      = g_assets.getSound("pieceRotate");
	this._sound_place_wall         = g_assets.getSound("wallPlaced");
	this._sound_place_cannon       = g_assets.getSound("cannonPlaced");
	this._sound_button_click       = g_assets.getSound("buttonClick");

	// UI

	this._ui_score = new TextSprite('Germania One', '40', 'Score: 0');
	this._ui_score.setTextColor(255,255,255,1);
	this._ui_score.setTextOutlineColor(0,0,0,1);

	this._ui_wave = new TextSprite("Germania One", "40", "Wave: 1");
	this._ui_wave.setTextColor(255,255,255,1);
	this._ui_wave.setTextOutlineColor(0,0,0,1);

	// Buttons
	this._buttons = [];
	this._press_x = 0;
	this._press_y = 0;
	this._countdown_timer = new TextSprite('Germania One','40',"");
	this._countdown_timer.setTextColor(255,255,255,1);
	this._countdown_timer.setTextOutlineColor(0,0,0,1);
	this._countdown_timer.visible = false;
	this._messageDisplayTime = g_config.ui.messageDisplayTime;
	this._scoreDisplayTime = g_config.ui.scoreDisplayTime;
	
	var that = this;
	this._pauseButton = new SoftButton(g_assets.getBitmap('button-pause'));
	this._pauseButton._sound = g_assets.getSound('buttonClick');
	this._pauseButton.onClick = function() {
		this._sound.play();
		if(g_engine.isPaused()) {
			g_engine.resume();
			that._camera.unlock();
			that._zoomInButton.setLocked(false);
			that._zoomOutButton.setLocked(false);
			that._pauseScreen.removeFromParent();
		} else {
			g_engine.pause();
			that._camera.lock();
			that._zoomInButton.setLocked(true);
			that._zoomOutButton.setLocked(true);
			that._uiScene.addChild(that._pauseScreen);
			that._uiScene.addChild(that._pauseButton);
		}
		g_engine.redraw();
	};
	this._buttons.push(this._pauseButton);

	this._doneButton = new CoolButton("Done");
	this._doneButton.setOffset(0, 0);
	this._doneButton._sound = g_assets.getSound('buttonClick');
	this._doneButton.onClick = function() {
		this._sound.play();
		trace("Done button pressed");
		if(that._phase === Game.phases.build) {
			// Build phase
			if(that._object_placed) that._blockMarker.placeBlock();
			that.endBuildPhase();
			that.nextPhase();
		} else if(that._phase === Game.phases.placement) {
		    if(that._object_placed) that._cannonMarker.placeCannon();
		} else {
			trace("Doing nothing, since not in build or placement mode");
		}
	};
	this._buttons.push(this._doneButton);

	this._zoomInButton = new SoftButton(g_assets.getBitmap('button-plus'));
	this._zoomInButton._sound = g_assets.getSound('buttonClick');
	this._zoomInButton.onClick = function() {
		this._sound.play();
		that._camera.zoomIn();
		g_engine.redraw();
	};
	this._buttons.push(this._zoomInButton);

	this._zoomOutButton = new SoftButton(g_assets.getBitmap('button-minus'));
	this._zoomOutButton._sound = g_assets.getSound('buttonClick');
	this._zoomOutButton.onClick = function() {
		this._sound.play();
		that._camera.zoomOut();
		g_engine.redraw();
	};
	this._buttons.push(this._zoomOutButton);

	this._message = new MessageBanner();

	this._domMessage = new DomMessageBanner();
	
	// Create pause text
	var pauseText = this._pauseText = new TextSprite('Germania One',46,"Game paused");
	pauseText.setTextColor(255,255,255,255);
	pauseText.setTextOutlineColor(0,0,0,255);
	this._pauseScreen.addChild(pauseText);
	pauseText = this._pauseText2 = new TextSprite('Germania One',38,"Press pause button to continue"); 
	pauseText.setTextColor(255,255,255,255);
	pauseText.setTextOutlineColor(0,0,0,255);
	this._pauseScreen.addChild(pauseText);

	this._defeatElm = DefeatElement();
	this._defeatElm.setOkClicked(function(){
		that._domMessage.showElement(that._defeatElm.getElement(), 0);
		that._phaseTimer.setTarget(1).reset().start();
	});
	
	Object.seal && Object.seal(this);
	
	trace("Game: created");
};

// Phase enum
Game.phases = (function() {
	var idx = 0;

	return {
		build: idx++,
		placement: idx++,
		battle: idx++,
		defeat: idx++,
		victory: idx++
	};
	
})();

Game.prototype.init = function() {
	trace("Game: init started");

	var all_runlevels = [
		g_runlevel_game_build,
		g_runlevel_game_placement,
		g_runlevel_game_battle,
		g_runlevel_game_defeat,
		g_runlevel_game_victory
	];
	
	// First-run stuff
	if(this._firstRun) {

		// Create runlevels
		//////////////////////

		// Add generic loop first...
		g_engine.add(this.loop,all_runlevels,this);

		// Then add the specific update functions
		g_engine.add(this.updateBuildPhase,g_runlevel_game_build,this);
		g_engine.add(this.updatePlacementPhase,g_runlevel_game_placement,this);
		g_engine.add(this.updateBattlePhase,g_runlevel_game_battle,this);
		g_engine.add(this.updateDefeat,g_runlevel_game_defeat,this);
		g_engine.add(this.updateVictory,g_runlevel_game_victory,this);

		// Tweak runlevel max framerates
		g_engine.setRunlevelMaxFramerate(all_runlevels,0);

		// Add buttons
		g_engine.add(this._pauseButton,all_runlevels);
		g_engine.add(this._zoomInButton,all_runlevels);
		g_engine.add(this._zoomOutButton,all_runlevels);
		g_engine.add(this._doneButton,[g_runlevel_game_build,g_runlevel_game_placement]);

		// Add scenes
		g_engine.add(this._mainScene,all_runlevels);
		g_engine.add(this._uiScene,all_runlevels);
		

		// Allocate some cannonballs, explosions and water splashes to start with
		this._bulletPool.init(function(o){
			g_engine.add(o, g_runlevel_game_battle);
		});
		this._cowBulletPool.init(function(o){
			g_engine.add(o, g_runlevel_game_battle);
		});
		for(var i = 0; i < 40; ++i) {

			var explosion = new HitEffect(HitEffect.types.explosion);
			this._explosions.push(explosion);

			var groundhit = new HitEffect(HitEffect.types.groundHit);
			this._groundExplosions.push(groundhit);
			
			var splash = new HitEffect(HitEffect.types.splash);
			this._splashes.push(splash);
		}

		// Create clouds
		// currently disabled in setting
		if(g_config.effects.clouds.enabled) {
			var num = g_config.effects.clouds.num;
			for(var i = 0; i < num; ++i) {
				var c = new Cloud();
				this._clouds.push(c);
				this._cloudLayer.addChild(c);
			}
		}

		this._firstRun = false;
	}


	// Load map and initialize walls
	//////////////////////////////////

	this._map.init();
	this._level_w = this._map.getWidth() * 2;
	this._level_h = this._map.getHeight() * 2;

	this._walls.init();


	// Reset vars
	///////////////

	this._cannons = [];
	this._cannons_available = g_config.global.numCannons.initial;
	this._cannons_actual = this._cannons_available;
	this._player_score  = 0;
	this._player_shots  = 0;
	this._player_hits   = 0;
	this._player_misses = 0;
	this._player_kills  = 0;
	this._wave_num = 0;
	this._cowProbability = this._initialCowProbability = g_config.global.initialCowProbability;
	this._player_score = 0;
	this._enemies = [];
	this._landTroops = [];
	this._enemy_ships_num = g_config.global.enemies.ships.initial;
	this._enemy_ships_num_perWaveAdd = g_config.global.enemies.ships.perWave;
	this._enemy_transports_num = g_config.global.enemies.transports.initial;
	this._enemy_transports_num_perWaveAdd = g_config.global.enemies.transports.perWave;

	this._firstMegaCow = true;
	this._hasCowzilla = false;


	// Add elements to screen
	///////////////////////////

	g_env.add(this._canvas,1);

	// Update placement of dynamic UI elements
	var that = this;
	g_env.addWindowSizeChangeListener(function(w,h) {
		that.windowResized(g_env.getWidth(),g_env.getHeight());
	});
	
	// Mark all enemies as inactive
	this._shipPool.reset();
	this._transportShipPool.reset();
	this._cowTransportShipPool.reset();
	this._cowPool.reset();
	this._santaCowPool.reset();
	this._cowzillaPool.reset();
	this._megaCowPool.reset();
	this._soldierPool.reset();

	// Clear scene graph
	this._mainScene.clearChildren();

	// Add Map
	this._mainScene.addChild(this._map.getSprite());

	// Add Walls
	this._mainScene.addChild(this._walls.getSprite());

	// Add effects
	this._waterEffectLayer.clearChildren();
	this._mainScene.addChild(this._waterEffectLayer);

	this._bloodEffectLayer.clearChildren();
	this._mainScene.addChild(this._bloodEffectLayer);

	// Add Enemies
	this._enemyLayer.clearChildren();
	this._mainScene.addChild(this._enemyLayer);

	// Add effects
	this._explosionEffectLayer.clearChildren();
	this._mainScene.addChild(this._explosionEffectLayer);
	this._shadowLayer.clearChildren();
	this._mainScene.addChild(this._shadowLayer);

	// Add Bullets
	this._bulletLayer.clearChildren();
	this._mainScene.addChild(this._bulletLayer);

	this._pointerLayer.clearChildren();
	this._mainScene.addChild(this._pointerLayer);

	// Add clouds
	this._cloudLayer.clearChildren();
	for(var i = 0; i < this._clouds.length; ++i) {
		var c = this._clouds[i];
		c.init();
		this._cloudLayer.addChild(c);
	}
	trace("added " + this._clouds.length + " clouds");
	this._mainScene.addChild(this._cloudLayer);

	trace("Game: init complete");
};

/**
 * Perform game startup
 */
Game.prototype.start = function() {
	trace("Game: starting..");

	this.loop();
	g_env.update();
	this.windowResized(g_env.getWidth(),g_env.getHeight());

	this._camera.start();
	this._camera.center();
	this._camera.setZoom(0);

	// Start game in placement phace
	this._phase = 1;
	this.initPlacementPhase();

	this.updateCannonState();
	this.updateCastleState();

};

/**
 * Clean up system state after a game has ended. init and start should be called on another
 * module once this function is run.
 */
Game.prototype.end = function() {
	this._domMessage.setActive(false);
	this._camera.stop();
	g_env.clear();
};

Game.prototype.getMid = function(){
	return this._mid;
};

Game.prototype.getBottom = function(){
	return this._bottom;
};

/**
 * Window resize handler. Repositions pause button, for now.
 */
Game.prototype.windowResized = function(w,h) {

	this.updateScore();

	this._mid = w  >> 1;
	this._bottom = h;

	this._pauseButton.setPosition(w - this._pauseButton.getWidth() - 5,5);
	this._zoomInButton.setPosition(w - this._zoomInButton.getWidth() - 5,this._pauseButton.getY() + this._pauseButton.getHeight() + 5);
	this._zoomOutButton.setPosition(w - this._zoomInButton.getWidth() - 5,this._zoomInButton.getY() + this._zoomInButton.getHeight() + 5);
	this._shelf.setPosition(w * 0.5, h - this._shelf.getHeight() / 2);
	this._doneButton.setPosition(w - 120,h - 50);
	this._countdown_timer.setPosition(w >> 1,40);
	this._pauseText.setPosition(w * 0.5,h * 0.42);
	this._pauseText2.setPosition(w * 0.5,h * 0.525);
	
	this._uiScene.addChild(this._shelf);
	this._uiScene.addChild(this._countdown_timer);
	this._uiScene.addChild(this._shelf);
	this._uiScene.addChild(this._doneButton);
	this._uiScene.addChild(this._zoomInButton);
	this._uiScene.addChild(this._zoomOutButton);
	if(g_engine.isPaused()) this._uiScene.addChild(this._pauseScreen);
	this._uiScene.addChild(this._pauseButton);
	
	this._camera.setBounds(w,h,this._grid_x * this._level_w,this._grid_y * this._level_h);
	this._camera.update();
	this._camera.applyTo(this._mainScene);

	this._message.update(0);
};

//----------------------------------------------------------------------------
//
// Accessors
//
//----------------------------------------------------------------------------

/**
 * Get a reference to the main canvas object
 *
 * @returns a Canvas object
 */
Game.prototype.getCanvas = function() {
	return this._canvas;
};

/**
 * Get a reference to the game's camera object
 *
 * @returns a Camera
 */
Game.prototype.getCamera = function() {
	return this._camera;
};

/**
 * Find the world x coordinate that matches the screen coordinate
 */
Game.prototype.getWorldX = function(screen_x) {
	return this._camera.getWorldX(screen_x);
};

/**
 * Find the world y coordinate that matches the screen coordinate
 */
Game.prototype.getWorldY = function(screen_y) {
	return this._camera.getWorldY(screen_y);
};

/**
 * Get width of a single grid tile
 *
 * @returns a floating point value
 */
Game.prototype.getGridSizeX = function() {
	return this._grid_x;
};

/**
 * Get height of a single grid tile
 *
 * @returns a floating point value
 */
Game.prototype.getGridSizeY = function() {
	return this._grid_y;
};

/**
 * Get level width in number of tiles
 *
 * @returns an integer value
 */
Game.prototype.getLevelWidth = function() {
	return this._level_w;
};

/**
 * Get level height in number of tiles
 *
 * @returns an integer value
 */
Game.prototype.getLevelHeight = function() {
	return this._level_h;
};

/**
 * Get the level width in points instead of number of tiles
 *
 * @returns a floating point value
 */
Game.prototype.getLevelRealWidth = function() {
	return this._level_w * this._grid_x;
};

/**
 * Get the level height in points instead of number of tiles
 *
 * @returns a floating point value
 */
Game.prototype.getLevelRealHeight = function() {
	return this._level_h * this._grid_y;
};

/**
 * Get a direct reference to the current Map object
 *
 * @returns a Map reference
 */
Game.prototype.getMap = function() {
	return this._map;
};

/**
 * Get a direct reference to the current Wall object
 * (name in plural because it sounds more correct. Will change if confusing.)
 */
Game.prototype.getWalls = function() {
	return this._walls;
};

/**
 * Get a direct reference to the main Scene object
 *
 * @returns a Scene object
 */
Game.prototype.getMainScene = function() {
	return this._mainScene;
};

/**
 * Get a direct reference to the pointer layer
 * (layer where stuff like build markers are placed)
 *
 * @returns a SceneNode object
 */
Game.prototype.getPointerLayer = function() {
	return this._pointerLayer;
};

/**
 * Get a direct reference to the user interface layer Scene object
 *
 * @returns a Scene object
 */
Game.prototype.getUIScene = function() {
	return this._uiScene;
};

/**
 * Get a direct reference to the Enemy layer
 *
 * @returns a SceneNode object
 */
Game.prototype.getEnemyLayer = function() {
	return this._enemyLayer;
};

/**
 * Get a direct reference to the Bullet layer
 *
 * @returns a SceneNode object
 */
Game.prototype.getBulletLayer = function() {
	return this._bulletLayer;
};

/**
 * Get a direct reference to the Shadow Effect layer
 *
 * @returns a SceneNode object
 */
Game.prototype.getShadowLayer = function() {
	return this._shadowLayer;
};

/**
 * Get a direct reference to the enemy list
 * NOTE: this should NOT be a needed function, this needs to go away...
 *
 * @returns an Array reference
 */
Game.prototype.getEnemies = function() {
	return this._enemies;
};

/**
 * Find out if the message banner is visible
 *
 * @returns a boolean value
 */
Game.prototype.isMessageVisible = function() {
	return this._message.isActive();
};


//----------------------------------------------------------------------------
//
// Placement logic
//
//----------------------------------------------------------------------------

/**
 * Attempt to place a cannon in game world. Code has been moved here from CannonMarker.js,
 * since actually placing a wall block should be a Game-related operation, not a
 * marker-related one.
 *
 * Note, that the actual call to place a cannon is still done through CannonMarker - the
 * actual logic to actually do it is here.
 * 
 * 
 * @param grid_x Cannon grid X coordinate
 * @param grid_y Cannon grid Y coordinate
 */
Game.prototype.placeCannon = function(grid_x,grid_y) {
	if(!this.isMessageVisible()) {
		if(this._walls.addCannon(grid_x,grid_y)) {
			
			// Successful cannon placement; now, see if we can add another.
			// If we can't, we go to the next phase of the game.
			if(!this._walls.canPlaceCannon()) {
				this.endPlacementPhase();
				this.nextPhase();
			}
		}
	}
};

//----------------------------------------------------------------------------
//
// Game flow logic
//
//----------------------------------------------------------------------------


/**
 * Function for proceeding to the next phase in the game.
 * Unnecessary phases are skipped, game over state is tested for.
 *
 */
Game.prototype.nextPhase = function() {

	trace("next phase: current: " + this._phase);

	switch(this._phase) {
		case Game.phases.build:

			// Build phase

			if(this._walls.areCastlesControlled()) {
				if(this._cannons_available > 0 && this._walls.canPlaceCannon()) {
					this.initPlacementPhase();
					this._phase = Game.phases.placement;
				} else {
					this.initBattlePhase();
					this._phase = Game.phases.battle;
				}
			} else {
				this.initDefeat();
				this._phase = Game.phases.defeat;
			}

		break;
		case Game.phases.placement:

			// Cannon placement phase

			this.initBattlePhase();
			this._phase = Game.phases.battle;

		break;
		case Game.phases.battle:

			// Battle phase
			this.initBuildPhase();
			this._phase = Game.phases.build;

		break;
		case Game.phases.defeat:
		case Game.phases.victory:

			trace("go to menu from defeat or victory");

			// Defeat phase
			// Victory phase
			this.end();
			g_menu.start();

		break;
	}
	
	this.updateCannonState();
	this.updateCastleState();

};

/**
 * Change active state of cannons depending on if they're controlled or not.
 * This changes the sprite's graphics and disables shooting functionality.
 */
Game.prototype.updateCannonState = function() {
	for(var i = 0, l = this._cannons.length; i < l; ++i) {
		this._cannons[i].setActive(this._walls.isCannonControlled(this._cannons[i]));
	}
};

/**
 * Change active state of castles depending on if they're controlled or not.
 * This changes the sprite's graphics.
 */
Game.prototype.updateCastleState = function() {
	for(var i = 0, l = this._castles.length; i < l; ++i) {
		this._castles[i].setActive(this._walls.isCastleControlled(this._castles[i]));
	}
};

/**
 * Set game to build mode.
 */
Game.prototype.initBuildPhase = function() {
	trace("Game: init build phase");

	this._phaseName = "Build phase";
	this._phaseTimer.setTarget(g_config.global.phaseTimeLimit.build).reset().start();

	// Clean up walls after last battle
	this._walls.cleanup();

	// Init and add block marker
	this._blockMarker.init();
	this._blockMarker.setActive(true);
	this._pointerLayer.addChild(this._blockMarker.getSprite());
	this._blockMarker.setPosition(this._camera.getX(),this._camera.getY());

	this._build_drag_handler = g_input.addDragHandler(function(x,y) {
		if(this._blockMarker.testClick(this.getWorldX(x),this.getWorldY(y))) {
			this._camera.lock();
			this._blockMarker.followMouse();
		}
	},null,function(x,y) {
		this._blockMarker.unfollowMouse();
		this._camera.unlock();
	},this);

	this._doneButton.visible = false;
	this._countdown_timer.setText(this._phaseTimer.getRemainingSeconds());
	this._countdown_timer.visible = true;
	
	this._message.showMessage("Build walls!",this._messageDisplayTime);

	this._shelf.startBlockPlacement();
	this._blockMarker.hide();

	// Mark wall tiles as occupied...
	var self = this;
	for(var i = 0; i < this._landTroops.length; ++i) {
		if(this._landTroops[i].isDying()){
			this._landTroops[i].remove();
		}else{
			this._landTroops[i].occupyTiles(this._grid_x, this._grid_y, function(x, y){
				self._walls.markTileOccupied(x, y);
			});
		}
	}
	
	// Update state
	this._object_placed = false;
	
	this.updateCannonState();
	this.updateCastleState();
	
	// Add a darkened background to the map, to highlight walls better
	this._map.getSprite().addChild(this._buildBackground);
	
	g_engine.setRunlevel(g_runlevel_game_build);
};

Game.prototype.buildBlockDropped = function(x,y) {
    this._object_placed = true;
	var marker = this._blockMarker;

	if(marker.isVisible()) {
		marker.placeBlock();
	}

	x = this.getWorldX(x);
	if(g_env.isMobile()) {
		y = this.getWorldY(y - g_config.ui.fingerSize); // NOTE: the number is the height of the average finger...
	} else {
		y = this.getWorldY(y);
	}
	marker.setShape(this._shelf.getBlock().popShapeData());
	marker.show();
	marker.setPosition(x,y);
	marker.followMouse();
	this._shelf.setAllowingItem(false);
};

/**
 * Build-phase specific loop logic
 */
Game.prototype.updateBuildPhase = function() {

	if(this._message.isActive()) {
		this._shelf.visible = false;
	} else {
		this._shelf.visible = true;
		if(this._blockMarker.isVisible()) {
			var show = this._blockMarker.canPlaceBlock();
			if(this._shelf.allowingItem() === false) {
				if(show && !this._shelf.isDragging()) this._shelf.setAllowingItem(true);
			} else if(!show) {
				this._shelf.setAllowingItem(false);
			}
		}
	}
	
	this._blockMarker.update(g_engine.getTimeSync());

	this._walls.updateDestructMarkers(g_engine.getTimeSync());

	this._countdown_timer.setText(this._phaseTimer.getRemainingSeconds());

	// Update shelf
	this._shelf.update(g_engine.getTimeSync());
	this._shelf.setPosition(g_env.getWidth() * 0.5 ,g_env.getHeight() - this._shelf.getHeight() / 2);
	
	
	if(this._walls.areCastlesControlled()) {
		this._doneButton.visible = true;
	}else{
		this._doneButton.visible = false;
	}

	if(g_input.isClicked()) {
		if(this._blockMarker.testClick(this.getWorldX(g_input.getX()),this.getWorldY(g_input.getY()))) {
			this._blockMarker.rotate();
		}
	}
	var that = this;
	if(this._phaseTimer.isComplete()) {
		if(that._object_placed && this._blockMarker.canPlaceBlock()) that._blockMarker.placeBlock();
		this.endBuildPhase();
		this.nextPhase();
	}
};

/**
 * Clean up everything left over from build phase.
 */
Game.prototype.endBuildPhase = function() {
	trace("Game: end build phase");

	this._walls.clearDestructMarkers();
	this._blockMarker.getSprite().removeFromParent();

	g_input.removeDragHandler(this._build_drag_handler);

	this._countdown_timer.visible = false;

	this._shelf.stop();
	this._shelf.visible = false;
	this._blockMarker.hide();
	this._walls.clearWallMarks();
	
	this._walls.clearOccupationMarks();
	this._buildBackground.removeFromParent();
	
	this.updateCannonState();
	this.updateCastleState();
};

/**
 * Set game to placement mode.
 *
 */
Game.prototype.initPlacementPhase = function() {
	trace("Game: init placement phase");


	this._phaseName = "Placement phase";
	this._phaseTimer.setTarget(g_config.global.phaseTimeLimit.placement).reset().start();

	this._cannonMarker.init();
	this._pointerLayer.clearChildren();
	this._pointerLayer.addChild(this._cannonMarker.getMarker());
	this._pointerLayer.addChild(this._cannonMarker.getSprite());

	this._placement_drag_handler =
	g_input.addDragHandler(function(x,y) {
		if(this._cannonMarker.testClick(this.getWorldX(x),this.getWorldY(y))) {
			this._camera.lock();
			this._cannonMarker.followMouse();
		}
	},null,function(x,y) {
		this._cannonMarker.unfollowMouse();
		var that = this;
		setTimeout(function() {
			that._camera.unlock();
		},250);
	},this);

	this._countdown_timer.setText("");
	this._countdown_timer.visible = false;
	
	this._cannonMarker.setPosition(this._camera.getX(),this._camera.getY());	
	this._doneButton.visible = false;

	this._message.showMessage("Place cannons!",this._messageDisplayTime);

	this._shelf.startCannonPlacement();
	this._shelf.setAvailableCannons(this._cannons_available);

	g_engine.setRunlevel(g_runlevel_game_placement);
	
	this._object_placed = false;

	// Mark wall tiles as occupied...
	var self = this;
	for(var i = 0; i < this._landTroops.length; ++i) {
		this._landTroops[i].occupyTiles(this._grid_x, this._grid_y, function(x, y){
			self._walls.markTileOccupied(x, y);
		});
	}
	
	this._map.getSprite().addChild(this._buildBackground);
	
	this._cannonMarker.hide();
};

/**
 * Handle dropping of cannon object
 */
Game.prototype.placeCannonDropped = function(x,y) {
    this._object_placed = true;
	var marker = this._cannonMarker;
	var spr = marker.getSprite();

	if(marker.isVisible()) {
		marker.placeCannon();
	}

	x = this.getWorldX(x);
	if(g_env.isMobile()) {
		 // NOTE: the number is the height of the average finger, in pixels...
		y = this.getWorldY(y - g_config.ui.fingerSize);
	} else {
		y = this.getWorldY(y);
	}
	
	marker.show();
	marker.setPosition(x + (spr.getWidth() * 0.5),y);
	marker.followMouse();
	this._shelf.setAllowingItem(false);
};

/**
 * Placement-phase specific loop logic
 */
Game.prototype.updatePlacementPhase = function() {

	if(this._message.isActive()) {
		this._shelf.visible = false;
	} else {
		if(!this._cannonMarker.isVisible()) {
			this._shelf.visible = true;
		} else {
			var show = this._cannonMarker.canPlaceCannon();
			if(this._shelf.allowingItem() === false) {
				if(show && !this._shelf.isDragging()) this._shelf.setAllowingItem(true);
			} else if(!show) {
				this._shelf.setAllowingItem(false);
			}
		}
	}
	this._cannonMarker.update(g_engine.getTimeSync());
	// Update shelf
	this._shelf.update(g_engine.getTimeSync());
	this._shelf.setPosition(g_env.getWidth() * 0.5,g_env.getHeight() - this._shelf.getHeight() / 2);
	
	if(this._cannons_available <= 1 && this._cannonMarker.isVisible()) {
		this._doneButton.visible = this._cannonMarker.canPlaceCannon();
		this._shelf.visible = false;
	}

	if(this._cannons_available === 0) {
		this.endPlacementPhase();
		this.nextPhase();
	}
	
};

/**
 * Clean up everything left over from placement phase.
 */
Game.prototype.endPlacementPhase = function() {

	trace("Game: end placement phase");
	this._cannonMarker.getMarker().removeFromParent();
	this._cannonMarker.getSprite().removeFromParent();

	g_input.removeDragHandler(this._placement_drag_handler);

	this._shelf.stop();
	this._shelf.visible = false;
	this._cannonMarker.hide();
	
	this._walls.clearOccupationMarks();
	this._buildBackground.removeFromParent();
};

/**
 * Set game to battle phase
 */
Game.prototype.initBattlePhase = function() {
	trace("Game: init battle phase");
	this._phaseName = "Battle phase";
	this._phaseTimer.setTarget(g_config.global.phaseTimeLimit.battle).reset().start();
	this._wave_num++;

	this._ui_wave.setText("Wave: " + this._wave_num);
	this._ui_wave.setPosition(this._ui_score.getWidth() + 40 + this._ui_wave.getWidth() / 2, 40);
	this._uiScene.addChild(this._ui_wave);

	var numShips = this._enemy_ships_num | 0;
	for(var i = 0; i < numShips; ++i) {
		this.spawnShip();
	}
	
	var numTransports = this._enemy_transports_num | 0;
	for(var i = 0; i < numTransports; ++i) {
		this.spawnTransport();
	}

	this.updateCannonState();
	
	this._message.showMessage("Defend your castle against cows!",this._messageDisplayTime);

	g_engine.setRunlevel(g_runlevel_game_battle);

	this._doneButton.visible = false;
	this._countdown_timer.visible = false;
	
	// If the player was holding a placeable when the mode changed, the camera will remain
	// locked. This fixes that bug. Figured this one out while on the can. :3
	this._camera.unlock();
	
};

/**
 * Battle-phase specific loop logic.
 */
Game.prototype.updateBattlePhase = function() {

	var sync = g_engine.getTimeSync();

	for(var i = 0, l = this._cannons.length; i < l; ++i) {
		this._cannons[i].update(sync);
	}
	
	if(this._enemies.length > 0) {

		if(!this._message.isActive()) {

			for(var i = 0; i < this._enemies.length; ++i) {
				var e = this._enemies[i];
				e.update(sync);
			}
			for(var i = 0; i < this._landTroops.length; ++i) {
				this._landTroops[i].update(sync);
			}

			if(g_input.isClicked()) {
				this.fireAvailableCannonAt(this.getWorldX(g_input.getX()),this.getWorldY(g_input.getY()));
			}
			
		}

	} else {

		var activeBullets = false;
		activeBullets = this._bulletPool.hasActive();
		for(var i = 0, l = this._cannons.length; i < l; ++i) {
			var c = this._cannons[i];
			if(c._animation.isPlaying()) activeBullets = true;
		}
		if(!activeBullets) {
			this.endBattlePhase();
		} else {
			for(var i = 0; i < this._landTroops.length; ++i) {
				this._landTroops[i].update(sync);
			}
		}
	}

	this._doneButton.visible = false;


};

/**
 * Clean up after battle phase
 */
Game.prototype.endBattlePhase = function() {

	// Add cannons from this wave
	this._cannons_actual += this._cannons_perWaveAdd;
	this._cannons_available = Math.floor(this._cannons_actual);

	// Add enemies for next wave
	this._enemy_ships_num += this._enemy_ships_num_perWaveAdd;
	this._enemy_transports_num += this._enemy_transports_num_perWaveAdd;

	this._cowProbability = -(1 - this._initialCowProbability)/this._wave_num + 1;

	this.nextPhase();

};

/**
 * Initialize victory mode
 */
Game.prototype.initVictory = function() {
	trace("Game: init victory mode");
	this._countdown_timer.visible = false;
	
};

/**
 * Victory mode loop
 */
Game.prototype.updateVictory = function() {

};

/**
 * Victory mode cleanup
 */
Game.prototype.endVictory = function() {

};

/**
 * Initialize defeat mode
 */
Game.prototype.initDefeat = function() {
	trace("Game: init defeat mode");

	this._phaseName = "Defeat";
	this._phaseTimer.setTarget(1000000).reset().start();

	this._countdown_timer.visible = false;
	
	this._doneButton.visible = false;

	g_engine.setRunlevel(g_runlevel_game_defeat);
	this._defeatElm.setScore(this._player_score);
	this._domMessage.showElement(this._defeatElm.getElement(), 100000);
	this._defeatElm.setFocus();
	// get the twitter button working
	twttr.widgets.load();
};

/**
 * Defeat mode loop
 */
Game.prototype.updateDefeat = function() {
	if(this._phaseTimer.isComplete()) {
		this.endDefeat();
		this.nextPhase();
	}
};

/**
 * Defeat mode cleanup
 */
Game.prototype.endDefeat = function() {
	trace("End defeat mode");
};

/**
 * Generic game main loop
 *
 * Normally, we'd update the appropriate logic loop here, but that's taken care of
 * by the engine, in this case.
 *
 * Instead, this function is run on all runlevels, and is a good place to keep
 * generic code, that always needs to run.
 *
 */
Game.prototype.loop = function() {
	
	var input = g_input;
	var engine = g_engine;
	var sync = engine.getTimeSync();

	// Handle bullet time button (b)  :)
	if(input.isKeyDown(66)) {
		engine.setTimeScale(0.25);
	} else {
		engine.setTimeScale(1.0);
	}
	
	// Update camera
	this._camera.update();
	this._camera.applyTo(this._mainScene);

	if(!this._message.isActive()) {
		this._phaseTimer.update(sync);
	}

	// Some update logic that won't neatly go anywhere else
	for(var i = 0, l = this._castles.length; i < l; ++i) {
		this._castles[i].update(sync);
	}

	for(var i = 0, l = this._explosions.length; i < l; ++i) {
		this._explosions[i].update(sync);
	}

	for(var i = 0, l = this._groundExplosions.length; i < l; ++i) {
		this._groundExplosions[i].update(sync);
	}
	
	for(var i = 0, l = this._splashes.length; i < l; ++i) {
		this._splashes[i].update(sync);
	}

	for(var i = 0, l = this._bloods.length; i < l; ++i) {
		this._bloods[i].update(sync);
	}

	for(var i = 0, l = this._clouds.length; i < l; ++i) {
		this._clouds[i].update(sync);
	}

	for(var i = 0, l = this._scoreMarkers.length; i < l; ++i) {
		this._scoreMarkers[i].update(sync);
	}
	
	for(var i = 0, l = this._damageMarkers.length; i < l; ++i) {
		this._damageMarkers[i].update(sync);
	}

	for(var i = 0; i < this._impactMarkers.length; i++){
		this._impactMarkers[i].update(sync);
	}

	// Update message banners, so we don't have to add it into every runlevel separately
	this._message.update(sync);
	this._domMessage.update(sync);

};

//----------------------------------------------------------------------------
//
// Game event logic
//
//----------------------------------------------------------------------------

/**
 * Check for hits in game area. This function should mostly be called by
 * Bullet.
 *
 * If the enemy hit test fails, this function creates a hit effect appropriate
 * for the hit target.
 */
Game.prototype.bulletHit = function(bullet, owner, x, y, r) {

	var damage = bullet.getDamage();
	
	if(owner instanceof Friendly) {

		// Test primary enemies
		for(var i = 0; i < this._enemies.length; ++i) {
			var e = this._enemies[i];
			if(e.processHit(bullet,x,y)) {
				this.createDamageMarker(x,y,damage,owner);
				this.createExplosion(x,y);
				return;
			}
		}
		
		// Test secondary enemies
		for(var i = 0; i < this._landTroops.length; ++i) {
			var e = this._landTroops[i];
			if(e.processHit(bullet,x,y)) {
				this.createDamageMarker(x,y,damage,owner);
				this.createExplosion(x,y);
				return;
			}
		}

	} else if(owner instanceof Enemy) {
		var needBlood = bullet instanceof CowBullet;

		var hit = this._walls.processHit(x,y,damage, r);
		if(hit.length){
			for(var i = 0; i < hit.length; i++){
				this.createDamageMarker(hit[i][0],hit[i][1],damage,owner);
				if(needBlood){
					this.createBlood(hit[i][0], hit[i][1]);
				}
				this.createExplosion(hit[i][0],hit[i][1]);
			}
			return;
		}

	} else {
		
		throw new Error("Game::bulletHit owner parameter is neither friend nor enemy");
		
	}

	var gx = (x / this._grid_x) | 0;
	var gy = (y / this._grid_y) | 0;
	var mgx = (gx / 2) | 0;
	var mgy = (gy / 2) | 0;
	var t = this._map.getTerrainType(mgx,mgy);


	switch(t) {
		case 1: // Ground
			this.createGroundExplosion(x,y);
		break;
		case 2:
			this.createWaterSplash(x,y);
		break;
	}

};

/**
 * Probability of shooting cows
 * moo~~
 */

Game.prototype.getCowProbability = function(){
	return this._cowProbability;
};

/**
 * Check for melee hits against an object.
 * 
 * Melee hits always deal damage, for now. We might add a saving throw in, later.
 * 
 * @param owner a friend or enemy object (i.e. the object dealing the damage...)
 * @param x x coordinate of target
 * @param y y coordinate of target
 */
Game.prototype.meleeHit = function(owner, x, y) {
	
	if(owner instanceof Enemy) {
		
		// Test for damage against walls
		var damage = owner.getDamage();
		if(this._walls.processHit(x,y,damage)) {
			this.createDamageMarker(x,y,damage,owner);
			//trace("successful melee hit at wall " + x + "," + y);
		}
		
	} else if(owner instanceof Friendly) {
		
		throw new Error("Game::meleeHit friendly hits are not implemented!");
		
	} else {
		
		throw new Error("Game::meleeHit owner parameter is neither friend nor enemy");
		
	}
	
};


//----------------------------------------------------------------------------
//
// Cannon-related functions
//
//----------------------------------------------------------------------------

/**
 * Register a cannon. Wall.js calls this function whenever a cannon has been
 * successfully placed.
 */
Game.prototype.addCannon = function(cannon) {
	this._cannons.push(cannon);
	this._cannons_actual--;
	this._cannons_available--;
	this._shelf.setAvailableCannons(this._cannons_available);
};

/**
 * Register a castle to the Game's castle list
 */
Game.prototype.addCastle = function(castle) {
	this._castles.push(castle);
};


Game.cannonBuffer = [];

/**
 * Find an available cannon, that can fire at coordinates x,y.
 *
 */
Game.prototype.fireAvailableCannonAt = function(x,y) {

	// Fire nearest available cannon	
	var buffer = Game.cannonBuffer;
	buffer.splice(0,buffer.length);
	
	for(var i = 0, l = this._cannons.length; i < l; ++i) {
		var c = this._cannons[i];
		if(c.isReady()) {
			var cx = c.getX() - x;
			var cy = c.getY() - y;
			buffer.push({
				obj: c,
				dist: (cx * cx) + (cy * cy)
			});
		}
	}

	if(buffer.length) {
		buffer.sort(function(a,b) {
			return a.dist - b.dist;
		});

		for(var i = 0, l = buffer.length; i < l; ++i) {
			if(buffer[i].obj.shootAt(x,y)) {
				return;
			}
		}
	}
	
};

/**
 * Try to find an inactive cannonball - if one does not exist, it is added to the pool.
 */
Game.prototype.getBullet = function() {
	return this._bulletPool.get(function(o){
		g_engine.add(o, g_runlevel_game_battle);
	});
};

/**
 * Try to find an inactive cow cannonball - if one does not exist, it is added to the pool.
 */
Game.prototype.getCowBullet = function() {
	return this._cowBulletPool.get(function(o){
		g_engine.add(o, g_runlevel_game_battle);
	});
};

/**
 * Spawn an explosion effect centered on x,y.
 * If an available animation is not found, a new one is created.
 */
Game.prototype.createExplosion = function(x,y) {

	for(var i = 0, l = this._explosions.length; i < l; ++i) {
		var e = this._explosions[i];
		if(e.isReady()) {
			e.spawn(x,y);
			this._explosionEffectLayer.addChild(e.getSprite());
			return;
		}
	}

	e = new HitEffect(HitEffect.types.explosion);
	e.spawn(x,y);
	this._explosionEffectLayer.addChild(e.getSprite());
	this._explosions.push(e);

};

/**
 * Spawn an ground hit effect centered on x,y.
 * If an available animation is not found, a new one is created.
 */
Game.prototype.createGroundExplosion = function(x,y) {

	for(var i = 0, l = this._groundExplosions.length; i < l; ++i) {
		var e = this._groundExplosions[i];
		if(e.isReady()) {
			e.spawn(x,y);
			this._explosionEffectLayer.addChild(e.getSprite());
			return;
		}
	}

	e = new HitEffect(HitEffect.types.groundHit);
	e.spawn(x,y);
	this._explosionEffectLayer.addChild(e.getSprite());
	this._groundExplosions.push(e);

};

/**
 * Spawn a water splash effect with the base at x,y
 * If an available animation is not found, a new one is created.
 */
Game.prototype.createWaterSplash = function(x,y) {

	for(var i = 0, l = this._splashes.length; i < l; ++i) {
		var e = this._splashes[i];
		if(e.isReady()) {
			e.spawn(x,y);
			this._waterEffectLayer.addChild(e.getSprite());
			return;
		}
	}

	e = new HitEffect(HitEffect.types.splash);
	e.spawn(x,y);
	this._waterEffectLayer.addChild(e.getSprite());
	this._splashes.push(e);

};

/**
 * Spawn a blood effect with the base at x,y
 * If an available animation is not found, a new one is created.
 */
Game.prototype.createBlood = function(x,y) {

	for(var i = 0, l = this._bloods.length; i < l; ++i) {
		var e = this._bloods[i];
		if(e.isReady()) {
			e.spawn(x,y);
			this._bloodEffectLayer.addChild(e.getSprite());
			return;
		}
	}

	e = new HitEffect(HitEffect.types.blood);
	e.spawn(x,y);
	this._bloodEffectLayer.addChild(e.getSprite());
	this._bloods.push(e);

};

/*
 * Tell the caller whether it wants a cowzilla
 */
Game.prototype.wantCowzilla = function(){
	return !this._hasCowzilla && this._wave_num > 3;
};


/*
 * Generic function for spawning enemy units
 */
Game.prototype.spawnEnemyFromPool = function(pool, land, x, y){
	var e = pool.get(function(o){});
	if(land){
		this._landTroops.push(e);
	}else{
		this._enemies.push(e);
	}
	this._enemyLayer.addChild(e.getSprite());

	if(x !== undefined && y !== undefined){
		e.spawn(x, y);
	}else{
		e.spawn();
	}
};

/**
 * Spawn a single pirate ship enemy.
 * All created enemies are added to a pool; if an existing enemy is not available,
 * a new one is created.
 */
Game.prototype.spawnShip = function() {
	this.spawnEnemyFromPool(this._shipPool);
};

/**
 * Spawn a single troop transport
 * 
 */
Game.prototype.spawnTransport = function() {
	// half cow, half soldier
	if(Math.random() < this._cowTransportProbability){
		this.spawnEnemyFromPool(this._cowTransportShipPool);
	}else{
		this.spawnEnemyFromPool(this._transportShipPool);
	}
};

/**
 * Spawn a single soldier
 * 
 */
Game.prototype.spawnSoldier = function(x,y) {
	this.spawnEnemyFromPool(this._soldierPool, true, x, y);
};

/**
 * Spawn a single cow
 */
Game.prototype.spawnCow = function(x, y){
	this.spawnEnemyFromPool(this._cowPool, true, x, y);
};

/**
 * Spawn a single santa cow heh
 */
Game.prototype.spawnSantaCow = function(x, y){
	this.spawnEnemyFromPool(this._santaCowPool, true, x, y);
};


/**
 * Spawn a single mega cow muahahahaha
 */
 Game.prototype.spawnMegaCow = function(x, y){
 	if(this._firstMegaCow){
 		this.createImpactText("Mega Cow!");
 		this._firstMegaCow = false;
 	}
 	this.spawnEnemyFromPool(this._megaCowPool, true, x, y);
 };

/*
 * Spawn a single cowzilla D:
 */
Game.prototype.spawnCowzilla = function(x, y){
	if(this._wave_num < 4){
		return;
	}
	this._hasCowzilla = true;
	this.createImpactText("Cowzilla!");
	this._cowzillaSound.play();
	this.spawnEnemyFromPool(this._cowzillaPool, true, x, y);
}

/**
 * Remove an enemy from the active enemies list. The enemy object
 * is still stored in the enemy pool.
 */
Game.prototype.removeEnemy = function(e) {

	var idx = this._enemies.indexOf(e);
	if(idx >= 0) {
		this._enemies.splice(idx,1);
		return;
	}
	idx = this._landTroops.indexOf(e);
	if(idx >= 0) {
		this._landTroops.splice(idx,1);
	}
};

Game.prototype.updateScore = function(){
	this._ui_score.setText("Score: " + this._player_score);
	this._ui_score.setPosition(this._ui_score.getWidth() / 2 + 10, 40);
	this._ui_wave.setPosition(this._ui_score.getWidth() + 40 + this._ui_wave.getWidth() / 2, 40);
	this._uiScene.addChild(this._ui_score);
}

/**
 * Add score to player's score counter
 */
Game.prototype.addScore = function(score) {
	this._player_score += score;
	this.updateScore();
	return this;
};

/**
 * Get player's current score
 */
Game.prototype.getScore = function() {
	return this._player_score;
};

/**
 * Create a score marker - a floating, shiny number that fades out, visually confirming
 * to the player that he's succeeded in getting a certain amount of points.
 * @param x X coordinate to spawn indicator at
 * @param y Y coordinate to spawn indicator at
 * @param score
 * @returns {Game} a reference to self
 */
Game.prototype.createScoreMarker = function(x,y,score) {

	var markers = this._scoreMarkers;
	var marker = null;

	// Try to get a marker outright...
	for(var i = 0, l = markers.length; i < l; ++i) {
		marker = markers[i];
		if(!marker.isActive()) {
			marker.spawn(x,y,score);
			return this;
		}
	}

	marker = new ScoreMarker();
	markers.push(marker);
	marker.spawn(x,y,score);
	return this;
	
};

Game.prototype.createImpactText = function(text){
	var markers = this._impactMarkers;

	for(var i = 0; i < markers.length; i++){
		if(markers[i].isActive()){
			markers[i].spawn(text);
			return this;
		}
	}

	var marker = new ImpactText();
	marker.spawn(text);
	markers.push(marker);
	return this;
}

/**
 * Create a damage marker, much like a score marker - a text that floats upward,
 * to indicate a successful hit. This text indicates how many points of damage were
 * done. 
 * @param x X coordinate to spawn indicator at
 * @param y Y coordinate to spawn indicator at
 * @param damage Amount of damage dealt. This value is rounded to the nearest integer.
 * @param owner Owning object (used to determine marker color)
 * @returns {Game} a reference to self
 */
Game.prototype.createDamageMarker = function(x,y,damage,owner) {
	
	// NOTE: we're padding the damage values to make them look more impressive. EDIT ME!
	var dmg = Math.round(damage * 100);
	var markers = this._damageMarkers;
	var marker = null;
	
	// Try to get a marker outright...
	
	CREATE_MARKER: {
		for(var i = 0, l = markers.length; i < l; ++i) {
			marker = markers[i];
			if(!marker.isActive()) {
				marker.spawn(x,y,dmg);
				break CREATE_MARKER;
			}
		}
	
		marker = new DamageMarker();
		markers.push(marker);
		marker.spawn(x,y,dmg);
	}
	
	// Set color according to ownership..
	if(owner instanceof Enemy) {
		marker.setColor(255,16,16,255);
	} else {
		marker.setColor();
	}
	
	return this;
	
};

/**
 * Find the nearest player-controlled castle, relative to input coordinates
 * 
 * @param from_x number
 * @param from_y number
 * @return {vec2} castle coordinates (or null, if game over) in game-space
 */
Game.prototype.getNearestControlledCastleCoordinates = function(from_x,from_y) {
	var origin = new vec2(from_x,from_y);
	var castles = [];
	for(var i = 0; i < this._castles.length; ++i) {
		var c = this._castles[i];
		if(c.isActive()) {
			castles.push(new vec2(c.getX() + c.getWidth() * 0.5,c.getY() + c.getHeight() * 0.5));
		}
	}
	
	// Find nearest vector
	var nearest = castles[0];
	for(var i = 1; i < castles.length; ++i) {
		if(castles[i].distance2To(origin) < nearest.distance2To(origin)) nearest = castles[i];
	}
	
	return nearest;
};

/**
 * 
 * Find the nearest active wall tile relative to input coordinates.
 * 
 * The input and output of this function is in WORLD COORDINATES.
 * 
 * @param from_x number
 * @param from_y number
 * @return wall tile coordinates in game-space
 */
Game.prototype.getNearestWallTileCoordinates = function(from_x,from_y) {
	
	var gx = this._grid_x;
	var gy = this._grid_y;
	
	var coords = this._walls.getNearestWallTileTo(from_x / gx,from_y / gy);
	if(!coords)return coords;
	coords.x = coords.x * gx + (gx * 0.5);
	coords.y = coords.y * gy + (gy * 0.5);
	return coords; 
	
};
