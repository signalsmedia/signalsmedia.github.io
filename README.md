# Interactive Semaphore
Stop the ships from crashing into the rocks with our Semaphore inspired video game. Use your webcam and wave your arms to semaphore different letters and save the ships from sinking. <br>
During the Napoleonic war the British grew envious of the French’s semaphore communication technology as it allowed them to communicate quickly over long distances, as such the British began to develop their own. In the early 1800s various experiments took place along the Tendring coastline and along the chain of Martello towers and HMS Warning at Mersea Island. This game is inspired by those experiments. <br>
The game uses a convolutional neural network to find where the player’s hands and elbows are, then references that against a library of all the semaphore positions. <br>
So now you can celebrate Tendring’s maritime heritage and experiment with exciting new technology by playing games and learning local history. <br>
This new interactive experience is part of Signals’ [Talk Time](https://www.signals.org.uk/talk-time-emergency-conversations-along-the-coastline/) project exploring communication technology in the Tendring area and made possible with a National Lottery Heritage Fund.
## Technical Aspects
This site uses a convolutional neural network using a modified MobileNetV2 backbone that includes dilations similar to those found in Google's PoseNet. On top of this are additional convolutional layers to derive 8 heatmaps and 16 offset maps. These are combined and trained in such a way that half of the heatmaps/offsets focus on an on-screen view and half of them focus on an off-screen view resulting in 4 heatmaps and 8 offsets corresponding to 4 keypoints; right hand, left hand, right elbow, left elbow.

The training code for this model - and many unused variations - is available, though messy.
