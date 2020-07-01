const LoadingState =
{
	///// STATE PARAMETERS /////
	name: 'Loading',
	ignoreModel: true,
	ignoreFlags: true,
	
	///// STATE FUNCTIONS /////

    update: function()
	{
		if(Model.isReady() && WebcamView.isReady()) nextState(IntroMenuState)
	},
	
	postDraw: function()
	{
		if(drawStage!='post') throw "postDraw must be called within 'post' drawing stage";
		
		textAlign(CENTER, BOTTOM);
		if(WebcamView.isReady())
		{
			fill(GREEN);
			text("WEBCAM READY",windowWidth/2,mainRegion.innerOrigin.y)
		}
		else
		{
			fill(RED);
			text("LOADING WEBCAM",windowWidth/2,mainRegion.innerOrigin.y)
		}
		
		textAlign(CENTER, TOP);
		stroke(0)
		strokeWeight(6)
		textSize(48)
		if(Model.isReady())
		{
			fill(GREEN);
			text("NEURAL NETWORK READY", windowWidth/2, mainRegion.innerOrigin.y + mainRegion.innerSize.y)
		}
		else
		{
			fill(RED);
			text("LOADING NEURAL NETWORK...", windowWidth/2, mainRegion.innerOrigin.y + mainRegion.innerSize.y)
		}
				
	},
}

const IntroMenuState =
{
	///// STATE PARAMETERS /////
    name: 'IntroMenu',
	ignoreFlags: true,
	returnToNeutral: false,
	matchSignal: {
		signal:String.fromCharCode(65+Math.floor(Math.random() * 26)),
		tolerance:0.85,
		callback: ()=>
		{
			if(IntroMenuState.returnToNeutral) nextState(MainMenuState);
			else 
			{
				IntroMenuState.matchSignal.signal = "NEUTRAL";
				IntroMenuState.returnToNeutral = true;
			}
		},
		score: 0,
	},

	///// SPECIFIC PARAMETERS /////
	//innerGuide:
	
	///// STATE FUNCTIONS /////
	
	onEnter: function()
	{
		this.matchSignal.signal = String.fromCharCode(65+Math.floor(Math.random() * 26));
	},

	flipDraw: function()
	{
		if(drawStage!='flip') throw "flipDraw must be called within 'flip' drawing stage";
		UI.drawShapeMan(this.matchSignal.signal,this.matchSignal.score*this.matchSignal.score);
		if(LOCAL_DEBUG) UI.drawHands();
	},
	
	postDraw: function()
	{
		if(drawStage!='post') throw "postDraw must be called within 'post' drawing stage";	
		textAlign(CENTER,BOTTOM)
		stroke(0)
		strokeWeight(6*mainRegion.scale);
		fill(WHITE)
		textSize(48*UI.textScale);
		text(this.returnToNeutral ? "NOW RETURN TO NEUTRAL POSITION" : "MAKE THIS SHAPE TO START!", mainRegion.center.x, mainRegion.innerOrigin.y);
	},

};

const MainMenuState =
{
	///// STATE PARAMETERS /////
    name: 'MainMenu',
	
	///// SPECIFIC PARAMETERS /////
	
	///// STATE FUNCTIONS /////
	init: function()
	{
		this.menu = new MenuBar(PI/2,
		[
			{img:loadImage("/assets/menus/main/learn.png"), back:color(90,111,5), degs:116.5, action: function(){nextState(LearnMenuState)}},
			{img:loadImage("/assets/menus/main/settings.png"), back:color(71,25,69), degs:37, action: "Coming Soon..."},
			{img:loadImage("/assets/menus/main/play.png"), back:color(22,87,134), degs:116.5, action: function(){nextState(GameAMenuState)}},
		], loadImage("/assets/menus/main/background.png"), 2);
	},

	updateDimensions: function()
	{
		if(this.menu) this.menu.updateDimensions();
	},
	
	//confirmSignalCallback: function(signal){},

    update: function()
	{
		if(this.menu) this.menu.update();
	},
	
	onExit: function()
	{
		if(this.menu) this.menu.resetAll();
	},
	
	preDraw: function()
	{
		if(drawStage!='pre') throw "preDraw must be called within 'pre' drawing stage";
		if(this.menu) this.menu.draw();
	},


};

const GameAMenuState =
{
	///// STATE PARAMETERS /////
    name: 'GameAMenu',
	//subMenu: true,
	///// SPECIFIC PARAMETERS /////
	
	///// STATE FUNCTIONS /////
	
	preload: function()
	{
		this.howToImage = loadImage('/assets/howtogameA.png');
	},
	
	interceptSpace: function()
	{
		nextState(MainMenuState)
	},
	
	init: function()
	{
		this.menu = new MenuBar(PI/2,
		[
			{img:loadImage("/assets/menus/shipgame/howtoplay.png"), back:color(32,86,43), degs:67.5, action: {image:GameAMenuState.howToImage, origin:mainRegion.origin, size:mainRegion.size}},
			{img:loadImage("/assets/menus/shipgame/l1.png"), back:color(88,88,88), degs:22.5, action: function(){nextState(GameState, 0)}},
			{img:loadImage("/assets/menus/shipgame/l2.png"), back:color(80,80,80), degs:22.5, action: function(){nextState(GameState, 1)}},
			{img:loadImage("/assets/menus/shipgame/l3.png"), back:color(73,73,73), degs:22.5, action: function(){nextState(GameState, 2)}},
			{img:loadImage("/assets/menus/shipgame/l4.png"), back:color(67,67,67), degs:22.5, action: function(){nextState(GameState, 3)}},
			{img:loadImage("/assets/menus/shipgame/l5.png"), back:color(60,60,60), degs:22.5, action: function(){nextState(GameState, 4)}},
			{img:loadImage("/assets/menus/shipgame/l6.png"), back:color(53,53,53), degs:22.5, action: function(){nextState(GameState, 5)}},
			{img:loadImage("/assets/menus/shipgame/endlessmode.png"), back:color(140,0,14), degs:67.5, action: function(){nextState(GameState, -1)}},
		], loadImage("/assets/menus/shipgame/background.png"), 2);
	},

	updateDimensions: function()
	{
		if(this.menu) this.menu.updateDimensions();
		// this.howToObj = 
		// {
			// image: GameAMenuState.howToImage,
			// origin: 
		// }
	},
	
	//confirmSignalCallback: function(signal){},

    update: function()
	{
		if(this.menu) this.menu.update();
	},
	
	onExit: function()
	{
		if(this.menu) this.menu.resetAll();
	},
	
	preDraw: function()
	{
		if(drawStage!='pre') throw "preDraw must be called within 'pre' drawing stage";
		if(this.menu) this.menu.draw();
	},

};

const LearnMenuState =
{
	///// STATE PARAMETERS /////
    name: 'LearnMenu',
	// subMenu: true,
	///// SPECIFIC PARAMETERS /////
	
	///// STATE FUNCTIONS /////
	interceptSpace: function()
	{
		nextState(MainMenuState)
	},
	
	init: function()
	{
		this.menu = new MenuBar(PI/2,
		[
			{img:loadImage("/assets/menus/learn/discover.png"), back:color(74,128,168), degs:90, action: "Coming Soon..."},
			{img:loadImage("/assets/menus/learn/whatis.png"), back:color(185,81,0), degs:90, action: "Coming Soon..."},
			{img:loadImage("/assets/menus/learn/sandbox.png"), back:color(140,0,58), degs:90, action: function(){nextState(PlaygroundState)}},
		], loadImage("/assets/menus/learn/background.png"));
	},

	updateDimensions: function()
	{
		if(this.menu) this.menu.updateDimensions();
	},
	
	//confirmSignalCallback: function(signal){},

    update: function()
	{
		if(this.menu) this.menu.update();
	},
	
	onExit: function()
	{
		if(this.menu) this.menu.resetAll();
	},
	
	preDraw: function()
	{
		if(drawStage!='pre') throw "preDraw must be called within 'pre' drawing stage";
		if(this.menu) this.menu.draw();
	},


};

const PlaygroundState =
{
	///// STATE PARAMETERS /////
    name:'Playground',
	
	wordMode: true,
	numberMode: false,
	sentence: "",
	
	///// SPECIFIC PARAMETERS /////
	
	///// STATE FUNCTIONS /////	
	
	signalHoldCallback: function(signal)
	{
		if(signal=='NUMBERS') 
		{
			this.numberMode = true;
			return;
		}
		else if(signal=='LETTERS')
		{
			this.numberMode = false;
			return;
		}
		else if(signal=='CANCEL')
		{
			this.sentence = this.sentence.substring(0, this.sentence.length - 1);
			return;
		}
		else if(signal=='NEUTRAL' || signal=='') return;
		
		if(signal=='SPACE') signal = ' ';
		
		this.sentence = this.sentence.concat(signal);
	},
	
	preDraw: function()
	{
		if(drawStage!='pre') throw "preDraw must be called within 'pre' drawing stage";
		//UI.drawDebugText();
	},
	
	postDraw: function()
	{
		if(drawStage!='post') throw "postDraw must be called within 'post' drawing stage";
		UI.drawPredictionSignal(this.wordMode);
		if(this.wordMode) UI.drawWord(this.sentence);
	},
	
    onExit: function(){this.sentence="";},
	
	onKeyPressed: function()
	{
		//inputDebug();
		if(paused && key==" ") 
		{
			togglePause();
			nextState(MainMenuState)
		}
		
		if(keyCode===ESCAPE)togglePause();
	},
};

const GameState = 
{
	name:'Game',
	
	interceptSpace: function()
	{
		nextState(GameAMenuState);
	},
	
	init: function()
	{
		Game.init();
	},
	
	signalHoldCallback: function(signal)
	{
		if(this.game) this.game.signalHoldCallback(signal);
	},
	
	onEnter: function(level)
	{
		this.overrideRegion = true;
		
		windowResized();
		if(level!=undefined)
		{
			this.lastLevel = level;
			this.game = new Game(level,4);
		}
		else
		{
			this.game = new Game(this.lastLevel,4);
		}
		
		this.sideGuides = new GuideCards(createVector(0, mainRegion.innerOrigin.y), createVector(mainRegion.innerOrigin.x-margin,mainRegion.innerOrigin.y+mainRegion.innerSize.y),0, "EXIT");
		
		this.game.onEnter();
	},
	
	onExit: function()
	{
		this.overrideRegion = false;
		windowResized();
	},
	
	updateDimensions: function()
	{
		if(this.game && this.overrideRegion) this.game.updateDimensions();
		if(this.sideGuides) this.sideGuides.updateDimensions(createVector(0, mainRegion.innerOrigin.y), createVector(mainRegion.innerOrigin.x-margin,mainRegion.innerOrigin.y+mainRegion.innerSize.y));
	},
	
	update: function()
	{
		if(this.game) this.game.update();
	},
	
	postDraw: function()
	{
		if(drawStage!='post') throw "postDraw must be called within 'post' drawing stage";
		UI.drawPredictionSignal(true);
		//UI.drawDial();
		this.game.draw();
		if(this.sideGuides) this.sideGuides.draw();
	},
	
	overrideRegion: true,
	overrideMainRegion: function()
	{
		mainRegion.size = createVector(min(windowWidth/2.5,(windowHeight/3)*cutoffAspect.max),min(windowWidth/2.5,(windowHeight/3)*cutoffAspect.max));
		mainRegion.origin = createVector(windowWidth/2 - mainRegion.size.x/2, -mainRegion.size.y/16);
		mainRegion.innerSize = createVector(2*mainRegion.size.x/3,2*mainRegion.size.y/3);
		mainRegion.innerOrigin = createVector(mainRegion.origin.x+mainRegion.innerSize.x/4,mainRegion.origin.y+mainRegion.innerSize.y/4);
		mainRegion.center = createVector(mainRegion.origin.x+mainRegion.size.x/2,mainRegion.origin.y+mainRegion.size.y/2);
		mainRegion.scale = mainRegion.size.x / mainRegion.idealSize
		
		lowerRegion.origin = createVector(0,max(mainRegion.size.y,(windowHeight*2/3+mainRegion.size.y)/2));
		lowerRegion.size = createVector(windowWidth,min(mainRegion.size.y/4,windowHeight-lowerRegion.origin.y));
	
		overflowRegion.origin = createVector(0,lowerRegion.origin.y+lowerRegion.size.y);
		overflowRegion.size = createVector(windowWidth,windowHeight-overflowRegion.origin.y);
	},
	
	onKeyPressed: function()
	{
		if(paused && key==" ") 
		{
			togglePause();
			nextState(MainMenuState)
		}
		
		if(keyCode===ESCAPE)togglePause();
	},
}

///////////////////////////////////
const DebugState =
{
	///// STATE PARAMETERS /////
    name:'Debug',
	///////
	// ignoreModel: true,
	// ignoreFlags: true,
	///////
	wordMode: false,
	numberMode: false,
	sentence: "",
	
	init: function()
	{
		this.sideGuides = new GuideCards();
		this.updateDimensionsPending = false;
	},
	
	///// SPECIFIC PARAMETERS /////
	
	///// STATE FUNCTIONS /////	
	
	signalHoldCallback: function(signal)
	{
		if(signal=='NUMBERS') 
		{
			this.numberMode = true;
			return;
		}
		else if(signal=='LETTERS')
		{
			this.numberMode = false;
			return;
		}
		else if(signal=='CANCEL')
		{
			this.sentence = this.sentence.substring(0, this.sentence.length - 1);
			return;
		}
		else if(signal=='NEUTRAL' || signal=='') return;
		
		if(signal=='SPACE') signal = ' ';
		
		this.sentence = this.sentence.concat(signal);
	},
	
	updateDimensions: function()
	{
		if(this.sideGuides) this.sideGuides.updateDimensions();
	},
	
	onEnter(returnState)
	{
		this.returnState = returnState;
	},
	
	preDraw: function()
	{
		if(drawStage!='pre') throw "preDraw must be called within 'pre' drawing stage";
		UI.drawDebugText();
	},
	
	flipDraw: function()
	{
		UI.drawHands();
	},
	
	postDraw: function()
	{
		if(drawStage!='post') throw "postDraw must be called within 'post' drawing stage";
		UI.drawPredictionSignal(this.wordMode);
		if(this.wordMode) UI.drawWord(this.sentence);
		if(this.sideGuides) this.sideGuides.draw();
		
	},
	
    onExit: function(){this.sentence="";},
	
	onKeyPressed: function()
	{
		if(key=='1') nextState(this.returnState);
		// if(key=='3' && this.sideGuides) this.sideGuides.debugPadding = !this.sideGuides.debugPadding
		inputDebug();
	},
	
	__debugRegions: function()
	{
		if(this.sideGuides) this.sideGuides.__debugRegions();
	},
};


