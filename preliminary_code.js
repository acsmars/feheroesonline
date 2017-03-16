/*

Unadded Assists:
None! (Reminder to review Smite and Reciprocal Aid mechanics)

Unadded Passives:

A: None
B: Obstruct, Brash Assault, Live to Serve, Renewal (figure out how Obstruct works)
C: Fortify Dragons

Unadded Weapons:
(Lots)

Red Sword: None
Red Tome:  None
Red Breath: None
Green Axe: ???
Green Tome:  ???
Green Breath: ???
Blue Spear: ???
Blue Tome:  ???
Blue Breath: ???
Staves: ???
Daggers:  ???
Bow: ???

Unadded Okugi:
(Lots)

*/



var map, movement, tactician, actor, assist, combat, passive, weapon, controller;

var Global = {
	spur_bonus = 4,
	blow_bonus = 6,
	"weaponHits": {
		"Sword": "def",
		"Axe": "def",
		"Spear": "def",
		"Dagger": "def",
		"Bow": "def",
		"Breath": "res",
		"Tome": "res",
		"Staff": "res"
	},
	Moves = {
		"Infantry": 2,
		"Armor": 1,
		"Cavalry": 3,
		"Pegasus": 2
	}
}

var Classes = ["Infantry", "Armor", "Cavalry", "Pegasus"];


//Put useful global functions here


var getHPPercentage = function(unit) {
	return  Math.floor((unit.hp.max - unit.hp.remaining)/(unit.hp.max));
};

var dist = function(pos1, pos2) {
	var out = 0;
	out += Math.max(pos1[0] - pos2[0], pos2[0] - pos1[0]);
	out += Math.max(pos1[1] - pos2[1], pos2[1] - pos1[1]);
	return out;
};

/*
Map information

0 = Passable flat terrain (nothing special)
1 = Obstructed terrain (Infantry spend full turn, cavalry cannot pass)
2 = Impassible terrain (only winged characters can pass)
3 = Wall (nothing can pass)
4 = Horizontally fenced (can only be entered from above or below)
5 = Vertically fenced (can only be entered from right or left)
6 = Icy terrain (infantry and armor move through instantly but cannot stop, cavalry can't pass)

for starting points:

make a list of coordinates, generate those in order

Blank Map: 
	"": [
		[0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0]
	]

*/

var unitData = { //move this to a separate json file
	"Marth": {
		"stats": {
			"hp": [3, 4, 5],
			"atk": [4, 5, 6],
			"def": [3, 4, 5],
			"spd": [4, 5, 6],
			"res": [2, 3, 4]
		},
		"technicalTypes": ["Infantry"],
		"weapon": ["falchion"],
		"assists": ["pivot"],
		"passive-A": ["idk"],
		"passive-B": ["not", "coded yet"],
		"passive-C": ["leave", "me", "alone"]
	}
};

/*
base = the unit's stat unaltered
change = attack boosts/nerfs based on abilities, passives, weapons
end = at the end of which team's turn (index) does the "change" revert back to 0.
boost = flat stat boosts given by HP+5, Atk+3 etc

*/

var blankUnit = {
	"hp": {
		"max": 0,
		"remaining": 0,
		"boost": 0
	},
	"atk": {
		"base": 0,
		"change": 0,
		"end": 0,
		"boost": 0
	},
	"def": {
		"base": 0,
		"change": 0,
		"end": 0,
		"boost": 0
	},
	"res": {
		"base": 0,
		"change": 0,
		"end": 0,
		"boost": 0
	},
	"spd": {
		"base": 0,
		"change": 0,
		"end": 0,
		"boost": 0
	},
	"okugi": {
		"counter": 0,
		"turns": 0,
		"action": 0
	},
	"movement": {
		"change": 0,
		"end": 0
	},
	"Class": "",
	"technicalTypes": [],
	"weapon": "",
	"assist": "",
	"passive_A": "",
	"passive_B": "",
	"passive_C": "",
	"pos": [0, 0],
	"attackRange": 0,
	"assistRange": 0,
	"team": 0,
	"alive": true,
	"active": false
};

/*
effective = "effective against armored" etc
color = triangle color
special = name of the weapon (used for special effects)
underHP = a fraction of HP under which the unit must be for the above special to work
type = Bow/Sword/Axe etc
okugiSpeed = changes Okugi time (-1 for faster, +1 for slower)

*/

var blankWeapon = {
	"might": 0,
	"range": 0,
	"effective": "",
	"color": "",
	"type": "",
	"special": "",
	"underHP": 1,
	"okugiSpeed": 0
};

var legalMaps = { //move this to a separate folder of json files for each map
	"Unnamed 1": [
		[2, 2, 0, 0, 0, 2],
		[2, 2, 0, 1, 0, 0],
		[2, 0, 0, 0, 1, 1],
		[2, 0, 0, 0, 0, 2],
		[2, 2, 0, 0, 2, 2],
		[2, 0, 1, 0, 1, 2],
		[2, 0, 0, 1, 1, 2],
		[0, 0, 0, 0, 0, 0]
	]
};
var startingPoints = {
	"Unnamed 1": [
		[1, 3],
		[0, 3],
		[0, 4],
		[0, 5],
		[7, 2],
		[7, 3],
		[7, 4],
		[7, 5]
	]
};
var emptyUnitMap = [
		[-1, -1, -1, -1, -1, -1],
		[-1, -1, -1, -1, -1, -1],
		[-1, -1, -1, -1, -1, -1],
		[-1, -1, -1, -1, -1, -1],
		[-1, -1, -1, -1, -1, -1],
		[-1, -1, -1, -1, -1, -1],
		[-1, -1, -1, -1, -1, -1],
		[-1, -1, -1, -1, -1, -1]
	];
	

function Controller(sender, server) {
	//the only object to interact with client 
	controller = this;
	this.sender = sender;
	if (sender === "server") {
		this.clientList = []; //this will actually be defined externally
	}
	if (sender === "client") {
		this.server = server; //pass the server to any client for validation
	}
	
	this.beginGame = function(teams, map) {
		tactician.loadUnits(teams[0], teams[1]); //Can make more teams later, for now must be an array of 2
		map.loadMap(map);
		this.Turn = 1;
		this.activeTeam = 0;
		this.teamCount = teams.length;
		this.remainingTeams = teams;
		this.clickType = "Select Unit";
		actor.startTurn();
	};
	
	this.endGame = function() {
		//When all armies but one are dead or every other player forfeits
	};
		
	this.endTurn = function() {
		var cycle = true;
		while (cycle) {
			this.activeTeam++;
			if (this.activeTeam > this.teamCount) {
				this.activeTeam = 0;
				this.Turn++;
			}
			if (this.remainingTeams.indexOf(this.activeTeam) !== -1) {
				cycle = false;
			}
		}
		for (var a in tactician.units) {
			var p = tactician.units[a];
			if ((p.team === this.activeTeam) && (p.alive)) {
				p.active = true;
			}
			else {
				p.active = false;
			}
		}
		
		this.initiateTurn(this.activeTeam);
	};
	
	this.gameTileClick = function myself(pos) {
	
		var deselectUnit = function(pos) {
			this.waiting = true;
			this.lastClick = [];
			this.attacking = false;
			this.assisting = false;
			myself(pos);
		}
		
		if (this.waiting) {
			//Needs to select action
			this.selectedUnit = map.atPosition(pos);
			this.moveSelectedTo = [];
			if (this.selectedUnit !== -1) {
				if (tactician.units[this.selectedUnit].team === this.activeTeam) {
					this.waiting = false;
					this.moveSelectedTo = tactician.units[this.selectedUnit].pos;
				}
			}
			return;
		}
		else {
			if (pos === this.lastClick) {
				this.executeAction(this.selectedUnit, tactician.units[this.selectedUnit].pos, pos, this.attacking, this.defending);
			}
			else if (movement.MovementData[this.selectedUnit]["CAN GO"].indexOf(pos) !== -1) {
				this.moveSelectedTo = pos;
				this.lastClick = pos;
				this.attacking = false;
				this.assisting = false;
				return;
			}
			else if (Object.keys(movement.MovementData[this.selectedUnit]["CAN ASSIST"]).indexOf(pos) !== -1) {
				if (movement.MovementData[this.selectedUnit]["CAN ASSIST"][pos].indexOf(this.moveSelectedTo) !== -1) {
					this.selectedTarget = map.atPosition(pos);
					this.lastClick = pos;
					this.attacking = false;
					this.assisting = true;
					return;
				}
			}
			else if (Object.keys(movement.MovementData[this.selectedUnit]["CAN ATTACK"]).indexOf(pos) !== -1) {
				if (movement.MovementData[this.selectedUnit]["CAN ATTACK"][pos].indexOf(this.moveSelectedTo) !== -1) {
					this.selectedTarget = map.atPosition(pos);
					this.lastClick = pos;
					this.attacking = true;
					this.assisting = false;
					return;
				}
			}
			else {
				deselectUnit(pos);
			}
			return;
		}
		
		this.draw(this.selectedUnit, this.selectedTarget);
	};
	
	this.executeAction = function(unitIndex, whereFrom, whereTo, attack, assist) {
		var unit = tactician.units[unitIndex], tar;
		
		var validation = function(unitIndex, whereFrom, whereTo, attack, assist) {
			if (this.sender === "client") {
				this.loadPaths(unit.team);
				//Now tell the server to do the same thing and validate
				this.server.executeAction(unitIndex, whereFrom, whereTo, attack, assist);
			}
		};
				
		if (!(whereFrom === whereTo)) {
			if (this.sender === "server") {
				//checks validity of move
				if (movement.MovementData[unitIndex]["CAN GO"].indexOf(whereTo) === -1) { 
					/*
					If it's illegal, it returns false and tells the client to undo it
					
					print("Error 1: Unit not allowed to move there");
					Logger.log("Someone moved a unit to an illegal tile", "red");
					this.undoAction(this.client, unitIndex, whereFrom)
					*/
					return false;
				} 
			}
			this.move(unit, whereTo, false);
			validation(unitIndex, whereFrom, whereTo, attack, assist);
		}
		if (attack.length > 0) {
			if (this.sender === "server") {
				//checks validity of move
				if (Object.keys(movement.MovementData[unitIndex]["CAN HIT"]).indexOf(attack) === -1) {
					/*
					If that isn't a tile you're supposed to be allowed to attack
					
					print("Error 2: Unit not allowed to attack there");
					Logger.log("Someone attacked a tile they aren't allowed to attack", "red");
					this.undoAction(this.client, unitIndex, whereFrom)
					*/
					return false;
				}
				if (movement.MovementData[unitIndex]["CAN HIT"][attack].indexOf(whereTo) === -1) {
					/*
					If you aren't supposed to be able to attack the tile from that position
					
					print("Error 3: Unit not able to attack that spot from there");
					Logger.log("Someone attacked a tile from somewhere that shouldn't reach", "red");
					this.undoAction(this.client, unitIndex, whereFrom)
					*/
					return false;
				}
			}
			tar = tactician.units[map.atPosition(attack)];
			combat.fight(unit, target);
			validation(unitIndex, whereFrom, whereTo, attack, assist);
		}
		else if (assist.length > 0) {
			if (this.sender === "server") {
				//checks validity of move
				if (Object.keys(movement.MovementData[unitIndex]["CAN ASSIST"]).indexOf(assist) === -1) {
					/*
					If that isn't a tile you're supposed to be allowed to assist
					
					print("Error 2: Unit not allowed to assist there");
					Logger.log("Someone assisted a tile they aren't allowed to assist", "red");
					this.undoAction(this.client, unitIndex, whereFrom)
					*/
					return false;
				}
				if (movement.MovementData[unitIndex]["CAN ASSIST"][assist].indexOf(whereTo) === -1) {
					/*
					If you aren't supposed to be able to attack the tile from that position
					
					print("Error 3: Unit not able to assist that spot from there");
					Logger.log("Someone assisted a tile from somewhere that shouldn't reach", "red");
					this.undoAction(this.client, unitIndex, whereFrom)
					*/
					return false;
				}
			}
			tar = tactician.units[map.atPosition(assist)];
			assist.useAssist(unit, tar, whereTo);
			validation(unitIndex, whereFrom, whereTo, attack, assist);
		}
		if (this.sender === "server") {
			this.loadPaths(unit.team);
			this.updateUnits();
			/*
			This will tell all of the Clients to update their units' positions and stats to reflect the server's
			
			This will override people who edited their client, and update the results of a player's attack to
			everyone else in the game.
			
			So if something wonky happens during the combat/assist phase, the server can be like, "that's not right"
			and override whatever happened on the client's end.
			*/
		}
		
		this.tryEndTurn();
		return true;
	};
	
	this.updateUnits = function() { //only for server
		/*
		Should probably override some other things too
		
		var local;
		
		for (var c in this.clientList) {
			local = this.clientList[c];
			for (var a in tactician.units) {
				local.tactician.units[a].alive = tactician.units[a].alive;
				local.tactician.units[a].active = tactician.units[a].active;
				local.tactician.units[a].team = tactician.units[a].team;
				local.tactician.units[a].hp = tactician.units[a].hp;
				local.tactician.units[a].atk = tactician.units[a].atk;
				local.tactician.units[a].def = tactician.units[a].def;
				local.tactician.units[a].res = tactician.units[a].res;
				local.tactician.units[a].spd = tactician.units[a].spd;
				local.tactician.units[a].pos = tactician.units[a].pos;
				local.tactician.units[a].Class = tactician.units[a].Class;
				local.tactician.units[a].technicalTypes = tactician.units[a].technicalTypes;
				local.tactician.units[a].weapon = tactician.units[a].weapon;
				local.tactician.units[a].assist = tactician.units[a].assist;
				local.tactician.units[a].passive_A = tactician.units[a].passive_A;
				local.tactician.units[a].passive_B = tactician.units[a].passive_B;
				local.tactician.units[a].passive_C = tactician.units[a].passive_C;
			};
			local.map.UnitPositions = map.UnitPositions;
			local.controller.activeTeam = this.activeTeam;
		}
		
		*/
	};
	
	this.loadPaths = function(team) {
		for (var a in tactician.units) {
			if ((tactician.units[a].team === team) && (tactician.units[a].active)) {
				movement.pathFinder(a, tactician.units[a].pos, tactician.units[a].Class, team, tactician.units[a].attackRange, tactician.units[a].assistRange);
			}
		}
	};
	
	this.draw = function(unitIndex, targetIndex) {
		if (this.sender === "client") {
			this.displayMovementMap(unitIndex);
			this.displayInfo(unitIndex, 0);
			this.displayInfo(targetIndex, 1);
			
			/* 
			I'm confused on how units are drawn so commenting this out
			
			for (var a in tactician.units) {
				this.displayUnit(a);
			};
			*/
		}
		return;
	};
	
	this.displayMovementMap = function(unitIndex) { //only for client
		var mdata = movement.MovementData[unitIndex], l = [];
		
		for (var a in mdata["CAN GO"]) {
			l = mdata["CAN GO"]; //this is list of coordinate like [[4, 5], [3, 5], [4, 6]];
			display.displayColorTile(l[a][0], l[a][1], "blue");
		};
		for (var a in Object.keys(mdata["CAN ASSIST"])) {
			l = mdata["CAN GO"]; //this is list of coordinate like [[3, 3], [2, 4]];
			display.displayColorTile(l[a][0], l[a][1], "green");
		};
		for (var a in Object.keys(mdata["CAN ATTACK"])) {
			l = mdata["CAN GO"]; //this is list of coordinate like [[5, 6], [2, 5]];
			display.displayColorTile(l[a][0], l[a][1], "red");
		};
	};
	
	this.displayUnit = function(unitIndex) { //only for client
		/*
		if (unitIndex > -1) {
			var unit = tactician.units[this.selectedUnit];
		}
		else return;
		
		if (unit.alive === false) return;
		*/
		
		/*
		var face = (unit.team === this.activeTeam ? assets[unit.name].active : assets[unit.name].normal)
		client.draw(face, unit.pos);
		var percentage = getHPPercentage(unit);
		client.drawHPBar(percentage, unit.pos);
		client.drawOkugi(unit.okugi.counter, unit.pos);
		*/
	};
	
	this.displayInfo = function(unitIndex, slot) {
		//stuff
		return;
	};
	
	this.move = function(unit, pos, dontErase) {
		if (map.canStand(unit, pos, false)) {
			return; //something went wrong - this should never happen
		}
		if (!(dontErase)) {
			map.UnitPositions[unit.pos[1]][unit.pos[0]] = -1; //clear out old space (careful of cloning!!)
			//Only use this when doing stuff like swapping the positions of two units, since two units temporarily have the same position in that case;
		}
		map.UnitPositions[pos[1]][pos[0]] = unit.index; //fill in new space on map
		unit.pos = pos;
		/*
		Logger.log("Unit " + unit.name + " moved to " + pos[1] + ", " + pos[0] + "!");
		*/
	};
	
	this.tryEndTurn = function() {
		for (var a in tactician.units) {
			if (tactician.units[a].team !== this.activeTeam) continue;
			if (tactician.units[a].active === true) return false;
		}
		this.endTurn();
		return true;
	}
}

function Units() {
	tactician = this;
	this.units = [];
	
	
	var addUnit = function(unit, team) {
		out = unit; //this is a dictionary
		out["team"] = team;
		return out;
	};
	this.loadUnits = function(team1, team2) {
		for (var a in team1) {
			this.units.push(addUnit(a, 1));
			team1[a].weapon = WeaponData[team1[a].weapon];
		}
		for (var a in team2) {
			this.units.push(addUnit(a, 2));
		}
		for (var a in this.units) {
			this.units[a].weapon = WeaponData[this.units[a].weapon];
			if (!(this.units[a].weapon.okugiSpeed)) {
				this.units[a].weapon.okugiSpeed = 0;
			}
			if (!(this.units[a].weapon.special)) {
				this.units[a].weapon.special = "";
			}
			if (!(this.units[a].weapon.underHP)) {
				this.units[a].weapon.underHP = 1;
			}
			if (!(this.units[a].weapon.effective)) {
				this.units[a].weapon.effective = "";
			}
		}
	};
	
	this.initiateBattle = function() {
		for (var a in this.units) {
			var p = this.units[a];
			weapon.initiateBattle(p.weapon.special, p);
			passive.initiateBattle(p.passive_A, p);
		}
	};
	
	this.initiateTurn = function(team) {
		this.clearOldStatChanges(team); //clears dated stats for each unit
		for (var a in this.units) {
			var p = this.units[a];
			if (p.team !== team) return;
			weapon.initiateTurn(p.weapon.special, p);
			passive.initiateTurn(p.passive_A, p);
		}
	};
	
	this.setBoost = function(unit, stat, value, end) {
		//I think you only override the existing boost if it's of greater magnitude or opposite sign
		//the variable "end" means when the stat change where's off. It's the integer of the team whose turn when starting ends it.
		var existing = unit[stat].change;
		var setEndTime = function(end) {
			unit[stat].end = end;
		}
		if (existing === 0) {
			unit[stat].change = value;
			setEndTime(end);
			return;
		}
		else if ((value > 0) && (value > existing)) {
			unit[stat].change = value;
			setEndTime(end);
			return;
		}
		else if ((value < 0) && (value < existing)) {
			unit[stat].change = value;
			setEndTime(end);
			return;
		}
		return; 
	}
	
	this.flipBoosts = function(unit, sign) {
		var i = 0;
		while (i < 4) {
			var s = ["atk", "def", "res", "spd"][i];
			if (unit[s].change * sign < 0) {
				unit[s].change *= -1; //Inverts negatives if sign is positive (Harsh Command) or positives if sign is negative (Panic)
			}
			i++;
		}
	}
	
	this.clearOldStatChanges = function(turnNumber) {
		for (var a in this.units) {
			var p = this.units[a];
			if (p.atk.end === TurnNumber) {
				p.atk.change = 0;
			}
			if (p.def.end === TurnNumber) {
				p.def.change = 0;
			}
			if (p.res.end === TurnNumber) {
				p.res.change = 0;
			}
			if (p.spd.end === TurnNumber) {
				p.spd.change = 0;
			}
			if (p.movement.end === TurnNumber) {
				p.movement.change = 0;
			}
		}
	};
	
	this.AOEStatChange = function(unit, pos, team, stat, value, affects, range, only) {
		/*
			unit = unit who activated the skill
			pos = where that unit is
			team = unit's team
			stat = affected stat
			value = change in stat
			affects = who it affects; can be "team", "enemies", "all"
			range = how far it reaches
			only = affects only certain classes (e.g. armor)
		*/
		
		for (var a in this.units) {
			var p = this.units[a];
			if (p === unit) continue;
			if ((p.team === team) && (affects === "enemies")) continue;
			if ((p.team !== team) && (affects === "team")) continue;
			if (only !== "Any") {
				if (p.technicalTypes.indexOf(only) === -1) continue;
			} 
			if (dist(p.pos, pos) > range) continue;
			this.setBoost(p, stat, value, team);
		}
		return;
	};
	
	this.AOEHeal = function(unit, pos, unit.team, value, range) {
		for (var a in this.units) {
			var p = this.units[a];
			if (p === unit) continue;
			if (p.team !== team) continue;
			if (dist(p.pos, pos) > range) continue;
			combat.heal(p, value);
		}
		return;
	};
	
	this.AOEDamage = function(unit, pos, unit.team, value, range) {
		//not to be confused with what we're going to use for Rising Flame etc
		for (var a in this.units) {
			var p = this.units[a];
			if (p.team === team) continue;
			if (dist(p.pos, pos) > range) continue;
			combat.damage(p, value, 1);
		}
		return;
	};
	
	
	this.afterCombat = function(attacker, defender) {
		weapon.afterCombat(attacker, defender, true);
		weapon.afterCombat(defender, attacker, false);
		passive.afterCombat(attacker, defender, true, attacker.team);
		passive.afterCombat(defender, attacker, false, attacker.team);
	};
}

function Map() {
	map = this;
	
	this.canStand(unit, pos, ignoreOthers) {
		if (this.Mobility[unit.Class][pos[1]][pos[0]] === 2) {
			return false;
		}
		if (ignoreOthers) return true;
		var u = this.UnitPositions[pos[1]][pos[0]];
		if ((u > -1) && (u !== unit.index)) { //If there is a unit at the place that isn't itself
			return false;
		}
		return true;
	};
	
	var getMobility = function(type) {
		var out = [], row = []; //for each type, 0 = passable, 1 = slow, 2 = impassible
		for (var a in map.terrainData) {
			row = [];
			for (var b in a) {
				var m = 0;
				var terrain = b[0]; //First index is terrain type
				var wallHP = b[1]; //Second index is wall health
				if ((type === "Infantry") || (type === "Armor")) {
					if ((terrain === "Water") || (terrain === "Mountain")) {
						m = 2;
					}
					if (terrain === "Forest") {
						m = 1;
					}
				}
				if (type === "Cavalry") {
					if ((terrain === "Water") || (terrain === "Mountain") || (terrain === "Forest")) {
						m = 2;
					}
				}
				if (wallHP !== 0) {
					m = 2;
				}
				row.push(m);
			}
			out.push(row);
		}
		return out;
	};
	
	this.loadMap = function(ind) {
		this.terrainData = legalMaps[ind]; 
		for (var a in Classes) {
			this.Mobility[a] = getMobility(a); //loads where each class can and can't go on the map
		}
		this.UnitPositions = emptyUnitMap;
		var c = 0, startingInfo = startingPosition[ind], pos;
		for (var a in tactician.units) {
			pos = startingInfo[c];
			tactician.units[c].pos = pos;
			this.UnitPositions[pos[1]][pos[0]] = c; //now the index of that unit is stored in the map
			c++;
		};
		this.height = this.terrainData.length;
		this.width = this.terrainData[0].length;
	};
	this.atPosition = function(pos) {
		return this.UnitPositions[pos[1]][pos[0]]; //returns index or -1
	};
}

function Movement() {
	movement = this;
	
	this.steps = [
		function(pos) {
			return ([pos[0], Math.max(pos[1]-1, 0)]); //Up
		},
		function(pos) {
			return ([Math.min(pos[0]+1, Map.width), pos[1]]); //Right
		},
		function(pos) {
			return ([pos[0], Math.min(pos[1]+1, Map.height)]); //Down
		},
		function(pos) {
			return ([Math.max(pos[0]-1, 0), pos[1]]); //Left
		}
	];
	
	this.checkAccess = function(target, type, remainingMoves, team) {
		/* Checks whether a unit can move to a provided location from where it is
		Only useful for checking adjacent locations (use pathFinder for expanded search) */
		var mapClass = map.Mobility[type],
			destTerrain = mapClass[target[1]][target[0]], //can be 0 (pass), 1 (slow), or 2 (no pass)
			atDest = map.atPosition(target), //returns -1 or a unit index (integer)
			destOccupied = (atDests === -1 ? 0 : (tactician.units[atDest].team === team ? 1 : 2)); //can be 0 (empty) 1 (ally) or 2 (enemy)
		
		if ((destOccupied === 2) && (hasPass)) { //Passive lets you treat enemy units as ally units for all intents and purposes
			destOccupied = 1;
		}
					
		if (destTerrain === 2) {
			return "NO PASS";
		}		
		else if (destOccupied === 2) { //remember to put in exceptions for units that have Pass Skill
			return "NO PASS";
		}
		else if ((destTerrain === 1) && (remainingMoves < 2)) {
			return "NO PASS";
		}
		else if ((destTerrain === 1) && (destOccupied > 0)) {
			return "NO PASS";
		}
		else if (destTerrain === 1) {
			return "SLOW";
		}
		else if ((destTerrain === 0) && (destOccupied === 1) && (remainingMoves < 2)) {
			return "NO PASS";
		}
		else if ((destTerrain === 0) && (destOccupied === 1) && (remainingMoves >== 1)) {
			return "PASS ALLY";
		}
		else {
			return "PASS";
		}
	};
	
	this.pathFinder = function(unitIndex, location, type, team, attackRange, assistRange) {
		/* Given a unit's details, can provide all the stuff it can do 
		including movement, attacking objects or enemies, and using assists*/
		var moveCount = Global.Moves[type]; //1~3 based on class; need to edit for Gravity and stuff later
		
		if (tactician.units[unitIndex]).movement.change !== 0) {
			moveCount = tactician.units[unitIndex]).movement.change
		}
		
		var goable = emptyUnitMap;
		var goableList = [], hittable = [], supportable = [], hittableFrom = {}, supportableFrom = {};
		
		var markPassable = function(pos) {
			goable[pos[1]][pos[0]] = 0;
			goableList.push(pos);
		};
		
		var moveAround = function myself(pos, postSteps) {
			var moveOptions = [] i = 0, fun;
			for (var a in this.steps) {
				fun = this.steps[i];
				moveOptions.push(fun(pos));
				i++;
			};
			for (var a in moveOptions) {
				var target = moveOptions[a];
				var hasPass = passive.hasPass(tactician.units[unitIndex]);
				var moveType = movement.checkAccess(target, type, postSteps, team, hasPass);
				if (moveType === "PASS") {
					markPassable(target);
					if (postSteps > 0) {
						myself(target, postSteps - 1); //calls itself with 1 fewer step beginning at the target destination
					}
				}
				else if (moveType === "PASS ALLY") {
					//do not mark the position as passable, but see if you can move through there
					if (postSteps > 0) {
						myself(target, postSteps - 1); //calls itself with 1 fewer step beginning at the target destination
					}
				}
				else if (moveType === "SLOW") {
					markPassable(target);
				}
			}
		};
		
		markPassable(location); //Sets the unit's currently location to be a valid place for it to end its turn
		
		moveAround(location, moveCount); //Searches for other locations to be a valid place for it to end its turn
		
		var friendlyTeleports = passive.teleports(tactician.units[unitIndex]), i = 0, teleportTo;
		
		if (friendlyTeleports.length > 0) {
			for (var t in friendlyTeleports) {
				for (var a in this.steps) {
					fun = this.steps[i];
					teleportTo = fun(friendlyTeleports[t]);
					if (map.canStand(tactician.units[unitIndex], fun(teleportTo))) {
						markPassable(fun(teleportTo));
					}
					i++;
				};
			};
		}
		
		for (var a in goableList) {
			for (var b in tactician.units) {
				var other = tactician.units[b];
				if ((dist(other.pos, a) === attackRange) && (other.team !== team)) {
					hittable.push(other.pos);
					if (Object.keys(hittableFrom).indexOf(other.pos) === -1) {
						hittableFrom[other.pos] = [];
					}
					hittableFrom[other.pos].push(a); //other.pos can be attacked from position "a"
				}
				if ((dist(other.pos, a) === assistRange) && (other.team === team)) {
					if (assist.isValidAssist(tactician.units[unitIndex], other, a)) {
						supportable.push(other.pos);
						if (Object.keys(supportableFrom).indexOf(other.pos) === -1) {
							supportableFrom[other.pos] = [];
						}
						supportableFrom[other.pos].push(a); //other.pos can be assisted from position "a"
						}
					}
				}
			}
		};
		
		/*
		CAN GO: A list of coordinates it can legally move to
		CAN HIT: A set a coordinates. CAN HIT.keys is the coordinates where the unit can hit with an attack, and it points to an array of places that can hit that tile
		CAN ASSIST: A set a coordinates. Same as above.
		*/
		movement.MovementData[unitIndex] = {
			"CAN GO": goableList,
			"CAN HIT": hittableFrom,
			"CAN ASSIST": supportableFrom
		}; //This is the full data needed to determine what a unit can do during its turn.
	};
}

function Combat() {
	combat = this;
	
	this.heal = function(target, health) {
		target.hp.remaining = Math.min(target.hp.max, target.hp.remaining+health);
	}
	
	this.damage = function(target, damage, lowest) {
		if (lowest === undefined) {
			lowest = 0;
		}
		target.hp.remaining = Math.max(lowest, target.hp.remaining-damage);
		this.checkDead(target);
	}
	
	this.calc = function(user, target, defenseStat, bonusattack, bonusdefense, okugiBoost, okugiReduce, triangleAdvantage) {
		var ATK, DEF, out;
		ATK = user.atk.base + user.atk.change + bonusattack;
		DEF = target[defenseStat].base + target[defenseStat].change + bonusdefense;
		ATK += passive.spur(user, "Spur Attack");
		switch (defenseStat) {
			case "def": 
				DEF += passive.spur(target, "Spur Defense");
				break;
			case "res":
				DEF += passive.spur(target, "Spur Resistance");
				break;
		}
		ATK *= okugiBoost * triangleAdvantage;
		DEF *= okugiReduce;
		
		out = ATK - DEF;
		
		if (user.weapon.type === "Staff") {
			out = Math.floor(out*0.5);
		}
		
		return out;
	}
	
	this.fight = function(user, target) {
		var hitsBack = false,
		var attackerDoubles = false, defenderDoubles = false, attackerSnipes = false, defenderSnipes = false, attackerBraves = false;
		var attackerbonuses = {
			"atk": 0,
			"def": 0,
			"res": 0,
			"spd": 0
		};
		var defenderbonuses = attackerbonuses;
		if (user.weapon.range === target.weapon.range) {
			hitsBack = true;
		}
		if ((target.passive_A === "Close Counter") || (target.passive_A === "Distant Counter")) {
			hitsBack = true; //should technically separate these later but for now eh
		}
		if (target.weapon.special === "Always Counterattack") {
			hitsBack = true; //should also be inside the weapon code... whatever
		}
		
		attackerbonuses = passive.blow(user, attackerbonuses);
		
		attackerbonuses = weapon.offense(user.weapon.special, attackerbonuses, user);
		defenderbonuses = weapon.defense(target.weapon.special, defenderbonuses, target);
		
		var ASPD = user.spd.base + user.spd.change + attackerbonuses.spd;
		var DSPD = target.spd.base + target.spd.change + defenderbonuses.spd;
		
		ASPD += passive.spur(user, "Spur Speed");
		DSPD += passive.spur(target, "Spur Speed");
		
		if (ASPD >= DSPD + 5) {
			attackerDoubles = true;
		}
		
		if (DSPD >= ASPD + 5) {
			defenderDoubles = true;
		}
		
		if (passive.breaker(user, target)) {
			attackerDoubles = true;
			defenderDoubles = false;
		}		
		
		if (passive.breaker(target, user)) {
			attackerDoubles = false;
			defenderDoubles = true; //no idea what happens if they break each other
		}
		
		if (passive.riposte(target)) {
			defenderDoubles = true;
		}
		
		if (passive.vantage(target)) {
			defenderSnipes = true;
		}
		
		if (weapon.zettaiHangeki(target.weapon.special, target)) {
			defenderDoubles = true;
		}
		
		if (weapon.priorityAttacker(user.weapon.special, user)) {
			attackerSnipes = true;
			attackerDoubles = true;
		}
		
		if (weapon.braveWeapon(user.weapon.special, user)) {
			attackerBraves = true;
		}
		
		if (passive.wary(target, user)) {
			attackerDoubles = false;
			defenderDoubles = false;
		}
		
		
		/*
		Priority:
		1: Defender snipes
		2: Attacker attacks
		3: Attacker snipes
		4: Defender attacks
		5: Attacker doubles
		6: Defender doubles
		
		*/
		
		var priority = [], i = 0, dmg = 0, defenseStat = "";
		
		if (defenderSnipes) {
			priority.push(target);
		}
		priority.push(user);
		if (attackerBraves) {
			priority.push(user);
		}
		if ((attackerSnipes) && (attackerDoubles)) {
			priority.push(user);
			if (attackerBraves) {
				priority.push(user);
			}
		}
		if (!(defenderSnipes)) {
			priority.push(target);
		}
		if ((attackerDoubles) && (!(attackerSnipes))) {
			priority.push(user);
			if (attackerBraves) {
				priority.push(user);
			}
		}
		if (defenderDoubles) {
			priority.push(target);
		}
		
		/*
			add = Retribution variants. Number added to total damage.
			boost = Dragon Fang variants. Direct multiplier to user's attack
			multiply = Night Sky variants. Multiplies the entire damage done by a number
			reduce = Luna variants. Reduces target's res/def
			heal = Sol variants. Heals user by multiplier of damage dealt.
			divide = Buckler variants. Multplies the entire damage done by a number less than 1.
			mustSurvive = Miracle (target survives lethal attack if HP is over 1)
		*/
		
		var clearOkugi = function() {
			this.okugiData = {
				"add": 0,
				"boost": 1,
				"multiply": 1,
				"reduce": 1,
				"heal": 0,
				"divide": 1,
				"mustSurvive": false
			}
		};
		
		var doAttack = function(A, D, Ab, Db) {
			//Finally deal some damage
			
			var defenseStat = Global.weaponHits[A.weapon.type], okugiUsed = 0;
			okugiUsed += this.tryOkugi(A, "offensive");
			okugiUsed += this.tryOkugi(D, "defensive", A.weapon.range);
			
			var triangle = this.getWeaponAdvantage(A, D);
			
			if ((target.technicalTypes.indexOf(A.weapon.effective)) !== -1) {
				if (!(passive.negateEffective(D))) {
					triangle *= 1.5; //boost for stuff like falchion on dragons
				}
			}
			
			dmg = this.calc(A, D, defenseStat, Ab.atk, Db[defenseStat], this.okugiData.boost, this.okugiData.reduce, triangle);
			
			dmg += this.okugiData.add;
			
			dmg *= this.okugiData.multiply * this.okugiData.divide;
			
			dmg += weapon.beforeDamage(A, A.weapon.special, okugiUsed);
			
			dmg = Math.floor(Math.max(dmg, 0));
			
			this.damage(target, dmg, this.okugi.mustSurvive ? 1 : 0);
			if (this.okugiData.heal > 0) {
				this.heal(target, Math.floor(dmg * this.okugiData.heal));
			}
			
			this.checkDead(target);
			return;
		}
		
		for (var a in priority) {
			clearOkugi();
			if (priority[i] === user) {
				doAttack(user, target, attackerbonuses, defenderbonuses);
				if (target.alive === false) break;
			}
			else if (hitsBack) {
				doAttack(user, target, attackerbonuses, defenderbonuses);
				if (user.alive === false) break;
			}
			i++;
		}
		
		tactician.afterCombat(user, target);
	};
	
	this.tryOkugi = function(unit, kind, range) { //handles Okugi that happen mid-combat
		if (unit.okugi.counter > 0) {
			unit.okugi.counter -= 1;
			return 0;
		}
		var resetOkugi = function(unit) {
			unit.okugi.counter = unit.okugi.turns;
			return 1;
		}
		switch (kind) {
			case "offensive":
				switch (unit.okugi.action) {
					case "Astra":
						resetOkugi(unit);
						this.okugiData.multiply = 2.5;
						break;
					case "Night Sky":
						resetOkugi(unit);
						this.okugiData.multiply = 1.5;
						break;
					case "Sol":
						resetOkugi(unit);
						this.okugiData.heal = 0.5;
						break;
					case "Luna":
						resetOkugi(unit);
						this.okugiData.divide = 0.5;
						break;
					case "Aether":
						resetOkugi(unit);
						this.okugiData.divide = 0.5;
						this.okugiData.heal = 0.5;
						break;
					case "Retribution":
					case "Reprisal":
						resetOkugi(unit);
						this.okugiData.add = Math.floor(0.3 * (unit.hp.max - unit.hp.remaining));
						break;
					case "Vengeance":
						resetOkugi(unit);
						this.okugiData.add = Math.floor(0.5 * (unit.hp.max - unit.hp.remaining));
						break;
				}
			case "defensive":
				switch (unit.okugi.action) {
					case "Pavise":
						if (range === 1) {
							resetOkugi(unit);
							this.okugiData.reduce = 0.5;
							break;
						}
					case "Miracle":
						if (user.hp.remaining > 1) {
							resetOkugi(unit);
							this.okugiData.mustSurvive = true;
							break;
						}
				}
		}
	}
	
	this.getWeaponAdvantage = function(attacker, defender) {
		var out = 0, win = ((((attacker.weapon.color === "red") && (defender.weapon.color === "green")) ||
			((attacker.weapon.color === "green") && (defender.weapon.color === "blue")) ||
			((attacker.weapon.color === "blue") && (defender.weapon.color === "red"))) ||
			((defender.weapon.color === "grey") && (weapon.beatsGrey(attacker.weapon.special))));
		var lose = ((((defender.weapon.color === "red") && (attacker.weapon.color === "green")) ||
			((defender.weapon.color === "green") && (attacker.weapon.color === "blue")) ||
			((defender.weapon.color === "blue") && (attacker.weapon.color === "red"))));
		
		if ((win) || (lose)) {
			out += 0.2;
			if (weapon.extremifyTriangle(attacker.weapon.special)) {
				out += 0.2;
			}
			if (passive.triangleAdept(attacker)) {
				out += 0.2;
			}
			if (lose) {
				out *= -1;
			}
		}
		return (out + 1);	
	}
}

function Weapon() {
	weapon = this;
	
	this.extremifyTriangle = function(special) {
		switch (special) {
			case "Emerald": 
			case "Ruby": 
			case "Sapphire": 
				return true;
				break;
		}
		return false;
	};
	
	this.beatsGrey = function(special) {
		switch (special) {
			case "Rauorraven":  
				return true;
				break;
		}
		return false;
	};
	
	this.priorityAttacker = function(special, unit) {
		//Let's the attacker hit twice before defender hits back
		switch (special) {
			case "Sol Katti": 
				if (unit.hp.remaining >= Math.floor(unit.hp.max/2)) {
					return true;
				}
				break;
			case "Brave": 
				return true;
				break;
		}
		return false;
	};
	
	this.braveWeapon = function(special, unit) {
		//Lets the attacker hit twice before defender hits back
		switch (special) {
			case "Brave": 
				return true;
				break;
		}
		return false;
	};
	
	this.zettaiHangeki = function(special, unit) {
		//Lets the defender double no matter what
		var percentage = getHPPercentage(unit);
		switch (special) {
			case "Armads": 
				if (percentage >= 0.8) {
					return true;
				}
				break;
		}
		return false;
	};
	
	this.offense = function(special, bonuses, unit) {
		//bonuses that activate when the weapon's user initiates attack
		var percentage = getHPPercentage(unit);
		
		switch (special) {
			case "Durandal": 
				bonuses.atk += 4;
				break;
			case "Tyrfing":
				if (percentage <= 0.5) {
					bonuses.def += 4;
				}
				break;
			case "Yato": 
				bonuses.spd += 4;
				break;
		}
		return bonuses;
	};
	
	this.defense = function(special, bonuses, unit) {
		//bonuses that activate when the weapon's user is attacked
		var percentage = getHPPercentage(unit);
		
		switch (special) {
			case "Naga": 
			case "Binding Blade": 
				bonuses.def += 2;
				bonuses.res += 2;
				break;
			case "Tyrfing": 
				if (percentage <= 0.5) {
					bonuses.def += 4;
				}
				break;
		}
		return bonuses;
	};
	
	this.beforeDamage = function(unit, special, okugiUsed) {
		//bonuses that activate immediately before damage is calculated
		
		switch (special) {
			case "Wo Dao":  
				if (okugiUsed) {
					return 10;
				}
				break;
			case "Rauorblade":  
				return (unit.atk.change + unit.def.change + unit.res.change + unit.spd.change);
				break;
		}
		return 0;
	};
	
	this.initiateBattle = function(special, unit) { //overrides provided stats
		//bonuses that change the weapon's user's stats at the beginning of the game
		switch (special) {
			case "Brave": 
				unit.spd.boost -= 5;
				break;
		}
		return;
	};
	
	this.initiateTurn = function(special, unit) {
		//bonuses that change the weapon's user's stats at the beginning of their team's turn
		var percentage = getHPPercentage(unit);
		
		switch (special) {
			case "Falchion": 
				if (((controller.Turn-1)/3) === Math.floor((controller.Turn-1)/3)) {
					combat.heal(unit, 10); //heals every third turn
				}
				break;
			case "FolkVagnr": 
				if (percentage <= 0.5) {
					tactician.setBoost(unit, "atk", 5, unit.team); //boosts atk by 5 if HP under 50%
				}
				break;
			case "Sieglinde": 
				tactician.AOEStatChange(unit, unit.pos, unit.team, "atk", 3, "team", 1, "Any"); //boosts atk by 3 for teammates within 1 tile
				break;
		}
		return;
	};
	
	this.afterCombat = function(unit, target, initiated) {
		//weapons whose abilities take effect after combat happens.
		var percentage = getHPPercentage(unit);
		
		if (initiated) {
			switch (unit.weapon.special) {
				case "Cymbeline": 
					tactician.AOEStatChange(unit, unit.pos, unit.team, "atk", 4, "team", 1, "Any");
					break;
				case "Gravity": 
					target.movement.change = 1;
					target.movement.end = unit.team;
					break;
				case "Dark Breath":
					tactician.AOEStatChange(unit, target.pos, unit.team, "atk", -5, "enemies", 2, "Any");
					tactician.AOEStatChange(unit, target.pos, unit.team, "spd", -5, "enemies", 2, "Any");
					break;
			}
		}
		return;
	};
	
}

function Passives() {
	passive = this;
	
	this.initiateBattle = function(skill, unit) { //overrides provided stats
		//bonuses that change the user's stats at the beginning of the game
		switch (skill) {
			case "HP+": 
				unit.hp.boost += 5;
				break;
			case "Atk+": 
				unit.atk.boost += 3;
				break;
			case "Def+": 
				unit.def.boost += 3;
				break;
			case "Res+": 
				unit.res.boost += 3;
				break;
			case "Spd+": 
				unit.spd.boost += 3;
				break;
			case "Fury 1": 
				unit.atk.boost += 1;
				unit.def.boost += 1;
				unit.res.boost += 1;
				unit.spd.boost += 1;
				break;
			case "Fury 2": 
				unit.atk.boost += 2;
				unit.def.boost += 2;
				unit.res.boost += 2;
				unit.spd.boost += 2;
				break;
			case "Fury 3": 
				unit.atk.boost += 3;
				unit.def.boost += 3;
				unit.res.boost += 3;
				unit.spd.boost += 3;
				break;
			case "Life and Death": 
				unit.atk.boost += 3;
				unit.def.boost -= 3;
				unit.res.boost -= 3;
				unit.spd.boost += 3;
				break;
		}
		return;
	};
	
	this.initiateTurn = function(unit) {
		//For passives that activate at the beginning of the player's turn
		var percentage = Math.floor((unit.hp.max - unit.hp.remaining)/unit.hp.max)
		
		switch (unit.passive_A) {
			case "Defiant Attack": 
				if (percentage <= 0.5) {
					tactician.setBoost(unit, "atk", 7, unit.team);
				}
				break;
			case "Defiant Defense": 
				if (percentage <= 0.5) {
					tactician.setBoost(unit, "def", 7, unit.team);
				}
				break;
			case "Defiant Resistance": 
				if (percentage <= 0.5) {
					tactician.setBoost(unit, "res", 7, unit.team);
				}
				break;
			case "Defiant Speed": 
				if (percentage <= 0.5) {
					tactician.setBoost(unit, "spd", 7, unit.team);
				}
				break;
		}
		
		switch (unit.passive_C) {
			case "Hone Attack":
				tactician.AOEStatChange(unit, unit.pos, unit.team, "atk", 4, "team", 1, "Any");
				break;
			case "Fortify Def":
				tactician.AOEStatChange(unit, unit.pos, unit.team, "def", 4, "team", 1), "Any";
				break;
			case "Fortify Res":
				tactician.AOEStatChange(unit, unit.pos, unit.team, "res", 4, "team", 1, "Any");
				break;
			case "Hone Speed":
				tactician.AOEStatChange(unit, unit.pos, unit.team, "spd", 4, "team", 1, "Any");
				break;
			case "Hone Armor":
				tactician.AOEStatChange(unit, unit.pos, unit.team, "atk", 6, "team", 1, "Armor");
				tactician.AOEStatChange(unit, unit.pos, unit.team, "spd", 6, "team", 1, "Armor");
				break;
			case "Hone Cavalry":
				tactician.AOEStatChange(unit, unit.pos, unit.team, "atk", 6, "team", 1, "Cavalry");
				tactician.AOEStatChange(unit, unit.pos, unit.team, "spd", 6, "team", 1, "Cavalry");
				break;
			case "Hone Fliers":
				tactician.AOEStatChange(unit, unit.pos, unit.team, "atk", 6, "team", 1, "Pegasus");
				tactician.AOEStatChange(unit, unit.pos, unit.team, "spd", 6, "team", 1, "Pegasus");
				break;
			case "Fortify Armor":
				tactician.AOEStatChange(unit, unit.pos, unit.team, "def", 6, "team", 1, "Armor");
				tactician.AOEStatChange(unit, unit.pos, unit.team, "res", 6, "team", 1, "Armor");
				break;
			case "Fortify Cavalry":
				tactician.AOEStatChange(unit, unit.pos, unit.team, "def", 6, "team", 1, "Cavalry");
				tactician.AOEStatChange(unit, unit.pos, unit.team, "res", 6, "team", 1, "Cavalry");
				break;
			case "Fortify Fliers":
				tactician.AOEStatChange(unit, unit.pos, unit.team, "def", 6, "team", 1, "Pegasus");
				tactician.AOEStatChange(unit, unit.pos, unit.team, "res", 6, "team", 1, "Pegasus");
				break;
			case "Goad Armor":
				tactician.AOEStatChange(unit, unit.pos, unit.team, "atk", 4, "team", 2, "Armor");
				tactician.AOEStatChange(unit, unit.pos, unit.team, "spd", 4, "team", 2, "Armor");
				break;
			case "Goad Cavalry":
				tactician.AOEStatChange(unit, unit.pos, unit.team, "atk", 4, "team", 2, "Cavalry");
				tactician.AOEStatChange(unit, unit.pos, unit.team, "spd", 4, "team", 2, "Cavalry");
				break;
			case "Goad Fliers":
				tactician.AOEStatChange(unit, unit.pos, unit.team, "atk", 4, "team", 2, "Pegasus");
				tactician.AOEStatChange(unit, unit.pos, unit.team, "spd", 4, "team", 2, "Pegasus");
				break;
			case "Ward Armor":
				tactician.AOEStatChange(unit, unit.pos, unit.team, "def", 4, "team", 2, "Armor");
				tactician.AOEStatChange(unit, unit.pos, unit.team, "res", 4, "team", 2, "Armor");
				break;
			case "Ward Cavalry":
				tactician.AOEStatChange(unit, unit.pos, unit.team, "def", 4, "team", 2, "Cavalry");
				tactician.AOEStatChange(unit, unit.pos, unit.team, "res", 4, "team", 2, "Cavalry");
				break;
			case "Ward Fliers":
				tactician.AOEStatChange(unit, unit.pos, unit.team, "def", 4, "team", 2, "Pegasus");
				tactician.AOEStatChange(unit, unit.pos, unit.team, "res", 4, "team", 2, "Pegasus");
				break;
			case "Threaten Atk":
				tactician.AOEStatChange(unit, unit.pos, unit.team, "atk", -5, "enemies", 2, "Any");
				break;
			case "Threaten Def":
				tactician.AOEStatChange(unit, unit.pos, unit.team, "def", -5, "enemies", 2, "Any");
				break;
			case "Threaten Res":
				tactician.AOEStatChange(unit, unit.pos, unit.team, "res", -5, "enemies", 2, "Any");
				break;
			case "Threaten Spd":
				tactician.AOEStatChange(unit, unit.pos, unit.team, "spd", -5, "enemies", 2, "Any");
				break;
		}
		return;		
	};
	
	this.afterCombat = function(unit, target, initiated, team) {
		//passives that take effect after combat happens.
		var percentage = getHPPercentage(unit);
		
		switch (unit.passive_A) {
			case "Fury 1":
				combat.damage(unit, 2, 1);
			case "Fury 2":
				combat.damage(unit, 4, 1);
			case "Fury 3":
				combat.damage(unit, 6, 1);
		}
		
		switch (unit.passive_B) {
			case "Seal Atk":
				if (!(target.alive)) return false;
				tactician.setBoost(target, "atk", -7, team);
				break;
			case "Seal Def":
				if (!(target.alive)) return false;
				tactician.setBoost(target, "def", -7, team);
				break;
			case "Seal Res":
				if (!(target.alive)) return false;
				tactician.setBoost(target, "res", -7, team);
				break;
			case "Seal Spd":
				if (!(target.alive)) return false;
				tactician.setBoost(target, "spd", -7, team);
				break;
			case "Poison Strike":
				if (!(target.alive)) return false;
				combat.damage(target, 10, 1);
				break;
			case "Drag Back":
				if (!(intiated)) return false;
				var goTo = [], oldpos = user.pos i = 0, fun;
				for (var a in movement.steps) {
					fun = movement.steps[i];
					if (user.pos === fun(target.pos)) {
						goTo = fun(user.pos);
						break; //"If you are using it from below the target, pull down etc.
					}
					i++;
				}
				if (!(map.canStand(target, goTo, false))) {
					return false;
				}
				if (target.alive) { //If the target is alive, but cannot be pulled up, give up
					if (!(map.canStand(target, user.pos, true))) {
						return false;
					}
				}
				controller.move(user, goTo);
				if (target.alive) {
					controller.move(target, oldpos);
				}
				break;
			case "Knock Back":
				if (!(intiated)) return false;
				if (!(target.alive)) return false;
				var goTo = [], i = 0, fun;
				for (var a in movement.steps) {
					fun = movement.steps[i];
					if (unit.pos === fun(target.pos)) {
						goTo = fun(target.pos);
						break; //"If you are using it from below the target, push up etc.
					}
					i++;
				}
				if (!(map.canStand(target, goTo, false))) {
					return false;
				}
				controller.move(target, goTo);
				break;
			case "Lunge":
				if (!(intiated)) return false;
				if (!(map.canStand(user, target.pos, true))) {
					return false;
				}
				if (target.alive) {
					if (!(map.canStand(target, user.pos, true))) {
						return false;
					}
				}
				var oldpos = user.pos;
				controller.move(user, target.pos);
				if (target.alive) {
					controller.move(target, oldpos, true);
				}
				break;
		}
		
		if (initiated) {
			switch (unit.passive_C) {
				case "Breath of Life":
					tactician.AOEHeal(unit, unit.pos, unit.team, 7, 1);
					break;
				case "Savage Blow":
					tactician.AOEDamage(unit, target.pos, unit.team, 7, 2);
					break;
			}
		}
		return;
	};
	
	this.friendlyTeleports = function(unit) {
		var out = [], u;
		if (unit.passive_B === "Wings of Mercy") {
			for (var a in tactician.units) {
				u = tactician.units[a];
				if (u.team !== unit.team) continue;
				if (getHPPercentage(u) <= 0.5) {
					out.push(u.pos);
				}
			}
		}
		else if (unit.passive_B === "Escape Route") {
			if (getHPPercentage(unit) <= 0.5) {
				for (var a in tactician.units) {
					if (u.team !== unit.team) continue;
					u = tactician.units[a];
					out.push(u.pos);
				}
			}
		}
		return out;
	};
	
	this.hasPass = function(unit) {
		if ((unit.passive_B === "Pass") && (getHPPercentage(unit) >= 0.25)) {
			return true;
		}
		return false;
	};
	
	this.triangleAdept = function(unit) {
		if (unit.passive_A === "Triangle Adept") {
			return true;
		}
		return false;
	};
	
	this.negateEffective = function(unit) {
		if (unit.passive_A === "Svalinn Shield") {
			return true;
		}
		return false;
	};
	
	this.wary = function(unit) {
		if (unit.hp.remaining < Math.floor(unit.hp.max*0.7)) {
			return false;
		}
		if (unit.passive_B === "Wary Fighter") {
			return true;
		}
		return false;
	}
	
	this.vantage = function(unit) {
		if (unit.hp.remaining > Math.floor(unit.hp.max*0.75)) {
			return false;
		}
		if (unit.passive_B === "Vantage") {
			return true;
		}
		return false;
	}
	
	this.riposte = function(unit) {
		if (unit.hp.remaining < Math.floor(unit.hp.max*0.7)) {
			return false;
		}
		if (unit.passive_B === "Quick Riposte") {
			return true;
		}
		return false;
	}
	
	this.breaker = function(unit, enemy) {
		if (unit.hp.remaining < Math.floor(unit.hp.max/2)) {
			return false;
		}
		if ((unit.passive_B === "Bowbreaker") && (enemy.weapon.type === "Bow")) {
			return true;
		}
		else if ((unit.passive_B === "Swordbreaker") && (enemy.weapon.type === "Sword")) {
			return true;
		}
		else if ((unit.passive_B === "Axebreaker") && (enemy.weapon.type === "Axe")) {
			return true;
		}
		else if ((unit.passive_B === "Lancebreaker") && (enemy.weapon.type === "Spear")) {
			return true;
		}
		else if ((unit.passive_B === "Daggerbreaker") && (enemy.weapon.type === "Dagger")) {
			return true;
		}
		else if ((unit.passive_B === "B Tomebreaker") && (enemy.weapon.type === "Tome") && (enemy.weapon.color === "blue")) {
			return true;
		}
		else if ((unit.passive_B === "G Tomebreaker") && (enemy.weapon.type === "Tome") && (enemy.weapon.color === "green")) {
			return true;
		}
		else if ((unit.passive_B === "R Tomebreaker") && (enemy.weapon.type === "Tome") && (enemy.weapon.color === "red")) {
			return true;
		}
	};
	
	this.spur = function(unit, spurStat) {
		for (var a in tactician.units) {
			var helper = tactician.units[a];
			if (helper.team !== unit.team) continue;
			if (helper.passive_C === spurStat) {
				if (dist(helper, unit) === 1) {
					return Global.spur_bonus;
				}
			}
		}
	};
	
	this.blow = function(unit, bonuses) {
		if (unit.passive_A === "Death Blow") {
			bonuses.atk += Global.blow_bonus;
		}
		if (unit.passive_A === "Armored Blow") {
			bonuses.def += Global.blow_bonus;
		}
		if (unit.passive_A === "Darting Blow") {
			bonuses.spd += Global.blow_bonus;
		}
		if (unit.passive_A === "Warding Blow") {
			bonuses.res += Global.blow_bonus;
		}
		return bonuses;
	};

}

function Assists() {
	assist = this;
	
	this.useAssist = function(user, target, useFrom) {
		var act = user.assist, val = 0;
		
		switch (act) {
			case "Dance":
			case "Sing":
				target.active = true;
			case "Ardent Sacrifice":
				combat.heal(target, 10);
				combat.damage(user, 10, 1);
			case "Heal":
				combat.heal(target, 5);
			case "Martyr":
				val = (7 + user.hp.max - user.hp.remaining);
				combat.heal(target, val);
				val = Math.floor((user.hp.max - user.hp.remaining)/2);
				combat.heal(user, val);
			case "Mend":
				combat.heal(target, 10);
			case "Physic":
				combat.heal(target, 8);
			case "Reconcile":
				val = user.hp.remaining;
				user.hp.remaining = Math.floor(user.hp.max, target.hp.remaining);
				target.hp.remaining = Math.floor(target.hp.max, val);
			case "Recover":
				combat.heal(target, 15);
			case "Rehabilitate":
				combat.heal(target, 7);
				combat.heal(user, 7);
			case "Swap":
				var wasAt = user.pos;
				controller.move(user, target.pos);
				controller.move(target, wasAt, true); //the true means "don't erase the data for what unit was on the tile I was just on because now the other unit is there"
				break;
			case "Draw Back":
				var goTo = [], i = 0, fun, wasAt;
				for (var a in movement.steps) {
					fun = movement.steps[i];
					if (useFrom === fun(target.pos)) {
						goTo = fun(useFrom);
						break; //"If you are using it from below the target, move down. If you are using it from the right, move right" etc.
					}
					i++;
				}
				controller.move(user, goTo);
				controller.move(target, wasAt);
				break;
			case "Reposition": 
				var goTo = [], i = 0, fun;
				for (var a in movement.steps) {
					fun = movement.steps[i];
					if (useFrom === fun(target.pos)) {
						goTo = fun(useFrom);
						break; //"If you are using it from above the target, move the target to one above the user" etc.
					}
					i++;
				}
				controller.move(target, goTo);
				break;
			case "Pivot": 
				var goTo = [], i = 0, fun;
				for (var a in movement.steps) {
					fun = movement.steps[i];
					if (target.pos === fun(useFrom)) {
						goTo = fun(fun(useFrom));
						break; //"If you are using it from above the target, move down twice. If you are using it from the right, move left twice" etc.
					}
					i++;
				}
				controller.move(user, goTo);
				break;
			case "Shove":
				var goTo = [], i = 0, fun;
				for (var a in movement.steps) {
					fun = movement.steps[i];
					if (target.pos === fun(useFrom)) {
						goTo = fun(target.pos);
						break; //"If you are using it from above the target, push target down. If you are using it from the right, push target left" etc.
					}
					i++;
				}
				controller.move(target, goTo);
				break;
			case "Smite":  //note: this is incomplete; smite should allow you to push units over some things they cannot normally walk on, like infantry over water (but not through walls)
				var goTo = [], goTo2 = [], i = 0, fun;
				for (var a in movement.steps) {
					fun = movement.steps[i];
					if (target.pos === fun(useFrom)) {
						goTo = fun(target.pos);
						break; //"If you are using it from above the target, push target down. If you are using it from the right, push target left" etc.
					}
					i++;
				}
				goTo2 = fun(goTo);
				if (canStand(target,goTo2)) {
					return goTo = goTo2; //"If you can keep going in the same direction then move twice"
				}
				break;
			case "Rally Attack":
				tactician.setBoost(target, "atk", 4, unit.team);
				break;
			case "Rally Defense":
				tactician.setBoost(target, "def", 4, unit.team);
				break;
			case "Rally Resistance":
				tactician.setBoost(target, "res", 4, unit.team);
				break;
			case "Rally Speed":
				tactician.setBoost(target, "spd", 4, unit.team);
				break;
			case "Harsh Command":
				tactician.flipBoosts(target, 1);
				break;
				
		}
	};
	
	this.isValidAssist = function(user, target, useFrom) {
		/*
		Makes sure assists don't do anything illegal like Sing to someone who is already active 
		
		user = who is using the action
		target = who is the assist is used on
		useFrom = the position from which the Assist would be hypothetically used
		*/
		
		var act = user.assist;
		switch (act) {
			case "Dance":
			case "Sing":
				if (target.active) {
					return false; //Can't sing to someone already active
				}
				if ((target.assist === "Sing") || (target.assist === "Dance")) {
					return false; //Can't sing/dance to someone else who can do that
				}
				break;
			case "Ardent Sacrifice":
			case "Heal":
			case "Martyr":
			case "Mend":
			case "Physic":
			case "Reconcile":
			case "Recover":
			case "Rehabilitate":
				if (target.HP === target.maxHP) {
					return false; //Can't heal a target if they are already at max HP (even if the skill heals the user too)
				}
				break;
			case "Swap": 
				if (!(map.canStand(target, user.pos, true))) { 
					return false; 
				}
				if (!(map.canStand(user, target.pos, true))) { 
					return false; 
				}
				break;
			case "Draw Back":
				if (!(map.canStand(target, user.pos, true))) { 
					return false; //"If the class of the target is not allowed to stand at the coordinates the Assist is being used from..."
				}
				var goTo = [], i = 0, fun;
				for (var a in movement.steps) {
					fun = movement.steps[i];
					if (useFrom === fun(target.pos)) {
						goTo = fun(useFrom);
						break; //"If you are using it from below the target, move down. If you are using it from the right, move right" etc.
					}
					i++;
				}
				if (!(map.canStand(user, goTo, false))) {
					return false; //"If the class of the user cannot go where Drawback would make it go give up"
				}
				break;
			case "Reposition": 
				var goTo = [], i = 0, fun;
				for (var a in movement.steps) {
					fun = movement.steps[i];
					if (useFrom === fun(target.pos)) {
						goTo = fun(useFrom);
						break; //"If you are using it from above the target, move the target to one above the user" etc.
					}
					i++;
				}
				if (!(map.canStand(target, goTo, false))) {
					return false; //"If the class of the user cannot go where Pivot would make it go give up"
				}
				break;
			case "Pivot": 
				var goTo = [], i = 0, fun;
				for (var a in movement.steps) {
					fun = movement.steps[i];
					if (target.pos === fun(useFrom)) {
						goTo = fun(fun(useFrom));
						break; //"If you are using it from above the target, move down twice. If you are using it from the right, move left twice" etc.
					}
					i++;
				}
				if (!(map.canStand(user, goTo, false))) {
					return false; //"If the class of the user cannot go where Pivot would make it go give up"
				}
				break;
			case "Shove": 
			case "Smite": //These can be the same because Smite works even if the target is only able to move one tile from it
				var goTo = [], i = 0, fun;
				for (var a in movement.steps) {
					fun = movement.steps[i];
					if (target.pos === fun(useFrom)) {
						goTo = fun(target.pos);
						break; //"If you are using it from above the target, push target down. If you are using it from the right, push target left" etc.
					}
					i++;
				}
				if (!(map.canStand(target, goTo, false))) {
					return false; //"If the class of the user cannot go where Shove/Smite would make it go give up"
				}
				break;
			case "Rally Attack": 
				if (target.atk.change >= 4) {
					return false; //can't buff a stat that is already 4 or above
				}
				break;
			case "Rally Defense": 
				if (target.def.change >= 4) {
					return false; //can't buff a stat that is already 4 or above
				}
				break;
			case "Rally Resistance": 
				if (target.res.change >= 4) {
					return false; //can't buff a stat that is already 4 or above
				}
				break;
			case "Rally Speed": 
				if (target.spd.change >= 4) {
					return false; //can't buff a stat that is already 4 or above
				}
				break;
			case "Harsh Command": 
				if ((target.atk.change >= 0) && (target.def.change >= 0) && (target.res.change >= 0) && (target.spd.change >= 0)) {
					return false; //can't invert stats if none are negative
				}
				break;
			}
			//Reminder to check how Reciprocal Aid works if both units have full health.
			
			return true;
		}
		
		
	};
	
}

function Action() {
	actor = this;
	
	/*
	this.loadPaths = function(team) {
		for (var a in tactician.units) {
			if ((tactician.units[a].team === team) && (tactician.units[a].active)) {
				movement.pathFinder(a, tactician.units[a].pos, tactician.units[a].Class, team, tactician.units[a].attackRange, tactician.units[a].assistRange);
			}
		}
	} */
		/*
	
	this.startTurn = function(team) {
		for (var a in tactician.units) {
			var p = tactician.units[a];
			if ((p.team === team) && (p.alive)) {
				p.active = true;
			}
			else {
				p.active = false;
			}
		}
		loadPaths(team);
	};
	this.commitAction = function(unitIndex, team, whereTo, target) {
		var minfo = movement.MovementData[unitIndex]
		if (minfo["CAN GO"].indexOf(whereTo) === -1) {
			//This is an invalid move
		}
		else if ((minfo["CAN HIT"].indexOf(target) === -1) && (minfo["CAN ASSIST"].indexOf(target) === -1)) {
			//This is an invalid move
		}
		else {
			map.move(unitIndex, whereTo);
			if (tactician.units[map.atPosition(target)].team === team) {
				this.useAssist(unitIndex, map.atPosition(target));
			}
			else {
				this.useAttack(unitIndex, map.atPosition(target));
			}
		}
		loadPaths(team);
		*/
	};
	
}




