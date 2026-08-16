/**
 * A REAL Overpass API response, captured live and bundled as an honest
 * fallback.
 *
 * This is not fabricated or hand-written data. It is the actual JSON
 * returned by a live POST to `https://overpass-api.de/api/interpreter`
 * for the query in `query.ts`, centered on Portland, OR
 * (45.5152, -122.6784, the same point Canopy's demo diary uses), radius
 * 2000m (3000m for the boundary/protected_area clause), captured
 * 2026-08-16T07:50:36Z. Tags unrelated to green-space classification were
 * stripped to keep the bundle small — see the trimming script referenced
 * in the README — but every remaining name/coordinate/tag is real OSM
 * data, unmodified.
 *
 * `fetchGreenSpaces()` in `client.ts` uses this ONLY when a live call to
 * both the primary and mirror Overpass endpoints fails, and the UI
 * discloses it plainly as a cached fallback rather than presenting it as
 * a live result for whatever location the user actually asked about — if
 * the user's coordinates are far from Portland, the distances shown here
 * would be misleading, so the fallback is honest about being a snapshot,
 * not a live answer for their location.
 */

import type { RawOverpassElement } from "./types";

export const FALLBACK_CAPTURED_AT = "2026-08-16T07:50:36Z";
export const FALLBACK_CENTER = { lat: 45.5152, lon: -122.6784 };
export const FALLBACK_LABEL = "Portland, OR";

export const FALLBACK_ELEMENTS: RawOverpassElement[] = [
  {
    "type": "way",
    "id": 27401099,
    "center": {
      "lat": 45.5203887,
      "lon": -122.6716693
    },
    "tags": {
      "leisure": "park",
      "name": "Governor Tom McCall Waterfront Park"
    }
  },
  {
    "type": "way",
    "id": 29396952,
    "center": {
      "lat": 45.5267136,
      "lon": -122.6914863
    },
    "tags": {
      "leisure": "park",
      "name": "Couch Park"
    }
  },
  {
    "type": "way",
    "id": 32482549,
    "center": {
      "lat": 45.5256457,
      "lon": -122.6729696
    },
    "tags": {
      "leisure": "garden",
      "name": "Lan Su Chinese Garden"
    }
  },
  {
    "type": "way",
    "id": 34198763,
    "center": {
      "lat": 45.5153997,
      "lon": -122.6776854
    },
    "tags": {
      "leisure": "park",
      "name": "Chapman Square"
    }
  },
  {
    "type": "way",
    "id": 34198764,
    "center": {
      "lat": 45.5160635,
      "lon": -122.677323
    },
    "tags": {
      "leisure": "park",
      "name": "Lownsdale Square"
    }
  },
  {
    "type": "way",
    "id": 34198765,
    "center": {
      "lat": 45.5147302,
      "lon": -122.6780496
    },
    "tags": {
      "leisure": "park",
      "name": "Terry Schrunk Plaza"
    }
  },
  {
    "type": "way",
    "id": 34198766,
    "center": {
      "lat": 45.5290534,
      "lon": -122.6818479
    },
    "tags": {
      "leisure": "park",
      "name": "Jamison Square"
    }
  },
  {
    "type": "way",
    "id": 69022725,
    "center": {
      "lat": 45.5020819,
      "lon": -122.680561
    },
    "tags": {
      "landuse": "recreation_ground"
    }
  },
  {
    "type": "way",
    "id": 71173007,
    "center": {
      "lat": 45.5226478,
      "lon": -122.6899798
    },
    "tags": {
      "leisure": "park",
      "name": "Portland Firefighters Park"
    }
  },
  {
    "type": "way",
    "id": 72133494,
    "center": {
      "lat": 45.5127072,
      "lon": -122.674766
    },
    "tags": {
      "leisure": "garden"
    }
  },
  {
    "type": "way",
    "id": 121963747,
    "center": {
      "lat": 45.5118164,
      "lon": -122.6874259
    },
    "tags": {
      "landuse": "recreation_ground",
      "name": "Peter W. Stott Community Recreation Field"
    }
  },
  {
    "type": "way",
    "id": 130666914,
    "center": {
      "lat": 45.5079463,
      "lon": -122.6722747
    },
    "tags": {
      "leisure": "park",
      "name": "South Waterfront Park"
    }
  },
  {
    "type": "way",
    "id": 130669360,
    "center": {
      "lat": 45.509311,
      "lon": -122.6798366
    },
    "tags": {
      "leisure": "park",
      "name": "Lovejoy Fountain Park"
    }
  },
  {
    "type": "way",
    "id": 130669361,
    "center": {
      "lat": 45.5109568,
      "lon": -122.6789509
    },
    "tags": {
      "leisure": "park",
      "name": "Pettygrove Park"
    }
  },
  {
    "type": "way",
    "id": 130670495,
    "center": {
      "lat": 45.5068267,
      "lon": -122.6798
    },
    "tags": {
      "leisure": "park",
      "name": "Portland Center"
    }
  },
  {
    "type": "way",
    "id": 130670496,
    "center": {
      "lat": 45.5136241,
      "lon": -122.6841445
    },
    "tags": {
      "leisure": "park",
      "name": "South Park Blocks"
    }
  },
  {
    "type": "way",
    "id": 130673556,
    "center": {
      "lat": 45.5245832,
      "lon": -122.6788206
    },
    "tags": {
      "leisure": "park",
      "name": "North Park Blocks"
    }
  },
  {
    "type": "way",
    "id": 130676350,
    "center": {
      "lat": 45.5138029,
      "lon": -122.6911104
    },
    "tags": {
      "leisure": "park",
      "name": "Firehouse Theater Grounds"
    }
  },
  {
    "type": "way",
    "id": 130676351,
    "center": {
      "lat": 45.5126871,
      "lon": -122.6904317
    },
    "tags": {
      "leisure": "park",
      "name": "Hall and 14th Park"
    }
  },
  {
    "type": "way",
    "id": 130677219,
    "center": {
      "lat": 45.5148856,
      "lon": -122.6953912
    },
    "tags": {
      "name": "Frank L Knight Property",
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 130679708,
    "center": {
      "lat": 45.5037432,
      "lon": -122.6847614
    },
    "tags": {
      "leisure": "park",
      "name": "Duniway Park"
    }
  },
  {
    "type": "way",
    "id": 130681792,
    "center": {
      "lat": 45.491468,
      "lon": -122.6836663
    },
    "tags": {
      "leisure": "nature_reserve",
      "name": "Southwest Terwilliger Boulevard Parkway"
    }
  },
  {
    "type": "way",
    "id": 130684319,
    "center": {
      "lat": 45.5015597,
      "lon": -122.6806849
    },
    "tags": {
      "leisure": "park",
      "name": "Lair Hill Park"
    }
  },
  {
    "type": "way",
    "id": 130684518,
    "center": {
      "lat": 45.5131109,
      "lon": -122.6885214
    },
    "tags": {
      "leisure": "garden"
    }
  },
  {
    "type": "way",
    "id": 130705377,
    "center": {
      "lat": 45.5130344,
      "lon": -122.7012658
    },
    "tags": {
      "name": "Jefferson Street Property",
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 130705822,
    "center": {
      "lat": 45.531168,
      "lon": -122.6819117
    },
    "tags": {
      "leisure": "park",
      "name": "Tanner Springs Park"
    }
  },
  {
    "type": "way",
    "id": 134149230,
    "center": {
      "lat": 45.4991772,
      "lon": -122.6772863
    },
    "tags": {
      "landuse": "allotments",
      "leisure": "garden",
      "name": "Water and Gibbs Community Garden"
    }
  },
  {
    "type": "way",
    "id": 134150722,
    "center": {
      "lat": 45.4977317,
      "lon": -122.6782556
    },
    "tags": {
      "leisure": "garden",
      "name": "Front and Curry Community Garden"
    }
  },
  {
    "type": "way",
    "id": 142986240,
    "center": {
      "lat": 45.5184235,
      "lon": -122.6526232
    },
    "tags": {
      "leisure": "park",
      "name": "Washington Monroe Property"
    }
  },
  {
    "type": "way",
    "id": 154073663,
    "center": {
      "lat": 45.5127456,
      "lon": -122.6791388
    },
    "tags": {
      "leisure": "park",
      "name": "Keller Fountain Park"
    }
  },
  {
    "type": "way",
    "id": 156366633,
    "center": {
      "lat": 45.5162177,
      "lon": -122.6732503
    },
    "tags": {
      "leisure": "park",
      "name": "Mill Ends Park"
    }
  },
  {
    "type": "way",
    "id": 156423782,
    "center": {
      "lat": 45.5331633,
      "lon": -122.6816795
    },
    "tags": {
      "leisure": "park",
      "name": "The Fields Neighborhood Park"
    }
  },
  {
    "type": "way",
    "id": 160949694,
    "center": {
      "lat": 45.5274831,
      "lon": -122.6645696
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 160949699,
    "center": {
      "lat": 45.5297722,
      "lon": -122.6642486
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 160949702,
    "center": {
      "lat": 45.5293749,
      "lon": -122.6649678
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 164103972,
    "center": {
      "lat": 45.5289937,
      "lon": -122.6612066
    },
    "tags": {
      "leisure": "park",
      "name": "Oregon Convention Center Plaza"
    }
  },
  {
    "type": "way",
    "id": 224591088,
    "center": {
      "lat": 45.5293671,
      "lon": -122.6655862
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 333101964,
    "center": {
      "lat": 45.5028146,
      "lon": -122.6774093
    },
    "tags": {
      "leisure": "garden",
      "name": "Minh Chau Garden"
    }
  },
  {
    "type": "way",
    "id": 333102031,
    "center": {
      "lat": 45.5010332,
      "lon": -122.6762713
    },
    "tags": {
      "leisure": "garden",
      "name": "Min Zidell Garden"
    }
  },
  {
    "type": "way",
    "id": 340379601,
    "center": {
      "lat": 45.5027627,
      "lon": -122.6866708
    },
    "tags": {
      "leisure": "garden",
      "name": "Duniway Lilac Garden"
    }
  },
  {
    "type": "way",
    "id": 354681072,
    "center": {
      "lat": 45.510325,
      "lon": -122.6847874
    },
    "tags": {
      "leisure": "garden",
      "name": "Shattuck Hall Ecological Learning Plaza"
    }
  },
  {
    "type": "way",
    "id": 370751387,
    "center": {
      "lat": 45.5240641,
      "lon": -122.6971688
    },
    "tags": {
      "leisure": "park"
    }
  },
  {
    "type": "way",
    "id": 391823180,
    "center": {
      "lat": 45.5135578,
      "lon": -122.6741674
    },
    "tags": {
      "leisure": "garden"
    }
  },
  {
    "type": "way",
    "id": 391827949,
    "center": {
      "lat": 45.5133484,
      "lon": -122.6734734
    },
    "tags": {
      "leisure": "garden"
    }
  },
  {
    "type": "way",
    "id": 392011481,
    "center": {
      "lat": 45.527818,
      "lon": -122.6660289
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 392011482,
    "center": {
      "lat": 45.5283168,
      "lon": -122.666435
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 392011483,
    "center": {
      "lat": 45.5280695,
      "lon": -122.6662618
    },
    "tags": {
      "leisure": "park"
    }
  },
  {
    "type": "way",
    "id": 392016229,
    "center": {
      "lat": 45.5277116,
      "lon": -122.6643805
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 392385268,
    "center": {
      "lat": 45.5271379,
      "lon": -122.6661359
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 392385271,
    "center": {
      "lat": 45.5266479,
      "lon": -122.6657766
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 392387093,
    "center": {
      "lat": 45.5205352,
      "lon": -122.6663885
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 392387094,
    "center": {
      "lat": 45.5197984,
      "lon": -122.666398
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 392387095,
    "center": {
      "lat": 45.5191124,
      "lon": -122.6666942
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 392387101,
    "center": {
      "lat": 45.518123,
      "lon": -122.6670563
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 402011056,
    "center": {
      "lat": 45.5178745,
      "lon": -122.6732463
    },
    "tags": {
      "leisure": "park",
      "name": "Printing Press Park"
    }
  },
  {
    "type": "way",
    "id": 422521338,
    "center": {
      "lat": 45.5266994,
      "lon": -122.6595597
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 466166488,
    "center": {
      "lat": 45.5103484,
      "lon": -122.6744704
    },
    "tags": {
      "leisure": "garden"
    }
  },
  {
    "type": "way",
    "id": 466204404,
    "center": {
      "lat": 45.5116644,
      "lon": -122.6744963
    },
    "tags": {
      "leisure": "garden"
    }
  },
  {
    "type": "way",
    "id": 466204405,
    "center": {
      "lat": 45.5115859,
      "lon": -122.6745308
    },
    "tags": {
      "leisure": "garden"
    }
  },
  {
    "type": "way",
    "id": 468466824,
    "center": {
      "lat": 45.4973835,
      "lon": -122.6678635
    },
    "tags": {
      "leisure": "park",
      "name": "South Waterfront Greenway"
    }
  },
  {
    "type": "way",
    "id": 482586095,
    "center": {
      "lat": 45.5150919,
      "lon": -122.678666
    },
    "tags": {
      "leisure": "garden",
      "name": "Better Together Garden"
    }
  },
  {
    "type": "way",
    "id": 496381425,
    "center": {
      "lat": 45.500942,
      "lon": -122.6866041
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 496381426,
    "center": {
      "lat": 45.5037432,
      "lon": -122.6848626
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 514664068,
    "center": {
      "lat": 45.5203151,
      "lon": -122.697902
    },
    "tags": {
      "leisure": "garden"
    }
  },
  {
    "type": "way",
    "id": 514879748,
    "center": {
      "lat": 45.5213217,
      "lon": -122.6949288
    },
    "tags": {
      "leisure": "garden"
    }
  },
  {
    "type": "way",
    "id": 541287210,
    "center": {
      "lat": 45.5212241,
      "lon": -122.7008852
    },
    "tags": {
      "leisure": "garden"
    }
  },
  {
    "type": "way",
    "id": 541287211,
    "center": {
      "lat": 45.521396,
      "lon": -122.7008821
    },
    "tags": {
      "leisure": "garden"
    }
  },
  {
    "type": "way",
    "id": 613184879,
    "center": {
      "lat": 45.5083257,
      "lon": -122.665958
    },
    "tags": {
      "leisure": "park"
    }
  },
  {
    "type": "way",
    "id": 696826031,
    "center": {
      "lat": 45.5266694,
      "lon": -122.686112
    },
    "tags": {
      "leisure": "park",
      "name": "Glisan 14"
    }
  },
  {
    "type": "way",
    "id": 939133777,
    "center": {
      "lat": 45.5077188,
      "lon": -122.6762416
    },
    "tags": {
      "leisure": "garden"
    }
  },
  {
    "type": "way",
    "id": 996203218,
    "center": {
      "lat": 45.5139559,
      "lon": -122.6859959
    },
    "tags": {
      "leisure": "park"
    }
  },
  {
    "type": "way",
    "id": 1172652037,
    "center": {
      "lat": 45.5139069,
      "lon": -122.6997853
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1172652038,
    "center": {
      "lat": 45.5105359,
      "lon": -122.7032392
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1172652039,
    "center": {
      "lat": 45.5097668,
      "lon": -122.7008335
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1172652040,
    "center": {
      "lat": 45.5039694,
      "lon": -122.698132
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1172652042,
    "center": {
      "lat": 45.5005834,
      "lon": -122.6951745
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1172652990,
    "center": {
      "lat": 45.5012393,
      "lon": -122.68829
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1172652992,
    "center": {
      "lat": 45.5031987,
      "lon": -122.6897039
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1172652993,
    "center": {
      "lat": 45.5047834,
      "lon": -122.6902064
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1172878391,
    "center": {
      "lat": 45.5128171,
      "lon": -122.6947709
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1172878392,
    "center": {
      "lat": 45.5144088,
      "lon": -122.6934839
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1172878394,
    "center": {
      "lat": 45.5158431,
      "lon": -122.6956642
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1172878395,
    "center": {
      "lat": 45.5165512,
      "lon": -122.6952026
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1172878396,
    "center": {
      "lat": 45.5174717,
      "lon": -122.6954042
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1172878397,
    "center": {
      "lat": 45.5175986,
      "lon": -122.6961242
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1172878398,
    "center": {
      "lat": 45.517885,
      "lon": -122.6966564
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1172878399,
    "center": {
      "lat": 45.5179419,
      "lon": -122.698887
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1172878400,
    "center": {
      "lat": 45.5179218,
      "lon": -122.6981319
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1172878401,
    "center": {
      "lat": 45.5184762,
      "lon": -122.6966709
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1172878402,
    "center": {
      "lat": 45.5195574,
      "lon": -122.6982237
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1172878404,
    "center": {
      "lat": 45.5159669,
      "lon": -122.6945527
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1172878407,
    "center": {
      "lat": 45.5148458,
      "lon": -122.6935887
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1172878408,
    "center": {
      "lat": 45.5129915,
      "lon": -122.6927801
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1172878409,
    "center": {
      "lat": 45.5115569,
      "lon": -122.6915199
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1172878410,
    "center": {
      "lat": 45.5118353,
      "lon": -122.6925093
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1172878411,
    "center": {
      "lat": 45.5122128,
      "lon": -122.6922404
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1172878412,
    "center": {
      "lat": 45.5100841,
      "lon": -122.6919937
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1172878413,
    "center": {
      "lat": 45.5109066,
      "lon": -122.6905734
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1172878414,
    "center": {
      "lat": 45.5113532,
      "lon": -122.6908242
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1172878415,
    "center": {
      "lat": 45.5096562,
      "lon": -122.6893174
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1172878416,
    "center": {
      "lat": 45.5086192,
      "lon": -122.6884932
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1172878417,
    "center": {
      "lat": 45.5075215,
      "lon": -122.6874759
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1172878418,
    "center": {
      "lat": 45.5080025,
      "lon": -122.6879613
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1172878419,
    "center": {
      "lat": 45.5064443,
      "lon": -122.6867275
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1172878420,
    "center": {
      "lat": 45.5053489,
      "lon": -122.685852
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1172878421,
    "center": {
      "lat": 45.5056144,
      "lon": -122.6855673
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1172878422,
    "center": {
      "lat": 45.5057681,
      "lon": -122.6860447
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1172878423,
    "center": {
      "lat": 45.5062226,
      "lon": -122.6871692
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1172878424,
    "center": {
      "lat": 45.5060307,
      "lon": -122.6893424
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1172878425,
    "center": {
      "lat": 45.5051273,
      "lon": -122.6894509
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1172878426,
    "center": {
      "lat": 45.5042854,
      "lon": -122.6871523
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1172878427,
    "center": {
      "lat": 45.5041587,
      "lon": -122.6867872
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1172878428,
    "center": {
      "lat": 45.5044255,
      "lon": -122.6862529
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1172878429,
    "center": {
      "lat": 45.5031841,
      "lon": -122.6875807
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1172878430,
    "center": {
      "lat": 45.5068348,
      "lon": -122.6919511
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1172878431,
    "center": {
      "lat": 45.5078119,
      "lon": -122.6938337
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1250630536,
    "center": {
      "lat": 45.5124306,
      "lon": -122.6868146
    },
    "tags": {
      "leisure": "park",
      "name": "PSU Oak Savanna"
    }
  },
  {
    "type": "way",
    "id": 1381912254,
    "center": {
      "lat": 45.4980699,
      "lon": -122.6813422
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1381912255,
    "center": {
      "lat": 45.4967766,
      "lon": -122.68315
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1433401789,
    "center": {
      "lat": 45.5272597,
      "lon": -122.6561119
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1459401856,
    "center": {
      "lat": 45.510429,
      "lon": -122.688565
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1459401858,
    "center": {
      "lat": 45.5104015,
      "lon": -122.6887198
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1493489980,
    "center": {
      "lat": 45.5010958,
      "lon": -122.6905705
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1493526051,
    "center": {
      "lat": 45.5005708,
      "lon": -122.6924422
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1493526053,
    "center": {
      "lat": 45.5006426,
      "lon": -122.6914675
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1493526068,
    "center": {
      "lat": 45.5005975,
      "lon": -122.6911554
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1493526425,
    "center": {
      "lat": 45.5009548,
      "lon": -122.6922826
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1493526426,
    "center": {
      "lat": 45.5011035,
      "lon": -122.6919295
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1493526428,
    "center": {
      "lat": 45.5009026,
      "lon": -122.6915633
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1493526429,
    "center": {
      "lat": 45.5010925,
      "lon": -122.691556
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1493526430,
    "center": {
      "lat": 45.4998547,
      "lon": -122.6901632
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1493526431,
    "center": {
      "lat": 45.4998815,
      "lon": -122.6903518
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1493526432,
    "center": {
      "lat": 45.5004194,
      "lon": -122.6903581
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1493526433,
    "center": {
      "lat": 45.50007,
      "lon": -122.6910649
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1549247384,
    "center": {
      "lat": 45.5227454,
      "lon": -122.7025072
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1549247385,
    "center": {
      "lat": 45.5212806,
      "lon": -122.7017378
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1549247386,
    "center": {
      "lat": 45.5200276,
      "lon": -122.701433
    },
    "tags": {
      "natural": "wood"
    }
  },
  {
    "type": "way",
    "id": 1549482823,
    "center": {
      "lat": 45.5189697,
      "lon": -122.7005011
    },
    "tags": {
      "natural": "wood"
    }
  }
];
