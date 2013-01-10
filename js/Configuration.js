var g_config = {
	"global": {
		"debug": false,
		"url": "http://acow.nonstop-games.com",
		"initialCowProbability": 0.1,
		"description": "Build up your castle and defense against fierce enemies that sometimes fire cows, how many rounds can you survive?<br />Note: no cows were harmed during the creation of the game.",
		"phaseTimeLimit": {
			"build": 60,
			"placement": 15,
			"battle": 120
		},
		"numCannons": {
			"initial": 2,
			"perWave": 0.8,
			"perTower": 2,
			"max": 22
		},
		"cannonballs": {
			"scaleMin": 0.6,
			"scaleMax": 1.4
		},
		"cannonballViewOffset": {
			"x": 8,
			"y": -60
		},
		"megaCowBulletProbability": 0.2,
		"cowTransportProbability": 0.4,
		"wallHealth": 1,
		"grid": {
			"width": 32,
			"height": 32
		},
		"enemies": {
			"ships": {
				"initial": 2,
				"perWave": 1.5
			},
			"transports": {
				"initial": 2,
				"perWave": 0.8
			},
			"cows": {
				"initial": 1,
				"perWave": 0.3
			},
			"soldiers": {
				"min": 3,
				"max": 5
			}
		}
	},
	"ui": {
		"camera": {
			"zoomStep": 10,
			"friction": 0.25
		},
		"shelf": {
			"dragReturnTime": 250,
			"r": 0,
			"g": 0,
			"b": 0,
			"a": 0.25
		},
		"fingerSize": 45,
		"messageDisplayTime": 0.8,
		"scoreDisplayTime": 6,
		"buildQueue": {
			"color": {
				"r": 0,
				"g": 0,
				"b": 0,
				"a": 0.25
			},
			"items": 2
		},
		"pauseScreen": {
			"opacity": 0.85
		},
		"buildBackground": {
			"opacity": 0.25
		},
		"fonts": {
			"bigButtonFont": {
				"name": "Ruslan Display",
				"size": 25
			},
			"phaseNameFont": {
				"name": "Macondo Swash Caps",
				"size": 25
			},
			"scoreFont": {
				"name": "Macondo Swash Caps",
				"size": 25
			},
			"pauseScreenFontSmall": {
				"name": "Macondo Swash Caps",
				"size": 25
			},
			"pauseScreenFontLarge": {
				"name": "Ruslan Display",
				"size": 25
			}
		}
	},
	"effects": {
		"scoreMarker": {
			"color": {
				"r": 255,
				"g": 255,
				"b": 255,
				"a": 255
			},
			"outline": {
				"r": 0,
				"g": 0,
				"b": 0,
				"a": 128,
				"value": true
			},
			"glow": {
				"r": 64,
				"g": 255,
				"b": 255,
				"a": 255,
				"radius": 15,
				"value": true
			},
			"font": {
				"name": "Arial",
				"size": 30
			},
			"position": {
				"offset_x": 0,
				"offset_y": 0
			},
			"movement": {
				"delta_x": 0,
				"delta_y": 55,
				"duration": 2500
			}
		},
		"damageMarker": {
			"color": {
				"r": 255,
				"g": 168,
				"b": 0,
				"a": 255
			},
			"outline": {
				"r": 0,
				"g": 0,
				"b": 0,
				"a": 128,
				"value": true
			},
			"glow": {
				"r": 255,
				"g": 255,
				"b": 255,
				"a": 255,
				"radius": 10,
				"value": false
			},
			"font": {
				"name": "Arial",
				"size": 18
			},
			"position": {
				"offset_x": 0,
				"offset_y": 0
			},
			"movement": {
				"delta_x": 0,
				"delta_y": 55,
				"duration": 2250
			}
		},
		"clouds": {
			"num": 25,
			"enabled": false,
			"height": {
				"min": 100,
				"max": 500
			},
			"shadows": true
		}
	},
	"cannons": {
		"basic": {
			"health": 5,
			"damage": {
				"variance": 0.35,
				"value": 1.2
			},
			"speed": 400,
			"muzzleOffset": {
				"x": 17,
				"y": 15
			},
			"accuracy": 45,
			"range": 1400
		},
		"improved": {
			"health": 10,
			"damage": {
				"variance": 0.5,
				"value": 4
			},
			"speed": 1500
		},
		"advanced": {
			"health": 20,
			"damage": {
				"variance": 1,
				"value": 6
			},
			"speed": 800
		},
		"monster": {
			"health": 40,
			"damage": {
				"variance": 2,
				"value": 10
			},
			"speed": 1200
		}
	},
	"walls": {
		"basic": {
			"health": 2
		},
		"improved": {
			"health": 4
		}
	},
	"units": {
		"soldier": {
			"health": 1.25,
			"damage": 0.75,
			"range": 20,
			"accuracy": 45,
			"speed": {
				"min": 10,
				"max": 12
			},
			"reloadTime": 0.5,
			"targets": "troops"
		}
	},
	"enemies": {
		"ship": {
			"health": 3.5,
			"reloadTime": 2.5,
			"damage": {
				"variance": 0.25,
				"value": 1.1
			},
			"range": 750,
			"accuracy": 50,
			"score": 250,
			"speed": {
				"min": 30,
				"max": 40
			},
			"targets": "wall",
			"scale": 0.75
		},
		"transport": {
			"health": 5,
			"reloadTime": 2,
			"damage": {
				"variance": 0,
				"value": 0
			},
			"range": 120,
			"accuracy": 25,
			"score": 300,
			"scorePerSoldier": 30,
			"speed": {
				"min": 40,
				"max": 60
			},
			"targets": "troops",
			"scale": 0.9,
			"shoreOffset": {
				"x": 20,
				"y": 0
			},
			"unloadOffset": {
				"x": -20,
				"y": 0
			},
			"soldierCapacity": {
				"min": 2,
				"max": 5
			},
			"unloadDelay": 1.5
		},
		"cowTransport": {
			"cowzillaProbability": 0.08,
			"megacowProbability": 0.2,
			"santacowProbability": 0.5,
			"damage": {
				"variance": 0,
				"value": 0
			}
		},
		"soldier": {
			"health": 2,
			"reloadTime": 0.5,
			"range": 32,
			"damage": {
				"variance": 0.15,
				"value": 0.3
			},
			"score": 50,
			"accuracy": 50,
			"speed": {
				"min": 18,
				"max": 25
			},
			"targets": "troops,cannons,wall",
			"scale": 1,
			"moveDelay": 1,
			"attackDelay": 1,
			"deathDelay": 0.5,
			"waypointOffset": 128,
			"maxWalkDistance": 100
		},
		"cow": {
			"health": 2,
			"reloadTime": 0.5,
			"range": 32,
			"score": 20,
			"speed": {
				"min": 20,
				"max": 30
			},
			"damage": {
				"variance": 0,
				"value": 0
			},
			"scale": 1,
			"moveDelay": 0.5,
			"deathDelay": 0.5,
			"waypointOffset": 500,
			"mooDelay": 2,
			"mooProbability": 0.1
		}
	}
}