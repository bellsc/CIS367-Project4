require([], function(){
    // detect WebGL
    if( !Detector.webgl ){
        Detector.addGetWebGLMessage();
        throw 'WebGL Not Available'
    }
    // setup webgl renderer full page
    var pauseAnim = false;
    var renderer	= new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight - 100 );
    //document.body.appendChild( renderer.domElement );
    document.getElementById("game").appendChild( renderer.domElement );

    // setup a scene and camera
    var scene	= new THREE.Scene();
    var camera	= new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 1000);

    var camera_cf = new THREE.Matrix4();
    camera_cf.multiply(new THREE.Matrix4().makeRotationY(-THREE.Math.degToRad(90)));


    // declare the rendering loop
    var onRenderFcts= [];

    // handle window resize events
   // var winResize	= new THREEx.WindowResize(renderer, camera)

    //////////////////////////////////////////////////////////////////////////////////
    //		default 3 points lightning					//
    //////////////////////////////////////////////////////////////////////////////////

    var prevSpotlightIntensity = 0;
    var prevSunlightIntensity = 0;

    var ambientLight= new THREE.AmbientLight( 0x020202 )
    scene.add( ambientLight)
    var frontLight	= new THREE.DirectionalLight('white',.4)
    frontLight.position.set(0.5, 0.5, 2)
    scene.add( frontLight )
    var backLight	= new THREE.DirectionalLight('white', 0.4)
    backLight.position.set(-0.5, -0.5, -2)
    scene.add( backLight )



    //////////////////////////////////////////////////////////////////////////////////
    //		Objects                                                     			//
    //////////////////////////////////////////////////////////////////////////////////

    //Make helicopter and associated variables
    var propSpeed = 0;
    var GRAVITY = 9.8;
    var heliScale = .2;
    var heli = new Helicopter(4, 2);
    heli.model.scale.set(heliScale,heliScale,heliScale);
    scene.add(heli.model);
    var heli_cf = new THREE.Matrix4();
    heli_cf.multiply(new THREE.Matrix4().makeTranslation(-15, 0, 0));


    //Collection ball:  Purpose is for the player to gain points when touched
    var itemRad = .5;
    var itemGeo = new THREE.SphereGeometry(itemRad, 20, 20);
    var itemProp = {
        vertexShader: document.getElementById("vs0").textContent,
        fragmentShader: document.getElementById("fs0").textContent,
        uniforms :{
            color1 : {
                type: "v4",
                value: new THREE.Vector4(0.0, 0.0, 0.0, 1.0)
            },
            color2 : {
                type: "v4",
                value: new THREE.Vector4(1.0, 1.0, 1.0, 1.0)
            },
            color3 : {
                type: "v4",
                value: new THREE.Vector4(0.0, 0.0, 1.0, 1.0)
            }
        }
    };

    var shaderMat = new THREE.ShaderMaterial(itemProp);
    var item = new THREE.Mesh(itemGeo, shaderMat);

    var item_cf = new THREE.Matrix4();
    var itemStartX = -15;
    var itemStartY = 3;
    var itemStartZ = 0;
    item_cf.multiply(new THREE.Matrix4().makeTranslation(itemStartX, itemStartY, itemStartZ));
    scene.add(item);



    //Create sun
    var sunGeo = new THREE.SphereGeometry(1, 20, 20);
    var sunMat = new THREE.MeshPhongMaterial({emissive:0xF4F813});
    sunMat.shininess = 1;
    var sun = new THREE.Mesh(sunGeo, sunMat);

    var sun_cf = new THREE.Matrix4();
    var sunStartX = 40;
    var sunStartY = 40;
    var sunStartZ = 40;
    sun_cf.multiply(new THREE.Matrix4().makeTranslation(sunStartX, sunStartY, sunStartZ));

    //var sunlight = new THREE.PointLight('white', 1.4);
    var sunlight = new THREE.PointLight('white', 1.9);
    sunlight.castShadow =true;
   // sun.add( sunlight );
    item.add( sunlight );

    scene.add(sun);


    var grass_tex = THREE.ImageUtils.loadTexture("textures/grass256.jpg");
    grass_tex.repeat.set(10,10);
    grass_tex.wrapS = THREE.RepeatWrapping;
    grass_tex.wrapT = THREE.RepeatWrapping;

    var groundPlane = new THREE.PlaneBufferGeometry(60, 60, 10, 10);
    var groundMat = new THREE.MeshPhongMaterial({ ambient:0x1d6438, map:grass_tex});
    groundMat.shininess = 5;
    var ground = new THREE.Mesh (groundPlane, groundMat);
    ground.position.set(0, -.42, 0);
    ground.rotateX(THREE.Math.degToRad(-90));
    scene.add (ground);

    //scene.add (new THREE.AxisHelper(4));



    //Create and randomly place trees
    var NUM_TREES = 16;
    var TREE_SPACING = 12;

    var avgHeight = 14;
    var variation = 8;

    var treeTypes = [];
    //10 different kinds of trees
    for(var i = 0; i < 10 ; i++){
        var height = avgHeight - variation/2 + Math.floor((Math.random() * 10 )) % variation;
        var leafRows = 3 + Math.floor((Math.random() * 10 ) ) % 2;
        var barktype = Math.floor((Math.random() * 10 )) % 4;
        treeTypes.push(new Tree(height, leafRows, barktype));
    }

    //place the trees
    var rootTreeNum = Math.sqrt(NUM_TREES);
    var startPos = rootTreeNum * TREE_SPACING/2;

    var startX = startPos;
    var startZ = startPos;
    for(var i = 0; i<=rootTreeNum; i++){
        for(var j = 0; j <= rootTreeNum; j++){
            var randTree = Math.floor((Math.random() * 10 ));
            var selectedTree = treeTypes[randTree].clone();
            var spaceX = startX + (Math.floor((Math.random() * 100 ) )%Math.floor((TREE_SPACING)) *.7) - 5;
            var spaceZ = startZ + (Math.floor((Math.random() * 100 ) )%Math.floor((TREE_SPACING)) *.7) - 5;

            selectedTree.position.set(spaceX,0, spaceZ);
            selectedTree.scale.set(.2,.2,.2);
            scene.add(selectedTree);

            startZ -= TREE_SPACING;

        }
        startZ = startPos;
        startX -= TREE_SPACING;
    }

    //Movable tree
    var setTree = new Tree(14, 3, 1);
    setTree.scale.set(.2,.2,.2);
    //setTree.position.set(3, 0, 0);
    scene.add(setTree);
    var tree_cf = new THREE.Matrix4();
    tree_cf.multiply(new THREE.Matrix4().makeTranslation(3, 0, 0));









    //Animation variables

    var in_cockpit = false;
    var active_cf = camera_cf;
    var gameScore = 0;
    var scoreToWin = 100;
    var curve;
    var curveIndex = 0;
    var forwardCurve = true;

    var curvePoints = 250;

    //variables for randomly placing item
    var startX = -25;
    var varX = 30;
    var startY = 4;
    var varY = 8;
    var startZ = -25;
    var varZ = 30;

    //Item's initial curve to follow
    item.position.copy(new THREE.Vector3(-10, 4, 0));
    curve = new THREE.CubicBezierCurve3(
        new THREE.Vector3( 0, 10, 0 ),
        new THREE.Vector3( 6, 5, 6 ),
        new THREE.Vector3( 12, 20, 0 ),
        new THREE.Vector3( 6, 5, -6 )

    );
    var bezierPointArr = curve.getPoints( curvePoints );

    //Shows curve
    var helperLineGeometry = new THREE.Geometry();
    helperLineGeometry.vertices = curve.getPoints( curvePoints );
    var helperLineMaterial = new THREE.LineBasicMaterial( { color : 0xff0000 } );
    var helperLine = new THREE.Line( helperLineGeometry, helperLineMaterial );
    scene.add(helperLine);



    //Animation
    onRenderFcts.push(function(delta, now){

        var tran = new THREE.Vector3();
        var quat = new THREE.Quaternion();
        var vscale = new THREE.Vector3();

        if (pauseAnim) return;

        //logic for changing helicopter position
        var modelOrigin = new THREE.Vector4().applyMatrix4(heli_cf);
        if(modelOrigin.y >= 0){
            var gravVec = new THREE.Vector4();
            gravVec.y = -GRAVITY;
            gravVec.w = 0;;

            var liftForce = GRAVITY;
            var multiplier = .8;   //VERY LIKELY TO CHANGE
            if(modelOrigin.y >= 0 && modelOrigin.y < 1){
                liftForce = propSpeed * multiplier;
            }
            else{
                liftForce = propSpeed * multiplier / modelOrigin.y;
            }

            var modelLiftVec = new THREE.Vector4();
            modelLiftVec.y = liftForce;
            modelLiftVec.w = 0;
            var worldLiftVec = modelLiftVec.applyMatrix4(heli_cf);
            worldLiftVec.add(gravVec);

            if(modelOrigin.y > 0 || (modelOrigin.y == 0 && worldLiftVec.y > 0)){
                heli_cf = (new THREE.Matrix4().multiply(new THREE.Matrix4().makeTranslation(
                    .6  * worldLiftVec.x * delta,
                     worldLiftVec.y * delta,
                    .6 * worldLiftVec.z * delta))).multiply(heli_cf);
            }
        }
        if(modelOrigin.y < 0){
            heli_cf.multiply(new THREE.Matrix4().makeTranslation(0, -modelOrigin.y, 0));
        }




        //Update coordinate frames for other objects

        //Whole Helicopter
        heli_cf.decompose(tran, quat, vscale);
        heli.model.position.copy(tran);
        heli.model.quaternion.copy(quat);

        //Camera is attached to helicopter
        if(in_cockpit){
            tran = new THREE.Vector3(tran.x, tran.y +.15, tran.z);
            camera.position.copy(tran);
            camera.quaternion.copy(quat)
            camera_cf.decompose(tran, quat, vscale);
            camera.quaternion.multiplyQuaternions(camera.quaternion,quat);
        }
        else {
            tran = new THREE.Vector3(tran.x - 10, tran.y + 2, tran.z);
            camera.position.copy(tran);
            camera_cf.decompose(tran, quat, vscale);
            camera.quaternion.copy(quat);
        }

        //Main propeller
        heli.mainProp_cf.multiply(new THREE.Matrix4().makeRotationY(THREE.Math.degToRad(delta * propSpeed * 9)));
        heli.mainProp_cf.decompose(tran, quat, vscale);
        heli.mainProp.position.copy(tran);
        heli.mainProp.quaternion.copy(quat);

        //Tail propeller
        heli.tailProp_cf.multiply(new THREE.Matrix4().makeRotationY(THREE.Math.degToRad(delta * propSpeed * 9)));
        heli.tailProp_cf.decompose(tran, quat, vscale);
        heli.tailProp.position.copy(tran);
        heli.tailProp.quaternion.copy(quat);

        //Spotlight on helicopter
        heli.spotlight_cf.decompose(tran, quat, vscale);
        heli.spotlight.position.copy(tran);
        heli.spotlight.quaternion.copy(quat);

        //Movable tree
        tree_cf.decompose(tran, quat, vscale);
        setTree.position.copy(tran);
        setTree.quaternion.copy(quat);

        //Sun
        sun_cf.decompose(tran, quat, vscale);
        sun.position.copy(tran);
        sun.quaternion.copy(quat);





        //Check to see if helicopter intersected the item
        var maxDistToIntersect = itemRad + heli.boundingSphereRad * heliScale;
        var dx = heli.model.position.x - item.position.x;
        var dy = heli.model.position.y - item.position.y;
        var dz = heli.model.position.z - item.position.z;

        var distToItem = Math.sqrt(dx*dx+dy*dy+dz*dz);
        if(distToItem < maxDistToIntersect){
            //collision

            //move the item to another position
            var x = startX + Math.random() * varX;
            var y = startY + Math.random() * varY;
            var z = startZ + Math.random() * varZ;
            item.position.copy(new THREE.Vector3(x, y, z));

            var randCurvePoints = [
                new THREE.Vector3( x, y+10, z ),
                new THREE.Vector3( x+6, y+5, z+6 ),
                new THREE.Vector3( x+12, y+15, z ),
                new THREE.Vector3( x+6, y+5, z-6 )
            ];

            //Shuffle randCurvePoints
            for(var i = 0; i < 4; i++){
                var randIndex = Math.floor(Math.random() * 10) % 4;
                var temp = randCurvePoints[randIndex];
                randCurvePoints[randIndex] = randCurvePoints[i];
                randCurvePoints[i] = temp;
            }


            //Change curve
            curve = new THREE.CubicBezierCurve3(
                randCurvePoints[0],
                randCurvePoints[1],
                randCurvePoints[2],
                randCurvePoints[3]

            );

            //Remove old line and create new one
            scene.remove(helperLine);
            bezierPointArr = curve.getPoints( curvePoints );
            helperLineGeometry = new THREE.Geometry();
            helperLineGeometry.vertices = curve.getPoints( curvePoints );
            helperLine = new THREE.Line( helperLineGeometry, helperLineMaterial );
            scene.add(helperLine);


            //update score
            if(gameScore >= scoreToWin){
                console.log("win");
                document.getElementById("scoreLine").innerHTML = "You win!";
                //document.getElementById("winMsg").style.display = block;
            }
            else{
                gameScore += 10;
                document.getElementById("gameScore").innerHTML = "" + gameScore;
            }


        }
        else{
             //move item along curve and rotate it
            item.position.copy(bezierPointArr[curveIndex]);
            item_cf.multiply(new THREE.Matrix4().makeRotationY(THREE.Math.degToRad(3.5)));
            item_cf.multiply(new THREE.Matrix4().makeRotationZ(THREE.Math.degToRad(3.5)));

            item_cf.decompose(tran, quat, vscale);
            item.quaternion.copy(quat);

            if(forwardCurve) {
                if (++curveIndex > curvePoints) {
                    curveIndex = curvePoints - 1;
                    forwardCurve = false;
                }
            }
            else{
                 if(--curveIndex < 0){
                     curveIndex = 0;
                     forwardCurve = true;
                 }
             }

        }




    });


    //////////////////////////////////////////////////////////////////////////////////
    //		render the scene						//
    //////////////////////////////////////////////////////////////////////////////////
    onRenderFcts.push(function(){
        renderer.render( scene, camera );
    })

    //////////////////////////////////////////////////////////////////////////////////
    //		Rendering Loop runner						//
    //////////////////////////////////////////////////////////////////////////////////
    var lastTimeMsec= null
    requestAnimationFrame(function animate(nowMsec){
        // keep looping
        requestAnimationFrame( animate );
        // measure time
        lastTimeMsec	= lastTimeMsec || nowMsec-1000/60
        var deltaMsec	= Math.min(200, nowMsec - lastTimeMsec)
        lastTimeMsec	= nowMsec
        // call each update function
        onRenderFcts.forEach(function(onRenderFct){
            onRenderFct(deltaMsec/1000, nowMsec/1000)
        })
    })


    //Keyboard listener
    document.onkeydown = function(event){
        var code = event.keyCode;
        var key = String.fromCharCode(event.keyCode || event.charCode);

        //Pause - freezes everything
        if (key == 'P') {
            pauseAnim ^= true;
        }

        if(!pauseAnim) {
            //Standard helicopter control
            if (!event.shiftKey) {
                if (key == 'A') {  //left
                    heli_cf.multiply(new THREE.Matrix4().makeRotationX(-THREE.Math.degToRad(3)));
                }
                else if (key == 'W') { //up
                    heli_cf.multiply(new THREE.Matrix4().makeRotationZ(-THREE.Math.degToRad(3)));
                }
                else if (key == 'D') { //right
                    heli_cf.multiply(new THREE.Matrix4().makeRotationX(THREE.Math.degToRad(3)));
                }
                else if (key == 'S') { //down
                    heli_cf.multiply(new THREE.Matrix4().makeRotationZ(THREE.Math.degToRad(3)));
                }
                else if (key == 'Q') { //turn left
                    heli_cf.multiply(new THREE.Matrix4().makeRotationY(THREE.Math.degToRad(3)));
                }

                else if (key == 'E') { //turn right
                    heli_cf.multiply(new THREE.Matrix4().makeRotationY(-THREE.Math.degToRad(3)));
                }

                else if (key == 'Z') { //Slower propeller speed
                    if (propSpeed - 10 >= 0)
                        propSpeed -= 10;
                }
                else if (key == 'X') { //Faster propeller speed
                    propSpeed += 10;
                }

                else if (key == 'C') {  //cockpit
                    in_cockpit ^= true;
                }


                //Select object
                else if (key == '9') {
                    //toggle spotlight
                    if (prevSpotlightIntensity == 0) {
                        prevSpotlightIntensity = heli.spotlightLight.intensity;
                        heli.spotlightLight.intensity = 0;
                    }
                    else {
                        heli.spotlightLight.intensity = prevSpotlightIntensity;
                        prevSpotlightIntensity = 0;
                    }
                }

                else if (key == '0') {
                    //toggle sunlight
                    if (prevSunlightIntensity == 0) {
                        prevSunlightIntensity = sunlight.intensity;
                        sunlight.intensity = 0;
                    }
                    else {
                        sunlight.intensity = prevSunlightIntensity;
                        prevSunlightIntensity = 0;
                    }

                }
            }


                else {  //Camera rotation
                    if (key == 'S') {  //Look down
                        active_cf.multiply(new THREE.Matrix4().makeRotationX(-THREE.Math.degToRad(5)));
                    }
                    else if (key == 'W') {  //Look up
                        active_cf.multiply(new THREE.Matrix4().makeRotationX(THREE.Math.degToRad(5)));
                    }
                    else if (key == 'D') {  //Look right
                        active_cf.multiply(new THREE.Matrix4().makeRotationY(-THREE.Math.degToRad(5)));
                    }
                    else if (key == 'A') {  //Look left
                        active_cf.multiply(new THREE.Matrix4().makeRotationY(THREE.Math.degToRad(5)));
                    }
                    else if (key == 'Q') {  //Spin left
                        active_cf.multiply(new THREE.Matrix4().makeRotationZ(-THREE.Math.degToRad(5)));
                    }
                    else if (key == 'E') {  //Spin right
                        active_cf.multiply(new THREE.Matrix4().makeRotationZ(THREE.Math.degToRad(5)));
                    }

                }

        }

    };

})