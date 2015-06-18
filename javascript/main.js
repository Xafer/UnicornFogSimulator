//Three.js initialisation


var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(90,(window.innerWidth) / window.innerHeight,0.001,0.002);
var renderer = new THREE.WebGLRenderer();

camera.rotation.order = "YXZ";

renderer.setSize(window.innerWidth,window.innerHeight);
renderer.domElement.id = "game";
renderer.domElement.style.width = "100%";
renderer.domElement.style.height = "100%";
document.getElementById("display").appendChild(renderer.domElement);

renderer.shadowMapEnabled = true;

var fogColor = new THREE.Color(0x110011);

//PostProcessing
var composer = new THREE.EffectComposer( renderer );
composer.addPass( new THREE.RenderPass( scene, camera ) );

var effect = new THREE.ShaderPass( THREE.PixelShader );
effect.renderToScreen = true;
composer.addPass( effect );

var effect2 = new THREE.OculusRiftEffect( renderer, {worldScale: 200} );
    effect2.setSize( window.innerWidth, window.innerHeight );

//Setting the canvas

var canvas = document.getElementById("game");

canvas.requestPointerLock = canvas.requestPointerLock ||
                            canvas.mozRequestPointerLock ||
                            canvas.webkitRequestPointerLock;

canvas.exitPointerLock = canvas.exitPointerLock ||
                           canvas.mozExitPointerLock ||
                           canvas.webkitExitPointerLock;

canvas.onclick = function() {
    canvas.requestPointerLock();
}

function isFocused()
{
    return true//document.pointerLockElement === canvas || document.mozPointerLockElement === canvas || document.webkitPointerLockElement === canvas;
}

var amb = new THREE.AmbientLight(0x220022);
scene.add(amb);

/////////////////////////////////////////////
///////// Main programming section //////////
/////////////////////////////////////////////

//Variables

var tick;

var pulsation;

var fogPotency;

var colorOffset;

var orientation;

var rotMax = Math.PI / 2 - Math.PI / 8;

var temporalPosition;

var scenery;

var assetQuantity;

var deathRowQueue;

var birthRowQueue;

var friendlyNeighborhoodLight;

//Constants

var TAU = Math.PI*2;

//Functions

function changeGroupOpacity(group,opacity)
{
    for(var i in group.children)
    {
        var o = group.children[i];
        if(o.material == undefined)continue;
        o.material.opacity = opacity;
    }
    
    return group;
}

function updateFog()
{
    
    updateFogColor();
    
    var value = (Math.sin(temporalPosition)+1) / 2;
    
    fogPotency = (Math.sin(tick / (pulsation/8))+1) / 4 + 0.5;
    
    scene.fog = new THREE.Fog( fogColor, value*6 + 3, value*6 + 5 );
    renderer.setClearColor(fogColor);
    
    function updateFogColor()
    {

        var r = Math.floor((Math.sin(temporalPosition + colorOffset)+1)/(2 / fogPotency) * 256);
        r = r << 16;

        var g = Math.floor((Math.sin(temporalPosition + (TAU / 3) + colorOffset)+1)/(2 / fogPotency) * 256);
        g = g << 8;
        
        var b = Math.floor((Math.sin(temporalPosition + (TAU / 3)*2 + colorOffset)+1)/(2 / fogPotency) * 256);
        
        fogColor = r+g+b;

        fogColor = Math.floor(fogColor);
        
    }
}

function updateRotation()
{
    
    var change = new THREE.Euler();
    
    change.order = "YXZ";
    
    change.set
    (
        -mouse.movement.y/100,
        -mouse.movement.x/100,
        0
    );
    
    var qChange = new THREE.Quaternion();
    
    qChange.setFromEuler(change);
    
    orientation.multiply(qChange);
    
    colorOffset -= mouse.movement.x/500;
    colorOffset -= mouse.movement.y/500;
    
    camera.quaternion.copy(orientation);
}

function updateCamera()
{
    camera.position.setX(Math.sin(temporalPosition + temporalPosition + (TAU / 3)/4));
    camera.position.setY(Math.sin(temporalPosition + (TAU / 3) + Math.sin(temporalPosition + (TAU / 3) * 2)/4));
    camera.position.setZ(Math.sin(temporalPosition + (TAU / 3) * 2) + temporalPosition/4);
}

function updateTemporalPosition()
{
    temporalPosition = tick/pulsation;
}

function updateScenery()
{
    for(var i in scenery.children)
    {
        var c = scenery.children[i];
        
        c.angularVelocity.set
        (
            c.angularVelocity.x + (Math.random()-c.randomNumber)/pulsation,
            c.angularVelocity.y + (Math.random()-c.randomNumber)/pulsation,
            c.angularVelocity.z + (Math.random()-c.randomNumber)/pulsation,
            5
        );
        
        c.angularVelocity.normalize();
        
        c.quaternion.multiply(c.angularVelocity);
        
        c.position.add(c.velocity);
        
        for(var j in c.children)
        {
            var b = c.children[j];
            b.position.x += Math.random()/80;
            b.position.y += Math.random()/80;
            b.position.z += Math.random()/80;
        }
    }
}

function updateBirthRowQueue()
{
    for(var i in birthRowQueue)
    {
        var o = birthRowQueue[i];
        
        if(o.children.length <= 0)continue;
        
        if(o.children[0].material == null)continue;
        
        var opacity = o.children[0].material.opacity;
        
        changeGroupOpacity(o,opacity+0.005);
        
        if(opacity >= 1)
        {
            changeGroupOpacity(o,1);
            birthRowQueue.splice(birthRowQueue.indexOf(o),1);
            break;
        }
    }
}

function updateDeathRowQueue()
{
    for(var i in deathRowQueue)
    {
        var o = deathRowQueue[i];
        
        if(o.children.length <= 0)continue;
        
        if(o.children[0].material == null)continue;
        
        var opacity = o.children[0].material.opacity;
        
        changeGroupOpacity(o,opacity-0.005);
        
        if(opacity <= 0)
        {
            changeGroupOpacity(0);
            deathRowQueue.splice(deathRowQueue.indexOf(o),1);
            scenery.remove(o);
            break;
        }
    }
}

function updateLight()
{
    var r = (fogColor >> 16) & 255;
    var g = (fogColor >> 8) & 255;
    var b = (fogColor) & 255
    
    r = r << 16;
    g = g << 8;
    friendlyNeighborhoodLight = new THREE.PointLight(r+g+b,0.1,10 + Math.random());
    
    friendlyNeighborhoodLight.position.copy(camera.position);
}

function spawnRandomObject()
{
    var assets = IMMATRICIOUS.HIGHCODING.ASSETS;
    var assetIndex = Math.floor(Math.random() * assetQuantity);
    
    var counter = 0;
    
    for(var i in assets)
    {
        if(counter == assetIndex)
        {
            var o = loadModel(assets[i]);
            
            o.randomNumber = (Math.random()-0.5)*2;
            
            o.angularVelocity = new THREE.Quaternion();
            
            o.velocity = new THREE.Vector3
            (
                (Math.random() - 0.5)/32,
                (Math.random() - 0.5)/32,
                (Math.random() - 0.5)/32
            );
            
            o.angularVelocity.normalize();
            
            var distance = Math.random() * 4 + 3;
            
            o.position.set
            (
                Math.random() - 0.5,
                Math.random() - 0.5,
                Math.random() - 0.5
            );
            
            o.position.normalize();
            
            o.position.multiplyScalar(distance);
            
            o = changeGroupOpacity(o,0);
            
            birthRowQueue.push(o);
            
            scenery.add(o);
            break;
        }
        counter++;
    }
}

function destroyRandomObject()
{
    var index = Math.floor(Math.random() * scenery.children.length);
    var o = scenery.children[index];
    if(birthRowQueue.indexOf(o) == -1)
    {
        deathRowQueue.push(o);
    }
}

function update()
{
    updateTemporalPosition();
    
    updateFog();
    
    updateCamera();
    
    updateScenery();
    
    updateBirthRowQueue();
    
    updateDeathRowQueue();
    
    updateLight();
    
    if(Math.random() < 0.01) spawnRandomObject();
    
    if(Math.random() < 0.01) destroyRandomObject();
}

function getAssetQuantity()
{
    var assets = 0;
    
    for(var i in IMMATRICIOUS.HIGHCODING.ASSETS)
        assets++;
    
    assetQuantity = assets;
}

function render()
{
    renderer.render(scene,camera);
    effect2.render(scene,camera);
}


function main()
{
    update();
    
    render();
    
    requestAnimationFrame(main);
    
    tick++;
}

function createSpawnLight()
{
    friendlyNeighborhoodLight = new THREE.PointLight(0xffffff,1,10);
    scene.add(friendlyNeighborhoodLight);
}

function init()
{
    tick = 0;
    
    pulsation = 200;
    
    fogPotency = 0.5;
    
    colorOffset = 0;
    
    orientation = new THREE.Quaternion();
    
    scenery = new THREE.Group();
    scene.add(scenery);
    
    getAssetQuantity();
    
    birthRowQueue = [];
    
    deathRowQueue = [];
    
    for(var i = 0; i < 7; i++)
        spawnRandomObject();
    
    createSpawnLight();
    
    console.log("game initiated.");
    main();
}
init();

//Model Importation functions

function loadModel(model)
{
    var loadedModel = new THREE.Group();
    var parts = model.parts;
    var l = parts.length;
    
    for(var i = 0; i < l; i++)//Parsing through the parts
    {
        var p = parts[i];
        var size = new THREE.Vector3(p.size[0], p.size[1], p.size[2]);
        var color = new THREE.Color(p.color[0],p.color[1],p.color[2]);
        var pos = new THREE.Vector3(p.position[0],p.position[1],p.position[2]);
        var rot;
        if(p.rotation.length == 3)
        {
            rot = new THREE.Euler(p.rotation[0],p.rotation[1],p.rotation[2]);
        }
        else
        {
            rot = new THREE.Quaternion(p.rotation[0],p.rotation[1],p.rotation[2],p.rotation[3]);
        }
        
        var material = new THREE.MeshLambertMaterial( { color:color , transparent: true} );
        var geometry = new THREE.BoxGeometry(size.x,size.y,size.z);
        
        var mesh = new THREE.Mesh(geometry,material);
        mesh.position.copy(pos);
        
        pos.addScalar(Math.random()/10);
        
        mesh.rotation.copy(rot);
       
        loadedModel.add(mesh);
    }
    
    l = model.lights.length;
    
    for(var i = 0; i < l;i++)//Parsing through lights
    {
        var light = model.lights[i];
        var resLight = new THREE[light.type](light.color);
        
        resLight.position.set(light.position[0],light.position[1]+1,light.position[2]);
        
        resLight.intensity = light.intensity;
        resLight.distance = light.distance;
        
        if(light.type == "SpotLight")
        {
            resLight.castShadow = true;
            resLight.shadowDarkness = 1;
            resLight.shadowCameraNear = 0.1;
            resLight.shadowCameraFar = 10;
            resLight.shadowCameraFov = 90;
        }
        
        loadedModel.add(resLight);
    }
    
    l = model.systems.length;
    
    for(var i = 0; i < l; i++)
    {
        var particle = model.systems[i];
        var material = new THREE.SpriteMaterial({color:particle.color,transparent: true});
        
        var resParticle = new THREE.Sprite(material);
        
        resParticle.position.set(particle.position[0],particle.position[1],particle.position[2]);
        
        resParticle.scale.x = particle.size.x;
        resParticle.scale.y = particle.size.y;
        
        loadedModel.add(resParticle);
    }
    
    return loadedModel;
}