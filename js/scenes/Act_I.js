/*****************************

ACT I: THE SETUP
1. Hat guy
2. Lovers
// then let's start escalating...

******************************/

// CRICKET INVASION TRACKING
var CRICKET_COUNT = 0;
var CRICKET_INVASION_THRESHOLD = 30;

function Stage_Start(self){

    // Create Peeps
    self.world.clearPeeps();
    self.world.addBalancedPeeps(20);

    // Reset cricket count
    CRICKET_COUNT = 0;

}

function Stage_Hat(self){

	// A Hat Guy
	var hat = new HatPeep(self);
    self.world.addPeep(hat);

    // Director
    self.director.callbacks = {
        takePhoto: function(d){

            // DECLARATIVE
            d.tryChyron(function(d){
                var p = d.photoData;
                var caught = d.caught({
                    hat: {_CLASS_:"HatPeep"}
                });
                if(caught.hat){
                    p.audience = 3;
                    p.caughtHat = caught.hat;
                    d.chyron = textStrings["niceHat"];
                    return true;
                }
                return false;
            }).otherwise(_chyPeeps);

        },
        movePhoto: function(d){
            d.audience_movePhoto();
        },
        cutToTV: function(d){

            // If you did indeed catch a hat peep...
            var p = d.photoData;
            if(p.caughtHat){
                self.world.addBalancedPeeps(1); // Add with moar!
                d.audience_cutToTV(function(peep){
                    peep.wearHat();
                }); // make all viewers wear HATS!
                p.caughtHat.kill(); // Get rid of hat
                Stage_Lovers(self); // Next stage
            }else{
                d.audience_cutToTV();
            }

        }
    };

}

function Stage_Lovers(self){

    // LOVERS
    var lover1 = new LoverPeep(self);
    lover1.setType("circle");
    var lover2 = new LoverPeep(self);
    lover2.setType("square");
    lover2.follow(lover1);
    self.world.addPeep(lover1);
    self.world.addPeep(lover2);

    // Director
    self.director.callbacks = {
        takePhoto: function(d){

            // MODULAR & DECLARATIVE
            d.tryChyron(_chyLovers)
             .otherwise(_chyHats)
             .otherwise(_chyPeeps);

        },
        movePhoto: function(d){
            d.audience_movePhoto();
        },
        cutToTV: function(d){

            // MODULAR & DECLARATIVE
            d.tryCut2TV(_cutLovers)
             .otherwise(_cutHats)
             .otherwise(_cutPeeps);

            // And whatever happens, just go to the next stage
            // ACT II!!!
            Stage_Screamer(self);

        }
    };

}

///////////////////////////////////////
///////////////////////////////////////
////// DECLARATIVE CHYRON MODULES /////
///////////////////////////////////////
///////////////////////////////////////

function _chyLovers(d){
    var p = d.photoData;
    var caught = d.caught({
        lover: {_CLASS_:"LoverPeep"}
    });
    if(caught.lover){
        if(caught.lover.isEmbarrassed){
            d.chyron = textStrings["outtaHere"];
        }else{
            p.caughtLovers = true;
            p.forceChyron = true;
            d.chyron = textStrings["getARoom"];
        }
        return true;
    }
    return false;
}
function _chyHats(d){
    var p = d.photoData;
    var caught = d.caught({
        hat: {_CLASS_:"NormalPeep", wearingHat:true}
    });
    if(caught.hat){
        p.audience = 1;
        p.caughtHat = true;
        d.chyron = textStrings["notCoolAnymore"];
        return true;
    }
    return false;
}
function _chyPeeps(d){
    var p = d.photoData;
    if(d.scene.camera.isOverTV(true)){
        d.chyron = textStrings["tvOnTv"];
    }else{
        var caught = d.caught({
            peeps: {_CLASS_:"NormalPeep", returnAll:true},
            crickets: {_CLASS_:"Cricket", returnAll:true}
        });
        if(caught.crickets.length>0){
            p.CAUGHT_A_CRICKET = true;
            p.CRICKET_COUNT_IN_PHOTO = caught.crickets.length;

            // Debug: log cricket count
            console.log("Caught crickets:", caught.crickets.length);

            if(caught.crickets.length==1){
                d.chyron = textStrings["cricky"];
            }else if(caught.crickets.length>=4){
                console.log("WAY TOO MANY CRICKETS!");
                d.chyron = textStrings["wayTooManyCrickets"];
                p.WAY_TOO_MANY_CRICKETS = true;
            }else{
                d.chyron = textStrings["tooManyCrickets"];
            }
        }else if(caught.peeps.length>0){
            if(caught.peeps.length==1){
                d.chyron = textStrings["normalPeep"];
            }else{
                d.chyron = textStrings["normalPeeps"];
            }
        }else{
            p.ITS_NOTHING = true;
            d.chyron = textStrings["wowNothing"];
        }
    }
    return true;
}

///////////////////////////////////////
///////////////////////////////////////
///// DECLARATIVE CUTTING MODULES /////
///////////////////////////////////////
///////////////////////////////////////

function _cutLovers(d){
    var p = d.photoData;
    if(p.caughtLovers){
        // Crickets
        d.audience_cutToTV();
        // MAKE LOVERS EMBARRASSED
        d.scene.world.peeps.filter(function(peep){
            return peep._CLASS_=="LoverPeep";
        }).forEach(function(lover){
            lover.makeEmbarrassed();
        });
        return true;
    }else{
        return false;
    }
}
function _cutHats(d){
    var p = d.photoData;
    if(p.caughtHat){
        // Only get the hat-wearers, make 'em take off the hat.
        d.audience_cutToTV(
            function(peep){ peep.takeOffHat(); },
            function(peep){ return peep.wearingHat; }
        );
        return true;
    }else{
        // And if not, have them decrease by 1 each time anyway.
        var hatPeeps = d.scene.world.peeps.slice(0).filter(function(peep){
            return peep.wearingHat;
        });
        if(hatPeeps.length>0){
            var randomIndex = Math.floor(Math.random()*hatPeeps.length);
            hatPeeps[randomIndex].takeOffHat(true);
        }
        return false;
    }
}
function _cutPeeps(d){
    var p = d.photoData;

    // Special case: WAY too many crickets - show 6 crickets watching TV
    if(p.WAY_TOO_MANY_CRICKETS){
        // No audience, just crickets
        d.audience_cutToTV();

        // Spawn 6 crickets watching the TV
        var tv = d.tv;
        for(var i=0; i<6; i++){
            var cricket = new Cricket(d.scene);
            cricket.watchTV();
            cricket.x = tv.x - 150 + (i * 50); // Spread them out in a row
            cricket.y = tv.y + Math.random() * 5; // Tiny offset for depth sorting
            d.scene.world.addProp(cricket);
        }

        // Also spawn the normal crickets
        var cricketsInPhoto = p.CRICKET_COUNT_IN_PHOTO || 1;
        var cricketsToSpawn = cricketsInPhoto * 3;

        for(var i=0; i<cricketsToSpawn; i++){
            var cricket = new Cricket(d.scene);
            cricket.x = Math.random() * Game.width;
            cricket.y = Math.random() * Game.height;

            if(Math.random() < 0.33){
                cricket.startWandering();
                CRICKET_COUNT++;
            }else{
                cricket.hopAwayTimeout = _s(1 + Math.random()*2);
            }

            d.scene.world.addProp(cricket);
        }

        // Check for cricket invasion!
        if(CRICKET_COUNT >= CRICKET_INVASION_THRESHOLD){
            setTimeout(function(){
                Game.sceneManager.gotoScene("CricketInvasion");
            }, _s(BEAT*4));
            return true;
        }

        _calmPeepsDown(d.scene);
        return true;
    }

    // Handle normal cricket spawning if we caught crickets
    if(p.CAUGHT_A_CRICKET){
        var cricketsInPhoto = p.CRICKET_COUNT_IN_PHOTO || 1;
        var cricketsToSpawn = cricketsInPhoto * 3; // Spawn 3x what was in photo

        for(var i=0; i<cricketsToSpawn; i++){
            var cricket = new Cricket(d.scene);

            // Random position
            cricket.x = Math.random() * Game.width;
            cricket.y = Math.random() * Game.height;

            // 1/3 stay, 2/3 run away
            if(Math.random() < 0.33){
                // Stay and wander around
                cricket.startWandering();
                CRICKET_COUNT++;
            }else{
                // Run away after a short time
                cricket.hopAwayTimeout = _s(1 + Math.random()*2);
            }

            d.scene.world.addProp(cricket);
        }

        // Check for cricket invasion!
        if(CRICKET_COUNT >= CRICKET_INVASION_THRESHOLD){
            // Trigger cricket invasion ending
            setTimeout(function(){
                Game.sceneManager.gotoScene("CricketInvasion");
            }, _s(BEAT*4));
            return true;
        }

        // Crickets calm people down
        _calmPeepsDown(d.scene);
    }

    d.audience_cutToTV();
    return true;
}

// Helper function to calm down angry peeps
function _calmPeepsDown(scene){
    var cricketCalm = Math.min(CRICKET_COUNT / CRICKET_INVASION_THRESHOLD, 1);

    scene.world.peeps.forEach(function(peep){
        // Reduce aggression for angry/nervous types
        if(peep._CLASS_ == "AngryPeep" || peep._CLASS_ == "NervousPeep"){
            if(Math.random() < cricketCalm * 0.3){
                // Replace with normal peep
                var normalPeep = new NormalPeep(scene);
                normalPeep.setType(peep.type);
                scene.world.replacePeep(peep, normalPeep);
            }
        }
    });
}
