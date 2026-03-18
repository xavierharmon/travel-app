// src/data/teams.js
//
// Team data for the built-in team picker.
// Logos are served from ESPN's public CDN — no API key required,
// these URLs are stable and widely used.
//
// Logo URL patterns:
//   MLB:     https://a.espncdn.com/i/teamlogos/mlb/500/{abbr}.png
//   NHL:     https://a.espncdn.com/i/teamlogos/nhl/500/{abbr}.png
//   College: https://a.espncdn.com/i/teamlogos/ncaa/500/{espnId}.png

const mlbLogo  = abbr => `https://a.espncdn.com/i/teamlogos/mlb/500/${abbr}.png`;
const nhlLogo  = abbr => `https://a.espncdn.com/i/teamlogos/nhl/500/${abbr}.png`;
const ncaaLogo = id   => `https://a.espncdn.com/i/teamlogos/ncaa/500/${id}.png`;

// ── MLB ──────────────────────────────────────────────────────────
const MLB_TEAMS = [
  // AL East
  { name: "Baltimore Orioles",     abbr: "bal", logo: mlbLogo("bal") },
  { name: "Boston Red Sox",        abbr: "bos", logo: mlbLogo("bos") },
  { name: "New York Yankees",      abbr: "nyy", logo: mlbLogo("nyy") },
  { name: "Tampa Bay Rays",        abbr: "tb",  logo: mlbLogo("tb")  },
  { name: "Toronto Blue Jays",     abbr: "tor", logo: mlbLogo("tor") },
  // AL Central
  { name: "Chicago White Sox",     abbr: "chw", logo: mlbLogo("chw") },
  { name: "Cleveland Guardians",   abbr: "cle", logo: mlbLogo("cle") },
  { name: "Detroit Tigers",        abbr: "det", logo: mlbLogo("det") },
  { name: "Kansas City Royals",    abbr: "kc",  logo: mlbLogo("kc")  },
  { name: "Minnesota Twins",       abbr: "min", logo: mlbLogo("min") },
  // AL West
  { name: "Houston Astros",        abbr: "hou", logo: mlbLogo("hou") },
  { name: "Los Angeles Angels",    abbr: "laa", logo: mlbLogo("laa") },
  { name: "Oakland Athletics",     abbr: "oak", logo: mlbLogo("oak") },
  { name: "Seattle Mariners",      abbr: "sea", logo: mlbLogo("sea") },
  { name: "Texas Rangers",         abbr: "tex", logo: mlbLogo("tex") },
  // NL East
  { name: "Atlanta Braves",        abbr: "atl", logo: mlbLogo("atl") },
  { name: "Miami Marlins",         abbr: "mia", logo: mlbLogo("mia") },
  { name: "New York Mets",         abbr: "nym", logo: mlbLogo("nym") },
  { name: "Philadelphia Phillies", abbr: "phi", logo: mlbLogo("phi") },
  { name: "Washington Nationals",  abbr: "wsh", logo: mlbLogo("wsh") },
  // NL Central
  { name: "Chicago Cubs",          abbr: "chc", logo: mlbLogo("chc") },
  { name: "Cincinnati Reds",       abbr: "cin", logo: mlbLogo("cin") },
  { name: "Milwaukee Brewers",     abbr: "mil", logo: mlbLogo("mil") },
  { name: "Pittsburgh Pirates",    abbr: "pit", logo: mlbLogo("pit") },
  { name: "St. Louis Cardinals",   abbr: "stl", logo: mlbLogo("stl") },
  // NL West
  { name: "Arizona Diamondbacks",  abbr: "ari", logo: mlbLogo("ari") },
  { name: "Colorado Rockies",      abbr: "col", logo: mlbLogo("col") },
  { name: "Los Angeles Dodgers",   abbr: "lad", logo: mlbLogo("lad") },
  { name: "San Diego Padres",      abbr: "sd",  logo: mlbLogo("sd")  },
  { name: "San Francisco Giants",  abbr: "sf",  logo: mlbLogo("sf")  },
];

// ── NHL ──────────────────────────────────────────────────────────
const NHL_TEAMS = [
  // Atlantic
  { name: "Boston Bruins",          abbr: "bos", logo: nhlLogo("bos") },
  { name: "Buffalo Sabres",         abbr: "buf", logo: nhlLogo("buf") },
  { name: "Detroit Red Wings",      abbr: "det", logo: nhlLogo("det") },
  { name: "Florida Panthers",       abbr: "fla", logo: nhlLogo("fla") },
  { name: "Montreal Canadiens",     abbr: "mtl", logo: nhlLogo("mtl") },
  { name: "Ottawa Senators",        abbr: "ott", logo: nhlLogo("ott") },
  { name: "Tampa Bay Lightning",    abbr: "tb",  logo: nhlLogo("tb")  },
  { name: "Toronto Maple Leafs",    abbr: "tor", logo: nhlLogo("tor") },
  // Metropolitan
  { name: "Carolina Hurricanes",    abbr: "car", logo: nhlLogo("car") },
  { name: "Columbus Blue Jackets",  abbr: "cbj", logo: nhlLogo("cbj") },
  { name: "New Jersey Devils",      abbr: "nj",  logo: nhlLogo("nj")  },
  { name: "New York Islanders",     abbr: "nyi", logo: nhlLogo("nyi") },
  { name: "New York Rangers",       abbr: "nyr", logo: nhlLogo("nyr") },
  { name: "Philadelphia Flyers",    abbr: "phi", logo: nhlLogo("phi") },
  { name: "Pittsburgh Penguins",    abbr: "pit", logo: nhlLogo("pit") },
  { name: "Washington Capitals",    abbr: "wsh", logo: nhlLogo("wsh") },
  // Central
  { name: "Arizona Coyotes",        abbr: "ari", logo: nhlLogo("ari") },
  { name: "Chicago Blackhawks",     abbr: "chi", logo: nhlLogo("chi") },
  { name: "Colorado Avalanche",     abbr: "col", logo: nhlLogo("col") },
  { name: "Dallas Stars",           abbr: "dal", logo: nhlLogo("dal") },
  { name: "Minnesota Wild",         abbr: "min", logo: nhlLogo("min") },
  { name: "Nashville Predators",    abbr: "nsh", logo: nhlLogo("nsh") },
  { name: "St. Louis Blues",        abbr: "stl", logo: nhlLogo("stl") },
  { name: "Winnipeg Jets",          abbr: "wpg", logo: nhlLogo("wpg") },
  // Pacific
  { name: "Anaheim Ducks",          abbr: "ana", logo: nhlLogo("ana") },
  { name: "Calgary Flames",         abbr: "cgy", logo: nhlLogo("cgy") },
  { name: "Edmonton Oilers",        abbr: "edm", logo: nhlLogo("edm") },
  { name: "Los Angeles Kings",      abbr: "la",  logo: nhlLogo("la")  },
  { name: "San Jose Sharks",        abbr: "sj",  logo: nhlLogo("sj")  },
  { name: "Seattle Kraken",         abbr: "sea", logo: nhlLogo("sea") },
  { name: "Vancouver Canucks",      abbr: "van", logo: nhlLogo("van") },
  { name: "Vegas Golden Knights",   abbr: "vgk", logo: nhlLogo("vgk") },
];

// ── NCAA D1 ──────────────────────────────────────────────────────
// ESPN IDs for college teams
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
  Baseball:   MLB_TEAMS,
  Hockey:     NHL_TEAMS,
  College:    NCAA_TEAMS,
};

// Returns teams for a given sport label, or [] if none defined
export function getTeamsForSport(sport) {
  if (!sport) return [];
  // Fuzzy match — "Baseball" matches MLB, "Hockey" matches NHL, etc.
  const key = Object.keys(TEAMS_BY_SPORT).find(k =>
    sport.toLowerCase().includes(k.toLowerCase()) ||
    k.toLowerCase().includes(sport.toLowerCase())
  );
  return key ? TEAMS_BY_SPORT[key] : [];
}