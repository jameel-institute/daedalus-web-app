First understand that there is a problem with trying to display the inbuilt geojson from amcharts in that they take positions on disputed territories. So, for politics, we want to use shapefiles from WHO, and pass on the blame to them.

(Another option would be to merge the specific complaints of Morocco, China, and India, as provided from amcharts here: https://www.amcharts.com/docs/v5/tutorials/country-specific-world-maps/)

https://github.com/whocov/whomapper is the package publicizing these shapefiles. To get the shapefiles from there, after installation, you need to request the shapefiles *from the WHO server* (since the README says that the ones in the package may be outdated).

```R
install.packages("units")
install.packages("sf")
install.packages("ggpattern")
devtools::install_github("whocov/whomapper", force = TRUE, dependencies = TRUE)
library(whomapper)

who_adm0 <- pull_sfs(adm_level = 0)
```

These, however, are at a much higher resolution that the amcharts 'worldLow' geojson. We need low-res so that browsers can handle the shapes. For example, in worldLow from amcharts, the number of points Indonesia has across all its polygons is 892. In whomapper this is 16421. [This issue](https://github.com/whocov/whomapper/issues/3) suggests a way to conveniently downsample.

```R
install.packages("rmapshaper")
simplified_who_adm0 <- who_adm0
simplified_who_adm0$adm0 <- rmapshaper::ms_simplify(who_adm0$adm0, keep = 0.03, keep_shapes = FALSE)
# disputed areas:
simplified_who_adm0$disp_area <- rmapshaper::ms_simplify(who_adm0$disp_area, keep = 0.03, keep_shapes = FALSE)
```

This reduces the count of coordinates in Indonesia from 16421 to 2372. (This is probably more than the 10% 'keep' target due to the option to 'keep shapes' which I think preserves all polygons including very small ones, which might have had less than 10 coordinates.)

HOWEVER, a visual inspection shows that we need to downsample much more than 0.1 (I'm trying 0.03 now), to approximate worldLow.

There's definitely more room to downsample from here, it's still highly detailed on a visual inspection relative to worldLow

I used the below functions to convert R shapefiles to js files of geojson in the right format.

```R
convert_to_js_map <- function(sf_object, id_col = "iso_3_code", name_col = "adm0_viz_name", output_file = "world_map.js") {
    require(sf)
    require(jsonlite)
    require(dplyr)
    require(geojsonsf)

    # Ensure the sf object is in WGS84
    sf_object <- sf::st_transform(sf_object, 4326)

    # Select relevant columns
    sf_selected <- sf_object %>%
        dplyr::select(all_of(c(id_col, name_col)), geometry)

    # Convert to GeoJSON string
    geojson_string <- geojsonsf::sf_geojson(sf_selected, simplify = FALSE)

    # Parse the GeoJSON
    parsed_json <- jsonlite::fromJSON(geojson_string, simplifyVector = FALSE)

    # Modify the features to match the desired format and reverse winding order
    modified_features <- lapply(parsed_json$features, function(feature) {
        feature$geometry <- reverse_winding(feature$geometry)
        list(
            type = "Feature",
            geometry = feature$geometry,
            properties = list(
                name = feature$properties[[name_col]],
                id = feature$properties[[id_col]]
            ),
            id = feature$properties[[id_col]]
        )
    })

    # Create the final map object
    map_object <- list(
        type = "FeatureCollection",
        features = modified_features
    )

    # Convert to JSON
    json_output <- jsonlite::toJSON(map_object, auto_unbox = TRUE, pretty = TRUE)

    # Wrap in JavaScript const declaration
    js_output <- paste0("const map = ", json_output)

    # Get the full path of the output file
    full_path <- normalizePath(output_file, mustWork = FALSE)

    # Write to file
    writeLines(js_output, output_file)

    cat("Map data has been written to", full_path, "\n")

    # Return the full path
    return(full_path)
}
```

Converting the country polygons:
```R
convert_to_js_map(simplified_who_adm0$adm0, id_col = "iso_3_code", name_col = "adm0_viz_name", output_file = "simplified_world_map_adm0.js")
```

Converting the disputed regions (make sure you remembered to downsample first):
```R
convert_to_js_map(simplified_who_adm0$disp_area, id_col = "name", name_col = "name", output_file = "simplified_WHO_map_disp_area.js")
```

You'll need to add the line 'export default map;' to the end of the new js file.

To use this data you need to tell amcharts to reverse the polygons' points, since otherwise the borders will be inside out, and each country will believe it owns most of the globe! That's because the WHO data uses the opposite 'winding order' from amcharts. Use amcharts' reverseGeodata: true option.

Remove the "Great Lakes of NA" feature as there is no great controversy between US and Canada.
