const API_BASE = "https://pokeapi.co/api/v2/pokemon";
const pokemonListElement = document.getElementById("pokemon-list");
const pokemonDetailsElement = document.getElementById("pokemon-details");
const loadingElement = document.getElementById("loading");
const errorElement = document.getElementById("error");
const searchInput = document.getElementById("search");

let fullPokemonList = [];
let detailsCache = {}; //szczegoly w cache
let first20 = [];
async function fetchFullPokemonList() {
  showLoading();
  try {
    const res = await fetch(`${API_BASE}?limit=1300`);
    if (!res.ok) throw new Error("Błąd pobierania listy Pokémonów");
    const data = await res.json();
    fullPokemonList = data.results;

    //pierwsze 20 do wyswietlenia
    first20 = await Promise.all(
      fullPokemonList.slice(0, 20).map((p) => fetchPokemonDetails(p.url))
    );
    displayPokemonList(first20);
  } catch (error) {
    showError(error.message);
  } finally {
    hideLoading();
  }
}

async function fetchPokemonDetails(url) {
  if (detailsCache[url]) return detailsCache[url];

  const res = await fetch(url);
  if (!res.ok) throw new Error("Błąd pobierania szczegółów Pokémona");
  const data = await res.json();
  detailsCache[url] = data;
  return data;
}

function displayPokemonList(pokemons) {
  pokemonListElement.innerHTML = "";
  pokemons.forEach((pokemon) => {
    const card = document.createElement("div");
    card.classList.add("pokemon-card");
    card.innerHTML = `
            <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
            <h3>#${pokemon.id} ${capitalize(pokemon.name)}</h3>
        `;
    card.addEventListener("click", () => displayPokemonDetails(pokemon));
    pokemonListElement.appendChild(card);
  });
}

function displayPokemonDetails(pokemon) {
  pokemonDetailsElement.classList.remove("info");
  const types = pokemon.types.map((t) => t.type.name).join(", ");
  const stats = pokemon.stats
    .map((stat) => `${stat.stat.name}: ${stat.base_stat}`)
    .join("<br>");

  pokemonDetailsElement.innerHTML = `
        <h2>${capitalize(pokemon.name)} (#${pokemon.id})</h2>
        <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
        <p><strong>Type:</strong> ${types}</p>
        <p><strong>Height:</strong> ${pokemon.height / 10} m</p>
        <p><strong>Weight:</strong> ${pokemon.weight / 10} kg</p>
        <p><strong>Stats:</strong><br>${stats}</p>
    `;
}

function getIdFromUrl(url) {
  const parts = url.split("/");
  return Number(parts[parts.length - 2]);
}

searchInput.addEventListener("input", async (e) => {
  const query = e.target.value.toLowerCase().trim();

  if (query === "") {
    displayPokemonList(first20);
    pokemonDetailsElement.innerHTML = "";
    return;
  }

  //po id
  const isNumeric = /^\d+$/.test(query);

  const filtered = fullPokemonList.filter((p) => {
    const nameMatches = p.name.includes(query);
    const idMatches = isNumeric && getIdFromUrl(p.url) === Number(query);
    return nameMatches || idMatches;
  });

  if (filtered.length === 0) {
    pokemonListElement.innerHTML = "<p>Brak wyników.</p>";
    pokemonDetailsElement.innerHTML = "";
    return;
  }

  showLoading();
  try {
    const details = await Promise.all(
      filtered.map((p) => fetchPokemonDetails(p.url))
    );
    displayPokemonList(details);
    pokemonDetailsElement.innerHTML = "";
  } catch (err) {
    showError("Błąd podczas wyszukiwania");
  } finally {
    hideLoading();
  }
});

function showLoading() {
  loadingElement.classList.remove("hidden");
  errorElement.classList.add("hidden");
}

function hideLoading() {
  loadingElement.classList.add("hidden");
}

function showError(message) {
  errorElement.textContent = message;
  errorElement.classList.remove("hidden");
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

fetchFullPokemonList();
