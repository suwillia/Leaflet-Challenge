

// add a terrain
let terrain =L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
	maxZoom: 17,
	attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});




// Create the street map
let streets = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

// Create the map object with center and zoom options.
let map = L.map("map", {
  center: [
    40.7, -94.5
  ],
  zoom: 5,
  layers:[streets]
});

// Create a layer control and add it to the map
let baseMaps = {
  "Street Map": streets,
  "Terrain Map": terrain
  
};



// Create the tectonic plates layer group
let tectonicPlates = L.layerGroup();

// this adds the optional portional of the tectonic plates.
    d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/refs/heads/master/GeoJSON/PB2002_boundaries.json").then(
      (plateData)=>{L.geoJson(plateData, {
        color: "yellow"
    }).addTo(tectonicPlates);
      }
    );

// Create the earthquake map layer group
let emap = L.layerGroup();
//get the data for eathquakes
  let url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson"
   
  d3.json(url).then(
    (data)=>{
        console.log(data);
        // we need the info from the 'features' key to pass to the createFeatures function
        createFeatures(data.features);
    }
  );

  // we need a function to adjust for color based on depth found at features.geometry.coordinates.[2]
function depthColor(depth) {
  return  depth > 90 ? '#EA8207':
           depth > 70 ? '#bb7011' : 
           depth > 50 ? '#c39c13' : 
           depth > 30 ? '#b8be10' : 
           depth > 10 ? '#7bba17' : 
                        '#44b51b'; 
                      
}
// function that processes the data from the features key
function createFeatures(earthquakeData)
{
  // console.log data to make sure it gets into this function
  console.log(earthquakeData);

  // function to build markers
    function style(feature) {
      return{
        radius:feature.properties.mag *10,
        fillColor:depthColor(feature.geometry.coordinates[2]),
        color: '#FEFB01',
        weight: 1,
        opacity: 1,
        fillOpacity:0.9
      };
    }



// Function to create circle markers
function onEachFeature(feature, layer) {

  // convert timestamp to date
  var date= new Date(feature.properties.time);
  var realdate = date.toLocaleDateString();
  // create popup with the data we want to show
  layer.bindPopup(`${feature.properties.title} <br> Depth: ${feature.geometry.coordinates[2]}km <br> Date: ${realdate}`);
}

// Make the layer of earthquake data points using circle markers
let earthquakes = L.geoJSON(earthquakeData, {
  pointToLayer: function (feature, latlng) {
    return L.circleMarker(latlng, style(feature));
  },
  onEachFeature: onEachFeature // Calls the function and binds the popups to all markers on the layer
});

// Add the earthquake data layer to the map directly
earthquakes.addTo(emap);
}


// to add legend to map
let legend = L.control({position: "bottomright"});

// use .onAdd to add content to the legend
legend.onAdd = function(map){
  // .create() to make a 'div' that is going to hold the map
  let div = L.DomUtil.create("div", "info legend"),
    depthRanges =[-10,10,30,50,70,90],
    labels=[];
    // create header for label
    let legendInfo = "<h2>Depth of Earthquake (km)</h2>"
    div.innerHTML = legendInfo;
  //loop through the depth intervals to create label
  for (let i = 0; i < depthRanges.length; i++){
    div.innerHTML +=
        '<i style="background:' + depthColor(depthRanges[i] + 1) + '"></i> ' +
        depthRanges[i] + (depthRanges[i + 1] ? '&ndash;' + depthRanges[i + 1] + '<br>' : '+');
    }

    return div;
};

//  add the legend to the map.
legend.addTo(map);
 
// Create an overlayMaps object to hold the tectonic plates layer
 let overlayMaps = {
  "Tectonic Plates": tectonicPlates,
  "Earthquakes": emap
};
// Add the layer control to the map with the tectonic plates and earthquakes as overlays
L.control.layers(baseMaps, overlayMaps, { collapsed: false }).addTo(map);

// Add the tectonic plates and earthquake layers to the map
tectonicPlates.addTo(map);
emap.addTo(map);


