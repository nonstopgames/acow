/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * Vector.js
 *
 * Vector math classes and functions
 * 
 * creation date: 04-06-2012
 */

"use strict";

/**
 * 2D vector class
 */
function vec2(x,y) {
	this.x = (x === undefined) ? 0.0 : x;
	this.y = (y === undefined) ? 0.0 : y;
};

/**
 * Set vector components through a function call
 *
 * @param x x component - 0, if undefined
 * @param y y component - 0, if undefined
 * @returns a reference to self
 */
vec2.prototype.set = function(x,y) {
	this.x = (x === undefined) ? 0.0 : x;
	this.y = (y === undefined) ? 0.0 : y;
	return this;
};

/**
 * Returns length of 2D vector
 *
 * @returns length of vector (float)
 */
vec2.prototype.length = function() {
	return Math.sqrt((this.x * this.x) + (this.y * this.y));
};

/**
 * Returns squared length of 2D vector
 *
 * @returns squared length of vector (float)
 */
vec2.prototype.length2 = function() {
	return (this.x * this.x) + (this.y * this.y);
};

/**
 * Normalizes the vector
 *
 * @returns a reference to self
 */
vec2.prototype.normalize = function() {
	var l = 1.0 / Math.sqrt((this.x * this.x) + (this.y * this.y));
	this.x *= l;
	this.y *= l;
	return this;
};

/**
 * Gets a normalized copy of the vector
 *
 * @returns a new vector
 */
vec2.prototype.getNormalized = function() {
	var l = 1.0 / Math.sqrt((this.x * this.x) + (this.y * this.y));
	return new vec2(this.x * l,this.y * l);
};

/**
 * Returns distance to a point represented by another vector
 *
 * @returns distance to other point (float)
 */
vec2.prototype.distanceTo = function(other,y) {
	var dx, dy;
	if(y !== undefined) {
		dx = this.x - other;
		dy = this.y - y;
	} else {
		dx = this.x - other.x;
		dy = this.y - other.y;
	}
	return Math.sqrt((dx * dx) + (dy * dy));
};

/**
 * Returns distance squared to a point represented by another vector
 *
 * @returns squared distance to other point (float)
 */
vec2.prototype.distance2To = function(other,y) {
	var dx,dy;
	if(y !== undefined) {
		dx = this.x - other;
		dy = this.y - y;
	} else {
		dx = this.x - other.x;
		dy = this.y - other.y;
	}
	return (dx * dx) + (dy * dy);
};

/**
 * Set length of vector. First, the vector is normalized; then, the vector is
 * multiplied by 'length'.
 *
 * @param length a floating-point value
 * @returns a reference to self
 */
vec2.prototype.setLength = function(length) {
	var l = 1.0 / Math.sqrt((this.x * this.x) + (this.y * this.y));
	this.x *= l;
	this.y *= l;
	this.x *= length;
	this.y *= length;
	return this;
};
