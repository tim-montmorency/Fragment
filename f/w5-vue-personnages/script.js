// L'API publique : https://rickandmortyapi.com (sans clé)
const API_URL = "https://rickandmortyapi.com/api/character/";

Vue.createApp({
  data() {
    return {
      characters: [],      // les personnages reçus de l'API
      name: "",            // le texte du champ de recherche
      status: "",          // le filtre actif ("" = tous)
      message: "Chargement...",
      statuses: [
        { value: "", label: "Tous" },
        { value: "alive", label: "Vivants" },
        { value: "dead", label: "Morts" },
        { value: "unknown", label: "Inconnus" },
      ],
      // L'API répond en anglais : on traduit le statut
      labels: { Alive: "Vivant", Dead: "Mort", unknown: "Inconnu" },
    };
  },

  methods: {
    // Un clic sur un filtre : on change la donnée, puis on recharge
    setStatus(value) {
      this.status = value;
      this.loadCharacters();
    },

    // Le fetch vers l'API, avec le nom et le statut dans l'adresse
    async loadCharacters() {
      this.message = "Chargement...";
      const params = new URLSearchParams({
        name: this.name,
        status: this.status,
      });

      try {
        const response = await fetch(API_URL + "?" + params);

        // Aucun résultat : l'API répond 404
        if (response.status === 404) {
          this.characters = [];
          this.message = "Aucun personnage trouvé.";
          return;
        }
        if (!response.ok) {
          throw new Error("API indisponible (" + response.status + ")");
        }

        const data = await response.json();
        this.characters = data.results; // les 20 premiers résultats
        this.message = "";
      } catch (error) {
        console.error(error);
        this.characters = [];
        this.message = "L'API ne répond pas. Réessayez plus tard.";
      }
    },
  },

  // Au démarrage : une première liste, sans clic
  mounted() {
    this.loadCharacters();
  },
}).mount("#app");
