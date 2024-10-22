# Shapefiles for the Globe component

## Background

Displaying the in-built geojson supplied with amCharts is problematic for us since it takes positions on disputed territories, whereas we want to be seen to be politically neutral, and provide a product that can be uncomplicatedly used in any of the territories that the underlying model package might support.

For this reason, we decided to use boundaries as defined by WHO: specifically, that we'd show national borders and the borders of disputed regions, and only register user interactions on undisputed regions. Any complaints we receive about our choices of boundaries can then be explained.

### Alternatives

Another option would be to merge the specific complaints of Morocco, China, and India, as provided from amCharts here: https://www.amcharts.com/docs/v5/tutorials/country-specific-world-maps/. This doesn't seem much simpler technically, and is a less neutral-seeming source than WHO. Also, using shapefiles from WHO means we aren't so tied to amCharts as the mapping library.

## How to recreate or update the shapefiles

### Get the shapefiles from WHO

https://github.com/whocov/whomapper is the package publicizing these shapefiles. It includes shapefiles of national borders and of the borders of disputed regions. To get the shapefiles from there, after installation, you need to request the shapefiles *from the WHO server* (since the README says that the ones in the package may be outdated).

```R
install.packages("units")
install.packages("sf")
install.packages("ggpattern")
devtools::install_github("whocov/whomapper", force = TRUE, dependencies = TRUE)
library(whomapper)

who_adm0 <- pull_sfs(adm_level = 0)
```

### Adjust their resolution

In development, it was found that the best performance (avoiding laggy or 'sticky' behaviour in the front end) resulted from using amCharts' lowest-resolution map of borders, called worldLow. WHO's shapefiles are at a much higher resolution than that. For example, in worldLow from amcharts, the number of points Indonesia has across all its polygons is 446. In whomapper this is 16421.

[This issue](https://github.com/whocov/whomapper/issues/3) suggests a way to conveniently downsample.

```R
install.packages("rmapshaper")
simplified_who_adm0 <- who_adm0
simplified_who_adm0$adm0 <- rmapshaper::ms_simplify(who_adm0$adm0, keep = 0.02, keep_shapes = TRUE)
# disputed areas:
simplified_who_adm0$disp_area <- rmapshaper::ms_simplify(who_adm0$disp_area, keep = 0.02, keep_shapes = TRUE)
```

The option keep_shapes = TRUE is very important: without it, smaller countries such as Malta and Singapore are totally removed, since all of their boundary points are dropped.

When downsampling to keep=0.02, the map has around the same number of points per country as amCharts' 'worldLow' shapefiles.

NB, when comparing numbers of points between shapefiles, make sure to flatten the arrays (perhaps several times) since the format is multipolygons: arrays of arrays to arbitrary levels of nesting.

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

    # Modify the features to match the desired format
    modified_features <- lapply(parsed_json$features, function(feature) {
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
convert_to_js_map(simplified_who_adm0$adm0, id_col = "iso_3_code", name_col = "adm0_viz_name", output_file = "simplified_WHO_adm0_22102024.js")
```

Converting the disputed regions (make sure you remembered to downsample first):
```R
convert_to_js_map(simplified_who_adm0$disp_area, id_col = "name", name_col = "name", output_file = "simplified_WHO_disputed_areas_22102024.js")
```

You'll need to add the line `export default map;` to the end of the new js file so it can be imported.

To use this data you need to tell amCharts to reverse the polygons' points, since otherwise the borders will be inside out, and each country will be rendered as covering most of the globe except for itself! That's because the WHO data uses the opposite 'winding order' for polygons, compared to amCharts. Use amCharts' `reverseGeodata: true` option. Note that this operation seems to mutate some variable, since any immediately subsequent call does not require the same option to be passed.

### Customizations

The disputed areas contains 8 bodies of water (lakes and seas) and 4 land areas. The bodies of water, if rendered as geographical features that are not coloured as land areas, may be rendered without risk of making a statement about their ownership.

#### Disputed bodies of water

Lake Victoria
Lake Albert
Lake Tanganyika
Lake Malawi
Aral Sea
Great Lakes of NA
Great Lakes of NA (duplicated)
Great Lakes of NA (triplicaed)
Lake Titicaca

#### Disputed land areas

Western Sahara
Abyei
Aksai Chin
Jammu and Kashmir

## Discrepancies

There are 249 officially assigned ISO codes in use by ISO.

amCharts5, at least in the worldLow.js file (world in low resolution), has 257 features, all with distinct ids (most have a two-letter ISO code, and some have UM- preceding it, which designates a United States Minor OUtlying Island).

The WHO source has just 241 features.

It is conceivable that the model package will one day support a country whose borders are not supplied by WHO, in which case we can always collate it from another source, or pass it in as a separate amCharts Series object at runtime.
