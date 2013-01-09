// Bozz, forked from Buzz
// It's like boss
// Fuse in Web Audio which makes audio great on iOS
// Also supports fake multi-channel audio play-back
//      which is free with web audio
//      and achieved with HTML5 Audio Elements through the use of multiple elements (configurable)
// Event system is removed
// ----------------------------------------------------------------------------
// Buzz, a Javascript HTML5 Audio library
// v 1.0.x beta
// Licensed under the MIT license.
// http://buzz.jaysalvat.com/
// ----------------------------------------------------------------------------
// Copyright (C) 2011 Jay Salvat
// http://jaysalvat.com/
// ----------------------------------------------------------------------------
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files ( the "Software" ), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// ----------------------------------------------------------------------------

var bozz = {
    defaults: {
        autoplay: false,
        duration: 5000,
        formats: ['mp3', 'ogg'],
        loop: false,
        placeholder: '--',
        preload: 'metadata',
        volume: 80,
        perSoundLimit: 4  // fake parallel sound effect
    },
    types: {
        'mp3': 'audio/mpeg',
        'ogg': 'audio/ogg'
    },
    sounds: [],
    usingWebAudio: false,
    el: document.createElement( 'audio' ),

    sound: function( src, options ) {
        options = options || {};

        var pid = 0,
            events = [],
            eventsOnce = {},
            supported = bozz.isSupported(),
            sounds = [];

        this.sounds = sounds;

		// maximum number of audio elements per sound
        var limit = options.single ? 1 : bozz.defaults.perSoundLimit;

        var loaded = 0;

        // publics
        this.load = function() {
            if ( !supported ) {
              return this;
            }

            sounds.forEach(function(s){s.load();});
            return this;
        };

        this.play = function() {
            if ( !supported ) {
              return this;
            }

            if(loaded === limit) {
				// play first paused or ended sounds. Then ones that are
				// near completed.
                var s = sounds[0];
                if(!s.paused && (!s.ended)){
                    for(var i = 1; i < sounds.length; i++){
                        if(sounds[i].paused || sounds[i].ended){
                            s = sounds[i];
                            break;
                        }
                        if(s.currentTime > sounds[i].currentTime){
                            s = sounds[i];
                        }
                    }
                }
                s.pause();
                s.currentTime = 0;
                s.play();
            }
            return this;
        };

        this.togglePlay = function() {
            if ( !supported ) {
              return this;
            }

            if ( this.isPaused() ) {
                this.play();
            } else {
                this.pause();
            }
            return this;
        };

        this.pause = function() {
            if ( !supported ) {
              return this;
            }

            if(loaded === limit){
               sounds.forEach(function(s){
                    s.pause();
                });
            }
            return this;
        };

        this.isPaused = function() {
            if ( !supported ) {
              return null;
            }

            return sounds.every(function(s){
                return s.paused;
            });
        };

        this.stop = function() {
            if ( !supported  ) {
              return this;
            }

            this.setTime( 0 );
            sounds.forEach(function(s){
                s.pause();
                s.currentTime = 0;
            });
            return this;
        };

        this.isEnded = function() {
            if ( !supported || limit > 1 ) {
              return null;
            }

            return sounds[0].ended;
        };

        this.loop = function() {
            if ( !supported || limit > 1) {
              return this;
            }

            sounds[0].loop = 'loop';
            return this;
        };

        this.unloop = function() {
            if ( !supported ) {
              return this;
            }

            sounds[0].removeAttribute( 'loop' );
            return this;
        };

        this.mute = function() {
            if ( !supported ) {
              return this;
            }

            sounds.forEach(function(s){
                s.muted = true;
            });
            return this;
        };

        this.unmute = function() {
            if ( !supported ) {
              return this;
            }

            sounds.forEach(function(s){
                s.muted = false;
            });
            return this;
        };

        this.toggleMute = function() {
            if ( !supported ) {
              return this;
            }

            sounds.forEach(function(s){
                s.muted = !s.muted;
            });
            return this;
        };

        this.isMuted = function() {
            if ( !supported ) {
              return null;
            }

            return sounds.every(function(s){
                return s.muted;
            });
        };

        this.setVolume = function( volume ) {
            if ( !supported ) {
              return this;
            }

            if ( volume < 0 ) {
              volume = 0;
            }
            if ( volume > 100 ) {
              volume = 100;
            }
          
            this.volume = volume;
            sounds.forEach(function(s){
                s.volume = volume / 100;
            });
            return this;
        };
      
        this.getVolume = function() {
            if ( !supported ) {
              return this;
            }

            return sounds[0].volume;
        };

        this.increaseVolume = function( value ) {
            return this.setVolume( this.volume + ( value || 1 ) );
        };

        this.decreaseVolume = function( value ) {
            return this.setVolume( this.volume - ( value || 1 ) );
        };

        this.setPercent = function( percent ) {
            if ( !supported || limit > 1) {
              return this;
            }

            return this.setTime( bozz.fromPercent( percent, sounds[0].duration ) );
        };

        this.getPercent = function() {
            if ( !supported || limit > 1) {
              return null;
            }

			var percent = Math.round( bozz.toPercent( sounds[0].currentTime, sounds[0].duration ) );
            return isNaN( percent ) ? bozz.defaults.placeholder : percent;
        };

        this.setSpeed = function( duration ) {
			if ( !supported ) {
              return this;
            }
            sounds.forEach(function(s){
                s.playbackRate = duration;
            });
        };

        this.getSpeed = function() {
			if ( !supported ) {
              return null;
            }

            return sounds[0].playbackRate;
        };

        this.getDuration = function() {
            if ( !supported ) {
              return null;
            }

            var duration = Math.round( sounds[0].duration * 100 ) / 100;
            return isNaN( duration ) ? bozz.defaults.placeholder : duration;
        };

        this.getPlayed = function() {
			if ( !supported || limit > 1) {
              return null;
            }

            return timerangeToArray( sounds[0].played );
        };

        this.getBuffered = function() {
			if ( !supported || limit > 1) {
              return null;
            }

            return timerangeToArray( sounds[0].buffered );
        };

        this.getSeekable = function() {
			if ( !supported || limit > 1 ) {
              return null;
            }

            return timerangeToArray( sounds[0].seekable );
        };

        this.getErrorCode = function(ind) {
            ind = ind || 0;
            if ( supported && sounds[ind].error && ind < limit) {
                return sounds[ind].error.code;
            }
            return 0;
        };

        this.getErrorMessage = function(ind) {
			if ( !supported ) {
              return null;
            }

            switch( this.getErrorCode(ind) ) {
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

        this.getStateCode = function(ind) {
            ind = ind || 0;
			if ( !supported && ind < limit) {
              return null;
            }

            return sounds[ind].readyState;
        };

        this.getStateMessage = function(ind) {
			if ( !supported ) {
              return null;
            }

            switch( this.getStateCode(ind) ) {
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

        this.getNetworkStateCode = function(ind) {
            ind = ind || 0;
			if ( !supported && ind < limit) {
              return null;
            }

            return sounds[ind].networkState;
        };

        this.getNetworkStateMessage = function(ind) {
			if ( !supported ) {
              return null;
            }

            switch( this.getNetworkStateCode(ind) ) {
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

        this.fadeTo = function( to, duration, callback ) {
			if ( !supported ) {
              return this;
            }

            if ( duration instanceof Function ) {
                callback = duration;
                duration = bozz.defaults.duration;
            } else {
                duration = duration || bozz.defaults.duration;
            }

            var from = this.volume,
				delay = duration / Math.abs( from - to ),
                that = this;
            this.play();

            var doFade = function(){
                setTimeout( function() {
                    if ( from < to && that.volume < to ) {
                        that.setVolume( that.volume += 1 );
                        doFade();
                    } else if ( from > to && that.volume > to ) {
                        that.setVolume( that.volume -= 1 );
                        doFade();
                    } else if ( callback instanceof Function ) {
                        callback.apply( that );
                    }
                }, delay );
            };
            doFade();
            return this;
        };

        this.fadeIn = function( duration, callback ) {
            if ( !supported ) {
              return this;
            }

            return this.setVolume(0).fadeTo( 100, duration, callback );
        };

        this.fadeOut = function( duration, callback ) {
			if ( !supported ) {
              return this;
            }

            return this.fadeTo( 0, duration, callback );
        };

        this.fadeWith = function( sound, duration ) {
            if ( !supported ) {
              return this;
            }

            this.fadeOut( duration, function() {
                this.stop();
            });

            sound.play().fadeIn( duration );

            return this;
        };

        // privates
        function timerangeToArray( timeRange ) {
            var array = [],
                length = timeRange.length - 1;

            for( var i = 0; i <= length; i++ ) {
                array.push({
                    start: timeRange.start( length ),
                    end: timeRange.end( length )
                });
            }
            return array;
        }

        function getExt( filename ) {
            return filename.split('.').pop();
        }
        
        function addSource( sound, src ) {
            var source = document.createElement( 'source' );
            source.src = src;
            if ( bozz.types[ getExt( src ) ] ) {
                source.type = bozz.types[ getExt( src ) ];
            }
            sound.appendChild( source );
        }

        // init
        if ( supported && src ) {
          
            for(var i in bozz.defaults ) {
              if(bozz.defaults.hasOwnProperty(i)) {
                options[ i ] = options[ i ] || bozz.defaults[ i ];
              }
            }
            var sound;

            for(var i = 0; i < limit; i++){

                sound = document.createElement( 'audio' );

                if ( src instanceof Array ) {
                    for( var j in src ) {
                      if(src.hasOwnProperty(j)) {
                        addSource( sound, src[ j ] );
                      }
                    }
                } else if ( options.formats.length ) {
                    for( var k in options.formats ) {
                      if(options.formats.hasOwnProperty(k)) {
                        addSource( sound, src + '.' + options.formats[ k ] );
                      }
                    }
                } else {
                    addSource( sound, src );
                }

                if ( options.autoplay ) {
                    sound.autoplay = 'autoplay';
                }

                if ( options.preload === true ) {
                    sound.preload = 'auto';
                } else if ( options.preload === false ) {
                    sound.preload = 'none';
                } else {
                    sound.preload = options.preload;
                }
                sounds.push(sound);

                var self = this;
                sound.addEventListener('loadeddata',function(){
                    loaded++;
                    if(loaded === limit){
                        self.onload && self.onload.call(self);
                    }
                });
            }

            if ( options.loop ) {
                this.loop();
            }


            this.setVolume( options.volume );

            bozz.sounds.push( this );
        }
    },

    group: function( sounds ) {
        sounds = argsToArray( sounds, arguments );

        // publics
        this.getSounds = function() {
            return sounds;
        };

        this.add = function( soundArray ) {
            soundArray = argsToArray( soundArray, arguments );
            for( var a = 0; a < soundArray.length; a++ ) {
                sounds.push( soundArray[ a ] );
            }
        };

        this.remove = function( soundArray ) {
            soundArray = argsToArray( soundArray, arguments );
            for( var a = 0; a < soundArray.length; a++ ) {
                for( var i = 0; i < sounds.length; i++ ) {
                    if ( sounds[ i ] == soundArray[ a ] ) {
                        sounds.splice(i, 1);
                        break;
                    }
                }
            }
        };

        this.load = function() {
            fn( 'load' );
            return this;
        };

        his.play = function() {
            fn( 'play' );
            return this;
        };

        this.togglePlay = function( ) {
            fn( 'togglePlay' );
            return this;
        };

        this.pause = function( time ) {
            fn( 'pause', time );
            return this;
        };

        this.stop = function() {
            fn( 'stop' );
            return this;
        };

        this.mute = function() {
            fn( 'mute' );
            return this;
        };

        this.unmute = function() {
            fn( 'unmute' );
            return this;
        };

        this.toggleMute = function() {
            fn( 'toggleMute' );
            return this;
        };

        this.setVolume = function( volume ) {
            fn( 'setVolume', volume );
            return this;
        };

        this.increaseVolume = function( value ) {
            fn( 'increaseVolume', value );
            return this;
        };

        this.decreaseVolume = function( value ) {
            fn( 'decreaseVolume', value );
            return this;
        };

        this.loop = function() {
            fn( 'loop' );
            return this;
        };

        this.unloop = function() {
            fn( 'unloop' );
            return this;
        };

        this.setTime = function( time ) {
            fn( 'setTime', time );
            return this;
        };

        this.set = function( key, value ) {
            fn( 'set', key, value );
            return this;
        };

        this.fade = function( from, to, duration, callback ) {
            fn( 'fade', from, to, duration, callback );
            return this;
        };

        this.fadeIn = function( duration, callback ) {
            fn( 'fadeIn', duration, callback );
            return this;
        };

        this.fadeOut = function( duration, callback ) {
            fn( 'fadeOut', duration, callback );
            return this;
        };

        // privates
        function fn() {
            var args = argsToArray( null, arguments ),
                func = args.shift();

            for( var i = 0; i < sounds.length; i++ ) {
                sounds[ i ][ func ].apply( sounds[ i ], args );
            }
        }

        function argsToArray( array, args ) {
            return ( array instanceof Array ) ? array : Array.prototype.slice.call( args );
        }
    },

    // re-initialise the library to use web audio
	//
	// the dummyFile will be needed if we need to unmute on iOS
    // just pick a smallest audio file. Volume is set to 0 automatically.
	//
    // return true if suceed, false if fail
    initToWebAudio: function(dummyFile){

        if(this.usingWebAudio){
			// already initialized
            return true;
        }
        var Context = window.webkitAudioContext || window.mozAudioContext || window.MSAudioContext;
        if(!Context){
            return false;
        }
        var format = ".mp3";

        if(!this.isMP3Supported()){
            if(this.isOGGSupported()){
				// firefox at least needs .ogg
                format = ".ogg";
            }else{
                // we only support ogg and mp3 but the browser fails us
                return false;
            }
        }

        this.usingWebAudio = true;
        var context = this.context = new Context();

        if(dummyFile){
            var dummySource;
            var request = new XMLHttpRequest();
            request.open("GET", dummyFile, true);
            request.responseType = "arraybuffer";

            var shouldUnmute = false;
             
            request.onload = function() {
                var buf = context.createBuffer(request.response, true);
                // silence the dummy sound
                buf.gain = 0;
                dummySource = context.createBufferSource();
                dummySource.buffer = buf;
                dummySource.connect(context.destination);

                if(shouldUnmute){
                    shouldUnmute = false;
                    dummySource.noteOn(0);
                }
            };
            request.send();

			// This function needs to be called from click handler to enable
			// audio in iOS Safari
            this.unmuteiOS = function(){
                if(dummySource){
                    dummySource.noteOn(0);
                }else{
                    shouldUnmute = true;
                }
            };
        }
        this.sound = function( src, options ) {
            options = options || {};

            var limit = options.single ? 1 : bozz.defaults.perSoundLimit;

            var sources = [];

            // for volume control
            this.gainNode = context.createGainNode();
            this.gainNode.connect(context.destination);

            for(var i = 0; i < limit; i++){
                sources.push({
                    timer: 0,
                    source: null,
                    start: 0,
                    current: 0
                });
            }

            var pid = 0,
                events = [],
                eventsOnce = {},
                supported = bozz.isSupported(),
                self = this; // for closure


            // publics
            this.load = function() {
                if ( !supported ) {
                  return this;
                }

                var request = new XMLHttpRequest();
                request.open("GET", src + format, true);
                request.responseType = "arraybuffer";
                 
                request.onload = function() {
                    self.buffer = context.createBuffer(request.response, true);
                    self.onload && self.onload.call(self);
                };
                request.send();
                return this;
            };

            this.createSourceAndPlay = function(sourceObj, current){
                current = current || 0;
                if(sourceObj.timer !== 0){
                    clearTimeout(sourceObj.timer);
                    sourceObj.source.noteOff(0);
                }
                var source = context.createBufferSource();
                source.loop = this.looping;
                source.buffer = this.buffer;
                source.connect(this.gainNode);
                source.noteGrainOn(0, current, this.buffer.duration - current);
                var timer = setTimeout(function(){
                    sourceObj.timer = 0;
                    sourceObj.source = null;
                }, (this.buffer.duration - current) * 1000);
                sourceObj.source = source;
                sourceObj.start = context.currentTime;
                sourceObj.timer = timer;
            };

            this.play = function() {
                if ( !supported ) {
                  return this;
                }
                if (!this.buffer){
                    return this;
                }

                if(this.isPaused()){
                    // resume
                    this.paused = false;
                    var elavail = false;
                    for(var i = 0; i < limit; i++){
                        if(sources[i].source){
                            this.createSourceAndPlay(sources[i], sources[i].current);
                            elavail = true;
                        }
                    }
                    if(elavail){
                        return this;
                    }
                }

                var toreplace = sources[0];
                if(toreplace.timer !== 0){
                    for(var i = 1; i < limit; i++){
                        if(sources[i].timer === 0){
                            toreplace = sources[i];
                            break;
                        }else{
                            if(sources[i].start < toreplace.start){
                                toreplace = sources[i];
                            }
                        }
                    }
                }
                this.createSourceAndPlay(toreplace);

                return this;
            };

            this.togglePlay = function() {
                if ( !supported ) {
                  return this;
                }

                if ( this.paused ) {
                    this.play();
                } else {
                    this.pause();
                }
                return this;
            };

            this.pause = function() {
                if ( !supported ) {
                  return this;
                }

                for(var i = 0; i < limit; i++){
                    if(sources[i].source){
                        sources[i].source.noteOff(0);
                    }
                    if(sources[i].timer){
                        clearTimeout(sources[i].timer);
                        sources[i].timer = 0;
                        sources[i].current = context.currentTime - sources[i].start;
                    }
                }
                return this;
            };

            this.isPaused = function() {
                if ( !supported ) {
                  return null;
                }
                return sources.every(function(e){
                    return e.timer === 0;
                });
            };

            this.stop = function() {
                if ( !supported  ) {
                  return this;
                }

                for(var i = 0; i < sources.length; i++){
                    if(sources[i].timer){
                        clearTimeout(sources[i].timer);
                        sources[i].timer = 0;
                    }
                    if(sources[i].source){
                        sources[i].source.noteOff(0);
                        sources[i].source = null;
                    }
                    sources[i].current = 0;
                }
                return this;
            };

            this.isEnded = function() {
                if ( !supported ) {
                  return null;
                }

                for(var i = 0; i < limit; i++){
                    if(sources[i].source){
                        return false;
                    }
                }
                return true;
            };

            this.loop = function() {
                if ( !supported ) {
                  return this;
                }

                this.isloop = true;
                return this;
            };

            this.unloop = function() {
                if ( !supported ) {
                  return this;
                }

                this.isloop = false;
                return this;
            };

            this.mute = function() {
                if ( !supported ) {
                  return this;
                }

                this.gainNode.gain.value = 0;
                return this;
            };

            this.unmute = function() {
                if ( !supported ) {
                  return this;
                }

                this.gainNode.gain.value = 1;
                return this;
            };

            this.toggleMute = function() {
                if ( !supported ) {
                  return this;
                }

                if(this.isMuted){
                    this.unmute();
                }else{
                    this.mute();
                }
                return this;
            };

            this.isMuted = function() {
                if ( !supported ) {
                  return null;
                }

                return this.gainNode.gain.value === 0;
            };

            this.setVolume = function( volume ) {
                if ( !supported ) {
                  return this;
                }

                if ( volume < 0 ) {
                  volume = 0;
                }
                if ( volume > 100 ) {
                  volume = 100;
                }
              
                this.volume = volume;
                this.gainNode.gain.value = volume / 100;
                return this;
            };
          
            this.getVolume = function() {
                if ( !supported ) {
                  return this;
                }

                return this.volume;
            };

            this.increaseVolume = function( value ) {
                return this.setVolume( this.volume + ( value || 1 ) );
            };

            this.decreaseVolume = function( value ) {
                return this.setVolume( this.volume - ( value || 1 ) );
            };

            this.getDuration = function() {
                if ( !supported ) {
                  return null;
                }

                return this.buffer.duration;
            };

            this.fadeTo = function( to, duration, callback ) {
                if ( !supported ) {
                  return this;
                }

                if ( duration instanceof Function ) {
                    callback = duration;
                    duration = bozz.defaults.duration;
                } else {
                    duration = duration || bozz.defaults.duration;
                }

                var from = this.volume,
                    delay = duration / Math.abs( from - to ),
                    that = this;
                this.play();

                var doFade = function(){
                    setTimeout( function() {
                        if ( from < to && that.volume < to ) {
                            that.setVolume( that.volume += 1 );
                            doFade();
                        } else if ( from > to && that.volume > to ) {
                            that.setVolume( that.volume -= 1 );
                            doFade();
                        } else if ( callback instanceof Function ) {
                            callback.apply( that );
                        }
                    }, delay );
                };

                doFade();

                return this;
            };

            this.fadeIn = function( duration, callback ) {
                if ( !supported ) {
                  return this;
                }

                return this.setVolume(0).fadeTo( 100, duration, callback );
            };

            this.fadeOut = function( duration, callback ) {
                if ( !supported ) {
                  return this;
                }

                return this.fadeTo( 0, duration, callback );
            };

            this.fadeWith = function( sound, duration ) {
                if ( !supported ) {
                  return this;
                }

                this.fadeOut( duration, function() {
                    this.stop();
                });

                sound.play().fadeIn( duration );

                return this;
            };

            // privates
            function timerangeToArray( timeRange ) {
                var array = [],
                    length = timeRange.length - 1;

                for( var i = 0; i <= length; i++ ) {
                    array.push({
                        start: timeRange.start( length ),
                        end: timeRange.end( length )
                    });
                }
                return array;
            }

            // init
            if(!options.noload){
                this.load();
            }

            bozz.sounds.push( this );
        };
        return true;
    },

    all: function() {
      return new bozz.group( bozz.sounds );
    },

    isSupported: function() {
        return !!bozz.el.canPlayType;
    },

    isOGGSupported: function() {
        return !!bozz.el.canPlayType && bozz.el.canPlayType( 'audio/ogg; codecs="vorbis"' );
    },

    isMP3Supported: function() {
        return !!bozz.el.canPlayType && bozz.el.canPlayType( 'audio/mpeg;' );
    },

	/*
    toTimer: function( time, withHours ) {
        var h, m, s;
        h = Math.floor( time / 3600 );
        h = isNaN( h ) ? '--' : ( h >= 10 ) ? h : '0' + h;
        m = withHours ? Math.floor( time / 60 % 60 ) : Math.floor( time / 60 );
        m = isNaN( m ) ? '--' : ( m >= 10 ) ? m : '0' + m;
        s = Math.floor( time % 60 );
        s = isNaN( s ) ? '--' : ( s >= 10 ) ? s : '0' + s;
        return withHours ? h + ':' + m + ':' + s : m + ':' + s;
    },

    fromTimer: function( time ) {
        var splits = time.toString().split( ':' );
        if ( splits && splits.length == 3 ) {
            time = ( parseInt( splits[ 0 ], 10 ) * 3600 ) + ( parseInt(splits[ 1 ], 10 ) * 60 ) + parseInt( splits[ 2 ], 10 );
        }
        if ( splits && splits.length == 2 ) {
            time = ( parseInt( splits[ 0 ], 10 ) * 60 ) + parseInt( splits[ 1 ], 10 );
        }
        return time;
    },
	*/

    toPercent: function( value, total, decimal ) {
		var r = Math.pow( 10, decimal || 0 );

		return Math.round( ( ( value * 100 ) / total ) * r ) / r;
    },

    fromPercent: function( percent, total, decimal ) {
		var r = Math.pow( 10, decimal || 0 );

        return  Math.round( ( ( total / 100 ) * percent ) * r ) / r;
    }
};
