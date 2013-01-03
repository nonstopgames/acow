/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 *
 * Create a linked list pool of actors for an actor class
 * Provide a get() function to get an inactive actor, or create a new actor
 *
 * This eliminate the need to deallocate and allocate objects over and over again
 */

/* creates a pool, also augment the actor class to make it a linked list */
function ActorPool(actorClass){
	var pool = this._pool = {
		_poolPrev: null,
		_poolNext: null
	};

	var activePool = this._activePool = {
		_poolPrev: null,
		_poolNext: null
	};
	this.actorClass = actorClass;
	if(!actorClass.poolified){
		actorClass.poolified = true;
		var oriSet = actorClass.prototype.setActive;
		// only one pool for one class
		// consider modifying the code below if we need multiple pools for one class
		actorClass.prototype.setActive = function(active){
			var a = this._active;
			oriSet.call(this, active);
			if(a !== active){
				if(active){
					this._poolPrev._poolNext = this._poolNext;
					if(this._poolNext){
						this._poolNext._poolPrev = this._poolPrev;
					}
					this._poolNext = activePool._poolNext;
					if(activePool._poolNext){
						activePool._poolNext._poolPrev = this;
					}
					activePool._poolNext = this;
					this._poolPrev = activePool;
				}else{
					if(this._poolPrev){
						this._poolPrev._poolNext = this._poolNext;
					}
					if(this._poolNext){
						this._poolNext._poolPrev = this._poolPrev;
					}
					this._poolNext = pool._poolNext;
					if(pool._poolNext){
						pool._poolNext._poolPrev = this;
					}
					pool._poolNext = this;
					this._poolPrev = pool;
				}
			}
		};
	}
}

/* reset the pool, set everything to inactive */
ActorPool.prototype.reset = function(){
	var cur = this._activePool._poolNext,
		next;
	while(cur){
		next = cur._poolNext;
		cur.setActive(false);
		cur = next;
	}
};

/* get an inactive actor from the pool,
 * if no actors available, create a new one
 */
ActorPool.prototype.get = function(callback){
	if(this._pool._poolNext){
		return this._pool._poolNext;
	}
	var a = new this.actorClass();
	a.setActive(false);
	callback(a);
	return a;
};

/* initialise the pool by creating a few actors to begin with */
ActorPool.prototype.init = function(callback){
	for(var i = 0; i < 20; i++){
		var tmp = new this.actorClass();
		tmp.setActive(false);
		callback(tmp);
	}
};

ActorPool.prototype.hasActive = function(){
	return !!this._activePool._poolNext;
};
