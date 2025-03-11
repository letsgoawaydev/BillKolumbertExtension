let can_splat_checkbox = document.getElementById("can_splat");

can_splat_checkbox.addEventListener("change", (ev) => {
    SETTINGS.CAN_SPLAT = can_splat_checkbox.checked;
    this.save();
});

let SETTINGS = {
    CAN_SPLAT: false,
}

function load() {
    browser.storage.local.get().then((obj) => {
        if (Object.keys(obj).indexOf("SETTINGS") == -1) {
            save();
        }
        else {
            SETTINGS = obj.SETTINGS;
        }
        can_splat_checkbox.checked = SETTINGS.CAN_SPLAT;
    });
}

function save() {
    browser.storage.local.set({
        SETTINGS: SETTINGS
    });
}

this.load();
