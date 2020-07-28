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
	
	var pointHistory = [];
	
	var pred = ''
	
	var pendingSignal;
	var holdTime = 0;
	var matchTime = 0;
	
	var pending;
	
	var useAsync;
	
	var wait = 0;
	
	// var debugImage;
	
	const TIME_WINDOW = 500;
	
	const IMAGE_COORDS = createImageCoords();
	const MASK = createMask();
	const O_MASK = createOMask();

	function createImageCoords()
	{
		const q = tf.linspace(-1,1,56);
		const coords = tf.stack([tf.matMul(q.reshape([56, 1]), tf.ones([1, 56])),tf.matMul(tf.ones([56, 1]), q.reshape([1, 56]))],axis=-1);
		return tf.expandDims(coords, 2);
	}
	
	function createMask()
	{
		let m = tf.zeros([1,28,28,4]);
		m = m.pad([[0,0],[14,14],[14,14],[0,0]],1);
		return m
	}
	
	function createOMask()
	{
		let m = tf.zeros([1,28,28,8])
		m = m.pad([[0,0],[14,14],[14,14],[0,0]],1)
		return m
	}

	
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
		if(state.interceptSpace && !paused) checkSpaceIntercept();
		if(state.signalHoldCallback && !paused) checkSignalHold();
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
		Flag.update(points["rightPos"], rightDir, points["leftPos"], leftDir)
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
			matchTime += deltaTime;
			
			if(matchTime>=TIME_THRESHOLD)
			{
				matchTime=0;
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
	
	function median(values)
	{
	  if(values.length ===0) return 0;

	  values.sort(function(a,b){
		return a-b;
	  });

	  var half = Math.floor(values.length / 2);

	  if (values.length % 2)
		return values[half];

	  return (values[half - 1] + values[half]) / 2.0;
	}

	
	function getKeypoints() {
		//const img = getCanvasImg()
		const [result, scores] = tf.tidy(()=>
		{
			let img = tf.browser.fromPixels(WebcamView.getVideo());
			//let img = tf.browser.fromPixels(WebcamView.debugImage)
			if(deltaFrame) img = img.reverse(1);
			img = img.expandDims(0);
			//img = img.reverse(-1);
			//print(img.shape)
			let xStart = WebcamView.getCenterCut().x;
			let yStart = WebcamView.getCenterCut().y;
			let r = WebcamView.getResolution();
			
			img = img.slice([0,yStart,xStart,0],[1,yStart+r-1,xStart+r-1,3])
			//img = tf.image.resizeBilinear(img,[224,224]);
			img = tf.image.resizeNearestNeighbor(img,[224,224]);
			img = img.div(127.5).sub(1);
			const [o, h] = tfModel.predict(img);
		
			let narrowHeatmap = tf.sigmoid(h.slice([0,0,0,0],[-1,-1,-1,4]));
			narrowHeatmap = tf.pad(narrowHeatmap,[[0,0],[14,14],[14,14],[0,0]]);
			
			let wideHeatmap = tf.sigmoid(h.slice([0,0,0,4],[-1,-1,-1,4]));
			wideHeatmap = tf.image.resizeBilinear(wideHeatmap,[56,56]);
			wideHeatmap = wideHeatmap.mul(MASK);
			
			let heatmap = tf.add(narrowHeatmap, wideHeatmap);
			
			let scores = tf.max(heatmap, axis=[1,2]);
			heatmap = heatmap.divNoNan(tf.sum(heatmap,axis=[1,2],keepDims=true));
			
			let narrowOffset = o.slice([0,0,0,0],[-1,-1,-1,8])
			narrowOffset = tf.pad(narrowOffset,[[0,0],[14,14],[14,14],[0,0]])
			
			let wideOffset = o.slice([0,0,0,8],[-1,-1,-1,8])
			wideOffset = tf.image.resizeBilinear(wideOffset,[56,56])
			wideOffset = wideOffset.mul(O_MASK)
			
			let offsets = tf.add(wideOffset,narrowOffset)
			
			let xOff = offsets.stridedSlice([0,0,0,0],[1,56,56,8],[1,1,1,2])
			let yOff = offsets.stridedSlice([0,0,0,1],[1,56,56,8],[1,1,1,2])
			
			offset = tf.stack([tf.sum(heatmap.mul(xOff), axis=[1, 2]), tf.sum(heatmap.mul(yOff), axis=[1, 2])],axis=-1)
			
			heatmap = heatmap.expandDims(-1);
			
			let f = tf.sum(heatmap.mul(IMAGE_COORDS), axis=[1, 2]).add(offset.div(448)).reverse(-1);
			
			return [f.dataSync(), scores.dataSync()];
		});
		
		
		// debugImage.loadPixels()
		// for (let i = 0; i < 4 * 56 * 56; i ++)
		// {
		  // debugImage.pixels[i*4] = int(debugTensor[i]*255)
		  // debugImage.pixels[i*4+3] = 255
		// }
		// debugImage.updatePixels()
		
		let next = {score: scores, time:millis()}
		
		if(deltaFrame) next.values = [[-result[2],result[3]],[-result[0],result[1]],[-result[6],result[7]],[-result[4],result[5]]];
		else next.values = [[result[0],result[1]],[result[2],result[3]],[result[4],result[5]],[result[6],result[7]]];
		
		pointHistory.unshift(next);
		
		let sumPoints = [[0,0],[0,0],[0,0],[0,0]];
		let sumContribute = [0,0,0,0];
		let cutoff;
		
		for(let i = 0, l = pointHistory.length; i<l; i++)
		{
			p = pointHistory[i];
			let time = millis()-p.time;
			
			if(time>TIME_WINDOW)
			{
				cutoff = i;
				break;
			}
			
			let urgency = 1-time/TIME_WINDOW; // could scale this nonlinearly
			
			for(let k = 0; k<4; k++)
			{
				if(p.score[k]>0)
				sumContribute[k] += urgency*p.score[k]
				sumPoints[k][0] += p.values[k][0]*sumContribute[k];
				sumPoints[k][1] += p.values[k][1]*sumContribute[k];
			}
		}
		
		if(cutoff) pointHistory.length=cutoff;
		else cutoff = pointHistory.length;
	
		// points = {}
		
		// points['rightPos']		= createVector(sumPoints[0][0], sumPoints[0][1]).div(sumContribute[0]).div(cutoff)
		// points['leftPos']		= createVector(sumPoints[1][0], sumPoints[1][1]).div(sumContribute[1]).div(cutoff)
		// points['rightElbow']		= createVector(sumPoints[2][0], sumPoints[2][1]).div(sumContribute[2]).div(cutoff)
		// points['leftElbow']		= createVector(sumPoints[3][0], sumPoints[3][1]).div(sumContribute[3]).div(cutoff)
		
		points['rightPos']		= createVector(next.values[0][0], next.values[0][1])
		points['leftPos']		= createVector(next.values[1][0], next.values[1][1])
		points['rightElbow']	= createVector(next.values[2][0], next.values[2][1])
		points['leftElbow']		= createVector(next.values[3][0], next.values[3][1])
		
		//points = pointvecs;
		// deltaPoints = pointvecs;
		//deltaFrame = !deltaFrame;
		
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
	
	async function dummyInfer()
	{
		tf.tidy(()=>
		{
			let dummy = tf.zeros([1,224,224,3])
			tfModel.predict(dummy)
		});
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
			matchTime=0;
		},
		disposeAll: ()=> {
			IMAGE_COORDS.dispose();
			MASK.dispose();
			O_MASK.dispose();
		},
		// debug: ()=> {
			// image(debugImage,mainRegion.origin.x,mainRegion.origin.y,mainRegion.size.x,mainRegion.size.y);
		// },
		init: async ()=> {
			debugImage = createImage(56,56);
			
			if(LOCAL_DEBUG)
			{
				modelLoaded = true;
				modelReady = true;
				points = {'rightPos':createVector(-0.4,0),'leftPos':createVector(0.4,0.0),'rightElbow':createVector(-0.2, 0.0),'leftElbow':createVector(0.2, 0.0)}
			}
			else
			{
				deltaPoints = {'rightPos':createVector(0.0,0.0),'leftPos':createVector(0.0,0.0),'rightElbow':createVector(0.0,0.0),'leftElbow':createVector(0.0,0.0)}
				points = {'rightPos':createVector(0.0,0.0),'leftPos':createVector(0.0,0.0),'rightElbow':createVector(0.0,0.0),'leftElbow':createVector(0.0,0.0)}
				tf.setBackend('webgl');
				//tf.ENV.set('WEBGL_PACK', false)
				//tf.setBackend('cpu');
				try 
				{
					//tfModel = await tf.loadLayersModel('nn/model.json',strict=false);
					//tfModel = await tf.loadLayersModel('newmodel/model.json',strict=false);
					tfModel = await tf.loadGraphModel('newmodelgraph/model.json',strict=false);
					modelLoaded = true;
					await dummyInfer();
					modelReady = true;
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