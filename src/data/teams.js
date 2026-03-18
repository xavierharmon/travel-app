// src/data/teams.js
//
// Team data for the built-in team picker.
// Logos are served from ESPN's public CDN where available.
// MiLB teams without a known ESPN ID fall back to a generated
// initials placeholder rendered in the TeamPicker component.
//
// Logo URL patterns:
//   MLB:     https://a.espncdn.com/i/teamlogos/mlb/500/{abbr}.png
//   NHL:     https://a.espncdn.com/i/teamlogos/nhl/500/{abbr}.png
//   College: https://a.espncdn.com/i/teamlogos/ncaa/500/{espnId}.png
//   MiLB:    https://a.espncdn.com/i/teamlogos/milb/500/{espnId}.png
//            (null where ESPN doesn't have coverage — picker shows initials)

const mlbLogo  = abbr => `https://a.espncdn.com/i/teamlogos/mlb/500/${abbr}.png`;
const nhlLogo  = abbr => `https://a.espncdn.com/i/teamlogos/nhl/500/${abbr}.png`;
const ncaaLogo = id   => `https://a.espncdn.com/i/teamlogos/ncaa/500/${id}.png`;
const milbLogo = id   => id ? `https://a.espncdn.com/i/teamlogos/milb/500/${id}.png` : null;

// ── MLB ──────────────────────────────────────────────────────────
const MLB_TEAMS = [
  { name: "Baltimore Orioles",     abbr: "bal", logo: mlbLogo("bal") },
  { name: "Boston Red Sox",        abbr: "bos", logo: mlbLogo("bos") },
  { name: "New York Yankees",      abbr: "nyy", logo: mlbLogo("nyy") },
  { name: "Tampa Bay Rays",        abbr: "tb",  logo: mlbLogo("tb")  },
  { name: "Toronto Blue Jays",     abbr: "tor", logo: mlbLogo("tor") },
  { name: "Chicago White Sox",     abbr: "chw", logo: mlbLogo("chw") },
  { name: "Cleveland Guardians",   abbr: "cle", logo: mlbLogo("cle") },
  { name: "Detroit Tigers",        abbr: "det", logo: mlbLogo("det") },
  { name: "Kansas City Royals",    abbr: "kc",  logo: mlbLogo("kc")  },
  { name: "Minnesota Twins",       abbr: "min", logo: mlbLogo("min") },
  { name: "Houston Astros",        abbr: "hou", logo: mlbLogo("hou") },
  { name: "Los Angeles Angels",    abbr: "laa", logo: mlbLogo("laa") },
  { name: "Oakland Athletics",     abbr: "oak", logo: mlbLogo("oak") },
  { name: "Seattle Mariners",      abbr: "sea", logo: mlbLogo("sea") },
  { name: "Texas Rangers",         abbr: "tex", logo: mlbLogo("tex") },
  { name: "Atlanta Braves",        abbr: "atl", logo: mlbLogo("atl") },
  { name: "Miami Marlins",         abbr: "mia", logo: mlbLogo("mia") },
  { name: "New York Mets",         abbr: "nym", logo: mlbLogo("nym") },
  { name: "Philadelphia Phillies", abbr: "phi", logo: mlbLogo("phi") },
  { name: "Washington Nationals",  abbr: "wsh", logo: mlbLogo("wsh") },
  { name: "Chicago Cubs",          abbr: "chc", logo: mlbLogo("chc") },
  { name: "Cincinnati Reds",       abbr: "cin", logo: mlbLogo("cin") },
  { name: "Milwaukee Brewers",     abbr: "mil", logo: mlbLogo("mil") },
  { name: "Pittsburgh Pirates",    abbr: "pit", logo: mlbLogo("pit") },
  { name: "St. Louis Cardinals",   abbr: "stl", logo: mlbLogo("stl") },
  { name: "Arizona Diamondbacks",  abbr: "ari", logo: mlbLogo("ari") },
  { name: "Colorado Rockies",      abbr: "col", logo: mlbLogo("col") },
  { name: "Los Angeles Dodgers",   abbr: "lad", logo: mlbLogo("lad") },
  { name: "San Diego Padres",      abbr: "sd",  logo: mlbLogo("sd")  },
  { name: "San Francisco Giants",  abbr: "sf",  logo: mlbLogo("sf")  },
];

// ── NHL ──────────────────────────────────────────────────────────
const NHL_TEAMS = [
  { name: "Boston Bruins",          abbr: "bos", logo: nhlLogo("bos") },
  { name: "Buffalo Sabres",         abbr: "buf", logo: nhlLogo("buf") },
  { name: "Detroit Red Wings",      abbr: "det", logo: nhlLogo("det") },
  { name: "Florida Panthers",       abbr: "fla", logo: nhlLogo("fla") },
  { name: "Montreal Canadiens",     abbr: "mtl", logo: nhlLogo("mtl") },
  { name: "Ottawa Senators",        abbr: "ott", logo: nhlLogo("ott") },
  { name: "Tampa Bay Lightning",    abbr: "tb",  logo: nhlLogo("tb")  },
  { name: "Toronto Maple Leafs",    abbr: "tor", logo: nhlLogo("tor") },
  { name: "Carolina Hurricanes",    abbr: "car", logo: nhlLogo("car") },
  { name: "Columbus Blue Jackets",  abbr: "cbj", logo: nhlLogo("cbj") },
  { name: "New Jersey Devils",      abbr: "nj",  logo: nhlLogo("nj")  },
  { name: "New York Islanders",     abbr: "nyi", logo: nhlLogo("nyi") },
  { name: "New York Rangers",       abbr: "nyr", logo: nhlLogo("nyr") },
  { name: "Philadelphia Flyers",    abbr: "phi", logo: nhlLogo("phi") },
  { name: "Pittsburgh Penguins",    abbr: "pit", logo: nhlLogo("pit") },
  { name: "Washington Capitals",    abbr: "wsh", logo: nhlLogo("wsh") },
  { name: "Arizona Coyotes",        abbr: "ari", logo: nhlLogo("ari") },
  { name: "Chicago Blackhawks",     abbr: "chi", logo: nhlLogo("chi") },
  { name: "Colorado Avalanche",     abbr: "col", logo: nhlLogo("col") },
  { name: "Dallas Stars",           abbr: "dal", logo: nhlLogo("dal") },
  { name: "Minnesota Wild",         abbr: "min", logo: nhlLogo("min") },
  { name: "Nashville Predators",    abbr: "nsh", logo: nhlLogo("nsh") },
  { name: "St. Louis Blues",        abbr: "stl", logo: nhlLogo("stl") },
  { name: "Winnipeg Jets",          abbr: "wpg", logo: nhlLogo("wpg") },
  { name: "Anaheim Ducks",          abbr: "ana", logo: nhlLogo("ana") },
  { name: "Calgary Flames",         abbr: "cgy", logo: nhlLogo("cgy") },
  { name: "Edmonton Oilers",        abbr: "edm", logo: nhlLogo("edm") },
  { name: "Los Angeles Kings",      abbr: "la",  logo: nhlLogo("la")  },
  { name: "San Jose Sharks",        abbr: "sj",  logo: nhlLogo("sj")  },
  { name: "Seattle Kraken",         abbr: "sea", logo: nhlLogo("sea") },
  { name: "Vancouver Canucks",      abbr: "van", logo: nhlLogo("van") },
  { name: "Vegas Golden Knights",   abbr: "vgk", logo: nhlLogo("vgk") },
];

// ── MiLB — Triple-A ─────────────────────────────────────────────
// ESPN IDs included where confirmed. null = show initials placeholder.
const MILB_TRIPLE_A = [
  // International League
  { name: "Buffalo Bisons",          affiliate: "TOR", logo: milbLogo("buffalo-bisons")        },
  { name: "Charlotte Knights",       affiliate: "CWS", logo: milbLogo("charlotte-knights")     },
  { name: "Columbus Clippers",       affiliate: "CLE", logo: milbLogo("columbus-clippers")     },
  { name: "Durham Bulls",            affiliate: "TB",  logo: milbLogo("durham-bulls")          },
  { name: "Gwinnett Stripers",       affiliate: "ATL", logo: milbLogo("gwinnett-stripers")     },
  { name: "Indianapolis Indians",    affiliate: "PIT", logo: milbLogo("indianapolis-indians")  },
  { name: "Iowa Cubs",               affiliate: "CHC", logo: milbLogo("iowa-cubs")             },
  { name: "Jacksonville Jumbo Shrimp", affiliate: "MIA", logo: milbLogo("jacksonville-jumbo-shrimp") },
  { name: "Lehigh Valley IronPigs",  affiliate: "PHI", logo: milbLogo("lehigh-valley-ironpigs")},
  { name: "Louisville Bats",         affiliate: "CIN", logo: milbLogo("louisville-bats")       },
  { name: "Memphis Redbirds",        affiliate: "STL", logo: milbLogo("memphis-redbirds")      },
  { name: "Nashville Sounds",        affiliate: "MIL", logo: milbLogo("nashville-sounds")      },
  { name: "Norfolk Tides",           affiliate: "BAL", logo: milbLogo("norfolk-tides")         },
  { name: "Omaha Storm Chasers",     affiliate: "KC",  logo: milbLogo("omaha-storm-chasers")   },
  { name: "Rochester Red Wings",     affiliate: "WSH", logo: milbLogo("rochester-red-wings")   },
  { name: "Scranton/WB RailRiders",  affiliate: "NYY", logo: milbLogo("scranton-wb-railriders") },
  { name: "St. Paul Saints",         affiliate: "MIN", logo: milbLogo("st-paul-saints")        },
  { name: "Syracuse Mets",           affiliate: "NYM", logo: milbLogo("syracuse-mets")         },
  { name: "Toledo Mud Hens",         affiliate: "DET", logo: milbLogo("toledo-mud-hens")       },
  { name: "Worcester Red Sox",       affiliate: "BOS", logo: milbLogo("worcester-red-sox")     },
  // Pacific Coast League
  { name: "Albuquerque Isotopes",    affiliate: "COL", logo: milbLogo("albuquerque-isotopes")  },
  { name: "El Paso Chihuahuas",      affiliate: "SD",  logo: milbLogo("el-paso-chihuahuas")    },
  { name: "Las Vegas Aviators",      affiliate: "OAK", logo: milbLogo("las-vegas-aviators")    },
  { name: "Oklahoma City Baseball Club", affiliate: "LAD", logo: null                         },
  { name: "Reno Aces",               affiliate: "ARI", logo: milbLogo("reno-aces")             },
  { name: "Round Rock Express",      affiliate: "TEX", logo: milbLogo("round-rock-express")    },
  { name: "Sacramento River Cats",   affiliate: "SF",  logo: milbLogo("sacramento-river-cats") },
  { name: "Salt Lake Bees",          affiliate: "LAA", logo: milbLogo("salt-lake-bees")        },
  { name: "Sugar Land Space Cowboys",affiliate: "HOU", logo: milbLogo("sugar-land-space-cowboys") },
  { name: "Tacoma Rainiers",         affiliate: "SEA", logo: milbLogo("tacoma-rainiers")       },
];

// ── MiLB — Double-A ─────────────────────────────────────────────
const MILB_DOUBLE_A = [
  // Eastern League
  { name: "Akron RubberDucks",       affiliate: "CLE", logo: milbLogo("akron-rubberducks")     },
  { name: "Altoona Curve",           affiliate: "PIT", logo: milbLogo("altoona-curve")         },
  { name: "Binghamton Rumble Ponies",affiliate: "NYM", logo: null                              },
  { name: "Bowie Baysox",            affiliate: "BAL", logo: milbLogo("bowie-baysox")          },
  { name: "Erie SeaWolves",          affiliate: "DET", logo: milbLogo("erie-seawolves")        },
  { name: "Hartford Yard Goats",     affiliate: "COL", logo: milbLogo("hartford-yard-goats")   },
  { name: "New Hampshire Fisher Cats",affiliate: "TOR", logo: milbLogo("new-hampshire-fisher-cats") },
  { name: "Portland Sea Dogs",       affiliate: "BOS", logo: milbLogo("portland-sea-dogs")     },
  { name: "Reading Fightin Phils",   affiliate: "PHI", logo: milbLogo("reading-fightin-phils") },
  { name: "Richmond Flying Squirrels",affiliate: "SF", logo: milbLogo("richmond-flying-squirrels") },
  { name: "Somerset Patriots",       affiliate: "NYY", logo: milbLogo("somerset-patriots")     },
  { name: "Trenton Thunder",         affiliate: "NYY", logo: null                              },
  // Southern League
  { name: "Birmingham Barons",       affiliate: "CWS", logo: milbLogo("birmingham-barons")     },
  { name: "Biloxi Shuckers",         affiliate: "MIL", logo: milbLogo("biloxi-shuckers")       },
  { name: "Chattanooga Lookouts",    affiliate: "CIN", logo: milbLogo("chattanooga-lookouts")  },
  { name: "Mississippi Braves",      affiliate: "ATL", logo: milbLogo("mississippi-braves")    },
  { name: "Montgomery Biscuits",     affiliate: "TB",  logo: milbLogo("montgomery-biscuits")   },
  { name: "Pensacola Blue Wahoos",   affiliate: "MIA", logo: milbLogo("pensacola-blue-wahoos") },
  { name: "Rocket City Trash Pandas",affiliate: "LAA", logo: milbLogo("rocket-city-trash-pandas") },
  { name: "Tennessee Smokies",       affiliate: "CHC", logo: milbLogo("tennessee-smokies")     },
  // Texas League
  { name: "Amarillo Sod Poodles",    affiliate: "ARI", logo: milbLogo("amarillo-sod-poodles")  },
  { name: "Arkansas Travelers",      affiliate: "SEA", logo: milbLogo("arkansas-travelers")    },
  { name: "Corpus Christi Hooks",    affiliate: "HOU", logo: milbLogo("corpus-christi-hooks")  },
  { name: "Frisco RoughRiders",      affiliate: "TEX", logo: milbLogo("frisco-roughriders")    },
  { name: "Midland RockHounds",      affiliate: "OAK", logo: milbLogo("midland-rockhounds")    },
  { name: "Northwest Arkansas Naturals", affiliate: "KC", logo: milbLogo("northwest-arkansas-naturals") },
  { name: "San Antonio Missions",    affiliate: "SD",  logo: milbLogo("san-antonio-missions")  },
  { name: "Springfield Cardinals",   affiliate: "STL", logo: milbLogo("springfield-cardinals") },
  { name: "Tulsa Drillers",          affiliate: "LAD", logo: milbLogo("tulsa-drillers")        },
  { name: "Wichita Wind Surge",      affiliate: "MIN", logo: milbLogo("wichita-wind-surge")    },
];

// ── MiLB — High-A ───────────────────────────────────────────────
const MILB_HIGH_A = [
  // Midwest League
  { name: "Beloit Sky Carp",         affiliate: "MIA", logo: null },
  { name: "Cedar Rapids Kernels",    affiliate: "MIN", logo: milbLogo("cedar-rapids-kernels")  },
  { name: "Dayton Dragons",          affiliate: "CIN", logo: milbLogo("dayton-dragons")        },
  { name: "Fort Wayne TinCaps",      affiliate: "SD",  logo: milbLogo("fort-wayne-tincaps")    },
  { name: "Great Lakes Loons",       affiliate: "LAD", logo: milbLogo("great-lakes-loons")     },
  { name: "Kane County Cougars",     affiliate: "ARI", logo: null },
  { name: "Lake County Captains",    affiliate: "CLE", logo: milbLogo("lake-county-captains")  },
  { name: "Lansing Lugnuts",         affiliate: "OAK", logo: milbLogo("lansing-lugnuts")       },
  { name: "Peoria Chiefs",           affiliate: "STL", logo: milbLogo("peoria-chiefs")         },
  { name: "Quad Cities River Bandits",affiliate: "HOU", logo: milbLogo("quad-cities-river-bandits") },
  { name: "South Bend Cubs",         affiliate: "CHC", logo: milbLogo("south-bend-cubs")       },
  { name: "West Michigan Whitecaps", affiliate: "DET", logo: milbLogo("west-michigan-whitecaps") },
  // South Atlantic League
  { name: "Aberdeen IronBirds",      affiliate: "BAL", logo: milbLogo("aberdeen-ironbirds")    },
  { name: "Asheville Tourists",      affiliate: "HOU", logo: milbLogo("asheville-tourists")    },
  { name: "Brooklyn Cyclones",       affiliate: "NYM", logo: milbLogo("brooklyn-cyclones")     },
  { name: "Greensboro Grasshoppers", affiliate: "PIT", logo: milbLogo("greensboro-grasshoppers") },
  { name: "Greenville Drive",        affiliate: "BOS", logo: milbLogo("greenville-drive")      },
  { name: "Hickory Crawdads",        affiliate: "TEX", logo: milbLogo("hickory-crawdads")      },
  { name: "Hudson Valley Renegades", affiliate: "NYY", logo: milbLogo("hudson-valley-renegades") },
  { name: "Jersey Shore BlueClaws",  affiliate: "PHI", logo: milbLogo("jersey-shore-blueclaws") },
  { name: "Rome Braves",             affiliate: "ATL", logo: milbLogo("rome-braves")           },
  { name: "Winston-Salem Dash",      affiliate: "CWS", logo: milbLogo("winston-salem-dash")    },
  // Northwest League
  { name: "Eugene Emeralds",         affiliate: "SF",  logo: milbLogo("eugene-emeralds")       },
  { name: "Everett AquaSox",         affiliate: "SEA", logo: milbLogo("everett-aquasox")       },
  { name: "Hillsboro Hops",          affiliate: "ARI", logo: milbLogo("hillsboro-hops")        },
  { name: "Spokane Indians",         affiliate: "COL", logo: milbLogo("spokane-indians")       },
  { name: "Tri-City Dust Devils",    affiliate: "LAA", logo: milbLogo("tri-city-dust-devils")  },
  { name: "Vancouver Canadians",     affiliate: "TOR", logo: milbLogo("vancouver-canadians")   },
];

// ── MiLB — Single-A ─────────────────────────────────────────────
const MILB_SINGLE_A = [
  // Carolina League
  { name: "Carolina Mudcats",        affiliate: "MIL", logo: milbLogo("carolina-mudcats")      },
  { name: "Delaware Blue Hens",      affiliate: "LAD", logo: null },
  { name: "Down East Wood Ducks",    affiliate: "TEX", logo: milbLogo("down-east-wood-ducks")  },
  { name: "Fayetteville Woodpeckers",affiliate: "HOU", logo: milbLogo("fayetteville-woodpeckers") },
  { name: "Fredericksburg Nationals",affiliate: "WSH", logo: milbLogo("fredericksburg-nationals") },
  { name: "Kannapolis Cannon Ballers",affiliate: "CWS",logo: milbLogo("kannapolis-cannon-ballers") },
  { name: "Lynchburg Hillcats",      affiliate: "CLE", logo: milbLogo("lynchburg-hillcats")    },
  { name: "Myrtle Beach Pelicans",   affiliate: "CHC", logo: milbLogo("myrtle-beach-pelicans") },
  { name: "Salem Red Sox",           affiliate: "BOS", logo: milbLogo("salem-red-sox")         },
  { name: "Wilmington Blue Rocks",   affiliate: "WSH", logo: milbLogo("wilmington-blue-rocks") },
  { name: "Winston-Salem Dash",      affiliate: "CWS", logo: null },
  { name: "Wood Ducks",              affiliate: "TEX", logo: null },
  // Florida State League
  { name: "Bradenton Marauders",     affiliate: "PIT", logo: milbLogo("bradenton-marauders")   },
  { name: "Clearwater Threshers",    affiliate: "PHI", logo: milbLogo("clearwater-threshers")  },
  { name: "Daytona Tortugas",        affiliate: "CIN", logo: milbLogo("daytona-tortugas")      },
  { name: "Dunedin Blue Jays",       affiliate: "TOR", logo: milbLogo("dunedin-blue-jays")     },
  { name: "Fort Myers Mighty Mussels",affiliate: "MIN", logo: milbLogo("fort-myers-mighty-mussels") },
  { name: "Jupiter Hammerheads",     affiliate: "MIA", logo: milbLogo("jupiter-hammerheads")   },
  { name: "Lakeland Flying Tigers",  affiliate: "DET", logo: milbLogo("lakeland-flying-tigers") },
  { name: "Palm Beach Cardinals",    affiliate: "STL", logo: milbLogo("palm-beach-cardinals")  },
  { name: "St. Lucie Mets",          affiliate: "NYM", logo: milbLogo("st-lucie-mets")         },
  { name: "Tampa Tarpons",           affiliate: "NYY", logo: milbLogo("tampa-tarpons")         },
  // California League
  { name: "Fresno Grizzlies",        affiliate: "COL", logo: milbLogo("fresno-grizzlies")      },
  { name: "Inland Empire 66ers",     affiliate: "LAA", logo: milbLogo("inland-empire-66ers")   },
  { name: "Lake Elsinore Storm",     affiliate: "SD",  logo: milbLogo("lake-elsinore-storm")   },
  { name: "Modesto Nuts",            affiliate: "SEA", logo: milbLogo("modesto-nuts")          },
  { name: "Rancho Cucamonga Quakes", affiliate: "LAD", logo: milbLogo("rancho-cucamonga-quakes") },
  { name: "San Jose Giants",         affiliate: "SF",  logo: milbLogo("san-jose-giants")       },
  { name: "Stockton Ports",          affiliate: "OAK", logo: milbLogo("stockton-ports")        },
  { name: "Visalia Rawhide",         affiliate: "ARI", logo: milbLogo("visalia-rawhide")       },
];

// ── Combined MiLB (all levels, sorted by name) ──────────────────
const MILB_TEAMS = [
  ...MILB_TRIPLE_A.map(t => ({ ...t, level: "Triple-A" })),
  ...MILB_DOUBLE_A.map(t => ({ ...t, level: "Double-A" })),
  ...MILB_HIGH_A.map(t =>   ({ ...t, level: "High-A"   })),
  ...MILB_SINGLE_A.map(t => ({ ...t, level: "Single-A" })),
].sort((a, b) => a.name.localeCompare(b.name));

// ── NCAA D1 ──────────────────────────────────────────────────────
const NCAA_TEAMS = [
  { name: "Air Force Falcons",         logo: ncaaLogo(2005)  },
  { name: "Akron Zips",                logo: ncaaLogo(2006)  },
  { name: "Alabama Crimson Tide",      logo: ncaaLogo(333)   },
  { name: "Appalachian State Mountaineers", logo: ncaaLogo(2026) },
  { name: "Arizona State Sun Devils",  logo: ncaaLogo(9)     },
  { name: "Arizona Wildcats",          logo: ncaaLogo(12)    },
  { name: "Arkansas Razorbacks",       logo: ncaaLogo(8)     },
  { name: "Arkansas State Red Wolves", logo: ncaaLogo(2032)  },
  { name: "Army Black Knights",        logo: ncaaLogo(349)   },
  { name: "Auburn Tigers",             logo: ncaaLogo(2)     },
  { name: "Ball State Cardinals",      logo: ncaaLogo(2050)  },
  { name: "Baylor Bears",              logo: ncaaLogo(239)   },
  { name: "Boise State Broncos",       logo: ncaaLogo(68)    },
  { name: "Boston College Eagles",     logo: ncaaLogo(103)   },
  { name: "Bowling Green Falcons",     logo: ncaaLogo(189)   },
  { name: "Buffalo Bulls",             logo: ncaaLogo(2084)  },
  { name: "BYU Cougars",               logo: ncaaLogo(252)   },
  { name: "California Golden Bears",   logo: ncaaLogo(25)    },
  { name: "Central Michigan Chippewas",logo: ncaaLogo(2117)  },
  { name: "Charlotte 49ers",           logo: ncaaLogo(2429)  },
  { name: "Cincinnati Bearcats",       logo: ncaaLogo(2132)  },
  { name: "Clemson Tigers",            logo: ncaaLogo(228)   },
  { name: "Coastal Carolina Chanticleers", logo: ncaaLogo(324) },
  { name: "Colorado Buffaloes",        logo: ncaaLogo(38)    },
  { name: "Colorado State Rams",       logo: ncaaLogo(36)    },
  { name: "Connecticut Huskies",       logo: ncaaLogo(41)    },
  { name: "Duke Blue Devils",          logo: ncaaLogo(150)   },
  { name: "East Carolina Pirates",     logo: ncaaLogo(151)   },
  { name: "Eastern Michigan Eagles",   logo: ncaaLogo(2199)  },
  { name: "Florida Atlantic Owls",     logo: ncaaLogo(2226)  },
  { name: "Florida Gators",            logo: ncaaLogo(57)    },
  { name: "Florida International Panthers", logo: ncaaLogo(2229) },
  { name: "Florida State Seminoles",   logo: ncaaLogo(52)    },
  { name: "Fresno State Bulldogs",     logo: ncaaLogo(278)   },
  { name: "Georgia Bulldogs",          logo: ncaaLogo(61)    },
  { name: "Georgia Southern Eagles",   logo: ncaaLogo(290)   },
  { name: "Georgia State Panthers",    logo: ncaaLogo(2247)  },
  { name: "Georgia Tech Yellow Jackets",logo: ncaaLogo(59)   },
  { name: "Hawaii Rainbow Warriors",   logo: ncaaLogo(62)    },
  { name: "Houston Cougars",           logo: ncaaLogo(248)   },
  { name: "Illinois Fighting Illini",  logo: ncaaLogo(356)   },
  { name: "Indiana Hoosiers",          logo: ncaaLogo(84)    },
  { name: "Iowa Hawkeyes",             logo: ncaaLogo(2294)  },
  { name: "Iowa State Cyclones",       logo: ncaaLogo(66)    },
  { name: "Kansas Jayhawks",           logo: ncaaLogo(2305)  },
  { name: "Kansas State Wildcats",     logo: ncaaLogo(2306)  },
  { name: "Kent State Golden Flashes", logo: ncaaLogo(2309)  },
  { name: "Kentucky Wildcats",         logo: ncaaLogo(96)    },
  { name: "Liberty Flames",            logo: ncaaLogo(2335)  },
  { name: "Louisiana Ragin Cajuns",    logo: ncaaLogo(309)   },
  { name: "Louisiana Monroe Warhawks", logo: ncaaLogo(2433)  },
  { name: "Louisiana Tech Bulldogs",   logo: ncaaLogo(2348)  },
  { name: "Louisville Cardinals",      logo: ncaaLogo(97)    },
  { name: "LSU Tigers",                logo: ncaaLogo(99)    },
  { name: "Marshall Thundering Herd",  logo: ncaaLogo(276)   },
  { name: "Maryland Terrapins",        logo: ncaaLogo(120)   },
  { name: "Memphis Tigers",            logo: ncaaLogo(235)   },
  { name: "Miami Hurricanes",          logo: ncaaLogo(2390)  },
  { name: "Miami (OH) Redhawks",       logo: ncaaLogo(193)   },
  { name: "Michigan Wolverines",       logo: ncaaLogo(130)   },
  { name: "Michigan State Spartans",   logo: ncaaLogo(127)   },
  { name: "Middle Tennessee Blue Raiders", logo: ncaaLogo(2393) },
  { name: "Minnesota Golden Gophers",  logo: ncaaLogo(135)   },
  { name: "Mississippi State Bulldogs",logo: ncaaLogo(344)   },
  { name: "Missouri Tigers",           logo: ncaaLogo(142)   },
  { name: "Navy Midshipmen",           logo: ncaaLogo(2426)  },
  { name: "NC State Wolfpack",         logo: ncaaLogo(152)   },
  { name: "Nebraska Cornhuskers",      logo: ncaaLogo(158)   },
  { name: "Nevada Wolf Pack",          logo: ncaaLogo(2440)  },
  { name: "New Mexico Lobos",          logo: ncaaLogo(167)   },
  { name: "New Mexico State Aggies",   logo: ncaaLogo(2443)  },
  { name: "North Carolina Tar Heels",  logo: ncaaLogo(153)   },
  { name: "North Texas Mean Green",    logo: ncaaLogo(249)   },
  { name: "Northern Illinois Huskies", logo: ncaaLogo(2459)  },
  { name: "Northwestern Wildcats",     logo: ncaaLogo(77)    },
  { name: "Notre Dame Fighting Irish", logo: ncaaLogo(87)    },
  { name: "Ohio Bobcats",              logo: ncaaLogo(195)   },
  { name: "Ohio State Buckeyes",       logo: ncaaLogo(194)   },
  { name: "Oklahoma Sooners",          logo: ncaaLogo(201)   },
  { name: "Oklahoma State Cowboys",    logo: ncaaLogo(197)   },
  { name: "Ole Miss Rebels",           logo: ncaaLogo(145)   },
  { name: "Oregon Ducks",              logo: ncaaLogo(2483)  },
  { name: "Oregon State Beavers",      logo: ncaaLogo(204)   },
  { name: "Penn State Nittany Lions",  logo: ncaaLogo(213)   },
  { name: "Pittsburgh Panthers",       logo: ncaaLogo(221)   },
  { name: "Purdue Boilermakers",       logo: ncaaLogo(2509)  },
  { name: "Rice Owls",                 logo: ncaaLogo(242)   },
  { name: "Rutgers Scarlet Knights",   logo: ncaaLogo(164)   },
  { name: "San Diego State Aztecs",    logo: ncaaLogo(21)    },
  { name: "San Jose State Spartans",   logo: ncaaLogo(23)    },
  { name: "SMU Mustangs",              logo: ncaaLogo(2567)  },
  { name: "South Alabama Jaguars",     logo: ncaaLogo(6)     },
  { name: "South Carolina Gamecocks",  logo: ncaaLogo(2579)  },
  { name: "South Florida Bulls",       logo: ncaaLogo(58)    },
  { name: "Southern Miss Golden Eagles",logo: ncaaLogo(2572) },
  { name: "Stanford Cardinal",         logo: ncaaLogo(24)    },
  { name: "Syracuse Orange",           logo: ncaaLogo(183)   },
  { name: "TCU Horned Frogs",          logo: ncaaLogo(2628)  },
  { name: "Temple Owls",               logo: ncaaLogo(218)   },
  { name: "Tennessee Volunteers",      logo: ncaaLogo(2633)  },
  { name: "Texas Longhorns",           logo: ncaaLogo(2641)  },
  { name: "Texas A&M Aggies",          logo: ncaaLogo(245)   },
  { name: "Texas State Bobcats",       logo: ncaaLogo(326)   },
  { name: "Texas Tech Red Raiders",    logo: ncaaLogo(2638)  },
  { name: "Toledo Rockets",            logo: ncaaLogo(2649)  },
  { name: "Troy Trojans",              logo: ncaaLogo(2653)  },
  { name: "Tulane Green Wave",         logo: ncaaLogo(2655)  },
  { name: "Tulsa Golden Hurricane",    logo: ncaaLogo(202)   },
  { name: "UAB Blazers",               logo: ncaaLogo(2330)  },
  { name: "UCF Knights",               logo: ncaaLogo(2116)  },
  { name: "UCLA Bruins",               logo: ncaaLogo(26)    },
  { name: "UNLV Rebels",               logo: ncaaLogo(2439)  },
  { name: "USC Trojans",               logo: ncaaLogo(30)    },
  { name: "Utah Utes",                 logo: ncaaLogo(254)   },
  { name: "Utah State Aggies",         logo: ncaaLogo(328)   },
  { name: "Vanderbilt Commodores",     logo: ncaaLogo(238)   },
  { name: "Virginia Cavaliers",        logo: ncaaLogo(258)   },
  { name: "Virginia Tech Hokies",      logo: ncaaLogo(259)   },
  { name: "Wake Forest Demon Deacons", logo: ncaaLogo(154)   },
  { name: "Washington Huskies",        logo: ncaaLogo(264)   },
  { name: "Washington State Cougars",  logo: ncaaLogo(265)   },
  { name: "West Virginia Mountaineers",logo: ncaaLogo(277)   },
  { name: "Western Kentucky Hilltoppers", logo: ncaaLogo(98) },
  { name: "Western Michigan Broncos",  logo: ncaaLogo(2711)  },
  { name: "Wisconsin Badgers",         logo: ncaaLogo(275)   },
  { name: "Wyoming Cowboys",           logo: ncaaLogo(2751)  },
];

// ── Exports ──────────────────────────────────────────────────────
export const TEAMS_BY_SPORT = {
  Baseball:      MLB_TEAMS,
  "Minor League": MILB_TEAMS,
  Hockey:        NHL_TEAMS,
  College:       NCAA_TEAMS,
};

// Returns teams for a given sport label, or [] if none defined
export function getTeamsForSport(sport) {
  if (!sport) return [];
  const key = Object.keys(TEAMS_BY_SPORT).find(k =>
    sport.toLowerCase().includes(k.toLowerCase()) ||
    k.toLowerCase().includes(sport.toLowerCase())
  );
  return key ? TEAMS_BY_SPORT[key] : [];
}

// Returns the level badge label for a MiLB team (Triple-A, Double-A, etc.)
export function getMiLBLevel(teamName) {
  const team = MILB_TEAMS.find(t => t.name === teamName);
  return team?.level ?? null;
}