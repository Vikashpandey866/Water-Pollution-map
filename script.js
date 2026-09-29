// ------------------------------
// India Water Pollution Map
// ------------------------------

const map = L.map("map", {
  zoomControl: true,
  minZoom: 4,
  maxZoom: 9
}).setView([22.8, 79.2], 5);

// Satellite layer, similar to the reference image.
const satellite = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    maxZoom: 19,
    attribution: "Tiles © Esri"
  }
).addTo(map);

// Optional street layer.
const streets = L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors"
  }
);

L.control.layers({
  "Satellite": satellite,
  "Street Map": streets
}, null, { position: "topright" }).addTo(map);

// --------------------------------
// SAMPLE PROJECT DATA
// Replace these values with your
// verified water-quality dataset.
// --------------------------------

const pollutionData = {
  "Uttar Pradesh": {
    score: 82,
    level: "Very High",
    quality: "Poor",
    source: "Sewage / industrial waste"
  },
  "Bihar": {
    score: 76,
    level: "Very High",
    quality: "Poor",
    source: "Sewage discharge"
  },
  "Delhi": {
    score: 88,
    level: "Very High",
    quality: "Poor",
    source: "Urban & industrial waste"
  },
  "West Bengal": {
    score: 69,
    level: "High",
    quality: "Poor",
    source: "Industrial / domestic waste"
  },
  "Maharashtra": {
    score: 63,
    level: "High",
    quality: "Moderate",
    source: "Industrial discharge"
  },
  "Gujarat": {
    score: 58,
    level: "High",
    quality: "Moderate",
    source: "Industrial waste"
  },
  "Rajasthan": {
    score: 42,
    level: "Moderate",
    quality: "Moderate",
    source: "Urban runoff"
  },
  "Madhya Pradesh": {
    score: 48,
    level: "Moderate",
    quality: "Moderate",
    source: "Domestic waste"
  },
  "Karnataka": {
    score: 36,
    level: "Moderate",
    quality: "Fair",
    source: "Urban runoff"
  },
  "Tamil Nadu": {
    score: 55,
    level: "High",
    quality: "Moderate",
    source: "Industrial discharge"
  },
  "Kerala": {
    score: 27,
    level: "Moderate",
    quality: "Fair",
    source: "Domestic waste"
  },
  "Odisha": {
    score: 61,
    level: "High",
    quality: "Moderate",
    source: "Mining / industrial waste"
  },
  "Assam": {
    score: 31,
    level: "Moderate",
    quality: "Fair",
    source: "Urban runoff"
  },
  "Himachal Pradesh": {
    score: 18,
    level: "Low",
    quality: "Good",
    source: "Limited urban waste"
  },
  "Uttarakhand": {
    score: 24,
    level: "Low",
    quality: "Good",
    source: "Domestic waste"
  },
  "Goa": {
    score: 22,
    level: "Low",
    quality: "Good",
    source: "Tourism / domestic waste"
  }
};

// Color scale.
function getColor(score) {
  if (score >= 76) return "#d62839";
  if (score >= 51) return "#f0782d";
  if (score >= 26) return "#f5c542";
  return "#2ca25f";
}

function getStateName(feature) {
  const p = feature.properties || {};

  return (
    p.NAME_1 ||
    p.name ||
    p.NAME ||
    p.st_nm ||
    p.ST_NM ||
    p.state ||
    p.State ||
    "Unknown State"
  );
}

function getData(stateName) {
  return pollutionData[stateName] || {
    score: 20,
    level: "Low",
    quality: "No project data",
    source: "Not available"
  };
}

// --------------------------------
// Side panel
// --------------------------------

function updatePanel(stateName) {
  const data = getData(stateName);

  document.getElementById("selectedState").textContent = stateName;
  document.getElementById("selectedSubtitle").textContent =
    "Water pollution overview";

  document.getElementById("level").textContent = data.level;
  document.getElementById("quality").textContent = data.quality;
  document.getElementById("score").textContent = data.score + " / 100";
  document.getElementById("source").textContent = data.source;
}

// --------------------------------
// GeoJSON
// --------------------------------

const geoJsonUrl =
  "https://raw.githubusercontent.com/india-in-data/india-states-2019/master/india_states.geojson";

let geoLayer;

fetch(geoJsonUrl)
  .then(response => {
    if (!response.ok) {
      throw new Error("Could not load India state GeoJSON");
    }
    return response.json();
  })
  .then(geojson => {

    geoLayer = L.geoJSON(geojson, {

      style: feature => {
        const stateName = getStateName(feature);
        const data = getData(stateName);

        return {
          fillColor: getColor(data.score),
          weight: 1.2,
          color: "#ffffff",
          opacity: 1,
          fillOpacity: 0.76
        };
      },

      onEachFeature: (feature, layer) => {

        const stateName = getStateName(feature);
        const data = getData(stateName);

        layer.bindTooltip(stateName, {
          sticky: true,
          className: "state-label"
        });

        layer.bindPopup(`
          <div style="min-width:210px">
            <h3 style="margin-bottom:8px">💧 ${stateName}</h3>
            <p><b>Pollution Level:</b> ${data.level}</p>
            <p><b>Risk Score:</b> ${data.score}/100</p>
            <p><b>Water Quality:</b> ${data.quality}</p>
            <p><b>Main Source:</b> ${data.source}</p>
          </div>
        `);

        layer.on({
          mouseover: event => {
            event.target.setStyle({
              weight: 3,
              color: "#ffffff",
              fillOpacity: 0.9
            });
          },

          mouseout: event => {
            geoLayer.resetStyle(event.target);
          },

          click: () => {
            updatePanel(stateName);
          }
        });
      }
    }).addTo(map);

    // Fit India nicely inside the map.
    map.fitBounds(geoLayer.getBounds(), {
      padding: [15, 15]
    });
  })
  .catch(error => {
    console.error(error);
    alert(
      "India state map data could not be loaded. Check your internet connection."
    );
  });

// --------------------------------
// Search
// --------------------------------

function searchState() {
  const query = document
    .getElementById("searchInput")
    .value
    .trim()
    .toLowerCase();

  if (!query || !geoLayer) return;

  let found = false;

  geoLayer.eachLayer(layer => {
    const name = getStateName(layer.feature);

    if (name.toLowerCase().includes(query)) {
      found = true;

      map.fitBounds(layer.getBounds(), {
        padding: [70, 70],
        maxZoom: 7
      });

      updatePanel(name);
      layer.openPopup();
    }
  });

  if (!found) {
    alert("State not found.");
  }
}

document
  .getElementById("searchBtn")
  .addEventListener("click", searchState);

document
  .getElementById("searchInput")
  .addEventListener("keydown", event => {
    if (event.key === "Enter") {
      searchState();
    }
  });

// --------------------------------
// Current location
// --------------------------------

document
  .getElementById("locateBtn")
  .addEventListener("click", () => {

    map.locate({
      setView: true,
      maxZoom: 8,
      enableHighAccuracy: true
    });

  });

map.on("locationfound", event => {

  L.circleMarker(event.latlng, {
    radius: 9,
    color: "#ffffff",
    weight: 3,
    fillColor: "#087ea4",
    fillOpacity: 1
  })
    .addTo(map)
    .bindPopup("📍 Your current location")
    .openPopup();

});

map.on("locationerror", () => {
  alert("Location permission was not available.");
});
