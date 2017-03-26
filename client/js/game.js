// Interface state machine flag
// Waiting -> Select any unit
// unitSelected -> Select any legal movement or action
var gameInterfaceState = 'waiting'; // waiting, unitSelected, confirmAction
var gameMap = null; // Array of arrays of MapTile objects

function gameTileClick(x,y) {
	// Takes a coordinate of a click and processes it to game data
	

}

function gameMapTile(type,wallHealth,unit) {
	// Prototype to be instanced for each tile in the map array
	this.type;  // plains, trees, mountains, water 0,1,2,3
	this.wallHealth = wallHealth; // -1 -> Indestructable Wall | 0 -> No Wall | >1 -> Wall with that much health
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
	
	this.unit = unit;
	
}

function gameInitiateUnit(unitIndex) {
	if ((unitIndex > -1) && (unitIndex < unitList.length)) {
		this.stats = unitList[unitIndex].stats;
		this.character = unitList[unitIndex].character ;
		this.movementType = unitList[unitIndex].movementType; //Cavalry/Infantry/etc
		this.weapon = unitList[unitIndex].weapon;
		this.alive = true;
		this.active = false;
		/*
			Should load all data for each unit directly from teambuilder
			Prior to this, that information would be stored in an array of objects
			The object's starting position would be determined by its index in that list
			That index (0, 1, 8 or w/e) would be stored in the map we load in the third index of the array
		*/
		return this;
	}
	return null;
}

function gameLoadMap(mapArray) {
	map = [];
	for (var y = 0; y < mapArray.length; y++) {
		map[y] = [];
		for (var x = 0; x < mapArray[0].length; x++) {
			var loadUnit = new gameInitiateUnit(mapArray[y][x][2]); //Returns an object if a unit is supposed to start there
			map[y][x] = new gameMapTile(mapArray[y][x][0],mapArray[y][x][1], loadUnit);
		}
	}
	return map;
}