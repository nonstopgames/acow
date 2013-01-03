/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * Actor.js
 * 
 * Provides an easily pluggable system for updatable
 * game objects. Somewhat questionable including it
 * in /engine/, but this is supposed to plug into
 * the Engine class's update loop..
 *
 * NOTE: The priority system exists to be able to guarantee
 * at least some level of stability in actor processing order.
 * While you would not worry about in what order particular
 * enemies get processed, you probably want the player to be
 * processed first. As such, you should give the player a higher
 * priority value, making sure he gets processed befor the
 * bad guys.
 *
 * creation date: 04-06-2012
 * 
 */

"use strict";

/**
 * Creates a new Actor.
 * 
 * This should be inherited from in actual game objects.
 */
function Actor() {

	this._engine = null;     // Back-pointer to engine..
	this._active = true;
	this._priority = 0;
	
};

/**
 * Mark the Actor as active or inactive.
 * If Actor is not active, Engine will skip processing it.
 *
 * @param b a boolean value.
 * @returns a reference to self.
 */
Actor.prototype.setActive = function(b) {
	this._active = (b == true);            // Force boolean conversion
	return this;
};

/**
 * Get the actors's active state.
 * If Actor is not active, Engine will skip processing it.
 *
 * @returns a boolean value
 */
Actor.prototype.isActive = function() {
	return this._active == true;
};

/**
 * Set the actor object's processing priority
 *
 * @param prio an integer value
 * @returns a reference to self
 */
Actor.prototype.setPriority = function(prio) {
	this._priority = +prio;
	return this;
};

/**
 * Get the actor object's processing priority
 */
Actor.prototype.getPriority = function() {
	return this._priority;
};


/**
 * Dummy ('virtual') function for updating Actor state.
 *
 * @param sync time elapsed between the last frame and this frame, in seconds.
 */
Actor.prototype.update = function(sync) {
	return this;
};
