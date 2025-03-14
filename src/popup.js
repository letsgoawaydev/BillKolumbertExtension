let SETTINGS = {
    CAN_SPLAT: false,
    COLLISION_PLAYS_SOUND: true,
}

let can_splat_checkbox = document.getElementById("can_splat");

can_splat_checkbox.addEventListener("change", (ev) => {
    SETTINGS.CAN_SPLAT = can_splat_checkbox.checked;
    this.save();
});

let collision_plays_sound_checkbox = document.getElementById("collision_plays_sound");

collision_plays_sound_checkbox.addEventListener("change", (ev) => {
    SETTINGS.COLLISION_PLAYS_SOUND = collision_plays_sound_checkbox.checked;
    this.save();
});

function load() {
    browser.storage.local.get().then((obj) => {
        if (Object.keys(obj).indexOf("SETTINGS") == -1) {
            save();
        }
        else {
            SETTINGS.CAN_SPLAT = obj.SETTINGS.CAN_SPLAT != undefined ? obj.SETTINGS.CAN_SPLAT : false;
            SETTINGS.COLLISION_PLAYS_SOUND = obj.SETTINGS.COLLISION_PLAYS_SOUND != undefined ? obj.SETTINGS.COLLISION_PLAYS_SOUND : true;
        }
        can_splat_checkbox.checked = SETTINGS.CAN_SPLAT;
        collision_plays_sound_checkbox.checked = SETTINGS.COLLISION_PLAYS_SOUND;
    });
}

function save() {
    browser.storage.local.set({
        SETTINGS: SETTINGS
    });
}

this.load();
