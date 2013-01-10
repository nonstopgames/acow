/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * CowTransportShip.js
 *
 * A variant of the Transport Ship, this one unloads cows
 * 
 */

function CowTransportShip(){
	TransportShip.call(this);
	this._cowzillaProb = g_config.enemies.cowTransport.cowzillaProbability;
	this._megaProb = g_config.enemies.cowTransport.megacowProbability;
	this._santaProb = g_config.enemies.cowTransport.santacowProbability;
}

CowTransportShip.inherits(TransportShip);


CowTransportShip.prototype.unloadSoldier = function() {
	var gsx = g_game.getGridSizeX();
	var gsy = g_game.getGridSizeY();
	
	this._num_soldiers--;
	if(g_game.wantCowzilla()){
		g_game.spawnCowzilla (this.getX() + this._unload_offset_x - 32 + Math.rand(-gsx,0),this.getY() + this._unload_offset_y + Math.rand(-gsy,gsy));
	}else{
		var r = Math.random();
		if(r < this._cowzillaProb){
			g_game.spawnCowzilla (this.getX() + this._unload_offset_x - 32 + Math.rand(-gsx,0),this.getY() + this._unload_offset_y + Math.rand(-gsy,gsy));
		}else if(r < this._megaProb){
			g_game.spawnMegaCow(this.getX() + this._unload_offset_x + Math.rand(-gsx,0),this.getY() + this._unload_offset_y + Math.rand(-gsy,gsy));
		}else if(r < this._santaProb){
			g_game.spawnSantaCow(this.getX() + this._unload_offset_x + Math.rand(-gsx,0),this.getY() + this._unload_offset_y + Math.rand(-gsy,gsy));
		}else{
			g_game.spawnCow(this.getX() + this._unload_offset_x + Math.rand(-gsx,0),this.getY() + this._unload_offset_y + Math.rand(-gsy,gsy));
		}
	}
	
	this._unload_timer.stop();
	if(this._num_soldiers > 0) {
		this._unload_timer.reset().start();
	} else {
		this.endLanding();
	}
};
