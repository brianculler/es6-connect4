import $ from 'jquery';
import _ from 'lodash';
import {Player} from './player.js';
import {Computer} from './computer.js';
import {wins} from './wins.js';

function Board(){
// Object property and method declarations/maps
	this.turnCount = 0;
	this.turn = 'computer';
	this.checkForWin = checkForWin;
	this.dropChip = dropChip;
	let player = new Player();
	let computer = new Computer();
	//Constructs data arrays to generate board.
	this.rows = [];
	for(let y=0; y<6; y++){
		let row = [];
		for (let x=0; x<7; x++) {
			let column = [];
			row.push(column);
		}
		this.rows.push(row);
	}
	//Creates a space number for each consecutive space on the board via spaceCounter++ below. Allows for checking for wins.
	let spaceCounter = 0;
	//Generates a board that corresponds to the structure of the this.rows, row, and column arrays.
	this.rows.forEach(function(row, index){
		let rowIndex = index;
		let boardRowIndex = '.board-row-'+rowIndex;
		$('#board').append(`<div class='board-row-${index} board-row'></div>`);
		row.forEach(function(column, index){
			$(boardRowIndex).append(`<span data-column=${index} data-row=${rowIndex} data-space=${spaceCounter} data-filled="false" class="board-column space"></span>`);
			spaceCounter++;
		});
	});
	// Finds which spaces on the board have been filled, and returns an array containing all black spaces and red spaces.
	let spaceChecker = ()=>{
		let spacesObject = $('.space');
		let spacesArray = $.makeArray(spacesObject);
		let redSpaces = [];
		let blackSpaces = [];
		spacesArray.forEach(function(space){
			if ($(space).attr('data-filled')==='red'){
				redSpaces.push(Number($(space).attr('data-space')));
			} else if($(space).attr('data-filled')==='black'){
				blackSpaces.push(Number($(space).attr('data-space')));
			}
		});	
		let resultArray = [blackSpaces, redSpaces];
		return resultArray;
	};

//Thanks to http://stackoverflow.com/questions/9204283/how-to-check-whether-multiple-values-exist-within-an-javascript-array
//for this useful function, slightly modified via fat arrow notation.
	let containsAll = (needles, haystack)=>{ 
		for(let i = 0 , len = needles.length; i < len; i++){
			if($.inArray(needles[i], haystack) == -1) return false;
		}
		return true;
	};

	let checkForWin = ()=>{
		let resultArray = spaceChecker();
		let blackSpaces = resultArray[0];
		let redSpaces = resultArray[1];
		// Runs through all wins, and returns an array of false and true values based upon whether a win matches black chip locations
		let computerResults = _.map(wins, function(win) {
			return containsAll(win, blackSpaces);
		});
		// Runs through all wins, and returns an array of false and true values based upon whether a win matches red chip locations
		let playerResults = _.map(wins, function(win) {
			return containsAll(win, redSpaces);
		});
		//Checks to see if true appears in the array, and indicates if the computer has won
		if (_.includes(computerResults, true)){
			$('.space').off('click');
			alert('You Lose!');
		}
		//Checks to see if true appears in the array, and indicates if the player has won
		if (_.includes(playerResults, true)){
			$('.space').off('click');
			alert('You Win!');
		}
		//Stops game in a draw if all spaces have been filled.
		if (this.turnCount === 41){
			$('.space').off('click');
			alert('Draw!');
		}
	};

	let computerTurn = ()=>{
		if (this.turn === 'computer') {
			//Checks to see which spaces have been played
			let spaceResults = spaceChecker();
			//Places all black spaces in an array
			let blackSpaces = spaceResults[0];
			//Places all red spaces in an array
			let redSpaces = spaceResults[1];
			let threats = [];

			let getThreats = () => {
				wins.forEach(function(win){
					//Creates an array into which played spots that match a win array spot may be pushed
					let filterArray = [];
					//Cycles through each winning spot (kitten) in a win, and pushes any corresponding played
					//spot into the filterArray
					win.forEach(function(winElement){
						let kitten = winElement;
						let filteredSpots = redSpaces.filter(function(spaceElement){
							return spaceElement === kitten;
						});
						filterArray.push(filteredSpots);	
					});
					//Flattens the filterArray so that it is an array of integers, not an array of arrays of integers
					let flattenedArray = _.flatten(filterArray);
					//Pushes the array containing matching spot values into the threats array
					threats.push(flattenedArray);
				});				
			}

			let filterThreats = () => {
			//Filters the current threats and discards any threat with less than three matches
				let filteredThreats = threats.filter(function(threatArray){
					return threatArray.length == 3;
				});
				threats = filteredThreats;
			}

			let evaluateAndMakeMove = () => {
				//If any threats are on the board that have three matches with a win array, the computer
				//evaluates the threats, determines the highest threat, and tries to block the player's next move
				if (threats.length > 0) {
					console.log('threats.length greater than 0');
					//Cycles through all possibleWins and finds the outstanding, unfilled spaces needed to win
					let possibleWins = [];
					let dangerousSpaces = [];
					threats.forEach(function(highThreatArray){
						let hTArray = highThreatArray;
						let winsToWatch = wins.filter(function(win){
							let wholeKitten = win;
							let result = _.difference(wholeKitten, hTArray);
							if ((result.length === 1) && !(blackSpaces.includes(result[0]))){
								dangerousSpaces.push(result);	
							}
							return result.length === 1;
						});
						possibleWins.push(winsToWatch);
					});
					possibleWins = _.flatten(possibleWins);
					dangerousSpaces = _.flatten(dangerousSpaces);
					dangerousSpaces = _.uniq(dangerousSpaces);
					//If no dangerousSpace exists, computer picks random space
					if (dangerousSpaces.length < 1){
						window.setTimeout(pickRandomSpace, 1000);
					} else {
						//Runs through the dangerousSpaces to see if the space below each one is filled. 
						//If the space below a dangerousSpace is filled, the computer uses its turn to take
						//that dangerousSpace before the player can.
						let gamePoints = [];
						dangerousSpaces.forEach(function(dangerousSpace){
							let spaceVal = dangerousSpace;
							let tomCat = $(`.space[data-space=${spaceVal}]`);
							let spaceAttrVal = tomCat.attr('data-space');
							//It checks to see what row the space is on and if the row below it is filled
							//Remember that rows start at 5 at the bottom of board and top row is 0
							if (Number(spaceAttrVal) < 35){
								let spaceBelowVal = String(Number(spaceAttrVal) + 7);
								let spaceBelowFilled = $(`.space[data-space=${spaceBelowVal}]`).attr('data-filled');
							//If the space below the dangerous space is filled, the computer notes that space
							//as a gamePoint.
								if (spaceBelowFilled !== 'false'){
									gamePoints.push(spaceAttrVal);
								} 
							} else {
								gamePoints.push(spaceAttrVal);
							}
						});
						//If any player gamePoints are open, the computer blocks. Otherwise, it picks a random space.
						if (gamePoints.length > 0){
							let clicker = () =>{
								let tomCat = $(`.space[data-space=${gamePoints[0]}]`);
								tomCat.trigger('click');
							}
							window.setTimeout(clicker, 1000);
						} else {
							window.setTimeout(pickRandomSpace, 1000);
						}
					}
				} else {
					//If no threat is detected, the computer picks a random space.
					window.setTimeout(pickRandomSpace, 1000);
				}
			}
			//Blocks player move if player has three-in-a-row
			getThreats();
			filterThreats();
			evaluateAndMakeMove();	
		}
	};

	let pickRandomSpace = ()=>{
		let q = Math.floor(Math.random() * 7);
		let pickSpacesObject;
		pickSpacesObject = $(`.space[data-column=${q}]`);			
		let pickSpacesArray = $.makeArray(pickSpacesObject);
		let topSpace = pickSpacesArray[0];
		let filled = $(topSpace).attr('data-filled');
		if (filled ==='false'){				
			$(topSpace).trigger('click');	
		} else {
			pickRandomSpace();
		}
	};

	let dropChip = (e)=>{
		e.preventDefault();
		let chipColor;
		let turnChange;
		if (this.turn === 'computer'){
			chipColor = computer.chip;
			turnChange = 'player';
		} else if (this.turn === 'player') {
			chipColor = player.chip;
			turnChange = 'computer';
		}
		let target = e.target;
		let column = $(target).attr('data-column');
		//Grabs all dom elements with the same column as the event target and puts them in an array.
		let columnArray = [];
		let jQObject = $(`.space[data-column=${column}]`);
		//Transforms jQuery Object into a JS Array.
		columnArray = $.makeArray(jQObject);
		//Reverses array so that a forEach can be run to check and see if spaces are filled from the bottom of
		//the board up.
		columnArray = columnArray.reverse();
		//Drops chip into selected board column.
		for (let x=0; x<6; x++){
			let filledStatus = $(columnArray[x]).attr('data-filled');
			filledStatus = (filledStatus !== 'false');
			if (!filledStatus) {
				$(columnArray[x]).attr('data-filled', chipColor);
				$(columnArray[x]).css('background', chipColor);
				//Stops for loop once chip has been dropped.
				checkForWin();
				this.turn = turnChange;
				this.turnCount++;
				computerTurn();
				return;
			}
		}
	};

	function hoverShade (e) {
		e.preventDefault();
		let target = e.target;
		if ($(target).attr('data-filled') === 'false'){
			$(target).css('background', 'lightgrey');
		}
	}

	function removeShade(e){
		e.preventDefault();
		let target = e.target;
		if ($(target).attr('data-filled') === 'false'){
			$(target).css('background', 'white');
		}		
	}

	// Adds a click event listener to each column on the board.
	for(let x=0; x<7; x++){
		$(`.space[data-column=${x}]`).on({click: dropChip, mouseenter: hoverShade, mouseleave: removeShade});
	}

	computerTurn();
}
export {Board};