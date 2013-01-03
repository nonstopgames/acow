/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * Nonstop-games utils.js
 *
 */

"use strict";

Function.prototype.inherits = function( parent ) {
	var that = this;
	var ctor = function() { this.constructor = that; };
	ctor.prototype = parent.prototype;
	this.prototype = new ctor;
	this.__super__ = parent.prototype;
	
	return this;
};

function CopyCanvas( src, dst, fillStyle ) {
	if ( !fillStyle ) fillStyle = '#fff';
	var ctx = dst[0].getContext('2d');
	ctx.fillStyle = fillStyle;
	ctx.fillRect(0, 0, dst.width(), dst.height());
	ctx.drawImage( src[0], 0, 0, src.width(), src.height(), 0, 0, dst.width(), dst.height());
}

function ShuffleArray( array ) {
	// Shuffle array, Fisher-Yates
	for (var i = array.length - 1; i > 0; i--) {
		var j = parseInt(Math.random() * i);
		var tmp = array[i];
		array[i] = array[j];
		array[j] = tmp;
	}
}

window.Meta = function(meta, value) {
	return $('meta[name='+meta+']').attr('content', value);
};

function GetOrdinal( n, tag ) {
	if(n === undefined) return 'N/A';
	if(parseInt( n ) < 1) return 'N/A';
	var s = null;
	if(tag === undefined) {
		s = ["th","st","nd","rd"];
	} else {
		s = ["<"+tag+">th</"+tag+">","<"+tag+">st</"+tag+">","<"+tag+">nd</"+tag+">","<"+tag+">rd</"+tag+">"];
	}
	var v=n%100;
	return n+(s[(v-20)%10]||s[v]||s[0]);
}

window.GetOrdinal = GetOrdinal;
function IsEmail( email ){
	var emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
	return emailPattern.test( email );
}
window.IsEmail = IsEmail;

function Viewport( args ) {
	this.el               = $('#'+args.id ).removeClass('desktop tablet mobile').addClass( args.iface );
	this.iface            = args.iface;
	this.device           = args.device;
	this.deviceOs         = args.deviceOs;
	this.onChange         = args.onChange;
	this.fbCanvas         = args.fbCanvas;
	this.screenInfo       = false;
	// desktop
	this.resizeTimeout    = false;
	// tablet & mobile
	this.orientationEvent = 'orientationchange';
	if ( 'android' == this.deviceOs ) { this.orientationEvent = 'resize'; }
	this.lastOrientation  = -1;
	this.hideAddressBarEnabled = args.hideAddressBarEnabled || true;
	this.pauseAddressBarEnabled = false;
	this.hideAddressBarTimeout = 800;
	this.isHidingAddressBar = false;
	this.isInitializing = true;
	switch ( this.iface ) {
		case 'desktop': this.initializeDesktop(); break;
		case 'tablet' : this.initializeTablet(); break;
		case 'mobile' : this.initializeMobile(); break;
		default: alert('No interface (desktop/tablet/mobile) defined');
	}
	this.isInitializing = false;
	this.isRelative = false;
}

Viewport.prototype.setRelative = function( isRelative ) {
	if ( isRelative ) {
		this.el.css('position','relative');
	} else if ( 'desktop' == this.iface ) this.el.css('position','fixed');
	else this.el.css('position','absolute');
	this.isRelative = isRelative;
	if ( 'desktop' != this.iface ) this.handleScreenRotation( true );
};

Viewport.prototype.triggerOnChange = function() {
	var that = this;
	that.onChange( that.el.width(), that.el.height(), null , $(window).width() , $(window).height() );
};

Viewport.prototype.initializeDesktop = function() {
	if ( undefined === this.onChange ) return;
	var that = this;
	$(window).resize( function() {
		clearTimeout( that.resizeTimeout );
		that.resizeTimeout = setTimeout( function() { that.onChange( that.el.width(), that.el.height(), null , $(window).width() , $(window).height() ); } , 50 );
	});
	that.onChange( that.el.width(), that.el.height(), null , $(window).width() , $(window).height() );
};

Viewport.prototype.initializeTablet = function() {
	var that = this;
	window.addEventListener( this.orientationEvent, function() {
		that.handleScreenRotation();
	}, false);
	this.handleScreenRotation();
};

Viewport.prototype.initializeMobile = function() {
	var that = this;
	window.addEventListener( this.orientationEvent, function() {
		that.handleScreenRotation();
	}, false);
	this.handleScreenRotation();
	var that = this;
	$(window).bind( 'scroll', function() {
		if ( !that.isHidingAddressBar && that.hideAddressBarEnabled ) {
			that.isHidingAddressBar = true;
			that.scrollTimeout = setTimeout( function() {
				that.hideAddressBar();
				setTimeout( function(){ that.isHidingAddressBar = false; }, 200 );
			}, that.hideAddressBarTimeout-200 );
		}
	});
	setTimeout( function(){ window.scrollTo(0, 1); }, 1000 );
};

Viewport.prototype.hideAddressBar = function() {
	if ( !this.isRelative && this.hideAddressBarEnabled && !this.pauseAddressBarEnabled ) {
		window.scrollTo(0, 1);
	}
};

Viewport.prototype.pauseHideAddressBar = function( isPaused ) {
	this.pauseAddressBarEnabled = isPaused;
};

Viewport.prototype.handleScreenRotation = function( force ) {
	if ( undefined === force ) force = false;
	var screen = this.getScreenInfo();
	if ( !force && screen.orientation == this.lastOrientation ) return;
	this.lastOrientation = screen.orientation;
	this.el
	.removeClass('portrait landscape')
	.addClass( screen.orientation )
	.width( screen.width );
	//if ( this.isRelative ) { this.el.css('height','auto'); return; }

	// iOS web application
	if ( navigator.standalone ) {
		this.el.height( screen.height );
	} else {
		var address_bar_height = 0;
		if ( !this.hideAddressBarEnabled ) {
			address_bar_height = 0;
		} else if ( 'ios' == this.deviceOs && 'mobile' == this.iface ) { // iOs mobile (iphone or ipod touch)
			address_bar_height = 60; // iOs address bar height
		}  else if ( 'android' == this.deviceOs && 'portrait' == screen.orientation && !this.isInitializing ) {
			address_bar_height = 59;
		}
		var height = screen.height + address_bar_height;
		if ( 'mobile' == this.iface && this.fbCanvas ) {
			'portrait' == screen.orientation ? height-=64 : height-=58;
		}
		this.el.height( height );
	}
	if ( undefined !== this.onChange ) {
		this.onChange( this.el.width(), this.el.height(), screen.orientation );
	}
	if ( this.hideAddressBarEnabled ) {
		this.hideAddressBar();
	}
};

Viewport.prototype.getScreenInfo = function() {
	if ( this.screenInfo ) {
		var info = this.screenInfo;
		this.screenInfo = false;
		return info;
	}
	var w = $(window);
	var info   = {width:w.width(),height:w.height()};
	var orientation = 'portrait';
	if ( 'ios' == this.deviceOs ) {
		if ( 0 != window.orientation ) {
			orientation = 'landscape';
		}
	} else if ( info.width > info.height ) {
		orientation = 'landscape';
	}
	info.orientation = orientation;
	return info;
};

Viewport.prototype.overrideScreenInfo = function( width, height, orientation ) {
	this.screenInfo = {width:width,height:height,orientation:orientation};
};

function EventHandler( args ) {
	this.el = $('#'+args.id );
	this.dragTolerance = args.dragTolerance || 3;
	this.mouse         = args.mouse;
	this.onClick       = args.onClick;
	this.onDrag        = args.onDrag;
	this.onDragStart   = args.onDragStart;
	this.onDragStop    = args.onDragStop;
	this.dragCursor    = args.dragCursor || null;
	if ( this.mouse ) {
		this.eventStart  = 'mousedown';
		this.eventMove   = 'mousemove';
		this.eventEnd    = 'mouseup';
		this.eventCancel = 'mouseup';
		this.eventLeave  = 'mouseout';
	} else {
		this.eventStart  = 'touchstart';
		this.eventMove   = 'touchmove';
		this.eventEnd    = 'touchend';
		this.eventCancel = 'touchcancel';
	}
	this.lastX      = 0;
	this.lastY      = 0;
	this.offsetX    = 0;
	this.offsetY    = 0;
	this.isDragging = false;
	this.bindHandlers();
	this.updateOffsets();
}

EventHandler.prototype.updateOffsets = function() {
	var offset = this.el.offset();
	this.offsetX = offset.left;
	this.offsetY = offset.top;
};

EventHandler.prototype.bindHandlers = function() {
	var that = this;
	var handlers = null;
	handlers = {
		start : function(e) {
			if ( !that.mouse ) {
				e.preventDefault();
				e = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
			}
			that.lastX = e.pageX;
			that.lastY = e.pageY;
			that.el.bind( that.eventEnd  , handlers.end );
			that.el.bind( that.eventMove , handlers.move );
			if ( that.eventLeave ) {
				that.el.bind( that.eventLeave , handlers.leave );
			}
		},
		move : function(e) {
			if ( !that.mouse ) {
				e.preventDefault();
				e = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
			}
			var delta_x = parseInt(that.lastX-e.pageX);
			var delta_y = parseInt(that.lastY-e.pageY);
			if ( that.isDragging ) {
				that.lastX = e.pageX;
				that.lastY = e.pageY;
				var func = that.onDrag;
				if ( func ) {
					func( parseInt(e.pageX)-that.offsetX, parseInt(e.pageY)-that.offsetY );
				}
			} else if ( (Math.abs(delta_x) > that.dragTolerance || Math.abs(delta_y) > that.dragTolerance) ) {
				that.isDragging = true;
				if ( that.mouse && this.dragCursor ) {
					that.el.css({cursor:this.dragCursor});
				}
				var func = that.onDragStart;
				if ( func ) {
					func( parseInt(e.pageX)-that.offsetX , parseInt(e.pageY)-that.offsetY );
				}
			}
		},
		end : function(e) {
			if ( !that.isDragging ) {
				var func = that.onClick;
				if ( func ) {
					if ( !that.mouse ) {
						e.preventDefault();
						e = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
					}
					func( parseInt(e.pageX)-that.offsetX, parseInt(e.pageY)-that.offsetY );
				}
				handlers.cancel();
			} else {
				handlers.cancel();
				var func = that.onDragStop;
				if ( func ) { func( parseInt(e.pageX)-that.offsetX, parseInt(e.pageY)-that.offsetY ); }
			}
		},
		cancel: function() {
			that.isDragging = false;
			that.el.unbind( that.eventEnd );
			that.el.unbind( that.eventMove );
			that.el.unbind( that.eventCancel );
			if ( that.eventLeave ) {
				that.el.unbind( that.eventLeave );
			}
			if ( this.dragCursor ) {
				that.el.css({cursor:'default'});
			}
		},
		leave: function( e ) {
			handlers.end( e );
		}
	};
	this.el.bind( that.eventStart , handlers.start );
};

// adds 'Add to home screen' widged in iOS browsers
function ShowHomeScreenWidget() {

	// check conditions
	if( $('meta[name=fb_canvas]').attr('content') == 'true' || // inside FB canvas
		tutorialEnabled || // tutorial is on
		$('meta[name=auth_status]').attr('content') != 'true' || // not authed
		$('meta[name=device_os]').attr('content') != 'ios' || // not iOS device
		ShowHomeScreenWidget.widgetAdded ) { // already added
		return;
	}
	addToHome.show();
	ShowHomeScreenWidget.widgetAdded = true;
}

jQuery.cookie = function(name, value, options) {
	if (typeof value != 'undefined') { // name and value given, set cookie
		options = options || {};
		if (value === null) {
			value = '';
			options.expires = -1;
		}
		var expires = '';
		if (options.expires && (typeof options.expires == 'number' || options.expires.toUTCString)) {
			var date;
			if (typeof options.expires == 'number') {
				date = new Date();
				date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
			} else {
				date = options.expires;
			}
			expires = '; expires=' + date.toUTCString(); // use expires attribute, max-age is not supported by IE
		}
		// CAUTION: Needed to parenthesize options.path and options.domain
		// in the following expressions, otherwise they evaluate to undefined
		// in the packed version for some reason...
		var path = options.path ? '; path=' + (options.path) : '';
		var domain = options.domain ? '; domain=' + (options.domain) : '';
		var secure = options.secure ? '; secure' : '';
		document.cookie = [name, '=', encodeURIComponent(value), expires, path, domain, secure].join('');
	} else { // only name given, get cookie
		var cookieValue = null;
		if (document.cookie && document.cookie != '') {
			var cookies = document.cookie.split(';');
			for (var i = 0; i < cookies.length; i++) {
				var cookie = jQuery.trim(cookies[i]);
				// Does this cookie string begin with the name we want?
				if (cookie.substring(0, name.length + 1) == (name + '=')) {
					cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
					break;
				}
			}
		}
		return cookieValue;
	}
};

/**
* A simple querystring parser.
* Example usage: var q = $.parseQuery(); q.fooreturns  "bar" if query contains "?foo=bar"; multiple values are added to an array.
* Values are unescaped by default and plus signs replaced with spaces, or an alternate processing function can be passed in the params object .
* http://actingthemaggot.com/jquery
*
* Copyright (c) 2008 Michael Manning (http://actingthemaggot.com)
* Dual licensed under the MIT (MIT-LICENSE.txt)
* and GPL (GPL-LICENSE.txt) licenses.
**/
jQuery.parseQuery = function(qs,options) {
	var q = false, o = null;
	q = (typeof qs === 'string'?qs:window.location.search);
	o = {'f':function(v){return unescape(v).replace(/\+/g,' ');}}, options = (typeof qs === 'object' && typeof options === 'undefined')?qs:options, o = jQuery.extend({}, o, options), params = {};
	jQuery.each(q.match(/^\??(.*)$/)[1].split('&'),function(i,p){
		p = p.split('=');
		p[1] = o.f(p[1]);
		params[p[0]] = params[p[0]]?((params[p[0]] instanceof Array)?(params[p[0]].push(p[1]),params[p[0]]):[params[p[0]],p[1]]):p[1];
	});
	return params;
};


//
// **************************************************
//    Concatenated contents of old utils.js
// **************************************************
//
// At least drag & drop functionality needs to be migrated to
// new-style event handler.
//

window.requestAnimFrame = (function(){
	return window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.oRequestAnimationFrame ||
		window.msRequestAnimationFrame ||
		function(callback) {
			window.setTimeout(callback, 1000 / 60);
		};
})();

function BindHandleWindowChange( callback ) {
	var orientationEvent = 'orientationchange';
	if ( 'android' == $('meta[name=device_os]').attr('content') ) {
		orientationEvent = 'resize';
	}
	window.addEventListener( orientationEvent, function() {
		HandleWindowChange();
		if ( undefined != callback ) {
			var c = $('#container');
			callback( c.width(), c.height() );
		}
	}, false);


}

var LastOrientation = 'none';
function HandleWindowChange() {
	var window_width = $(window).width();
	var window_height = $(window).height();
	var address_bar_height = 0;
	var orientation;
	if ( window_height > window_width ) {
		orientation = 'portrait';
	} else {
		orientation = 'landscape';
	}
	if ( orientation == LastOrientation ) return;
	LastOrientation = orientation;
	var container   = $('#container');
	container.addClass( orientation );
	container.width( window_width );
	var device_type  = $('meta[name=device]').attr('content');
	var device_os    = $('meta[name=device_os]').attr('content');
	var display_type = $('meta[name=display_type]').attr('content');
	container.width( window_width );
	var container = $('#container').removeClass('portrait landscape');
	window_height > window_width ?
		container.addClass( 'portrait' ) :
		container.addClass( 'landscape' );
	if ( navigator.standalone ) {
		container.height( $(window).height() - 10 );
	} else {
		switch ( device_type ) {
			case 'iPod Touch':
			case 'iPhone': address_bar_height = 60; break;
		}

		if ( 'android' == device_os && 'portrait' == orientation ) {
			address_bar_height = 59;
		}
		if ( '2x' == display_type ) { address_bar_height += address_bar_height; }
		container.height( $(window).height() + address_bar_height );
	}
	if ( address_bar_height ) {
		var scroll = function() { window.scrollTo(0, 1); };
		setTimeout( scroll, 10 );
		if ( parseInt( $('meta[name=game_state]').attr('content') ) > 0 ) {
			scrolltimeout = setTimeout( scroll, 1 );
			$(window).scroll(function() {
				clearTimeout( scrolltimeout );
				scrolltimeout = setTimeout( scroll, 1200 );
			});
		}
	}
}
(function($) {
	$.fn.canvasDragDrop = function( options, arg ) {
		// method calling
		if (typeof options == 'string') {
			var args = Array.prototype.slice.call(arguments, 1),
				res = null;
			this.each(function() {
				var data = $.data(this, 'canvasDragDrop');
				if (data) {
					var meth = data[options];
					if (meth) {
						var r = meth.apply(this, args);
						if (res === undefined) {
							res = r;
						}
					}
				}
			});
			if (res !== undefined) {
				return res;
			}
			return this;
		}

		// initialize options
		var opts = $.extend({}, $.fn.canvasDragDrop.defaults, options);
		this.each(function() {
			var canvas = $(this);
			var start_event, move_event, end_event, cancel_event;
			if ( opts.mouse ) {
				start_event  = 'mousedown';
				move_event   = 'mousemove';
				end_event    = 'mouseup';
				cancel_event = 'mouseup';
			} else {
				start_event  = 'touchstart';
				move_event   = 'touchmove';
				end_event    = 'touchend';
				cancel_event = 'touchcancel';
			}
			var last_x   = 0;
			var last_y   = 0;
			var dragging = false;
			var positions = [];
			//var last_ts  = 0;  // Variable never read
			var handlers = null;
			handlers = {
					start : function(e) {
						if ( !opts.mouse ) {
							e.preventDefault();
							e = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
						}
						last_x = e.pageX;
						last_y = e.pageY;
						canvas.bind( end_event  , handlers.end );
						canvas.bind( move_event , handlers.move );
						if ( opts.momentum ) {
							var ts = Date.now();
							positions.push({ts:Date.now(),x:last_x,y:last_y});
							last_ts = ts;
						}
					},
					move : function(e) {
						if ( !opts.mouse ) {
							e.preventDefault();
							e = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
						}
						var delta_x = parseInt(last_x-e.pageX);
						var delta_y = parseInt(last_y-e.pageY);
						if ( dragging ) {
							last_x = e.pageX;
							last_y = e.pageY;
							var func = opts.onDrag;
							if ( func != null ) { func( parseInt(e.pageX), parseInt(e.pageY) ); }
						} else if ( (Math.abs(delta_x) > opts.tolerance || Math.abs(delta_y) > opts.tolerance) ) {
							dragging = true;
							if ( opts.mouse ) { canvas.css({cursor:'all-scroll'}); }
							var func = opts.onStart;
							if ( func != null ) {
								func( parseInt(e.pageX), parseInt(e.pageY) );
							}
						}
					},
					end : function(e) {
						if ( !dragging ) {
							var func = opts.onClick;
							if ( func != null ) {
								if ( !opts.mouse ) {
									e.preventDefault();
									e = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
								}
								canvas.unbind( end_event );
								canvas.unbind( move_event );
								canvas.unbind( cancel_event );
								canvas.css({cursor:'default'});
								func( parseInt(e.pageX), parseInt(e.pageY) );
							}
						} else {
							dragging = false;
							canvas.unbind( end_event );
							canvas.unbind( move_event );
							canvas.unbind( cancel_event );
							canvas.css({cursor:'default'});
							var func = opts.onStop;
							if ( func != null ) { func( parseInt(e.pageX), parseInt(e.pageY) ); }
						}
					},
					cancel: function( e ) {
						dragging = false;
						canvas.unbind( end_event );
						canvas.unbind( cancel_event );
						canvas.unbind( move_event );
						canvas.css({cursor:'default'});
					}
				};
			canvas.bind( start_event , handlers.start );
			return this;
		});
	};
	
	//defaults
	$.fn.canvasDragDrop.defaults = {
		width : 90*32 ,
		height : 60*32 ,
		tolerance : 5 ,
		mouse : true ,
		onClick : null ,
		onDrag : null ,
		onStart : null ,
		onStop : null
	};
})(jQuery);
