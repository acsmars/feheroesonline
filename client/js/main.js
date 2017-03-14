// Helper Functions
function zfill(str, max) {
	// Pads a string with leading zeros so that it is max long
	str = str.toString();
	return str.length < max ? zfill("0" + str, max) : str;
}

$( document ).ready(function() {
	displayCreateGrid(6,8);
	displayDrawMap();

	// Event Listeners
	$('.tile').click(function() {
		displayTileClick($(this));
	});
});