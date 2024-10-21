# Shapefiles for the Globe component

## Background

Displaying the in-built geojson supplied with amCharts is problematic for us since it takes positions on disputed territories, whereas we want to be seen to be politically neutral, and provide a product that can be uncomplicatedly used in any of the territories that the underlying model package might support.

For this reason, we decided to use boundaries as defined by WHO: specifically, that we'd show national borders and the borders of disputed regions, and only register user interactions on undisputed regions. Any complaints we receive about our choices of boundaries can then be explained.

### Alternatives

Another option would be to merge the specific complaints of Morocco, China, and India, as provided from amCharts here: https://www.amcharts.com/docs/v5/tutorials/country-specific-world-maps/. This doesn't seem much simpler technically, and is a less neutral-seeming source than WHO. Also, using shapefiles from WHO means we aren't so tied to amCharts as the mapping library.

## How to recreate or update the shapefiles

### Get the shapefiles from WHO

https://github.com/whocov/whomapper is the package publicizing these shapefiles. It includes shapefiles of national borders and others of the borders of disputed regions. To get the shapefiles from there, after installation, you need to request the shapefiles *from the WHO server* (since the README says that the ones in the package may be outdated).

```R
install.packages("units")
install.packages("sf")
install.packages("ggpattern")
devtools::install_github("whocov/whomapper", force = TRUE, dependencies = TRUE)
library(whomapper)

who_adm0 <- pull_sfs(adm_level = 0)
```

### Adjust their resolution

In development, it was found that the best performance (avoiding laggy or 'sticky' behaviour in the front end) resulted from using amCharts' lowest-resolution map of borders, called worldLow. WHO's shapefiles are at a much higher resolution than that. For example, in worldLow from amcharts, the number of points Indonesia has across all its polygons is 892. In whomapper this is 16421.

[This issue](https://github.com/whocov/whomapper/issues/3) suggests a way to conveniently downsample.

```R
install.packages("rmapshaper")
simplified_who_adm0 <- who_adm0
simplified_who_adm0$adm0 <- rmapshaper::ms_simplify(who_adm0$adm0, keep = 0.03, keep_shapes = FALSE)
# disputed areas:
simplified_who_adm0$disp_area <- rmapshaper::ms_simplify(who_adm0$disp_area, keep = 0.03, keep_shapes = FALSE)
```

This reduces the count of coordinates in Indonesia from 16421 to 2372. (This is more than the 10% 'keep' target, presumably due to the option to 'keep shapes' which I think preserves all polygons, such as islands or lakes, including very small ones, which might have had fewer than 10 coordinates.)

Even downsampling to 'keep=0.03' isn't the limit, since a visual inspection shows that the map is still highly detailed relative to worldLow.

### Convert the shapefiles from R to JSON data in JavaScript files

I used the below functions to convert R shapefiles to JS files of geojson in the right format.

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

You'll need to add the line `export default map;` to the end of the new js file so it can be imported.

To use this data you need to tell amCharts to reverse the polygons' points, since otherwise the borders will be inside out, and each country will be rendered as covering most of the globe except for itself! That's because the WHO data uses the opposite 'winding order' for polygons, compared to amCharts. Use amCharts' `reverseGeodata: true` option.

### Customizations

Depending on how the map looks, you might decide to remove the "Great Lakes of NA" feature from the eventual disputed regions data source file, as there is no great controversy between US and Canada.
