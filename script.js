const C = CONFIG;
const stage = document.getElementById("stage");

let scene;
let cam;
let renderer;
let moon;
let glow;
let light;
let stars;

let idx = -1;
let taps = 0;
let camZ = 20;

let mx = 0;
let my = 0;
let gl = true;

if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  gsap.globalTimeline.timeScale(3);
}

try {
  init3D();
} catch (e) {
  console.error("3D initialization failed:", e);
  gl = false;
  document.body.classList.add("nogl");
}

function init3D() {
  const canvas = document.getElementById("bg");

  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

  scene = new THREE.Scene();

  cam = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    300
  );

  const count = window.innerWidth < 700 ? 900 : 2000;
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    positions[i * 3] =
      (Math.random() - 0.5) * 160;

    positions[i * 3 + 1] =
      (Math.random() - 0.5) * 100;

    positions[i * 3 + 2] =
      -100 + Math.random() * 130;
  }

  const starGeometry = new THREE.BufferGeometry();

  starGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3)
  );

  stars = new THREE.Points(
    starGeometry,
    new THREE.PointsMaterial({
      size: 0.45,
      color: 0xfff1d6,
      transparent: true,
      opacity: 0.85
    })
  );

  scene.add(stars);

  // ساخت ماه
  const moonCanvas = document.createElement("canvas");

  moonCanvas.width = 256;
  moonCanvas.height = 256;

  const moonCtx = moonCanvas.getContext("2d");

  moonCtx.fillStyle = "#cfcbbd";
  moonCtx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 45; i++) {
    moonCtx.fillStyle =
      `rgba(90,88,80,${Math.random() * 0.25})`;

    moonCtx.beginPath();

    moonCtx.arc(
      Math.random() * 256,
      Math.random() * 256,
      4 + Math.random() * 22,
      0,
      Math.PI * 2
    );

    moonCtx.fill();
  }

  const moonTexture =
    new THREE.CanvasTexture(moonCanvas);

  moon = new THREE.Mesh(
    new THREE.SphereGeometry(4, 48, 48),
    new THREE.MeshStandardMaterial({
      map: moonTexture,
      roughness: 1,
      emissive: new THREE.Color(0x9b8cff),
      emissiveIntensity: 0.12
    })
  );

  moon.position.set(9, 4, -12);

  scene.add(moon);

  // نور
  light = new THREE.PointLight(
    0x9b8cff,
    1.6,
    0
  );

  light.position.set(-6, 6, 4);

  scene.add(
    light,
    new THREE.AmbientLight(0x222244, 0.8)
  );

  // هاله ماه
  const glowCanvas = document.createElement("canvas");

  glowCanvas.width = 128;
  glowCanvas.height = 128;

  const glowCtx = glowCanvas.getContext("2d");

  const gradient =
    glowCtx.createRadialGradient(
      64,
      64,
      4,
      64,
      64,
      64
    );

  gradient.addColorStop(
    0,
    "rgba(255,255,255,.55)"
  );

  gradient.addColorStop(
    1,
    "rgba(255,255,255,0)"
  );

  glowCtx.fillStyle = gradient;
  glowCtx.fillRect(0, 0, 128, 128);

  glow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(glowCanvas),
      color: 0x9b8cff,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );

  glow.scale.set(22, 22, 1);

  glow.position.copy(moon.position);

  scene.add(glow);

  resize3D();

  window.addEventListener("resize", resize3D);

  window.addEventListener("pointermove", (e) => {
    mx = e.clientX / window.innerWidth - 0.5;
    my = e.clientY / window.innerHeight - 0.5;
  });

  animate3D();
}

function resize3D() {
  if (!renderer || !cam) return;

  renderer.setSize(
    window.innerWidth,
    window.innerHeight,
    false
  );

  cam.aspect =
    window.innerWidth / window.innerHeight;

  cam.updateProjectionMatrix();
}

function animate3D() {
  requestAnimationFrame(animate3D);

  if (stars) {
    stars.rotation.y += 0.0002;
  }

  if (moon) {
    moon.rotation.y += 0.0015;
  }

  if (cam) {
    cam.position.x +=
      (mx * 3 - cam.position.x) * 0.04;

    cam.position.y +=
      (-my * 2 - cam.position.y) * 0.04;

    cam.position.z +=
      (camZ - cam.position.z) * 0.03;

    cam.lookAt(0, 0, -5);
  }

  if (renderer && scene && cam) {
    renderer.render(scene, cam);
  }
}

function tint(hex) {
  if (!gl) return;

  const color = new THREE.Color(hex);

  gsap.to(light.color, {
    r: color.r,
    g: color.g,
    b: color.b,
    duration: 2
  });

  gsap.to(glow.material.color, {
    r: color.r,
    g: color.g,
    b: color.b,
    duration: 2
  });

  gsap.to(moon.material.emissive, {
    r: color.r,
    g: color.g,
    b: color.b,
    duration: 2
  });
}

function show(i) {
  if (i >= C.scenes.length) {
    return;
  }

  idx = i;
  taps = 0;

  stage.innerHTML = "";

  const s = C.scenes[i];

  camZ = s.z;

  tint(s.tint);

  if (gl && moon) {
    const positions = [
      { x: 9, y: 4 },
      { x: 6, y: 3 },
      { x: -7, y: 1 },
      { x: 8, y: 5 },
      { x: 5, y: 3 }
    ];

    const pos = positions[i] || positions[0];

    gsap.to(moon.position, {
      x: pos.x,
      y: pos.y,
      duration: 3,
      ease: "power2.inOut"
    });

    gsap.to(glow.position, {
      x: pos.x,
      y: pos.y,
      duration: 3,
      ease: "power2.inOut"
    });
  }

  const timeline = gsap.timeline();

  let at = 0.4;

  s.lines.forEach(([text, delay]) => {
    const p = document.createElement("p");

    p.className = "line";

    p.textContent =
      text.replace("{name}", C.name);

    stage.appendChild(p);

    at += delay;

    timeline.fromTo(
      p,
      {
        opacity: 0,
        y: 18,
        filter: "blur(12px)"
      },
      {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 1.4,
        ease: "power3.out"
      },
      at
    );
  });

  const button =
    document.createElement("button");

  button.textContent = s.btn;

  stage.appendChild(button);

  button.onclick = () => {
    if (s.final) {
      finale(button);
      return;
    }

    gsap.to(stage, {
      opacity: 0,
      duration: 0.8,
      onComplete: () => {
        gsap.set(stage, {
          opacity: 1
        });

        show(i + 1);
      }
    });
  };

  if (s.type === "tap") {
    button.style.pointerEvents = "none";
    button.style.opacity = "0";
  } else {
    timeline.to(
      button,
      {
        opacity: 1,
        duration: 1
      },
      at + 1.5
    );
  }
}

function finale(button) {
  button.style.pointerEvents = "none";

  camZ = 4;

  if (gl && stars) {
    gsap.to(stars.rotation, {
      y: "+=1.2",
      duration: 3,
      ease: "power2.inOut"
    });
  }

  for (let i = 0; i < 40; i++) {
    const spark =
      document.createElement("div");

    spark.className = "spark";

    spark.style.left = "50%";
    spark.style.top = "60%";

    document.body.appendChild(spark);

    gsap.to(spark, {
      x:
        (Math.random() - 0.5) *
        window.innerWidth,

      y:
        -Math.random() *
        window.innerHeight *
        0.9,

      opacity: 0,

      duration:
        2 + Math.random() * 1.5,

      ease: "power2.out",

      onComplete: () => {
        spark.remove();
      }
    });
  }

  gsap.to(button, {
    opacity: 0.5,
    duration: 1,
    delay: 1.5,

    onComplete: () => {
      button.textContent = "🌙";
    }
  });

  gsap.delayedCall(4, () => {
    camZ = 16;
  });
}

window.addEventListener(
  "pointerdown",
  (e) => {
    if (e.target.closest("button")) {
      return;
    }

    const ripple =
      document.createElement("div");

    ripple.className = "ripple";

    ripple.style.left =
      e.clientX + "px";

    ripple.style.top =
      e.clientY + "px";

    document.body.appendChild(ripple);

    gsap.to(ripple, {
      scale: 5,
      opacity: 0,
      duration: 0.9,

      onComplete: () => {
        ripple.remove();
      }
    });

    const s = C.scenes[idx];

    if (!s || s.type !== "tap") {
      return;
    }

    const word =
      document.createElement("div");

    word.className = "word";

    word.textContent =
      C.words[taps % C.words.length];

    word.style.left =
      e.clientX + "px";

    word.style.top =
      e.clientY + "px";

    document.body.appendChild(word);

    gsap.fromTo(
      word,
      {
        scale: 0,
        opacity: 0
      },
      {
        scale: 1,
        opacity: 1,
        duration: 0.4
      }
    );

    gsap.to(word, {
      y: -60,
      opacity: 0,
      duration: 1.6,
      delay: 0.6,

      onComplete: () => {
        word.remove();
      }
    });

    taps++;

    if (taps === C.needTaps) {
      const p =
        document.createElement("p");

      p.className = "line";

      p.textContent = s.done;

      stage.insertBefore(
        p,
        stage.lastChild
      );

      gsap.fromTo(
        p,
        {
          opacity: 0,
          y: 18
        },
        {
          opacity: 1,
          y: 0,
          duration: 1.2,
          delay: 1
        }
      );

      const button =
        stage.querySelector("button");

      button.style.pointerEvents =
        "auto";

      gsap.to(button, {
        opacity: 1,
        duration: 1,
        delay: 2
      });
    }
  }
);

show(0);