// Interface state machine flag
// Waiting -> Select any unit
// unitSelected -> Select any legal movement or action
var gameInterfaceState = 'waiting'; // waiting, unitSelected, confirmAction
var gameMap = null; // Array of arrays of MapTile objects

function gameTileClick(x,y) {
	// Takes a coordinate of a click and processes it to game data
	

}

function gameMapTile(type,wallHealth) {
	// Prototype to be instanced for each tile in the map array
	this.type;  // plains, trees, mountains, water 0,1,2,3
	this.wallHealth = wallHealth; // -1 -> Indestructable Wall | 0 -> No Wall | >1 -> Wall with that much health
	this.unit = null;
	this.effect; // To be added later...

	// Load terrain type
	switch(type) {
		case 0:
			this.type = 'plains';
			break;
		case 1:
			this.type = 'trees';
			break;
		case 2:
			this.type = 'mountains';
			break;
		case 3:
			this.type = 'water';
			break;
	}
}

function gameLoadMap(mapArray) {
	map = [];
	for (var y = 0; y < mapArray.length; y++) {
		map[map.length] = []
		for (var x = 0; x < mapArray[0].length; x++) {
			map[y][x] = new gameMapTile(mapArray[y][x][0],mapArray[y][x][1]);
		}
	}
	return map;
}
