// Facts transcribed from approved spec Appendices A-C. See docs/trains.md for provenance.
import type { City, Route, Ticket } from "./types"

export const CITIES: City[] = [
  {
    "id": "atlanta",
    "name": "Atlanta",
    "x": 0.781,
    "y": 0.367
  },
  {
    "id": "boston",
    "name": "Boston",
    "x": 0.945,
    "y": 0.794
  },
  {
    "id": "calgary",
    "name": "Calgary",
    "x": 0.235,
    "y": 0.871
  },
  {
    "id": "charleston",
    "name": "Charleston",
    "x": 0.872,
    "y": 0.356
  },
  {
    "id": "chicago",
    "name": "Chicago",
    "x": 0.684,
    "y": 0.596
  },
  {
    "id": "dallas",
    "name": "Dallas",
    "x": 0.555,
    "y": 0.221
  },
  {
    "id": "denver",
    "name": "Denver",
    "x": 0.39,
    "y": 0.451
  },
  {
    "id": "duluth",
    "name": "Duluth",
    "x": 0.564,
    "y": 0.686
  },
  {
    "id": "el-paso",
    "name": "El Paso",
    "x": 0.378,
    "y": 0.185
  },
  {
    "id": "helena",
    "name": "Helena",
    "x": 0.333,
    "y": 0.677
  },
  {
    "id": "houston",
    "name": "Houston",
    "x": 0.595,
    "y": 0.163
  },
  {
    "id": "kansas-city",
    "name": "Kansas City",
    "x": 0.555,
    "y": 0.477
  },
  {
    "id": "las-vegas",
    "name": "Las Vegas",
    "x": 0.208,
    "y": 0.335
  },
  {
    "id": "little-rock",
    "name": "Little Rock",
    "x": 0.623,
    "y": 0.344
  },
  {
    "id": "los-angeles",
    "name": "Los Angeles",
    "x": 0.145,
    "y": 0.25
  },
  {
    "id": "miami",
    "name": "Miami",
    "x": 0.904,
    "y": 0.125
  },
  {
    "id": "montreal",
    "name": "Montreal",
    "x": 0.875,
    "y": 0.878
  },
  {
    "id": "nashville",
    "name": "Nashville",
    "x": 0.731,
    "y": 0.419
  },
  {
    "id": "new-orleans",
    "name": "New Orleans",
    "x": 0.686,
    "y": 0.18
  },
  {
    "id": "new-york",
    "name": "New York",
    "x": 0.894,
    "y": 0.684
  },
  {
    "id": "oklahoma-city",
    "name": "Oklahoma City",
    "x": 0.535,
    "y": 0.35
  },
  {
    "id": "omaha",
    "name": "Omaha",
    "x": 0.535,
    "y": 0.551
  },
  {
    "id": "phoenix",
    "name": "Phoenix",
    "x": 0.262,
    "y": 0.24
  },
  {
    "id": "pittsburgh",
    "name": "Pittsburgh",
    "x": 0.812,
    "y": 0.618
  },
  {
    "id": "portland",
    "name": "Portland",
    "x": 0.082,
    "y": 0.691
  },
  {
    "id": "raleigh",
    "name": "Raleigh",
    "x": 0.845,
    "y": 0.452
  },
  {
    "id": "saint-louis",
    "name": "Saint Louis",
    "x": 0.638,
    "y": 0.475
  },
  {
    "id": "salt-lake-city",
    "name": "Salt Lake City",
    "x": 0.263,
    "y": 0.497
  },
  {
    "id": "san-francisco",
    "name": "San Francisco",
    "x": 0.068,
    "y": 0.402
  },
  {
    "id": "santa-fe",
    "name": "Santa Fe",
    "x": 0.383,
    "y": 0.318
  },
  {
    "id": "sault-st-marie",
    "name": "Sault St. Marie",
    "x": 0.688,
    "y": 0.783
  },
  {
    "id": "seattle",
    "name": "Seattle",
    "x": 0.104,
    "y": 0.767
  },
  {
    "id": "toronto",
    "name": "Toronto",
    "x": 0.795,
    "y": 0.752
  },
  {
    "id": "vancouver",
    "name": "Vancouver",
    "x": 0.108,
    "y": 0.846
  },
  {
    "id": "washington",
    "name": "Washington",
    "x": 0.902,
    "y": 0.551
  },
  {
    "id": "winnipeg",
    "name": "Winnipeg",
    "x": 0.453,
    "y": 0.855
  }
]

export const ROUTES: Route[] = [
  {
    "id": "calgary__vancouver__1",
    "cityA": "vancouver",
    "cityB": "calgary",
    "length": 3,
    "color": "gray",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "seattle__vancouver__1",
    "cityA": "vancouver",
    "cityB": "seattle",
    "length": 1,
    "color": "gray",
    "parallelGroupId": "seattle__vancouver",
    "variant": 0
  },
  {
    "id": "seattle__vancouver__2",
    "cityA": "vancouver",
    "cityB": "seattle",
    "length": 1,
    "color": "gray",
    "parallelGroupId": "seattle__vancouver",
    "variant": 1
  },
  {
    "id": "calgary__seattle__1",
    "cityA": "seattle",
    "cityB": "calgary",
    "length": 4,
    "color": "gray",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "helena__seattle__1",
    "cityA": "seattle",
    "cityB": "helena",
    "length": 6,
    "color": "yellow",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "portland__seattle__1",
    "cityA": "seattle",
    "cityB": "portland",
    "length": 1,
    "color": "gray",
    "parallelGroupId": "portland__seattle",
    "variant": 0
  },
  {
    "id": "portland__seattle__2",
    "cityA": "seattle",
    "cityB": "portland",
    "length": 1,
    "color": "gray",
    "parallelGroupId": "portland__seattle",
    "variant": 1
  },
  {
    "id": "portland__salt-lake-city__1",
    "cityA": "portland",
    "cityB": "salt-lake-city",
    "length": 6,
    "color": "blue",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "portland__san-francisco__1",
    "cityA": "portland",
    "cityB": "san-francisco",
    "length": 5,
    "color": "green",
    "parallelGroupId": "portland__san-francisco",
    "variant": 0
  },
  {
    "id": "portland__san-francisco__2",
    "cityA": "portland",
    "cityB": "san-francisco",
    "length": 5,
    "color": "pink",
    "parallelGroupId": "portland__san-francisco",
    "variant": 1
  },
  {
    "id": "salt-lake-city__san-francisco__1",
    "cityA": "san-francisco",
    "cityB": "salt-lake-city",
    "length": 5,
    "color": "orange",
    "parallelGroupId": "salt-lake-city__san-francisco",
    "variant": 0
  },
  {
    "id": "salt-lake-city__san-francisco__2",
    "cityA": "san-francisco",
    "cityB": "salt-lake-city",
    "length": 5,
    "color": "white",
    "parallelGroupId": "salt-lake-city__san-francisco",
    "variant": 1
  },
  {
    "id": "los-angeles__san-francisco__1",
    "cityA": "san-francisco",
    "cityB": "los-angeles",
    "length": 3,
    "color": "yellow",
    "parallelGroupId": "los-angeles__san-francisco",
    "variant": 0
  },
  {
    "id": "los-angeles__san-francisco__2",
    "cityA": "san-francisco",
    "cityB": "los-angeles",
    "length": 3,
    "color": "pink",
    "parallelGroupId": "los-angeles__san-francisco",
    "variant": 1
  },
  {
    "id": "las-vegas__los-angeles__1",
    "cityA": "los-angeles",
    "cityB": "las-vegas",
    "length": 2,
    "color": "gray",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "los-angeles__phoenix__1",
    "cityA": "los-angeles",
    "cityB": "phoenix",
    "length": 3,
    "color": "gray",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "el-paso__los-angeles__1",
    "cityA": "los-angeles",
    "cityB": "el-paso",
    "length": 6,
    "color": "black",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "calgary__winnipeg__1",
    "cityA": "calgary",
    "cityB": "winnipeg",
    "length": 6,
    "color": "white",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "calgary__helena__1",
    "cityA": "calgary",
    "cityB": "helena",
    "length": 4,
    "color": "gray",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "helena__winnipeg__1",
    "cityA": "helena",
    "cityB": "winnipeg",
    "length": 4,
    "color": "blue",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "helena__salt-lake-city__1",
    "cityA": "helena",
    "cityB": "salt-lake-city",
    "length": 3,
    "color": "pink",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "denver__helena__1",
    "cityA": "helena",
    "cityB": "denver",
    "length": 4,
    "color": "green",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "duluth__helena__1",
    "cityA": "helena",
    "cityB": "duluth",
    "length": 6,
    "color": "orange",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "helena__omaha__1",
    "cityA": "helena",
    "cityB": "omaha",
    "length": 5,
    "color": "red",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "denver__salt-lake-city__1",
    "cityA": "salt-lake-city",
    "cityB": "denver",
    "length": 3,
    "color": "red",
    "parallelGroupId": "denver__salt-lake-city",
    "variant": 0
  },
  {
    "id": "denver__salt-lake-city__2",
    "cityA": "salt-lake-city",
    "cityB": "denver",
    "length": 3,
    "color": "yellow",
    "parallelGroupId": "denver__salt-lake-city",
    "variant": 1
  },
  {
    "id": "las-vegas__salt-lake-city__1",
    "cityA": "las-vegas",
    "cityB": "salt-lake-city",
    "length": 3,
    "color": "orange",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "denver__phoenix__1",
    "cityA": "phoenix",
    "cityB": "denver",
    "length": 5,
    "color": "white",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "phoenix__santa-fe__1",
    "cityA": "phoenix",
    "cityB": "santa-fe",
    "length": 3,
    "color": "gray",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "el-paso__phoenix__1",
    "cityA": "phoenix",
    "cityB": "el-paso",
    "length": 3,
    "color": "gray",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "sault-st-marie__winnipeg__1",
    "cityA": "winnipeg",
    "cityB": "sault-st-marie",
    "length": 6,
    "color": "gray",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "duluth__winnipeg__1",
    "cityA": "winnipeg",
    "cityB": "duluth",
    "length": 4,
    "color": "black",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "duluth__sault-st-marie__1",
    "cityA": "duluth",
    "cityB": "sault-st-marie",
    "length": 3,
    "color": "gray",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "duluth__toronto__1",
    "cityA": "duluth",
    "cityB": "toronto",
    "length": 6,
    "color": "pink",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "chicago__duluth__1",
    "cityA": "duluth",
    "cityB": "chicago",
    "length": 3,
    "color": "red",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "duluth__omaha__1",
    "cityA": "duluth",
    "cityB": "omaha",
    "length": 2,
    "color": "gray",
    "parallelGroupId": "duluth__omaha",
    "variant": 0
  },
  {
    "id": "duluth__omaha__2",
    "cityA": "duluth",
    "cityB": "omaha",
    "length": 2,
    "color": "gray",
    "parallelGroupId": "duluth__omaha",
    "variant": 1
  },
  {
    "id": "chicago__omaha__1",
    "cityA": "omaha",
    "cityB": "chicago",
    "length": 4,
    "color": "blue",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "kansas-city__omaha__1",
    "cityA": "omaha",
    "cityB": "kansas-city",
    "length": 1,
    "color": "gray",
    "parallelGroupId": "kansas-city__omaha",
    "variant": 0
  },
  {
    "id": "kansas-city__omaha__2",
    "cityA": "omaha",
    "cityB": "kansas-city",
    "length": 1,
    "color": "gray",
    "parallelGroupId": "kansas-city__omaha",
    "variant": 1
  },
  {
    "id": "kansas-city__saint-louis__1",
    "cityA": "kansas-city",
    "cityB": "saint-louis",
    "length": 2,
    "color": "blue",
    "parallelGroupId": "kansas-city__saint-louis",
    "variant": 0
  },
  {
    "id": "kansas-city__saint-louis__2",
    "cityA": "kansas-city",
    "cityB": "saint-louis",
    "length": 2,
    "color": "pink",
    "parallelGroupId": "kansas-city__saint-louis",
    "variant": 1
  },
  {
    "id": "kansas-city__oklahoma-city__1",
    "cityA": "kansas-city",
    "cityB": "oklahoma-city",
    "length": 2,
    "color": "gray",
    "parallelGroupId": "kansas-city__oklahoma-city",
    "variant": 0
  },
  {
    "id": "kansas-city__oklahoma-city__2",
    "cityA": "kansas-city",
    "cityB": "oklahoma-city",
    "length": 2,
    "color": "gray",
    "parallelGroupId": "kansas-city__oklahoma-city",
    "variant": 1
  },
  {
    "id": "little-rock__oklahoma-city__1",
    "cityA": "oklahoma-city",
    "cityB": "little-rock",
    "length": 2,
    "color": "gray",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "dallas__oklahoma-city__1",
    "cityA": "oklahoma-city",
    "cityB": "dallas",
    "length": 2,
    "color": "gray",
    "parallelGroupId": "dallas__oklahoma-city",
    "variant": 0
  },
  {
    "id": "dallas__oklahoma-city__2",
    "cityA": "oklahoma-city",
    "cityB": "dallas",
    "length": 2,
    "color": "gray",
    "parallelGroupId": "dallas__oklahoma-city",
    "variant": 1
  },
  {
    "id": "dallas__little-rock__1",
    "cityA": "dallas",
    "cityB": "little-rock",
    "length": 2,
    "color": "gray",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "dallas__houston__1",
    "cityA": "dallas",
    "cityB": "houston",
    "length": 1,
    "color": "gray",
    "parallelGroupId": "dallas__houston",
    "variant": 0
  },
  {
    "id": "dallas__houston__2",
    "cityA": "dallas",
    "cityB": "houston",
    "length": 1,
    "color": "gray",
    "parallelGroupId": "dallas__houston",
    "variant": 1
  },
  {
    "id": "houston__new-orleans__1",
    "cityA": "houston",
    "cityB": "new-orleans",
    "length": 2,
    "color": "gray",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "el-paso__houston__1",
    "cityA": "el-paso",
    "cityB": "houston",
    "length": 6,
    "color": "green",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "dallas__el-paso__1",
    "cityA": "el-paso",
    "cityB": "dallas",
    "length": 4,
    "color": "red",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "el-paso__oklahoma-city__1",
    "cityA": "el-paso",
    "cityB": "oklahoma-city",
    "length": 5,
    "color": "yellow",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "el-paso__santa-fe__1",
    "cityA": "el-paso",
    "cityB": "santa-fe",
    "length": 2,
    "color": "gray",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "oklahoma-city__santa-fe__1",
    "cityA": "santa-fe",
    "cityB": "oklahoma-city",
    "length": 3,
    "color": "blue",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "denver__oklahoma-city__1",
    "cityA": "oklahoma-city",
    "cityB": "denver",
    "length": 4,
    "color": "red",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "denver__santa-fe__1",
    "cityA": "santa-fe",
    "cityB": "denver",
    "length": 2,
    "color": "gray",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "denver__kansas-city__1",
    "cityA": "denver",
    "cityB": "kansas-city",
    "length": 4,
    "color": "black",
    "parallelGroupId": "denver__kansas-city",
    "variant": 0
  },
  {
    "id": "denver__kansas-city__2",
    "cityA": "denver",
    "cityB": "kansas-city",
    "length": 4,
    "color": "orange",
    "parallelGroupId": "denver__kansas-city",
    "variant": 1
  },
  {
    "id": "denver__omaha__1",
    "cityA": "denver",
    "cityB": "omaha",
    "length": 4,
    "color": "pink",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "miami__new-orleans__1",
    "cityA": "new-orleans",
    "cityB": "miami",
    "length": 6,
    "color": "red",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "atlanta__new-orleans__1",
    "cityA": "new-orleans",
    "cityB": "atlanta",
    "length": 4,
    "color": "orange",
    "parallelGroupId": "atlanta__new-orleans",
    "variant": 0
  },
  {
    "id": "atlanta__new-orleans__2",
    "cityA": "new-orleans",
    "cityB": "atlanta",
    "length": 4,
    "color": "yellow",
    "parallelGroupId": "atlanta__new-orleans",
    "variant": 1
  },
  {
    "id": "little-rock__new-orleans__1",
    "cityA": "new-orleans",
    "cityB": "little-rock",
    "length": 3,
    "color": "green",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "little-rock__nashville__1",
    "cityA": "little-rock",
    "cityB": "nashville",
    "length": 3,
    "color": "white",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "little-rock__saint-louis__1",
    "cityA": "little-rock",
    "cityB": "saint-louis",
    "length": 2,
    "color": "gray",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "nashville__saint-louis__1",
    "cityA": "saint-louis",
    "cityB": "nashville",
    "length": 2,
    "color": "gray",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "pittsburgh__saint-louis__1",
    "cityA": "saint-louis",
    "cityB": "pittsburgh",
    "length": 5,
    "color": "green",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "chicago__saint-louis__1",
    "cityA": "saint-louis",
    "cityB": "chicago",
    "length": 2,
    "color": "green",
    "parallelGroupId": "chicago__saint-louis",
    "variant": 0
  },
  {
    "id": "chicago__saint-louis__2",
    "cityA": "saint-louis",
    "cityB": "chicago",
    "length": 2,
    "color": "white",
    "parallelGroupId": "chicago__saint-louis",
    "variant": 1
  },
  {
    "id": "chicago__pittsburgh__1",
    "cityA": "chicago",
    "cityB": "pittsburgh",
    "length": 3,
    "color": "black",
    "parallelGroupId": "chicago__pittsburgh",
    "variant": 0
  },
  {
    "id": "chicago__pittsburgh__2",
    "cityA": "chicago",
    "cityB": "pittsburgh",
    "length": 3,
    "color": "orange",
    "parallelGroupId": "chicago__pittsburgh",
    "variant": 1
  },
  {
    "id": "chicago__toronto__1",
    "cityA": "chicago",
    "cityB": "toronto",
    "length": 4,
    "color": "white",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "montreal__sault-st-marie__1",
    "cityA": "sault-st-marie",
    "cityB": "montreal",
    "length": 5,
    "color": "black",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "montreal__toronto__1",
    "cityA": "toronto",
    "cityB": "montreal",
    "length": 3,
    "color": "gray",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "sault-st-marie__toronto__1",
    "cityA": "sault-st-marie",
    "cityB": "toronto",
    "length": 2,
    "color": "gray",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "pittsburgh__toronto__1",
    "cityA": "toronto",
    "cityB": "pittsburgh",
    "length": 2,
    "color": "gray",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "new-york__pittsburgh__1",
    "cityA": "pittsburgh",
    "cityB": "new-york",
    "length": 2,
    "color": "white",
    "parallelGroupId": "new-york__pittsburgh",
    "variant": 0
  },
  {
    "id": "new-york__pittsburgh__2",
    "cityA": "pittsburgh",
    "cityB": "new-york",
    "length": 2,
    "color": "green",
    "parallelGroupId": "new-york__pittsburgh",
    "variant": 1
  },
  {
    "id": "pittsburgh__washington__1",
    "cityA": "pittsburgh",
    "cityB": "washington",
    "length": 2,
    "color": "gray",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "pittsburgh__raleigh__1",
    "cityA": "pittsburgh",
    "cityB": "raleigh",
    "length": 2,
    "color": "gray",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "nashville__raleigh__1",
    "cityA": "nashville",
    "cityB": "raleigh",
    "length": 3,
    "color": "black",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "atlanta__nashville__1",
    "cityA": "nashville",
    "cityB": "atlanta",
    "length": 1,
    "color": "gray",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "nashville__pittsburgh__1",
    "cityA": "nashville",
    "cityB": "pittsburgh",
    "length": 4,
    "color": "yellow",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "atlanta__miami__1",
    "cityA": "atlanta",
    "cityB": "miami",
    "length": 5,
    "color": "blue",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "atlanta__charleston__1",
    "cityA": "atlanta",
    "cityB": "charleston",
    "length": 2,
    "color": "gray",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "atlanta__raleigh__1",
    "cityA": "atlanta",
    "cityB": "raleigh",
    "length": 2,
    "color": "gray",
    "parallelGroupId": "atlanta__raleigh",
    "variant": 0
  },
  {
    "id": "atlanta__raleigh__2",
    "cityA": "atlanta",
    "cityB": "raleigh",
    "length": 2,
    "color": "gray",
    "parallelGroupId": "atlanta__raleigh",
    "variant": 1
  },
  {
    "id": "charleston__miami__1",
    "cityA": "charleston",
    "cityB": "miami",
    "length": 4,
    "color": "pink",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "charleston__raleigh__1",
    "cityA": "raleigh",
    "cityB": "charleston",
    "length": 2,
    "color": "gray",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "raleigh__washington__1",
    "cityA": "raleigh",
    "cityB": "washington",
    "length": 2,
    "color": "gray",
    "parallelGroupId": "raleigh__washington",
    "variant": 0
  },
  {
    "id": "raleigh__washington__2",
    "cityA": "raleigh",
    "cityB": "washington",
    "length": 2,
    "color": "gray",
    "parallelGroupId": "raleigh__washington",
    "variant": 1
  },
  {
    "id": "new-york__washington__1",
    "cityA": "washington",
    "cityB": "new-york",
    "length": 2,
    "color": "orange",
    "parallelGroupId": "new-york__washington",
    "variant": 0
  },
  {
    "id": "new-york__washington__2",
    "cityA": "washington",
    "cityB": "new-york",
    "length": 2,
    "color": "black",
    "parallelGroupId": "new-york__washington",
    "variant": 1
  },
  {
    "id": "boston__new-york__1",
    "cityA": "new-york",
    "cityB": "boston",
    "length": 2,
    "color": "yellow",
    "parallelGroupId": "boston__new-york",
    "variant": 0
  },
  {
    "id": "boston__new-york__2",
    "cityA": "new-york",
    "cityB": "boston",
    "length": 2,
    "color": "red",
    "parallelGroupId": "boston__new-york",
    "variant": 1
  },
  {
    "id": "montreal__new-york__1",
    "cityA": "new-york",
    "cityB": "montreal",
    "length": 3,
    "color": "blue",
    "parallelGroupId": null,
    "variant": 0
  },
  {
    "id": "boston__montreal__1",
    "cityA": "boston",
    "cityB": "montreal",
    "length": 2,
    "color": "gray",
    "parallelGroupId": "boston__montreal",
    "variant": 0
  },
  {
    "id": "boston__montreal__2",
    "cityA": "boston",
    "cityB": "montreal",
    "length": 2,
    "color": "gray",
    "parallelGroupId": "boston__montreal",
    "variant": 1
  }
]

export const TICKETS: Ticket[] = [
  {
    "id": "los-angeles__new-york",
    "cityA": "los-angeles",
    "cityB": "new-york",
    "points": 21
  },
  {
    "id": "duluth__houston",
    "cityA": "duluth",
    "cityB": "houston",
    "points": 8
  },
  {
    "id": "sault-st-marie__nashville",
    "cityA": "sault-st-marie",
    "cityB": "nashville",
    "points": 8
  },
  {
    "id": "new-york__atlanta",
    "cityA": "new-york",
    "cityB": "atlanta",
    "points": 6
  },
  {
    "id": "portland__nashville",
    "cityA": "portland",
    "cityB": "nashville",
    "points": 17
  },
  {
    "id": "vancouver__montreal",
    "cityA": "vancouver",
    "cityB": "montreal",
    "points": 20
  },
  {
    "id": "duluth__el-paso",
    "cityA": "duluth",
    "cityB": "el-paso",
    "points": 10
  },
  {
    "id": "toronto__miami",
    "cityA": "toronto",
    "cityB": "miami",
    "points": 10
  },
  {
    "id": "portland__phoenix",
    "cityA": "portland",
    "cityB": "phoenix",
    "points": 11
  },
  {
    "id": "dallas__new-york",
    "cityA": "dallas",
    "cityB": "new-york",
    "points": 11
  },
  {
    "id": "calgary__salt-lake-city",
    "cityA": "calgary",
    "cityB": "salt-lake-city",
    "points": 7
  },
  {
    "id": "calgary__phoenix",
    "cityA": "calgary",
    "cityB": "phoenix",
    "points": 13
  },
  {
    "id": "los-angeles__miami",
    "cityA": "los-angeles",
    "cityB": "miami",
    "points": 20
  },
  {
    "id": "winnipeg__little-rock",
    "cityA": "winnipeg",
    "cityB": "little-rock",
    "points": 11
  },
  {
    "id": "san-francisco__atlanta",
    "cityA": "san-francisco",
    "cityB": "atlanta",
    "points": 17
  },
  {
    "id": "kansas-city__houston",
    "cityA": "kansas-city",
    "cityB": "houston",
    "points": 5
  },
  {
    "id": "los-angeles__chicago",
    "cityA": "los-angeles",
    "cityB": "chicago",
    "points": 16
  },
  {
    "id": "denver__pittsburgh",
    "cityA": "denver",
    "cityB": "pittsburgh",
    "points": 11
  },
  {
    "id": "chicago__santa-fe",
    "cityA": "chicago",
    "cityB": "santa-fe",
    "points": 9
  },
  {
    "id": "vancouver__santa-fe",
    "cityA": "vancouver",
    "cityB": "santa-fe",
    "points": 13
  },
  {
    "id": "boston__miami",
    "cityA": "boston",
    "cityB": "miami",
    "points": 12
  },
  {
    "id": "chicago__new-orleans",
    "cityA": "chicago",
    "cityB": "new-orleans",
    "points": 7
  },
  {
    "id": "montreal__atlanta",
    "cityA": "montreal",
    "cityB": "atlanta",
    "points": 9
  },
  {
    "id": "seattle__new-york",
    "cityA": "seattle",
    "cityB": "new-york",
    "points": 22
  },
  {
    "id": "denver__el-paso",
    "cityA": "denver",
    "cityB": "el-paso",
    "points": 4
  },
  {
    "id": "helena__los-angeles",
    "cityA": "helena",
    "cityB": "los-angeles",
    "points": 8
  },
  {
    "id": "winnipeg__houston",
    "cityA": "winnipeg",
    "cityB": "houston",
    "points": 12
  },
  {
    "id": "montreal__new-orleans",
    "cityA": "montreal",
    "cityB": "new-orleans",
    "points": 13
  },
  {
    "id": "sault-st-marie__oklahoma-city",
    "cityA": "sault-st-marie",
    "cityB": "oklahoma-city",
    "points": 9
  },
  {
    "id": "seattle__los-angeles",
    "cityA": "seattle",
    "cityB": "los-angeles",
    "points": 9
  }
]

export const CITY_BY_ID = Object.fromEntries(CITIES.map(city => [city.id, city]))
export const ROUTE_BY_ID = Object.fromEntries(ROUTES.map(route => [route.id, route]))
export const TICKET_BY_ID = Object.fromEntries(TICKETS.map(ticket => [ticket.id, ticket]))
