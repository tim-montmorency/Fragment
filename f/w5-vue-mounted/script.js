Vue.createApp({
  data() {
    return {
      width: 0,
    };
  },

  methods: {
    updateWidth() {
      this.width = window.innerWidth;
    },
  },

  // Une seule fois, quand le composant est branché sur la page
  mounted() {
    // À chaque redimensionnement, le navigateur appelle updateWidth
    window.addEventListener("resize", this.updateWidth);
    // Et une première fois tout de suite : sinon, width reste à 0
    this.updateWidth();
  },
}).mount("#app");
