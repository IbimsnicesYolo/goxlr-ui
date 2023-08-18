import { reactive, watch } from "vue";
import { applyOperation } from "fast-json-patch";
import { websocket } from "@/util/sockets";
import {MuteButtonNamesForFader, ScribbleNames} from "@/util/mixerMapping";



export const store = reactive({
    has_disconnected: false,
    have_device: false,
    active: true,
    activeSerial: "",

    activeBank: "A",

    pausedPaths: [],

    // Set a 'base' status struct..
    status: {
        "mixers": {},
        "files": {}
    },
    a11y: {
        notifications: {
            enabled: true,
            assertive: "",
            polite: ""
        }
    },

    socketDisconnected() {
        this.has_disconnected = true;
        this.activeSerial = "";
        this.status = {
            "mixers": {},
            "files": {}
        };

        this.has_disconnected = true;
    },

    daemonVersion() {
        if (this.status !== undefined) {
            if (this.status.config !== undefined) {
                return this.status.config.daemon_version;
            }
            return undefined;
        } else {
            return undefined;
        }
    },

    isConnected() {
        return !this.has_disconnected;
    },

    getConfig() {
        return this.status.config;
    },

    getVersion() {
        return this.status.config.daemon_version;
    },

    getDeviceCount() {
        return Object.keys(this.status.mixers).length;
    },

    setActiveSerial(serial) {
        this.activeSerial = serial;
    },

    getActiveDevice() {
        if (this.activeSerial === "") {
            return undefined;
        }
        return this.status.mixers[this.activeSerial];
    },

    hasActiveDevice() {
        return this.activeSerial !== "";
    },

    getActiveSerial() {
        return this.activeSerial;
    },

    getProfileFiles() {
        return this.status.files.profiles;
    },

    getMicProfileFiles() {
        return this.status.files.mic_profiles;
    },

    getPresetFiles() {
        return this.status.files.presets;
    },

    getSampleFiles() {
        return this.status.files.samples;
    },

    getIconFiles() {
        return this.status.files.icons;
    },

    replaceData(json) {
        if (this.active) {
            Object.assign(this.status, json.Status);
            this.have_device = true;
            this.validateActive();
        }
    },

    pausePatchPath(path) {
        if (path === undefined) {
            console.error("Attempted to Stop Patches for Undefined!");
            return;
        }
        let paths = path.split(";");
        for (path of paths) {
            console.log("Pausing Path: " + path);
            this.pausedPaths.push(path);
        }
    },

    resumePatchPath(path) {
        let paths = path.split(";");
        for (path of paths) {
            let index = this.pausedPaths.indexOf(path);
            if (index !== -1) {
                // We don't care about key organisation, just that the entry is gone!
                delete this.pausedPaths[index];
            }
        }
    },

    // eslint-disable-next-line no-unused-vars
    patchData(json) {
        if (this.have_device) {
            for (let patch of json.Patch) {
                if (this.pausedPaths.includes(patch.path)) {
                    continue;
                }
                if (JSON.stringify(patch).search("active_bank") !== -1) {
                    this.activeBank = patch.value;
                }
                
                applyOperation(this.status, patch, true, true, false);
            }
            this.validateActive();
        }
    },

    validateActive() {
        if (this.status.mixers[this.activeSerial] === undefined) {
            // We've lost our device, stop being active.
            this.activeSerial = "";
        }
    },

    pause() {
        this.active = false;
    },

    resume() {
        this.active = true;
    },

    isPaused() {
        return !this.active;
    },
    getAccessibilityNotification(type) {
        if (this.a11y.notifications.enabled) {
            return this.a11y.notifications[type];
        }
        return "";
    },
    setAccessibilityNotification(type, message) {
        this.a11y.notifications[type] = message;
    }
});


var active_bank = store.activeBank;
var banks = {
  ["A"]: [
    { id: "A", channel: "Game", light: {"style":"TwoColour","colours":{"colour_one":"FF000D","colour_two":"1AFF67"}, "off_style":"DimmedColour2","coloursM":{"colour_one":"00FFFF","colour_two":"FFFFFF"}, "scribble":{"colour_one":"FF2331", "file_name":"scale.png","bottom_text":"System","left_text": null,"inverted":true}}},
    { id: "B", channel: "Mic", light: {"style":"GradientMeter","colours":{"colour_one":"FF000D","colour_two":"1AFF67"}, "off_style":"DimmedColour2","coloursM":{"colour_one":"00FFFF","colour_two":"FFFFFF"}, "scribble":{"colour_one":"FF2331", "file_name":"scale.png","bottom_text":"System","left_text":"4","inverted":false}}},
    { id: "C", channel: "LineIn", light: {"style":"Gradient","colours":{"colour_one":"FF000D","colour_two":"1AFF67"}, "off_style":"DimmedColour2","coloursM":{"colour_one":"00FFFF","colour_two":"FFFFFF"}, "scribble":{"colour_one":"FF2331", "file_name":"scale.png","bottom_text":"System","left_text":"4","inverted":false}}},
    { id: "D", channel: "System", light: {"style":"Meter","colours":{"colour_one":"FF000D","colour_two":"1AFF67"}, "off_style":"DimmedColour2","coloursM":{"colour_one":"00FFFF","colour_two":"FFFFFF"}, "scribble":{"colour_one":"FF2331", "file_name":"scale.png","bottom_text":"System","left_text":"4","inverted":false}}}
  ],
  ["B"]: [
    { id: "A", channel: "Console", light: {"style":"TwoColour","colours":{"colour_one":"FF000D","colour_two":"1AFF67"}, "off_style":"DimmedColour2","coloursM":{"colour_one":"00FFFF","colour_two":"FFFFFF"}, "scribble":{"colour_one":"FF2331", "file_name":"scale.png","bottom_text":"System","left_text": null,"inverted":true}}},
    { id: "B", channel: "Mic", light: {"style":"GradientMeter","colours":{"colour_one":"FF000D","colour_two":"1AFF67"}, "off_style":"DimmedColour2","coloursM":{"colour_one":"00FFFF","colour_two":"FFFFFF"}, "scribble":{"colour_one":"FF2331", "file_name":"scale.png","bottom_text":"System","left_text":"4","inverted":false}}},
    { id: "C", channel: "LineOut", light: {"style":"Gradient","colours":{"colour_one":"FF000D","colour_two":"1AFF67"}, "off_style":"DimmedColour2","coloursM":{"colour_one":"00FFFF","colour_two":"FFFFFF"}, "scribble":{"colour_one":"FF2331", "file_name":"scale.png","bottom_text":"System","left_text":"4","inverted":false}}},
    { id: "D", channel: "Music", light: {"style":"Meter","colours":{"colour_one":"FF000D","colour_two":"1AFF67"}, "off_style":"DimmedColour2","coloursM":{"colour_one":"00FFFF","colour_two":"FFFFFF"}, "scribble":{"colour_one":"FF2331", "file_name":"scale.png","bottom_text":"System","left_text":"4","inverted":false}}}
  ],
  ["C"]: [
        { id: "A", channel: "Console", light: {"style":"TwoColour","colours":{"colour_one":"FF000D","colour_two":"1AFF67"}, "off_style":"DimmedColour2","coloursM":{"colour_one":"00FFFF","colour_two":"FFFFFF"}, "scribble":{"colour_one":"FF2331", "file_name":"scale.png","bottom_text":"System","left_text": null,"inverted":true}}},
        { id: "B", channel: "Mic", light: {"style":"GradientMeter","colours":{"colour_one":"FF000D","colour_two":"1AFF67"}, "off_style":"DimmedColour2","coloursM":{"colour_one":"00FFFF","colour_two":"FFFFFF"}, "scribble":{"colour_one":"FF2331", "file_name":"scale.png","bottom_text":"System","left_text":"4","inverted":false}}},
        { id: "C", channel: "LineOut", light: {"style":"Gradient","colours":{"colour_one":"FF000D","colour_two":"1AFF67"}, "off_style":"DimmedColour2","coloursM":{"colour_one":"00FFFF","colour_two":"FFFFFF"}, "scribble":{"colour_one":"FF2331", "file_name":"scale.png","bottom_text":"System","left_text":"4","inverted":false}}},
        { id: "D", channel: "Music", light: {"style":"Meter","colours":{"colour_one":"FF000D","colour_two":"1AFF67"}, "off_style":"DimmedColour2","coloursM":{"colour_one":"00FFFF","colour_two":"FFFFFF"}, "scribble":{"colour_one":"FF2331", "file_name":"scale.png","bottom_text":"System","left_text":"4","inverted":false}}}
      ],
};



watch(store, async () => {
    try {
        let b = store.activeBank;

        if (b !== active_bank) {
            active_bank = b;

            for (let i = 0; i < banks[active_bank].length; i++) {
                await new Promise(r => setTimeout(r, 100));
                let fader = banks[active_bank][i];
                websocket.send_command(store.getActiveSerial(), {"SetFader": [fader.id, fader.channel]});

                let l = banks[active_bank][i].light;
                websocket.send_command(store.getActiveSerial(), {"SetScribbleText": [fader.id, l["scribble"]["bottom_text"]]}); // ""
                websocket.send_command(store.getActiveSerial(), {"SetScribbleNumber": [fader.id, l["scribble"]["left_text"]]}); // null or "1"
                websocket.send_command(store.getActiveSerial(), {"SetScribbleInvert": [fader.id, l["scribble"]["inverted"]]}); // bool
                websocket.send_command(store.getActiveSerial(), {"SetScribbleIcon": [fader.id, l["scribble"]["file_name"]]}); // icon name
                websocket.send_command(store.getActiveSerial(), {"SetSimpleColour": [ScribbleNames[fader.id], l["scribble"]["colour_one"]]});
                websocket.send_command(store.getActiveSerial(), {"SetFaderDisplayStyle": [fader.id, l["style"]]}); // Meter, Gradient, GradientMeter, TwoColour
                websocket.send_command(store.getActiveSerial(), {"SetFaderColours": [fader.id, l["colours"]["colour_one"], l["colours"]["colour_two"]]});
                websocket.send_command(store.getActiveSerial(), {"SetButtonColours": [MuteButtonNamesForFader[fader.id], l["coloursM"]["colour_one"], l["coloursM"]["colour_two"]]});
                websocket.send_command(store.getActiveSerial(), {"SetButtonOffStyle": [MuteButtonNamesForFader[fader.id], l["off_style"]]}); // DimmedColour2 , Dimmed, Colour2
            }
        }
    } catch (error) {
        console.log(error);
    }
});