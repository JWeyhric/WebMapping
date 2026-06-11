// mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoiandleWhyaWMiLCJhIjoiY21udjM1aXAyMTZmZDJxb2FmaTl0bzI1cyJ9.u2_BfMUxO3b4Mrbq8b0goA';

// Initiate Map
var testmap = new mapboxgl.Map({
    container: 'testmap', // id of the previously made div
    style: 'mapbox://styles/jweyhric/cmonb9b8i003z01ssc2zo4d70', // custom style
    center: [-73.5261, 45.5055], // starting position
    zoom: 14.5, // starting zoom
    minZoom: 1, 
    // in order to allow cinematic to zoom from far out
    // max bounds will stop user from leaving/zooming too far out
    // in order to make map controls not zoom too far out each track will have a minZoom updating each switch
});

// Disable right click rotation
testmap.dragRotate.disable();

// Disable touch-rotation
testmap.touchZoomRotate.disableRotation();

// Create map controls
testmap.addControl(new mapboxgl.NavigationControl(), 'bottom-left');

// GLOBAL TRACK VARIABLE
let currentTrack = null;

// create tracks object for each track, calling the file, poifile, and giving useful information
const tracks = [
  {
    id: "canada",
    file: "Data/Tracks/ca-1978.geojson",
    poiFile: "Data/POI/canada_poi.geojson",
    center: [-73.5261, 45.5055], 
    zoom: 15,
    minZoom: 14,
    bounds: [
      [-73.56610, 45.48337],          // half-screen [-73.54500, 45.48500], // southwest corner
      [-73.48996, 45.52451]          // half-screen [-73.51210, 45.51900] // northeast corner
    ],
    color: "#000000"
  },
  {
    id: "monaco",
    file: "Data/Tracks/mc-1929.geojson",
    poiFile: "Data/POI/monaco_poi.geojson",
    center: [7.42495, 43.73688], 
    zoom: 15.5,
    bounds: [
      [7.40317, 43.72500],          // half-screen [7.41317, 43.73004], // southwest corner
      [7.44731, 43.75000]          // half-screen [7.43731, 43.74041] // northeast corner
    ],
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
    // Get track source
    testmap.addSource(`${track.id}-track`, {
      type: "geojson",
      data: track.file
    });

    // Add track geojson layer
    testmap.addLayer({
      id: `${track.id}-line`,
      type: "line",
      source: `${track.id}-track`,
      slot: "middle", // adds tracks under the 3D buildings layer to prevent track overlaying on top of buildings
      minzoom: 11, // min zoom where track is visible
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],

          11, 0.25,  // zoom 11, opacity 0
          12, 0.5,
          13, 1
        ],
        'line-color': track.color,
        'line-width': 7
      }
    });

    // Add arrow for track direction
    testmap.addLayer({
      id: `${track.id}-direction-arrows`,
      type: "symbol",
      source: `${track.id}-track`,
      slot: "middle", // same as track
      layout: {
        "symbol-placement": "line",
        "symbol-spacing": 175,
        "text-field": "\u25B6",
        "text-size": 16,
        "text-keep-upright": false,
        "text-allow-overlap": true
      },
      paint: {
        "text-color": "#e10600",
        "text-halo-color": "#ffffff",
        "text-halo-width": 2
      }
    });
 
    // Add POI Source (if applicable)
    if(track.poiFile) {
      const poiSourceID = `${track.id}-poi`; 
      const pointLayerID = `${track.id}-poi-points`
      const polygonLayerID = `${track.id}-poi-polygons`

      // TEST for POI
      //console.log("loading POI for:", track.id, track.poiFile);
      
      testmap.addSource(`${track.id}-poi`, {
        type: 'geojson',
        data: track.poiFile
      });

      // POI point layer
      testmap.addLayer({
        id: pointLayerID,
        type: 'circle',
        source: poiSourceID,
        slot: "middle", // same slot as track to avoid seeing points through buildings
        minzoom: 14, // minimum zoom for visibility
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            14, 3,
            18, 6 // zoom 18, radius 6
          ],
          'circle-color': [
            'match',
            ['get', 'type'],
            'history', '#3b49c9', // #ffd700
            '#333333'
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 1,
          'circle-stroke-opacity': 1
        }
      });
      // Make POIs Interactable
      [pointLayerID, polygonLayerID].forEach(layerID => {
        testmap.on("click", layerID, (e) => {
          const feature = e.features[0];
          const props = feature.properties;
          //const coords = e.features[0].geometry.coordinates.slice();

          console.log(props.type);
          // zoom to point on click
          if (props.type === "history") {
            zoomHistory(feature);
          }
          

          new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(`
              <h3>${props.title}</h3>
              <p>${props.description}</p>
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

/* TRACK SWITCHING FUNCTION */

// Function to animate switch between tracks
function cinematicTrackJump(centerCoords, finalZoom) {
  const mapDiv = document.getElementById("testmap");

  // Remove min zoom to make animation work
  testmap.setMinZoom(1);
  console.log(testmap.getMinZoom());

  // remove scroll ability so user doesn't pause animation
  testmap.scrollZoom.disable();

  // fade map out
  mapDiv.style.transition = "opacity 0.6s";
  mapDiv.style.opacity = "0";

  setTimeout(() => {
    // instantly move (jump)
    testmap.jumpTo({
      center: centerCoords,
      zoom: finalZoom - 12, // zoom from further out
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
        duration: 5000
      });

      testmap.once("moveend", () => {
        testmap.setMinZoom(startingTrack.minZoom);  // Once animation is done, set the minimum zoom for track
        testmap.scrollZoom.enable(); // re-enable scrolling
      });
    });
  }, 450);
}

/* NAV */

// Toggle Tracks Nav
function toggleNav() {
  const nav = document.getElementById("trackSelect");
  const controls = document.querySelector(".mapboxgl-ctrl-bottom-left");

  // Check for nav being open
  if(nav.style.width === "250px") {
    nav.style.width = "0";
    controls.style.left = "0"; // move map controls back
  } else {
    nav.style.width = "250px";
    controls.style.left = "250px"; // move map controls with sidebar
  }
}

// STARTING POSITION
const startingTrackID = "canada";

const startingTrack = tracks.find(t => t.id === startingTrackID);
if(startingTrack) {
  // Update Global Var
  currentTrack = startingTrack;

  // Set bounds
  testmap.setMaxBounds(startingTrack.bounds);

  // Update Zoom
  testmap.setZoom(startingTrack.zoom);

  // Set Min Zoom
  testmap.setMinZoom(startingTrack.minZoom);

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

      testmap.setMaxBounds(track.bounds); // set bounds

      cinematicTrackJump(track.center, track.zoom);

      document.querySelectorAll(".track-link").forEach(item => {
        item.classList.remove("active-track");
      });

      link.classList.add("active-track");

      document.getElementById("currentTrackName").textContent =
      trackID.charAt(0).toUpperCase() + trackID.slice(1);
      
      toggleNav(); // Closes dropdown
      toggleHistory();
      updateHistory(track); // Updated history for track
    }
  });
});

/* HISTORY TAB */

// Toggle History
function toggleHistory() {
  const hist = document.getElementById("historySelect");
  // move legend with sidebar
  const legend = document.getElementById("legend");

  // Check for nav being open
  if(hist.style.width === "250px") {
    hist.style.width = "0";
    legend.style.right = "25px"
  } else {
    hist.style.width = "250px";
    legend.style.right = "275px";
  }
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

  const winButton = document.getElementById("win-button");
  winButton.innerHTML = "Historical Winners <span class=arrow>&#9660;</span>";
  // Get POI Data
  //const poiData = testmap.getSource(`${track.id}-poi`)._data;

  // checking if track has POI-FILE
  if(!track.poiFile) {
    historyItems.innerHTML = "<p>No history points - No Data</p>";
    checkWinners(track); // if no POI File still need to check for winners
    return;
  }

  // fetch poiFile based on track
  fetch(track.poiFile)
    .then(response => response.json())
    .then(poiData => {

      const historyPoints = poiData.features.filter(feature =>
        feature.properties.type === "history"
      );
    
      // get History features
    historyPoints.forEach(feature => {
      const item = document.createElement("button");

      item.classList.add("history-item");
      item.textContent = feature.properties.title;

      item.addEventListener("click", () => {
        zoomHistory(feature);
      });
      historyItems.appendChild(item);
    });
  });


  /* WINNERS */
  checkWinners(track);
  
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

/* Reusable Zooming function for History Points*/
function zoomHistory(feature) {
  const coords = feature.geometry.coordinates;
  const props = feature.properties;

  testmap.easeTo({
    center: coords,
    zoom: props.zoom || 17,
    pitch: props.pitch || 60,
    bearing: props.bearing || 0,
    duration: 1800
  });

  // allow user to click track name on top to return to original view of track
  document.getElementById("currentTrackName").classList.add("track-return-enabled");
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
