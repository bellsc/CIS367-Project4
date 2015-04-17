
Propeller = function(numBlades, bladeLength) {

    var bladeGeo = new THREE.BoxGeometry(.4,.05,bladeLength,20,2,2);
    var bladeMat = new THREE.MeshPhongMaterial({color: 0x848484});
    var blade = new THREE.Mesh (bladeGeo, bladeMat);

    var rotorGeo = new THREE.CylinderGeometry(.2,.2,.3, 20);
    var rotorMat = new THREE.MeshPhongMaterial({color: 0x848484});
    var rotor = new THREE.Mesh (rotorGeo, rotorMat);

    var propeller_group = new THREE.Group();

    rotor.translateY(-.05);
    propeller_group.add(rotor);

    var angle = 2 * Math.PI / numBlades;
    for (var k = 0; k < numBlades; k++) {
        var b = blade.clone();
        b.rotateY(k * angle);
        b.translateZ(.45*bladeLength);
        propeller_group.add (b);
    }


    return propeller_group;
}

/* Inherit Propeller from THREE.Object3D */
Propeller.prototype = Object.create (THREE.Object3D.prototype);
Propeller.prototype.constructor = Propeller;