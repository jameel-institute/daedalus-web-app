/* eslint-disable no-console */
/* eslint-disable node/prefer-global/process */
import * as fs from "node:fs";

// Get the file path from command-line arguments
const filePath = process.argv[2];

if (!filePath) {
  console.error("Please provide the file path as a command-line argument.");
  process.exit(1);
}

// Load the GeoJSON file
const fileContent = fs.readFileSync(filePath, "utf8");

// Extract the map object from the file content
// eslint-disable-next-line no-eval
const map = eval(fileContent.replace("export default", ""));

// Function to reverse the winding order of coordinates
function reverseWindingOrder(geometry) {
  if (geometry.type === "Polygon") {
    geometry.coordinates = geometry.coordinates.map(ring => ring.reverse());
  } else if (geometry.type === "MultiPolygon") {
    geometry.coordinates = geometry.coordinates.map(polygon => polygon.map(ring => ring.reverse()));
  }
}

// Process each feature in the map
map.features.forEach((feature) => {
  reverseWindingOrder(feature.geometry);
});

// Convert the map object back to a string
const updatedFileContent = `const map = ${JSON.stringify(map, null, 2)};\nexport default map;`;

// Save the updated content back to the file
fs.writeFileSync(filePath, updatedFileContent, "utf8");

console.log("Winding order reversed successfully.");
