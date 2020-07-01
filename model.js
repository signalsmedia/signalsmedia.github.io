var Model = (function() {
	
	// private interface
	var tfModel;
	var modelLoaded;
	var modelReady;
	
	var points;
	var rightDir = null;
	var leftDir = null;
	var rTip = null;
	var lTip = null;
	var rIndex = 0;
	var lIndex = 0;
	
	var deltaFrame;
	var deltaPoints;
	
	var pred = ''
	
	var pendingSignal;
	var holdTime = 0;
	var matchTime = 0;
	
	var pending;
	
	var useAsync;
	
	var wait = 0;
	
	//var confirmSignalCallbacks = [];
	//var updatePipeline = [decodeSignal, checkSignalHold, updateFlags];
	
	function inferPoints()
	{
		if(state.ignoreModel) return;
		
		wait += deltaTime;

		if(LOCAL_DEBUG)
		{
			if(mouseIsPressed && mouseButton === LEFT) points['leftPos'] = WebcamView.createMouseVector();
			else if(mouseIsPressed && mouseButton === RIGHT) points['rightPos'] = WebcamView.createMouseVector();
			executePipeline();
		}
		else
		{
			if(!modelReady || !WebcamView.isReady()) return;
			
			if(useAsync && !pending) getKeypointsAsync().then(() => executePipeline());
			else if(!useAsync && wait>=streamRefreshMillis)
			{
				wait = 0;
				debugFrame++;
				getKeypoints();
				executePipeline();
			}
	
		}
	}
	
	function executePipeline()
	{
		inModelPipeline = true;
		decodeSignal();
		if(!state.ignoreFlags) updateFlags();
		if(state.interceptSpace) checkSpaceIntercept();
		if(state.signalHoldCallback) checkSignalHold();
		//else if(state.subMenu) checkMainMenuReturn();

		if(state.matchSignal) checkSignalMatch();
			
		//updatePipeline.forEach((func) => func())
		inModelPipeline = false;
	}
	
	function decodeSignal()
	{
		if(pending || !modelReady) return;
	
		rightDir = p5.Vector.sub(points["rightPos"],points["rightElbow"]);
		leftDir = p5.Vector.sub(points["leftPos"],points["leftElbow"]);
		
		let r = rightDir.heading()
		let l = leftDir.heading()

		rIndex = angleToIndex(r)
		lIndex = angleToIndex(l)

		pred = state.numberMode ? NUMBERS[rIndex+lIndex*8] : SIGNALS[rIndex+lIndex*8]
		if(pred==undefined) pred = "";
	}
	
	function normIfNot()
	{
		if(rightDir.magSq()!=1) rightDir.normalize();
		if(leftDir.magSq()!=1) leftDir.normalize();
	}
	
	function updateFlags()
	{
		if(pending || !modelReady) return;
		
		normIfNot();
		
		//Flag.update(points["rightPos"],rightDir,points["leftPos"],leftDir)
		Flag.update(p5.Vector.add(points["rightPos"],points["rightElbow"]).div(2), rightDir, p5.Vector.add(points["leftPos"],points["leftElbow"]).div(2), leftDir)
		Flag.adaptiveResolution();
	}
	
	/// Man, wouldn't it be great to generalize this to intercept anything. But I have no need to do that and it would be loads of work.
	function checkSpaceIntercept()
	{
		if(pred=="SPACE")
		{
			if(holdTime>-1) holdTime += deltaTime;
			
			Flag.rightFlag.confirmValue = holdTime/(TIME_THRESHOLD*2);
			Flag.leftFlag.confirmValue = holdTime/(TIME_THRESHOLD*2);
			
			if(holdTime>=(TIME_THRESHOLD*2))
			{
				holdTime=-1;
									
				state.interceptSpace();
				
				Flag.rightFlag.confirmValue = 0;
				Flag.leftFlag.confirmValue = 0;
			}
		}
		else
		{
			Flag.rightFlag.confirmValue = 0;
			Flag.leftFlag.confirmValue = 0;
			if(!state.signalHoldCallback) holdTime = 0;
		}
	}
	
	function checkSignalHold()
	{
		if(pred==pendingSignal)
		{
			if(pred=='SPACE' && state.interceptSpace) return;
			
			if(holdTime>-1) holdTime += deltaTime;
			
			if(holdTime>=TIME_THRESHOLD)
			{
				holdTime=-1;
				state.signalHoldCallback(pendingSignal);
				//confirmSignalCallbacks.forEach((func) => func(pendingSignal))
			}
		}
		else
		{
			pendingSignal = pred;
			holdTime = 0;
		}
		
	}
	
	function checkSignalMatch()
	{
		state.matchSignal.score = matchCloseness(state.matchSignal.signal,state.matchSignal.tolerance);
		
		if(state.matchSignal.score==1)
		{
			if(matchTime>-1) matchTime += deltaTime;
			
			if(matchTime>=TIME_THRESHOLD)
			{
				matchTime=-1;
				state.matchSignal.callback();
			}
		}
		else matchTime = 0;
	}
	
	function matchCloseness(letter, tol)
	{
		normIfNot();
		
		const [r,l] = vectorsFromLetter(letter);
		
		let rClose = (1+p5.Vector.dot(r,rightDir))/2;
		let lClose = (1+p5.Vector.dot(l,leftDir))/2;

		let val = (rClose+lClose)/2;
		
		return min(val/tol,1);
	}

	
	function getKeypoints() {
		//const img = getCanvasImg()
		const result = tf.tidy(()=>
		{
			let img = tf.browser.fromPixels(WebcamView.getVideo());
			if(deltaFrame) img = img.reverse(1);
			img = img.expandDims(0);
			//print(img.shape)
			let xStart = WebcamView.getCenterCut().x;
			let yStart = WebcamView.getCenterCut().y;
			let r = WebcamView.getResolution();
			
			img = img.slice([0,yStart,xStart,0],[1,yStart+r-1,xStart+r-1,3])
			//img = tf.image.resizeBilinear(img,[224,224]);
			img = tf.image.resizeNearestNeighbor(img,[224,224]);
			img = img.div(127.5).sub(1);
			const points = tf.concat(tfModel.predict(img))
			return points.dataSync()
		});
		
		let pointvecs = {}
		if(deltaFrame)
		{
			pointvecs['rightPos']	= createVector(1-result[2],result[3])
			pointvecs['leftPos']	= createVector(1-result[0],result[1])
			pointvecs['rightElbow']	= createVector(1-result[6],result[7])
			pointvecs['leftElbow']	= createVector(1-result[4],result[5])
		}
		else
		{
			pointvecs['rightPos']	= createVector(result[0],result[1])
			pointvecs['leftPos']	= createVector(result[2],result[3])
			pointvecs['rightElbow']	= createVector(result[4],result[5])
			pointvecs['leftElbow']	= createVector(result[6],result[7])
		}
		
		points = {}
		
		points['rightPos']		= p5.Vector.lerp(pointvecs['rightPos'],deltaPoints['rightPos'],0.5)
		points['leftPos']		= p5.Vector.lerp(pointvecs['leftPos'],deltaPoints['leftPos'],0.5)
		points['rightElbow']	= p5.Vector.lerp(pointvecs['rightElbow'],deltaPoints['rightElbow'],0.5)
		points['leftElbow']	= p5.Vector.lerp(pointvecs['leftElbow'],deltaPoints['leftElbow'],0.5)
		
		deltaPoints = pointvecs;
		deltaFrame = !deltaFrame;
		
	}


	async function getKeypointsAsync() {
		//print("PRED_START")
		pending = true;
		//const img = getCanvasImg()
		const pend = tf.tidy(()=>
		{
			let img = tf.browser.fromPixels(WebcamView.getVideo());
			//if(deltaFrame) img = img.reverse(1);
			img = img.expandDims(0);
			//print(img.shape)
			img = img.slice([0,0,80,0],[1,479,559,3])
			//img = tf.image.resizeBilinear(img,[224,224]);
			img = tf.image.resizeNearestNeighbor(img,[224,224]);
			img = img.div(127.5).sub(1);
			const points = tf.concat(tfModel.predict(img))
			return points;
		});
		
		let result = await pend.data();
		
		pending = false;
		
		pend.dispose();
		
		points = {}
		
		points['rightPos']	= createVector(result[0],result[1])
		points['leftPos']	= createVector(result[2],result[3])
		points['rightElbow']	= createVector(result[4],result[5])
		points['leftElbow']	= createVector(result[6],result[7])

	}
	
	function dummyInfer()
	{
		const result = tf.tidy(()=>
		{
			let dummy = tf.zeros([1,224,224,3])
			const points = tf.concat(tfModel.predict(dummy))
			return points.dataSync()
		});
		modelReady = true;
	}

	return {
		
		// public interface setters
		setConfirmSignalCallbacks: callbackList => confirmSignalCallbacks=callbackList,
		// setUpdatePipeline: functionList => {
			// if(Array.isArray(functionList))
			// {
				// updatePipeline = [];
				// if(functionList.length===0) Model.update = function(){}
				// else 
				// {
					// Model.update = inferPoints;
					// functionList.forEach((pipe)=>(updatePipeline.push(PIPES[pipe])));
				// }
			// }
			// else throw "Non-array passed to Model.setUpdatePipeline"
		// },
		toggleAsync: ()=> {
			useAsync=!useAsync;
			pending = false;
		} ,
		// public interface getters
		isReady: ()=> modelReady,
		getPoints: ()=> points,
		getPred: ()=> pred,
		getPendingSignal: ()=> pendingSignal,
		getHoldTime: ()=> holdTime,
		getLIndex: ()=> lIndex,
		getRIndex: ()=> rIndex,
		noMenuReset: ()=> (pred=='SPACE' && state.interceptSpace),
		// public interface methods
		resetTimes: ()=> {
			holdTime=-1;
			matchTime=-1;
		},
		init: async ()=> {
			if(LOCAL_DEBUG)
			{
				modelLoaded = true;
				modelReady = true;
				points = {'rightPos':createVector(0.3,0.5),'leftPos':createVector(0.7,0.5),'rightElbow':createVector(0.4, 0.5),'leftElbow':createVector(0.6, 0.5)}
			}
			else
			{
				deltaPoints = {'rightPos':createVector(0.5,0.5),'leftPos':createVector(0.5,0.5),'rightElbow':createVector(0.5,0.5),'leftElbow':createVector(0.5,0.5)}
				points = {'rightPos':createVector(0.5,0.5),'leftPos':createVector(0.5,0.5),'rightElbow':createVector(0.5,0.5),'leftElbow':createVector(0.5,0.5)}
				tf.setBackend('webgl');
				try 
				{
					tfModel = await tf.loadLayersModel('nn/model.json',strict=false);
					modelLoaded = true;
					dummyInfer();
					print("Model Ready")
				} catch (err) 
				{
					print(err.message)
				}
			}
		},
		update: inferPoints,
	};
})();