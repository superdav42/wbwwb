Game.addToManifest({
	cricket: "sprites/misc/cricket.json"
});
function Cricket(scene){

	var self = this;
	self.scene = scene;

	self._CLASS_ = "Cricket";

	var mc = MakeMovieClip("cricket");
	self.graphics = mc;
	self.mc = mc;
	var DRAWING_SCALE = 0.25;
	mc.scale.x = mc.scale.y = DRAWING_SCALE;

	self.width = 137*DRAWING_SCALE;
	self.height = 137*DRAWING_SCALE;

	var MODE = 0;
	var MODE_CHIRP = 0;
	var MODE_HOP = 1;
	var MODE_WANDER = 2;

	self.flip = 1;
	self.period = 10;
	self.breathe = Math.floor(Math.random()*self.period);
	self.hop = 0;

	self.x = self.y = self.z = 0;

	// Wandering properties (like Peeps)
	self.direction = Math.random() * Math.PI * 2;
	self.speed = 0.5 + Math.random() * 0.5;
	self.vel = {x: 0, y: 0};
	self.wanderTimer = 0;

	self.update = function(){

		if(MODE==MODE_CHIRP){
			self.breathe++;
			if(self.breathe>self.period+10) self.breathe=0;
			if(self.breathe>self.period){
				var scale;
				if(self.breathe%4==0) scale=1.1;
				if(self.breathe%4==1) scale=1.0;
				if(self.breathe%4==2) scale=0.9;
				if(self.breathe%4==3) scale=1.0;
				mc.scale.x = DRAWING_SCALE*(scale);
				mc.scale.y = DRAWING_SCALE*(1/scale);
			}else{
				mc.scale.x = mc.scale.y = DRAWING_SCALE;
			}
		}
		if(self.hopAwayTimeout>0){
			self.hopAwayTimeout--;
			if(self.hopAwayTimeout==0) MODE=MODE_HOP;
		}
		if(MODE==MODE_HOP){
			var tv = scene.tv;
			self.flip = 1;
			self.x += 3.5;
			self.hop += 0.1570795;
			self.z = -Math.abs(Math.sin(self.hop))*100;
			self.y = tv.y;
		}
		if(MODE==MODE_WANDER){
			// Wander around like a peep
			self.wanderTimer--;
			if(self.wanderTimer <= 0){
				// Change direction randomly
				self.direction = Math.random() * Math.PI * 2;
				self.wanderTimer = 60 + Math.random() * 120; // Change direction every 1-3 seconds
			}

			// Move in current direction
			var vx = Math.cos(self.direction) * self.speed;
			var vy = Math.sin(self.direction) * self.speed;

			self.vel.x = self.vel.x * 0.9 + vx * 0.1;
			self.vel.y = self.vel.y * 0.9 + vy * 0.1;
			self.x += self.vel.x;
			self.y += self.vel.y;

			// Wrap around borders (like Peeps)
			var margin = 50;
			if(self.x < -margin) self.x = Game.width + margin;
			if(self.x > Game.width + margin) self.x = -margin;
			if(self.y < 0) self.y = Game.height + margin * 2;
			if(self.y > Game.height + margin * 2) self.y = 0;

			// Flip based on direction
			if(vx < 0){
				self.flip = -1;
			}else if(vx > 0){
				self.flip = 1;
			}

			// Hop animation while wandering
			self.hop += 0.15;
			self.z = -Math.abs(Math.sin(self.hop)) * 30; // Smaller hops than fleeing

			// Occasional chirp while wandering
			self.breathe++;
			if(self.breathe > self.period + 10) self.breathe = 0;
			if(self.breathe > self.period){
				var scale;
				if(self.breathe % 4 == 0) scale = 1.1;
				if(self.breathe % 4 == 1) scale = 1.0;
				if(self.breathe % 4 == 2) scale = 0.9;
				if(self.breathe % 4 == 3) scale = 1.0;
				mc.scale.x = DRAWING_SCALE * (scale) * self.flip;
				mc.scale.y = DRAWING_SCALE * (1 / scale);
			}
		}
		if(self.x>Game.width+50 && MODE==MODE_HOP){
			self.kill();
		}

		mc.scale.x = self.flip*Math.abs(mc.scale.x);
		mc.x = self.x;
		mc.y = self.y+self.z;

	};

	//////////////
	// WATCH TV //
	//////////////

	self.hopAwayTimeout = -1;
	self.watchTV = function(){
        
        // 1) Stop & look
		var tv = scene.tv;
		self.x = tv.x + 100;
		self.y = tv.y;
		self.flip = -1;
        var WAIT = Director.ZOOM_OUT_1_TIME + Director.SEE_VIEWERS_TIME + 2.3;

        // 2) And go on.
		self.hopAwayTimeout = _s(WAIT);

    };

	////////////////////
	// START WANDERING //
	////////////////////

	self.startWandering = function(){
		MODE = MODE_WANDER;
		self.wanderTimer = 60 + Math.random() * 120;
	};

	/////////////
	// THE END //
	/////////////

	// KILL ME
	self.kill = function(){
		var world = self.scene.world;
		world.props.splice(world.props.indexOf(self),1);
		world.layers.props.removeChild(self.graphics);
	};

}