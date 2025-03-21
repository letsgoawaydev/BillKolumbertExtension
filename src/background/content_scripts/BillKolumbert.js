const PHYSICS = {
    GRAVITY: 0.9,
    AIR_RESISTANCE: 0.895,
    FLOOR_ENERGY_TRANSFER: 0.7,
    WALL_BOUNCE_MULTIPLIER: 1.1,
}

function audio(s) {
    let audio = new Audio(browser.runtime.getURL("/assets/sounds/collision/" + s + ".wav"));
    audio.crossOrigin = 'anonymous';
    audio.load();
    return audio;
}

const isBetween = (value, num1, num2) => value > num1 && value < num2;

const SOUND_SPLAT = audio("splat");
const SOUND_BOING = audio("boing");

const SOUNDS_WALL = [audio("wall1"), audio("wall2"), audio("wall3"), audio("wall4"), audio("wall5")];
const SOUNDS_SLAM = [audio("slam1"), audio("slam2"), audio("slam3"), audio("slam4")];


let SETTINGS = {
    CAN_SPLAT: false,
    COLLISION_PLAYS_SOUND: true,
}

let AUDIO_PLAYING = false;

let CAN_DANCE = [
    "open.spotify.com",
    "soundcloud.com",
    "music.apple.com"
]

function load() {
    browser.storage.local.get().then((obj) => {
        if (Object.keys(obj).indexOf("SETTINGS") == -1) {
            save();
        }
        else {
            SETTINGS.CAN_SPLAT = obj.SETTINGS.CAN_SPLAT != undefined ? obj.SETTINGS.CAN_SPLAT : false;
            SETTINGS.COLLISION_PLAYS_SOUND = obj.SETTINGS.COLLISION_PLAYS_SOUND != undefined ? obj.SETTINGS.COLLISION_PLAYS_SOUND : true;
            // Bills Collision sounds make bill go boing and start dancing so dont play them
            if (CAN_DANCE.indexOf(window.location.host) != -1) {
                SETTINGS.COLLISION_PLAYS_SOUND = false;
            }
        }
    });
}

this.load();

class Bill {
    x = 25;
    y = window.innerHeight / 2;
    angle = 0;
    physX = this.x;
    physY = this.y;
    gravity = 0;
    speed = 0;
    isDragging = false;
    isDead = false;
    isDance = false;
    elem = new Image();
    px = 0;
    py = 0;
    mx = 0;
    my = 0;
    lsy = 0;
    sy = 0;
    transitionFunction = "";
    collideables = [];
    constructor(div) {
        this.elem.src = browser.runtime.getURL("assets/images/bill.png");
        // you can still drag bill, just not the image
        this.elem.draggable = false;
        this.elem.width = 100;
        this.elem.style.position = "fixed";
        this.elem.style.userSelect = "none";
        this.elem.style.imageRendering = "pixelated";
        this.elem.style.transformOrigin = "center";
        this.transitionFunction = "transform calc(1000ms/30) linear";
        this.pos();

        // use gpu to render
        this.elem.style.transform = "skewX(0.0001deg)";
        //    this.elem.style.transition = this.transitionFunction;
        div.appendChild(this.elem);

        if ("onpointerrawupdate" in window) {
            document.addEventListener("pointerrawupdate", (ev) => {
                this.px = ev.x;
                this.py = ev.y;
                this.mx += ev.movementX;
                this.my += ev.movementY;
            });
        }
        else {
            document.addEventListener("mousemove", (ev) => {
                this.px = ev.x;
                this.py = ev.y;
                this.mx += ev.movementX;
                this.my += ev.movementY;
            });
        }
        // Move bill with scroll
        this.lsy = window.scrollY;
        window.addEventListener("scroll", (ev) => {
            if (!this.isDead) {
                this.sy = window.scrollY - this.lsy;
                this.lsy = window.scrollY;
                this.physY -= this.sy;
            }
            //   this.gravity += 0 > this.sy ? (this.sy / 2) : (this.sy / 30);
        })
        window.addEventListener("mouseup", (ev) => {
            if (this.isDragging) {
                this.physX = this.x;
                this.physY = this.y;
            }
            this.setDragging(false);
        });

        if ("chrome" in window) {
            window.setInterval(() => {
                this.chromeUpdate();
            }, 1000 / 30);
            this.updatePhysics();
        }
    }


    chromeUpdate() {
        this.updatePhysics();
    }

    timeUntilPhys = 0.00;
    lastElapsed = 0.00;

    update(elapsed) {
        this.windowDeltaX = window.screenLeft - this.lastWindowX;
        this.windowDeltaY = window.screenTop - this.lastWindowY;
        this.lastWindowX = window.screenLeft;
        this.lastWindowY = window.screenTop;
        this.physX += this.windowDeltaX;
        this.physY += this.windowDeltaY;

        this.lastElapsed = elapsed;
        if (this.elem.matches(':hover')) {
            if (this.elem.matches(':active')) {
                this.elem.style.cursor = "grabbing";
                this.setDragging(true);
            }
            else {
                this.elem.style.cursor = "grab";
                this.setDragging(false);
            }
        }
        if (!("chrome" in window)) {
            this.timeUntilPhys += elapsed;
            let framesMissed = Math.floor(this.timeUntilPhys / (1 / 30));
            if (framesMissed > 60) {
                framesMissed = 60;
            }
            if (framesMissed >= 1) {
                //for (let i = 0; i < framesMissed; i++) {
                    this.updatePhysics();
                //}
                this.timeUntilPhys = elapsed;
            }
        }
        if (!this.isDragging) {
            this.x = this.physX;
            this.y = this.physY;
        }
        else {
            this.dragUpdate(this.px, this.py, this.mx, this.my);
        }
        if (this.isDead) {
            this.angle = 0;
        }
        else {
            if (Math.abs(this.speed) >= 1 || this.isDragging) {
                this.angle += this.speed * (1 * elapsed * 30);
            } else {
                this.angle -= this.angle * (0.2 * elapsed * 30);
            }
            this.angle = this.angle % 360;
        }
        this.animate();
        this.mx = 0;
        this.my = 0;
        this.setDance(AUDIO_PLAYING);
    }

    setDragging(b) {
        if (b != this.isDragging) {
            if (b == true) {
                // Deselect so you dont start dragging the text if you have accidentally selected some
                if (window.getSelection) { window.getSelection().removeAllRanges(); }
                else if (document.selection) { document.selection.empty(); }
                this.elem.focus();
            }
            //this.elem.style.transition = b ? "" : this.transitionFunction;
            if (!this.isDance) {
                this.elem.src = b ? browser.runtime.getURL("assets/images/bill-glow.png") : browser.runtime.getURL("assets/images/bill.png");
            }
        }
        if (b == true) {
            this.isDead = false;
        }
        else {
            if (this.isDragging && !b) {
                this.gravity += (this.gravity == 0 ? 2 : (this.gravity > 0 ? 1 : -1));
            }
        }
        this.isDragging = b;
    }

    setDance(b) {
        if (!CAN_DANCE.includes(window.location.host)) {
            return;
        }
        if (b != this.isDance) {
            if (b == true) {
                this.elem.src = browser.runtime.getURL("assets/images/bill3d.gif");
                this.gravity += 20;
            }
            else {
                this.elem.src = browser.runtime.getURL("assets/images/bill.png");
            }
        }
        this.isDance = b;
    }

    dragUpdate(cursorX, cursorY, deltaX, deltaY) {
        this.x = cursorX - (this.elem.width / 2);
        this.y = cursorY - (this.elem.height / 2);

        // using clientHeight instead of window.innerWidth to account
        // for scroll bars

        if (this.y + this.elem.height > document.documentElement.clientHeight) {
            this.y = document.documentElement.clientHeight - this.elem.height;
        }

        if (0 >= this.y) {
            this.y = 0;
        }

        if (0 >= this.x - 1) {
            this.x = 0;
        } else if (this.x + this.elem.width >= document.documentElement.clientWidth) {
            this.x = document.documentElement.clientWidth - this.elem.width;
        }

        if (!(Math.abs(deltaY) > Math.abs(deltaX))) {
            let speedToAdd = (deltaX / 2.8) + ((-deltaY) / 2.8);
            this.speed += speedToAdd;
        }
        this.gravity += (-(deltaY) * 0.1);

        if (true && 0 > this.gravity) {
            this.gravity /= 2;
        }
        this.lastX = this.x;
        this.lastY = this.y;

        this.lastPhysTime = document.timeline.currentTime;
    }

    lastX = 0;
    lastY = 0;
    lastPhysTime = 0;

    lastWindowX = window.screenX;
    windowDeltaX = 0;

    lastWindowY = window.screenY;
    windowDeltaY = 0;

    updatePhysics() {
       // this.speed += this.windowDeltaX / 60;
       // this.gravity += -(this.windowDeltaY) / 60;
        

        this.speed *= PHYSICS.AIR_RESISTANCE;
        if (!this.isDragging) {
            this.gravity -= PHYSICS.GRAVITY;
            this.lastX = this.physX;
            this.lastY = this.physY;
        }
        else {
            this.gravity *= PHYSICS.AIR_RESISTANCE;
        }
        this.physX += this.speed;
        this.physY += -this.gravity;

        if (!this.isDragging) {
            this.floorCheck();
            this.wallCheck();
            this.ceilingCheck();
        }

        this.lastPhysTime = document.timeline.currentTime;
    }
    floorCheck() {
        if (this.physY + this.elem.height > document.documentElement.clientHeight) {
            this.physY = document.documentElement.clientHeight - this.elem.height;
            this.floorCollide();
        }
        /*
        document.querySelectorAll("p").forEach((elem) => {
            this.floorElemCheck(elem);
        });
        document.querySelectorAll("img").forEach((elem) => {
            if (elem != this.elem) {
                this.floorElemCheck(elem);
            }
        });
        */
    }
    floorElemCheck(obj) {
        if (obj instanceof HTMLElement) {
            let rect = obj.getBoundingClientRect();
            if (this.physY + this.elem.height > rect.y
                && (isBetween(this.physX, rect.x, rect.x + obj.clientWidth)
                    || isBetween(this.physX + this.elem.width, rect.x, rect.x + obj.clientWidth))
                && (this.physY + this.elem.height < rect.y + (rect.height / 2))) {
                this.physY = rect.y - this.elem.height;
                this.floorCollide();
            }
        }
    }
    floorCollide() {
        if (!(this.isDance) && SETTINGS.CAN_SPLAT && (Math.abs(this.gravity) + Math.abs(this.speed)) > 40.5) {
            this.splat();
        }
        if (SETTINGS.COLLISION_PLAYS_SOUND && !this.isDead && Math.abs(this.gravity) > 6) {
            SOUND_BOING.currentTime = 0;
            SOUND_BOING.play();
        }
        this.gravity = -(this.gravity * PHYSICS.FLOOR_ENERGY_TRANSFER);
    }
    ceilingCheck() {
        if (0 > this.physY) {
            this.physY = 1;
            this.gravity = -this.gravity;
            if (SETTINGS.COLLISION_PLAYS_SOUND) {
                let sound = SOUNDS_WALL[Math.floor(Math.random() * SOUNDS_WALL.length)];
                sound.currentTime = 0;
                sound.play();
            }
        }
        /*
        document.querySelectorAll("p").forEach((elem) => {
            this.ceilingElemCheck(elem);
        });
        document.querySelectorAll("img").forEach((elem) => {
            if (elem != this.elem) {
                this.ceilingElemCheck(elem);
            }
        });
        */
    }
    ceilingElemCheck(obj) {
        if (obj instanceof HTMLElement) {
            let rect = obj.getBoundingClientRect();

            if (rect.y + rect.height > this.physY
                && (isBetween(this.physX, rect.x, rect.x + obj.clientWidth)
                    || isBetween(this.physX + this.elem.width, rect.x, rect.x + obj.clientWidth))
                && (this.physY < (rect.y + rect.height)) && this.physY < rect.y
            ) {
                this.physY = (rect.y + rect.height) + 1;
                this.gravity = -this.gravity;
                if (SETTINGS.COLLISION_PLAYS_SOUND) {
                    let sound = SOUNDS_WALL[Math.floor(Math.random() * SOUNDS_WALL.length)];
                    sound.currentTime = 0;
                    sound.play();
                }
            }
        }
    }
    splat() {
        if (SETTINGS.COLLISION_PLAYS_SOUND) {
            SOUND_SPLAT.currentTime = 0;
            SOUND_SPLAT.play();
        }
        this.speed /= 6;
        this.speed += this.speed > 0 ? 4 : -4;
        this.gravity = 0;
        this.isDead = true;
    }
    wallCheck() {
        if (0 >= this.physX - 1) {
            this.physX = 1;
            this.wallCollide();
        } else if (this.physX + this.elem.width >= document.documentElement.clientWidth) {
            this.physX = document.documentElement.clientWidth - this.elem.width;
            this.wallCollide();
        }
    }
    wallCollide() {
        if (SETTINGS.COLLISION_PLAYS_SOUND) {
            let sound;
            if (Math.abs(this.speed) > 40) {
                sound = SOUNDS_SLAM[Math.floor(Math.random() * SOUNDS_SLAM.length)];
            }
            else {
                sound = SOUNDS_WALL[Math.floor(Math.random() * SOUNDS_WALL.length)];
            }
            sound.currentTime = 0;
            sound.play();
        }
        this.speed = -(this.speed * PHYSICS.WALL_BOUNCE_MULTIPLIER);
        this.setDragging(false);
    }

    animate() {
        this.pos();
    }

    pos() {

        let t = ((document.timeline.currentTime + this.lastElapsed) - (this.lastPhysTime - this.lastElapsed)) / (1000 / 30);

        let lerpX = this.lerp(this.lastX, this.physX, t);
        let lerpY = this.lerp(this.lastY, this.physY, t);

        let rounded = Math.round((this.angle) * 1000) / 1000;
        requestAnimationFrame(() => {
            this.elem.style.willChange = "transform";
            let transform = "translate(" + lerpX + "px, " + (lerpY + (this.isDead ? 43 : (this.isDance ? -15 : 0))) + "px) "
            transform += "rotate(" + rounded + "deg) ";
            transform += "skewX(0.001deg) ";
            if (this.isDead) {
                transform += "scale(1.0, 0.2)";
            }
            else {
                if (this.isDance) {
                    transform += "scale(1.5, 1.5)";
                }
                else {
                    transform += "scale(1.0, 1.0)";
                }
            }
            this.elem.style.transform = transform;
        });
        //        this.elem.style.transform = "translate(" + this.x + "px, " + (this.y + (this.isDead ? 43 : (this.isDance ? -15 : 0))) + "px) skewX(0.001deg)";

    }

    lerp(x, y, t) {
        return x * (1 - t) + y * t;
    }
}

let div = document.createElement("div");
createCanvas();

function createCanvas() {
    div.style.position = "fixed";
    div.style.display = "block";
    div.style.top = 0;
    div.style.left = 0;
    div.style.zIndex = 99999999999;
    div.style.margin = "0px";
    div.style.padding = "0px";
    document.body.appendChild(div);
    createBill();
}

let bill = new Bill(div);
function createBill() {
    requestAnimationFrame(update);
}

let lastTime = document.timeline.currentTime;


function update(timestep) {
    if (!document.body.contains(div)) {
        document.body.appendChild(div);
    }
    (async () => {
        const response = await browser.runtime.sendMessage({ request: "audio" });
        // do something with response here, not outside the function
        AUDIO_PLAYING = response.result;
    })();

    let time = ("chrome" in window) ? document.timeline.currentTime : timestep;

    let dt = (time - lastTime) / 1000;
    lastTime = time;
    //  console.log(dt);
    bill.update(dt);
    requestAnimationFrame(update);
}