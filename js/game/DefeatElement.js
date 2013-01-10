/*
 * Copyright (C) 2011-2013 by NonStop Games
 * Please refer to license.txt for licensing details
 * 
 * DefeatElement.js
 *
 * The dom element shown in the defeat message
 * It can allow the user to input a name if they get into the highest score
 *
 * Using canvas for input is just too troublesome, so resort to dom
 *
 * creation date: 13-12-2012
 * 
 */

//for twitter button
!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0];if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src="https://platform.twitter.com/widgets.js";fjs.parentNode.insertBefore(js,fjs);}}(document,"script","twitter-wjs");

var DefeatElement = function(){
	var elm = {};
	var elem = document.createElement("div");

	function getRank(r){
		switch(r){
			case 1:
			return r + "st";
			case 2:
			return r + "nd";
			case 3:
			return r + "rd";
			default:
			return r + "th";
		}
	}

	var msg = document.createElement("div"),
		logo = new Image(),
		highscoreDiv = document.createElement("div"),
		highscoreMsg = document.createElement("span"),
		highscoreInput = document.createElement("input"),
		shareDiv = document.createElement("div"),
		but = new UIButton("OK"),
		rankspan = document.createElement("span"),
		msgAfter = document.createTextNode("Enter your name to be displayed in the global rank: "),
		shareDivMsg = document.createElement("span");

	var clicked = false;

	logo.src = g_assets.getImage("menu-logo").src;
	logo.style.float = "right";
	logo.style.width = "80px";
	logo.style.height = "80px";
	elem.appendChild(logo);

	$(but.getElement()).addClass("message-button");

	msg.style.marginBottom = "0.3em";

	msg.appendChild(shareDiv);

	highscoreInput.type = "text";
	if(localStorage["cd.name"]){
		highscoreInput.value = localStorage["cd.name"];
	}
	

	highscoreMsg.appendChild(document.createTextNode("You currently rank "));
	highscoreMsg.appendChild(rankspan);
	highscoreMsg.appendChild(document.createTextNode(" across the world!"));
	highscoreMsg.appendChild(document.createElement("br"));
	highscoreMsg.appendChild(msgAfter);

	highscoreDiv.appendChild(highscoreMsg);
	highscoreDiv.appendChild(highscoreInput);

	elem.appendChild(msg);
	elem.appendChild(highscoreDiv);
	elem.appendChild(but.getElement());

	shareDivMsg.innerHTML = "Tweet your score: ";
	shareDivMsg.style.verticalAlign = "top";

	shareDiv.style.fontSize = "0.6em";
	

	elm.getElement = function(){
		return elem;
	};

	var okFunc = function(){};

	var scoreToPost, toPostScore;

	elm.setScore = function(score){
		localStorage["cd.score"] = score;
		clicked = false;
		msg.innerHTML = "You scored " + score;

		msg.appendChild(shareDiv);

		shareDiv.innerHTML = "";
		shareDiv.appendChild(shareDivMsg);
		var twBut = document.createElement("a");
		twBut.className = "twitter-share-button";
		twBut.innerHTML = "Tweet";
		twBut.href="https://twitter.com/share";
		if(twBut.dataset){
			twBut.dataset["text"] = "Play Apocalypse Cow and beat my highscore " + score + "!";
			twBut.dataset["url"] = g_config.global.url;
			twBut.dataset["count"] = "none";
			twBut.dataset["size"] = "large";
			twBut.dataset["hashtags"] = "acow,Mayanapocalypse,nowplaying";
			twBut.dataset["via"] = "NonStopGamers";
		}else{
			// grrr IE9 grrr
			twBut.setAttribute("data-text", "Play Apocalypse Cow and beat my highscore " + score + "!");
			twBut.setAttribute("data-url", g_config.global.url);
			twBut.setAttribute("data-count", "none");
			twBut.setAttribute("data-size", "large");
			twBut.setAttribute("data-hashtags", "acow,Mayanapocalypse,nowplaying");
			twBut.setAttribute("data-via", "NonStopGamers");
		}
		shareDiv.appendChild(twBut);

		highscoreDiv.style.display = "none";

		$.get("/scores", function(data){
			// the same data get in highscore menu
			var lowest = parseInt(data[data.length - 1].score);
			if(lowest < score){
				highscoreDiv.style.display = "";
				highscoreInput.focus();
				scoreToPost = score;
				toPostScore = true;
				var rank = 0;
				while(rank < data.length && parseInt(data[rank].score) > score){
					rank++;
				}
				rankspan.innerHTML = getRank(rank + 1);
			}else{
				toPostScore = false;
			}
		});
	};

	elm.setFocus = function(){
		if(!highscoreDiv.style.display){
			highscoreInput.focus();
		}
	};

	elm.setOkClicked = function(func){
		okFunc = func;
	};

	but.onClick = function(){
		if(clicked)return;
		clicked = true;
		if(toPostScore){
			var name = highscoreInput.value;
			localStorage["cd.name"] = name;
			if(name){
				// post the score to the server
				$.post("/scores", {name: name, score: scoreToPost});
			}
		}
		okFunc();
	};

	return elm;
};
