/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * Scene.js
 *
 * Root nodes for scene graphs. Provided for
 * convenience, correctness and completeness.
 *
 * creation date: 06-06-2012
 */

"use strict";

/**
 * Scene node. Scenes are the base-level nodes
 * of a scene graph. The Scene sets up and
 * simplifies handling of a hierarchical scene graph.
 *
 * @param canvas a Canvas object to draw into. Uses the Canvas's 2D drawing context.
 * 
 */
function Scene(canvas) {
	SceneNode.call(this);
	
	this._canvas = canvas;
	this._active = true;
	this._autoclear = false;

	this._scene_max_w = 0;
	this._scene_max_h = 0;

	this._makeRootNode();
	
}
Scene.inherits(SceneNode);

/**
 * Set Scene as active (inactive scenes are ignored by Engine)
 *
 * @param b a boolean value
 * @returns a reference to self
 */
Scene.prototype.setActive = function(b) {
	this._active = (b == true);
	return this;
};

/**
 * Get Scene's active state
 *
 * @returns a boolean value
 */
Scene.prototype.isActive = function() {
	return this._active;
};

/**
 * Enable or disable automatic wiping of the rendering context.
 * Wiping is enabled by default.
 *
 * @param b a boolean value
 * @returns a refrence to self
 */
Scene.prototype.setAutoClear = function(b) {
	this._autoclear = (b == true);
	return this;
};

/**
 * Get status of the autoclear function
 *
 * @returns a boolean value
 */
Scene.prototype.isAutoClearEnabled = function() {
	return this._autoclear;
};

/**
 * Set maximum size of scene
 */
Scene.prototype.setMaxSceneSize = function(w,h) {
	this._scene_max_w = Math.abs(w || 0);
	this._scene_max_h = Math.abs(h || 0);
	return this;
};

/**
 * Get width of scene
 */
Scene.prototype.getSceneWidth = function() {
	var mw = this._scene_max_w;
	if(mw) 
		return Math.min(mw,this._canvas.width);
	return this._canvas.width;
};

/**
 * Get height of scene
 */
Scene.prototype.getSceneHeight = function() {
	var mh = this._scene_max_h;
	if(mh)
		return Math.min(mh,this._canvas.height);
	return this._canvas.height;
};

/**
 * Entry point for draw functionality. Normally called by Engine,
 * but can also be called manually.
 *
 * @returns a reference to self
 */
Scene.prototype.draw = function() {

	// Prepare the scene node's matrix stack
	SceneNode._mstack[0].identity().translate(this._x,this._y).rotate(-this._rotation * window.DEG_TO_RAD).scale(this._scale);
	
	// Just access all nodes by private members..
	var p = this._head;
	var ctx = this._canvas.getContext('2d');
	ctx.fillStyle = "rgba(0,0,0,1)";
	ctx.strokeStyle = "rgba(255,255,255,1)";
	
	ctx.setTransform(1,0,0,1,0,0);
	if(this._autoclear) {
		ctx.clearRect(0,0,this._canvas.width,this._canvas.height);
	}
	while(p) {
		if(p.visible) {
			p._recursive_draw(this._canvas,ctx,1);
		}
		p = p._next;
	}

	return this;  // No idea if this return will ever be useful
	
};
