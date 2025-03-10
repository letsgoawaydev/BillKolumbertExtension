const PHYSICS = {
    GRAVITY: 1.1,
    AIR_RESISTANCE: 0.895,
    FLOOR_ENERGY_TRANSFER: 0.7,
    WALL_BOUNCE_MULTIPLIER: 1.1,
}

let AUDIO_PLAYING = false;

let CAN_DANCE = [
    "open.spotify.com",
    "soundcloud.com",
    "music.apple.com"
]

class Bill {
    x = 0;
    y = 0;
    angle = 0;
    physX = 0;
    physY = 0;
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
    physThread = -1;
    constructor(div) {
        this.elem.src = chrome.runtime.getURL("assets/images/bill.png");
        this.elem.draggable = false;
        this.elem.width = 100;
        this.elem.style.position = "fixed";
        this.elem.style.userSelect = "none";
        this.elem.style.imageRendering = "pixelated";
        div.appendChild(this.elem);
        this.physThread = window.setInterval(() => { this.updatePhysics() }, 1000 / 30);
        document.addEventListener("mousemove", (ev) => {
            this.px = ev.x;
            this.py = ev.y;
            this.mx += ev.movementX;
            this.my += ev.movementY;
        });
        window.addEventListener("scroll", (ev) => {
            this.sy = window.scrollY - this.lsy;
            this.lsy = window.scrollY;
            this.physY -= this.sy;
        })
        window.addEventListener("mouseup", (ev) => {
            window.clearInterval(this.physThread);
            if (this.isDragging) {
                this.physX = this.x;
                this.physY = this.y;
            }
            this.setDragging(false);
            this.updatePhysics();
            this.physThread = window.setInterval(() => { this.updatePhysics() }, 1000 / 30);
        });
    }
    update(elapsed) {
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
        if (!this.isDragging) {
            this.x = this.physX;
            this.y = this.physY;
            this.elem.style.transition = "left 33.3333ms linear, top 33.3333ms linear";
        }
        else {
            this.dragUpdate(this.px, this.py, this.mx, this.my);
            this.elem.style.transition = "";
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
        }
        this.angle = this.angle % 360;
        this.animate();
        this.mx = 0;
        this.my = 0;

        this.setDance(AUDIO_PLAYING);
        
    }


    setDragging(b) {
        if (b != this.isDragging && !this.isDance) {
            this.elem.src = b ? chrome.runtime.getURL("assets/images/bill-glow.png") : chrome.runtime.getURL("assets/images/bill.png");
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
                this.elem.src = chrome.runtime.getURL("assets/images/bill3d.gif");
                this.gravity += 20;
            }
            else {
                this.elem.src = chrome.runtime.getURL("assets/images/bill.png");
            }
        }
        this.isDance = b;
    }

    dragUpdate(cursorX, cursorY, deltaX, deltaY) {
        this.x = cursorX - 50;
        this.y = cursorY - 50;
        if (this.y + 100 > window.innerHeight) {
            this.y = window.innerHeight - 100;
        }

        if (0 >= this.y) {
            this.y = 0;
        }

        if (0 >= this.x - 1) {
            this.x = 0;
        } else if (this.x + 100 >= window.innerWidth) {
            this.x = window.innerWidth - 100;
        }

        if (!(Math.abs(deltaY) > Math.abs(deltaX))) {
            let speedToAdd = (deltaX / 2.8) + ((-deltaY) / 2.8);
            this.speed += speedToAdd;
        }
        this.gravity += (-(deltaY) * 0.1);

        if (true && 0 > this.gravity) {
            this.gravity /= 2;
        }
        this.pos();
    }
    updatePhysics() {
        this.speed *= PHYSICS.AIR_RESISTANCE;
        if (!this.isDragging) {
            this.gravity -= PHYSICS.GRAVITY;
        }
        else {
            this.gravity *= PHYSICS.AIR_RESISTANCE;
        }
        this.physX += this.speed;
        this.physY += -this.gravity;

        if (!this.isDragging) {
            this.pos();

            this.floorCheck();
            this.wallCheck();
        }
        if (0 > this.physY) {
            this.physY = 0;
            this.gravity = -this.gravity;
        }

    }
    floorCheck() {
        if (this.physY + 100 > window.innerHeight) {
            this.physY = window.innerHeight - 100;
            this.floorCollide();
        }
    }
    floorCollide() {
        if ((Math.abs(this.gravity) + Math.abs(this.speed)) > 40.5 && !this.isDance) {
            this.splat();
        }
        this.gravity = -(this.gravity * PHYSICS.FLOOR_ENERGY_TRANSFER);
    }
    splat() {
        this.speed /= 6;
        this.speed += this.speed > 0 ? 4 : -4;
        this.gravity = 0;
        this.isDead = true;
    }
    wallCheck() {
        if (0 >= this.physX - 1) {
            this.physX = 0;
            this.wallCollide();
        } else if (this.physX + 100 >= window.innerWidth) {
            this.physX = window.innerWidth - 100;
            this.wallCollide();
        }
    }
    wallCollide() {
        this.speed = -(this.speed * PHYSICS.WALL_BOUNCE_MULTIPLIER);
        this.setDragging(false);
    }

    animate() {
        this.elem.style.rotate = this.angle + "deg";
        if (this.isDead) {
            this.elem.style.transform = "scale(1.0,0.2) translateY(100px)";
        }
        else {
            if (this.isDance) {
                this.elem.style.transform = "scale(1.5,1.5) translate(0px, 0px)";
            }
            else {
                this.elem.style.transform = "scale(1.0,1.0) translate(0px, 0px)";
            }
        }
    }

    pos() {
        this.elem.style.left = this.x + "px";
        this.elem.style.top = (this.y + ((this.isDead || this.isDance) ? 15 : 0)) + "px";
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

    let style = document.createElement("style");
    style.innerText = `
    @keyframes play {
        0% { background-position: 0px; }
        100% { background-position: 4662px; }
    }
    `;
    div.appendChild(style);

    createBill();
}

let bill = new Bill(div);
function createBill() {
    requestAnimationFrame(update);
}

let lastTime = document.timeline.currentTime;


function update() {
    if (!document.body.contains(div)) {
        document.body.appendChild(div);
    }
    (async () => {
        const response = await chrome.runtime.sendMessage({ request: "audio" });
        // do something with response here, not outside the function
        AUDIO_PLAYING = response.result;
    })();
    let dt = (document.timeline.currentTime - lastTime) / 1000;
    lastTime = document.timeline.currentTime;
    //  console.log(dt);
    bill.update(dt);
    requestAnimationFrame(update);
}

