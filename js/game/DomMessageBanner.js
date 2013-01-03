/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * DomMessageBanner.js
 *
 * Dom Counterpart for MessageBanner
 * Need this for messages that needs input
 *
 * creation date: 13-12-2012
 * 
 */

"use strict";

function DomMessageBanner() {

	Actor.call(this);

	var elem = this._elem = document.createElement("div");

	elem.className = "message-banner";

	this._timer = new Timer();
	this._state = 0;

	this._transitionTime = 0.6;

	this.setActive(false);

	g_engine._container.appendChild(this._elem);
};
DomMessageBanner.inherits(Actor);

DomMessageBanner.prototype.showElement = function(dom, display_time) {
	this._displayTime = display_time;
	
	this._state = 0;
	$(this._elem).addClass("before");

	this.setActive(true);

	this._elem.innerHTMl = "";

	this._elem.appendChild(dom);
	var el = this._elem;
	setTimeout(function(){
		$(el).removeClass("before");
	}, 0);

	this._timer.setTarget(this._transitionTime).reset().start();
};

DomMessageBanner.prototype.update = function(sync) {
	if(this.isActive()) {

		this._timer.update(sync);

		if(this._timer.isComplete()) {
			switch(this._state) {
				case 0:
					//trace("message fade-in complete");
					this._timer.setTarget(this._displayTime).reset().start();
					this._state++;
				break;
				case 1:
					//trace("show message complete");
					this._timer.setTarget(this._transitionTime).reset().start();
					$(this._elem).addClass("after");
					this._state++;
				break;
				case 2:
					//trace("message fade-out complete");
					this._timer.reset().stop();
					this._state = 0;
					this.setActive(false);
				break;
			}
		}

	}
};

DomMessageBanner.prototype.setActive = function(active){
	Actor.prototype.setActive.call(this, active);

	if(active){
		this._elem.style.display = "";
	}else{
		$(this._elem).removeClass("before").removeClass("after");
		this._elem.style.display = "none";
	}
};

