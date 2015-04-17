
Helicopter = function(mainBlades, tailBlades) {

    var heliColor = 0x9B1730;

    var heli_tex = THREE.ImageUtils.loadTexture("textures/helicopter256.jpg");
    heli_tex.repeat.set(4,4);
    heli_tex.wrapS = THREE.RepeatWrapping;
    heli_tex.wrapT = THREE.RepeatWrapping;

    var bodyGeo = new THREE.SphereGeometry(1, 30, 30);
    var bodyMat = new THREE.MeshPhongMaterial({color: heliColor, map:heli_tex});
    var body = new THREE.Mesh(bodyGeo, bodyMat);

    var tailGeo = new THREE.CylinderGeometry(.7,.15,7.5, 20)
    var tailMat = new THREE.MeshPhongMaterial({color: heliColor, map:heli_tex});
    var tail = new THREE.Mesh(tailGeo, tailMat);

    var tailPieceGeo = new THREE.BoxGeometry(1,1,1);
    var tailPieceMat = new THREE.MeshPhongMaterial({color: heliColor, map:heli_tex});
    var tailPiece = new THREE.Mesh(tailPieceGeo, tailPieceMat);

    var propBaseGeo = new THREE.BoxGeometry(2.5,.5, 1.4);
    var propBaseMat = new THREE.MeshPhongMaterial({color: heliColor, map:heli_tex});
    var propBase = new THREE.Mesh(propBaseGeo, propBaseMat);

    var mainProp = Propeller(mainBlades, 7);
    var tailProp = Propeller(tailBlades, 3);

    var skidGeo = new THREE.BoxGeometry(5.2,.1,.25);
    var skidMat = new THREE.MeshPhongMaterial({color: 0x848484});
    var skid = new THREE.Mesh(skidGeo, skidMat);

    var skidConnectGeo = new THREE.CylinderGeometry(.1,.1,1.2, 20)
    var skidConnectMat = new THREE.MeshPhongMaterial({color: 0x848484});
    var skidConnect = new THREE.Mesh(skidConnectGeo, skidConnectMat);

    var spotlightBulbGeo = new THREE.SphereGeometry(.148, 10, 10);
    var spotlightBulbMat = new THREE.MeshPhongMaterial({color: 0x848484});
    var spotlightBulb = new THREE.Mesh(spotlightBulbGeo, spotlightBulbMat);

    var spotlightGeo = new THREE.CylinderGeometry(.15,.3,.3, 20, 20, true)
    var spotlightMat = new THREE.MeshPhongMaterial({color: 0x848484});
    var spotlight = new THREE.Mesh(spotlightGeo, spotlightMat);


    var helicopter_group = new THREE.Group();
    var mainProp_cf = new THREE.Matrix4();
    var tailProp_cf = new THREE.Matrix4();

    mainProp_cf.multiply(new THREE.Matrix4().makeTranslation(0, 2.05, 0));
    tailProp_cf.makeTranslation(-7.3,.8,.17);
    tailProp_cf.multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));



    var spotlight_cf = new THREE.Matrix4();
    spotlight_cf.multiply(new THREE.Matrix4().makeTranslation(3.1, -1.2,0));
    spotlight_cf.multiply(new THREE.Matrix4().makeRotationZ(THREE.Math.degToRad(35)));

    var tran = new THREE.Vector3();
    var quat = new THREE.Quaternion();
    var vscale = new THREE.Vector3();


    //Window (reflection)
    var path = "textures/Sky/";
    var images = [path + "posx.png", path + "negx.png",
        path + "posy.png", path + "negy.png",
        path + "posz.png", path + "negz.png"];


    var cubemap = THREE.ImageUtils.loadTextureCube( images );

    var windowGeo = new THREE.SphereGeometry(2, 30, 20);
    var windowMat = new THREE.MeshBasicMaterial ({envMap:cubemap});
    var window = new THREE.Mesh (windowGeo, windowMat);


    //Build Helicopter
    body.scale.set(4, 1.8, 1.4);
    helicopter_group.add(body);

    //window
    window.scale.set(1.7,.65,.71);
    window.position.set(.50,.30,0 );

    helicopter_group.add(window);

    tail.scale.set(1,.8,.6);
    tail.position.set(-4.4,.8, 0);
    tail.rotateZ(-Math.PI/2);
    helicopter_group.add(tail);

    propBase.position.set(-.5, 1.6, 0);
    helicopter_group.add(propBase);


    var botTail = tailPiece.clone();
    botTail.position.set(-7.4,.4, 0);
    botTail.rotateZ(-Math.PI / 4.5);
    botTail.scale.set(.3,.8,.07);
    helicopter_group.add(botTail);

    var topTail = tailPiece.clone();
    topTail.position.set(-7.4,1.2, 0);
    topTail.rotateZ(Math.PI / 4.1);
    topTail.scale.set(.3, 1.4,.07);
    helicopter_group.add(topTail);


    //Propellers
    mainProp_cf.decompose (tran, quat, vscale);
    mainProp.position.copy(tran);
    mainProp.quaternion.copy(quat);
    helicopter_group.add(mainProp);


    tailProp_cf.decompose (tran, quat, vscale);
    tailProp.position.copy(tran);
    tailProp.quaternion.copy(quat);
    tailProp.scale.set(.3,.6,.3);
    helicopter_group.add(tailProp);


    //Skids
    var skidConBackLeft = skidConnect.clone();
    skidConBackLeft.position.set(-1.5, -1.5, -.9);
    skidConBackLeft.rotateX(Math.PI / 9);
    helicopter_group.add(skidConBackLeft);

    var skidConFrontLeft = skidConBackLeft.clone();
    skidConFrontLeft.translateX(3);
    helicopter_group.add(skidConFrontLeft);

    var skidConBackRight = skidConnect.clone();
    skidConBackRight.position.set(-1.5, -1.5,.9);
    skidConBackRight.rotateX(-Math.PI / 9);
    helicopter_group.add(skidConBackRight);

    var skidConFrontRight = skidConBackRight.clone();
    skidConFrontRight.translateX(3);
    helicopter_group.add(skidConFrontRight);

    var leftSkid = skid.clone();
    leftSkid.position.set(.4,-2.05, -1.07);
    helicopter_group.add(leftSkid);

    var rightSkid = skid.clone();
    rightSkid.position.set(.4,-2.05, 1.07);
    helicopter_group.add(rightSkid);

    //Spotlight
    spotlight_cf.decompose (tran, quat, vscale);
    spotlight.position.copy(tran);
    spotlight.quaternion.copy(quat);


    var frontLight	= new THREE.SpotLight('white', 1.5, 0, Math.PI / 6);
    frontLight.target = spotlight;
    frontLight.castShadow=true;


    spotlightBulb.add( frontLight );
    spotlight.add(spotlightBulb);
    helicopter_group.add(spotlight);

    return {
        model : helicopter_group,
        mainProp_cf: mainProp_cf,
        tailProp_cf: tailProp_cf,
        spotlight_cf: spotlight_cf,
        mainProp: mainProp,
        tailProp: tailProp,
        spotlight: spotlight,
        spotlightLight: frontLight
    };
}

/* Inherit Helicopter from THREE.Object3D */
Helicopter.prototype = Object.create (THREE.Object3D.prototype);
Helicopter.prototype.constructor = Helicopter;