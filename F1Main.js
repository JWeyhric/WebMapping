
// mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoiandleWhyaWMiLCJhIjoiY21udjM1aXAyMTZmZDJxb2FmaTl0bzI1cyJ9.u2_BfMUxO3b4Mrbq8b0goA';

miami_bounds = [
  [-80.2455, 25.9525], // southwest corner
  [-80.2265, 25.9635] // northeast corner
]

var testmap = new mapboxgl.Map({
    container: 'testmap', // id of the previously made div
    style: 'mapbox://styles/jweyhric/cmonb9b8i003z01ssc2zo4d70', // custom style
    center: [-73.5261, 45.5050], // starting position
    zoom: 14.5, // starting zoom
    minZoom: 9,
    //maxBounds: miami_bounds
});

// GLOBAL TRACK VARIABLE
let currentTrack = null;

// tracks
const tracks = [
  {
    id: "canada",
    file: "Data/Tracks/ca-1978.geojson",
    poiFile: "Data/POI/canada_poi.geojson",
    center: [-73.5261, 45.5050], 
    zoom: 14.5,
    color: "#000000"
  },
  {
    id: "monaco",
    file: "Data/Tracks/mc-1929.geojson",
    poiFile: "Data/POI/monaco_poi.geojson",
    center: [7.42495, 43.73688], 
    zoom: 15.5,
    color: "#000000"
  },
  {
    id: "barcelona",
    file: "Data/Tracks/es-1991.geojson",
    center: [2.25789, 41.56966],
    zoom: 15,
    color: "#000000"
  },
  {
    id: "austria",
    file: "Data/Tracks/at-1969.geojson",
    center: [14.76232, 47.22275],
    zoom: 15,
    color: "#000000"
  },
  {
    id: "silverstone",
    file: "Data/Tracks/gb-1948.geojson",
    center: [-1.01615, 52.07160],
    zoom: 14.5,
    color: "#000000"
  }
];

// INITAL POPUP
// close button initial popup
document.getElementById("initial-popup-closebtn").addEventListener("click", function() {
  document.getElementById("initial-popup").style.display = "none";
});

// LOADING MULTIPLE GEOJSONS
testmap.on('load', function () {

  tracks.forEach(track => {
    // Add track source
    testmap.addSource(`${track.id}-track`, {
      type: "geojson",
      data: track.file
    });

    // Add track geojson layer
    testmap.addLayer({
      id: `${track.id}-line`,
      type: "line",
      source: `${track.id}-track`,
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': track.color,
        'line-width': 7
      }
    });
 
    // Add POI Source (if applicable)
    if(track.poiFile) {
      const poiSourceID = `${track.id}-poi`; 
      const pointLayerID = `${track.id}-poi-points`
      const polygonLayerID = `${track.id}-poi-polygons`

      // TEST for POI
      console.log("loading POI for:", track.id, track.poiFile);
      
      testmap.addSource(`${track.id}-poi`, {
        type: 'geojson',
        data: track.poiFile
      });
      
      // POI Polygon Layer
      testmap.addLayer({
        id: polygonLayerID,
        type: 'fill',
        source: poiSourceID,
        paint: {
          'fill-color': [
            'match',
            ['get', 'type'],
            'grandstand', '#e10600',
            'bathroom', '#1e90ff',
            'food', '#ffaa00',
            'paddock', '#7b2cbf',
            '#333333'
          ],
          'fill-opacity': 0.4,
          'fill-outline-color': '#000000'
        }
      });

      // POI point layer
      testmap.addLayer({
        id: pointLayerID,
        type: 'circle',
        source: poiSourceID,
        paint: {
          'circle-radius': 5,
          'circle-color': [
            'match',
            ['get', 'type'],
            'history', '#ffd700',
            '#333333'
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });
      // Make POIs Interactable
      [pointLayerID, polygonLayerID].forEach(layerID => {
        testmap.on("click", layerID, (e) => {
          const props = e.features[0].properties;
          //const coords = e.features[0].geometry.coordinates.slice();

          new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(`
              <h3>${props.name}</h3>
              <p>${props.description}</p>
              <p><strong>Type:</strong> ${props.type}</p>
              `)
            .addTo(testmap);
        });
      });

      // Change cursor to pointer when mouse is over places layer
      testmap.on('mouseenter', pointLayerID, function () {
        testmap.getCanvas().style.cursor = 'pointer';
      });

      // Change cursor back to pointer when it leaves
      testmap.on('mouseleave', pointLayerID, function () {
        testmap.getCanvas().style.cursor = ''
      });
    };
  });
});     


// EVEN MORE COMPLEX FLY TO
function cinematicTrackJump(centerCoords, finalZoom) {
  const mapDiv = document.getElementById("testmap");

  // fade map out
  mapDiv.style.transition = "opacity 0.6s";
  mapDiv.style.opacity = "0";

  setTimeout(() => {
    // instantly move (jump)
    testmap.jumpTo({
      center: centerCoords,
      zoom: finalZoom - 1,
      pitch: 0,
      bearing: 0
    });

    // wait until desitation tiles loaded
    testmap.once("idle", () => {
      // fade map back in
      mapDiv.style.opacity = "1";

      // small local zoom-in animation
      testmap.easeTo({
        zoom: finalZoom,
        duration: 1200
      });
    });
  }, 450);
}

// Add listeners for the buttons and Change Button Style
tracks.forEach(track => {
  const button = document.getElementById(track.id);

  if(button) {
    button.addEventListener("click", () => {
      cinematicTrackJump(track.center, track.zoom);
      
      // reset buttons
      document.querySelectorAll(".track-button button").forEach(btn => {
        btn.classList.remove("active-track");
      });

      // Update clicked button
      button.classList.add("active-track");
    });

    // Store original button name
    button.dataset.originalName = button.textContent;
  };
});

/* NAV */

// Toggle Tracks Nav
function toggleNav() {
  const nav = document.getElementById("trackSelect");

  // Check for nav being open
  if(nav.style.width === "250px") {
    nav.style.width = "0";
  } else {
    nav.style.width = "250px";
  }
}

// default track
const startingTrackID = "canada";

const startingTrack = tracks.find(t => t.id === startingTrackID);
if(startingTrack) {
  // Update Global Var
  currentTrack = startingTrack;

  // Update history
  updateHistory(startingTrack);

  // Highlight nav item
  const startingLink = document.querySelector(
    `[data-track="${startingTrackID}"]`
  );

  if(startingLink) {
    startingLink.classList.add("active-track");
  }

  // Update Title
  document.getElementById("currentTrackName").textContent = 
  startingTrackID.charAt(0).toUpperCase() + startingTrackID.slice(1);
}


// Get Nav Working
document.querySelectorAll(".track-link").forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();

    const trackID = link.dataset.track;
    const track = tracks.find(t => t.id === trackID);

    if(track) {
      // update global var
      currentTrack = track;

      cinematicTrackJump(track.center, track.zoom);

      document.querySelectorAll(".track-link").forEach(item => {
        item.classList.remove("active-track");
      });

      link.classList.add("active-track");

      document.getElementById("currentTrackName").textContent =
      trackID.charAt(0).toUpperCase() + trackID.slice(1);
      
      closeNav(); // Closes dropdown
      closeHistory();
      updateHistory(track); // Updated history for track
    }
  });
});

/* HISTORY TAB */

// Toggle
function toggleHistory() {
  const hist = document.getElementById("historySelect");

  // Check for nav being open
  if(hist.style.width === "250px") {
    hist.style.width = "0";
  } else {
    hist.style.width = "250px";
  }
}

function closeHistory() {
  document.getElementById("historySelect").style.width = "0";
}

function toggleWin(sectionID, button) {
  const section = document.getElementById(sectionID);
  const arrow = button.querySelector(".arrow");

  section.classList.toggle("open");
  arrow.classList.toggle("open");
}

// Update
function updateHistory(track) {
  //const historyTitle = document.getElementById("historyTitle");
  console.log("called")
  const historyItems = document.getElementById("historyItems");
  //historyTitle.textContent = track.name + "History";
  historyItems.innerHTML = "<h2>Important Track Features</h2>";

  // Get POI Data
  //const poiData = testmap.getSource(`${track.id}-poi`)._data;

  // checking if track has POI-FILE
  if(!track.poiFile) {
    historyItems.innerHTML = "<p>No history points - No Data</p>";
    checkWinners(track);
    return;
  }

  // fetch poiFile based on track
  fetch(track.poiFile)
    .then(response => response.json())
    .then(poiData => {

     /* const trackFeature = poiData.features.filter(feature =>
        feature.properties.type === "trackFeature"
      );

      const outcomes = poiData.features.filter(feature =>
        feature.properties.type === "outcome"
      );
      */

      const historyPoints = poiData.features.filter(feature =>
        feature.properties.type === "history"
      );
    
      // get History features
    historyPoints.forEach(feature => {
      const item = document.createElement("button");

      item.classList.add("history-item");
      item.textContent = feature.properties.title;

      item.addEventListener("click", () => {
        const coords = feature.geometry.coordinates;
        const props = feature.properties;

        testmap.easeTo({
          center: coords,
          zoom: props.zoom || 17,
          pitch: props.pitch || 60,
          bearing: props.bearing || 0,
          duration: 1800
        });

        document.getElementById("currentTrackName").classList.add("track-return-enabled");

      });
      historyItems.appendChild(item);
    });
  });

  /* WINNERS */
  
  const winnerItems = document.getElementById("winnerItems");

  winnerItems.innerHTML = "";

  const winners = winnersData[track.id];

  if(winners) {
    winners.forEach(winner => {
      const card = document.createElement("div");

      card.classList.add("winner-card");

      card.style.borderLeft = `6px solid ${winner.color}`;

      card.innerHTML = `
        <div class="winner-year">${winner.year}</div>
        <div class="winner-driver">${winner.driver}</div>
        <div class="winner-team">${winner.team}</div>
        `;
      winnerItems.appendChild(card);
    });
  }
}

/* NO POI FILE CHECK FOR WINNERS */
function checkWinners(track) {
  const winButton = document.getElementById("win-button");
  const winnerItems = document.getElementById("winnerItems");

  winnerItems.innerHTML = "";

  const winners = winnersData[track.id];

  console.log(winners)
  if(!winners || winners.length === 0) {
    winButton.innerHTML = "<p>No Winners Data</p>";
  }
}

/* RETURN TO TRACK FUNCTION */
function returnToTrack() {
  if (!currentTrack) return;

  testmap.easeTo({
    center: currentTrack.center,
    zoom: currentTrack.zoom,
    pitch: 0,
    bearing: 0,
    duration: 1800
  });

  document.getElementById("currentTrackName").classList.remove("track-return-enabled");

}

/* ADD CLICK */
document.getElementById("currentTrackName").addEventListener("click", returnToTrack);
