var WebcamView = (function() {
	
	// private interface
	var videoReady;
	var video;
	var circleMask;
	
	var centerCut;
	var resolution;
	
	function setVideoReady()
	{
		videoReady = true;
		resolution = min(video.width,video.height);
		centerCut = createVector((video.width-resolution)/2,(video.height-resolution)/2)
		circleMask = createGraphics(video.width,video.height);
		circleMask.fill(0,0,0,255);
		circleMask.circle(video.width/2, video.height/2, resolution);
		
		streamRefreshMillis = (1/video.elt.srcObject.getVideoTracks()[0].getSettings().frameRate)*1000;
		
		//streamRefreshMillis = 2000
		
		if(!streamRefreshMillis) streamRefreshMillis = 1000/30;
		
		print("video ready")
	}

	return  { 
		// public interface setters
		// public interface getters
		isReady: ()=> videoReady,
		// getBoundSize: ()=> mainRegion.size,
		// getBoundOrigin: ()=> mainRegion.origin,
		// getPortSize: ()=> mainRegion.innerSize,
		// getPortOrigin: ()=> mainRegion.innerOrigin,
		getCenterCut: ()=> centerCut,
		getResolution: ()=> resolution,
		getRefreshRate: ()=> refreshRate,
		// public interface methods
		updateDimensions: ()=>{
			// mainRegion.size = createVector(windowWidth/2,windowWidth/2);
			// mainRegion.origin = createVector(width/2 - mainRegion.size.x/2,-mainRegion.size.y/16);
			
			// mainRegion.innerSize = createVector(2*mainRegion.size.x/3,2*mainRegion.size.y/3);
			// mainRegion.innerOrigin = createVector(mainRegion.origin.x+mainRegion.innerSize.x/4,mainRegion.origin.y+mainRegion.innerSize.y/4);
		},
		//debugImage: undefined,
		preload: ()=> {
			let constraints = {
				video: {
					width: { ideal: displayWidth/2 },
					height: { ideal: displayWidth/2 },
					// width: { ideal: 640 },
					// height: { ideal: 480 },
					frameRate: {min: 15}
				},
				audio: false
				
			};
			video = createCapture(constraints);
			//video.size(640, 480);
			video.hide();
			video.elt.onloadeddata = setVideoReady;
			//circleMask = loadImage('assets/circleMask.png');
			//WebcamView.debugImage = createImg('debug.png','whatever').elt
			//video.mask(circleMask);
		},
		init: ()=> {
			WebcamView.updateDimensions();
		},
		draw: ()=> {
			if(drawStage!='flip') throw "WebcamView must be drawn within 'flip' drawing stage"
			if(!videoReady) return;
			video.mask(circleMask);
			// image(video,0,0,480,480,80,0,480,480);
			image(video,mainRegion.innerOrigin.x,mainRegion.innerOrigin.y,mainRegion.innerSize.x,mainRegion.innerSize.y,centerCut.x,centerCut.y,resolution,resolution);
		},
		getVideo: ()=> {
			return video.elt;
		},
		createMouseVector: ()=>{
			return createVector(((flip ? width - mouseX : mouseX)-mainRegion.origin.x)/mainRegion.size.x, (mouseY-mainRegion.origin.y)/mainRegion.size.y);
		},		
	};
})();