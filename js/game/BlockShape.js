/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * BlockShape.js
 *
 * A simple list of block shapes.
 * Moved here from BlockMarker.js for maintainability.
 *
 * creation date: 11-08-2012
 *
 */

"use strict";

/**
 * Static definitions of tetris-style wall blocks.
 * The idea is to use a placement matrix, so that the
 * block can be rotated, as-is, after which a sprite
 * or sprite group can be created based on it.
 */
window.BlockShape = [

	// Single block
	[ 0, 0, 0, 0, 0,
	  0, 0, 0, 0, 0,
	  0, 0, 1, 0, 0,
	  0, 0, 0, 0, 0,
	  0, 0, 0, 0, 0 ],

	// Two-block
	[ 0, 0, 0, 0, 0,
	  0, 0, 1, 0, 0,
	  0, 0, 1, 0, 0,
	  0, 0, 0, 0, 0,
	  0, 0, 0, 0, 0 ],

	// Three-block
	[ 0, 0, 0, 0, 0,
	  0, 0, 1, 0, 0,
	  0, 0, 1, 0, 0,
	  0, 0, 1, 0, 0,
	  0, 0, 0, 0, 0 ],

	// Three-block angle
	[ 0, 0, 0, 0, 0,
	  0, 1, 1, 0, 0,
	  0, 0, 1, 0, 0,
	  0, 0, 0, 0, 0,
	  0, 0, 0, 0, 0 ],

	// Three-block angle reversed
	[ 0, 0, 0, 0, 0,
	  0, 0, 1, 1, 0,
	  0, 0, 1, 0, 0,
	  0, 0, 0, 0, 0,
	  0, 0, 0, 0, 0 ],

	// Quad-block
	[ 0, 0, 0, 0, 0,
	  0, 1, 1, 0, 0,
	  0, 1, 1, 0, 0,
	  0, 0, 0, 0, 0,
	  0, 0, 0, 0, 0 ],

	// S-block
	[ 0, 0, 0, 0, 0,
	  0, 1, 0, 0, 0,
	  0, 1, 1, 0, 0,
	  0, 0, 1, 0, 0,
	  0, 0, 0, 0, 0 ],

	// S-block reverse
	[ 0, 0, 0, 0, 0,
	  0, 0, 0, 1, 0,
	  0, 0, 1, 1, 0,
	  0, 0, 1, 0, 0,
	  0, 0, 0, 0, 0 ],

	// L-block
	[ 0, 0, 0, 0, 0,
	  0, 1, 1, 0, 0,
	  0, 0, 1, 0, 0,
	  0, 0, 1, 0, 0,
	  0, 0, 0, 0, 0 ],

	// L-block reverse
	[ 0, 0, 0, 0, 0,
	  0, 0, 1, 1, 0,
	  0, 0, 1, 0, 0,
	  0, 0, 1, 0, 0,
	  0, 0, 0, 0, 0 ],

	// T-block
	[ 0, 0, 0, 0, 0,
	  0, 1, 1, 1, 0,
	  0, 0, 1, 0, 0,
	  0, 0, 0, 0, 0,
	  0, 0, 0, 0, 0 ]

];
