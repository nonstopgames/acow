/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * AssetLoader.js
 *
 * XML-based game asset loader and initializer.
 * Replaces global proto-object mish-mash and
 * Nonstop Games canonical asset loader code (which
 * was image-specific and fed from the script side,
 * making it unsuitable to be wrapped by this).
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
 * Class/object for loading game data from an XML listing.
 *
 * @param xml path to XML file containing the asset listings
 */
function AssetLoader(xml) {
	if(xml === undefined) throw new Error("AssetLoader requires an XML parameter");

	this._xml_path = xml;
	this._xml_data = null;

	this._load_images = true;
	this._load_sounds = true;

	this._images     = [];
	this._animations = [];
	this._tilesets   = [];
	this._tilemaps   = [];
	this._sounds     = [];

	this._imageQueue = [];
	this._soundQueue = [];

	// Callback
	this.onLoadComplete = function(){};
}

/**
 * Find image resource by looking at the filename
 * Used to skip unnecessary load operations.
 */
AssetLoader.prototype.getImageResBySrc = function(src) {
	for(var i = 0; i < this._images.length; ++i) {
		if(this._images[i].src === src) return this._images[i];
	}

	return null;
};

/**
 * Find sound resource by looking at the filename
 * Used to skip unnecessary load operations.
 */
AssetLoader.prototype.getSoundResBySrc = function(src) {
	for(var i = 0; i < this._sounds.length; ++i) {
		if(this._sounds[i].src === src) return this._sounds[i];
	}

	return null;
};

/**
 * Image resource class
 */
AssetLoader.ImageRes = function(id,image_src) {
	this.id = id || image_src;
	this.image = null;
	this.src = image_src;
};

/**
 * Sound resource class
 */
AssetLoader.SoundRes = function(id,src) {
	this.id = id || src; if(!this.id) throw new Error("No id OR source for sound object!");
	this.sound = null;
	this.src = src;
};

/**
 * Animation resource class
 */
AssetLoader.AnimRes = function(id,imageres) {
	this.id = id;
	this.animation = null;
	this.frames = [];
	this.sequences = [];
	this.image = imageres;
	this.frame_w = 0;
	this.frame_h = 0;
	this.frame_rate = 0;
	this.duration = 0;
	this.smoothing = false;
	this.looping = false;
	this.frames = null;
};

/**
 * Tileset resource class
 */
AssetLoader.TilesetRes = function(id,imageres) {
	this.id = id;
	this.tileset = null;
	this.tiles = [];
	this.image = imageres;
	this.offset_x = 0;
	this.offset_y = 0;
	this.tile_w = 0;
	this.tile_h = 0;
};

/**
 * Tilemap resource class
 */
AssetLoader.TilemapRes = function(id,tilesetresname) {
	this.id = id;
	this.tilemap = obj;
	this.data = [];
	this.tileset = tilesetresname;
};

/**
 * Commence loading of data,
 * Added option for skipping sound loading; this might be preferable
 * if the user has specifically disabled sound, or is running on iOS
 * (which refuses to download audio unless it's in response to a user
 * input event).
 *
 * @param load_sounds whether to load sounds or not
 */
AssetLoader.prototype.load = function(load_sounds, progresscb) {
	bozz.defaults.preload = true;
	this.progresscb = progresscb;
	this._load_sounds = (load_sounds === undefined) ? (true) : (load_sounds == true);
	if(this._xml_data === null) {
		XMLLoader.load(this._xml_path,this.__parseXML,this);
	} else {
		this.__parseXML(this._xml_data);
	}
};

/**
 * Attempt to find image ID by name
 *
 * @returns positive integer or zero on success, -1 on failure.
 */
AssetLoader.prototype.getImageID = function(image_name) {
	for(var i = 0; i < this._images.length; ++i) {
		if(this._images[i].id === image_name) return i;
	}
	return -1;
};

/**
 * Attempt to find sound ID by name
 *
 * @returns positive integer or zero on success, -1 on failure.
 */
AssetLoader.prototype.getSoundID = function(sound_name) {
	for(var i = 0; i < this._sounds.length; ++i) {
		if(this._sounds[i].id === sound_name) return i;
	}
	return -1;
};

/**
 * Attempt to find animation ID by name
 *
 * @returns positive integer or zero on success, -1 on failure.
 */
AssetLoader.prototype.getAnimationID = function(anim_name) {
	for(var i = 0; i < this._animations.length; ++i) {
		if(this._animations[i].id === anim_name) return i;
	}
	return -1;
};

/**
 * Attempt to find tileset ID by name
 *
 * @returns positive integer or zero on success, -1 on failure.
 */
AssetLoader.prototype.getTilesetID = function(tileset_name) {
	for(var i = 0; i < this._tilesets.length; ++i) {
		if(this._tilesets[i].id === tileset_name) return i;
	}
	return -1;
};

/**
 * Attempt to find tilemap ID by name
 *
 * @returns positive integer or zero on success, -1 on failure.
 */
AssetLoader.prototype.getTilemapID = function(tilemap_name) {
	for(var i = 0; i < this._tilemaps.length; ++i) {
		if(this._tilemaps[i].id === tilemap_name) return i;
	}
	return -1;
};

/**
 *
 */
AssetLoader.prototype.getImage = function(id) {
	if(typeof(id) === 'string') {
		var id_str = id;
		id = this.getImageID(id);

		if(id === -1) {
			var str = "No image with id \"" + id_str + "\"";
			alert(str);
			throw new Error(str);
		}

	}

	return this._images[id].image;
};

/**
 * Bitmap convenience function - wraps an image as a Bitmap ImageSource
 */
AssetLoader.prototype.getBitmap = function(id) {
	if(typeof(id) === 'string') {
		var id_str = id;
		id = this.getImageID(id);

		if(id === -1) {
			var str = "No bitmap with id \"" + id_str + "\"";
			alert(str);
			throw new Error(str);
		}

	}

	var img = this._images[id];
	if(!img) {
		var str = "Mega-malfunction: undefined image";
		alert(str);
		throw new Error(str);
	}

	return new Bitmap(img.image);
};

/**
 *
 */
AssetLoader.prototype.getAnimation = function(id) {
	if(typeof(id) === 'string') {
		var id_str = id;
		id = this.getAnimationID(id);

		if(id === -1) {
			var str = "No animation with id \"" + id_str + "\"";
			alert(str);
			throw new Error(str);
		}

	}

	return this._animations[id].animation.copy();
};

/**
 * Return a copy of a loaded tileset
 */
AssetLoader.prototype.getTileset = function(id) {
	//if(id instanceof String) {
	if(typeof(id) === 'string') {
		var id_str = id;
		id = this.getTilesetID(id);

		if(id === -1) {
			var str = "No tileset with id \"" + id_str + "\"";
			alert(str);
			throw new Error(str);
		}

	}

	return this._tilesets[id].tileset.copy();
};

/**
 *
 */
AssetLoader.prototype.getTilemap = function(id) {
	trace("Tilemap loader not yet implemented");
	if(typeof(id) === 'string') {
		var id_str = id;
		id = this.getTilemapID(id);

		if(id === -1) {
			var str = "No tilemap with id \"" + id_str + "\"";
			alert(str);
			throw new Error(str);
		}

	}

	return this._tilemaps[id].tilemap.copy();
};

/**
 *
 */
AssetLoader.prototype.getSound = function(id) {
	if(typeof(id) === 'string') {
		var id_str = id;
		id = this.getSoundID(id);

		if(id === -1) {
			var str = "No sound with id \"" + id_str + "\"";
			alert(str);
			throw new Error(str);
		}
	}
	return this._sounds[id].sound;
};

/**
 * Convert XML document to object, then traverse that looking for image and sound tags..
 */
AssetLoader.prototype.__parseXML = function(xml) {
	var data = null;
	if(xml !== this._xml_data) {
		data = this._xml_data = XMLLoader.toObject(xml);
	} else {
		data = this._xml_data;
	}

	var img_basedir = (data['@img_basedir'] || "");
	var snd_basedir = (data['@snd_basedir'] || "");

	var snd_formats = ['mp3', 'ogg'];

	trace("AssetLoader: image base dir: " + img_basedir + ", sound base dir: " + snd_basedir + ", sound formats: " + snd_formats);

	var that = this;

	///
	/// This is the main load/init function - it's hacky for now, and should be chopped
	/// up into smaller pieces. For now, it tests for each type of supported object
	/// individually, and all processing logic exists there.
	///
	/// This leaves some opportunity for efficiency optimization; for now, though, we
	/// rely on the browser to Do The Right Thing. (This is almost never a good idea)
	///
	var process = function(obj) {

		var id = obj["@id"];
		var tag_processed = false;

		if(that._load_images) {

			if(obj.getTagType() === 'image' || obj.getTagName() === 'image') {

				if(id === undefined) throw new Error("AssetLoader image definitions must have an ID!");

				// Don't process existing images
				if(that.getImageID(id) === -1) {
					var src = img_basedir + obj.getValue();
					var oldres = that.getImageResBySrc(src);
					var res = new AssetLoader.ImageRes(id,src);

					if(oldres !== null && oldres.image !== null) {
						res.image = oldres.image;
					} else {
						res = new AssetLoader.ImageRes(id,src);
						that._imageQueue.push(res);
					}
					that._images.push(res);
				}

				tag_processed = true;

			} else if(obj.getTagType() === 'tileset' || obj.getTagName() === 'tileset') {

				if(id === undefined) throw new Error("AssetLoader tileset definitions must have an ID!");

				if(that.getTilesetID(id) === -1) {
					var imgsrc = img_basedir + obj.image.getValue();
					var tsres = new AssetLoader.TilesetRes(id,imgres);

					tsres.tile_w = (obj["@tile_width"] !== undefined) ? parseFloat(obj["@tile_width"]) : -1;
					tsres.tile_h = (obj["@tile_height"] !== undefined) ? parseFloat(obj["@tile_height"]) : -1;
					tsres.offset_x = (obj["@offset_x"] !== undefined) ? parseFloat(obj["@offset_x"]) : 0;
					tsres.offset_y = (obj["@offset_y"] !== undefined) ? parseFloat(obj["@offset_y"]) : 0;

					for(var i = 0; i < obj.tile.length; ++i) {
						tsres.tiles.push({ index: obj.tile[i]["@index"], id: obj.tile[i]["@id"] });
					}

					var oldres = that.getImageResBySrc(imgsrc);
					if(oldres !== null) {
						tsres.image = oldres;
					} else {
						var imgres = new AssetLoader.ImageRes(undefined,imgsrc);
						tsres.image = imgres;
						that._imageQueue.push(imgres);
					}
					that._tilesets.push(tsres);
				}

				tag_processed = true;

			} else if(obj.getTagType() === 'animation' || obj.getTagName() === 'animation') {

				if(id === undefined) throw new Error("AssetLoader animation definitions must have an ID!");

				if(that.getAnimationID(id) === -1) {
					var imgres = null;
					var imgsrc = img_basedir + obj.image.getValue();
					var oldres = that.getImageResBySrc(imgsrc);
					var animres = new AssetLoader.AnimRes(id,imgres);

					animres.frame_w = parseInt(obj["@frame_width"]);
					animres.frame_h = parseInt(obj["@frame_height"]);
					animres.frame_rate = obj["@framerate"] ? parseFloat(obj["@framerate"]) : null;
					animres.duration = obj["@duration"] ? parseFloat(obj["@duration"]) : null;
					animres.smoothing = obj["@smoothing"] ? (obj["@smoothing"].toLowerCase() === 'true' || parseInt(obj["@smoothing"]) !== 0) : false;
					animres.frames = obj["@frames"] ? parseInt(obj["@frames"]) : null;
					animres.looping = obj["@looping"] ? (obj["@looping"].toLowerCase() === 'true') : false;

					if(oldres !== null) {
						animres.image = oldres;
					} else {
						imgres = new AssetLoader.ImageRes(undefined,imgsrc);
						animres.image = imgres;
						that._imageQueue.push(imgres);
					}
					that._animations.push(animres);

				}

				tag_processed = true;

			} else if(obj.getTagType() === 'tilemap' || obj.getTagName() === 'tilemap') {

				if(id === undefined) throw new Error("AssetLoader tilemap definitions must have an ID!");

				tag_processed = true;

			}
		}

		if(that._load_sounds) {
			if(obj.getTagType() === 'sound' || obj.getTagName() === 'sound') {

				if(id === undefined) throw new Error("AssetLoader sound definitions must have an ID!");

				if(that.getSoundID(id) === -1) {
					var res = new AssetLoader.SoundRes(id,snd_basedir + obj.getValue());
					that._sounds.push(res);
					that._soundQueue.push(res);
				}

				tag_processed = true;

			}
		}


		if(!tag_processed) {
			for(var i = 0; i < obj.getNumChildren(); ++i) {
				process(obj.getChild(i));
			}
		}

	};

	//trace("AssetLoader: processing resource list");
	process(data);
	this.__download();
};

/**
 * Download all queued images and actualize objects.
 *
 */
AssetLoader.prototype.__download = function() {
	trace("Downloading asset data (" + this._imageQueue.length + " images, " + this._soundQueue.length + " sounds)...");

	var that = this;
	this.totalQueueLength = this._imageQueue.length + this._soundQueue.length;

	// Factory functions for callback handlers.

	var getImageCompleteHandler = function(image) {
		return (function() { that.__imageComplete(image); });
	};

	var getImageErrorHandler = function(image) {
		return (function() { that.__imageError(image); });
	};

	var getSoundCompleteHandler = function(sound) {
		return (function() { that.__soundComplete(sound); });
	};

	var getSoundErrorHandler = function(sound) {
		return (function() { that.__soundError(sound); });
	};

	// Just go through all images and sounds and make them load...
	// We could, of course, also make this wholly sequential, but
	// I'm (again) trusting the browser to do a better job of managing
	// resource requests than I could from here.

	if(this._load_images) {
		for(var i = 0; i < this._imageQueue.length; ++i) {
			var img = new Image();
			var res = this._imageQueue[i];
			img.onload = getImageCompleteHandler(res);
			img.onerror = getImageErrorHandler(res);
			img.src = res.src;
			res.image = img;
		}
	}

	if(this._load_sounds) {
		for(var i = 0; i < this._soundQueue.length; ++i) {
			var res = this._soundQueue[i];
			var snd = new bozz.sound(res.src);
			res.sound = snd;
			snd.load(/*getSoundCompleteHandler(res),getSoundErrorHandler(res)*/);
			setTimeout(getSoundCompleteHandler(res),0);
		}
	}

	// Test for empty list, just in case...
	this.__resourceLoaded();

};

/**
 * Function to call after resource has been loaded.
 * This checks if download queues are empty; if they are, calls
 * the __downloadComplete() function, which calls the onLoadComplete
 * handler.
 */
AssetLoader.prototype.__resourceLoaded = function(res) {

	// Remove event listeners from resource object
	if(res instanceof AssetLoader.ImageRes) {
		res.image.onload = null;
		res.image.onerror = null;
	} else if(res instanceof AssetLoader.SoundRes) {
		// As Bazz is written, there's really no smart way to go about this for now.
	}

	if ( this.progresscb ) {
		this.progresscb( 1 - ((this._imageQueue.length + this._soundQueue.length) / this.totalQueueLength) );
	}

	if(this._imageQueue.length === 0 && this._soundQueue.length === 0) {
		this.__downloadComplete();
	}
};

/**
 * Handler for a successful image download
 *
 * @param obj an AssetLoader.ImageRes object
 */
AssetLoader.prototype.__imageComplete = function(obj) {
	//trace("Loaded image " + obj.src);
	this._imageQueue.splice(this._imageQueue.indexOf(obj),1);
	this.__resourceLoaded(obj);
};

/**
 * Handler for an image download failure
 *
 * @param obj an AssetLoader.ImageRes object
 */
AssetLoader.prototype.__imageError = function(obj) {
	trace("Failed to load image " + obj.src + ", retrying...");
	obj.image.src = obj.src;

	// this._imageQueue.splice(this._imageQueue.indexOf(obj),1);
	// this.__resourceLoaded(obj);
};

/**
 * Handler for a successful sound download
 *
 * @param obj a AssetLoader.SoundRes object
 */
AssetLoader.prototype.__soundComplete = function(obj) {
	// trace("Loaded sound " + obj.src + " (" + obj.sound.sound.currentSrc + ")"); // TODO: don't try this at home, kids...
	this._soundQueue.splice(this._soundQueue.indexOf(obj),1);
	this.__resourceLoaded(obj);
};

/**
 * Handler for a sound download failure.
 *
 * @param obj a AssetLoader.SoundRes object
 */
AssetLoader.prototype.__soundError = function(obj) {
	trace("Failed to load sound " + obj.src);
	this._soundQueue.splice(this._soundQueue.indexOf(obj),1);
	this.__resourceLoaded(obj);
};

/**
 * Processing function, which gets called after every asset in the queue
 * has either been downloaded or 404d.
 * Sets up animations, tilesets and stuff like that :)
 */
AssetLoader.prototype.__downloadComplete = function() {
	trace("Data loaded, initializing...");

	// Initialize animations, tilesets and tilemaps (in that order).
	for(var i = 0; i < this._animations.length; ++i) {
		var animres = this._animations[i];
		if(!animres.animation) {
			var a = new Animation(animres.image.image,animres.frame_w,animres.frame_h);

			if(animres.frames) {
				a.setNumFrames(animres.frames);
			}

			if(animres.duration) {
				a.setDuration(animres.duration);
			} else if(animres.frame_rate) {
				a.setFramerate(animres.frame_rate);
			}

			if(animres.smoothing) {
				a.setFrameBlending(animres.smoothing == true);
			}

			a.setLooping(animres.looping === true);

			animres.animation = a;
		}
	}

	for(var i = 0; i < this._tilesets.length; ++i) {
		var tsres = this._tilesets[i];
		if(!tsres.tileset) {
			var ts = new Tileset(tsres.image.image,tsres.tile_w,tsres.tile_h,tsres.offset_x,tsres.offset_y);
			for(var j = 0; j < tsres.tiles.length; ++j) {

				// 29-08-2012: Added support for self-randomizing tilesets:
				if(tsres.tiles[j].index.indexOf(',') !== -1) {
					var idx_array = tsres.tiles[j].index.trim().split(',');
					for(var k = 0; k < idx_array.length; ++k) {
						idx_array[k] = parseInt(idx_array[k]);
					}
					ts.addName(tsres.tiles[j].id,idx_array);
				} else {
					ts.addName(tsres.tiles[j].id,parseInt(tsres.tiles[j].index));
				}
			}
			tsres.tileset = ts;
		}
	}

	for(var i = 0; i < this._tilemaps.length; ++i) {

	}

	trace("Assets ready.");
	this.onLoadComplete.call(this);
};
