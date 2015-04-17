
Tree = function(trunkHeight, leafRows, barkType) {

    //Textures
    var leaves_tex = THREE.ImageUtils.loadTexture("textures/bigleaves512.jpg");

    leaves_tex.repeat.set(4,4);
    leaves_tex.wrapS = THREE.RepeatWrapping;
    leaves_tex.wrapT = THREE.RepeatWrapping;

    var barkTexName = "textures/lightbrownbark256.jpg";
    if(barkType == 1){
        barkTexName = "textures/brownbark256.jpg";
    }
    else if(barkType == 2){
        barkTexName = "textures/whitebark512.jpg";
    }
    else if(barkType == 3){
        barkTexName = "textures/darkbark256.jpg";
    }


    var bark_tex = THREE.ImageUtils.loadTexture(barkTexName);
    bark_tex.repeat.set(4,4);
    bark_tex.wrapS = THREE.RepeatWrapping;
    bark_tex.wrapT = THREE.RepeatWrapping;


    var trunkRad = .07 * trunkHeight;

    var trunkBaseGeo = new THREE.CylinderGeometry(trunkRad,1.4*trunkRad,.4*trunkHeight, 20)
    var trunkBaseMat = new THREE.MeshPhongMaterial({ map:bark_tex});
    trunkBaseMat.shininess = 5;
    var trunkBase = new THREE.Mesh(trunkBaseGeo, trunkBaseMat);

    var trunkGeo = new THREE.CylinderGeometry(trunkRad,trunkRad,.6*trunkHeight, 20)
    var trunkMat = new THREE.MeshPhongMaterial({ambient:0x1d6438, map:bark_tex});
    trunkMat.shininess = 5;
    trunkMat.shading = THREE.SmoothShading;
    var trunk = new THREE.Mesh(trunkGeo, trunkMat);



    var leafBunchGeo = new THREE.SphereGeometry(trunkRad*2.5, 30, 30);
    var leafBunchMat = new THREE.MeshPhongMaterial({color: 0x3A5F0B, ambient:0x1d6438, map:leaves_tex});
    var leafBunch = new THREE.Mesh(leafBunchGeo, leafBunchMat);


    var tree_group = new THREE.Group();


    tree_group.add(trunkBase);

    trunk.position.set(0,.4*trunkHeight, 0);
    tree_group.add(trunk);

    //Leaf bunches
    leafBunch.position.set(0,trunkHeight + trunkRad, 0);

    for(var i = 0; i< leafRows; i++){
        var n = (i+1) * 2;
        for(var j = 0; j < n; j++){
            var bunch = leafBunch.clone();
            bunch.rotateY(THREE.Math.degToRad(j*360/n));
            bunch.translateX(i * trunkRad * 1.5);
            tree_group.add(bunch);
        }
        leafBunch.translateY(-trunkHeight/(2*leafRows));
    }


    return tree_group;
}

/* Inherit Helicopter from THREE.Object3D */
Tree.prototype = Object.create (THREE.Object3D.prototype);
Tree.prototype.constructor = Tree;