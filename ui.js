// REDO THIS SHITTY SHIT BETTER.
var UI = (function() {
	
	// private interface
	//var textScale;
	var shapeMan;
	
	var dialShape = {
		radius: undefined,
	}

	var message;
	var darken;
	var messageEndCriteria;
	
	return  { 
		// public interface variables
		textScale: 1,
		
		// public interface setters
		// public interface getters
		hasMessage: ()=>(message!==undefined),
		// public interface methods
		
		updateDimensions: ()=>{
			UI.textScale = mainRegion.size.x / mainRegion.idealSize;
			dialShape.radius = (mainRegion.innerSize.x/2);
			
		},
		init: ()=> {
			UI.updateDimensions();
			shapeMan = createGraphics(480,480);
		},
		// REDO THIS SHITTY SHIT BETTER.
		drawShapeMan: (letter, cVal)=> {
			if(drawStage!='flip') throw "drawShapeMan must be drawn within 'flip' drawing stage"
			const [rAngle, lAngle] = anglesFromLetter(letter);
			shapeMan.clear()
			shapeMan.noStroke();
			shapeMan.fill(255);
			shapeMan.ellipseMode(CENTER);
			shapeMan.ellipse(240, 148, 64, 64);
			shapeMan.ellipse(240, 210, 108, 48);
			shapeMan.rectMode(CENTER);
			shapeMan.rect(240, 288, 108, 154);
			shapeMan.rect(210, 420, 48, 120);
			shapeMan.rect(270, 420, 48, 120);
			shapeMan.fill(200);
			shapeMan.strokeWeight(32);
			shapeMan.stroke(255);
			shapeMan.push();
			shapeMan.translate(180, 214);
			shapeMan.rotate(rAngle-PI/2);
			shapeMan.line(0, 0, 0, 152);
			shapeMan.pop();

			shapeMan.push();
			shapeMan.translate(300, 214);
			shapeMan.rotate(lAngle-PI/2);
			shapeMan.line(0, 0, 0, 152);
			shapeMan.pop();
			
			let col = lerpColor(color(255,0,0,80), color(0,255,0,120), cVal)
			tint(col);
			image(shapeMan,mainRegion.innerOrigin.x,mainRegion.innerOrigin.y,mainRegion.innerSize.x,mainRegion.innerSize.y)
			noTint();
		},
		// REDO THIS SHITTY SHIT BETTER.
		drawHands: ()=>
		{
			if(drawStage!='flip') throw "drawHands must be drawn within 'flip' drawing stage"
			
			const points = Model.getPoints();
			strokeWeight(22);
			stroke(RED);
			point(points['rightPos'].x*mainRegion.size.x+mainRegion.origin.x,points['rightPos'].y*mainRegion.size.y+mainRegion.origin.y);
			stroke(BLUE);
			point(points['leftPos'].x*mainRegion.size.x+mainRegion.origin.x,points['leftPos'].y*mainRegion.size.y+mainRegion.origin.y);
		},
		// REDO THIS SHITTY SHIT BETTER.
		drawPredictionSignal: (confirmLetter)=>
		{
			if(drawStage!='post') throw "drawPredictionSignal must be drawn within 'post' drawing stage"
			const pred = Model.getPred();
			const holdTime = Model.getHoldTime();
			const pendingSignal = Model.getPendingSignal();
			
			if(state.interceptSpace && pred=='SPACE') return;
			
			textAlign(CENTER, CENTER);
			stroke(0)
			strokeWeight(6*mainRegion.scale)
			fill((pred==='NEUTRAL' ?  LGRAY : (confirmLetter || pendingSignal=='LETTERS' || pendingSignal=='NUMBERS') ? (holdTime==-1 ? GREEN : lerpColor(WHITE, YELLOW, holdTime/TIME_THRESHOLD)) : WHITE))
			if(pred.length>1) textSize(64*UI.textScale);
			else textSize(80*UI.textScale)
			text(pred,mainRegion.center.x,mainRegion.center.y)
		},
		drawWord: (sentence)=>
		{
			if(drawStage!='post') throw "drawWord must be drawn within 'post' drawing stage"
			textAlign(CENTER, TOP);
			stroke(0)
			strokeWeight(4*mainRegion.scale)
			fill(WHITE)
			textSize(48*UI.textScale)
			//text("WORD MODE",mainRegion.center.x,mainRegion.innerOrigin.y)
			
			//rect(width/2,height-OFFSET/2,480,OFFSET)
			text(sentence,mainRegion.center.x,mainRegion.origin.y+margin)
		},
		drawDial: ()=>
		{
			textAlign(CENTER, CENTER);
			stroke(0)
			strokeWeight(6*mainRegion.scale)
			textSize(54*UI.textScale)
			// Possible right hand signals if lIndex is fixed.
			let lIndex = Model.getLIndex();
			let rIndex = Model.getRIndex();
			
			fill(LRED)
			for(let i = 0; i<8; i++)
			{
				let pot = state.numberMode ? NUMBERS_ICONS[i+lIndex*8] : SIGNALS_ICONS[i+lIndex*8]
				if(pot===undefined) continue;
				
				let ang = indexToAngle(i)
				text(pot, (flip?-1:1)*(cos(ang)*dialShape.radius - 27*UI.textScale) + mainRegion.center.x, sin(ang)*dialShape.radius + mainRegion.center.y)
			}
			// Possible left hand signals if rIndex is fixed.
			fill(LBLUE)
			for(let j = 0; j<8; j++)
			{
				let pot = state.numberMode ? NUMBERS_ICONS[rIndex+j*8] : SIGNALS_ICONS[rIndex+j*8]
				if(pot===undefined) continue;
				
				let ang = indexToAngle(j)
				text(pot, (flip?-1:1)*(cos(ang)*dialShape.radius + 27*UI.textScale) + mainRegion.center.x, sin(ang)*dialShape.radius + + mainRegion.center.y)
			}
		},
		drawDebugText: ()=>
		{
			fill(76);
			noStroke();
			textSize(16*UI.textScale);
			textAlign(LEFT, TOP);
			text(DEBUG_TEXT,0,0);
		},
		setMessage: (messageText, darkenScreen, endCriteria) =>
		{
			message = messageText;
			darken = darkenScreen;
			messageEndCriteria = endCriteria;
		},
		showMessage: ()=>
		{
			if(darken)
			{
				fill(0,0,0,100);
				rect(0,0,width,height);
			}
			
			textAlign(CENTER,CENTER)
			textSize(72*UI.textScale);
			stroke(BLACK)
			fill(WHITE)
			strokeWeight(10*UI.textScale)
			text(message,mainRegion.center.x, mainRegion.center.y);
			
			if(messageEndCriteria())
			{
				messageEndCriteria = undefined;
				message = undefined;
			}
		},
		showPause: ()=>
		{
			fill(0,0,0,100);
			rect(0,0,width,height);
			
			stroke(BLACK)
			fill(WHITE)
			
			
			textAlign(CENTER,BOTTOM)
			textSize(72*UI.textScale);
			strokeWeight(10*UI.textScale);
			text("PAUSED",mainRegion.center.x, mainRegion.center.y);
			
			textAlign(CENTER,TOP)
			textSize(32*UI.textScale);
			strokeWeight(6*UI.textScale);
			text("Press ESC to resume or SPACE to return to main menu",mainRegion.center.x, mainRegion.center.y)
		}
	};
})();

class GuideCards
{
	static closestAspectRatio(num)
	{
		let curr = GuideCards.RATIOS[0];
		let diff = Math.abs (num - curr);
		let bestVal = 0;
		for (var val = 0; val < GuideCards.RATIOS.length; val++)
		{
			var newdiff = Math.abs (num - GuideCards.RATIOS[val]);
			if (newdiff < diff)
			{
				diff = newdiff;
				curr = GuideCards.RATIOS[val];
				bestVal = val;
			}
		}
		return {
			aspect: curr,
			cols: GuideCards.COLS[bestVal],
			rows: GuideCards.ROWS[bestVal],
			centerPad: GuideCards.CENTER_PAD[bestVal]
		};
	}
	
	static preload()
	{
		GuideCards.images = []
		GuideCards.images.push(loadImage("assets/lettercards/HELPER.png"))
		SIGNALS_ORDERED.forEach((signal)=>{
			let path = "assets/lettercards/"+signal+".png";
			GuideCards.images.push(loadImage(path))
		});
		
		GuideCards.totalNum = GuideCards.images.length;
		GuideCards.sideNum = Math.ceil(GuideCards.totalNum/2);
	}
	
	constructor(start=null, end=null, internalMargin=null, interceptSpace=null, revealMode=false)
	{
		//this.baseRegion = baseRegion;
		this.margin = (internalMargin!=null ? internalMargin : margin);
		this.revealMode = revealMode;
		this.text = Array.from(SIGNALS_ORDERED);
		this.text[26] = (interceptSpace!=null ? interceptSpace : "SPACE");
		this.updateDimensions(start, end);
	}
	
	updateDimensions(start, end)
	{
		// Ignoring margin closest to main region
		start = (start ? start : createVector(0,0));
		end = (end ? end : createVector(mainRegion.origin.x, lowerRegion.origin.y));
		
		this.regions = 
		{
			leftOrigin: createVector(this.margin+start.x,start.y+this.margin),
			rightOrigin: createVector(windowWidth-end.x-this.margin,start.y+this.margin),
			size: p5.Vector.sub(p5.Vector.sub(end,start),createVector(0,this.margin*2))
		}
	
		//let oldAspect = this.shape.aspect
		this.shape = GuideCards.closestAspectRatio(this.regions.size.x/this.regions.size.y)
		
		this.regions.innerSize = createVector(Math.min(this.regions.size.x,this.regions.size.y*this.shape.aspect),Math.min(this.regions.size.y,this.regions.size.x/this.shape.aspect))
		
		// TEMP //
		this.regions.innerPad = createVector((this.regions.size.x-this.regions.innerSize.x)/2,(this.regions.size.y-this.regions.innerSize.y)/2)
		//////////
		
		this.unitSize = createVector(this.regions.innerSize.x/this.shape.cols,this.regions.innerSize.y/this.shape.rows);
		this.cardSize = createVector(this.unitSize.x*0.9,this.unitSize.y*0.9);
		this.cardPad = createVector(this.unitSize.x*0.05,this.unitSize.y*0.05);
		
		//this.pad = createVector(this.unitSize.x*0.1,this.unitSize.y*0.1)
		
		this._remakeCards();
		
		// this.leftImg.position(this.regions.leftOrigin.x+this.regions.innerPad.x,this.regions.leftOrigin.y+this.regions.innerPad.y)
		// this.rightImg.position(this.regions.rightOrigin.x+this.regions.innerPad.x,this.regions.rightOrigin.y+this.regions.innerPad.y)
		
		// this.leftImg.show();
		// this.rightImg.show();
		
		//GuideCards.T = this.leftImg;


		// if(this.cards)
		// {
			// this.cards.forEach((card,i)=>
			// {
				// let j = i%GuideCards.sideNum;
				// let y = j%this.shape.rows;
				// let x = Math.floor(j/this.shape.rows);
				// card.xPos = x*this.unitSize.x + this.regions.innerPad.x + (i<GuideCards.sideNum ? this.regions.leftOrigin.x : this.regions.rightOrigin.x) + this.cardPad.x;
				// card.yPos = y*this.unitSize.y + this.regions.innerPad.y + (i<GuideCards.sideNum ? this.regions.leftOrigin.y : this.regions.rightOrigin.y) + this.cardPad.y;
			// })
		// }
		// else
		// {
			// this.cards = [];
			// GuideCards.images.forEach((card,i)=>
			// {
				// let j = i%GuideCards.sideNum;
				// let y = j%this.shape.rows;
				// let x = Math.floor(j/this.shape.rows);
				
				// this.cards.push({
					// img: card,
					// xPos: x*this.unitSize.x + this.regions.innerPad.x + (i<GuideCards.sideNum ? this.regions.leftOrigin.x : this.regions.rightOrigin.x) + this.cardPad.x,
					// yPos: y*this.unitSize.y + this.regions.innerPad.y + (i<GuideCards.sideNum ? this.regions.leftOrigin.y : this.regions.rightOrigin.y) + this.cardPad.y,
				// })
			// });
		// }
		
		
	}
	
	_remakeCards()
	{
		if(!this.leftImg || !this.rightImg)
		{
			this.leftImg = createGraphics(this.regions.innerSize.x,this.regions.innerSize.y);
			this.rightImg = createGraphics(this.regions.innerSize.x,this.regions.innerSize.y);
			
			this.leftImg.textFont("Dosis", 64);
			this.rightImg.textFont("Dosis", 64);
			
			this.leftImg.textStyle(BOLD)
			this.rightImg.textStyle(BOLD)
			
			this.leftImg.textAlign(CENTER,CENTER)
			this.rightImg.textAlign(CENTER,CENTER)
			
			this.leftImg.noStroke();
			this.rightImg.noStroke();
			
			this.leftImg.fill(0);
			this.rightImg.fill(0);
		}
		else
		{
			this.leftImg.resizeCanvas(this.regions.innerSize.x,this.regions.innerSize.y);
			this.rightImg.resizeCanvas(this.regions.innerSize.x,this.regions.innerSize.y);
		}
		
		this.leftImg.textSize(this.cardSize.x/3)
		this.rightImg.textSize(this.cardSize.x/3)
		
		GuideCards.images.forEach((card,i)=> {
			let j = i%GuideCards.sideNum;
			let x = j%this.shape.cols;
			let y = Math.floor(j/this.shape.cols);
			let canv = (i<GuideCards.sideNum ? this.leftImg : this.rightImg);
			
			let xPos = x*this.unitSize.x + this.cardPad.x + (y==this.shape.rows-1 ? this.unitSize.x*this.shape.centerPad : 0);
			let yPos = y*this.unitSize.y + this.cardPad.y;
			
			
			canv.image(card, xPos, yPos, this.cardSize.x, this.cardSize.y);
			
			if(i==27) canv.textSize(this.cardSize.x/5);
			else if(i==1) canv.textSize(this.cardSize.x/3);

				
			if(i>0) canv.text(this.text[i-1], xPos + this.cardSize.x/2, y*this.unitSize.y + this.cardSize.y - this.cardPad.y);
			else
			{
				canv.textSize(this.cardSize.x/6);
				canv.text("LEFT",this.unitSize.x/4,this.cardPad.y*4.5)
				canv.text("RIGHT",3*this.unitSize.x/4,this.cardPad.y*4.5)
			}
		});
	}

	draw()
	{
		// noStroke();
		
		// if(this.debugPadding)
		// {
			// Using Padding
			// for(let y = 0; y<this.shape.rows; y++)
			// {
				// for(let x = 0; x<this.shape.cols; x++)
				// {
					// fill(this.randomCols[x+y*this.shape.cols])
					// let xPos = x*(this.unitSize.x+this.padding.x) + this.padding.x + this.leftRegion.origin.x;
					// let yPos = y*(this.unitSize.y+this.padding.y) + this.padding.y + this.leftRegion.origin.y;
					// rect(xPos,yPos,this.unitSize.x,this.unitSize.y)
				// }
			// }
		// }
		// else
		// {
		// Not Using Padding
		// for(let y = 0; y<this.shape.rows; y++)
		// {
			// for(let x = 0; x<this.shape.cols; x++)
			// {
				// fill(this.randomCols[x+y*this.shape.cols])
				// let xPos = x*this.unitSize.x + this.testBoxLeft.origin.x;
				// let yPos = y*this.unitSize.y + this.testBoxLeft.origin.y;
				// rect(xPos,yPos,this.unitSize.x,this.unitSize.y)
			// }
		// }
		// }
		
		image(this.leftImg,this.regions.leftOrigin.x+this.regions.innerPad.x,this.regions.leftOrigin.y+this.regions.innerPad.y)
		image(this.rightImg,this.regions.rightOrigin.x+this.regions.innerPad.x,this.regions.rightOrigin.y+this.regions.innerPad.y)
		
		// this.cards.forEach((card)=>
		// {
			// image(card.img,card.xPos,card.yPos,this.cardSize.x,this.cardSize.y)
		// });
	}
	
	__debugRegions()
	{
		noStroke();
		fill(0,0,0);
		rect(0,0,windowWidth,windowHeight)
		fill(146,39,143)
		rect(mainRegion.origin.x,mainRegion.origin.y,mainRegion.size.x,mainRegion.size.y)
		fill(250,50,50)
		rect(this.regions.rightOrigin.x,this.regions.rightOrigin.y,this.regions.size.x,this.regions.size.y)
		fill(68,140,203)
		rect(this.regions.leftOrigin.x,this.regions.leftOrigin.y,this.regions.size.x,this.regions.size.y)
		fill(166,124,83)
		rect(lowerRegion.origin.x,lowerRegion.origin.y,lowerRegion.size.x,lowerRegion.size.y)
		fill(117,76,36)
		rect(overflowRegion.origin.x,overflowRegion.origin.y,overflowRegion.size.x,overflowRegion.size.y)
		fill(176,93,193)
		rect(mainRegion.innerOrigin.x,mainRegion.innerOrigin.y,mainRegion.innerSize.x,mainRegion.innerSize.y)
		
		fill(100,170,245)
		rect(this.regions.innerPad.x+this.regions.leftOrigin.x,this.regions.innerPad.y+this.regions.leftOrigin.y,this.regions.innerSize.x,this.regions.innerSize.y)
		fill(255,100,100)
		rect(this.regions.innerPad.x+this.regions.rightOrigin.x,this.regions.innerPad.y+this.regions.rightOrigin.y,this.regions.innerSize.x,this.regions.innerSize.y)
		
		// for(let y = 0; y<this.shape.rows; y++)
		// {
			// for(let x = 0; x<this.shape.cols; x++)
			// {
				// fill(this.randomCols[x+y*this.shape.cols])
				// let xPos = x*(this.unitSize.x+this.padding.x) + this.padding.x + this.leftRegion.origin.x;
				// let yPos = y*(this.unitSize.y+this.padding.y) + this.padding.y + this.leftRegion.origin.y;
				// rect(xPos,yPos,this.unitSize.x,this.unitSize.y)
			// }
		// }
	}
}

GuideCards.W = 591;
GuideCards.H = 709;
GuideCards.RATIOS = [(3*591)/(5*709), 591/709, (5*591)/(3*709), (8*591)/(2*709)];
GuideCards.COLS = [3,4,5,8];
GuideCards.ROWS = [5,4,3,2];
GuideCards.CENTER_PAD = [0,0.5,0,0.5]

class MenuBar
{
	/*
	itemList format:
	{
		img: [The image of the button]
		back: [color for background. drawing an arc might be faster than using background image]
		degs: [Size of menu item in degrees]
		action: [function to execute, usually a state change]
	}
	*/
	
	constructor(neutralSize, itemList, backgroundImg, wiggleJust=0)
	{
		this.items = [];
		
		this.wiggleJust = wiggleJust;
		//this.innerRadius;
		//this.outerRadius;
		//this.size = createVector((5/6)*mainRegion.size.x,(5/6)*mainRegion.size.y);
		
		this.back = backgroundImg;
		
		this.shape = 
		{
			innerRadius: mainRegion.innerSize.x/2+this.wiggleJust*mainRegion.scale,
			ringSize: 60*mainRegion.scale,
			outerRadius: mainRegion.innerSize.x/2+(60+this.wiggleJust)*mainRegion.scale,
			backSize: floor(mainRegion.innerSize.x+120*mainRegion.scale),
		}
	
		let neutralPart = neutralSize/2;
		let remainingSize = 2*PI - neutralSize;
		
		//let totalWeight = itemList.reduce((a, b) => a + b.weight, 0)
		
		//let weightScale = remainingSize/totalWeight;
		
		
		// Start with neutral partA
		this.items.push(new MenuBarItem(null,null,0,neutralPart,neutralPart,'#808080',this.shape))
		
		let runningStart = neutralPart;
		
		itemList.forEach((item) => 
		{
			let rads = radians(item.degs);
			this.items.push(new MenuBarItem(item.img,item.action,runningStart,runningStart+rads,rads,item.back,this.shape))
			runningStart += rads;
		})
		
		// End with neutral partB
		this.items.push(new MenuBarItem(null,null,runningStart,2*PI,neutralPart,'#808080',this.shape))
	}
	
	resetAll()
	{
		this.items.forEach((item) => item.reinit());
	}
	
	updateDimensions()
	{
		this.shape.innerRadius = mainRegion.innerSize.x/2+this.wiggleJust*mainRegion.scale;
		this.shape.outerRadius = mainRegion.innerSize.x/2+(60+this.wiggleJust)*mainRegion.scale;
		this.shape.backSize = floor(mainRegion.innerSize.x+120*mainRegion.scale);
		
		this.items.forEach((item) => item.updateDimensions(this.shape));
	}
	
	update()
	{
		let rt = createVector(flip?1-Flag.rightFlag.tip.x:Flag.rightFlag.tip.x,Flag.rightFlag.tip.y)
		let lt = createVector(flip?1-Flag.leftFlag.tip.x:Flag.leftFlag.tip.x,Flag.leftFlag.tip.y)
			
		rt.sub(0.5,0.5);
		lt.sub(0.5,0.5);
		
		rt.mult(3);
		lt.mult(3);
		
		debugRT = rt;
		debugLT = lt;
		
		let rcheck = (rt.magSq()>=1);
		let lcheck = (lt.magSq()>=1);
		
		if(!rcheck && !lcheck) 
		{
			this.items.forEach((item) => item.reinit());
			if(!Model.noMenuReset())
			{
				Flag.rightFlag.confirmValue = 0;
				Flag.leftFlag.confirmValue = 0;
			}
			return;
		}
		
		if(!rcheck && !Model.noMenuReset()) Flag.rightFlag.confirmValue = 0;
		if(!lcheck && !Model.noMenuReset()) Flag.leftFlag.confirmValue = 0;
		
		let rhead = (rt.heading()+PI+PI/2)%(PI*2)
		let lhead = (lt.heading()+PI+PI/2)%(PI*2)
		
		this.items.forEach((item) => item.update(rcheck,rhead,lcheck,lhead));
	}
	
	draw()
	{
		push();
		//noStroke();
		strokeWeight(16);
		translate(mainRegion.center.x,mainRegion.center.y)
		if(this.back) image(this.back, -this.shape.backSize/2, -this.shape.backSize/2, this.shape.backSize, this.shape.backSize)
		rotate(-PI)
		
		this.items.forEach((item) => item.draw());
		
		//translate(-mainRegion.center.x,-mainRegion.center.y)
		pop();
	}
}

var debugRT;
var debugLT;
// MenuBar.DEFAULT_SHADE = '#808080'

class MenuBarItem
{
	constructor(imgFile, action, start, stop, stride, backCol, parentShape)
	{
		//this.colour = color(colour);
		this.shade = backCol;
		this.img = imgFile;
		if(Object.prototype.toString.call(action) === "[object String]")
		{
			this.action = UI.setMessage.bind(null, action, true, function(){return this.hoverTime==0}.bind(this));
		}
		else this.action = action;
		// this.text = text;
		this.start = start;
		this.stop = stop;
		this.stride = stride;
				
		this.parentShape = parentShape;
		
		this.shape = 
		{
			size: createVector(ceil(2*parentShape.outerRadius*Math.sin(stride/2)),ceil(parentShape.outerRadius-parentShape.innerRadius*Math.sin((PI+stride)/2))),
			origin: createVector(parentShape.outerRadius*Math.cos((PI+stride)/2),-parentShape.outerRadius),
			lift: this.parentShape.ringSize/3,
		}
		
		this.isNeutral = (imgFile===null);
		
		this.hoverTime = 0;
		
		this.vector = p5.Vector.fromAngle((start+stop)/2);
	}
	
	reinit()
	{
		this.hoverTime = 0;
	}
	
	updateDimensions(shape)
	{
		this.parentShape = shape;
		this.shape.size = createVector(ceil(2*this.parentShape.outerRadius*Math.sin(this.stride/2)),ceil(this.parentShape.outerRadius-this.parentShape.innerRadius*Math.sin((PI+this.stride)/2)));
		this.shape.origin = createVector(this.parentShape.outerRadius*Math.cos((PI+this.stride)/2),-this.parentShape.outerRadius);
		this.shape.lift = this.parentShape.ringSize/3;		
	}
	
	update(rcheck,rhead,lcheck,lhead)
	{
		if(this.isNeutral) return;
		
		let r = (rcheck && rhead>=this.start && rhead<this.stop);
		let l = (lcheck && lhead>=this.start && lhead<this.stop);
		// wooo for efficient short-circuiting.
		if(r || l)
		{
			if(this.hoverTime>-1) 
			{
				this.hoverTime += deltaTime/(TIME_THRESHOLD*2);
				if(r) Flag.rightFlag.confirmValue = this.hoverTime;
				if(l)  Flag.leftFlag.confirmValue = this.hoverTime;
			}
			
			if(this.hoverTime>=1)
			{
				this.hoverTime=-1;
				if(r) Flag.rightFlag.confirmValue = 0;
				if(l)  Flag.leftFlag.confirmValue = 0;
				
				this.action();
			}
		}
		else 
		{
			if(this.hoverTime) 
			{
				if(this.r) Flag.rightFlag.confirmValue = 0;
				if(this.l)  Flag.leftFlag.confirmValue = 0;
			}
			
			this.hoverTime = 0;
		}
		
		this.r = r;
		this.l = l;
	}
	
	draw()
	{
		if(this.isNeutral) rotate(this.stride);
		else
		{
			rotate(this.stride/2);
			
			stroke(RED);
			line(0,0,0,this.shape.size.y);
			
			// let hovVal = (this.hoverTime/(TIME_THRESHOLD*2))*this.shape.lift;
			if(this.hoverTime==0) image(this.img, this.shape.origin.x,this.shape.origin.y,this.shape.size.x,this.shape.size.y);
			else image(this.img, this.shape.origin.x,this.shape.origin.y-this.shape.lift,this.shape.size.x,this.shape.size.y);
			rotate(this.stride/2);
		}
	}
}
