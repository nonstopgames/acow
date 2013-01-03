/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * SceneNode.js
 *
 * Basic building block for any scene graph.
 *
 * This code is very much standard fare in any
 * 2D graphics application these days.
 *
 *
 * NOTE: The culling capabilities of this scene
 * graph are _very_ basic - if the parent node
 * is visible, but gets culled, all its children
 * are processed anyway. Heavy node chains will,
 * thus, still be heavy to use, even if they're
 * outside the viewport. Furthermore, if culling
 * is enabled, the user is trusted to provide the
 * correct width, height and offset.
 *
 * creation date: 04-06-2012
 *
 */

"use strict";

/**
 * Constructs a Node object. A Node defines size and position of a
 * scene graph object, and provides hierarchical list functionality.
 */
function SceneNode() {
	
	// Public booleans - no harm in accessing them. 
	this.visible    = true;           // If false, Node and its sub-nodes are not drawn.
	this.culling    = false;          // If true, a bounding box is calculated and checked against the visible area of the drawing context.
	
	// Graphics related fields
	this._x         = 0;             // X position coordinate
	this._y         = 0;             // Y position coordinate
	this._width     = 0;             // Width of the node's contents
	this._height    = 0;             // Height of the node's contents
	this._offset_x  = 0;             // X offset of the node's contents (i.e., a centered box would have _offset_x be 50% of _width)
	this._offset_y  = 0;             // Y offset of the node's contents (see above)
	this._rotation  = 0.0;           // Rotation (in degrees)
	this._scale     = 1.0;           // Scaling factor
	this._matrix    = new mat2();    // Object-local matrix.
	this._opacity   = 1.0;           // Opacity factor (allows drawing semi-transparent stuff in a canvas)
	
	// List-related fields
	this._rootNode  = false;         // If true, will refuse to be added to anything.
	this._parent    = null;          // Parent node
	this._next      = null;          // Next node in parent's list
	this._prev      = null;          // Previous node in parent's list
	this._head      = null;          // First node in list (bottom-most visible node)
	this._tail      = null;          // Last node in list (top-most visible node)
	this._nChildren = 0;             // Number of child nodes
	
	// Callbacks
	this.onAddedToParent = null;     // Called when node is added to parent
	this.onRemovedFromParent = null; // Called when node is removed from its parent
	this.onAddedToScene = null;      // Called when node (or its parent) is added to scene
	this.onRemovedFromScene = null;  // Called when node (or its parent) is removed from scene
	
}

// Add a matrix stack to the Node function for better performance
// during tree traversal...
SceneNode._mstack = [ new mat2() ];

// A group of vectors for calculation of bounding box
SceneNode._bbox = [
	new vec2(), new vec2(),
	new vec2(), new vec2()
];

// A temporary vector object for bounding box calculations...
SceneNode._tvec = new vec2();

// For recursive transparency
SceneNode._alpha = [ 1.0 ];

/**
 * "private" function, which can be used to make an otherwise non-root
 * SceneNodeinto a root node. This just sets the _rootNode property to 'true'.
 *
 * @returns a reference to self
 */
SceneNode.prototype._makeRootNode = function() {
	this._rootNode = true;
	return this;
};

/**
 * Returns true if the node is a root node (i.e. it cannot be added to
 * anything).
 *
 * @returns a boolean value
 */
SceneNode.prototype.isRootNode = function() {
	return this._rootNode;
};

/**
 * Get the root node reference. Returns null on failure (if this node is
 * not attached to a root node at all).
 *
 * @returns a SceneNode reference, that is a root node (typically a Scene object), or null on failure.
 */
SceneNode.prototype.getRootNode = function() {
	var p = this;
	while(p != null) {
		if(!p._rootNode)
			p = p._parent;
		else
			return p;
	}
	return null;
};

/**
 * Returns the parent node of this Node in its hierarchy.
 */
SceneNode.prototype.getParent = function() {
	return this._parent;
};


//----------------------------------------------------------------------------
//   Child handling
//----------------------------------------------------------------------------

/**
 * Recursively notify children of this node tree that it was successfully added to
 * a Scene object.
 */
SceneNode.prototype.notifyChildren_addedToScene = function(scene) {
	if(!scene) scene = this.getRootNode();
	if(scene) {
		var l = this._nChildren;
		var p = this._head;
		while(l--) {
			var fn = p.onAddedToScene;
			if(fn) fn.call(p);
			p.notifyChildren_addedToScene(scene);
			p = p._next;
		};
		
	}
	
};

/**
 * Recursively notify children of this node tree that it was removed from
 * a Scene object.
 */
SceneNode.prototype.notifyChildren_removedFromScene = function() {
	
	var l = this._nChildren;
	var p = this._head;
	while(l--) {
		
		var fn = p.onRemovedFromScene;
		if(fn) fn.call(p);
		p.notifyChildren_removedFromScene();
		p = p._next;
		
	};
	
};


/**
 * Add a child node to this node.
 *
 * @param n Another Node object
 * @returns a reference to self
 */
SceneNode.prototype.addChild = function(n, skipEvents) {
	
	if(!(n instanceof SceneNode)) {
		throw new Error("Tried to add " + n + " as scene node");
	}

	if(n._rootNode) {
		trace("Tried to add root node");
		return;
	}
	
	if(n._parent) {
		n._parent.removeChild(n);
	}
	n._parent = this;

	if(this._head === null) this._head = n;       // Set root node in case of empty list
	if(this._tail !== null) this._tail._next = n;   // Set tail node
	
	n._prev = this._tail;
	n._next = null;
	this._tail = n;
	this._nChildren++;
	
	// Callback handling
	
	
	return this;
	
};

/**
 * Insert a child node at a certain index. Warning: slow operation.
 *
 * @param n Another Node object
 * @param idx index in list to add child in. 0 is the first (bottom-most) element in the list.
 * @returns a reference to self
 */
SceneNode.prototype.addChildAt = function(n, idx, skipEvents) {

	if(!(n instanceof SceneNode)) {
		throw new Error("Tried to add " + n + " as scene node");
	}
	
	if(n._rootNode) return;

	// Verify IDX
	//idx = (idx < 0) ? 0 : ((idx > this._nChildren) ? this._nChildren : idx);   // My editor doesn't like this
	if(idx < 0) idx = 0;
	if(idx > this._nChildren) idx = this._nChildren;

	// With an empty list or a child at the last position, use addChild
	if(idx === this._nChildren) {
		this.addChild(n);
		return;
	}

	// Remove child node from parent
	if(n._parent) {
		n._parent.removeChild(n);
	}
	n._parent = this;

	// Find target subnode
	var p = this._head;
	
	while(idx--) {
		p = p._next || this._tail;   // XXX: Does this actually work?
	}

	// Link in new node. We're ALWAYS linking the new node BEFORE the found node.
	n._next = p;
	n._prev = p._prev;
	if(p._prev) p._prev._next = n;
	p._prev = n;

	// Update head pointer in case p was the earlier head
	if(p === this._head) {
		this._head = n;
	}
	
	this._nChildren++;

	return this;
	
};

/**
 * Remove a child node from this node.
 *
 * @param n Another Node object
 * @returns a reference to self
 */
SceneNode.prototype.removeChild = function(n, skipEvents) {

	if(!(n instanceof SceneNode)) {
		throw new Error("Tried to remove " + n + " as scene node");
	}
	
	if(n._parent == this) {

		// Unlink node from neighbors
		if(n._prev) n._prev._next = n._next;
		if(n._next) n._next._prev = n._prev;
		
		// Unlink node from parent
		if(n === this._head) this._head = n._next;
		if(n === this._tail) this._tail = n._prev;

		// Clear links
		n._parent = null;
		n._next   = null;
		n._prev   = null;

		// Reduce child count
		this._nChildren--;
		
	} else {
		trace("Node " + n + " is not a child of " + this);
	}

	return this;
	
};

/**
 * Remove all children from this node.
 *
 * @returns a reference to self
 */
SceneNode.prototype.clearChildren = function(skipEvents) {
	var n = this._head;
	while(n !== null) {
		var next = n._next;
		n._parent = null;
		n._next = null;
		n._prev = null;
		n = next;
	}
	this._head = null;
	this._tail = null;
	this._nChildren = 0;
	return this;
};

/**
 * Returns the number of children attached to this node.
 *
 * @returns an integer value
 */
SceneNode.prototype.getNumChildren = function() {
	return this._nChildren;
};



//----------------------------------------------------------------------------
//   Self handling
//----------------------------------------------------------------------------

/**
 * Removes a node from its parent, iff parent is defined.
 *
 * @returns a reference to self
 */
SceneNode.prototype.removeFromParent = function(skipEvents) {
	if(this._parent) this._parent.removeChild(this,skipEvents);
	return this;
};


//----------------------------------------------------------------------------
//   Matrix operations
//----------------------------------------------------------------------------


/**
 * Convert local coordinate to global coordinate
 */
SceneNode.prototype.localToGlobal = function(x,y) {

};

/**
 * Convert global coordinate to local coordinate
 */
SceneNode.prototype.globalToLocal = function(x,y) {

};

/**
 * Test if a global coordinate exists inside the bounding box of this object
 */
SceneNode.prototype.containsGlobalPoint = function(x,y) {

};

/**
 * Test if a local coordinate is inside the bounding box of this object
 */
SceneNode.prototype.containsLocalPoint = function(x,y) {
	var x0 = this._offset_x;
	var y0 = this._offset_y;
	var w = this._width;
	var h = this._height;

	return (x > x0 && y > y0 && x < x0 + w && y < y0 + h);
};


//----------------------------------------------------------------------------
//   Size and position, visuals
//----------------------------------------------------------------------------

/**
 * Set opacity (transparency/alpha) of node and subsequent subnodes.
 *
 * @param a a numeric value between 0 and 1 (clamped by this function)
 * @returns a reference to self
 */
SceneNode.prototype.setOpacity = function(a) {
	a = (a > 1.0) ? 1.0 : ((a < 0.0) ? 0.0 : a);
	this._opacity = a;
	return this;
};

/**
 * Get opacity (transparency/alpha) of this node.
 *
 * @returns a value between 0 and 1
 */
SceneNode.prototype.getOpacity = function() {
	return this._opacity;
};

/**
 * Set position (translation vector) of the Node
 *
 * @returns a reference to self
 */
SceneNode.prototype.setPosition = function(x,y) {

	if(x !== undefined) {
		this._x = x;
	}
	
	if(y !== undefined) {
		this._y = y;
	}

	return this;
	
};

/**
 * Offset position by delta x,y
 *
 * @param dx movement on X axis
 * @param dy movement on Y axis
 * @returns a reference to self
 */
SceneNode.prototype.move = function(dx,dy) {

	if(dx !== undefined) {
		this._x += dx;
	}
	
	if(dy !== undefined) {
		this._y += dy;
	}

	return this;
	
};

/**
 * Get the x coordinate of the Node's translation vector
 *
 * @returns the Node's X coordinate (float)
 */
SceneNode.prototype.getX = function() {
	return this._x;
};

/**
 * Get the y coordinate of the Node's translation vector
 *
 * @returns the Node's Y coordinate (float)
 */
SceneNode.prototype.getY = function() {
	return this._y;
};

/**
 * Sets the image offset (i.e. center of image)
 *
 * @param x x offset value. defaults to 0
 * @param y y offset value. defaults to 0
 * @returns a reference to self
 */
SceneNode.prototype.setOffset = function(x,y) {
	this._offset_x = (x === undefined) ? 0.0 : x;
	this._offset_y = (y === undefined) ? 0.0 : y;
	return this;
};

/**
 * Get the x value of the offset point
 *
 * @returns x offset value
 */
SceneNode.prototype.getOffsetX = function() {
	return this._offset_x;
};

/**
 * Get the y value of the offset point
 *
 * @returns y offset value
 */
SceneNode.prototype.getOffsetY = function() {
	return this._offset_y;
};

/**
 * Set the size of this node
 *
 * @param w width of this node. defaults to 0. always forced to positive.
 * @param h height of this node. defaults to 0. always forced to positive.
 * @returns a reference to self
 */
SceneNode.prototype.setSize = function(w,h) {
	this._width  = (w === undefined) ? 0.0 : ((w < 0) ? -w : w);
	this._height = (h === undefined) ? 0.0 : ((h < 0) ? -h : h);
	return this;
};

/**
 * Get the scaled width of this node
 *
 * @returns width value
 */
SceneNode.prototype.getWidth = function() {
	return this._width * this._scale;
};

/**
 * Get the scaled height of this node
 *
 * @returns height value
 */
SceneNode.prototype.getHeight = function() {
	return this._height * this._scale;
};

/**
 * Get the un-scaled width of this node
 *
 * @returns width value
 */
SceneNode.prototype.getRealWidth = function() {
	return this._width;
};

/**
 * Get the un-scaled height of this node
 *
 * @returns height value
 */
SceneNode.prototype.getRealHeight = function() {
	return this._height;
};

/**
 * Set the rotation property of the Node. Value is in degrees.
 * The stored value is confined to
 *
 * @param r angle in degrees.
 * @returns a reference to self
 */
SceneNode.prototype.setRotation = function(r) {
	if(r === undefined) this._rotation = 0.0;
	else this._rotation = Math.wrap360(r);
	return this;
};

/**
 * Adds a delta value to the rotation property of the Node.
 *
 * @param r delta angle in degrees.
 * @returns a refernce to self
 */
SceneNode.prototype.rotate = function(r) {
	this._rotation = Math.wrap360(r + this._rotation);
	return this;
};

/**
 * Get rotation, in degrees, confined to [0..360]
 *
 * @returns rotation component, in degrees
 */
SceneNode.prototype.getRotation = function() {
	return this._rotation;
};

/**
 * Sets the scaling factor.
 * 
 * @param s a floating-point value
 * @returns a reference to self
 */
SceneNode.prototype.setScale = function(s) {
	this._scale = s < 0 ? 0 : s;
	return this;
};

/**
 * Scales the scaling factor (i.e. new scale = old scale * param)
 *
 * @param s a floating-point value
 * @returns a reference to self
 */
SceneNode.prototype.scale = function(s) {
	this._scale *= s < 0 ? 0 : s;
	return this;
};

/**
 * Get the scaling factor
 *
 * @returns a floating point value
 */
SceneNode.prototype.getScale = function() {
	return this._scale;
};

/**
 * Get a reference to the object's local matrix
 *
 * @returns a mat2 object, local to this Node.
 */
SceneNode.prototype.getMatrix = function() {
	return this._matrix;
};

//----------------------------------------------------------------------------
//   Drawing
//----------------------------------------------------------------------------

/**
 * Perform drawing of this node. This should be overridden in
 * extending classes. When entered, the node's local matrix is
 * guaranteed to be properly recalculated.
 * 
 * Does not need to return anything.
 *
 * @param canvas a reference to the Canvas object we're drawing in
 * @param context a reference to the Canvas's context we're drawing in
 * @param matrix a reference to the current global matrix (this node's matrix, concatenated with everything that came before it).
 * 
 */
SceneNode.prototype.draw = function(canvas, context, matrix) {
	
};

SceneNode.prototype.cull = function(canvas, matrix) {
	if(this.culling) {

		var x = this._offset_x;
		var y = this._offset_y;
		var w = this._width * 0.5;
		var h = this._height * 0.5;
		var x0, y0, x1, y1;

		// Find the four corners of the node's local bounding box
		SceneNode._bbox[0].set(x - w, y - h);
		SceneNode._bbox[1].set(x + w, y - h);
		SceneNode._bbox[2].set(x + w, y + h);
		SceneNode._bbox[3].set(x - w, y + h);

		// Project all bounding box vectors through cumulative matrix
		for(var i = 0; i < 4; ++i) {
			var v = SceneNode._bbox[i];
			matrix.project(v,v);
		}

		// Find maximum and mimimum coordinates in bounding box...
		Math.min_vec2(SceneNode._bbox,SceneNode._tvec);
		x0 = SceneNode._tvec.x;
		y0 = SceneNode._tvec.y;
		Math.max_vec2(SceneNode._bbox,SceneNode._tvec);
		x1 = SceneNode._tvec.x;
		y1 = SceneNode._tvec.y;

		// Test bounding box against viewport
		return ((x1 > 0 && x0 < canvas.width + w) && (y1 > 0 && y0 < canvas.height + h));
	}
	return true;
};

/**
 * Internal function, which is used when recursing along the
 * node tree.
 *
 * NOTE: Matrix handling is still a bit stupidly done.
 * NOTE: It might be worth it to force the rendering context to handle matrices.
 * 
 * @param canvas A reference to the Canvas object we're drawing in
 * @param context A reference to the canvas's context
 * @param mtx_idx index of the global matrix in SceneNode._mstack.
 */
SceneNode.prototype._recursive_draw = function(canvas, context, mtx_idx) {

	//
	// NOTE: mtx_idx should always start from 1; this draw routine gets called through Scene, or itself. As such,
	//       SceneNode._mstack[0] should be set/initialized by Scene.
	//       

	// Reset context canvas
	context.setTransform(1,0,0,1,0,0);
	context.globalCompositeOperation = 'source-over';
	
	// Initialize local matrix (NOTE: possible choke point)
	this._matrix.identity()
		.translate(this._x,this._y)
		.rotate(-this._rotation * window.DEG_TO_RAD)
		.scale(this._scale)
		.translate(this._offset_x,this._offset_y);

	//trace("SceneNode: x,y = ",this._x + "," +this._y," rotation: ",this._rotation," scale: ",this._scale);
	
	var local_mtx  = this._matrix;
	var global_mtx = SceneNode._mstack[mtx_idx];
	var alpha = SceneNode._alpha[mtx_idx] = SceneNode._alpha[mtx_idx - 1] * this._opacity;

	// Initialize global matrix
	if(!global_mtx) {
		global_mtx = SceneNode._mstack[mtx_idx - 1].multiply(local_mtx);
		SceneNode._mstack.push(global_mtx);
	} else {
		global_mtx.copy(SceneNode._mstack[mtx_idx - 1]).multiplySelf(local_mtx);
	}

	// Call local draw function if culling succeeds
	if(this.cull(canvas, global_mtx)) {
		context.globalAlpha = alpha;
		this.draw(canvas,context,global_mtx);
	}

	// Process child nodes if need be
	if(this._nChildren) {

		// Prepare next matrix
		if(SceneNode._mstack[mtx_idx + 1]) {
			SceneNode._mstack[mtx_idx + 1].copy(SceneNode._mstack[mtx_idx]).multiplySelf(this._matrix);
		} else {
			SceneNode._mstack.push(SceneNode._mstack[mtx_idx].multiply(this._matrix));
		}

		// Recurse through child nodes
		var n = this._head;
		while(n != null) {

			if(n.visible) {
				n._recursive_draw(canvas,context,mtx_idx + 1);
			}

			n = n._next;
			
		}

	}
	
};
