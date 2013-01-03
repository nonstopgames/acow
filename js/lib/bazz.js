/**
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * Bazz.js
 * HTML 5 Audio library
 *
 * Based on Buzz.js version 1.0.5 Beta
 * 
 * Refactored for performance.
 * Reduced amount of unnecessary function objects.
 * Moved all dynamic object methods to prototype.
 * Removed unnecessary checks by refactoring object assignments.
 * Added sound load callbacks
 * Fixed handling of default arguments
 * Added multichannel single-use playback support
 *
 * Contact: plindstr at abo dot fi
 * Released under MIT licence
 *
 * Buzz.js copyright header reproduced below (as per licence requirements):
 *
 * ----------------------------------------------------------------------------
 * Buzz, a Javascript HTML5 Audio library
 * v 1.0.5 beta
 * Licensed under the MIT license.
 * http://buzz.jaysalvat.com/
 * ----------------------------------------------------------------------------
 * Copyright (C) 2011 Jay Salvat
 * http://jaysalvat.com/
 * ----------------------------------------------------------------------------
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files ( the "Software" ), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * ----------------------------------------------------------------------------
 */

"use strict";

(function(ns) {

	"use strict";

	var bazz = null;
	bazz = {

		// Global internals
		sounds: [],
		groups: [],
		channels: [],
		playback_enabled:true,

		caps: {
			sound: false,
			ogg:   false,
			mp3:   false,
		},

		defaults: {
			autoplay: false,
			duration: 5000,
			formats: [],
			loop: false,
			placeholder: '--',
			preload: 'metadata',
			volume: 80
		},

		types: {
			'mp3': 'audio/mpeg',
			'ogg': 'audio/ogg',
		},

		// Types
		sound: function(src, options) {
			this.pid = 0;
			this.events = [];
			this.eventsOnce = {};
			this.options = options || bazz.defaults;
			this.sound = null;
			this.sources = [];
			this.src = src;
			this.sounds = [];

			// Initialize
			if(bazz.caps.sound) {

				// Ensure we have sane default values
				for(var f in bazz.defaults) {
					if(bazz.defaults.hasOwnProperty(f)) {
						this.options[f] = this.options[f] || bazz.defaults[f];
					}
				}
				// hack to allow fake parallel audios
				// now we play one of sounds instead of sound
				for(var ss = 0; ss < 5; ss++){
					var s = document.createElement('audio');
					if(src instanceof Array) {
						for(var j in src) {
							if(src.hasOwnProperty(j)) {
								this.sources.push(addSource(s, src[j]));
							}
						}
					} else if(this.options.formats.length) {
						for(var k in this.options.formats) {
							if(this.options.formats.hasOwnProperty(k)) {
								// XXX: We should make sure that the sound format is supported before adding the source
								addSource(s, src + '.' + this.options.formats[k]);
							}
						}
					} else {
						addSource(s, src);
					}
					this.sounds.push(s);
				}
				this.sound = document.createElement('audio');

				// Automatically add all possible sources
				if(src instanceof Array) {
					for(var j in src) {
						if(src.hasOwnProperty(j)) {
							this.sources.push(addSource(this.sound, src[j]));
						}
					}
				} else if(this.options.formats.length) {
					for(var k in this.options.formats) {
						if(this.options.formats.hasOwnProperty(k)) {
							// XXX: We should make sure that the sound format is supported before adding the source
							addSource(this.sound, src + '.' + this.options.formats[k]);
						}
					}
				} else {
					addSource(this.sound, src);
				}

				if(this.options.loop) {
					this.loop();
				}

				if(this.options.autoplay) {
					this.sound.autoplay = 'autoplay';
				} else {
					this.sound.autoplay = bazz.defaults.autoplay;
				}

				// Handle preload tag
				if(this.options.preload === true) {
					this.sound.preload = 'auto';
				} else if(this.options.preload === false) {
					this.sound.preload = 'none';
				} else if(this.options.preload != null) {
					this.sound.preload = this.options.preload;
				} else {
					this.sound.preload = bazz.defaults.preload;
				}

				this.setVolume(this.options.volume);

				bazz.sounds.push( this );

			}

		},

		group: function(sounds) {
			this.sounds = argsToArray(sounds, arguments);
		},

		// Methods
		setEnabled: function(b) {
			this.playback_enabled = (b == true);
			return this;
		},

		isEnabled: function() {
			return this.playback_enabled;
		},

		setSupportedFormats: function(array) {
			this.defaults.formats = array.slice();
			return this;
		},
 
 		init: function() {
			var el = document.createElement('audio');
			this.caps.sound = !!el.canPlayType;
			if(this.caps.sound) {
				this.caps.ogg = el.canPlayType('audio/ogg; codecs="vorbis"');
				this.caps.mp3 = el.canPlayType('audio/mpeg;');
			}
			this.setNumChannels(4);
			return this;
		},

		setNumChannels: function(num) {
			var c = this.channels.length;
			if(c > num) this.channels.splice(num,c - num);
			else {
				for(var i = 0; i < 4; ++i) {
					this.channels.push({
						el: document.createElement('audio'),
						end_time: 0,
						src: ''
					});
				}
			}
			return this;
		},

		getNumChannels: function() {
			return this.channels.length;
		},

		all: function() {
			return new bazz.group(bazz.sounds);
		},

		isSupported: function() {
			return this.caps.sound;
		},

		isMP3Supported: function() {
			return this.caps.mp3;
		},

		toTimer: function(time, withHours) {
			var h, m, s;
			h = Math.floor(time / 3600);
			h = isNaN(h) ? '--' : (h >= 10) ? h : '0' + h;
			m = withHours ? Math.floor(time / 60 % 60) : Math.floor(time / 60);
			m = isNaN(m) ? '--' : (m >= 10) ? m : '0' + m;
			s = Math.floor(time % 60);
			s = isNaN(s) ? '--' : (s >= 10) ? s : '0' + s;
			return withHours ? h + ':' + m + ':' + s : m + ':' + s;
		},

		fromTimer: function(time) {
			var splits = time.toString().split(':');
			if(splits && splits.length == 3) {
				time = (parseInt(splits[ 0 ], 10) * 3600) + (parseInt(splits[1], 10) * 60) + parseInt(splits[2], 10);
			}
			if(splits && splits.length == 2) {
				time = (parseInt(splits[ 0 ], 10) * 60) + parseInt(splits[1], 10);
			}
			return time;
		},

		toPercent: function(value, total, decimal) {
			var r = Math.pow(10, decimal || 0);

			return Math.round(((value * 100) / total) * r) / r;
		},

		fromPercent: function(percent, total, decimal) {
			var r = Math.pow(10, decimal || 0);

			return  Math.round(((total / 100) * percent) * r) / r;
		},

		/*
		 * Multi-channel sound support hack.
		 * Bazz sound objects can be passed in, and they will be allocated
		 * a single-use slot in the channel array. This is useful for
		 * sound effects, especially in situations where you don't care about
		 * whether or not the sound will play, and won't be reacting on it when
		 * it's finished. Example: explosion and shooting sound effects.
		 */
		play_mc: function(sound) {

			// Find available channel
			if(this.playback_enabled && sound instanceof bazz.sound) {
				
				var tm = time();
				
				for(var i = 0; i < this.channels.length; ++i) {
					var c = this.channels[i];
					if(c.end_time <= tm) {
						// Set audio source, load and play (hopefully the sound was preloaded)
						c.end_time = (sound.sound.duration * 1000) + tm;
						c.el.src = sound.sound.currentSrc;
						c.el.volume = sound.sound.volume;
						c.el.play();
						return;
					} else {
					}
				}
			}
		}
	};

	var time = Date.now || function() { return +(new Date.now()); };
	
	bazz.init();  // Initialize the library

	//
	// Define type methods
	// Initialize methods to null/no-ops in a safe way
	// (we want the usage of the sound object code to
	//  be side-effect free even if the sound system
	//  is not available (i.e. if the audio tag doesn't
	//  exist)).
	//

	// Helpers
	var thiscbfn = function(callback) {
		if(callback != undefined)
			callback();
		return this;
	};
	
	var thisfn = function() { return this; };
	var nullfn = function() { return null; };
	var truefn = function() { return true; };
	var zerofn = function() { return 0;    };

	// Sound
	bazz.sound.prototype = {
		load                   : thiscbfn,
		play                   : thisfn,
		play_mc                : thisfn,
		togglePlay             : thisfn,
		pause                  : thisfn,
		isPaused               : zerofn,
		stop                   : thisfn,
		isEnded                : truefn,
		loop                   : thisfn,
		unloop                 : thisfn,
		mute                   : thisfn,
		unmute                 : thisfn,
		toggleMute             : thisfn,
		isMuted                : zerofn,
		setVolume              : thisfn,
		getVolume              : zerofn,
		increaseVolume         : thisfn,
		decreaseVolume         : thisfn,
		setTime                : thisfn,
		getTime                : zerofn,
		setPercent             : thisfn,
		getPercent             : zerofn,
		setSpeed               : thisfn,
		getSpeed               : zerofn,
		getDuration            : nullfn,
		getPlayed              : nullfn,
		getBuffered            : nullfn,
		getSeekable            : nullfn,
		getErrorCode           : zerofn,
		getErrorMessage        : nullfn,
		getStateCode           : zerofn,
		getStateMessage        : nullfn,
		getNetworkStateCode    : zerofn,
		getNetworkStateMessage : nullfn,
		set                    : thisfn,
		get                    : nullfn,
		bind                   : thisfn,
		unbind                 : thisfn,
		bindOnce               : thisfn,
		trigger                : thisfn,
		fadeTo                 : thisfn,
		fadeIn                 : thisfn,
		fadeOut                : thisfn,
		fadeWith               : thisfn,
		whenReady              : thisfn
	};

	// Group
	bazz.group.prototype = {
		getSounds      : nullfn,
		add            : thisfn,
		remove         : thisfn,
		load           : thisfn,
		play           : thisfn,
		togglePlay     : thisfn,
		pause          : thisfn,
		stop           : thisfn,
		mute           : thisfn,
		unmute         : thisfn,
		toggleMute     : thisfn,
		setVolume      : thisfn,
		increaseVolume : thisfn,
		decreaseVolume : thisfn,
		loop           : thisfn,
		unloop         : thisfn,
		setTime        : thisfn,
		setDuration    : thisfn,
		set            : thisfn,
		bind           : thisfn,
		bindOnce       : thisfn,
		trigger        : thisfn,
		fade           : thisfn,
		fadeIn         : thisfn,
		fadeOut        : thisfn
	};

	// Helpers
	var fn = function(caller,func) {
		var args = argsToArray(null,arguments);
		// Get rid of caller and func
		args.shift();
		args.shift();

		for(var i = 0; i < caller.sounds.length; ++i) {
			caller.sounds[i][func].apply(caller.sounds[i],args);
		}
	};
	
	var getExt = function(filename) {
		return filename.split('.').pop();
	};

	var addSource = function(sound,src) {
		var source = document.createElement('source');
		source.src = src;
		if(bazz.types[ getExt(src) ]) {
			source.type = bazz.types[ getExt(src) ];
		}
		sound.appendChild(source);
		return source;
	};

	var argsToArray = function(array,args) {
		return (array instanceof Array) ? array : Array.prototype.slice.call(args);
	};

	// Map actual methods if HTML5 audio is supported
	if(bazz.caps.sound) {

		var p = null;

		// Sound
		////////////

		p = bazz.sound.prototype;

		p.load = function(callback,error_callback) {
			var that = this;
			var snd = this.sound;
			var listener = null;
			var error_listener = null;
			var error_count = 0;
			this.loaded = 0;


			for(var i = 0; i < this.sources.length; ++i) {
				this.sources[i].addEventListener('error',source_error_handler);
			}
			
			for(var i = 0; i < 5; i++){
				this.sounds[i].addEventListener('loadeddata',function(){
					that.loaded++;
				});
			}
			
			var source_error_handler = function(e) {
				error_count++;
				trace("error handler: count: " + error_count);
				if(error_count >= that.sources.length) {
					// Assume loading failed
					if(error_callback !== undefined) {
						error_callback.call(that);
					}
				}
			};
		
			// Add load error handler
			if(error_callback !== undefined) {
				error_listener = function() {
					snd.removeEventListener('error',error_listener);
					error_callback(that);
				};
				snd.addEventListener('error',error_listener);
			}
			
			// Add load success handler
			if(callback !== undefined) {
				if(this.options.preload === true) {
					listener = function() {
						if(error_listener !== null) {
							snd.removeEventListener('error',error_listener);
						}
						snd.removeEventListener('loadeddata',listener);
						callback(that);
					};
					snd.addEventListener('loadeddata',listener);
				} else if(this.options.preload === 'metadata') {
					listener = function() {
						if(error_listener !== null) {
							snd.removeEventListener('error',error_listener);
						}
						snd.removeEventListener('loadedmetadata',listener);
						callback(that);
					};
					snd.addEventListener('loadedmetadata',listener);
				} else {  // Data is not supposed to be preloaded at all..
					callback(that);
				}
			}
			
			snd.load();
            return this;
		};

		p.clone = function() {
			var clone = new Bazz.sound(this.src,this.options);
			clone.load();
			return clone;
		};
		
		p.play = function() {
			// play after loaded to avoid crash
			if(bazz.playback_enabled && this.loaded && this.loaded === 5) {
				var s = this.sounds[0];
				if(!s.paused && (!s.ended)){
					for(var i = 1; i < this.sounds.length; i++){
						if(this.sounds[i].paused || this.sounds[i].ended){
							s = this.sounds[i];
							break;
						}
						if(s.currentTime > this.sounds[i].currentTime){
							s = this.sounds[i];
						}
					}
				}
				s.pause();
				s.currentTime = 0;
				s.play();
			}
            return this;
		};

		/**
		 * Play sound using the hacked-in multichannel playback functionality.
		 * This copies the sound object's parameters to an available playback
		 * buffer (if one exists) and plays back that sound object. Normal event
		 * callbacks, queries and modifications on this object's properties
		 * will NOT work for the playing sound file. Useful for sound effects in
		 * a game (so that you don't need multiple instances of the sound element,
		 * or something even more wasteful). Sound will also not be loopable in
		 * the multichannel playback mode.
		 */
		p.play_mc = function() {
			if(bazz.playback_enabled) {
				bazz.play_mc(this);
			}
			return this;
		};

		p.togglePlay = function() {
			if(this.sound.paused) {
				this.sound.play();
			} else {
				this.sound.pause();
			}
			return this;
		};

		p.pause = function() {
			this.sound.pause();
			return this;
		};

		p.isPaused = function() {
			return this.sound.paused;
		};

		p.stop = function() {
			this.setTime(this.getDuration());
            this.sound.pause();
            return this;
		};

		p.isEnded = function() {
			return this.sound.ended;
		};

		p.loop = function() {
			this.sound.loop = 'loop';
			this.bind('ended.bazzloop', function() {
				this.currentTime = 0;
				this.play();
			});
			return this;
		};

		p.unloop = function() {
			this.sound.removeAttribute( 'loop' );
			this.unbind( 'ended.bazzloop' );
			return this;
		};

		p.mute = function() {
			this.sound.muted = true;
			return this;
		};

		p.unmute = function() {
			this.sound.muted = false;
			return this;
		};

		p.toggleMute = function() {
			this.sound.muted = !this.sound.muted;
			return this;
		};

		p.isMuted = function() {
			return this.sound.muted;
		};

		p.setVolume = function(volume) {
			if(volume < 0) {
				volume = 0;
			}
			if(volume > 100) {
				volume = 100;
			}

			this.volume = volume;
			this.sound.volume = volume / 100;
			return this;
		};

		p.getVolume = function() {
			return this.volume;
		};

		p.increaseVolume = function(value) {
			return this.setVolume(this.volume + (value || 1));
		};

		p.decreaseVolume = function(value) {
			return this.setVolume(this.volume - (value || 1));
		};

		p.setTime = function() {
			this.whenReady( function() {
                this.sound.currentTime = time;
            });
            return this;
		};

		p.getTime = function() {
			var time = Math.round( this.sound.currentTime * 100 ) / 100;
			return isNaN( time ) ? bazz.defaults.placeholder : time;
		};

		p.setPercent = function() {
			return this.setTime(bazz.fromPercent(percent, this.sound.duration));
		};

		p.getPercent = function() {
			var percent = Math.round(bazz.toPercent(this.sound.currentTime, this.sound.duration));
            return isNaN(percent) ? bazz.defaults.placeholder : percent;
		};

		p.setSpeed = function() {
			this.sound.playbackRate = duration;
		};

		p.getSpeed = function() {
			return this.sound.playbackRate;
		};

		p.getDuration = function() {
			var duration = Math.round(this.sound.duration * 100) / 100;
            return isNaN(duration) ? bazz.defaults.placeholder : duration;
		};

		p.getPlayed = function() {
			return timerangeToArray(this.sound.played);
		};

		p.getBuffered = function() {
			return timerangeToArray(this.sound.buffered);
		};

		p.getSeekable = function() {
			return timerangeToArray(this.sound.seekable);
		};

		p.getErrorCode = function() {
			if(this.sound.error) {
				return this.sound.error.code;
			}
			return 0;
		};

		p.getErrorMessage = function() {
			switch(this.getErrorCode()) {
				case 1:
					return 'MEDIA_ERR_ABORTED';
				case 2:
					return 'MEDIA_ERR_NETWORK';
				case 3:
					return 'MEDIA_ERR_DECODE';
				case 4:
					return 'MEDIA_ERR_SRC_NOT_SUPPORTED';
				default:
					return null;
			}
		};

		p.getStateCode = function() {
			return this.sound.readyState;
		};

		p.getStateMessage = function() {
			switch(this.getStateCode()) {
				case 0:
					return 'HAVE_NOTHING';
				case 1:
					return 'HAVE_METADATA';
				case 2:
					return 'HAVE_CURRENT_DATA';
				case 3:
					return 'HAVE_FUTURE_DATA';
				case 4:
					return 'HAVE_ENOUGH_DATA';
				default:
					return null;
			}
		};

		p.getNetworkStateCode = function() {
			return this.sound.networkState;
		};

		p.getNetworkStateMessage = function() {
			switch(this.getNetworkStateCode()) {
				case 0:
					return 'NETWORK_EMPTY';
				case 1:
					return 'NETWORK_IDLE';
				case 2:
					return 'NETWORK_LOADING';
				case 3:
					return 'NETWORK_NO_SOURCE';
				default:
					return null;
			}
		};

		p.set = function(key, value) {
			this.sound[key] = value;
			return this;
		};

		p.get = function() {
			return key ? this.sound[ key ] : this.sound;
		};

		p.bind = function(types, func) {
			types = types.split(' ');

			var that = this;
			var efunc = function(e) { func.call(that, e); };

			for(var t = 0; t < types.length; t++) {
				var type = types[ t ];
				var idx = type;
				type = idx.split( '.' )[ 0 ];

				this.events.push({ idx: idx, func: efunc });
				this.sound.addEventListener( type, efunc, true );
			}
			return this;
		};

		p.unbind = function(types) {
			types = types.split(' ');

			for(var t = 0; t < types.length; t++) {
				var idx = types[t];
				var type = idx.split('.')[ 0 ];

				for(var i = 0; i < this.events.length; i++) {
					var namespace = this.events[ i ].idx.split('.');
					if(this.events[i].idx == idx || ( namespace[1] && namespace[1] == idx.replace('.', ''))) {
						this.sound.removeEventListener(type, this.events[i].func, true);
						delete this.events[i];
					}
				}
			}
			return this;
		};

		p.bindOnce = function(type, func) {
			var that = this;

			eventsOnce[pid++] = false;
			this.bind(pid + type, function() {
				if(!eventsOnce[pid]) {
					eventsOnce[pid] = true;
					func.call(that);
				}
				that.unbind(pid + type);
			});
			return this;
		};

		p.trigger = function(types) {
			types = types.split(' ');

			for(var t = 0; t < types.length; t++) {
				var idx = types[t];

				for(var i = 0; i < events.length; i++) {
					var eventType = events[i].idx.split('.');
					if(events[i].idx == idx || (eventType[0] && eventType[0] == idx.replace('.', ''))) {
						var evt = document.createEvent('HTMLEvents');
						evt.initEvent(eventType[0], false, true);
						this.sound.dispatchEvent(evt);
					}
				}
			}
			return this;
		};

		p.fadeTo = function(to, duration, callback) {
			if(duration instanceof Function) {
				callback = duration;
				duration = bazz.defaults.duration;
			} else {
				duration = duration || bazz.defaults.duration;
			}

			var from = this.volume;
			var delay = duration / Math.abs(from - to);
			var that = this;
			this.play();

			var doFade = function() {
				setTimeout(function() {
					if(from < to && that.volume < to) {
						that.setVolume( that.volume += 1 );
						doFade();
					} else if(from > to && that.volume > to) {
						that.setVolume( that.volume -= 1 );
						doFade();
					} else if(callback instanceof Function) {
						callback.apply(that);
					}
				}, delay);
			};

			this.whenReady(function() {
				doFade();
			});

			return this;
		};

		p.fadeIn = function(duration,callback) {
			return this.setVolume(0).fadeTo(100, duration, callback);
		};

		p.fadeOut = function(duration,callback) {
			return this.fadeTo(0, duration, callback);
		};

		p.fadeWith = function(sound, duration) {
			this.fadeOut(duration, function() {
				this.stop();
			});

			sound.play().fadeIn(duration);
			return this;
		};

		p.whenReady = function(func) {
			var that = this;
			if(this.sound.readyState === 0) {
				this.bind('canplay.bazzwhenready', function() {
					func.call(that);
				});
			} else {
				func.call(that);
			}
			return this;
		};

		// Group
		////////////

		p = bazz.group.prototype;

		p.getSounds = function() {
			return this.sounds;
		};

		p.add = function(soundArray) {
			soundArray = argsToArray(soundArray, arguments);
			for(var a = 0; a < soundArray.length; a++) {
				this.sounds.push(soundArray[a]);
			}
			return this;
		};

		p.remove = function(soundArray) {
			soundArray = argsToArray(soundArray, arguments);
			for(var a = 0; a < soundArray.length; a++) {
				for(var i = 0; i < this.sounds.length; i++) {
					if(this.sounds[i] == soundArray[a]) {
						delete this.sounds[i];
						break;
					}
				}
			}
		};

		p.load = function() {
			fn(this,'load');
			return this;
		};

		p.play = function() {
			fn(this,'play');
			return this;
		};

		p.togglePlay = function() {
			fn(this,'togglePlay');
			return this;
		};

		p.pause = function(time) {
			fn(this,'pause',time);
			return this;
		};

		p.stop = function() {
			fn(this,'stop');
			return this;
		};

		p.mute = function() {
			fn(this,'mute');
			return this;
		};

		p.unmute = function() {
			fn(this,'unmute');
			return this;
		};

		p.toggleMute = function() {
			fn(this,'toggleMute');
			return this;
		};

		p.setVolume = function(volume) {
			fn(this,'setVolume',volume);
			return this;
		};

		p.increaseVolume = function(value) {
			fn(this,'increaseVolume',value);
			return this;
		};

		p.decreaseVolume = function(value) {
			fn(this,'decreaseVolume',value);
			return this;
		};

		p.loop = function() {
			fn(this,'loop');
			return this;
		};

		p.unloop = function() {
			fn(this,'unloop');
			return this;
		};

		p.setTime = function() {
			fn(this,'setTime');
			return this;
		};

		p.setDuration = function(duration) {
			fn(this,'setDuration',duration);
			return this;
		};

		p.set = function(key,value) {
			fn(this,'set',key,value);
			return this;
		};

		p.bind = function(key,value) {
			fn(this,'get',key,value);
			return this;
		};

		p.bindOnce = function(type,func) {
			fn(this,'bindOnce',type,func);
			return this;
		};

		p.trigger = function(type) {
			fn(this,'trigger',type);
			return this;
		};

		p.fade = function(from,to,duration,callback) {
			fn(this,'fade',from,to,duration,callback);
			return this;
		};

		p.fadeIn = function(duration,callback) {
			fn(this,'fadeIn',duration,callback);
			return this;
		};

		p.fadeOut = function(duration,callback) {
			fn(this,'fadeOut',duration,callback);
			return this;
		};

	}

	ns.Bazz = bazz;
})(window);
