/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * Matrix.js
 *
 * Matrix math class and functions
 * This is used to simplify hierarchical node
 * transformation.
 *
 * creation date: 05-06-2012
 */

"use strict";

/**
 * 2x3 (scaling/rotation/shearing and translation) matrix
 *
 * @param data Optional data array, that gets _directly_ asigned to the created matrix
 */
function mat2(data) {

	if(data === undefined) {
		this.m = [ 1.0, 0.0, 0.0, 1.0, 0.0, 0.0 ];
	} else {
		this.m = data;
	}
	
};

// Store a temporary matrix for multiplication operations. Save the heap!
mat2.m_temp = [ 0, 0, 0, 0, 0, 0 ];

/**
 * Returns a copy of this matrix
 *
 * @returns a new mat2 object
 */
mat2.prototype.clone = function() {
	return new mat2(this.m.slice(0,6));
};

/**
 * Copies data from another matrix
 *
 * @returns a reference to self
 */
mat2.prototype.copy = function(mtx) {
	// What's the fastest way to copy an array?
	// We'll find out if this turns into some kind of bottleneck
	for(var i = 0; i < 6; ++i) {
		this.m[i] = mtx.m[i];
	}

	return this;
};

/**
 * Return matrix to identity
 *
 * @returns a reference to self
 */
mat2.prototype.identity = function() {

	this.m[0] = 1.0;
	this.m[1] = 0.0;
	this.m[2] = 0.0;
	this.m[3] = 1.0;
	this.m[4] = 0.0;
	this.m[5] = 0.0;
	
	return this;
};

/**
 * Set params. If any parameter is omitted or
 * marked 'undefined', will default to unit matrix
 * value.
 *
 * Parameters should be self-explanatory (for example,
 * xy is the y component of the x constituent vector).
 *
 * @returns a reference to self
 */
mat2.prototype.set = function(xx,xy,yx,yy,tx,ty) {
	this.m[0] = (xx === undefined) ? 1.0 : xx;
	this.m[1] = (xy === undefined) ? 0.0 : yy;
	this.m[2] = (yx === undefined) ? 0.0 : yx;
	this.m[3] = (yy === undefined) ? 1.0 : yy;
	this.m[4] = (tx === undefined) ? 0.0 : tx;
	this.m[5] = (ty === undefined) ? 0.0 : ty;

	return this;
};

/**
 * Translate the matrix (i.e. manipulate the translation vector
 * while taking into account the rotation and scaling).
 *
 * @param dx Tranlsation along X axis
 * @param dy Translation along Y axis
 *
 * @returns a reference to self
 */
mat2.prototype.translate = function(dx,dy) {
	this.m[4] += (this.m[0] * dx) + (this.m[2] * dy);
	this.m[5] += (this.m[1] * dx) + (this.m[3] * dy);

	return this;
};

/**
 * Scale matrix by separate x an y axes
 *
 * @returns a reference to self
 */
mat2.prototype.scale = function(sx,sy) {

	if(sy === undefined) sy = sx;

	this.m[0] *= sx;
	this.m[1] *= sx;
	this.m[2] *= sy;
	this.m[3] *= sy;

	return this;
};

/**
 * Rotate matrix by r radians
 *
 * @returns a reference to self
 */
mat2.prototype.rotate = function(r) {

	var sa = Math.sin(r);
	var ca = Math.cos(r);
	var xx = this.m[0];
	var xy = this.m[1];
	var yx = this.m[2];
	var yy = this.m[3];

	this.m[0] = (xx * ca) - (yx * sa);
	this.m[1] = (xy * ca) - (yy * sa);
	this.m[2] = (xx * sa) + (yx * ca);
	this.m[3] = (xy * sa) + (yy * ca);

	return this;
};

/**
 * Normalize matrix
 *
 * @returns a reference to self
 */
mat2.prototype.normalize = function() {
	var xx = this.m[0];
	var xy = this.m[1];
	var yx = this.m[2];
	var yy = this.m[3];
	var tx = this.m[4];
	var ty = this.m[5];
	var lx = Math.sqrt((xx * xx) + (xy * xy));
	var ly = Math.sqrt((yx * yx) + (yy * yy));
	var lt = Math.sqrt((tx * tx) + (ty * ty));
	lx = lx ? 1.0 / lx : 1.0;   // We don't want
	ly = ly ? 1.0 / ly : 1.0;   // any vectors to
	lt = lt ? 1.0 / lt : 1.0;   // flip over to NaN
	this.m[0] *= lx;
	this.m[1] *= lx;
	this.m[2] *= ly;
	this.m[3] *= ly;
	this.m[4] *= lt;
	this.m[5] *= lt;
	
	return this;
};

//
// NOTE: matrix inversion is work-in-progress (i.e. possibly wrong)
//

/**
 * Invert this matrix.
 *
 * @returns a reference to self
 */
mat2.prototype.invertSelf = function() {
	
	//
	//
	// | xx  yx  tx |
	// |            |
	// | xy  yy  ty |
	// |            |
	// |  0   0   1 |
	//
	//
	
	var xx = this.m[0];
	var yx = this.m[2];
	var xy = this.m[1];
	var yy = this.m[3];
	var tx = this.m[4];
	var ty = this.m[5];
	
	var det = 1.0 / ((xx * yy) - (xy * yx));

	this.m[0] =  det *  yy;
	this.m[1] = -det *  xy;
	this.m[2] = -det *  yx;
	this.m[3] =  det *  xx;
	this.m[4] =  det * (ty * yx - yy * tx);
	this.m[5] = -det * (ty * xx - xy * tx);

	return this;
	
};

/**
 * Get an inverse matrix
 *
 * @param target [optional] matrix to store result in
 * @returns an inverted matrix (or reference to target)
 */
mat2.prototype.invert = function(target) {
	if(!target) target = new mat2();
	target.invertSelf();
	return target;
};

/**
 * Project vector through matrix
 *
 * @param vec a vector to project
 * @param result if set, will contain the result
 * @returns a vec2 object. If result parameter is set, will be a reference to result.
 */
mat2.prototype.project = function(vec,result) {
	var r = (result === undefined) ? new vec2() : result;
	r.x = (this.m[0] * vec.x) + (this.m[2] * vec.y) + this.m[4];
	r.y = (this.m[1] * vec.x) + (this.m[3] * vec.y) + this.m[5];
	return r;
};

/**
 * Project vector X component through matrix
 *
 * @param x a float value (vector X component)
 * @param y a float value (vector Y component)
 * @returns a float value (projected X component)
 */
mat2.prototype.projectX = function(x,y) {
	return (this.m[0] * x) + (this.m[2] * y) + this.m[4];
};

/**
 * Project vector Y component through matrix
 *
 * @param x a float value (vector X component)
 * @param y a float value (vector Y component)
 * @returns a float value (projected Y component)
 */
mat2.prototype.projectY = function(x,y) {
	return (this.m[1] * x) + (this.m[3] * y) + this.m[5];
};

/**
 * Multiplies this matrix by another and returns a new matrix containing the result.
 * To clarify: projects OTHER MATRIX through THIS MATRIX. (i.e. other x this = result)
 *
 * @param mtx another mat2 object
 * @returns a mat2 object, which is the product of this and the other matrix
 */
mat2.prototype.multiply = function(mtx) {

	var m  = this.m;
	var m2 = mtx.m;
	var r = [0,0,0,0,0,0];
	
	r[0] = (m[0] * m2[0]) + (m[2] * m2[1]);
	r[1] = (m[1] * m2[0]) + (m[3] * m2[1]);
	r[2] = (m[0] * m2[2]) + (m[2] * m2[3]);
	r[3] = (m[1] * m2[2]) + (m[3] * m2[3]);
	r[4] = (m[0] * m2[4]) + (m[2] * m2[5]) + m[4];
	r[5] = (m[1] * m2[4]) + (m[3] * m2[5]) + m[5];
	
	return new mat2(r);
};

/**
 * Multiplies this matrix by another and stores the result in itself.
 * To clarify: projects OTHER MATRIX through THIS MATRIX. (i.e. other x this = result)
 *
 * @param mtx another mat2 object
 * @returns a reference to self
 */
mat2.prototype.multiplySelf = function(mtx) {
	
	var m  = this.m;
	var m2 = mtx.m;
	var r = mat2.m_temp;		// Use temporary matrix space to avoid heap ops

	r[0] = (m[0] * m2[0]) + (m[2] * m2[1]);
	r[1] = (m[1] * m2[0]) + (m[3] * m2[1]);
	r[2] = (m[0] * m2[2]) + (m[2] * m2[3]);
	r[3] = (m[1] * m2[2]) + (m[3] * m2[3]);
	r[4] = (m[0] * m2[4]) + (m[2] * m2[5]) + m[4];
	r[5] = (m[1] * m2[4]) + (m[3] * m2[5]) + m[5];

	for(var i = 0; i < 6; ++i) {
		m[i] = r[i];
	}

	return this;
	
};

/**
 * Sets a context's internal rendering matrix to be identical
 * to this matrix.
 *
 * @param context a Canvas 2D rendering context
 * @returns a reference to self.
 */
mat2.prototype.applyTo = function(context) {
	var m = this.m;
	context.setTransform(m[0],m[1],m[2],m[3],m[4],m[5]);
	return this;
};

/**
 * 
 */
mat2.prototype.toString = function() {
	return "2D Matrix: [" + this.m[0] + ", " + this.m[1] + ", " + this.m[2] + ", " + this.m[3] + ", " + this.m[4] + ", " + this.m[5] + "]";
};
