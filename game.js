class Ship
{
	
	constructor(g, word, speed, shipLayer)
	{
		this.g = g;
		this.word = word;
		this.speed = speed;
		this.shipLayer = shipLayer;
		
		this.staleFrame = true;
		
		///
		this.difficulty = 0;
		this.scoreValue = word.length*(Math.round(speed*5)+1)*25;
		///
		
		this.relativePos = createVector(-0.05,Math.random());
		this.pos = createVector(0,0);
		
		this.currentIndex = 0;
		this.wordOffset =  g.shipUnitShape.x/2 - textWidth(word)/2;
		this.wordOffsetB = 0;
		
		this.complete = "";
		this.incomplete = word;
		
		// Debug
		this.frontOfShip = this.relativePos.x+this.relativeWidth;
	}
	
	newSignal(signal)
	{
		if(this.returning) return;
		
		if(signal==='CANCEL')
		{
			this.currentIndex=0;
			this.failed = false;
			return;
		}
		
		if(signal==this.word[this.currentIndex]) this.currentIndex++;
		else if(this.currentIndex>0) this.failed = true;
		
		this.complete = this.word.slice(0,this.currentIndex);
		this.incomplete = this.word.slice(this.currentIndex);
		this.wordOffsetB = textWidth(this.complete);
		
		if(this.currentIndex==this.word.length)
		{
			this.returning=true;
			
			this.g.score += this.scoreValue;
			//this.g.difficulty ...
			this.g.pendRecover = true;
		}
	}
	
	update(layer,auxLayer)
	{
		if(this.returning)
		{
			this.relativePos.x -= 2*(deltaTime*0.001)/(60-this.speed*45);
			if(this.relativePos.x<-0.05) this.remove = true;
		}
		if(this.dead)
		{
			this.relativePos.y +=deltaTime*0.0002;
			if(this.relativePos.y>=2) this.remove = true;
		}
		
		if(this.frontOfShip>=layer.rockPos.x) //&& !this.dead)
		{
			// doing it this way so we get the wobbly sinking effect
			if(!this.dead) this.g.lives--;
				
			this.dead = true;
		}
		else this.relativePos.x += (deltaTime*0.001)/(60-this.speed*45);
		
		this.pos.x = this.relativePos.x*this.g.deadZone+this.relativePos.y*auxLayer.start.x+(1-this.relativePos.y)*layer.start.x;
		this.pos.y = this.relativePos.y*auxLayer.start.y+Math.max(1-this.relativePos.y,0)*layer.start.y;
		
		this.frontOfShip = this.pos.x+this.g.shipUnitShape.x;
		
		this.staleFrame = false;
	}
	
	draw()
	{
		if(this.staleFrame) return; 
		
		noStroke();
		fill(RED);
		//rect(this.pos.x,this.pos.y,96,96);
		if(this.returning)
		{
			push();
			scale(-1,1)
			image(Game.shipUnit,-this.g.shipUnitShape.x-this.pos.x,this.pos.y-this.g.waveUnitShape.y,this.g.shipUnitShape.x,this.g.shipUnitShape.y)
			pop();
		}
		else
		{
			image(Game.shipUnit,this.pos.x,this.pos.y-this.g.waveUnitShape.y,this.g.shipUnitShape.x,this.g.shipUnitShape.y)
		}
		
		if(!this.returning && !this.dead)
		{
			stroke(BLACK);
			
			//line(this.frontOfShip,0,this.frontOfShip,windowHeight)
			
			// Word status:
			// Pending - WHITE
			// Current - GREEN for completed letters, YELLOW for remaining letters
			// Failed - RED
			if(!this.currentIndex)
			{
				fill(WHITE);
				text(this.word,this.pos.x+this.wordOffset,this.pos.y-this.g.shipUnitShape.y/3);
			}
			else if(this.failed)
			{
				fill(RED);
				text(this.word,this.pos.x+this.wordOffset,this.pos.y-this.g.shipUnitShape.y/3);
			}
			else
			{
				fill(GREEN)
				text(this.complete,this.pos.x+this.wordOffset,this.pos.y-this.g.shipUnitShape.y/3);
				fill(YELLOW)
				text(this.incomplete,this.pos.x+this.wordOffset+this.wordOffsetB,this.pos.y-this.g.shipUnitShape.y/3);
			}
		}
		
	}
	
	updateDimensions()
	{
		this.wordOffset =  this.g.waveUnitShape.x/2 - textWidth(this.word)/2;
		this.complete = this.word.slice(0,this.currentIndex);
		this.incomplete = this.word.slice(this.currentIndex);
		this.wordOffsetB = textWidth(this.complete);
	}

}

class Game
{

	static preload()
	{
		Game.waveUnit = loadImage('assets/wave.png');
		Game.shipUnit = loadImage('assets/boat1.png');
		Game.heartUnit = loadImage('assets/heart.png');
		Game.rockUnits.push(loadImage('assets/rock1.png'));
		Game.rockUnits.push(loadImage('assets/rock2.png'));
		Game.rockUnits.push(loadImage('assets/rock3.png'));
	}
	
	static init()
	{
		
	}
	
	constructor(diff, waveLayers)
	{
		this.ships = [];
		this.shipLayerOrigins = [];
		for(let i=0;i<waveLayers-1; i++)
		{
			this.ships.push([]);
			this.shipLayerOrigins.push(lowerRegion.origin.y+(i+0.5)*lowerRegion.size.y/waveLayers);
		}
				
		this.wordDifficulty = diff;
		this.endlessMode = (this.wordDifficulty==-1);
		this.difficulty = 0;
		
		this.curDifficulty = 0;
		this.maxLives = 3;
		this.lives = 3;
		this.gameOver = false;
		this.score = 0;
		this.spawnDelay = 0;
		
		this.timer = 0;
		
		this.waveScale = 0.25;

		this.waveLayers = [];
		
		// Currently not generalized for different layer amounts.
		this.rockPos = shuffle([0,1,2]);
		this.rockType = shuffle([0,1,2]);
		
		// this.waveUnitShape = createVector(256*mainRegion.scale*0.8,64*mainRegion.scale*0.8);		
		// this.shipUnitShape = createVector(128*mainRegion.scale*1.2,128*mainRegion.scale*1.2);
		// this.deadZone;
		
		this.updateDimensions();
		
		//this.whirlHole = createVector(windowWidth-this.waveUnitShape.x/2,lowerRegion.origin.y+lowerRegion.size.y/2)
		//this.spiralScale = (lowerRegion.size.y/2)/(0.5*(1+1.5*Game.A)*(1+1.5*Game.A))*Math.sin((1+1.5*Game.A)*t*TWO_PI+Game.A*TWO_PI);
		
		let G = this;
		
		for(let i=0;i<waveLayers; i++)
		{
			let p = Math.random();
			let s = createVector(-this.waveUnitShape.x*(p/2)-this.waveUnitShape.y/3, lowerRegion.origin.y+i*lowerRegion.size.y/waveLayers);
			let e = createVector(s.x+int(windowWidth-this.waveUnitShape.x), s.y+this.waveUnitShape.y);
			let r = i<3 ? this.rockPos[i] : -1;
			let rpos = createVector(this.deadZone+r*(this.rockUnitShape.x/2),s.y-this.waveUnitShape.y/3);
			let rtype = i<3 ? this.rockType[i] : Math.floor(Math.random()*3);
			
			this.waveLayers.push(
			{
				g: G,
				index: i,
				rand: [Math.random(),Math.random()],
				phase: p,
				stillStart: s,
				stillEnd: e,
				start: createVector(s.x,s.y),
				end: createVector(e.x,e.y),
				offX: 0,
				offY: 0,
				rockPos: rpos,
				rockType: rtype,
				calcOffX: (i%2==0) ? function(t){return Math.sin(2*TWO_PI*(t+this.rand[0]+this.phase)+this.index)} : function(t){return Math.cos(3*TWO_PI*(t+this.rand[0]+this.phase)+this.index)},
				calcOffY: (i%2==0) ? function(t){return Math.cos(3*TWO_PI*(t+this.rand[1]+this.phase)+this.index)} : function(t){return Math.sin(2*TWO_PI*(t+this.rand[1]+this.phase)+this.index)},
				update: function(t)
				{ 
					this.offX = this.calcOffX(t);
					this.offY = this.calcOffY(t);
					this.start.x = this.stillStart.x + this.offX * this.g.waveUnitShape.y * this.g.waveScale;
					this.start.y = this.stillStart.y + this.offY * this.g.waveUnitShape.y * this.g.waveScale;
					this.end.x = this.stillEnd.x + this.offX * this.g.waveUnitShape.y * this.g.waveScale;
					this.end.y = this.stillEnd.y + this.offY * this.g.waveUnitShape.y * this.g.waveScale;
				},
				// spiral:{
					//// CURRENTLY NOT GENERALIZED FOR LAYERS!=4
					// // // W: 1+Game.A*(4.2-i)/2.8,
					// W: 1+Game.A,
					// K: (i+2)*Game.A*PI,
					// posX: function(t,g){ return (this.W*t*this.W*t)*Math.cos(-this.W*t*TWO_PI+this.K+g);},
					// posY: function(t,g){ return -(0.4*this.W*t*this.W*t)*(Math.sin(-this.W*t*TWO_PI+this.K+g)+t);}
				// }
			});
			
		}
			
		
	}
	
	signalHoldCallback(signal)
	{
		if(signal=='NUMBERS') 
		{
			state.numberMode = true;
			return;
		}
		else if(signal=='LETTERS')
		{
			state.numberMode = false;
			return;
		}
		else if(signal=='NEUTRAL' || signal=='' || signal=='SPACE') return;
		
		// For textWidth function;
		textSize(48*UI.textScale);
		
		this.ships.forEach((shipLayer) => (shipLayer.forEach((ship, i, list)=>(ship.newSignal(signal)))));
		
		if(this.pendRecover) this.ships.forEach((shipLayer) => (shipLayer.forEach((ship)=>(ship.failed=false))));
		
		this.pendRecover = false;
	}
	
	onEnter()
	{
		this.curDifficulty = 0;
		this.maxLives = 3;
		this.lives = 3;
		this.gameOver = false;
		this.score = 0;
		this.spawnDelay = 0;
		
		
		// intro animation;
		
	}
	
	update()
	{
		if(paused) return; 
		
		this.timer+=deltaTime*this.waveScale;
		
		this.t = (this.timer*0.0003)%1;
		this.waveLayers.forEach((l)=>l.update(this.t))
		
		this.difficulty = Math.min(this.difficulty+deltaTime*0.00001, this.endlessMode ? Game.BIGGESTWORD-Number.EPSILON*2 : 1);
		this.waveScale = (this.difficulty*this.difficulty*this.difficulty*(this.endlessMode ? 0.4/(Game.BIGGESTWORD*Game.BIGGESTWORD*Game.BIGGESTWORD) : 0.4))+0.2;
		
		
		
		this.curDifficulty = 0;
		
		this.ships.forEach((shipLayer, l) => {shipLayer.forEach((ship, i, list)=>
		{
			ship.update(this.waveLayers[l],this.waveLayers[l+1]);
			this.curDifficulty += ship.difficulty;
			if(ship.remove) list.splice(i,1);
			
		})});
		
		this.spawnDelay-=deltaTime*0.001;
		
		// this.curDifficulty<this.difficulty && 
		
		if(this.spawnDelay<=0 && !this.gameOver)
		{
			this._addShip();
			this.spawnDelay=10;
		}
		
		if(this.lives>this.maxLives) this.lives = this.maxLives;
		
		if(this.lives<=0 && !this.gameOver) 
		{
			this.gameOver = true;
			this.ships.forEach((shipLayer, l) => {shipLayer.forEach((ship, i, list)=>
			{
				ship.dead = true;
			})});
			
			let timeout = millis()+4000;
			UI.setMessage("GAME OVER", true, function(){return (millis()>=timeout)}, function(){nextState(GameAMenuState)})
		}
		
	}
	
	_drawLives()
	{
		
		for(let i=0; i<this.maxLives; i++)
		{
			if(i>=this.lives) tint(DGRAY);
			image(Game.heartUnit,this.heartOrigin.x+i*(this.heartUnitShape.x*1.2),this.heartOrigin.y,this.heartUnitShape.x,this.heartUnitShape.y);
		}
		noTint();
	}

	_drawScore()
	{
		textSize(48*UI.textScale)
		textAlign(CENTER,TOP)
		stroke(0)
		strokeWeight(4*mainRegion.scale)
		fill(WHITE)
		text("SCORE",this.scoreOrigin.x,this.scoreOrigin.y)
		textSize(64*UI.textScale)
		strokeWeight(6*mainRegion.scale)
		text(this.score,this.scoreOrigin.x,this.scoreOrigin.y + 48*UI.textScale)
	}
	
	// TODO: just better.
	_addShip()
	{
		let wordLength = Math.min(this.endlessMode ? Math.floor(this.difficulty + Math.random()/2) : this.wordDifficulty, Game.BIGGESTWORD-1);
		let word = WORDS[wordLength][Math.floor(Math.random()*(WORDS[wordLength].length))];
		let s = randomTriangular(0,1,this.endlessMode ? Math.abs(this.difficulty-wordLength) : this.difficulty);

		let i;
		let rand = true;
		for(i = 0; i<this.ships.length; i++)
		{
			if(this.ships[i].length==0)
			{
				rand = false;
				break;
			}
		}
		
		if(rand) i = Math.floor(Math.random()*this.ships.length);
		
		this.ships[i].push(new Ship(this, word,s,i));
	}
	
	
	draw()
	{
		// draw water		
		// draw ships
		// draw iceberg in middle layer.
		//noStroke();
		
		/// DO THIS BETTER
		// fill(0,148,214);
		// noStroke();
		// rect(this.waveLayers[0].end.x, this.waveLayers[0].end.y, windowWidth-this.waveLayers[0].end.x, windowHeight-this.waveLayers[0].end.y);
		/////////////// 
		
		
		// stroke(255)
		// noFill();
		// strokeWeight(6*mainRegion.scale)
		
		strokeWeight(6*mainRegion.scale);
		textSize(48*UI.textScale);
		textAlign(LEFT,BOTTOM);

		this.waveLayers.forEach((l,index)=>this._drawLayer(l,index))
		
		// stroke(RED)
		// strokeWeight(2*mainRegion.scale);
		// line(this.deadZone,0,this.deadZone,windowHeight);
		
		this._drawScore();
		
		this._drawLives();
		
		// // // strokeWeight(10*mainRegion.scale);
		// point(this.whirlHole.x,this.whirlHole.y);
	}
	
	_drawLayer(layer,index)
	{
		//tint(0,0,255*layer.phase)
		image(this.waveGraphic, layer.start.x, layer.start.y);
		
		if(index<this.ships.length) 
		{
			this.ships[index].forEach((ship)=>ship.draw());
			image(Game.rockUnits[layer.rockType],layer.rockPos.x,layer.rockPos.y,this.rockUnitShape.x,this.rockUnitShape.y)
		}
		else if (layer.end.y<windowHeight)
		{
			fill(0,148,214);
			noStroke();
			rect(0,layer.end.y,windowWidth,windowHeight-layer.end.y);
		}
		
		
		
		//if(layer.index==this.waveLayers.length-1) return;
		
		//strokeWeight(20)
		//point(layer.end.x,layer.end.y)
		//strokeWeight(3*mainRegion.scale)
		//strokeWeight(2);
		// let yd = this.whirlHole.y-layer.end.y;
		// noFill();
		// bezier(
		// layer.end.x,layer.end.y,
		// layer.end.x+Game.T,layer.end.y,
		// this.whirlHole.x+Game.T*Game.K,this.whirlHole.y+yd*Game.Q,
		// this.whirlHole.x,this.whirlHole.y+yd*Game.Q
		// )
		//noTint();
		
		// let step = 1/10;
		// let t;
		// beginShape();
		
		// if(layer.spiral.posX(1,this.t*PI*6)*this.spiralScale+xOff<=0)
		// {
			// control point
			// curveVertex(layer.end.x-this.waveUnitShape.y*(1+layer.index)+xOff,layer.end.y-this.waveUnitShape.y/8+yOff);
			// first true vertex
			// curveVertex(layer.end.x+xOff,layer.end.y-this.waveUnitShape.y/8+yOff);
			// curveVertex(this.whirlHole.x,this.whirlHole.y);
			// curveVertex(this.whirlHole.x,this.whirlHole.y);
		// }
		// endShape();
		// beginShape();
		// for(let i=0; i<10; i++)
		// {
			// t = 1-i*step;
			// curveVertex(layer.spiral.posX(t,this.t*PI*6)*this.spiralScale+xOff*t*t*t+this.whirlHole.x,layer.spiral.posY(t,this.t*PI*6)*this.spiralScale+yOff*t*t*t+this.whirlHole.y);
		// }
		// control point
		// curveVertex(this.whirlHole.x,this.whirlHole.y);
		
		// endShape();
		
		// let layer2 = this.waveLayers[layer.index+1];
		// xOff = layer2.offX(this.t)*this.waveUnitShape.y*this.waveScale;
		// yOff = layer2.offY(this.t)*this.waveUnitShape.y*this.waveScale;
		
		// for(let i=0; i<10; i++)
		// {
			// t = i*step;
			// curveVertex(layer2.spiral.posX(t)*this.spiralScale+xOff*t*t*t+this.whirlHole.x,layer2.spiral.posY(t)*this.spiralScale+yOff*t*t*t+this.whirlHole.y);
		// }
		// curveVertex(layer2.spiral.posX(1)*this.spiralScale+xOff*t*t*t+this.whirlHole.x,layer2.spiral.posY(1)*this.spiralScale+yOff*t*t*t+this.whirlHole.y);
		// curveVertex(layer2.end.x+xOff,layer2.end.y-this.waveUnitShape.y/8+yOff);
		// curveVertex(layer2.end.x-this.waveUnitShape.y*(1+layer2.index)+xOff,layer2.end.y-this.waveUnitShape.y/8+yOff);

		// endShape();
		
		// let step = p5.Vector.sub(layer.points[Game.T-1],this.whirlHole).magSq();
		// beginShape()
		// for(let i = 0; i<Game.T; i++)
		// {
			// let t = 1;
			// vertex(t*layer.points[i].x+(1-t)*this.avgPoints[i].x,t*layer.points[i].y+(1-t)*this.avgPoints[i].y);
		// }
		// endShape();
		
		//-t*2 (x(A)-x(B)) cos(t*3 (π)/(2))+t x(B)+(1-t) x(A), -t (y(B)-y(A)) (sin(t (3 π)/(2))+1)+t y(B)+(1-t) y(A)
		
		//-t*(a-b)*(Math.sin(t*3*PI/2)+1)+t*a+(1-t)*b
		// -t*(By-this.whirlHole.y)*(Math.sin(t*3*PI/2)+1)+t*By+(1-t)*this.whirlHole.y
	}
	
	updateDimensions()
	{
		//Game.callCount++;
		this.hudSize = mainRegion.innerOrigin.y-mainRegion.origin.y
		
		this.waveUnitShape = createVector(256*mainRegion.scale*0.8,64*mainRegion.scale*0.8);
		this.shipUnitShape = createVector(128*mainRegion.scale*0.8,128*mainRegion.scale*0.8);
		this.heartUnitShape = createVector(64*mainRegion.scale*1.2,64*mainRegion.scale*1.2);
		this.rockUnitShape = createVector(128*mainRegion.scale*0.8,256*mainRegion.scale*0.8);
		
		this.heartOrigin = createVector(windowWidth/2-this.heartUnitShape.x*1.2*this.maxLives*0.5, mainRegion.innerOrigin.y+mainRegion.innerSize.y-this.heartUnitShape.y/2)		
		this.scoreOrigin = createVector(windowWidth/2,margin)
		
		this.deadZone = windowWidth-this.waveUnitShape.x*1.2;
		
		let s = this.waveLayers.length;
		this.waveLayers.forEach((l,i)=>
		{
			l.stillStart = createVector(-this.waveUnitShape.x*(l.phase/2)-this.waveUnitShape.y/3, lowerRegion.origin.y+l.index*lowerRegion.size.y/s);
			l.stillEnd = createVector(l.stillStart.x+int(windowWidth-this.waveUnitShape.x), l.stillStart.y+this.waveUnitShape.y);
			let r = i<3 ? this.rockPos[i] : -1;
			l.rockPos = createVector(this.deadZone+r*(this.rockUnitShape.x/2),l.stillStart.y-this.waveUnitShape.y/3);
		});
		this._createWaveGraphic();
		
		for(let i=0;i<this.waveLayers-1; i++)
		{
			this.shipLayerOrigins[i] = lowerRegion.origin.y+(i+0.5)*lowerRegion.size.y/this.waveLayers.length;
		}
		
		// For textWidth
		textSize(48*UI.textScale);
		this.ships.forEach((shipLayer) => (shipLayer.forEach((ship, i, list)=>(ship.updateDimensions()))));
		
		// this.whirlHole = createVector(windowWidth-this.waveUnitShape.x*0.6,lowerRegion.origin.y+lowerRegion.size.y*0.9)
		// this.spiralScale = (lowerRegion.size.y/2)/(0.5*(1+1.5*Game.A)*(1+1.5*Game.A))*Math.sin((1+1.5*Game.A)*TWO_PI+Game.A*TWO_PI);
		//this.spiralScale = 2*lowerRegion.size.y/this.waveLayers.length;
	
	}
	
	_createWaveGraphic()
	{
		if(this.waveGraphic) this.waveGraphic.remove();
		this.waveGraphic = createGraphics(int(windowWidth+this.waveUnitShape.x),lowerRegion.size.y);
		let x = 0
		while(x<this.waveGraphic.width)
		{
			this.waveGraphic.image(Game.waveUnit, x, 0, this.waveUnitShape.x, this.waveUnitShape.y);
			x+=this.waveUnitShape.x;
		}
		this.waveGraphic.noStroke()
		this.waveGraphic.fill(0,148,214);
		this.waveGraphic.rect(0,this.waveUnitShape.y-1,this.waveGraphic.width,this.waveGraphic.height-this.waveUnitShape.y+1);
	}
}

Game.waveUnit;
Game.shipUnit;
Game.heartUnit;
Game.rockUnits = [];
Game.BIGGESTWORD = 6;

//Game.callCount = 0;

const WORDS = [
['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'],
['OF','TO','IN','IT','IS','BE','AS','AT','SO','WE','HE','BY','OR','ON','DO','IF','ME','MY','UP','AN','GO','NO','US','AM'],
["HIS", "WAS", "FOR", "ARE", "ONE", "HOT", "BUT", "YOU", "HAD", "THE", "AND", "CAN", "OUT", "HOW", "SET", "THE", "END", "PUT", "ADD", "BIG", "ACT", "WHY", "ASK", "HER", "OFF", "TRY", "ANY", "NEW", "GET", "SHE"],
["THAT", "WITH", "THEY", "HAVE", "THIS", "FROM", "WORD", "WHAT", "SOME", "WERE", "TIME", "WILL", "SAID", "EACH", "TELL", "DOES", "WANT", "WELL", "ALSO", "PLAY", "HOME", "READ", "HAND", "GOOD", "EVEN", "LAND", "HERE", "MUST", "HIGH", "SUCH"],
["OTHER", "WHICH", "THEIR", "THREE", "SMALL", "LARGE", "SPELL", "LIGHT", "HOUSE", "AGAIN", "POINT", "WORLD", "BUILD", "EARTH", "PLACE", "WHERE", "AFTER", "ROUND", "EVERY", "UNDER", "GREAT", "THINK", "CAUSE", "RIGHT", "THERE", "ABOUT", "WRITE", "WOULD", "THESE", "THING"],
["FOLLOW", "CHANGE", "ANIMAL", "MOTHER", "FATHER", "LITTLE", "DIFFER", "BEFORE", "NUMBER", "PEOPLE", "SHOULD", "ANSWER", "SCHOOL", "FRIEND", "ALWAYS", "LETTER", "SECOND", "ENOUGH", "THOUGH", "FAMILY", "DIRECT", "HAPPEN", "STREET", "COURSE", "OBJECT", "DECIDE", "ISLAND", "SYSTEM", "RECORD", "COMMON"]
]