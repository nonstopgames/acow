
#Apocalypse Cow!

A simple HTML5 castle defense game with many cows, developed by
[NonStop Games](http://nonstop-games.com) as a research project.

You can play it on [http://acow.nonstop-games.com](http://acow.nonstop-games.com).

##Licensing

The codes are licensed under MIT License, while the media files
(images and audio files) are licensed under Creative Commons
License. Refer to `license.txt` and `media/license.html` for more
details.

##Support

The game supports all modern browers, even IE9! It also supports
Mobile Safari on iPad and iPhone, although it is not optimized for the
small screen size of iPhone, nor does it support audio on iOS.

##Files

`index.html` is the only HTML file and the entry point for the game.

`/js` contains all the javascript files. The entry point is in `Main.js` while `Game.js` contains the main logic flow of the game. `AssetsData.js` and `Configuration.js` contains the necessary meta data for the game.

`/css` contains all the css style files.

`/media` contains all the media files.

##Setup


The game can be played locally by opening index.html in your
browser.

You can also set up the game in a server but should implement the
simple API for storing and fetching the high scores. To support the
global high score ranking, please refer to comments in
`js/game/DefeatElement.js` regarding the expected responses for its ajax
requests.
