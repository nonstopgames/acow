/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 *  Animation.js
 *
 * Animation handling code. Works as an ImageSource for Sprites.
 * 
 * creation date: 05-06-2012
 */ 

"use strict";

/**
 * Creates a new Animation.
 *
 * @param src_id Asset Manager ID of source graphic.
 */
function Animation(src, frame_width, frame_height, frame_rate) {

	ImageSource.call(this);
	
	// Acquire a source
	if(src instanceof Image) {
		this.source_data = src;
	} else {
		throw new Error("Animation has no image source");
	}
	
	// Verify parameters
	if(frame_width  === undefined) frame_width  = this.source_data.width;
    if(frame_height === undefined) frame_height = this.source_data.height;
	if(frame_rate   === undefined) frame_rate   = 1;

	// Properties
	this._num_frames = Math.floor(src.width / frame_width) * Math.floor(src.height / frame_height);
	
	// Parameters
	this._anim_sequence_idx = 0;
	this._frame_rate = frame_rate;
	this._anim_frame_duration = 1.0 / frame_rate;
	this._anim_duration = (1.0 / frame_rate) * this._num_frames;
	
	this._anim_current_frame = 0;
	this._anim_last_frame = 0;

	this._anim_last_tm = 0;

	this._anim_looping = true;
	this._anim_playing = false;
	this._anim_rewind = false;
	this._anim_blending = false;
	this._anim_forward = true;
	this._anim_time = 0;
	
	this.source_x = 0;
	this.source_y = 0;
	this.source_w = frame_width;
	this.source_h = frame_height;
}
Animation.inherits(ImageSource);

Animation.Sequence = function() {
	this.start_frame = 0;
	this.end_frame = 0;
	this.frame_rate = 0;
};

/**
 * Get a working copy of the Animation.
 *
 * @returns a new Animation object
 */
Animation.prototype.copy = function() {
	
	var a = new Animation(this.source_data, this.source_w,this.source_h, this._frame_rate);
	a._anim_looping = this._anim_looping;
	a._num_frames = this._num_frames;
	a._anim_blending = this._anim_blending;
	a._anim_forward = this._anim_forward;
	return a;
	
};

Animation.prototype.reset = function() {
	this._anim_time = 0;
	this._anim_current_frame = 0;
	this._anim_last_frame = 0;


	return this;
};

/**
 *
 */
Animation.prototype.play = function() {
	this._anim_playing = true;
	return this;
};

/**
 *
 */
Animation.prototype.stop = function() {
	this._anim_playing = false;
	return this;
};

/**
 *
 */
Animation.prototype.isPlaying = function() {
	return this._anim_playing;
};

/**
 *
 */
Animation.prototype.isStopped = function() {
	return !this._anim_playing;
};

/**
 *
 */
Animation.prototype.setLooping = function(b) {
	this._anim_looping = (b == true);
	return this;
};

/**
 *
 */
Animation.prototype.isLooping = function() {
	return this._anim_looping;
};

/**
 *
 */
Animation.prototype.setFrameBlending = function(b) {
	this._anim_blending = (b == true);
	return this;
};

/**
 *
 */
Animation.prototype.isFrameBlendingEnabled = function() {
	return this._anim_blending;
};

/**
 *
 */
Animation.prototype.setFramerate = function(rate) {
	this._frame_rate = rate;
	this._anim_frame_duration = 1.0 / rate;
	this._anim_duration = this._anim_frame_duration * this._num_frames;
	return this;
};

/**
 *
 */
Animation.prototype.getFramerate = function() {
	return this._frame_rate;
};

/**
 * Set animation speed by setting a duration
 */
Animation.prototype.setDuration = function(duration) {
	this.setFramerate(this._num_frames / duration);
	return this;
};

/**
 * Get the duration of the animation at the current framerate
 */
Animation.prototype.getDuration = function() {
	return this._anim_duration;
};

/**
 * Get the index of the current frame
 *
 * @returns an integer
 */
Animation.prototype.getCurrentFrameNum = function() {
	return this._anim_current_frame;
};


/**
 * Get the total number of frames in this animation
 *
 * @returns an integer
 */
Animation.prototype.getNumFrames = function() {
	return this._num_frames;
};

/**
 * DANGER, WILL ROBINSON! This function exists so that you can
 * force a certain frame count for the animation (which is normally
 * calculated from the frame size/image size ratio). Entering the wrong
 * value will crash the animation code. You have been warned.
 * 
 * @returns a reference to self
 */
Animation.prototype.setNumFrames = function(num) {
	this._num_frames = (+num) | 0;
	return this;
};

/**
 * Set elapsed time
 */
Animation.prototype.setTimeElapsed = function(tm) {
	this._anim_time = tm;
	return this;
};

/**
 * Sets the current frame number
 *
 * @param fnum a number between 0 and the number of frames in this animation
 * @returns a reference to self
 */
Animation.prototype.setFrame = function(fnum,ignore_time) {

	var nFrames = this._num_frames;
	var iw = this.source_data.width;
	var sw = this.source_w;
	var sh = this.source_h;

	fnum |= 0;
	fnum = (this._anim_looping) ? (fnum % nFrames) : ((fnum >= nFrames) ? nFrames - 1 : fnum);
	
	this.source_x = (fnum * sw) % iw;
	this.source_y = (((fnum * sw) / iw) | 0) * sh;
	this._anim_current_frame = fnum;
	
	if(ignore_time !== true) {
		this._anim_time = fnum * (this._anim_duration / nFrames);
	}
	
	return this;
};

/**
 * Update animation drawing rect
 */
Animation.prototype.update = function(sync) {

	var nFrames = this._num_frames;
	var time = this._anim_time;
	var fdur = this._anim_frame_duration;
	var frame = 0;

	if(this._anim_playing) {

		time += sync;
		time = Math.float_mod(time,fdur * nFrames);
		frame = Math.floor(time / fdur);

		if(!this._anim_looping && frame >= nFrames - 1) {
			this._anim_playing = false;
		}

		this._anim_time = time;
		this.setFrame(frame,true);
		
	}
	
};

/**
 * Draws a single frame of the Animation. 
 */
Animation.prototype.draw = function(context,x,y) {

	var ga;
	var opacity_max = context.globalAlpha;
	var data = this.source_data;
	var sx = this.source_x;
	var sy = this.source_y;
	var sw = this.source_w;
	var sh = this.source_h;
	var nframes = this._num_frames;
	var looping = this._anim_looping;
	var fdur = this._anim_frame_duration;
	var tm = this._anim_time;

	if(this._anim_blending) {

		// Draw current image
		context.drawImage(data,sx,sy,sw,sh,x,y,sw,sh);

		// Figure out next image..		
		var iw = data.width;
		var fnum = (this._anim_current_frame + 1) | 0;
		fnum = looping ? (fnum % nframes) : ((fnum >= nframes) ? nframes - 1 : fnum);
		sx = (fnum * sw) % iw;
		sy = (((fnum * sw) / iw) | 0) * sh;

		// Draw next image
		ga = (Math.float_mod(tm,fdur) / fdur) * opacity_max;
		context.globalAlpha = (ga > 1) ? 1 : ((ga < 0) ? 0 : ga);
		context.drawImage(data,sx,sy,sw,sh,x,y,sw,sh);
		context.globalAlpha = opacity_max;
		
	} else {
		context.drawImage(data,sx,sy,sw,sh,x,y,sw,sh);
	}
	
};

/*
 * Creates a sprite 'on-the-fly' that serves as the
 * animation sprite as the woobling animation on the source
 * then return the animation with the sprite
 */

Animation.createWooblingAnimation = function(img, skewAngle, w, h, frames){
	w = w | img.width;
	h = h | img.height;
	frames = frames | 4;

	var iw = img.width,
		ih = img.height,
		sw = w / 2 - iw / 2,
		sh = h / 2 - ih / 2;

	var cimg = document.createElement('canvas');
	
	cimg.setAttribute('width', w);
	cimg.setAttribute('height', h * frames);
	var context = cimg.getContext('2d');

	var matrix = new mat2(),
		skew = new mat2([1, 0, Math.tan(skewAngle), 1, 0, 0]),
		skewback = new mat2([1, 0, Math.tan(-skewAngle), 1, 0, 0]);

	matrix.identity();

	for(var i = 0; i < frames; i++){
		matrix.identity();
		matrix.translate(sw + iw / 2, sh + ih + h * i);
		if(i % 3 == 1){
			matrix.multiplySelf(skew);
		}else if(i % 3 == 0){
			matrix.multiplySelf(skewback);
		}
		matrix.translate(0, -ih / 2);
		matrix.applyTo(context);
		context.drawImage(img, 0, 0, iw, ih, -iw / 2, -ih / 2, iw, ih);
	}

	var aniimg = new Image();

	aniimg.src = cimg.toDataURL();

	var a = new Animation(aniimg, w, h);
	a.setNumFrames(frames);
	
	a.setDuration(0.5);

	a.setLooping(true);

	return a;
};
