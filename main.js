/**
 * CIS 367 Computer Graphics project 4 - Simple Game
 * @author Scott Bell
 *
 * In this game, the player controls a helicopter.  The goal is to earn enough points
 * to win the game.  Points are earned by touching a moving ball in the scene.
 *
 */


var propSpeed = 0;
var GRAVITY = 9.8;
var scene;

//Animation variables
var in_cockpit = false;
var gameScore = 0;
var scoreToWin = 100;
var tran = new THREE.Vector3();
var quat = new THREE.Quaternion();
var vscale = new THREE.Vector3();

//variables for randomly placing item
var itemStartVec = new THREE.Vector3(-25, 4, -25);
var itemVarianceVec = new THREE.Vector3(30, 8, 30);

//Curve variables
var curve;
var curveIndex = 0;
var forwardCurve = true;
var curvePoints = 250;
var bezierPointArr;
var helperLineGeometry;
var helperLineMaterial;
var helperLine;


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
    scene	= new THREE.Scene();
    var camera	= new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 1000);

    var camera_cf = new THREE.Matrix4();
    camera_cf.multiply(new THREE.Matrix4().makeRotationY(-THREE.Math.degToRad(90)));

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
    //		Models                                                       			//
    //////////////////////////////////////////////////////////////////////////////////
    //Make helicopter
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
    item_cf.multiply(new THREE.Matrix4().makeTranslation(-15, 3, 0));
    scene.add(item);

    //Light for the item
    var light = new THREE.PointLight('white', 1.9);
    light.castShadow =true;
    item.add( light );

    //Item's initial curve to follow
    item.position.copy(new THREE.Vector3(-10, 4, 0));
    curve = new THREE.CubicBezierCurve3(
        new THREE.Vector3( 0, 10, 0 ),
        new THREE.Vector3( 6, 5, 6 ),
        new THREE.Vector3( 12, 20, 0 ),
        new THREE.Vector3( 6, 5, -6 )
    );
    bezierPointArr = curve.getPoints( curvePoints );

    //Shows curve
    helperLineGeometry = new THREE.Geometry();
    helperLineGeometry.vertices = curve.getPoints( curvePoints );
    helperLineMaterial = new THREE.LineBasicMaterial( { color : 0xff0000 } );
    helperLine = new THREE.Line( helperLineGeometry, helperLineMaterial );
    scene.add(helperLine);


    //scene.add (new THREE.AxisHelper(4));
    var NUM_TREES = 16;
    var TREE_SPACING = 12;
    var avgHeight = 14;
    var variation = 8;

    renderEnvironmentAndTrees(NUM_TREES, TREE_SPACING, avgHeight, variation);


    //////////////////////////////////////////////////////////////////////////////////
    //		Animation                                                     			//
    //////////////////////////////////////////////////////////////////////////////////

    onRenderFcts.push(function(delta, now){

        if (pauseAnim) return;

        //Update helicopter coordinate frame
        heli_cf = updateHeli_cf(heli_cf, delta);

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



        //Check to see if helicopter intersected the item
        var maxDistToIntersect = itemRad + heli.boundingSphereRad * heliScale;
        var dx = heli.model.position.x - item.position.x;
        var dy = heli.model.position.y - item.position.y;
        var dz = heli.model.position.z - item.position.z;

        var distToItem = Math.sqrt(dx*dx+dy*dy+dz*dz);
        if(distToItem < maxDistToIntersect){
            handleCollision(item);
        }
        else{
             //move item along curve and rotate it
            moveItem(item, item_cf);

        }
    });


    //////////////////////////////////////////////////////////////////////////////////
    //		render the scene						                                //
    //////////////////////////////////////////////////////////////////////////////////
    onRenderFcts.push(function(){
        renderer.render( scene, camera );
    })

    //////////////////////////////////////////////////////////////////////////////////
    //		Rendering Loop runner						                            //
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


    //////////////////////////////////////////////////////////////////////////////////
    //		Keyboard Listener                               						//
    //////////////////////////////////////////////////////////////////////////////////
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

                else if (key == 'C') {  //cockpit view or outside view
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
                        prevSunlightIntensity = light.intensity;
                        light.intensity = 0;
                    }
                    else {
                        light.intensity = prevSunlightIntensity;
                        prevSunlightIntensity = 0;
                    }

                }
            }

            else {  //Camera rotation
                if (key == 'S') {  //Look down
                    camera_cf.multiply(new THREE.Matrix4().makeRotationX(-THREE.Math.degToRad(5)));
                }
                else if (key == 'W') {  //Look up
                    camera_cf.multiply(new THREE.Matrix4().makeRotationX(THREE.Math.degToRad(5)));
                }
                else if (key == 'D') {  //Look right
                    camera_cf.multiply(new THREE.Matrix4().makeRotationY(-THREE.Math.degToRad(5)));
                }
                else if (key == 'A') {  //Look left
                    camera_cf.multiply(new THREE.Matrix4().makeRotationY(THREE.Math.degToRad(5)));
                }
                else if (key == 'Q') {  //Spin left
                    camera_cf.multiply(new THREE.Matrix4().makeRotationZ(-THREE.Math.degToRad(5)));
                }
                else if (key == 'E') {  //Spin right
                    camera_cf.multiply(new THREE.Matrix4().makeRotationZ(THREE.Math.degToRad(5)));
                }

            }
        }
    };

})


function handleCollision(item ){

    //move the item to another position
    var x = itemStartVec.x + Math.random() * itemVarianceVec.x;
    var y = itemStartVec.y + Math.random() * itemVarianceVec.y;
    var z = itemStartVec.z + Math.random() * itemVarianceVec.z;
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
    gameScore += 10;
    if(gameScore >= scoreToWin){
        console.log("win");
        document.getElementById("scoreLine").innerHTML = "You win!";
    }
    else{
        document.getElementById("gameScore").innerHTML = "" + gameScore;
    }

}


function updateHeli_cf(heli_cf, delta){
    //logic for changing helicopter position
    var modelOrigin = new THREE.Vector4().applyMatrix4(heli_cf);
    if(modelOrigin.y >= 0){
        var gravVec = new THREE.Vector4();
        gravVec.y = -GRAVITY;
        gravVec.w = 0;

        var liftForce = GRAVITY;
        var multiplier = .8;
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

    return heli_cf;
}

function renderEnvironmentAndTrees(numTrees, spacing, avgHeight, variation){
    //Create sun - no light from it in this project

    var sunGeo = new THREE.SphereGeometry(1, 20, 20);
    var sunMat = new THREE.MeshPhongMaterial({emissive:0xF4F813});
    sunMat.shininess = 1;
    var sun = new THREE.Mesh(sunGeo, sunMat);
    var sunStartX = 40;
    var sunStartY = 40;
    var sunStartZ = 40;
    sun.position.copy(new THREE.Vector3(sunStartX, sunStartY, sunStartZ));
    scene.add(sun);


    //Ground
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

    //Create and randomly place trees
    renderTrees(numTrees, spacing, avgHeight, variation);
}


function renderTrees(numTrees, spacing, avgHeight, variation){

    var treeTypes = [];
    //10 different kinds of trees
    for(var i = 0; i < 10 ; i++){
        var height = avgHeight - variation/2 + Math.floor((Math.random() * 10 )) % variation;
        var leafRows = 3 + Math.floor((Math.random() * 10 ) ) % 2;
        var barktype = Math.floor((Math.random() * 10 )) % 4;
        treeTypes.push(new Tree(height, leafRows, barktype));
    }


    //place the trees
    var rootTreeNum = Math.sqrt(numTrees);
    var startPos = rootTreeNum * spacing/2;

    var startX = startPos;
    var startZ = startPos;
    for(var i = 0; i<=rootTreeNum; i++){
        for(var j = 0; j <= rootTreeNum; j++){
            var randTree = Math.floor((Math.random() * 10 ));
            var selectedTree = treeTypes[randTree].clone();
            var spaceX = startX + (Math.floor((Math.random() * 100 ) )%Math.floor((spacing)) *.7) - 5;
            var spaceZ = startZ + (Math.floor((Math.random() * 100 ) )%Math.floor((spacing)) *.7) - 5;

            selectedTree.position.set(spaceX,0, spaceZ);
            selectedTree.scale.set(.2,.2,.2);
            scene.add(selectedTree);

            startZ -= spacing;

        }
        startZ = startPos;
        startX -= spacing;
    }
}

function moveItem(item, item_cf){
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