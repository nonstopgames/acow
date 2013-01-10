var g_assets = {
	"img_basedir": "media/img/",
	"snd_basedir": "media/snd/",
	"snd_format": ["ogg", "mp3"],
	"images": {
		"menu-logo": "cowface.png",
		"main-logo": "acow-logo.png",
		"menu-background": "title_bg.jpg",
		"button-on-left": "left_on.png",
		"button-off-left": "left_off.png",
		"button-on-right": "right_on.png",
		"button-off-right": "right_off.png",
		"button-on-fill": "bg_on.png",
		"button-off-fill": "bg_off.png",
		"button-pause": "pause.png",
		"button-plus": "button_plus.png",
		"button-minus": "button_minus.png",
		"message-background": "scroll.png",
		"cannon-marker": "cannon_marker.png",
		"cannon-marker-error": "cannon_marker_error.png",
		"cannon-disabled": "cannon_disabled.png",
		"cannonball": "cannonball.png",
		"cow-cannon": "cow-fly-left.png",
		"mega-cow-cannon": "mega-cow-fly-left.png",
		"cannonball-shadow": "cannonball_shadow.png",
		"castle": "castle.png",
		"warning-marker": "warning.png",
		"cloud-1": "cloud1.png",
		"cloud-2": "cloud2.png",
		"cloud-3": "cloud3.png",
		"cloud-1-shadow": "cloud1_shadow.png",
		"cloud-2-shadow": "cloud2_shadow.png",
		"cloud-3-shadow": "cloud3_shadow.png",
		"hit-explosion-light": "explosion_light.png",
		"ui-buildbar-left": "bottom-shelf-left.png",
		"ui-buildbar-right": "bottom-shelf-right.png",
		"ui-buildbar-fill": "bottom-shelf-fill.png",
		"ui-statusbar": "status_bar.png"
	},
	"animations": {
		"blood": {
			"frame_width": 100,
			"frame_height": 100,
			"duration": 0.5,
			"smoothing": true,
			"image": "blood.png"
		},
		"castle-anim": {
			"frame_width": 128,
			"frame_height": 128,
			"framerate": 5,
			"image": "castle_anim.png"
		},
		"castle-disabled-anim": {
			"frame_width": 128,
			"frame_height": 128,
			"framerate": 5,
			"image": "castle_disabled_anim.png"
		},
		"hit-explosion": {
			"frame_width": 64,
			"frame_height": 64,
			"duration": 1.25,
			"smoothing": true,
			"image": "explosion_anim.png"
		},
		"hit-ground": {
			"frame_width": 64,
			"frame_height": 64,
			"duration": 1.8,
			"smoothing": true,
			"image": "ground_hit_anim.png"
		},
		"hit-splash": {
			"frame_width": 64,
			"frame_height": 64,
			"duration": 1.25,
			"smoothing": true,
			"image": "splash_anim.png"
		},
		"cannon-anim": {
			"frame_width": 64,
			"frame_height": 32,
			"framerate": 16,
			"frames": 11,
			"smoothing": true,
			"image": "cannon_anim.png"
		},
		"enemy-ship-up": {
			"frame_width": 64,
			"frame_height": 128,
			"duration": 0.7,
			"image": "pirateship_up_anim.png"
		},
		"enemy-ship-down": {
			"frame_width": 64,
			"frame_height": 128,
			"duration": 0.7,
			"image": "pirateship_down_anim.png"
		},
		"enemy-soldier-idle-left": {
			"frame_width": 72,
			"frame_height": 32,
			"duration": 1,
			"looping": true,
			"image": "soldier-left.png"
		},
		"enemy-soldier-walk-left": {
			"frame_width": 72,
			"frame_height": 32,
			"duration": 0.5,
			"looping": true,
			"image": "soldier-walk-left.png"
		},
		"enemy-soldier-attack-left": {
			"frame_width": 72,
			"frame_height": 32,
			"duration": 0.5,
			"looping": true,
			"image": "soldier-attack-left.png"
		},
		"enemy-soldier-death-left": {
			"frame_width": 72,
			"frame_height": 32,
			"duration": 1.5,
			"image": "soldier-death-left.png"
		},
		"enemy-soldier-idle-right": {
			"frame_width": 72,
			"frame_height": 32,
			"duration": 1,
			"looping": true,
			"image": "soldier-right.png"
		},
		"enemy-soldier-walk-right": {
			"frame_width": 72,
			"frame_height": 32,
			"duration": 0.5,
			"looping": true,
			"image": "soldier-walk-right.png"
		},
		"enemy-soldier-attack-right": {
			"frame_width": 72,
			"frame_height": 32,
			"duration": 0.5,
			"looping": true,
			"image": "soldier-attack-right.png"
		},
		"enemy-soldier-death-right": {
			"frame_width": 72,
			"frame_height": 32,
			"duration": 1.5,
			"image": "soldier-death-right.png"
		},
		"enemy-cow-idle-right": {
			"frame_width": 72,
			"frame_height": 32,
			"duration": 1,
			"looping": true,
			"image": "cow-right.png"
		},
		"enemy-cow-walk-right": {
			"frame_width": 72,
			"frame_height": 32,
			"duration": 0.5,
			"looping": true,
			"image": "cow-walk-right.png"
		},
		"enemy-cow-mooing-right": {
			"frame_width": 72,
			"frame_height": 32,
			"duration": 0.5,
			"looping": true,
			"image": "cow-moo-right.png"
		},
		"enemy-cow-death-right": {
			"frame_width": 72,
			"frame_height": 32,
			"duration": 0.2,
			"image": "cow-death-right.png"
		},
		"enemy-cow-idle-left": {
			"frame_width": 72,
			"frame_height": 32,
			"duration": 1,
			"looping": true,
			"image": "cow-left.png"
		},
		"enemy-cow-walk-left": {
			"frame_width": 72,
			"frame_height": 32,
			"duration": 0.5,
			"looping": true,
			"image": "cow-walk-left.png"
		},
		"enemy-cow-mooing-left": {
			"frame_width": 72,
			"frame_height": 32,
			"duration": 0.5,
			"looping": true,
			"image": "cow-moo-left.png"
		},
		"enemy-cow-death-left": {
			"frame_width": 72,
			"frame_height": 32,
			"duration": 0.2,
			"image": "cow-death-left.png"
		},
		"enemy-santa-cow-idle-right": {
			"frame_width": 72,
			"frame_height": 32,
			"duration": 1,
			"looping": true,
			"image": "santa-cow-right.png"
		},
		"enemy-santa-cow-death-right": {
			"frame_width": 72,
			"frame_height": 32,
			"duration": 0.2,
			"image": "santa-cow-death-right.png"
		},
		"enemy-santa-cow-idle-left": {
			"frame_width": 72,
			"frame_height": 32,
			"duration": 1,
			"looping": true,
			"image": "santa-cow-left.png"
		},
		"enemy-santa-cow-death-left": {
			"frame_width": 72,
			"frame_height": 32,
			"duration": 0.2,
			"image": "cow-death-left.png"
		},
		"enemy-mega-cow-idle-right": {
			"frame_width": 144,
			"frame_height": 64,
			"duration": 1,
			"looping": true,
			"image": "mega-cow-right.png"
		},
		"enemy-mega-cow-death-right": {
			"frame_width": 144,
			"frame_height": 64,
			"duration": 0.2,
			"image": "mega-cow-death-right.png"
		},
		"enemy-mega-cow-idle-left": {
			"frame_width": 144,
			"frame_height": 64,
			"duration": 1,
			"looping": true,
			"image": "mega-cow-left.png"
		},
		"enemy-mega-cow-death-left": {
			"frame_width": 144,
			"frame_height": 64,
			"duration": 0.2,
			"image": "mega-cow-death-left.png"
		},
		"enemy-cowzilla-idle-right": {
			"frame_width": 350,
			"frame_height": 155,
			"duration": 1,
			"looping": true,
			"image": "cowzilla-right.png"
		},
		"enemy-cowzilla-death-right": {
			"frame_width": 350,
			"frame_height": 155,
			"duration": 0.2,
			"image": "cowzilla-death-right.png"
		},
		"enemy-cowzilla-idle-left": {
			"frame_width": 350,
			"frame_height": 155,
			"duration": 1,
			"looping": true,
			"image": "cowzilla-left.png"
		},
		"enemy-cowzilla-death-left": {
			"frame_width": 350,
			"frame_height": 155,
			"duration": 0.2,
			"image": "cowzilla-death-left.png"
		},
		"enemy-transport-up-moving": {
			"frame_width": 72,
			"frame_height": 128,
			"duration": 0.7,
			"looping": true,
			"image": "transport-up-moving.png"
		},
		"enemy-transport-down-moving": {
			"frame_width": 72,
			"frame_height": 128,
			"duration": 0.7,
			"looping": true,
			"image": "transport-down-moving.png"
		},
		"enemy-transport-up-landing": {
			"frame_width": 72,
			"frame_height": 128,
			"duration": 0.7,
			"looping": false,
			"image": "transport-up-landing.png"
		},
		"enemy-transport-down-landing": {
			"frame_width": 72,
			"frame_height": 128,
			"duration": 0.7,
			"looping": false,
			"image": "transport-down-landing.png"
		},
		"enemy-transport-up-idle": {
			"frame_width": 72,
			"frame_height": 128,
			"duration": 0.7,
			"looping": true,
			"image": "transport-up-idle.png"
		},
		"enemy-transport-down-idle": {
			"frame_width": 72,
			"frame_height": 128,
			"duration": 0.7,
			"looping": true,
			"image": "transport-down-idle.png"
		},
		"enemy-transport-up-departing": {
			"frame_width": 72,
			"frame_height": 128,
			"duration": 0.7,
			"looping": false,
			"image": "transport-up-departing.png"
		},
		"enemy-transport-down-departing": {
			"frame_width": 72,
			"frame_height": 128,
			"duration": 0.7,
			"looping": false,
			"image": "transport-down-departing.png"
		}
	},
	"tilesets": {
		"level-tiles": {
			"tiles": {
				"water": [ 1, 1, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3 ],
				"grass": [ 4, 5, 6, 7, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9 ],
				"bank-up": [ 16, 17, 18 ],
				"bank-upright": [ 42, 43, 44 ],
				"bank-right": [ 13, 14, 15 ],
				"bank-downright": [ 33, 34, 35 ],
				"bank-down": [ 19, 20, 21 ],
				"bank-downleft": [ 36, 37, 38 ],
				"bank-left": [ 22, 23, 21 ],
				"bank-upleft": [ 39, 40, 41 ],
				"bank-inner-upright": [ 31, 32 ],
				"bank-inner-downright": [ 25, 26 ],
				"bank-inner-downleft": [ 27, 28 ],
				"bank-inner-upleft": [ 29, 30 ]
			},
			"tile_width": 64,
			"tile_height": 64,
			"image": "leveltiles.png"
		},
		"sand-tiles": {
			"tiles": {
				"sand": [ 0 ]
			},
			"tile_width": 32,
			"tile_height": 32,
			"image": "sand.png"
		},
		"wall-tiles": {
			"tiles": {
				"center": [ 0 ],
				"none": [ 1 ],
				"updown": [ 2 ],
				"leftright": [ 3 ],
				"down": [ 4 ],
				"up": [ 5 ],
				"left": [ 6 ],
				"right": [ 9 ],
				"downleft": [ 10 ],
				"downright": [ 11 ],
				"upleft": [ 12 ],
				"upright": [ 13 ],
				"t-up": [ 7 ],
				"t-down": [ 8 ],
				"t-left": [ 16 ],
				"t-right": [ 17 ],
				"destroyed-center": [ 14 ],
				"destroyed-none": [ 14 ],
				"destroyed-updown": [ 14 ],
				"destroyed-leftright": [ 14 ],
				"destroyed-down": [ 14 ],
				"destroyed-up": [ 14 ],
				"destroyed-left": [ 14 ],
				"destroyed-right": [ 14 ],
				"destroyed-downleft": [ 14 ],
				"destroyed-downright": [ 14 ],
				"destroyed-upleft": [ 14 ],
				"destroyed-upright": [ 14 ]
			},
			"tile_width": 32,
			"tile_height": 40,
			"offset_y": -8,
			"image": "walltiles.png"
		},
		"wall-tiles-place-error": {
			"tiles": {
				"center": [ 0 ],
				"none": [ 1 ],
				"updown": [ 2 ],
				"leftright": [ 3 ],
				"down": [ 4 ],
				"up": [ 5 ],
				"left": [ 6 ],
				"right": [ 9 ],
				"downleft": [ 10 ],
				"downright": [ 11 ],
				"upleft": [ 12 ],
				"upright": [ 13 ],
				"t-up": [ 7 ],
				"t-down": [ 8 ],
				"t-left": [ 16 ],
				"t-right": [ 17 ]
			},
			"tile_width": 32,
			"tile_height": 40,
			"offset_y": -8,
			"image": "walltiles_error.png"
		}
	},
	"sounds": {
		"pieceGrabbed": "piece_grab",
		"pieceRotate": "piece_rotate",
		"wallPlaced": "place_wall",
		"cannonPlaced": "place_cannon",
		"playerCannonFire": "cannon_fire_player",
		"enemyCannonFire": "cannon_fire_enemy",
		"bulletHitGround": "cannonball_hit_ground",
		"bulletHitWall": "cannonball_hit_wall",
		"bulletHitShip": "cannonball_hit_ship",
		"bulletHitWater": "cannonball_hit_water",
		"destroyShip": "destroy_ship",
		"buttonClick": "button_press",
		"moo": "moo",
		"cowzilla-entrance": "cowzilla"
	}
};