/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 *
 * AssetLoader.js
 *
 * Augment the g_assets object with getter function
 * Also loads all the assets
 *
 * Allows for loading, initialization and cloning
 * of assets with a simple API. Provides feedback
 * of loading process and allows for creation of more
 * granular debugging systems.
 *
 * Graphics objects are completely dependent on engine/*.
 *
 * creation date: 15-06-2012
 *
 */

"use strict";

/**
 * Class/object for loading game data from the assets object
 *
 * @param xml path to XML file containing the asset listings
 */
var AssetLoader = function(obj){

	var loader = {};

	var _progresscb = function(){},
		_downloadCompletecb = function(){},
		loading = false;
	/**
	 * Commence loading of data,
	 * Added option for skipping sound loading; this might be preferable
	 * if the user has specifically disabled sound, or is running on iOS
	 * (which refuses to download audio unless it's in response to a user
	 * input event).
	 *
	 * @param load_sounds whether to load sounds or not
	 */
	loader.load = function(progresscb, downloadCompletecb) {
		bozz.defaults.preload = true;
		_progresscb = progresscb || _progresscb;
		_downloadCompletecb = downloadCompletecb || _downloadCompletecb;


		// setup images (including images in tileset and animation) and sound
		// but initialise animation and tileset only after downloading is complete
		for(var img in obj.images){
			obj.images[img] = setupImage(obj.images[img]);
		}

		for(var ani in obj.animations){
			if(!obj.images[obj.animations[ani].image]){
				obj.images[obj.animations[ani].image] = setupImage(obj.animations[ani].image);
			}
		}

		for (var ts in obj.tilesets){
			if(!obj.images[obj.tilesets[ts].image]){
				obj.images[obj.tilesets[ts].image] = setupImage(obj.tilesets[ts].image);
			}
		}

		for (var s in obj.sounds){
			obj.sounds[s] = setupSound(obj.sounds[s]);
		}

		loading = true;
		progress();
	};

	function downloadComplete(){
		for (var ani in obj.animations){
			obj.animations[ani] = setupAnimation(obj.animations[ani]);
		}

		for (var ts in obj.tilesets){
			obj.tilesets[ts] = setupTileset(obj.tilesets[ts]);
		}

		_downloadCompletecb();
	}

	obj.getImage = function(id) {
		if(this.images[id]){
			return this.images[id];
		}else{
			trace("No image with id " + id);
		}
	};

	/**
	 * Bitmap convenience function - wraps an image as a Bitmap ImageSource
	 */
	obj.getBitmap = function(id) {
		return new Bitmap(this.getImage(id));
	};

	/**
	 *
	 */
	obj.getAnimation = function(id) {
		if(this.animations[id]){
			return this.animations[id].copy();
		}else{
			trace("No animation with id " + id);
		}
	};

	/**
	 * Return a copy of a loaded tileset
	 */
	obj.getTileset = function(id) {
		if(this.tilesets[id]){
			return this.tilesets[id].copy();
		}else {
			trace("No tileset with id " + id);
		}
	};

	/**
	 * Return the bozz sound object
	 */
	obj.getSound = function(id) {
		if(this.sounds[id]){
			return this.sounds[id];
		}else{
			trace("No sounds with id " + id);
		}
	};

	var imgCount = 0,
		imgLoaded = 0;
	// load sound is not supported because on some browsers it can just fail to load
	// also sounds are not essential to the game

	function progress(){
		if(!loading)return;

		_progresscb(imgLoaded / imgCount);

		if(imgLoaded === imgCount){
			downloadComplete();
		}
	}

	function loadImage(src){
		var img = new Image();
		imgCount++;
		img.onload = function(){
			trace("Loaded image " + src);
			imgLoaded++;
			progress();
		};

		img.onerror = function(e){
			console.log( src );
			trace("Failded to load image with src " + src);
		};
		img.src = src;
		return img;
	}

	function setupImage(imgObj){
		// imgObj should just the src
		// or it's already set up
		if(imgObj instanceof Image){
			return imgObj;
		}
		return loadImage(obj.img_basedir + imgObj);
	}

	function setupAnimation(aniObj){
		if(aniObj instanceof Animation){
			return aniObj;
		}
		var ani = new Animation(obj.images[aniObj.image], aniObj.frame_width, aniObj.frame_height);

		aniObj.frames && ani.setNumFrames(aniObj.frames);
		aniObj.duration && ani.setDuration(aniObj.duration);
		aniObj.framerate && ani.setFramerate(aniObj.framerate);

		ani.setFrameBlending(!!aniObj.smoothing);
		ani.setLooping(!!aniObj.looping);

		return ani;
	}

	function setupTileset(tileobj){
		if(tileobj instanceof Tileset){
			return tileObj;
		}

		var tileset = new Tileset(
			obj.images[tileobj.image],
			tileobj.tile_width || -1,
			tileobj.tile_height || -1,
			tileobj.offset_x || 0,
			tileobj.offset_y || 0);

		for(var t in tileobj.tiles){
			tileset.addName(t, tileobj.tiles[t]);
		}

		return tileset;
	}

	function setupSound(sobj){
		if(sobj instanceof bozz.sound){
			return sobj;
		}
		// sobj is just the src
		return new bozz.sound(obj.snd_basedir + sobj);
	}
	return loader;
};