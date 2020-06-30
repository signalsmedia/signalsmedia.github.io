


///// CONSTANTS /////
const SIGNALS = {'0':'NEUTRAL','1':'A','2':'B','3':'C','4':'D','40':'E','48':'F','56':'G','10':'H','11':'I','52':'J','33':'K','41':'L','49':'M','57':'N','26':'O','34':'P','42':'Q','50':'R','58':'S','35':'T','43':'U','60':'V','53':'W','61':'X','51':'Y','55':'Z','15':'SPACE','44':'NUMBERS','59':'CANCEL'}
const NUMBERS = {'1':'1','2':'2','3':'3','4':'4','40':'5','48':'6','56':'7','10':'8','11':'9','52':'LETTERS','33':'0','15':'SPACE','59':'CANCEL'}

const SIGNALS_ORDERED = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','SPACE','NUMBERS','CANCEL']

const SIGNALS_ICONS = {'1':'A','2':'B','3':'C','4':'D','40':'E','48':'F','56':'G','10':'H','11':'I','52':'J','33':'K','41':'L','49':'M','57':'N','26':'O','34':'P','42':'Q','50':'R','58':'S','35':'T','43':'U','60':'V','53':'W','61':'X','51':'Y','55':'Z','15':'_','44':'#','59':'⌫ '}
const NUMBERS_ICONS = {'1':'1','2':'2','3':'3','4':'4','40':'5','48':'6','56':'7','10':'8','11':'9','52':'🔤','33':'0','15':'_','59':'⌫ '}

const ALL_STATES = [DebugState, LoadingState, IntroMenuState, MainMenuState, GameAMenuState, GameState]

Object.freeze(SIGNALS);
Object.freeze(NUMBERS);
Object.freeze(SIGNALS_ORDERED);
Object.freeze(SIGNALS_ICONS);
Object.freeze(NUMBERS_ICONS);
Object.freeze(ALL_STATES);

const TIME_THRESHOLD = 1200; // Milliseconds
const DELTA_MAX = 160
const LOCAL_DEBUG = false;
const DEBUG_TEXT = "Q - Flip Camera & Guides\nW - Toggle Word Mode\nE - Toggle Flag Type\nR - Toggle Asyncronous Mode\nT - Return to Main Menu"

var RED;
var GREEN;
var BLUE;
var YELLOW;
var MAGENTA;
var CYAN;
var BLACK;
var WHITE;

var LGRAY;
var LRED;
var LBLUE;

var DGRAY;

var Canvas;

var streamRefreshMillis;

var debugFrame = 0;

var mainRegion=
{
	size: undefined,
	origin: undefined,
	innerSize: undefined,
	innerOrigin: undefined,
	
	center: undefined,
	
	idealSize: 720,
	scale: undefined,
}

var margin;

// TODO: MAKE GAME-DEPENDENT ONLY
var lowerRegion=
{
	size: undefined,
	origin: undefined,
}
var overflowRegion=
{
	size: undefined,
	origin: undefined,
}

// var leftRegion=
// {
	// size: undefined,
	// origin: undefined,
// }
// var rightRegion=
// {
	// size: undefined,
	// origin: undefined,
// }



var cutoffAspect = 
{
	max: 2.3,
	min: 0,
}

// var mainRegion.size;
// var mainRegion.origin;

// var mainRegion.innerSize;
// var mainRegion.innerOrigin;

// var mainRegion.center;

var inModelPipeline = false;
var flip = true;

var drawStage = 'pre';

var state = LoadingState;

var paused;
var tabPaused;

// p5.disableFriendlyErrors = !LOCAL_DEBUG
p5.disableFriendlyErrors = true;


var introDone = false;
var preloadDone = false;

var ready = false;

function animationEnd(event)
{
	if(preloadDone) fadeLoader();
	introDone = true;
}

function fadeLoader()
{
	// loadingDiv.onwebkitanimationend = endLoader;
	// loadingDiv.onanimationend = endLoader;
	// loadingDiv.onmozanimationend = endLoader;
	// loadingDiv.onmsanimationend = endLoader;
	
	loadingDiv.style.display = 'none';
	ready = true;
	// loadingDiv.style.animation = "fade 1s ease-in-out reverse";
	// loadingDiv.style.webkitAnimation = "fade 1s ease-in-out reverse";
	// loadingDiv.style.mozAnimation = "fade 1s ease-in-out reverse";
	// loadingDiv.style.msAnimation = "fade 1s ease-in-out reverse";
	
	// Canvas.elt.style.animation = "fade 1s ease-in-out";
	// Canvas.elt.style.webkitAnimation = "fade 1s ease-in-out";
	// Canvas.elt.style.mozAnimation = "fade 1s ease-in-out";
	// Canvas.elt.style.msAnimation = "fade 1s ease-in-out";
	
	// Canvas.style("animation", "fade 1s ease-in-out");
	// Canvas.style("webkitAnimation", "fade 1s ease-in-out");
	// Canvas.style("mozAnimation", "fade 1s ease-in-out");
	// Canvas.style("msAnimation", "fade 1s ease-in-out");
	
	//ready = 0;
	
	
}

// function endLoader()
// {
	// loadingDiv.style.display = 'none';
	// ready = 1;
// }

var loadingDiv = document.getElementById('loading_circ');
loadingDiv.onwebkitanimationend = animationEnd;
loadingDiv.onanimationend = animationEnd;
loadingDiv.onmozanimationend = animationEnd;
loadingDiv.onmsanimationend = animationEnd;

///// P5 FUNCTIONS /////
function preload()
{
	//introEnd = millis()+1000;
	WebcamView.preload();
	Game.preload();
	GuideCards.preload();
}

var linkSpan;

function setup() 
{
	document.oncontextmenu = function() { return false; }
	
	if(introDone) fadeLoader();
	preloadDone = true;
	
	Canvas = createCanvas(windowWidth,windowHeight, P2D);

	
	linkSpan = createSpan('Developed for <a href="https://www.signals.org.uk/">Signals</a> by Ben Tilbury');
	linkSpan.id("reflink")
	linkSpan.hide();

	// if(!LOCAL_DEBUG) noCursor();
	
	textFont("Dosis", 64);
	textStyle(BOLD)
	strokeJoin(ROUND);
	
	RED = color(255,0,0);
	GREEN = color(0,255,0);
	BLUE = color(0,0,255);
	YELLOW = color(255,255,0);
	MAGENTA = color(255,0,255);
	CYAN = color(0,255,255);
	BLACK = color(0,0,0);
	WHITE = color(255,255,255);
	LGRAY = color(160,160,160);
	DGRAY = color(100,100,100);
	
	LRED = color(255,60,60);
	LBLUE = color(60,60,255);
	
	windowResized();
	
	WebcamView.init();
	Model.init();
	Flag.init();
	UI.init();
		
	if(state.onEnter) state.onEnter();
}

// var freq = 600;
// var numPoints = 200;
// var theta = 0.0;
// var speed = 0.005;
// var amp = 0.4;
// var T = 0.004
// var D = 0.01

var mouseWait = 0;
var mouseVisible = true;

function draw() 
{
	let m = millis();
	
	if(!ready) return;
	
	//// UPDATE ////
	deltaTime = min(deltaTime,DELTA_MAX);
	if(!state.ignoreModel) Model.update();
	if(state.update) state.update();
	
	//// DRAW ////
	clear();
	// Background //
	drawStage = 'pre';
	if(state.preDraw) state.preDraw();
	// Flippabled //
	drawStage = 'flip';
	push();
	if(flip)
	{
	  translate(width/2,0);
	  scale(-1,1);
	  translate(-width/2,0);
	}
	if(!state.ignoreWebcam) WebcamView.draw();
	if(state.flipDraw) state.flipDraw();
	if(!state.ignoreFlags) Flag.draw();
	pop();
	// Foreground //
	drawStage = 'post';
	if(state.postDraw) state.postDraw();
	
	//drawStage = 'flag';
	//if(!state.ignoreFlags) Flag.draw();

	drawStage = 'overlay';
	if(paused) UI.showPause();
	else if(UI.hasMessage()) UI.showMessage();
	
	//Model.debug();
	
	if ((mouseX != pmouseX) || (mouseY != pmouseY)) 
	{
		if (!mouseVisible) 
		{
			//cursor();
			document.body.style.cursor = 'auto';
			Canvas.style("cursor","auto")
			mouseVisible = true;
		}
		
		if (mouseWait < m + 2000) mouseWait = m + 2000; 
	} 
	else 
	{
		if (mouseVisible && m > mouseWait) 
		{
			//noCursor(); 
			document.body.style.cursor = 'none';
			Canvas.style("cursor","none")
			mouseVisible = false;
		}
	}
	
	// if(ready>=0 && ready < 1)
	// {
		// ready += deltaTime*0.001
		
		// Canvas.canvas.style.opacity = Math.min(1,ready);
		// Canvas.canvas.style.webkitOpacity = Math.min(1,ready);
	// }
	// // // theta += speed;
	// let step = windowWidth/numPoints
	// let dx = (TWO_PI/freq) * step;
	// let s = lowerRegion.size.y*amp;
	// fill(BLUE);
	// noStroke();
	// let x = theta;
	// beginShape();
	// vertex(0,windowHeight)
	// for(let i = 0; i<numPoints; i++)
	// {
		// curveVertex(i*step+mouseX,lowerRegion.origin.y+Math.sin(x)*s+mouseY);
		// x+=dx;
	// }
	// // //to avoid Runge phenememon
	// vertex(windowWidth,lowerRegion.origin.y+Math.sin(x)*s)
	// vertex(windowWidth+20,lowerRegion.origin.y+Math.sin(x)*s)
	// vertex(windowWidth,windowHeight)
	// endShape(CLOSE)
	
	
	// let step = windowWidth / Q;
	// let s = lowerRegion.size.y;
	// fill(BLUE);
	// noStroke();
	// beginShape();
	// vertex(windowWidth,lowerRegion.origin.y+noise(millis()*T)*s)
	// vertex(windowWidth,windowHeight)
	// vertex(0,windowHeight)
	// vertex(0,lowerRegion.origin.y+noise(Q*D+millis()*T)*s);
	// for(let i = 0; i<Q-1; i++)
	// {
		// curveVertex(i*step,lowerRegion.origin.y+noise(i*D+millis()*T)*s);
	// }
	// // //+noise(i,millis()*0.0005)
	// endShape(CLOSE)
	
	// fill(CYAN);
	// noStroke();
	// beginShape();
	// vertex(windowWidth,lowerRegion.origin.y+noise(millis()*T+0.5)*s+s/3);
	// vertex(windowWidth,windowHeight)
	// vertex(0,windowHeight)
	// vertex(0,lowerRegion.origin.y+noise(Q*D+millis()*T+0.5)*s+s/3);
	// for(let i = 0; i<Q-1; i++)
	// {
		// curveVertex(i*step,lowerRegion.origin.y+noise(i*D+millis()*T+0.5)*s+s/3);
	// }
	// endShape(CLOSE)
	
	// strokeWeight(16);
	// stroke(RED);
	// line(lowerRegion.origin.x,lowerRegion.origin.y,windowWidth,lowerRegion.origin.y);
	// stroke(BLUE)
	// line(overflowRegion.origin.x,overflowRegion.origin.y,windowWidth,overflowRegion.origin.y)
}
// var T = 0.0004;
// var D = 0.4
// var Q = 100;

var DEBUG_DRAW_REGIONS = false;

function keyPressed()
{
	/// DEBUG ///
	if(key=='1' && state!=DebugState) 
	{
		nextState(DebugState, state);
		return;
	}
	else if(key=='2') DEBUG_DRAW_REGIONS = !DEBUG_DRAW_REGIONS;
	/////////////
	if(state.onKeyPressed) state.onKeyPressed();
}

function togglePause()
{
	paused = !paused;
	if(paused) onPause();
	else onResume();
}

function onPause()
{
	if(state.onPause) state.onPause();
}

function onResume()
{
	if(state.onResume) state.onResume();
}

function nextState(newState, params)
{
	if(state.onExit) state.onExit();
	state = newState;
	
	// Model.resetTimes();
	
	// Initialize if first time entering.
	if(!state.initialized && state.init) state.init();
	
	// Update dimensions if required, needs to be done after first time initialize but before onEnter
	if(state.updateDimensionsPending && state.updateDimensions) state.updateDimensions();
	
	if(state.onEnter) state.onEnter(params);
	
	state.updateDimensionsPending = false;
	state.initialized = true;
	
	Flag.rightFlag.confirmValue = 0;
	Flag.leftFlag.confirmValue = 0;
}

function windowResized()
{
	resizeCanvas(windowWidth,windowHeight)
	
	if(state.overrideRegion) state.overrideMainRegion();
	else
	{
		mainRegion.size = createVector(min(windowWidth/2,(windowHeight/2.6)*cutoffAspect.max),min(windowWidth/2,(windowHeight/2.6)*cutoffAspect.max));
		//mainRegion.origin = createVector(windowWidth/2 - mainRegion.size.x/2, 0);
		
		
		mainRegion.origin = createVector(windowWidth/2 - mainRegion.size.x/2, (windowHeight-mainRegion.size.y)/3);
		
		mainRegion.innerSize = createVector(2*mainRegion.size.x/3,2*mainRegion.size.y/3);
		mainRegion.innerOrigin = createVector(mainRegion.origin.x+mainRegion.innerSize.x/4,mainRegion.origin.y+mainRegion.innerSize.y/4);
		mainRegion.center = createVector(mainRegion.origin.x+mainRegion.size.x/2,mainRegion.origin.y+mainRegion.size.y/2);
		mainRegion.scale = mainRegion.size.x / mainRegion.idealSize
		
		lowerRegion.origin = createVector(0,windowHeight);
		lowerRegion.size = createVector(windowWidth,0);
	}
	
	margin = 32*mainRegion.scale;//createVector(windowWidth/32,windowHeight/32);
	
	// lowerRegion.origin = createVector(0,max(mainRegion.size.y,(windowHeight*2/3+mainRegion.size.y)/2));
	// lowerRegion.size = createVector(windowWidth,min(mainRegion.size.y/4,windowHeight-lowerRegion.origin.y));
	
	// overflowRegion.origin = createVector(0,lowerRegion.origin.y+lowerRegion.size.y);
	// overflowRegion.size = createVector(windowWidth,windowHeight-overflowRegion.origin.y);
	
	
	
	overflowRegion.origin = createVector(0,lowerRegion.origin.y+lowerRegion.size.y);
	overflowRegion.size = createVector(windowWidth,windowHeight-overflowRegion.origin.y);
	
	/// DEBUG ///
	// leftRegion = {
		// origin: createVector(margin,margin),
		// size: createVector(mainRegion.origin.x-margin*2,lowerRegion.origin.y-margin*2)
	// }
	// rightRegion = {
		// origin: createVector(mainRegion.origin.x+mainRegion.size.x+margin,margin),
		// size: createVector(windowWidth-(mainRegion.origin.x+mainRegion.size.x+margin*2),lowerRegion.origin.y-margin*2)
	// }
	/////////////
	
	Flag.updateDimensions();
	UI.updateDimensions();
	
	ALL_STATES.forEach((s)=>s.updateDimensionsPending=true);
	if(state.updateDimensions) state.updateDimensions();
	state.updateDimensionsPending = false;
	
	textSize(windowWidth*0.01);
	let h = textWidth("Developed for Signals by Ben Tilbury");
	linkSpan.position(windowWidth/2-h/2,windowHeight-windowWidth*0.02)
	linkSpan.show()
}

function angleToIndex(angle) { return (round(angle*8/(PI*2))+6) % 8 }

function anglesFromLetter(letter)
{
	let num = Object.keys(SIGNALS).find(key => SIGNALS[key] === letter);
	num = parseInt(num);
	let l = floor(num/8)
	let r = num - l*8
	
	r = indexToAngle(r)
	l = indexToAngle(l)
	
	return [r, l];
}

function indexToAngle(index, mode)
{
	return ((index)/8)*PI*2 + PI/2;
}

function vectorsFromLetter(letter)
{
	const [r,l] = anglesFromLetter(letter);
	return [p5.Vector.fromAngle(r), p5.Vector.fromAngle(l)]
}

function randomTriangular(lower,upper,mode)
{
	let U = Math.random()
	if(U<(mode-lower)/(upper-lower)) return lower+Math.sqrt(U*(upper-lower)*(mode-lower));
	else return upper-Math.sqrt((1-U)*(upper-lower)*(upper-mode));
}

function inputDebug()
{
	// Flip
	if(key.toUpperCase() === 'Q')
	{
		flip = !flip;
		//document.getElementById("guideA").src = flip ? "assets/bacfaceA.png" : "assets/forfaceA.png"
		//document.getElementById("guideB").src = flip ? "assets/bacfaceB.png" : "assets/forfaceB.png"
	}
	
	// Toggle Word Mode
	if(key.toUpperCase() === 'W' && state!=GameState)
	{
		state.wordMode = !state.wordMode
		state.sentence = "";
	}
	
	// Toggle Two Tone Flags
	if(key.toUpperCase() === 'E')
	{
		Flag.twoTone = !Flag.twoTone;
	}
	
	// Toggle Aync Mode
	if(key.toUpperCase() === 'R')
	{
		Model.toggleAsync();
		Flag.resetAdapto();
	}
	
	if(key.toUpperCase() === 'T') 
	{
		nextState(MainMenuState)
	}
}

// function shuffle(array) 
// {
  // var m = array.length, t, i;
  
  // while (m) {

    // i = Math.floor(Math.random() * m--);

    // t = array[m];
    // array[m] = array[i];
    // array[i] = t;
  // }

  // return array;
// }

///// DOCUMENT FUNCTIONS /////
document.addEventListener('visibilitychange', function() 
{
    if(document.hidden && !paused) 
	{
		tabPaused = true;
		onPause();
	}
	else if(!document.hidden && !paused)
	{
		tabPaused = false;
		onResume();
	}
});

// window.onbeforeunload = function (e) 
// {
  // Model.disposeAll();
// };