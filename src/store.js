import { reactive, watch } from "vue";
import { applyOperation } from "fast-json-patch";
import { websocket } from "@/util/sockets";
import {MuteButtonNamesForFader, ScribbleNames} from "@/util/mixerMapping";



export const store = reactive({
    is_connected: false,
    has_connected: false,
    have_device: false,
    active: true,
    activeSerial: "",

    activeBank: "A",

    pausedPaths: [],

    on_connected: [],
    on_disconnected: [],

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

    onConnected(func) {
        this.on_connected.push(func);
    },

    onDisconnected(func) {
        this.on_disconnected(func);
    },

    socketDisconnected() {
        this.activeSerial = "";
        this.status = {
            "mixers": {},
            "files": {}
        };

        this.is_connected = false;
        for (let func of this.on_disconnected) {
            func();
        }
    },


    socketConnected(status) {
        this.has_connected = true;
        this.replaceData(status);
        this.is_connected = true;

        for (let func of this.on_connected) {
            func();
        }
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
        return this.is_connected;
    },

    // These methods determine whether at any point in the past we've connected..
    hasConnected() {
        return this.has_connected;
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
        { id: "A", channel: "Mic", light: {"style":"GradientMeter","colours":{"colour_one":"FF000D","colour_two":"1AFF67"}, "off_style":"Colour2","coloursM":{"colour_one":"FF1F04","colour_two":"3AFF1B"}, "scribble":{"colour_one":"63E4FF", "file_name":"mic.png","bottom_text":"Mic","left_text": null,"inverted":true}}},
        { id: "B", channel: "Chat", light: {"style":"GradientMeter","colours":{"colour_one":"FF000D","colour_two":"1AFF67"}, "off_style":"Colour2","coloursM":{"colour_one":"FF1F04","colour_two":"3AFF1B"}, "scribble":{"colour_one":"4FF1FF", "file_name":"person.png","bottom_text":"Discord","left_text": null,"inverted":true}}},
        { id: "C", channel: "Music", light: {"style":"GradientMeter","colours":{"colour_one":"FF000D","colour_two":"1AFF67"}, "off_style":"Colour2","coloursM":{"colour_one":"FF1F04","colour_two":"3AFF1B"}, "scribble":{"colour_one":"51FF13", "file_name":"music.png","bottom_text":"Music","left_text": null,"inverted":true}}},
        { id: "D", channel: "Game", light: {"style":"GradientMeter","colours":{"colour_one":"FF000D","colour_two":"1AFF67"}, "off_style":"Colour2","coloursM":{"colour_one":"FF1F04","colour_two":"3AFF1B"}, "scribble":{"colour_one":"FFBB1E", "file_name":"level.png","bottom_text":"Game","left_text": null,"inverted": true}}}
    ],
    ["B"]: [
        { id: "A", channel: "Mic", light: {"style":"GradientMeter","colours":{"colour_one":"FF000D","colour_two":"1AFF67"}, "off_style":"Colour2","coloursM":{"colour_one":"FF1F04","colour_two":"3AFF1B"}, "scribble":{"colour_one":"FFC30C", "file_name":"person.png","bottom_text":"LineIn","left_text": null,"inverted":true}}},
        { id: "B", channel: "Music", light: {"style":"GradientMeter","colours":{"colour_one":"FF000D","colour_two":"1AFF67"}, "off_style":"Colour2","coloursM":{"colour_one":"FF1F04","colour_two":"3AFF1B"}, "scribble":{"colour_one":"51FF13", "file_name":"music.png","bottom_text":"Music","left_text":null,"inverted":true}}},
        { id: "C", channel: "LineOut", light: {"style":"GradientMeter","colours":{"colour_one":"FF000D","colour_two":"1AFF67"}, "off_style":"Colour2","coloursM":{"colour_one":"FF1F04","colour_two":"3AFF1B"}, "scribble":{"colour_one":"45FF17", "file_name":"level.png","bottom_text":"Anlage","left_text":null,"inverted":true}}},
        { id: "D", channel: "Headphones", light: {"style":"GradientMeter","colours":{"colour_one":"FF000D","colour_two":"1AFF67"}, "off_style":"Colour2","coloursM":{"colour_one":"FF1F04","colour_two":"3AFF1B"}, "scribble":{"colour_one":"FF2331", "file_name":"headphone.png","bottom_text":"Headphone","left_text":null,"inverted":true}}}
    ],
    ["C"]: [
        { id: "A", channel: "Console", light: {"style":"GradientMeter","colours":{"colour_one":"FF000D","colour_two":"1AFF67"}, "off_style":"Colour2","coloursM":{"colour_one":"FF1F04","colour_two":"3AFF1B"}, "scribble":{"colour_one":"1E00FF", "file_name":"scale.png","bottom_text":"Console","left_text": null,"inverted":true}}},
        { id: "B", channel: "Sample", light: {"style":"GradientMeter","colours":{"colour_one":"FF000D","colour_two":"1AFF67"}, "off_style":"Colour2","coloursM":{"colour_one":"FF1F04","colour_two":"3AFF1B"}, "scribble":{"colour_one":"FF00D1", "file_name":"lightbulb2.png","bottom_text":"Sample","left_text":null,"inverted":true}}},
        { id: "C", channel: "LineIn", light: {"style":"GradientMeter","colours":{"colour_one":"FF000D","colour_two":"1AFF67"}, "off_style":"Colour2","coloursM":{"colour_one":"FF1F04","colour_two":"3AFF1B"}, "scribble":{"colour_one":"FFC30C", "file_name":"person.png","bottom_text":"LineIn","left_text":null,"inverted":true}}},
        { id: "D", channel: "System", light: {"style":"GradientMeter","colours":{"colour_one":"FF000D","colour_two":"1AFF67"}, "off_style":"Colour2","coloursM":{"colour_one":"FF1F04","colour_two":"3AFF1B"}, "scribble":{"colour_one":"FFFCEF", "file_name":"scale.png","bottom_text":"System","left_text":null,"inverted":true}}}
    ],
};

watch(store, async () => {
    try {
        let b = store.activeBank;

        if (b !== active_bank) {
            active_bank = b;

            for (let i = 0; i < banks[active_bank].length; i++) {
                let fader = banks[active_bank][i];
                websocket.send_command(store.getActiveSerial(), {"SetFader": [fader.id, fader.channel]});

                let l = banks[active_bank][i].light;
                websocket.send_command(store.getActiveSerial(), {"SetFaderDisplayStyle": [fader.id, l["style"]]}); // Meter, Gradient, GradientMeter, TwoColour
                websocket.send_command(store.getActiveSerial(), {"SetSimpleColour": [ScribbleNames[fader.id], l["scribble"]["colour_one"]]});
                websocket.send_command(store.getActiveSerial(), {"SetScribbleInvert": [fader.id, l["scribble"]["inverted"]]}); // bool
                websocket.send_command(store.getActiveSerial(), {"SetScribbleIcon": [fader.id, l["scribble"]["file_name"]]}); // icon name
                websocket.send_command(store.getActiveSerial(), {"SetScribbleText": [fader.id, l["scribble"]["bottom_text"]]}); // ""
                websocket.send_command(store.getActiveSerial(), {"SetScribbleNumber": [fader.id, l["scribble"]["left_text"]]}); // null or ""
                websocket.send_command(store.getActiveSerial(), {"SetFaderColours": [fader.id, l["colours"]["colour_one"], l["colours"]["colour_two"]]});
                websocket.send_command(store.getActiveSerial(), {"SetButtonColours": [MuteButtonNamesForFader[fader.id], l["coloursM"]["colour_one"], l["coloursM"]["colour_two"]]});
                websocket.send_command(store.getActiveSerial(), {"SetButtonOffStyle": [MuteButtonNamesForFader[fader.id], l["off_style"]]}); // Colour2 , Dimmed, Colour2
            }
        }
    } catch (error) {
        console.log(error);
    }
});