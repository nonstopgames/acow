/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * UIButton.js
 *
 * A custom button class, for uniform button behavior
 * across the application.
 *
 *
 */

"use strict";

/**
 * A button implemented as a div element.
 * UIButtons must be placed manually.
 *
 * Apparently Android phones highlight any element with an onclick handler. :F
 */
function UIButton(text) {
	
	this._elem = document.createElement('div');
	this._elem.innerHTML = text;
	this._elem.setAttribute('class','uiButton');
	
	this._x = 0;
	this._y = 0;

	if(text) {
		this._elem.innerHTML = "" + text;
	}

	var that = this;
	
	this._elem.onmousedown = function(e) {
		e.stopPropagation();
	};
	var upevent = "onmouseup";
	if("ontouchend" in window){
		upevent = "ontouchend";
	}
	this._elem[upevent] = function(e) {
		e.stopPropagation();
		that.onClick.call(that);
	};
	
	this.onClick = function() {
		trace("UIButton clicked");
	};
	
};

/**
 *
 */
UIButton.prototype.setPosition = function(x,y) {
	this._x = x;
	this._y = y;
	this._elem.style.top = this._y + "px";
	this._elem.style.left = this._x + "px";
};

/**
 *
 */
UIButton.prototype.getElement = function() {
	return this._elem;
};

/**
 *
 */
UIButton.prototype.getX = function() {
	return this._x;
};

/**
 *
 */
UIButton.prototype.getY = function() {
	return this._y;
};

/**
 *
 */
UIButton.prototype.getWidth = function() {
	return $(this._elem).outerWidth(true);
};

/**
 *
 */
UIButton.prototype.getHeight = function() {
	return $(this._elem).outerHeight(true);
};
