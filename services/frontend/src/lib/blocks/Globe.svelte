<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import {
    Color, DirectionalLight, Mesh, MeshStandardMaterial, Group, PerspectiveCamera, Scene, ShaderMaterial,
    SphereGeometry, SpotLight, Vector3, WebGLRenderer, Matrix4, Object3D, CircleGeometry, InstancedMesh,
    ImageLoader, Clock, Quaternion, TubeGeometry, CubicBezierCurve3, MeshBasicMaterial
  } from 'three';

  interface GlobeConnection {
    srcLat: number
    srcLon: number
    dstLat: number
    dstLon: number
  }

  export let width: number;
  export let height: number;
  export let connections: GlobeConnection[] = []

  let canvasElement: HTMLCanvasElement;
  
  let renderer: WebGLRenderer | undefined;
  let animationLoop: XRFrameRequestCallback | undefined;
  let parentContainer: Group | undefined;
  let camera: PerspectiveCamera | undefined;
  let meshContainer: Group | undefined;
  let dataMeshes: Object3D[] = [];
  let dragging = false;
  let touches: { [key: number]: Touch } = {};
  
  const radius = 25;
  let resizeObserver: ResizeObserver;

  const WORLD_MAP = 'data:image/png;base64,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';

  function calculateGlobePosition(lat: number, lon: number, radius: number, vec?: Vector3) {
    vec = vec || new Vector3();
    const latRadians = (90 - lat) * (Math.PI / 180);
    const lonRadians = (lon + 180) * (Math.PI / 180);

    vec.set(
      -radius * Math.sin(latRadians) * Math.cos(lonRadians),
      radius * Math.cos(latRadians),
      radius * Math.sin(latRadians) * Math.sin(lonRadians)
    );
    return vec;
  }

  function visibilityForCoordinate(lon: number, lat: number, image: ImageData) {
    const r = Math.floor(((lon + 180) / 360) * image.width + 0.5);
    const a = Math.floor(image.width * (image.height - Math.floor(((lat + 90) / 180) * image.height - 0.5) - 1) + r);
    return image.data[a * 4 + 3] > 90;
  }

  function getImageData(img: HTMLImageElement) {
    const canvas = document.createElement("canvas").getContext("2d")!;
    canvas.canvas.width = img.width;
    canvas.canvas.height = img.height;
    canvas.drawImage(img, 0, 0, img.width, img.height);
    return canvas.getImageData(0, 0, img.width, img.height);
  }

  function lerp(value: number, inputStart: number, inputEnd: number, outputStart: number, outputEnd: number) {
    return (outputEnd - outputStart) * ((value - inputStart) / (inputEnd - inputStart) || 0) + outputStart;
  }

  function doFunnyCalculations(srcLat: number, srcLon: number, dstLat: number, dstLon: number) {
    const DEG2RAD = Math.PI / 180;
    const RAD2DEG = 180 / Math.PI;

    srcLat *= DEG2RAD;
    srcLon *= DEG2RAD;
    dstLat *= DEG2RAD;
    dstLon *= DEG2RAD;

    const lonDiff = dstLon - srcLon;
    const a = Math.cos(dstLat) * Math.cos(lonDiff);
    const s = Math.cos(dstLat) * Math.sin(lonDiff);
    return [
      Math.atan2(
        Math.sin(srcLat) + Math.sin(dstLat),
        Math.sqrt(
          (Math.cos(srcLat) + a) * (Math.cos(srcLat) + a) + s * s
        )
      ) * RAD2DEG,
      (srcLon + Math.atan2(s, Math.cos(srcLat) + a)) * RAD2DEG,
    ];
  }

  // --- Interaction Logic ---
  function rotateGlobe(deltaX: number, deltaY: number) {
    if (!parentContainer) return;

    parentContainer.rotateY(deltaX);

    const rotationQuaternion = new Quaternion();
    parentContainer.getWorldQuaternion(rotationQuaternion);
    const rotation = new Vector3(0, 1, 0).applyQuaternion(rotationQuaternion);
    rotation.applyAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);

    const angle = rotation.angleTo(new Vector3(0, 1, 0));

    let yRotation = deltaY;
    if (yRotation < 0) {
      yRotation = Math.max((0 + Math.PI / 3) - angle, yRotation);
    } else {
      yRotation = Math.min((Math.PI - Math.PI / 3) - angle, yRotation);
    }

    parentContainer.rotateOnWorldAxis(new Vector3(1, 0, 0), yRotation);
  }

  // --- Event Handlers ---
  function onMouseDown() {
    dragging = true;
  }

  function onMouseUp() {
    dragging = false;
  }

  function onMouseMove(event: MouseEvent) {
    if (dragging) {
      rotateGlobe(event.movementX * 0.25 / 180 * Math.PI, event.movementY * 0.25 / 180 * Math.PI);
    }
  }

  function onTouchStart(event: TouchEvent) {
    for (let i = 0; i < event.changedTouches.length; i++) {
      touches[event.changedTouches[i].identifier] = event.changedTouches[i];
    }
  }

  function onTouchEnd(event: TouchEvent) {
    for (let i = 0; i < event.changedTouches.length; i++) {
      delete touches[event.changedTouches[i].identifier];
    }
  }

  function onTouchMove(event: TouchEvent) {
    if (event.changedTouches.length === 1 && touches[event.changedTouches[0].identifier]) {
      const touch = event.changedTouches[0];
      const lastTouch = touches[touch.identifier];
      const deltaX = touch.screenX - lastTouch.screenX;
      const deltaY = touch.screenY - lastTouch.screenY;

      rotateGlobe(deltaX * 0.25 / 180 * Math.PI, deltaY * 0.25 / 180 * Math.PI);
    }

    for (let i = 0; i < event.changedTouches.length; i++) {
      touches[event.changedTouches[i].identifier] = event.changedTouches[i];
    }
  }

  // --- Lifecycle & Reactivity ---
  onMount(() => void (async () => {
    // This function runs once when the component is first mounted to the DOM.
    // It replaces the `setup` and `useCallback` logic.
    if (!canvasElement) return;

    resizeObserver = new ResizeObserver(events => {
      const event = events[0];
      const newWidth = event.contentRect.width;
      const newHeight = event.contentRect.height;
      
      if (camera) {
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
      }
      
      if (renderer) {
        renderer.setSize(newWidth, newHeight);
      }
    });

    resizeObserver.observe(canvasElement);

    canvasElement.addEventListener('contextmenu', (event: MouseEvent) => {
      if (event.buttons === 1) event.preventDefault();
    });

    // --- Three.js Scene Setup (from the original `setup` function) ---
    const scale = 850 / height;
    const detail = 55;

    const scene = new Scene();
    camera = new PerspectiveCamera(20, width / height, 170, 260);
    camera.position.set(0, 0, 220);
    scene.add(camera);

    parentContainer = new Group();
    scene.add(parentContainer);

    const container = new Group();
    parentContainer.add(container);

    const light0 = new SpotLight(2197759, 12, 120, 0.3, 0, 1.1);
    const light1 = new DirectionalLight(0xa9bfff, 3);
    const light3 = new SpotLight(0xf46bbe, 5, 75, 0.5, 0, 1.25);
    light0.target = parentContainer;
    light1.target = parentContainer;
    light3.target = parentContainer;
    scene.add(light0, light1, light3);

    light0.position.set(parentContainer.position.x - 2.5 * radius, 80, -40).multiplyScalar(scale);
    light0.distance = 120 * scale;
    
    light1.position.set(parentContainer.position.x - 50, parentContainer.position.y + 30, 10).multiplyScalar(scale);

    light3.position.set(parentContainer.position.x + radius, radius, 2 * radius).multiplyScalar(scale);
    light3.distance = 75 * scale;

    const globeGeometry = new SphereGeometry(radius, detail, detail);
    const globeMaterial = new MeshStandardMaterial({ color: 1513012, metalness: 0, roughness: 0.9 });
    
    (globeMaterial as any).defines = {
      'USE_HIGHLIGHT': 1,
      'USE_HIGHLIGHT_ALT': 1,
      'USE_FRONT_HIGHLIGHT': 1,
      'DITHERING': 1,
    }

    globeMaterial.onBeforeCompile = params => {
      params.uniforms.shadowDist = { value: 1.5 * radius }
      params.uniforms.highlightDist = { value: 5 }
      params.uniforms.shadowPoint = { value: new Vector3().copy(parentContainer!.position).add(new Vector3(0.7 * radius, -(0.3 * radius), radius)) }
      params.uniforms.highlightPoint = { value: new Vector3().copy(parentContainer!.position).add(new Vector3(-(1.5 * radius), -(1.5 * radius), 0)) }
      params.uniforms.frontPoint = { value: new Vector3().copy(new Vector3().copy(parentContainer!.position).add(new Vector3(0, 0, radius))) }
      params.uniforms.highlightColor = { value: new Color(5339494) }
      params.uniforms.frontHighlightColor = { value: new Color(2569853) }
      params.vertexShader = "#define GLSLIFY 1\n#define STANDARD\nvarying vec3 vViewPosition;\n#ifndef FLAT_SHADED\n	varying vec3 vNormal;\n	#ifdef USE_TANGENT\n		varying vec3 vTangent;\n		varying vec3 vBitangent;\n	#endif\n#endif\n#include <common>\n#include <uv_pars_vertex>\n#include <uv2_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <color_pars_vertex>\n#include <fog_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <shadowmap_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\n\nvarying vec3 vWorldPosition;\n\nvoid main() {\n	#include <uv_vertex>\n	#include <uv2_vertex>\n	#include <color_vertex>\n	#include <beginnormal_vertex>\n	#include <morphnormal_vertex>\n	#include <skinbase_vertex>\n	#include <skinnormal_vertex>\n	#include <defaultnormal_vertex>\n#ifndef FLAT_SHADED\n	vNormal = normalize( transformedNormal );\n	#ifdef USE_TANGENT\n		vTangent = normalize( transformedTangent );\n		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );\n	#endif\n#endif\n	#include <begin_vertex>\n	#include <morphtarget_vertex>\n	#include <skinning_vertex>\n	#include <displacementmap_vertex>\n	#include <project_vertex>\n	#include <logdepthbuf_vertex>\n	#include <clipping_planes_vertex>\n	vViewPosition = - mvPosition.xyz;\n	// # include <worldpos_vertex>\n    vec4 worldPosition = vec4( transformed, 1.0 );\n\n	#ifdef USE_INSTANCING\n\n		worldPosition = instanceMatrix * worldPosition;\n\n	#endif\n\n	worldPosition = modelMatrix * worldPosition;\n	vWorldPosition = worldPosition.xyz;\n	#include <shadowmap_vertex>\n	#include <fog_vertex>\n}"
      params.fragmentShader = "#define GLSLIFY 1\n#define STANDARD\n#ifdef PHYSICAL\n	#define REFLECTIVITY\n	#define CLEARCOAT\n	#define TRANSPARENCY\n#endif\nuniform vec3 diffuse;\nuniform vec3 emissive;\nuniform float roughness;\nuniform float metalness;\nuniform float opacity;\n#ifdef TRANSPARENCY\n	uniform float transparency;\n#endif\n#ifdef REFLECTIVITY\n	uniform float reflectivity;\n#endif\n#ifdef CLEARCOAT\n	uniform float clearcoat;\n	uniform float clearcoatRoughness;\n#endif\n#ifdef USE_SHEEN\n	uniform vec3 sheen;\n#endif\nvarying vec3 vViewPosition;\n#ifndef FLAT_SHADED\n	varying vec3 vNormal;\n	#ifdef USE_TANGENT\n		varying vec3 vTangent;\n		varying vec3 vBitangent;\n	#endif\n#endif\n#include <common>\n#include <packing>\n#include <dithering_pars_fragment>\n#include <color_pars_fragment>\n#include <uv_pars_fragment>\n#include <uv2_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <aomap_pars_fragment>\n#include <lightmap_pars_fragment>\n#include <emissivemap_pars_fragment>\n#include <bsdfs>\n#include <cube_uv_reflection_fragment>\n#include <envmap_common_pars_fragment>\n#include <envmap_physical_pars_fragment>\n#include <fog_pars_fragment>\n#include <lights_pars_begin>\n#include <lights_physical_pars_fragment>\n#include <shadowmap_pars_fragment>\n#include <bumpmap_pars_fragment>\n#include <normalmap_pars_fragment>\n#include <clearcoat_pars_fragment>\n#include <roughnessmap_pars_fragment>\n#include <metalnessmap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\n\nuniform float shadowDist;\nuniform float highlightDist;\nuniform vec3 shadowPoint;\nuniform vec3 highlightPoint;\nuniform vec3 frontPoint;\nuniform vec3 highlightColor;\nuniform vec3 frontHighlightColor;\n\nvarying vec3 vWorldPosition;\n\nvoid main() {\n	#include <clipping_planes_fragment>\n	vec4 diffuseColor = vec4( diffuse, opacity );\n	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n	vec3 totalEmissiveRadiance = emissive;\n	#include <logdepthbuf_fragment>\n	#ifdef USE_MAP\n\n		vec4 texelColor = texture2D( map, vUv );\n		texelColor = mapTexelToLinear( texelColor );\n		\n		#ifndef IS_FILL\n			diffuseColor *= texelColor;\n		#endif\n\n	#endif\n	#include <color_fragment>\n	#include <alphamap_fragment>\n	#include <alphatest_fragment>\n	#include <roughnessmap_fragment>\n	#include <metalnessmap_fragment>\n	#include <normal_fragment_begin>\n	#include <normal_fragment_maps>\n	#include <clearcoat_normal_fragment_begin>\n	#include <clearcoat_normal_fragment_maps>\n	#include <emissivemap_fragment>\n	#include <lights_physical_fragment>\n	#include <lights_fragment_begin>\n	#include <lights_fragment_maps>\n	#include <lights_fragment_end>\n	#include <aomap_fragment>\n	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;\n	#ifdef TRANSPARENCY\n		diffuseColor.a *= saturate( 1. - transparency + linearToRelativeLuminance( reflectedLight.directSpecular + reflectedLight.indirectSpecular ) );\n	#endif\n\n    float dist;\n	float distZ;\n\n    // highlights\n	#ifdef USE_HIGHLIGHT\n		dist = distance(vWorldPosition, highlightPoint);\n		distZ = distance(vWorldPosition.z, 0.0);\n		outgoingLight = mix(highlightColor, outgoingLight, smoothstep(0.0, highlightDist, dist) * smoothstep(0.0, 3.0, pow(distZ, 0.5)));\n        outgoingLight = mix(outgoingLight * 2.0, outgoingLight, smoothstep(0.0, 12.0, distZ));\n	#endif\n\n    // front hightlight\n    #ifdef USE_FRONT_HIGHLIGHT\n        dist = distance(vWorldPosition * vec3(0.875, 0.5, 1.0), frontPoint);\n        outgoingLight = mix(frontHighlightColor * 1.6, outgoingLight, smoothstep(0.0, 15.0, dist));\n    #endif\n\n    // shadows\n    dist = distance(vWorldPosition, shadowPoint);\n	outgoingLight = mix(outgoingLight * 0.01, outgoingLight, smoothstep(0.0, shadowDist, dist));\n    // shadow debug\n	// outgoingLight = mix(vec3(1.0, 0.0, 0.0), outgoingLight, smoothstep(0.0, shadowDist, dist));\n\n	#ifdef IS_FILL\n		outgoingLight = mix(outgoingLight, outgoingLight * 0.5, 1.0 - texelColor.g * 1.5);\n	#endif\n\n	gl_FragColor = vec4( outgoingLight, diffuseColor.a );\n	#include <tonemapping_fragment>\n	#include <encodings_fragment>\n	#include <fog_fragment>\n	#include <premultiplied_alpha_fragment>\n	#include <dithering_fragment>\n}"
    }

    const globeMesh = new Mesh(globeGeometry, globeMaterial);
    globeMesh.renderOrder = 1;
    container.add(globeMesh);

    const haloContainer = new Group()
    haloContainer.position.set(0, 0, -10)
    //haloContainer.scale.set(scale, scale, scale)
    scene.add(haloContainer)

    const halo = new Mesh(
      new SphereGeometry(25, 45, 45),
      new ShaderMaterial({
        uniforms: {
          c: { value: 0.7 },
          p: { value: 15 },
          glowColor: { value: new Color(1844322) },
          viewVector: { value: new Vector3(0, 0, 220) },
        },
        vertexShader:
          "#define GLSLIFY 1\nuniform vec3 viewVector;\nuniform float c;\nuniform float p;\nvarying float intensity;\nvarying float intensityA;\nvoid main() \n{\n  vec3 vNormal = normalize( normalMatrix * normal );\n  vec3 vNormel = normalize( normalMatrix * viewVector );\n  intensity = pow( c - dot(vNormal, vNormel), p );\n  intensityA = pow( 0.63 - dot(vNormal, vNormel), p );\n  \n  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n}",
        fragmentShader:
          "#define GLSLIFY 1\nuniform vec3 glowColor;\nvarying float intensity;\nvarying float intensityA;\nvoid main()\n{\n  gl_FragColor = vec4( glowColor * intensity, 1.0 * intensityA );\n}",
        side: 1,
        blending: 2,
        transparent: true,
        dithering: true,
      })
    );
    halo.scale.multiplyScalar(1.15)
    halo.rotateX(0.03 * Math.PI)
    halo.rotateY(0.03 * Math.PI)
    halo.renderOrder = 3
    haloContainer.add(halo)

    const dotMatrices: Matrix4[] = []
    const helper = new Object3D()

    const imageData = getImageData(await new ImageLoader().loadAsync(WORLD_MAP))
    
    const dotsForLon = 200
    for (let lat = -90; lat <= 90; lat += 180 / dotsForLon) {
      const dotsForLat = Math.cos(Math.abs(lat) * (Math.PI / 180)) * (25 * Math.PI * 4)
      for (let x = 0; x < dotsForLat; x++) {
        let lon = -180 + x * (360 / dotsForLat)
        if(!visibilityForCoordinate(lon, lat, imageData)) continue
        
        const position = calculateGlobePosition(lat, lon, radius)
        helper.position.set(position.x, position.y, position.z)

        let normal = calculateGlobePosition(lat, lon, radius + 5)
        helper.lookAt(normal.x, normal.y, normal.z)

        helper.updateMatrix()
        dotMatrices.push(helper.matrix.clone());
      }
    }

    const dotSize = 0.095
    const dotGeometry = new CircleGeometry(dotSize, 5)
    const dotMaterial = new MeshStandardMaterial({
      color: 3818644,
      metalness: 0,
      roughness: 0.9,
      transparent: !0,
      alphaTest: 0.02,
    })
    dotMaterial.onBeforeCompile = params => {
      params.fragmentShader = params.fragmentShader.replace(
        "gl_FragColor = vec4( outgoingLight, diffuseColor.a );",
        "\n        gl_FragColor = vec4( outgoingLight, diffuseColor.a );\n        if (gl_FragCoord.z > 0.51) {\n          gl_FragColor.a = 1.0 + ( 0.51 - gl_FragCoord.z ) * 17.0;\n        }\n      "
      )
    }
    const worldMesh = new InstancedMesh(dotGeometry, dotMaterial, dotMatrices.length);
    for(let i = 0; i < dotMatrices.length; i++) worldMesh.setMatrixAt(i, dotMatrices[i]);
    worldMesh.renderOrder = 3
    container.add(worldMesh)

    meshContainer = new Group();
    meshContainer.add(...dataMeshes);
    parentContainer.add(meshContainer);

    renderer = new WebGLRenderer({
      powerPreference: "high-performance",
      alpha: true,
      preserveDrawingBuffer: false,
      antialias: true,
      canvas: canvasElement,
    });

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);

    const clock = new Clock();

    animationLoop = () => {
      if (!renderer) return;
      const deltaTime = clock.getDelta();
      if (!dragging && Object.keys(touches).length === 0 && parentContainer) {
        parentContainer.rotateY(5 / 180 * Math.PI * deltaTime);
      }
      renderer.render(scene, camera!);
    };

    renderer.setAnimationLoop(animationLoop);
  })());

  onDestroy(() => {
    // This function runs when the component is destroyed.
    if (renderer) {
      renderer.setAnimationLoop(null);
      renderer.dispose();
    }
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
  });

  const connectionMeshes: Mesh[] = []
  $: {
    for(const connection of connections) {
      const sourcePosition = calculateGlobePosition(connection.srcLat, connection.srcLon, radius);
      const targetPosition = calculateGlobePosition(connection.dstLat, connection.dstLon, radius);
      const distance = sourcePosition.distanceTo(targetPosition);
      let heightFactor = lerp(distance, 0, 2 * radius, 1, distance > 1.85 * radius ? 3.25 : distance > 1.4 * radius ? 2.3 : 1.5);
      
      const [newLat, newLon] = doFunnyCalculations(connection.srcLat, connection.srcLon, connection.dstLat, connection.dstLon);
      const controlPointBase = calculateGlobePosition(newLat, newLon, radius * heightFactor);
      
      heightFactor = lerp(distance, 0, 2 * radius, 1, 1.7);
      
      const controlPoint1 = new Vector3();
      const controlPoint2 = new Vector3();
      
      let helperCurve = new CubicBezierCurve3(sourcePosition, controlPointBase, controlPointBase, targetPosition);
      helperCurve.getPoint(lerp(distance, 10, 30, 0.2, 0.15), controlPoint1);
      helperCurve.getPoint(lerp(distance, 10, 30, 0.8, 0.85), controlPoint2);
      controlPoint1.multiplyScalar(heightFactor);
      controlPoint2.multiplyScalar(heightFactor);
      
      const path = new CubicBezierCurve3(sourcePosition, controlPoint1, controlPoint2, targetPosition);
      const lineGeometry = new TubeGeometry(path, 20 + Math.floor(path.getLength()), 0.08, 3, false);
      
      connectionMeshes.push(new Mesh(lineGeometry, new MeshBasicMaterial({
        blending: 2,
        opacity: 0.95,
        transparent: true,
        color: 0xf46bbe
      })));
    }

    if (meshContainer) {
      meshContainer.clear();
      meshContainer.add(...connectionMeshes);
    }
    
    dataMeshes = connectionMeshes;
  }
</script>

<div class="wrapper" style="width: {width}px; height: {height}px;">
  <canvas
    bind:this={canvasElement}
    on:mousedown={onMouseDown}
    on:mouseup={onMouseUp}
    on:mouseleave={onMouseUp}
    on:mousemove={onMouseMove}
    on:touchstart|preventDefault|stopPropagation={onTouchStart}
    on:touchend|preventDefault|stopPropagation={onTouchEnd}
    on:touchcancel|preventDefault|stopPropagation={onTouchEnd}
    on:touchmove|preventDefault|stopPropagation={onTouchMove}
  ></canvas>
</div>

<style>
  .wrapper {
    font-family: 'Open Sans', sans-serif;
    position: relative;
    touch-action: none;
    overflow: hidden; /* Ensure canvas doesn't overflow */
  }

  canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>