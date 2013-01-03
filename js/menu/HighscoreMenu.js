/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * HighscoreMenu.js
 *
 * High score menu.
 *
 * creation date: 22-06-2012
 */

"use strict";

function HighscoreMenu() {
	var _elem = this._elem = g_env.createDiv('menu-highscore');

	var title = document.createElement('div');
	title.setAttribute('id','highscore-title');
	title.setAttribute('class','center');
	title.innerHTML = "High Score";

	var container = this._container = document.createElement("div");
	container.className = "center";
	container.id = "score-container";

	var button = new UIButton("Back");

	this._elem.appendChild(title);
	this._elem.appendChild(container);
	this._elem.appendChild(button.getElement());

	button.getElement().style.position = "static";
	button.getElement().style.margin = "0 auto";
	button.getElement().style.width = "60px";

	button.onClick = function(){
		$(_elem).addClass("before");
		setTimeout(function(){
			g_menu.start();
		}, 500);
	}
}

HighscoreMenu.prototype.getElement = function() {
	return this._elem;
};

HighscoreMenu.prototype.windowResized = function(w,h) {

};

HighscoreMenu.prototype.load = function(){
	var that = this;
	this._container.innerHTML = "Loading Scores...";
	$(this._container).addClass("loading");
	$.get("/scores", function(data){
		// this should retrieve an array of objects {name, score} that is in decending order of score
		setTimeout(function(){
			$(that._container).removeClass("loading");
			that.setScorebarData(data);
		}, 1000);
	});
};

HighscoreMenu.prototype.setScorebarData = function(data){
	this._container.innerHTML = "";
	var table = document.createElement("tbody"), row, cell;
	var foundMine = false, myRow;
	var s = localStorage["cd.score"],
		n = localStorage["cd.name"];

	var num = 0;
	for(var i = 0; i < data.length; i++){
		row = document.createElement("tr");

		if(!foundMine && s === data[i].score && n === data[i].name){
			row.className = "mine";
			foundMine = true;
			myRow = row;
		}

		if(data[num].score !== data[i].score){
			num = i;
		}

		cell = document.createElement("td");
		cell.innerHTML = num + 1;
		row.appendChild(cell);

		cell = document.createElement("td");
		cell.innerHTML = data[i].name;
		row.appendChild(cell);

		cell = document.createElement("td");
		cell.innerHTML = data[i].score;
		row.appendChild(cell);

		table.appendChild(row);
	}

	var t = document.createElement("table");
	t.appendChild(table);

	this._container.appendChild(t);

	if(foundMine){
		var c = this._container;
		setTimeout(function(){
			c.scrollTop = Math.max(0, myRow.offsetTop - 120);
		}, 0);
	}
};

