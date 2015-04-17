require([], function(){
    // detect WebGL
    if( !Detector.webgl ){
        Detector.addGetWebGLMessage();
        throw 'WebGL Not Available'
    }
    // setup webgl renderer full page
    var pauseAnim = false;
    var renderer	= new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );
    // setup a scene and camera
    var scene	= new THREE.Scene();
    var camera	= new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 1000);

    var camera_cf = new THREE.Matrix4();
    camera_cf.multiply(new THREE.Matrix4().makeRotationY(-THREE.Math.degToRad(90)));


    // declare the rendering loop
    var onRenderFcts= [];

    // handle window resize events
    var winResize	= new THREEx.WindowResize(renderer, camera)

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

    //Create sun
    var sunGeo = new THREE.SphereGeometry(1, 20, 20);
  //  var sunMat = new THREE.MeshPhongMaterial({emissive:0xF4F813});
    var sunMat = new THREE.MeshPhongMaterial({emissive:0xF4F813});
    sunMat.shininess = 1;
    var sun = new THREE.Mesh(sunGeo, sunMat);

    var sun_cf = new THREE.Matrix4();
    var sunStartX = -10;
    var sunStartY = 20;
    var sunStartZ = 0;
    sun_cf.multiply(new THREE.Matrix4().makeTranslation(sunStartX, sunStartY, sunStartZ));

    var sunlight = new THREE.PointLight('white', 1.4);
    sunlight.castShadow =true;
    sun.add( sunlight );

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

    //Make helicopter and associated variables
    var propSpeed = 0;
    var GRAVITY = 9.8;

    var heli = new Helicopter(4, 2);
    heli.model.scale.set(.2,.2,.2);
    scene.add(heli.model);
    var heli_cf = new THREE.Matrix4();
    heli_cf.multiply(new THREE.Matrix4().makeTranslation(-15, 0, 0));


    //Create and randomly place trees

    var NUM_TREES = 36;
    var TREE_SPACING = 5;

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
            var spaceX = startX + (Math.floor((Math.random() * 100 ) )%Math.floor((TREE_SPACING)) *.7);
            var spaceZ = startZ + (Math.floor((Math.random() * 100 ) )%Math.floor((TREE_SPACING)) *.7);

            selectedTree.position.set(spaceX+3,0, spaceZ);
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




    //Collection ball:  Purpose - to gain points
    var itemGeo = new THREE.SphereGeometry(.5, 20, 20);
    //  var sunMat = new THREE.MeshPhongMaterial({emissive:0xF4F813});
    var itemMat = new THREE.MeshPhongMaterial({emissive:0xFF0000});
    //sunMat.shininess = 1;
    var item = new THREE.Mesh(itemGeo, itemMat);

    var item_cf = new THREE.Matrix4();
    var itemStartX = -15;
    var itemStartY = 5;
    var itemStartZ = 0;
    item_cf.multiply(new THREE.Matrix4().makeTranslation(itemStartX, itemStartY, itemStartZ));

    scene.add(item);




var in_cockpit = false;

    var active_cf = camera_cf;

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
            var multiplier = .5;   //VERY LIKELY TO CHANGE
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
            tran = new THREE.Vector3(tran.x - 6, tran.y + 1.5, tran.z);
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

        //item
        item_cf.decompose(tran, quat, vscale);
        item.position.copy(tran);
        item.quaternion.copy(quat);

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
//console.log(event.keyCode);

        if(!pauseAnim) {
            //Standard helicopter control
            if (!event.shiftKey) {
                if (code == 65) {  //left
                    heli_cf.multiply(new THREE.Matrix4().makeRotationX(-THREE.Math.degToRad(3)));
                }
                else if (code == 87) { //up
                    heli_cf.multiply(new THREE.Matrix4().makeRotationZ(-THREE.Math.degToRad(3)));
                }
                else if (code == 68) { //right
                    heli_cf.multiply(new THREE.Matrix4().makeRotationX(THREE.Math.degToRad(3)));
                }
                else if (code == 83) { //down
                    heli_cf.multiply(new THREE.Matrix4().makeRotationZ(THREE.Math.degToRad(3)));
                }
                else if (code == 81) { //turn left
                    heli_cf.multiply(new THREE.Matrix4().makeRotationY(THREE.Math.degToRad(3)));
                }

                else if (code == 69) { //turn right
                    heli_cf.multiply(new THREE.Matrix4().makeRotationY(-THREE.Math.degToRad(3)));
                }

                else if (code == 90) { //slash  Slower propeller speed
                    if (propSpeed - 10 >= 0)
                        propSpeed -= 10;
                }
                else if (code == 88) { //apostrophe  Faster propeller speed
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


                //Translate
                //if (code == 37) {  //left
                //    active_cf.multiply(new THREE.Matrix4().makeTranslation(-.5, 0, 0));
                //
                //}
                //else if (code == 38) { //up
                //    active_cf.multiply(new THREE.Matrix4().makeTranslation(0, .5, 0));
                //
                //}
                //else if (code == 39) { //right
                //    active_cf.multiply(new THREE.Matrix4().makeTranslation(.5, 0, 0));
                //
                //}
                //else if (code == 40) { //down
                //    active_cf.multiply(new THREE.Matrix4().makeTranslation(0, -.5, 0));
                //
                //}
                //else if (code == 191) { //slash
                //    active_cf.multiply(new THREE.Matrix4().makeTranslation(0, 0, .5));
                //
                //}
                //else if (code == 222) { //apostrophe
                //    active_cf.multiply(new THREE.Matrix4().makeTranslation(0, 0, -.5));
                //
                //}

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