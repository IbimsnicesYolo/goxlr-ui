import { reactive, watch } from "vue";
import { applyOperation } from "fast-json-patch";
import { websocket } from "@/util/sockets";


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
        { id: "A", light: [], channel: "Mic" },
        { id: "B", light: [], channel: "Chat" },
        { id: "C", light: [], channel: "Game" },
        { id: "D", light: [], channel: "System" }
      ],
  ["B"]: [
        { id: "A", light: [], channel: "LineOut" },
        { id: "B", light: [], channel: "LineIn" },
        { id: "C", light: [], channel: "Headphones" },
        { id: "D", light: [], channel: "Sample" }
      ],
  ["C"]: [
        { id: "A", light: [], channel: "Console" },
        { id: "B", light: [], channel: "Music" },
        { id: "C", light: [], channel: "LineOut" },
        { id: "D", light: [], channel: "Chat" }
      ],
};

console.log(banks["A"]);

watch(store, async () => {
    try {
        let b = store.activeBank;

        if (b !== active_bank) {
            active_bank = b;

            for (let i = 0; i < banks[active_bank].length; i++) {
                let command = {
                    "SetFader": [banks[active_bank][i].id, banks[active_bank][i].channel]
                }
                
                websocket.send_command(store.getActiveSerial(), command);
                store.getActiveDevice().fader_status[banks[active_bank][i].id].channel = banks[active_bank][i].channel;
            }
        }
    } catch (error) {
        console.log(error);
    }
});