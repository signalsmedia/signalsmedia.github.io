class Point {
  constructor(x, y, fix) {
    this.x = x
    this.y = y
    this.px = x
    this.py = y
    this.vx = 0
    this.vy = 0
    this.fix = fix
    this.active = true;

    this.connections = []
  }

  update() {
    if (this.fix) return;

    this.vy = ~~((this.vy + 1200) * 400) / 400;

    let delta = deltaTime * deltaTime * 0.000001;

    let nx = this.x + ((this.x - this.px) * 0.99) + ((this.vx / 2) * delta);
    let ny = this.y + ((this.y - this.py) * 0.99) + ((this.vy / 2) * delta);

    this.px = this.x;
    this.py = this.y;

    this.x = nx;
    this.y = ny;

    this.vy = this.vx = 0
  }

  attach(point, length) {
    this.connections.push(new Connection(this, point, length))
  }

  resolve() {
    this.connections.forEach((c) => c.resolve())
  }

  debug() {
    Flag.graphics.strokeWeight(6);
    Flag.graphics.stroke(this.active ? 0 : 255)
    Flag.graphics.point(this.x, this.y)
    Flag.graphics.strokeWeight(1);
    this.connections.forEach((c) => {
      c.debug()
    })
  }

  deactivate(callerConnection, flop) {
    this.active = flop;
    this.connections.forEach((c) => c.b.deactivate(c, !flop))
  }
}

class Connection {
  constructor(a, b, length) {
    this.a = a
    this.b = b
    this.length = length
  }

  resolve() {
    let diff_x = this.a.x - this.b.x,
      diff_y = this.a.y - this.b.y,
      dis = sqrt(diff_x * diff_x + diff_y * diff_y),
      diff = (this.length - dis) / dis;

    let px = diff_x * diff * 0.5;
    let py = diff_y * diff * 0.5;

    if (!this.a.fix) {
      this.a.x += px;
      this.a.y += py;
    }
    if (!this.b.fix) {
      this.b.x -= px;
      this.b.y -= py;
    }
  }

  debug() {
    Flag.graphics.line(this.a.x, this.a.y, this.b.x, this.b.y);
  }
}

// const sorter = (mx, my) =>

  // (a, b) => 
  // {
    // if (a.x - mx >= 0 && b.x - mx < 0) return 1;
    // if (a.x - mx < 0 && b.x - mx >= 0) return -1;
    // if (a.x - mx == 0 && b.x - mx == 0) 
    // {
        // if (a.y - my >= 0 || b.y - my >= 0) return a.y > b.y;
        // return b.y > a.y;
    // }

    ////compute the cross product of vectors (center -> a) x (center -> b)
    // let det = (a.x - mx) * (b.y - my) - (b.x - mx) * (a.y - my);
    // if (det < 0) return 1;
    // if (det > 0) return -1;

    ////points a and b are on the same line from the center
    ////check which point is closer to the center
    // let d1 = (a.x - mx) * (a.x - mx) + (a.y - my) * (a.y - my);
    // let d2 = (b.x - mx) * (b.x - mx) + (b.y - my) * (b.y - my);
    // return d1 - d2;
  // }


class Flag 
{
  static init()
  {
	  Flag.rightFlag = new Flag(128, createVector(mainRegion.idealSize/2,mainRegion.idealSize/2), createVector(0,1), mainRegion.idealSize/2,mainRegion.idealSize/2, RED);
	  Flag.leftFlag = new Flag(128, createVector(mainRegion.idealSize/2,mainRegion.idealSize/2), createVector(0,1), mainRegion.idealSize/2, mainRegion.idealSize/2, BLUE);
	  Flag.graphics = createGraphics(mainRegion.idealSize, mainRegion.idealSize, WEBGL);
	  Flag.graphics.translate(-mainRegion.idealSize/2,-mainRegion.idealSize/2);
	  Flag.graphics.setAttributes('antialias', true);
	  Flag.updateDimensions();
  }
  
  static updateDimensions()
  {
	  Flag.size = mainRegion.size;
	  Flag.origin = mainRegion.origin;
	// Flag.size = createVector(windowWidth/2,windowWidth/2);
	// Flag.origin = createVector(width/2 - windowWidth/4,-windowWidth/32);
  }
  
  static update(rightPos, rightAngle, leftPos, leftAngle)
  {  	
	Flag.rightFlag.update(rightPos,rightAngle)
	Flag.leftFlag.update(leftPos,leftAngle)
	
	Flag.adaptiveResolution();
  }
  
  static adaptiveResolution() 
  {
	if(Flag.useSimple || Flag.DEBUG_ADAPT) return;
	
	// If we decimated or subdivided on the previous frame, ignore its delta as it will be skewed.
	if(Flag.respite==Flag.RESPITE_MAX)
	{
		Flag.respite -= Number.EPSILON*2
		return;
	}
	
    Flag.resDelta[Flag.resdex] += deltaTime;
    Flag.resFrames[Flag.resdex]++;
    Flag.resAvg[Flag.resdex] = ~~((Flag.resDelta[Flag.resdex] / Flag.resFrames[Flag.resdex]) * 10) / 10;

	
	if(Flag.respite>0) Flag.respite -= deltaTime*0.001
	
	if(Flag.respite<0) Flag.respite = 0;
    
	// && Flag.resAvg[Flag.resdex] < 20 
    if(Flag.resdex < 3 && Flag.resAvg[Flag.resdex] < 32 && Flag.resAvg[Flag.resdex + 1] < 32 && (Flag.respite==0) && Flag.subdivide())
	{
		Flag.respite = Flag.RESPITE_MAX;
    } 
	// && Flag.resAvg[Flag.resdex - 1] < 20
	else if(Flag.resdex > 0 && Flag.resAvg[Flag.resdex] > 32  && (Flag.respite==0) && Flag.decimate())
	{
      Flag.respite = Flag.RESPITE_MAX;
    }
	else if(Flag.resdex==0 && Flag.resAvg[0] > 44)
	{
		Flag.decimateToSimple()
	}
  }
  
  static subdivideFromSimple()
  {
	  // Yes this is an inneficient way to do it. Bite me.
	  if(!Flag.useSimple) return;
	  Flag.subdivide();
	  Flag.subdivide();
	  Flag.useSimple = false;
  }
  
  static decimateToSimple()
  {
	  // Yes this is an inneficient way to do it. Bite me.
	  if(Flag.useSimple) return;
	  Flag.useSimple = true;
	  Flag.decimate();
	  Flag.decimate();
  }

  // In a perfect world with unlimited time, I would have these decimate/subdivide from any stage, to any stage. Presently they only go up and down 1 'scale' so need to be repeated which is very slow.
  static subdivide()
  {
    if (Flag.G >= 33) return false;

    let newG = (Flag.G - 1) * 2 + 1
    let newL = Flag.L / 2;

    Flag.flags.forEach((f) => {
      f.subdivide(newG, newL)
    })

    Flag.G = newG
    Flag.L = newL
	
	if(!Flag.useSimple) Flag.resdex++;
	
    return true;
  }

  static decimate() {
    if (Flag.G <= 5 && !Flag.useSimple) return false;

    Flag.flags.forEach((f) => {
      f.decimate()
    })

    Flag.G = ceil(Flag.G / 2);
    Flag.L = Flag.L * 2;
	
	if(!Flag.useSimple) Flag.resdex--;
	
    return true;
  }
  
  static draw()
  {
	  if(drawStage!='flip' && drawStage!='flag') throw "Flags must be drawn within 'flip' or 'flag' drawing stage"
	  if(Flag.graphics)
	  {
		  if(drawStage=='flag')
		  {
			Flag.graphics.push();
			Flag.graphics.translate(flip ? 0 : -mainRegion.idealSize/2,-mainRegion.idealSize/2);
			if(flip)
			{
			 Flag.graphics.scale(-1,1);
			 Flag.graphics.translate(-mainRegion.idealSize/2,0);
			}
		  }
		
		  Flag.graphics.clear();
		  //Flag.graphics.noStroke();
		  Flag.flags.forEach((f) => {
			f.draw();
			// f.debugDraw2();
		  })
		if(drawStage=='flag') Flag.graphics.pop();
		image(Flag.graphics,mainRegion.origin.x,mainRegion.origin.y,mainRegion.size.x,mainRegion.size.y);
	  }
  }
  
  static resetAdapto()
  {
	  Flag.resDelta = [0, 0, 0, 0];
	  Flag.resFrames = [0, 0, 0, 0];
	  Flag.resAvg = [0, 0, 0, 0];
	  Flag.respite = Flag.RESPITE_MAX;
  }

  constructor(poleSize, origin, dir, midX, midY, colour)
  {
    this.poleSize = poleSize;

    this.points = [];
	
	this.colour = colour;
	
	this.confirmValue = 0;

    //this.rtri = [];
    //this.ytri = [];
    //this.edge = [];

    this.origin = origin;
    this.dir = dir;
	
	this.tip = createVector(0,0);

    for(let y = 0; y < Flag.G; y++) {
      for(let x = 0; x < Flag.G; x++) {

        let p = new Point((x - Flag.G / 2) * Flag.L + midX, (y - Flag.G / 2) * Flag.L + midY, (y == 0))


        if (x != 0 && y == Flag.G - 1) p.attach(this.points[this.points.length - 1], Flag.L);
        //if(x != 0) p.attach(this.points[this.points.length - 1], Flag.L);
        //if(x != 0 && (y+x)%2==0) p.attach(this.points[this.points.length - 1], Flag.L);
        if (y != 0) p.attach(this.points[this.points.length - Flag.G], Flag.L)

        this.points.push(p);

        //if(x==0||y==0||x==Flag.G-1-y) this.rtri.push(p);

        //if(x==Flag.G-1||y==Flag.G-1||x==Flag.G-1-y) this.ytri.push(p);
        
        //if(x==0||y==0||x==Flag.G-1||y==Flag.G-1) this.edge.push(p);
      }
    }
    
    // this.rmidx = this.rtri.reduce((a, b) => (a + b.x), 0) / this.rtri.length
    // this.rmidy = this.rtri.reduce((a, b) => (a + b.y), 0) / this.rtri.length
    // this.rtri = this.rtri.sort(sorter(this.rmidx,this.rmidy));
    // this.ymidx = this.ytri.reduce((a, b) => (a + b.x), 0) / this.ytri.length
    // this.ymidy = this.ytri.reduce((a, b) => (a + b.y), 0) / this.ytri.length
    // this.ytri = this.ytri.sort(sorter(this.ymidx,this.ymidy));
    
    
    Flag.flags.push(this);

  }


  update(origin, dir) 
  {
    this.origin = p5.Vector.mult(origin, mainRegion.idealSize/2);
	this.origin.add(mainRegion.idealSize/2,mainRegion.idealSize/2)
    this.dir = dir;
	
	//this.origin.sub(p5.Vector.mult(this.dir,this.poleSize/2))
	this.tip.x = (this.origin.x + this.dir.x * this.poleSize)/mainRegion.idealSize;
	this.tip.y = (this.origin.y + this.dir.y * this.poleSize)/mainRegion.idealSize;
	
	//this.tip.x = (this.origin.x + this.dir.x * this.poleSize/2)/mainRegion.idealSize;
	//this.tip.y = (this.origin.y + this.dir.y * this.poleSize/2)/mainRegion.idealSize;
	
	if(Flag.useSimple)
	{
	  this.points[0].x = this.origin.x + this.dir.x * this.poleSize
      this.points[0].y = this.origin.y + this.dir.y * this.poleSize
	  this.points[1].x = this.origin.x + this.dir.x * (this.poleSize - Flag.L)
      this.points[1].y = this.origin.y + this.dir.y * (this.poleSize - Flag.L)
	  
	  let ort = Math.sign(this.dir.x)
		  
	  this.points[2].x = this.points[0].x + (this.dir.y)*-ort*Flag.L
      this.points[2].y = this.points[0].y + (this.dir.x)*ort*Flag.L
	  this.points[3].x = this.points[1].x + (this.dir.y)*-ort*Flag.L
      this.points[3].y = this.points[1].y + (this.dir.x)*ort*Flag.L
	  
	  return;
	}
	
	
    for(let j = 0; j < Flag.G; j++)
	{
      this.points[j].x = this.origin.x + this.dir.x * (this.poleSize - j * Flag.L)
      this.points[j].y = this.origin.y + this.dir.y * (this.poleSize - j * Flag.L)
    }
	
    let i = 400
    while (i--) this.points.forEach((p) => {
      p.resolve()
    })

    this.points.forEach((p) => {
      p.update()
    })
    
    // this.rmidx = this.rtri.reduce((a, b) => (a + b.x), 0) / this.rtri.length
    // this.rmidy = this.rtri.reduce((a, b) => (a + b.y), 0) / this.rtri.length
    // this.rtri.sort(sorter(this.rmidx,this.rmidy));
    
    // this.ymidx = this.ytri.reduce((a, b) => (a + b.x), 0) / this.ytri.length
    // this.ymidy = this.ytri.reduce((a, b) => (a + b.y), 0) / this.ytri.length
    // this.ytri = this.ytri.sort(sorter(this.ymidx,this.ymidy));
  }
  
  debugDraw2()
  {
	Flag.graphics.stroke(this.colour)
	Flag.graphics.strokeWeight(30)
	Flag.graphics.point(this.origin.x,this.origin.y)
	// stroke(YELLOW)
	// point(points["rightElbow"].x*mainRegion.idealSize,points["rightElbow"].y*mainRegion.idealSize)
	//stroke(this.colour)
	//point(points["leftPos"].x*mainRegion.idealSize,points["leftPos"].y*mainRegion.idealSize)
	// stroke(CYAN)
	// point(points["leftElbow"].x*mainRegion.idealSize,points["leftElbow"].y*mainRegion.idealSize)
  }

  draw() 
  {
    Flag.graphics.stroke(0);
    Flag.graphics.strokeWeight(this.confirmValue ? 10 : 6);
	
	Flag.graphics.line(this.origin.x, this.origin.y, this.origin.x + this.dir.x * this.poleSize, this.origin.y + this.dir.y * this.poleSize);
	
	if(this.confirmValue)
	{
		Flag.graphics.strokeWeight(8)
		Flag.graphics.stroke(GREEN);
		Flag.graphics.line(this.origin.x, this.origin.y, this.origin.x + this.dir.x * this.poleSize * this.confirmValue, this.origin.y + this.dir.y * this.poleSize * this.confirmValue);
	}
	
    Flag.graphics.noStroke();
    
    if(this.colour!=null && !Flag.twoTone)
    {
      Flag.graphics.fill(this.colour);

      for(let j = 0; j < Flag.G - 1; j++) {
        Flag.graphics.beginShape(TRIANGLE_STRIP)
        for(let i = 0; i < Flag.G; i++) {
          let x1 = this.points[i * Flag.G + j].x;
          let y1 = this.points[i * Flag.G + j].y;

          let x2 = this.points[i * Flag.G + j + 1].x;
          let y2 = this.points[i * Flag.G + j + 1].y;

          Flag.graphics.vertex(x1, y1, 1);
          Flag.graphics.vertex(x2, y2, 1);
        }
        Flag.graphics.endShape();
      }
    }
    else
    {
      Flag.graphics.fill(RED);
      for(let j = 1; j < Flag.G; j++) 
      {
        let y = j;
        let x = 0;
        Flag.graphics.beginShape(TRIANGLE_STRIP)
        Flag.graphics.vertex(this.points[y*Flag.G].x,this.points[y*Flag.G].y,1)
        
        while(x<j)
        {
          y--;
          Flag.graphics.vertex(this.points[y*Flag.G+x].x,this.points[y*Flag.G+x].y,1)
          x++
          Flag.graphics.vertex(this.points[y*Flag.G+x].x,this.points[y*Flag.G+x].y,1)
        }
        
        Flag.graphics.endShape();
      }
      
      Flag.graphics.fill(YELLOW);
      for(let i = 1; i < Flag.G; i++) 
      {
        let x = i;
        let y = Flag.G-1;
        Flag.graphics.beginShape(TRIANGLE_STRIP)
        Flag.graphics.vertex(this.points[y*Flag.G+x].x,this.points[y*Flag.G+x].y,1)
        
        while(Flag.G-y-1<i)
        {
          x--;
          Flag.graphics.vertex(this.points[y*Flag.G+x].x,this.points[y*Flag.G+x].y,1)
          x++;
          y--;
          Flag.graphics.vertex(this.points[y*Flag.G+x].x,this.points[y*Flag.G+x].y,1)
        }
        
        Flag.graphics.endShape();
      }
    }    
    //smooth();
  }

//     draw2(colour) 
//     {
//       stroke(0);
//       strokeWeight(6);
//       line(this.origin.x, this.origin.y, this.origin.x + this.dir.x * this.poleSize, this.origin.y + this.dir.y * this.poleSize);

//       strokeWeight(1);
//       noStroke();
//       //stroke(0);
//       //fill(colour);

//       fill(RED)
//       beginShape(TRIANGLE_FAN)
//       vertex(this.rmidx,this.rmidy)
//       this.rtri.forEach(e => {vertex(e.x,e.y)});
//       endShape();
      
//       fill(YELLOW)
//       beginShape(TRIANGLE_FAN)
//       vertex(this.ymidx,this.ymidy)
//       this.ytri.forEach(e => {vertex(e.x,e.y)});
//       endShape();
      
      
// //       fill(BLUE)
// //       beginShape()
// //       this.edge.forEach(e => {vertex(e.x,e.y)});
// //       endShape(CLOSE);
//     }

  debugDraw() {
    Flag.graphics.strokeWeight(1);
    Flag.graphics.stroke(0);
    this.points.forEach((p) => {
      p.debug()
    })
  }

  decimate() {
    for(let y = 0; y < Flag.G; y++) {
      for(let x = 0; x < Flag.G; x++) {
        let i = x + y * Flag.G
        let p = this.points[i];
        p.connections = [];
        if (x % 2 == 0 && y % 2 == 0) {
          if (x != 0 && y == Flag.G - 1) p.attach(this.points[i - 2], Flag.L * 2);
          if (y != 0) p.attach(this.points[i - Flag.G * 2], Flag.L * 2)
        } else p.active = false;
      }
    }

    this.points = this.points.filter(function(p) {
      return p.active;
    });

  }

  subdivide(newG, newL) 
  {
	// TODO: Add version for subdividing from simple flag
	
	
    let newPoints = []

    for(let y = 0; y < newG; y++) {
      for(let x = 0; x < newG; x++) {
        let ox = (x / 2);
        let oy = (y / 2);
        let p;
        if (x % 2 == 0 && y % 2 == 0) // If is current point
        {
          p = this.points[oy * Flag.G + ox];
          p.connections = [];
        } else // if new point, 
        {
          let px, py;

          if (x % 2 == 0) {
            let up = floor(oy) * Flag.G + ox
            let down = ceil(oy) * Flag.G + ox;

            px = (this.points[up].x + this.points[down].x) / 2
            py = (this.points[up].y + this.points[down].y) / 2

          } else if (y % 2 == 0) {
            let left = oy * Flag.G + floor(ox)
            let right = oy * Flag.G + ceil(ox);

            px = (this.points[left].x + this.points[right].x) / 2
            py = (this.points[left].y + this.points[right].y) / 2

          } else {
            let nw = floor(oy) * Flag.G + floor(ox)
            let ne = floor(oy) * Flag.G + ceil(ox);
            let se = ceil(oy) * Flag.G + floor(x / 2)
            let sw = ceil(oy) * Flag.G + ceil(x / 2);

            px = (this.points[nw].x + this.points[ne].x + this.points[se].x + this.points[sw].x) / 4
            py = (this.points[nw].y + this.points[ne].y + this.points[se].y + this.points[sw].y) / 4

          }

          p = new Point(px, py, (y == 0));
        }

        if (x != 0 && y == newG - 1) p.attach(newPoints[newPoints.length - 1], newL);
        //if(x != 0) p.attach(newPoints[newPoints.length - 1], newL);
        if (y != 0) p.attach(newPoints[newPoints.length - newG], newL);

        newPoints.push(p);

      }
    }

    this.points = newPoints;

  }
}

Flag.flags = [];
Flag.rightFlag;
Flag.leftFlag;
Flag.useSimple = false;
Flag.twoTone = true;
Flag.G = 17
Flag.S = 64
Flag.L = Flag.S / Flag.G;
Flag.resDelta = [0, 0, 0, 0]
Flag.resFrames = [0, 0, 0, 0]
Flag.resAvg = [0, 0, 0, 0]
Flag.RESPITE_MAX = 3.0;
Flag.respite = Flag.RESPITE_MAX;
Flag.resdex = 2;
Flag.DEBUG_ADAPT = false;

// Must better name. Also do bounding box graphics per flag.
Flag.size;
Flag.origin;