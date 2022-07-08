<template>
  <ContentBox  title="Equalizer">
    <div class="rowContent" :class="{ hidden: isVisible }">
      <Slider title="Bass" :slider-min-value=-9 :slider-max-value=9 :text-min-value=-9 :text-max-value=9 text-suffix="" :slider-value=0 />
      <Slider title="Mid" :slider-min-value=-9 :slider-max-value=9 :text-min-value=-9 :text-max-value=9 text-suffix="" :slider-value=0 />
      <Slider title="Treble" :slider-min-value=-9 :slider-max-value=9 :text-min-value=-9 :text-max-value=9 text-suffix="" :slider-value=0 />
    </div>
    <div v-if="this.device_type === 'Mini'" class="rowContent" :class="{ hidden: !isVisible }">
      <Slider :title="getTitle(0)" :id=0 :slider-min-value=-9 :slider-max-value=9 :text-min-value=-9 :text-max-value=9 text-suffix="" :slider-value=getValue(0) @value-changed="valueChange" />
      <Slider title="250Hz" :id=1 :slider-min-value=-9 :slider-max-value=9 :text-min-value=-9 :text-max-value=9 text-suffix="" :slider-value=0 />

      <Slider title="500Hz" :id=2 :slider-min-value=-9 :slider-max-value=9 :text-min-value=-9 :text-max-value=9 text-suffix="" :slider-value=0 />
      <Slider title="1KHz" :id=3 :slider-min-value=-9 :slider-max-value=9 :text-min-value=-9 :text-max-value=9 text-suffix="" :slider-value=0 />

      <Slider title="3Khz" :id=4 :slider-min-value=-9 :slider-max-value=9 :text-min-value=-9 :text-max-value=9 text-suffix="" :slider-value=0 />
      <Slider title="8KHz" :id=5 :slider-min-value=-9 :slider-max-value=9 :text-min-value=-9 :text-max-value=9 text-suffix="" :slider-value=0 />
    </div>
    <div v-else class="rowContent" :class="{ hidden: !isVisible }">
      <Slider :title="getTitle(0)" :id=0 :slider-min-value=-9 :slider-max-value=9 :text-min-value=-9 :text-max-value=9 text-suffix="" :slider-value=getValue(0) @value-changed="valueChange" />
      <Slider title="63Hz" :id=1 :slider-min-value=-9 :slider-max-value=9 :text-min-value=-9 :text-max-value=9 text-suffix="" :slider-value=0 />
      <Slider title="125Hz" :id=2 :slider-min-value=-9 :slider-max-value=9 :text-min-value=-9 :text-max-value=9 text-suffix="" :slider-value=0 />
      <Slider title="250Hz" :id=3 :slider-min-value=-9 :slider-max-value=9 :text-min-value=-9 :text-max-value=9 text-suffix="" :slider-value=0 />

      <Slider title="500Hz" :id=4 :slider-min-value=-9 :slider-max-value=9 :text-min-value=-9 :text-max-value=9 text-suffix="" :slider-value=0 />
      <Slider title="1KHz" :id=5 :slider-min-value=-9 :slider-max-value=9 :text-min-value=-9 :text-max-value=9 text-suffix="" :slider-value=0 />
      <Slider title="2KHz" :id=6 :slider-min-value=-9 :slider-max-value=9 :text-min-value=-9 :text-max-value=9 text-suffix="" :slider-value=0 />

      <Slider title="4KHz" :id=7 :slider-min-value=-9 :slider-max-value=9 :text-min-value=-9 :text-max-value=9 text-suffix="" :slider-value=0 />
      <Slider title="8KHz" :id=8 :slider-min-value=-9 :slider-max-value=9 :text-min-value=-9 :text-max-value=9 text-suffix="" :slider-value=0 />
      <Slider title="16Khz" :id=9 :slider-min-value=-9 :slider-max-value=9 :text-min-value=-9 :text-max-value=9 text-suffix="" :slider-value=0 />
    </div>
  </ContentBox>
  <ExpandoBox @expando-clicked="toggleExpando" :expanded="isVisible" />
</template>

<script>
import ContentBox from "../../ContentBox";
import Slider from "../../slider/Slider";
import ExpandoBox from "../../util/ExpandoBox";
import {store} from "@/store";
import {waitFor} from "@/util/util";
import {EqFreqs, EqMiniFreqs} from "@/util/mixerMapping";
import {websocket} from "@/util/websocket";
//import {websocket} from "@/util/websocket";
export default {
  name: "MicEqualiser",
  components: {ExpandoBox, Slider, ContentBox},

  data() {
    return {
      isVisible: false,
      device_type: undefined,
    }
  },

  created() {
    waitFor(() => store.hasActiveDevice() === true).then(
        () => {
          this.device_type = store.getActiveDevice().hardware.device_type;
        }
    );
  },

  methods: {
    getTitle(id) {
      if (!store.hasActiveDevice()) {
        return "";
      }

      // Probably a better way to do this
      let freq = undefined;

      if (this.device_type === "Mini") {
        freq = store.getActiveDevice().mic_status.equaliser_mini.frequency[EqMiniFreqs[id]];
      } else {
        freq = store.getActiveDevice().mic_status.equaliser.frequency[EqFreqs[id]];
      }

      // Turn this frequency into a 'Number'
      if (freq < 1000) {
        return Math.round(freq * 10) / 10 + "Hz";
      } else {
        return Math.round(freq) / 1000 + "Mhz";
      }
    },

    valueChange(id, value) {
      let command = (this.device_type === "Mini") ? "SetEqMiniGain" : "SetEqGain";
      let key = (this.device_type === "Mini") ? EqMiniFreqs[id] : EqFreqs[id];

      // Build the command..
      command = {
          [command]: [
              key,
              value
          ]
      }
      websocket.send_command(store.getActiveSerial(), command);
    },

    getValue(id) {
      if (!store.hasActiveDevice()) {
        return 0;
      }

      if (this.device_type === "Mini") {
        return parseInt(store.getActiveDevice().mic_status.equaliser_mini.gain[EqMiniFreqs[id]]);
      } else {
        return parseInt(store.getActiveDevice().mic_status.equaliser.gain[EqFreqs[id]]);
      }
    },

    hideExpanded() {
      return false;
    },

    toggleExpando() {
      this.isVisible = !this.isVisible;
    },
  }
}
</script>

<style scoped>
.hidden {
  visibility: hidden;
  display: none !important;
}

.rowContent {
  display: inline-flex;
  flex-direction: row;
  flex-wrap: nowrap;
}
</style>
