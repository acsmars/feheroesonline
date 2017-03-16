var displayXMax, displayYMax;
var displayOverlayOpacityLevel = 0.5; // Opacity alpha level of overlay layer. 1 => solid

function displayCreateGrid(yMax,xMax) {
	// Create grid HTML elements in .grid
	// Call on document ready in main.js
	displayYMax = yMax;
	displayXMax = xMax;
	for (var y = 0; y < yMax; y++) {
		for (var x = 0; x < xMax; x++) {
			$(".grid").append(
				`<div class="tile" id="tile` + zfill(x,2) + zfill(y,2) + `" style="left:` + x * 90 + `px;top:` + y * 90 + `px">
					<div class="gridOverlay"></div>
					<div class="characterSprite"></div>
					<div class="info"></div>
				</div>`
			);
		}
	}
}

function displayTileClick(tile) {
	// Get tile and call game click function
	var id = tile.attr('id');
	coord = id.slice(4); // x,y of tile by this id
	x = parseInt(coord.slice(0,2));
	y = parseInt(coord.slice(3,4));

	// Run game actions for this event
	gameTileClick(x,y);
}

// Map Rendering Functions
function displayDrawMap() {
	// Draws the map background and foreground, call on startup

	// Set map background and foreground
	var imageUrl = "assets/backgrounds/Wavepattern.png";
	$('.mapBackground').css('background-image', 'url(' + imageUrl + ')');

	var imageUrl = "assets/mapBackgrounds/S0201.png";
	$('.mapForeground').css('background-image', 'url(' + imageUrl + ')');

	imageUrl = "assets/characters/sharena.png";
	$('#tile0203 > .characterSprite').css('background-image', 'url(' + imageUrl + ')');
}

function displayColorTile(x,y,color) {
	// Takes coordinates and color and highlights the gridOverlay of that tile
	// Color options: "red", "blue", "green", "none"
	var id = 'tile' + zfill(x,2) + zfill(y,2);
	var red = 0; var green = 0; var blue = 0;
	opacityLevel = displayOverlayOpacityLevel;
	switch(color) {
		case 'red':
			red = 255;
			break;
		case 'green':
			green = 255;
			break;
		case 'blue':
			blue = 255;
			break;
		default:
			opacityLevel = 0;
	}
	displayOverlaySetColor(id,red,green,blue,opacityLevel);
}

function displayClearColors() {
	// Clears all gridOverlay Colors
	$('.tile > .gridOverlay').css('background-color','');
}

function displayOverlaySetColor(id,r,g,b,a) {
	// Low level set color background by id
	$('#' + id + ' > .gridOverlay').css('background-color',`rgba(${r},${g},${b},${a})`);
}


function displaySetCharacterByCoord(x,y,address) {
	var id = 'tile' + zfill(x,2) + zfill(y,2);
	return displaySetCharacterByID(id,address);
}

function displaySetCharacterByID(id,address) {
	if (address == null) {
		$('#' + id + ' > .characterSprite').css('background-image', '');
	} else {
		$('#' + id + ' > .characterSprite').css('background-image', 'url(' + address + ')');
	}
}