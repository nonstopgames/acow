/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * Engine.js
 *
 *
 * Game engine core for Project Castle.
 *
 *
 * All kinds of functionality will be appearing here.
 * Needed for timing/pausing, synchronization and clean
 * separation between rendering/system code and game logic.
 *
 *
 * Linked game objects and rendering run in lockstep. This
 * might not be what we want; future development might warrant
 * a gradual shift towards event based logic and op buffers.
 *
 * creation date: 04-06-2012
 */

"use strict";

(function(ns) {

	var dummyCanvas = document.createElement('canvas');
	var dummyContext = dummyCanvas.getContext('2d');
	
	/**
	 * Runlevel object. Contains lists for updating
	 * game state.
	 *
	 */
	function Runlevel() {
		this.functions = [];   // Custom functions
		this.buttons   = [];   // Soft buttons
		this.timers    = [];   // Timer objects
		this.actors    = [];   // Actor objects
		this.scenes    = [];   // Scene objects
		this.max_fps   = 60;   // Maximum FPS, if != 0. Used to calculate delay after processing frame. By default, we aim for 60 fps.
		this.last_offs = 0;    // Time offset of last frame in milliseconds (used for calculating current offset)
	};

	/**
	 * Adds a custom function to the runlevel's function list.
	 *
	 * @param f a function reference
	 * @param context the 'this' object for the function
	 * @returns a reference to self
	 */
	Runlevel.prototype.addFunction = function(f,context) {
		this.functions.push({
			fn: f,
			ctx: context
		});
		return this;
	};

	/**
	 * Removes a previously added function from the runlevel's function list.
	 *
	 * @param f a function reference
	 * @param context optional 'this' pointer reference. If not specified, will remove first occurrence of f
	 * @returns a reference to self
	 */
	Runlevel.prototype.removeFunction = function(f,context) {

		for(var i = 0; i < this.functions.length; ++i) {
			if(this.functions[i].fn === f) {
				if(context === undefined || this.functions[i].ctx === context) {
					this.functions.splice(i,1);
					return this;
				}
			}
		}

		return this;
	};

	/**
	 * Remove all functions from the runlevel
	 */
	Runlevel.prototype.clearFunctions = function() {
		this.functions.splice(0,this.functions.length);
		return this;
	};

	/**
	 * Add a softbutton to the runlevel
	 */
	Runlevel.prototype.addButton = function(button) {
		if(this.buttons.indexOf(button) < 0) {
			this.buttons.push(button);
		}
		return this;
	};

	/**
	 * Remove a softbutton from the runlevel
	 */
	Runlevel.prototype.removeButton = function(button) {
		var idx = this.buttons.indexOf(button);
		if(idx >= 0) {
			this.buttons.splice(idx,1);
		}
		return this;
	};

	/**
	 * Remove all softbuttons from the runlevel
	 */
	Runlevel.prototype.clearButtons = function() {
		this.buttons.splice(0,this.buttons.length);
		return this;
	};
	
	/**
	 * Add a timer to the runlevel
	 */
	Runlevel.prototype.addTimer = function(t) {
		this.timers.push(t);
		return this;
	};

	/**
	 * Remove a timer from the runlevel
	 */
	Runlevel.prototype.removeTimer = function(t) {
		var idx = this.timers.indexOf(t);
		if(idx >= 0) this.timers.splice(idx,1);
		return this;
	};

	/**
	 * Remove all timers from the runlevel
	 */
	Runlevel.prototype.clearTimers = function() {
		this.timers.splice(0,this.timers.length);
		return this;
	};

	/**
	 * Adds an Actor to the runlevel's actor list
	 *
	 * @param a an actor object
	 * @returns a reference to self
	 */
	Runlevel.prototype.addActor = function(a) {
		//trace("Adding actor " + a + " to runlevel " + this);
		this.actors.push(a);
		this.sortActors();
		return this;
	};

	/**
	 * Removes a single actor
	 *
	 * @returns a reference to self
	 */
	Runlevel.prototype.removeActor = function(a) {

		var idx = this.actors.indexOf(a);
		if(idx >= 0) this.actors.splice(idx,1);
		return this;

	};

	/**
	 * Sorts and compacts a changed actor list
	 *
	 * @returns a reference to self
	 */
	Runlevel.prototype.sortActors = function() {

		this.actors.sort(function(a,b) {

			// Push nulls out
			if(a == null) return  1;
			if(b == null) return -1;

			// Compare priorities
			return b._priority - a._priority;

		});

		// Find nulls and remove them from the list
		var i = this.actors.length - 1;
		while(this.actors[i] == null) --i;
		this.actors.splice(i,(this.actors.length - 1) - i);

		return this;

	};

	/**
	 * Removes all Actors from this runlevel
	 *
	 * @returns a reference to self
	 */
	Runlevel.prototype.clearActors = function() {
		this.actors.splice(0,this.actors.length);
		return this;
	};

	/**
	 * Adds a Scene to the runlevel
	 *
	 * @returns a reference to self
	 */
	Runlevel.prototype.addScene = function(scn) {
		this.scenes.push(scn);
		this.sortScenes();
		return this;
	};

	/**
	 * Removes a scene from the runlevel
	 *
	 * @returns a reference to self
	 */
	Runlevel.prototype.removeScene = function(scn) {
		var idx = this.scenes.indexOf(scn);
		if(idx >= 0) this.scenes.splice(idx,1);
		return this;
	};

	/**
	 * Sorts scenes in a runlevel
	 *
	 * @returns a reference to self
	 */
	Runlevel.prototype.sortScenes = function() {

		this.scenes.sort(function(a,b) {

			// Push nulls out
			if(a == null) return  1;
			if(b == null) return -1;

			// Compare priorities
			return b._priority - a._priority;
		});

		// Find nulls and remove them from the list
		var i = this.scenes.length - 1;
		while(this.scenes[i] == null) --i;
		this.scenes.splice(i,(this.scenes.length - 1) - i);

		return this;
	};

	/**
	 * Initializes Engine. If Engine is already initialized, returns a reference to it.
	 * Engine is now a pure singleton; to get at Engine you should use Engine.getInstance()
	 * instead.
	 *
	 * Provides application control.
	 *
	 * Provides configurable runlevels (i.e. different sets of actors and scenes
	 * can be called depending on the needed situation).
	 *
	 */
	function Engine(container, contentName) {

		if(contentName === undefined) contentName = 'game';

		if(Engine.__instance) return Engine.__instance;

		// Container
		this._container = (function() {
			var elem = null;
			if(typeof(container) === 'string')
				elem = document.getElementById(container);
			else
				elem = container;
			if(!elem) throw new Error("Engine must be created with an element reference!");
			return elem;
		})();

		//
		// Integrated Environment class
		//
		this._environment = {

			engine: this,
 
			_parent: container,
			_container: null,
			_mobile: false,
			_ios_webapp: false,
			_dev_type: '',
			_dev_iface: '',
			_max_w: null,
			_max_h: null,
			_size_w: null,
			_size_h: null,
			_touch: false,
			_mouse: true,
			_keyboard: true,
			_orientation: 0,
			_input: null,
			_elements: [],
			_auto_elem_id: 1,
			_orientationChangeHandlers: [],
			_windowSizeChangeHandlers: [],

			addOrientationChangeListener: function(fn) {
				if(!(fn instanceof Function)) {
					throw new Error("Listener is not a function");
				}
				if(this._orientationChangeHandlers.indexOf(fn) === -1)
					this._orientationChangeHandlers.push(fn);
				return this;
			},

			removeOrientationChangeListener: function(fn) {
				if(!(fn instanceof Function)) {
					throw new Error("Listener is not a function");
				}
				var idx = this._orientationChangeHandlers.indexOf(fn);
				if(idx >= 0)
					this._orientationChangeHandlers.splice(idx,1);
				return this;
			},

			clearOrientationChangeListeners: function(fn) {
				this._orientationChangeHandlers.splice(0,this._orientationChangeHandlers.length);
				return this;
			},

			addWindowSizeChangeListener: function(fn) {
				if(!(fn instanceof Function)) {
					throw new Error("Listener is not a function");
				}
				if(this._windowSizeChangeHandlers.indexOf(fn) === -1) {
					this._windowSizeChangeHandlers.push(fn);
				}
				return this;
			},

			removeWindowSizeChangeListner: function(fn) {
				if(!(fn instanceof Function)) {
					throw new Error("Listener is not a function");
				}
				var idx = this._windowSizeChangeHandlers.indexOf(fn);
				if(idx >= 0)
					this._windowSizeChangeHandlers.splice(0,this._windowSizeChangeHandlers.length);
				return this;
			},

			clearWindowSizeChangeListeners: function(fn) {
				this._windowSizeChangeHandlers.splice(0,this._windowSizeChangeHandlers.length);
				return this;
			},

			//
			// Methods
			//

			init: function() {

				trace("Environment init");

				this._dev_type  = window.type;
				this._dev_iface = window.iface;

				// Create game content
				this._container = this.createDiv(contentName);

				var that = this;
				// NOTE: this is temporary. We need proper client-side size and
				//       orientation change handlers.
				window.addEventListener('resize',function() {
					that.update();
					that.runSizeChangeListeners.call(that);
					that.runRotationChangeListeners.call(that);
					that.update();
				});

				window.addEventListener('orientationchange',function() {
					that.update();
					that.runSizeChangeListeners.call(that);
					that.runRotationChangeListeners.call(that);

					if(that.isMobile()) {
						setTimeout(250,function() {
							that.update();
						});
					}
					
					that.update();
				});

				// Run env detection here...
				this._mobile = (this._dev_type === 'ios') ||
				(this._dev_type === 'android');

				// NOTE: this code seems to be quite superfluous, but it's copied verbatim from
				// http://stackoverflow.com/questions/7015962/detect-an-app-on-home-screen-of-iphone
				// and I don't care to change it, if it works...
				this._ios_webapp = ('standalone' in navigator && !navigator.standalone && (/iphone|ipod|ipad/gi).test(navigator.platform) && (/Safari/i).test(navigator.appVersion));

				// Set mouse and touch values
				this._touch = this._mobile;
				this._mouse = !this._touch;
				this._keyboard = !this._touch;

				if(typeof(this._parent) === 'string') {
					this._parent = document.getElementById(this._parent);
					if(!this._parent) alert("Environment has no parent container!");
				}

				this._parent.appendChild(this._container);

				this.update();

			},

			update: function() {

				// Figure out our size.
				var parent_w    = $(this._parent).width();
				var parent_h    = $(this._parent).height();
				this._size_w    = parent_w;
				this._size_h    = parent_h;
				if(this._max_w) this._size_w = Math.min(this._size_w,this._max_w);
				if(this._max_h) this._size_h = Math.min(this._size_h,this._max_h);

				// Attempt to resize game area to maximum..
				$(this._container).width(this._size_w);
				$(this._container).height(this._size_h);

				// Attempt to center game area vertically on screen
				if(this._size_h < parent_h) {
					this._container.style.position = "relative";
					this._container.style.top = ((parent_h - this._size_h) >> 1) + "px";
				} else {
					this._container.style.position = "relative";
					this._container.style.top = "0px";
				}

				var w = this._size_w;
				var h = this._size_h;

				// Update attached element sizes..
				for(var i = 0; i < this._elements.length; ++i) {
					var el = this._elements[i];
					var el_w = 0;
					var el_h = 0;

					if(el instanceof HTMLCanvasElement) {
						if(el._env_resize_w) el.width = this._size_w;
						if(el._env_resize_h) el.height = this._size_h;
						el_w = el.width;
						el_h = el.height;
					} else {
						if(el._env_resize_w) el.style.width = this._size_w + "px";
						if(el._env_resize_h) el.style.height = this._size_h + "px";
						el_w = parseInt(el.style.width);
						el_h = parseInt(el.style.height);
					}

					if(el._env_autocenter) {
						el.style.top = ((h + el_h) >> 1) + "px";
						el.style.left = ((w + el_w) >> 1) + "px";
					}
				}

				// Notify the input handler that the container has changed...
				if(this._input) {  // Calling this from the window size change handler the first time fails...
					this._input.updateContainer();
				}

				this.engine.redraw && this.engine.redraw();

			},

			runSizeChangeListeners: function() {
				var w = this._size_w;
				var h = this._size_h;
				for(var i = 0, l = this._windowSizeChangeHandlers.length; i < l; ++i) {
					this._windowSizeChangeHandlers[i].call(this,w,h);
				}
			},

			runRotationChangeListeners: function() {
				var o = this._orientation;
				for(var i = 0, l = this._orientationChangeHandlers.length; i < l; ++i) {
					this._orientationChangeHandlers[i].call(this,o);
				}
			},

			setMaxSize: function(w,h) {
				this._max_w = w | 0;
				this._max_h = h | 0;
				this.update();
				this.simulateSizeChange();
				return this;
			},

			clear: function() {
				for(var i = 0; i < this._elements.length; ++i) {
					this._container.removeChild(this._elements[i]);
				}
				this._elements.splice(0,this._elements.length);
				return this;
			},

			add: function(elem,zorder,edge_right,edge_bottom) {
				// DANGER: app-specific hack - might be VERY BRITTLE
				if(elem.getElement instanceof Function) elem = elem.getElement();

				if(this._elements.indexOf(elem) !== -1) this.remove(elem);

				elem.style.zIndex = zorder;

				PLACEMENT: {
					for(var i = this._elements.length - 1; i >= 0; --i) {
						var e = this._elements[i];
						if(parseInt(e.style.zIndex) < zorder) {
							this._elements.splice(i,0,elem);
							this._container.insertBefore(elem,e);
							break PLACEMENT;
						}
					}

					if(this._elements.length) {
						this._elements.unshift(elem);
						try {
							this._container.insertBefore(elem,this._elements[0]);
						} catch(e) {
							this._container.appendChild(elem);
						}
					} else {
						this._elements.push(elem);
						this._container.appendChild(elem);
					}
				}

				elem.style.position = "absolute";
				if(edge_bottom)
					elem.style.bottom = "0px";
				else
					elem.style.top = "0px";

				if(edge_right)
					elem.style.right = "0px";
				else
					elem.style.left = "0px";

				return this;
			},

			remove: function(elem) {
				if(elem.getElement instanceof Function) elem = elem.getElement();

				var idx = this._elements.indexOf(elem);
				if(idx >= 0) {
					this._elements.splice(idx,1);
					this._container.removeChild(elem);
				}
				return this;
			},

			isAdded: function(elem) {
				// DANGER: app-specific hack - might be VERY BRITTLE
				if(elem.getElement instanceof Function) elem = elem.getElement();

				return this._elements.indexOf(elem) !== -1;
			},

			createElement: function(type,id,w,h) {
				var autosize_w = (w === undefined);
				var autosize_h = (h === undefined);

				var elem = document.createElement(type);

				if(elem) {

					elem._env_autocenter = false;
					elem._env_resize_w = autosize_w;
					elem._env_resize_h = autosize_h;
					if(id === undefined) {
						elem.setAttribute('id','env_elem_' + (Element.auto_elem_id++));
					} else {
						elem.setAttribute('id',id);
					}

					if(autosize_w) $(elem).width(this._size_w); else $(elem).width(w);
					if(autosize_h) $(elem).height(this._size_h); else $(elem).height(h);

					elem.setSize = function(w,h) {
						$(elem).width(this._size_w);
						$(elem).height(this._size_h);
					};

					elem.setAutoSize = function(b) {
						this._env_resize_h = this._env_resize_w = (b == true);
					};

					elem.setAutoCenter = function(b) {
						this._env_autocenter = (b == true);
					};

				} else {
					throw new Error("Document cannot create an element of type '" + type + "'");
				}

				return elem;
			},

			createCanvas: function(id,w,h) {
				var elem = document.createElement('canvas');

				var autosize_w = (w === undefined);
				var autosize_h = (h === undefined);

				elem._env_autocenter = false;
				elem._env_resize_w = autosize_w;
				elem._env_resize_h = autosize_h;

				elem.width = autosize_w ? (this._size_w) : w;
				elem.height = autosize_h ? (this._size_h) : h;

				if(id === undefined) {
					elem.setAttribute('id','env_elem_' + (Element.auto_elem_id++));
				} else {
					elem.setAttribute('id',id);
				}

				elem.setSize = function(w,h) {
					this.width = w;
					this.height = h;
				};

				elem.setAutoSize = function(b) {
					this._env_resize_h = this._env_resize_w = (b == true);
				};

				elem.setAutoCenter = function(b) {
					this._env_autocenter = (b == true);
				};

				// iPad/iPhone hack - remove touch move events from document, but add them to game container
				// This way, we'll be able to move blocks, but the damn document won't slide up and down because of it.
				$(elem).bind('touchmove', false);

				return elem;
			},

			createDiv: function(id,w,h) {
				return this.createElement('div',id,w,h);
			},

			getWidth: function() {
				return this._size_w;
			},

			getHeight: function() {
				return this._size_h;
			},

			isMobile: function() {
				return (this._mobile == true);
			},

			isDesktop: function() {
				return (this._mobile == false);
			},

			isTablet: function() {
				return (this._dev_iface === 'tablet');
			},

			isPhone: function() {
				return (this._dev_iface === 'mobile');
			},

			isIOSWebApp: function() {
				return this._ios_webapp;
			},

			hasMouse: function() {
				return (this._mouse === true);
			},

			hasTouch: function() {
				return (this._touch === true);
			},

			hasKeyboard: function() {
				return (this._keyboard === true);
			},

			getDeviceInterface: function() {
				return this._dev_iface;
			},

			getDeviceType: function() {
				return this._dev_type;
			}

		};
		Object.seal && Object.seal(this._environment);
		this._environment.init();

		//
		// Integrated Input class
		//
		this._input = {

			engine: this,

			// Links
			_env: this._environment,
			_elem: this._environment._container,

			// Offset data
			_container_offset_x: 0,
			_container_offset_y: 0,

			// Threshold timer
			_press_tm: [0, 0],
			_release_tm: [0, 0],
			_click_tm_threshold: 350,  // Maximum time allowed for a click

			// Dragging
			_drag_start_x: 0,
			_drag_start_y: 0,
			_drag_end_x: 0,
			_drag_end_y: 0,
			_drag_move_threshold: 5 * 5,
			_drag_act: false,
			_drag_cur: false,
			_drag_last: false,

			// Pointer tracking data
			_x_last: 0,
			_y_last: 0,
			_x_cur: 0,
			_y_cur: 0,
			_x_act: 0,
			_y_act: 0,
			_click_last: false,
			_click_cur: false,
			_click_act: false,

			// Mouse wheel
			_wheel_act: 0,
			_wheel_cur: 0,
			_wheel_last: 0,

			// Pinch
			_pinch_act: false,
			_pinch_cur: false,
			_pinch_last: false,
			_pinch_x0: 0,
			_pinch_y0: 0,
			_pinch_x1: 0,
			_pinch_y1: 0,
			_multitouch: false,

			// Control
			_cancel_position: false,
			_cancel_click: false,
			_cancel_drag: false,
			_cancel_wheel: false,
			_cancel_pinch: false,

			// Keyboard
			_key_act: [],
			_key_cur: [],
			_key_last: [],

			// Callbacks
			_keyHandlers: [],
			_clickHandlers: [],
			_wheelHandlers: [],
			_dragHandlers: [],
			_pinchHandlers: [],

			//
			// Methods
			//

			init: function() {

				var that = this;

				if(this._env.hasKeyboard()) {

					// Init keyboard
					for(var i = 0; i < 256; ++i) {
						this._key_act.push(false);
						this._key_cur.push(false);
						this._key_last.push(false);
					}
					// Nasty hack for now - add keyboard handler to window
					// instead of element (all elements can't handle keyevents)
					window.addEventListener('keydown',function(e) {
						that._key_act[e.keyCode] = true;
					},true);
					window.addEventListener('keyup',function(e) {
						that._key_act[e.keyCode] = false;
					},true);
				}

				if(this._env.hasTouch()) {

					// Init touch
					this._elem.addEventListener('touchstart',function(e) {
						var touches = e.changedTouches;
						e = touches[0];
						that._click_act = true;
						that._drag_act = false;
						var px = e.clientX - that._container_offset_x;
						var py = e.clientY - that._container_offset_y;
						px = (px < 0) ? 0 : ((px > that._env._size_w) ? (that._env._size_w) : (px));
						py = (py < 0) ? 0 : ((py > that._env._size_h) ? (that._env._size_h) : (py));
						that._drag_start_x = that._x_act = px;
						that._drag_start_y = that._y_act = py;
						that._press_tm[0] = that.engine.time();
					},true);
					this._elem.addEventListener('touchmove',function(e) {
						var touches = e.changedTouches;
						e = touches[0];
						var px = e.clientX - that._container_offset_x;
						var py = e.clientY - that._container_offset_y;
						px = (px < 0) ? 0 : ((px > that._env._size_w) ? (that._env._size_w) : (px));
						py = (py < 0) ? 0 : ((py > that._env._size_h) ? (that._env._size_h) : (py));
						that._x_act = px;
						that._y_act = py;
						if(that._click_act === true) {
							px -= that._drag_start_x;
							py -= that._drag_start_y;
							if(((px * px) + (py * py) > that._drag_move_threshold) || that.engine.time() - that._press_tm[0] > that._click_tm_threshold) that._drag_act = true;
						}
					},true);
					this._elem.addEventListener('touchend',function(e) {
						var touches = e.changedTouches;
						e = touches[0];
						that._click_act = false;
						that._drag_act = false;
						var px = e.clientX - that._container_offset_x;
						var py = e.clientY - that._container_offset_y;
						px = (px < 0) ? 0 : ((px > that._env._size_w) ? (that._env._size_w) : (px));
						py = (py < 0) ? 0 : ((py > that._env._size_h) ? (that._env._size_h) : (py));
						that._drag_end_x = that._x_act = px;
						that._drag_end_y = that._y_act = py;
						that._release_tm[0] = that.engine.time();
					},true);
					
				} else {

					// Init mouse
					this._elem.addEventListener('mousedown',function(e) {
						that._click_act = true;
						that._drag_act = false;
						var px = e.clientX - that._container_offset_x;
						var py = e.clientY - that._container_offset_y;
						px = (px < 0) ? 0 : ((px > that._env._size_w) ? (that._env._size_w) : (px));
						py = (py < 0) ? 0 : ((py > that._env._size_h) ? (that._env._size_h) : (py));
						that._drag_start_x = that._x_act = px;
						that._drag_start_y = that._y_act = py;
						that._press_tm[0] = that.engine.time();

					},true);
					this._elem.addEventListener('mouseup',function(e) {
						that._click_act = false;
						that._drag_act = false;
						var px = e.clientX - that._container_offset_x;
						var py = e.clientY - that._container_offset_y;
						px = (px < 0) ? 0 : ((px > that._env._size_w) ? (that._env._size_w) : (px));
						py = (py < 0) ? 0 : ((py > that._env._size_h) ? (that._env._size_h) : (py));
						that._drag_end_x = that._x_act = px;
						that._drag_end_y = that._y_act = py;
						that._release_tm[0] = that.engine.time();
					},true);
					this._elem.addEventListener('mousemove',function(e) {
						var px = e.clientX - that._container_offset_x;
						var py = e.clientY - that._container_offset_y;
						px = (px < 0) ? 0 : ((px > that._env._size_w) ? (that._env._size_w) : (px));
						py = (py < 0) ? 0 : ((py > that._env._size_h) ? (that._env._size_h) : (py));
						that._x_act = px;
						that._y_act = py;
						if(that._click_act === true) {
							px -= that._drag_start_x;
							py -= that._drag_start_y;
							if(((px * px) + (py * py) > that._drag_move_threshold) || that.engine.time() - that._press_tm[0] > that._click_tm_threshold) that._drag_act = true;
						}
					},true);
					this._elem.addEventListener('mousewheel',function(e) {
						var px = e.clientX - that._container_offset_x;
						var py = e.clientY - that._container_offset_y;
						px = (px < 0) ? 0 : ((px > that._env._size_w) ? (that._env._size_w) : (px));
						py = (py < 0) ? 0 : ((py > that._env._size_h) ? (that._env._size_h) : (py));
						that._x_act = px;
						that._y_act = py;
						that._wheel_act = parseInt(e.wheelDelta) < 0 ? -1 : 1;
					});
				}
			},

			updateContainer: function() {
				this._container_offset_x = this._elem.offsetLeft;
				this._container_offset_y = this._elem.offsetTop;
			},

			update: function() {
				var t = this.engine.time();
				if(this._cancel_position) {
					this._x_act = this._x_cur;
					this._y_act = this._y_cur;
					this._cancel_position = false;
				} else {
					this._x_last = this._x_cur;
					this._x_cur  = this._x_act;
					this._y_last = this._y_cur;
					this._y_cur  = this._y_act;
				}
				if(this._cancel_click) {
					this._click_act = false;
					this._cancel_click = false;
				} else {
					this._click_last = this._click_cur;
					this._click_cur  = this._click_act;
				}
				if(this._cancel_drag) {
					this._drag_act = false;
					this._cancel_drag = false;
				} else {
					// Make sure our drag handler doesn't hang
					if(!this._click_act) this._drag_act = false;

					// If a click CAN be detected, we can't be dragging:
					if(this.isClicked()) this._drag_act = false;
					
					this._drag_last  = this._drag_cur;
					this._drag_cur   = this._drag_act;
				}
				if(this._cancel_wheel) {
					this._cancel_wheel = false;
				} else {
					this._wheel_last = this._wheel_cur;
					this._wheel_cur  = this._wheel_act;
				}
				 // Reset wheel active state to 0 on every frame - 
				 // we want to count clicks.
				this._wheel_act  = 0;
				if(this._cancel_pinch) {
					this._pinch_act = false;
					this._cancel_pinch = false;
				} else {
					this._pinch_last = this._pinch_cur;
					this._pinch_cur  = this._pinch_act;
				}

				// Call all appropriate handlers
				if(this._env.hasKeyboard()) {
						
					// Update keyboard state
					for(var k = 0, kl = this._key_act.length; k < kl; ++k) {
						this._key_last[k] = this._key_cur[k];
						this._key_cur[k] = this._key_act[k];
					}

					// Check keyboard handlers
					var hl = this._keyHandlers.length;
					for(var k = 0, kl = this._key_act.length; k < kl; ++k) {

						// If key state is changed or key is active, call appropriate key handler
						var kcur = this._key_cur[k];
						var klast = this._key_last[k];
						if(kcur || klast) {
							for(var i = 0; i < hl; ++i) {
								var h = this._keyHandlers[i];
								if(kcur && !klast) {
									h.press_cb && h.press_cb.call(h.owner,k);
								} else if(!kcur && klast) {
									h.release_cb && h.release_cb.call(h.owner,k);
								} else {
									h.hold_cb && h.hold_cb.call(h.owner,k);
								}
							}
						}
					}
				}
				
				if(this._pinch_last || this._pinch_cur) {
					if(this._pinch_cur && !this._pinch_last) {
						for(var i = 0, l = this._pinchHandlers.length; i < l; ++i) {
							var h = this._pinchHandlers[i];
							h.start_cb && h.start_cb.call(h.owner,this._pinch_x0,this._pinch_y0,this._pinch_x1,this._pinch_y1);
						}
					} else if(!this._pinch_cur && this._pinch_last) {
						for(var i = 0, l = this._pinchHandlers.length; i < l; ++i) {
							var h = this._pinchHandlers[i];
							h.stop_cb && h.stop_cb.call(h.owner,this._pinch_x0,this._pinch_y0,this._pinch_x1,this._pinch_y1);
						}
					} else {
						for(var i = 0, l = this._pinchHandlers.length; i < l; ++i) {
							var h = this._pinchHandlers[i];
							h.move_cb && h.move_cb.call(h.owner,this._pinch_x0,this._pinch_y0,this._pinch_x1,this._pinch_y1);
						}
					}
				} else {

					// Detect wheel movement
					if(this._wheel_cur) {
						for(var i = 0, l = this._wheelHandlers.length; i < l; ++i) {
							var h = this._wheelHandlers[i];
							h.start_cb && h.start_cb.call(h.owner,this._wheel_cur);
						}
					}

					// Detect clicks (detected on release of button, when release happens under a certain threshold time)
					if(this._click_cur || this._click_last) {
						if(!this._click_cur && this._click_last && t - this._press_tm[0] <= this._click_tm_threshold) {
							for(var i = 0, l = this._clickHandlers.length; i < l; ++i) {
								var h = this._clickHandlers[i];
								h.start_cb && h.start_cb.call(h.owner);
							}
						}
					}

					// Detect dragging
					if(this._drag_cur || this._drag_last) {
						if(this._drag_cur && !this._drag_last) {
							for(var i = 0, l = this._dragHandlers.length; i < l; ++i) {
								var h = this._dragHandlers[i];
								h.start_cb && h.start_cb.call(h.owner,this._x_cur,this._y_cur);
							}
						} else if(!this._drag_cur && this._drag_last) {
							for(var i = 0, l = this._dragHandlers.length; i < l; ++i) {
								var h = this._dragHandlers[i];
								h.stop_cb && h.stop_cb.call(h.owner,this._x_cur,this._y_cur);
							}
						} else {
							for(var i = 0, l = this._dragHandlers.length; i < l; ++i) {
								var h = this._dragHandlers[i];
								h.move_cb && h.move_cb.call(h.owner,this._x_cur,this._y_cur);
							}
							
						}
						
					}
					
				}

			},

			/*
			 * Get current (or in the case of touchscreens, the last detected) input device position X coordinate
			 */
			getX: function() {
				return this._x_cur;
			},
 
			/*
			 * Get current (or in the case of touchscreens, the last detected) input device position Y coordinate
			 */
			getY: function() {
				return this._y_cur;
			},

			/*
			 * Get actual (volatile, realtime-updated) (or in the case of touchscreens, the last detected) input device position X coordinate
			 */
			getActualX: function() {
				return this._x_act;
			},

 			/*
			 * Get actual (volatile, realtime-updated) (or in the case of touchscreens, the last detected) input device position Y coordinate
			 */
			getActualY: function() {
				return this._y_act;
			},

			isActualDown: function() {
				return this._click_act;
			},

			getDeltaX: function() {
				return this._x_cur - this._x_last;
			},

			getDeltaY: function() {
				return this._y_cur - this._y_last;
			},

 			/*
			 * Test if the input device is pressed (mouse button down or finger held to screen)
			 */
			isDown: function() {
				return this._click_cur;
			},

			/*
			 * Test if the input device is NOT pressed (mouse button down or finger held to screen)
			 */
			isUp: function() {
				return !(this._click_cur);
			},

			/*
			 * Test if the input device has just been pressed (mouse button down or finger held to screen)
			 */
			isPressed: function() {
				return this._click_cur && !this._click_last;
			},

			/*
			 * Test if the input device has just been released (mouse button down or finger lifted from screen)
			 */
			isReleased: function() {
				return !this._click_cur && this._click_last;
			},
 
			/*
			 * Test for a click
			 */
			isClicked: function() {
				return (!this._click_cur && this._click_last && (this.engine._tm_current - this._press_tm[0] <= this._click_tm_threshold)) && !(this._drag_cur || this._drag_last);
			},

			/*
			 * See if a drag action is currently being performed
			 */
			isDragging: function() {
				return this._drag_cur;
			},

			/*
			 * See if a drag action has just been started
			 */
			isDragStarted: function() {
				return this._drag_cur && !this._drag_last;
			},

			/*
			 * See if a drag action has just been stopped
			 */
			isDragStopped: function() {
				return !this._drag_cur && this._drag_last;
			},

			/*
			 * See if a pinch action is currently being performed
			 */
			isPinching: function() {
				return this._pinch_act;
			},

			/**
			 * Discard click information - use to discard an 'accidental' click
			 */
			cancelClick: function() {
				this._cancel_click = true;
				return this;
			},

			/**
			 * Discard position change information - use to discard an 'accidental' mouse move or touch
			 */
			cancelPosition: function() {
				this._cancel_position = true;
				return this;
			},

			/**
			 * Discard current wheel information - use to discard an 'accidental' wheel scroll
			 */
			cancelWheel: function() {
				this._cancel_wheel = true;
				return this;
			},

			/**
			 * Discard current drag information - use to discard an 'accidental' drag
			 */
			cancelDrag: function() {
				this._cancel_drag = true;
				return this;
			},

			/**
			 * Discard the current pinch information - use to discard an 'accidental' pinch
			 */
			cancelPinch: function() {
				this._cancel_pinch = true;
				return this;
			},

			/**
			 * Test if a key is held down
			 */
			isKeyDown: function(keycode) {
				return this._key_cur[keycode] == true;
			},

			/**
			 * Test if a key is not held down
			 */
			isKeyUp: function() {
				return this._key_cur[keycode] == false;
			},

 			/**
			 * Test if a key was not held down last frame, but is held down this frame
			 */
			isKeyPressed: function() {
				return this._key_cur[keycode] == true && this._key_last[keycode] == false;
			},

			/**
			 * Test if a key has been held down last frame, but is not held down this frame
			 */
			isKeyReleased: function() {
				return this._key_cur[keycode] == false && this._key_last[keycode] == true;
			},

			/**
			 * Get the Y coordinate of the point where dragging started
			 */
			getDragStartX: function() {
				return this._drag_start_x;
			},

			/**
			 * Get the Y coordinate of the point where dragging started
			 */
			getDragStartY: function() {
				return this._drag_start_y;
			},

			/**
			 * Get the X coordinate of the point where dragging stopped
			 */
			getDragEndX: function() {
				return this._drag_end_x;
			},

			/**
			 * Get the Y coordinate of the point where dragging stopped
			 */
			getDragEndY: function() {
				return this._drag_end_y;
			},

			/**
			 * Get the X difference between the start and end point of the last drag action
			 */
			getDragDeltaX: function() {
				return this._drag_end_x - this._drag_start_x;
			},

			/**
			 * Get the Y difference between the start and end point of the last drag action
			 */
			getDragDeltaY: function() {
				return this._drag_end_y - this._drag_start_y;
			},

			/**
			 * Adds a Keyboard handler. Returns a reference to the function wrapper object.
			 * This object is used as input to removeClickHandler.
			 *
			 * If the current platform is not expected to have a keyboard, this function does nothing.
			 *
			 * These functions are called when the keyboard state changes.
			 * Functions take one parameter: the key code of the changed key. The same
			 * handling function will be called once for each key whose state has changed.
			 *
			 * @param press_fn function to call when a key is pressed down
			 * @param hold_fn function to call when a key is held down
			 * @param release_fn function to call when a key is released
			 * @param owner [optional] object to pass as 'this' to the handler function
			 *
			 * @returns wrapper object
			 */
			addKeyboardHandler: function(press_fn, hold_fn, release_fn, owner) {
				if(this._env.hasKeyboard()) {
					var handler = {
						owner: owner,
						press_cb: press_fn,
						hold_cb: hold_fn,
						release_cb: release_fn
					};

					this._keyHandlers.push(handler);

					return handler;
				}
				return {};
			},

			/**
			 * Remove a previously added keyboard handler
			 *
			 */
			removeKeyboardHandler: function(obj) {
				if(this._env.hasKeyboard()) {
					var idx = this._keyHandlers.indexOf(obj);
					if(idx >= 0) {
						this._keyHandlers.splice(idx,1);
					}
				}
				return this;
			},

			/**
			 * Remove all keyboard handlers
			 */
			clearKeyboardHandlers: function() {
				if(this._env.hasKeyboard()) {
					this._keyHandlers.splice(0,this._keyHandlers.length);
				}
				return this;
			},
 
			/**
			 * Adds a click handler. Returns a reference to the function wrapper object.
			 * This object is used as input to removeClickHandler.
			 *
			 * This function is called on click, and only on click. The callbacks receive
			 * no parameters.
			 *
			 * @param fn function to call
			 * @param owner [optional] object to pass as 'this' to the handler function
			 */
			addClickHandler: function(fn, owner) {
				var handler = {
					owner: owner,
					start_cb: fn
				};

				this._clickHandlers.push(handler);

				return handler;
			},

			/**
			 * Remove a previously added click handler
			 *
			 */
			removeClickHandler: function(obj) {
				var idx = this._clickHandlers.indexOf(obj);
				if(idx >= 0) {
					this._clickHandlers.splice(idx,1);
				}
				return this;
			},

			/**
			 * Remove all click handlers
			 */
			clearClickHandlers: function() {
				this._clickHandlers.splice(0,this._clickHandlers.length);
				return this;
			},

			/**
			 * Adds a mouse wheel handler. Returns a reference to the function wrapper object.
			 * This object is used as input to removeWheelHandler.
			 *
			 * This function is called when a mouse wheel scroll event is received.
			 * The function takes one parameter: wheel_delta, a number that is either -1 or +1,
			 * depending on what direction the wheel was rotated.
			 *
			 * @param fn function to call
			 * @param owner [optional] object to pass as 'this' to the handler function
			 */
			addWheelHandler: function(fn, owner) {
				var handler = {
					owner: owner,
					start_cb: fn
				};

				this._wheelHandlers.push(handler);

				return handler;
			},

 			/**
			 * Remove a previously added wheel handler
			 */
			removeWheelHandler: function(obj) {
				var idx = this._wheelHandlers.indexOf(obj);
				if(idx >= 0) {
					this._wheelHandlers.splice(idx,1);
				}
				return this;
			},

 			/**
			 * Remove all wheel handlers
			 */
			clearWheelHandlers: function() {
				this._wheelHandlers.splice(0,this._wheelHandlers.length);
				return this;
			},

			/**
			 * Adds a drag handler. Returns a reference to the function wrapper object.
			 * This object is used as input to removeDragHandler.
			 *
			 * Function parameters are: x, y
			 *
			 * @param start_fn Function to call at the start of a drag operation
			 * @param move_fn Function to call when moving during a drag operation
			 * @param stop_fn Function to call when the drag operation completes
			 * @param owner [optional] object to pass as 'this' to handler functions
			 */
			addDragHandler: function(start_fn, move_fn, stop_fn, owner) {
				var handler = {
					owner: owner,
					start_cb: start_fn,
					move_cb: move_fn,
					stop_cb: stop_fn
				};

				this._dragHandlers.push(handler);

				return handler;
			},

 			/**
			 * Remove a previously added drag handler
			 */
			removeDragHandler: function(obj) {
				var idx = this._dragHandlers.indexOf(obj);
				if(idx >= 0) {
					this._dragHandlers.splice(idx,1);
				}
				return this;
			},

 			/**
			 * Remove all drag handlers
			 */
			clearDragHandlers: function() {
				this._dragHandlers.splice(0,this._dragHandlers.length);
				return this;
			},

			/**
			 * Adds a pinch handler. Returns a reference to the function wrapper object.
			 * This object is used as input to removePinchHandler.
			 *
			 * Function parameters are: x0, y0, x1, y1
			 *
			 * @param start_fn Function to call at the start of a pinch operation
			 * @param move_fn Function to call when pinch points move
			 * @param stop_fn Function to call when pinch operation completes
			 * @param owner [optional] object to pass as 'this' to handler functions
			 */
			addPinchHandler: function(start_fn, move_fn, stop_fn, owner) {
				var handler = {
					owner: owner,
					start_cb: start_fn,
					move_cb: move_fn,
					stop_cb: stop_fn
				};

				this._pinchHandlers.push(handler);

				return handler;
			},

 			/**
			 * Remove a previously added pinch handler
			 */
			removePinchHandler: function(obj) {
				var idx = this._pinchHandlers.indexOf(obj);
				if(idx >= 0) {
					this._pinchHandlers.splice(idx,1);
				}
				return this;
			},

 			/**
			 * Remove all pinch handlers
			 */
			clearPinchHandlers: function() {
				this._pinchHandlers.splice(0,this._pinchHandlers.length);
				return this;
			},

			/**
			 * Remove all input event handlers.
			 *
			 */
			clearAllHandlers: function() {
				this.clearClickHandlers();
				this.clearWheelHandlers();
				this.clearDragHandlers();
				this.clearPinchHandlers();
			}

		};
		Object.seal && Object.seal(this._input);
		this._input.init();

		// Runlevel list
		this._runlevels  = [ new Runlevel() ];

		// Execution control
		this._running    = false;   // As long as this is true, driver will execute
		this._throttling = true;    // If true, driver will try to figure out optimum FPS. Otherwise, will run as fast as possible.
		this._runlevel   = 0;       // Current runlevel ID
		this._framecount = 0;       // Number of frames processed since Engine object creation
		this._fps_count  = 0;       // Number of frames since last update
		this._fps_tm     = 0;       // Timestamp of last FPS update
		this._fps_curr   = 0;       // Current FPS reading (updated once per second)
		this._usingRAF   = false;   // Whether we're using requestAnimationFrame or not
		this._disableRAF = false;   // If true, RAF will not be used even if it's available. Used for debugging purposes for now.

		// Timing
		this._paused     = false;   // If true, engine is in pause state, and nothing except onUpdate and timer gets updated)
		this._tm_scale   = 1;
		this._tm_pause   = 0;       // Timestamp of last pause
		this._tm_current = 0;       // Current timestamp
		this._tm_last    = 0;       // Timestamp of previous frame
		this._tm_delta   = 0;       // Difference between current and last frame timestamp in milliseconds
		this._tm_sync    = 0.0;     // Difference between current and last frame timestamp in seconds (AKA 'magic sync value')
		this._tm_buf     = [0,0,0]; // Timing buffer, for removing single-frame spikes from throttling

		//
		// Event hooks
		//

		// This hook is called just before Engine processing loop is started
		this.onStart = function() {
			trace("Engine: update started");
		};

		// This hook is called just before Engine processing loop is stopped
		this.onStop = function() {
			trace("Engine: update stopped");
		};

		/// This hook is called just before the game engine is set to a pause state
		this.onPause = function() {
			// TODO: Remove below trace before release
			trace("Engine: Game has been paused");
		};

		/// This hook is called just before the game engine is returned from a paused state
		this.onResume = function() {
			// TODO: Remove below trace before release
			trace("Engine: Game has been resumed");
		};

		/// This function is called at every frame, after timers are updated and throttling is
		/// applied, but before runlevel objects are updated.
		this.onUpdate = function() {

		};

		/// This function is called just before a runlevel change takes effect.
		this.onRunlevelChange = function(old_level,new_level) {
			trace("Engine: changing runlevel (was: " + old_level + ", now: " + new_level + ")");
		};


		//
		// Methods
		//

		this.getEnvironment = function() {
			return this._environment;
		};

		this.getInput = function() {
			return this._input;
		};


		/**
		* Start the engine's automatic update loop.
		*
		* @returns a reference to self
		*/
		this.start = function() {

			// Call onStart handler
			this.onStart();

			// Set running flag to true; driver function reads this on every iteration
			this._running = true;

			// Call driver function
			Engine.__driver.call(this);

			return this;

		};

		/**
		* Stop the engine's automatic update loop
		*
		* @returns a reference to self
		*/
		this.stop = function() {

			// Set running flag to false; driver function will terminate
			this._running = false;

			// Call onStop handler
			this.onStop();

			return this;
		};

		/**
		* Get a reference to a specified runlevel
		*
		* @param idx index of the runlevel. A runlevel must have been created by either add or createRunLevel first.
		* @returns a Runlevel object.
		*/
		this.getRunlevel = function(idx) {
			return this._runlevels[idx];
		};

		/**
		* Removes all scenes from a runlevel
		*
		* @returns a reference to self
		*/
		this.clearScenes = function() {
			this.scenes.splice(0,this.scenes.length);
			return this;
		};


		/**
		* Function to get current time.
		* Either a reference to Date.now(), or a
		* function, wrapping the creation and deletion
		* of a Date object, and retrieving the timestamp
		* in milliseconds.
		*
		* @returns Current time, in milliseconds
		*/
		this.time = (Date.now || function() {
			return new Date().getTime();
		});

		/**
		* Adds a compatible object to Engine. Wrapper for runlevel specific calls.
		*
		* @param obj an object supported by Engine (one of Scene, Actor, Function)
		* @param runlevel runlevel number to add object to. Defaults to 0.
		* @param extra_param extra parameter to pass (optional; only used for Function, where extra_param is supplied 'this' context)
		* @returns a reference to self
		*/
		this.add = function(obj, runlevel, extra_param) {

			function add_to_runlevel(obj,runlevel,extra_param) {
				var rl = (runlevel === undefined) ? 0 : runlevel;
				rl = rl < 0 ? 0 : rl;

				if(this._runlevels[rl] === undefined) {
					this._runlevels[rl] = new Runlevel();
					trace("Engine: created runlevel ",rl);
				}

				rl = this._runlevels[rl];        // DANGER: re-used variable name!

				if(obj instanceof Scene) {
					//trace("Adding Scene to runlevel " + runlevel);
					rl.addScene(obj);
				} else if(obj instanceof Actor) {
					//trace("Adding Actor to runlevel " + runlevel);
					rl.addActor(obj);
				} else if(obj instanceof Timer) {
					//trace("Adding Timer to runlevel " + runlevel);
					rl.addTimer(obj);
				} else if(obj instanceof SoftButton || obj instanceof CoolButton) {
					//trace("Adding SoftButton to runlevel " + runlevel);
					rl.addButton(obj);
				} else if(obj instanceof Function) {
					//trace("Adding Function to runlevel " + runlevel);
					rl.addFunction(obj,extra_param);
				} else {
					throw new Error("Engine: Don't know what to do with " + obj);
				}
			}

			//
			// NOTE: Added ability to use an array for runlevels; some objects need to be added to several runlevels.
			//
			if(runlevel instanceof Array) {
				if(extra_param instanceof Array) {
					for(var i = 0; i < runlevel.length; ++i) {
						add_to_runlevel.call(this,obj,runlevel[i],extra_param[i]);
					}
				} else {
					for(var i = 0; i < runlevel.length; ++i) {
						add_to_runlevel.call(this,obj,runlevel[i],extra_param);
					}
				}
			} else {
				add_to_runlevel.call(this,obj,runlevel,extra_param);
			}

			return this;

		};

		/**
		 * Remove a compatible object from Engine. Wrapper for runlevel specific calls.
		 * 
		 *
		 */
		this.remove = function(obj, runlevel) {

			function remove_from_runlevel(obj,runlevel) {
				var rl = (runlevel === undefined) ? 0 : runlevel;
				rl = rl < 0 ? 0 : rl;

				if(this._runlevels[rl] === undefined) {
					this._runlevels[rl] = new Runlevel();
					throw new Error("Engine: No such runlevel \"" + runlevel + "\"");
				}

				rl = this._runlevels[rl];        // DANGER: re-used variable name!

				if(obj instanceof Scene) {
					rl.removeScene(obj);
				} else if(obj instanceof Actor) {
					rl.removeActor(obj);
				} else if(obj instanceof Timer) {
					rl.removeTimer(obj);
				} else if(obj instanceof SoftButton) {
					rl.removeButton(obj);
				} else if(obj instanceof Function) {
					rl.removeFunction(obj);
				} else {
					throw new Error("Engine: Don't know what to do with " + obj);
				}
			}

			if(runlevel instanceof Array) {
				for(var i = 0; i < runlevel.length; ++i) {
					remove_from_runlevel.call(this,obj,runlevel[i]);
				}
			} else {
				remove_from_runlevel.call(this,obj,runlevel);
			}
			
			return this;

		};

		/**
		* Enable or disable throttling feature.
		* If the engine has nothing much to do, if throttling
		* is enabled, it will drop back to a lower target FPS.
		*
		* @param b a boolean value
		* @returns a reference to self
		*/
		this.setThrottling = function(b) {
			this._throttling = (b == true);
			if(!this._throttling) {
				this._runlevels[this._runlevel].last_offs = 0;
			}
			return this;
		};

		/**
		* Returns true if throttling is enabled
		*
		* @returns a boolean value
		*/
		this.isThrottlingEnabled = function() {
			return this._throttling;
		};

		/**
		* Set maximum FPS limit on a specific runlevel. Only takes effect
		* if throttling is enabled.
		* Throttling is enabled by default.
		*
		* @param rl_id integer runlevel id. If the runlevel does not exist, one is created. If parameter is an array, framerate is applied to all runlevels in provided array.
		* @param fps maximum FPS value. Normally, this won't go over 60. Set to 0 to keep at max fps
		* @returns a reference to self
		*/
		this.setRunlevelMaxFramerate = function(rl_id,fps) {
			function set_runlevel_max_rate(rl_id,fps) {
				var rl = this._runlevels[rl_id];
				if(!rl) {
					rl = this._runlevels[rl_id] = new Runlevel();
				}
				rl.max_fps = fps || 0;
			}

			if(rl_id instanceof Array) {
				for(var i = 0; i < rl_id.length; ++i) {
					set_runlevel_max_rate.call(this,rl_id[i],fps);
				}
			} else {
				set_runlevel_max_rate.call(this,rl_id,fps);
			}
			return this;
		};

		/**
		* Return true if we're using RequestAnimationFrame to
		* do our rendering.
		*
		* @returns a boolean value
		*/
		this.isUsingRAF = function() {
			return this._usingRAF;
		};

		/**
		* Forcefully diable usage of RequestAnimationFrame for rendering,
		* even if it is available. For now, this is a debugging feature,
		* for device performance testing (but some buggy environments
		* might actually require this some day).
		*
		* NOTE: You'll need to stop and start the engine for the changes to take effect.
		* NOTE: Currently not a simple task
		*
		* @param enable a boolean value. If true, RAF will not be used even if available.
		* @returns a reference to self
		*/
		this.disableRAF = function(enable) {
			this._disableRAF = (enable == true);
			return this;
		};

		/**
		* Change runlevel of the engine.
		*
		* @returns a reference to self
		*/
		this.setRunlevel = function(idx) {
			if(!this._runlevels[idx]) throw new Error("Engine: no runlevel with id " + idx);
			this._runlevels[this._runlevel].last_offs = 0;
			this.onRunlevelChange(this._runlevel,idx);
			this._runlevel = idx;
			this._runlevels[this._runlevel].last_offs = 0;

			return this;
		};

		/**
		* Pause update loop of the engine (but keep refreshing timers, etc)
		*
		* @returns a reference to self
		*/
		this.pause = function() {
			if(!this._paused) {
				this._paused = true;
				if(this._running) {
					this._tm_pause = this._tm_current;
				} else {
					this._tm_pause = this.time();
				}
				this.onPause.call(this);
			}

			return this;
		};

		/**
		* Resume update of the main objects.
		*
		* @returns a reference to self
		*/
		this.resume = function() {
			if(this._paused) {
				this._paused = false;
				this.onResume.call(this);
			}

			return this;
		};

		/**
		* Return paused state
		*
		* @returns a boolean value
		*/
		this.isPaused = function() {
			return this._paused;
		};

		/**
		* Find out if Engine is running
		*
		* @returns a boolean value
		*/
		this.isRunning = function() {
			return this._running;
		};

		/**
		* Engine update function. Normally called by engine driver.
		*
		*/
		this.__update = function() {

			var rl = this._runlevels[this._runlevel];

			// Update time
			this._tm_last = this._tm_current;
			var tm_cur = this._tm_current = this.time();
			this._tm_delta = tm_cur - this._tm_last;
			var sync = this._tm_sync = (this._tm_delta * 0.001) * this._tm_scale;
			this._framecount++;
			if(tm_cur - this._fps_tm >= 1000) {
				this._fps_tm = tm_cur;
				this._fps_curr = this._fps_count;
				this._fps_count = 0;
			}

			// Update buttons (!)
			this.__updateButtons();

			// Update input
			this._input.update();
			
			// Process runlevel only if Engine is not paused
			if(!this._paused) {
				// Always trigger onUpdate
				//this.onUpdate.call();
				this.update(sync);
				this.redraw();
			}

			// Update frame count (mostly debugging feature)
			++(this._framecount);
			++(this._fps_count);

			// Apply max-fps throttling, if needed
			if(this._throttling && rl.max_fps) {
				// Get processing time spent
				var tm = this.time();
				var tm_spent = tm - tm_cur;

				// Calculate max timeslice
				var tm_frame = 1000.0 / rl.max_fps;
				rl.last_offs = tm_frame - tm_spent;
			} else {
				rl.last_offs = 0;
			}

		};

		/**
		 * Ugly function for updating softbuttons
		 *
		 */
		this.__updateButtons = function()  {
			var rl = this._runlevels[this._runlevel];
			var mx = this._input.getActualX();
			var my = this._input.getActualY();
			var mdown = this._input.isActualDown();
			var need_redraw = false;
			
			for(var i = 0, l = rl.buttons.length; i < l; ++i) {
				var b = rl.buttons[i];
				if(b.visible && b.update(mx,my,mdown)) {
					need_redraw = true;
					this._input.cancelPosition().cancelClick();
				}
			}

			if(this._paused && need_redraw) {
				this.redraw();
			}
			
		};

		/**
		* Update all current runlevel logic objects, i.e.
		* functions, timers, and actors
		*
		* @param sync [optional] sync value
		*/
		this.update = function(sync) {

			// Set sync to something smart...
			if(sync === undefined) sync = 0;

			// Get a runlevel reference..
			var rl = this._runlevels[this._runlevel];

			// Run through function list
			for(var i = 0, l = rl.functions.length; i < l; ++i) {
				var f = rl.functions[i];
				f.fn.call(f.ctx);
			}

			// Update timers
			for(var i = 0, l = rl.timers.length; i < l; ++i) {
				var t = rl.timers[i];
				if(t._active) {
					t.update(sync);
				}
			}

			// Update actors
			for(var i = 0, l = rl.actors.length; i < l; ++i) {
				var a = rl.actors[i];
				if(a._active) {
					a.update(sync);
				}
			}

		};

		/**
		* Update all Scenes (i.e. re-draw everything on the current runleve).
		*/
		this.redraw = function() {

			// Get a runlevel reference
			var rl = this._runlevels[this._runlevel];

			// Update (draw) scenes
			for(var i = 0, l = rl.scenes.length; i < l; ++i) {
				var s = rl.scenes[i];
				if(s._active) {
					s.draw();
				}
			}
		};

		/**
		 * Set time scale. This scales the effective value of
		 * getTimeSync.
		 */
		this.setTimeScale = function(scale) {
			if(scale === undefined) scale = 1;
			this._tm_scale = scale;
			return this;
		};

		/**
		 * Get the time scaling value
		 */
		this.getTimeScale = function() {
			return this._tm_scale;
		};
		
		/**
		* Returns the time elapsed between frames, in seconds.
		* Also known as 'magic sync value'
		*
		* @returns time between frames in seconds
		*/
		this.getTimeSync = function() {
			return this._paused ? 0 : this._tm_sync;
		};

		/**
		* Returns the time elapsed between frames, in millseconds
		*
		* @returns time between frames in milliseconds
		*/
		this.getTimeDelta = function() {
			return this._tm_delta;
		};

		/**
		* Returns the timestamp of the current frame
		*
		* @returns current timestamp, in millseconds
		*/
		this.getTimeCurrent = function() {
			return this._tm_current;
		};

		/**
		* Returns the timestamp of the previous frame
		*
		* @returns previous frame timestamp, in milliseconds
		*/
		this.getTimeLast = function() {
			return this._tm_last;
		};

		/**
		* Get the current number of frames per second processed.
		* Updates once per second.
		*
		* @returns an integer value
		*/
		this.getFrameRate = function() {
			return this._fps_curr;
		};

		/**
		* Get the current number of frames rendered. This updates
		* at about 60 frames per second at most (under normal
		* circumstances), unless you're benchmarking for performance,
		* in which case we'll expect no more than ~400 frames
		* per second..
		* Either way, framecount is a simple counter, always counting
		* up from 0, and never resetting. The counter will overflow
		* in roughly two month's time of uninterrupted operation,
		* under expected circumstances (i.e., in about 62 days, running at 400fps).
		* YMMV.
		*
		* @returns an integer value, indicating number of frames processed since Engine instantiation.
		*/
		this.getFrameCount = function() {
			return this._framecount;
		};

		Object.seal && Object.seal(this);
		Engine.__instance = this;
	};

	// Store an engine reference in the Engine function object..
	Engine.__instance = null;

	/**
	* Engine singleton accessor. Engine must be initialized by calling new Engine() once.
	*
	* @returns An Engine instance (always the same instance)
	*/
	Engine.getInstance = function() {
		if(!Engine.__instance) throw new Error("Initialize Engine first by calling 'new Engine()'");
		return Engine.__instance;
	};
	
	Engine.getDummyCanvas = function() {
		return dummyCanvas;
	};
	
	Engine.getDummyContext = function() {
		return dummyContext;
	};

	/**
	 * Driving function. Calls Engine.update() successively,
	 * adjusting timeout based on time to complete previous iteration,
	 * attempting to maintain a steady frame-rate. Work in progress.
	 *
	 * Should also auto-throttle when demand on game engine is minimal.
	 * For now, we rely on manually specified maximum framerates
	 */
	Engine.__driver = function() {

		//
		// Figure out RequestAnimationFrame
		//

		var raf = window.requestAnimationFrame ||
				  window.webkitRequestAnimationFrame ||
				  window.mozRequestAnimationFrame ||
				  window.oRequestAnimationFrame ||
				  window.msRequestAnimationFrame;

		var that = this;
		var fn = null;

		if(raf) {

			// RAF version
			////////////////

			// Consider using other means for game logic update
			// and use RAF only for drawing
			
			fn = function() {
				if(that._running) {
					var tm = that._runlevels[that._runlevel].last_offs;
					if(tm) {
						raf(function() {
							that.__update();
						});
						setTimeout(fn,tm);
					} else {
						that.__update();
						raf(fn);
					}
				}
			};

			raf(fn);

			this._usingRAF = true;

		} else {

			// FALLBACK version
			/////////////////////

			fn = function() {
				if(that._running) {
					that.__update();
					var tm = that._runlevels[that._runlevel].last_offs;
					setTimeout(fn,tm);
				}
			};

			// Run the update function on the next frame
			setTimeout(fn,1);

		}
	};


	Object.seal && Object.seal(Engine);

	ns.Engine = Engine;

})(window);
