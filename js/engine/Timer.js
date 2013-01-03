/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * Timer.js
 *
 * Simple timer object.
 * Might suffer clock drift on the order of milliseconds
 * to the minute.
 *
 * Accurate enough for 10-second countdown timers.
 *
 * creation date: 11-06-2012
 */

"use strict";

/**
 * Timer object. When added to an Engine runlevel, will be automatically
 * updated, as long as they are marked as active.
 *
 * Provides callback on completion and looping functionality.
 */
function Timer() {

	this._active = false;
	this._loop   = false;
	this._time   = 0.0;
	this._target = 0.0;
	this._onComplete = null;
	
};

/**
 * Set a callback to be executed when a started timer automatically reaches
 * its target.
 *
 * @param fn a Function object, or null (to unset complete callback)
 * @returns a reference to self
 */
Timer.prototype.setCallback = function(fn) {
	if(fn === null || (fn instanceof Function)) {
		this._onComplete = fn;
		return this;
	}
	throw new Error("setCompleteCallback only accepts null or function values!");
};

/**
 * Set looping property of this Timer. If looping is enabled,
 * timer will loop over to 0 when it reaches its target, and
 * execute the complete callback function if set. If looping
 * is disabled, a timer that automatically reaches its target
 * will stop, and remain in a completed state.
 *
 * @param b a boolean value
 * @returns a reference to self
 */
Timer.prototype.setLooping = function(b) {
	this._active = (b == true);
	return this;
};

/**
 * Get value of looping property. See setLooping.
 * @returns a boolean value
 */
Timer.prototype.isLooping = function() {
	return this._active;
};

/**
 * Start the timer. This sets the timer's active
 * property. Started timers are automatically updated
 * until they reach their target values. If timer has
 * been set to loop, the timer will continue counting
 * from 0 once target is reached. If looping is disabled,
 * Timer will stop.
 *
 * See functions stop(), setLooping(), setTarget() and
 * setCallback().
 *
 * @returns a reference to self
 */
Timer.prototype.start = function() {
	this._active = true;
	return this;
};

/**
 * Stop the timer. The Timer will no longer be updated
 * by Engine. Call start to return to regular updates.
 * See functions start(), setLooping() and setTarget()
 *
 * @returns a reference to self
 */
Timer.prototype.stop = function() {
	this._active = false;
	return this;
};

/**
 * Set target time
 *
 * @param tm_seconds Target time, in seconds
 * @returns a reference to self
 */
Timer.prototype.setTarget = function(tm_seconds) {
	this._target = +tm_seconds;
	return this;
};

/**
 * Get target time
 */
Timer.prototype.getTarget = function() {
	return this._target;
};

/**
 * Return time elapsed, in seconds
 */
Timer.prototype.getElapsed = function() {
	return this._time;
};

/**
 * Return time remaining, in seconds
 * 
 */
Timer.prototype.getRemaining = function() {
	var d = this._target - this._time;
	if(d < 0) d = 0;
	return d;
};

/**
 * Return time remaining, in whole seconds. (function name
 * might have to change - it's confusing as it is)
 */
Timer.prototype.getRemainingSeconds = function() {
	var d = this._target - this._time;
	if(d < 0) d = 0;
	d = Math.floor(d);
	return d;
};

/**
 * Forcefully add time to elapsed time count.
 *
 * @param delta time, in seconds, to add to elapsed time
 * @returns a 
 */
Timer.prototype.addTime = function(delta) {
	this._time += delta;
	return this;
};

/**
 * Find out, as a percentage, how close to completion the timer is.
 * This can be used as input for an easing function.
 *
 * @returns a value between 0.0 and 1.0
 */
Timer.prototype.getProgress = function() {
	return this._time / this._target;
};

/**
 * Sets elapsed time to 0.
 *
 * @returns a reference to self
 */
Timer.prototype.reset = function() {
	this._time = 0.0;
	return this;
};

/**
 * Find out if the timer has reached its target
 *
 * @returns a boolean value
 */
Timer.prototype.isComplete = function() {
	return this._time >= this._target;
};

Timer.prototype.isActive = function() {
	return this._active;
};

/**
 * Update function, normally called by Engine.
 * Elapsed time is only updated if _active is true.
 *
 * @param delta time difference between current frame and last, in seconds
 */
Timer.prototype.update = function(delta) {

	// NOTE: this function also tests for _active, since the Engine isn't
	// necessarily the only thing updating these timers...
	if(this._active) {
		this._time += delta;

		if(this._time >= this._target) {
			if(this._onComplete !== null) {
				this._onComplete.apply(this);
			}
			if(this._loop) {
				this._time = Math.float_mod(this._time,this._target);
			} else {
				this._active = false;
			}
		}
	}
	
};
