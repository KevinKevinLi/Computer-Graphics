class ThreeDWorld {

    constructor(canvasContainer) {
        // create canves container
        this.container = canvasContainer || document.body;
        // create scene
        this.createScene();
        // create light
        this.createLights();
        // create stats listener
        this.initStats();
        // create mouse envent
        this.addMouseListener();
        // add objects
        this.addObjs();
        // camera control
        this.orbitControls = new THREE.OrbitControls(this.camera);
        this.orbitControls.autoRotate = true;
        // update scene
        this.update();
    }
    createScene() {
        this.HEIGHT = window.innerHeight;
        this.WIDTH = window.innerWidth;
        // create scene by THREE
        this.scene = new THREE.Scene();
        // add fog to scene
        this.scene.fog = new THREE.Fog(0x090918, 1, 600);
        // create camera
        let aspectRatio = this.WIDTH / this.HEIGHT;
        let fieldOfView = 60;
        let nearPlane = 1;
        let farPlane = 10000;
        /**
         * PerspectiveCamera
         * @param fieldOfView
         * @param aspectRatio
         * @param nearPlane
         * @param farPlane
         */
        this.camera = new THREE.PerspectiveCamera(
            fieldOfView,
            aspectRatio,
            nearPlane,
            farPlane
        );

        // set camera position
        this.camera.position.x = 0;
        this.camera.position.z = 150;
        this.camera.position.y = 0;
        // Create the renderer
        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            // Anti-Aliasing close
            antialias: false
        });
        // Render background color with atomized color
        this.renderer.setClearColor(0x090918);
        // Define the size of the renderer; Here it fills the entire screen
        this.renderer.setSize(this.WIDTH, this.HEIGHT);

        // Open the shader map for the renderer
        this.renderer.shadowMap.enabled = true;
        // this.renderer.shadowMapSoft = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
        // Add the DOM element of the renderer to the container created by HTML
        this.container.appendChild(this.renderer.domElement);
        // Monitor the screen, zoom the screen to update the camera and renderer size
        window.addEventListener('resize', this.handleWindowResize.bind(this), false);
    }
    createLights() {
        // Outdoor lighting
        // sky color, ground color, light strength
        this.hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, .9);

        // ambient light
        this.ambientLight = new THREE.AmbientLight(0xdc8874, .2);

        // Directional light is irradiated from a specific direction
        // Like the sun, all light sources are parallel
        // The first parameter is the relational color, and the second parameter is the intensity of the light source
        this.shadowLight = new THREE.DirectionalLight(0xffffff, .9);

        // Set the direction of the light source
        this.shadowLight.position.set(50, 50, 50);

        // Open source projection
        this.shadowLight.castShadow = true;

        // Define the projection shadow of the visible field
        this.shadowLight.shadow.camera.left = -400;
        this.shadowLight.shadow.camera.right = 400;
        this.shadowLight.shadow.camera.top = 400;
        this.shadowLight.shadow.camera.bottom = -400;
        this.shadowLight.shadow.camera.near = 1;
        this.shadowLight.shadow.camera.far = 1000;

        // Defining the resolution of the shadow
        this.shadowLight.shadow.mapSize.width = 2048;
        this.shadowLight.shadow.mapSize.height = 2048;

        // To make these light sources works, you just add them to the scene
        this.scene.add(this.hemisphereLight);
        this.scene.add(this.shadowLight);
        this.scene.add(this.ambientLight);
    }
    initStats() {
        this.stats = new Stats();
        // Display the performance monitor screen in the upper left corner
        this.stats.domElement.style.position = 'absolute';
        this.stats.domElement.style.bottom = '0px';
        this.stats.domElement.style.zIndex = 100;
        this.container.appendChild(this.stats.domElement);
    }
    handleWindowResize() {
        // Update the height and width of the renderer and the aspect ratio of the camera
        this.HEIGHT = window.innerHeight;
        this.WIDTH = window.innerWidth;
        this.renderer.setSize(this.WIDTH, this.HEIGHT);
        this.camera.aspect = this.WIDTH / this.HEIGHT;
        this.camera.updateProjectionMatrix();
    }
    addMouseListener() {
        function parentUtilScene(obj) {
            if (obj.parent.type === 'Scene') return obj;
            while (obj.parent && obj.parent.type !== 'Scene') {
                obj = obj.parent;
            }
            return obj;
        }
        //Mouse click event
        this.container.addEventListener("mousedown", (event) => {
            this.handleRaycasters(event, (objTarget) => {

                // Find the direct child elements that correspond to the parent level in the scenario
                let object = parentUtilScene(objTarget);
                // Call the click event of picking up object
                object._click && object._click();
                // Iterate through other objects in the scene other than the current pickup, executing its unclicked event callback
                this.scene.children.forEach((objItem) => {
                    if (objItem !== object) {
                        objItem._clickBack && objItem._clickBack();
                    }
                });
            });
        });
        //this.container.addEventListener("mousedown",pointerMove);

        // Mouse move event
        this.container.addEventListener("mousemove", (event) => {
            this.handleRaycasters(event, (objTarget) => {

                let object = parentUtilScene(objTarget);
                // When the mouse moves to the pickup object and does not leave, it only calls its suspension event method once
                !object._hover_enter && object._hover && object._hover();
                object._hover_enter = true;

                this.scene.children.forEach((objItem) => {
                    if (objItem !== object) {
                        objItem._hover_enter && objItem._hoverBack && objItem._hoverBack();
                        objItem._hover_enter = false;
                    }
                });
            })
        });
        // Add the on method to all 3D objects and listen for the "click" and "hover" events of the object
        THREE.Object3D.prototype.on = function(eventName, touchCallback, notTouchCallback) {
            switch (eventName) {
                case "click":
                    console.log("click!")
                    this._click = touchCallback ? touchCallback : undefined;
                    this._clickBack = notTouchCallback ? notTouchCallback : undefined;
                    break;
                case "hover":
                    this._hover = touchCallback ? touchCallback : undefined;
                    this._hoverBack = notTouchCallback ? notTouchCallback : undefined;
                    break;
                default:
                    ;
            }
        }
    }
    // Solve Radiation
    handleRaycasters(event, callback) {
        let mouse = new THREE.Vector2();
        let raycaster = new THREE.Raycaster();
        mouse.x = (event.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
        mouse.y = -(event.clientY / this.renderer.domElement.clientHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, this.camera);
        let intersects = raycaster.intersectObjects(this.scene.children, true)
        if (intersects.length > 0) {
            callback && callback(intersects[0].object);
        }
    }
    // Add Shadow
    onShadow(obj) {
        if (obj.type === 'Mesh') {
            obj.castShadow = true;
            obj.receiveShadow = true;
        }
        if (obj.children && obj.children.length > 0) {
            obj.children.forEach((item) => {
                this.onShadow(item);
            })
        }
        return;
    }
    // Custom model loading
    loader(pathArr) {
        let jsonLoader = new THREE.JSONLoader();
        let fbxLoader = new THREE.FBXLoader();
        let mtlLoader = new THREE.MTLLoader();
        let objLoader = new THREE.OBJLoader();
        let basePath, pathName, pathFomat;
        let promiseArr = pathArr.map((path) => {
            basePath = path.substring(0, path.lastIndexOf('/') + 1);
            pathName = path.substring(path.lastIndexOf('/') + 1, path.lastIndexOf('.'));
            // Files with the suffix js or json are processed as js format
            pathName = pathName === 'json' ? 'js' : pathName;
            pathFomat = path.substring(path.lastIndexOf('.') + 1).toLowerCase();
            switch (pathFomat) {
                case 'js':
                    return new Promise(function(resolve) {
                        jsonLoader.load(path, (geometry, material) => {
                            resolve({
                                geometry: geometry,
                                material: material
                            })
                        });
                    });
                    break;
                case 'fbx':
                    return new Promise(function(resolve) {
                        fbxLoader.load(path, (object) => {
                            resolve(object);
                        });
                    });
                    break;
                default:
                    return '';
            }
        });
        return Promise.all(promiseArr);
    }
    // add model to scene
    addObjs() {
        this.loader(['http://localhost:8080/binary/binary/robot.FBX', 'http://localhost:8080/binary/binary/arceus.FBX','http://localhost:8080/binary/binary/kyurem.FBX','http://localhost:8080/binary/binary/kyurem.FBX']).then((result) => {
            let robot = result[0].children[1].geometry;
            let arceus = result[1].children[0].geometry;
            let kyurem = result[2].children[0].geometry;
            kyurem.scale(0.12, 0.12, 0.12);
            arceus.scale(0.12, 0.12, 0.12);
            robot.scale(0.12, 0.12, 0.12);
            //guitarObj.rotateX(-Math.PI / 2);
            robot.scale(0.11, 0.11, 0.11);
            robot.rotateX(-Math.PI / 2);
            //this.addPartices(robot, kyurem);
            this.addPartices(arceus, kyurem,robot);
        });
    }
    // Convert Geometric model to cache geometric model
    toBufferGeometry(geometry) {
        if (geometry.type === 'BufferGeometry') return geometry;
        return new THREE.BufferGeometry().fromGeometry(geometry);
    }
    // Particle transformation
    addPartices(obj1, obj2,obj3) {
        obj1 = this.toBufferGeometry(obj1);
        obj2 = this.toBufferGeometry(obj2);
        let moreObj = obj1
        let lessObj = obj2;
        // Find a model with more vertices
        if (obj2.attributes.position.array.length > obj1.attributes.position.array.length) {
            [moreObj, lessObj] = [lessObj, moreObj];
        }
        let morePos = moreObj.attributes.position.array;
        let lessPos = lessObj.attributes.position.array;
        let moreLen = morePos.length;
        let lessLen = lessPos.length;
        // Create an array space based on the maximum number of vertices, while store model vertex data with fewer vertices
        let position2 = new Float32Array(moreLen);
        let position3=new Float32Array(moreLen);
        // First put the model vertex coordinates with fewer vertices into the array
        position2.set(lessPos);
        position3.set(lessPos);
        // repeatedly assigned remaining space
        for (let i = lessLen, j = 0; i < moreLen; i++, j++) {
            j %= lessLen;
            position2[i] = lessPos[j];
            position2[i + 1] = lessPos[j + 1];
            position2[i + 2] = lessPos[j + 2];
        }
        // size is the vertex size
        let sizes = new Float32Array(moreLen);
        for (let i = 0; i < moreLen; i++) {
            sizes[i] = 4;
        }
        // Mount attribute value
        moreObj.addAttribute('size', new THREE.BufferAttribute(sizes, 1));
        moreObj.addAttribute('position2', new THREE.BufferAttribute(position2, 3));
        //  pass Attribute values to shader
        let uniforms = {
            // Vertex Color
            color: {
                type: 'v3',
                value: new THREE.Color("rgb(0, 191, 255)")
            },
            // Pass vertex maps
            texture: {
                value: this.getTexture(64)
            },
            // Pass val value for shader to calculate vertex position
            val: {
                value: 1.0
            }
        };
        // Coloring material
        let shaderMaterial = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: document.getElementById('vertexshader').textContent,
            fragmentShader: document.getElementById('fragmentshader').textContent,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            transparent: true
        });
        // Creating the particle system
        let particleSystem = new THREE.Points(moreObj, shaderMaterial);
        let pos = {
            val: 1.0
        };
        // Particle animations
        let tween = new TWEEN.Tween(pos).to({
            val: 0
        }, 2500).easing(TWEEN.Easing.Exponential.InOut).delay(2000*(1+Math.random())).onUpdate(updateCallback).onComplete(completeCallBack.bind(pos, 'go'));
        let tweenSperate = new TWEEN.Tween(pos).to({
            val: 3
        }, 2500).easing(TWEEN.Easing.Exponential.InOut).delay(2000*(1+Math.random())).onUpdate(updateCallback).onComplete(completeCallBack.bind(pos, 'sep'));
        let tweenBack = new TWEEN.Tween(pos).to({
            val: 1
        }, 2500).easing(TWEEN.Easing.Exponential.InOut).delay(2000*(1+Math.random())).onUpdate(updateCallback).onComplete(completeCallBack.bind(pos, 'back'));

        tween.chain(tweenSperate);
        tweenSperate.chain(tweenBack);
        tweenBack.chain(tween);
        tweenBack.start();

        // a callback function that continues to update
        function updateCallback() {
            particleSystem.material.uniforms.val.value = this.val;
            // color transition
            if (this.nextcolor) {
                let val = this.order === 'back' ? (1 - this.val) : this.val;
                let uColor = particleSystem.material.uniforms.color.value;
                //uColor.r = this.color.r + (this.nextcolor.r - this.color.r) * val;
                //uColor.b = this.color.b + (this.nextcolor.b - this.color.b) * val;
                //uColor.g = this.color.g + (this.nextcolor.g - this.color.g) * val;
            }
        }
        // The callback function at the end of each round of animation
        function completeCallBack(order) {
            let uColor = particleSystem.material.uniforms.color.value;
            // Save the animation sequence
            this.order = order;
            // Save the old particle color
            this.color = {
                r: uColor.r,
                b: uColor.b,
                g: uColor.g
            }
            // Randomly generate the color of the particle to be transformed
            this.nextcolor = {
                r: Math.random(),
                b: Math.random(),
                g: Math.random()
            }
        }
        this.scene.add(particleSystem);
        this.particleSystem = particleSystem;
    }
    getTexture(canvasSize = 64) {
        let canvas = document.createElement('canvas');
        canvas.width = canvasSize;
        canvas.height = canvasSize;
        canvas.style.background = "transparent";
        let context = canvas.getContext('2d');
        let gradient = context.createRadialGradient(canvas.width / 2, canvas.height / 2, canvas.width / 8, canvas.width / 2, canvas.height / 2, canvas.width / 2);
        gradient.addColorStop(0, '#fff');
        gradient.addColorStop(1, 'transparent');
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, Math.PI * 2, true);
        context.fill();
        let texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;
    }
    update() {
        TWEEN.update();
        this.stats.update();
        let time = Date.now() * 0.005;
        if (this.particleSystem) {
            let bufferObj = this.particleSystem.geometry;
            this.particleSystem.rotation.y = 0.01 * time;
            let sizes = bufferObj.attributes.size.array;
            let len = sizes.length;
            for (let i = 0; i < len; i++) {
                sizes[i] = 1.5 * (2.0 + Math.sin(0.02 * i + time));

            }
            bufferObj.attributes.size.needsUpdate = true;
        }
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(() => {
            this.update()
        });
    }
}

function onLoad() {
    new ThreeDWorld(document.getElementById("world"));
}
