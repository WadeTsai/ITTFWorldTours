import type { Group } from './types';

/**
 * Event id -> display name.
 *
 * The 2018-2020 ITTF World Tour events keep their Chinese names. The 2025 WTT
 * events use the names worldtabletennis.com publishes, minus the naming-rights
 * suffix ("... Presented by AITO") and the trailing year, which the season
 * heading already shows.
 */
export const EVENT_NAMES: Record<string, string> = {
  // 2026 WTT series (events played so far)
  '3231': 'WTT Champions Doha',
  '3232': 'WTT Star Contender Doha',
  '3251': 'WTT Contender Muscat',
  '3233': 'WTT Star Contender Chennai',
  '3234': 'Singapore Smash',
  '3235': 'WTT Champions Chongqing',
  '3236': 'WTT Contender Tunis',
  '3379': "ITTF Men's & Women's World Cup Macao",
  '3237': 'WTT Contender Taiyuan',
  '3238': 'WTT Contender Lagos',
  '3239': 'WTT Contender Skopje',
  '3240': 'WTT Contender Zagreb',
  '3241': 'WTT Star Contender Ljubljana',
  '3242': 'United States Smash',
  '3244': 'WTT Star Contender São José dos Campos',

  // 2025 WTT series
  '3082': 'United States Smash',
  '3083': 'WTT Star Contender Doha',
  '3084': 'WTT Contender Muscat',
  '3085': 'Singapore Smash',
  '3086': 'WTT Champions Chongqing',
  '3087': 'WTT Champions Incheon',
  '3088': 'WTT Contender Taiyuan',
  '3089': 'WTT Contender Tunis',
  '3090': 'WTT Contender Skopje',
  '3091': 'WTT Star Contender Ljubljana',
  '3092': 'WTT Contender Zagreb',
  '3093': 'WTT Star Contender Foz do Iguaçu',
  '3094': 'WTT Champions Yokohama',
  '3096': 'WTT Contender Almaty',
  '3097': 'WTT Champions Macao',
  '3098': 'China Smash',
  '3099': 'WTT Champions Montpellier',
  '3100': 'WTT Champions Frankfurt',
  '3108': 'ITTF World Table Tennis Championships Finals Doha',
  '3109': "ITTF Men's and Women's World Cup Macao",
  '3110': 'WTT Star Contender London',
  '3112': 'WTT Finals Hong Kong',
  '3121': 'WTT Contender Lagos',
  '3128': 'Europe Smash - Sweden',
  '3133': 'WTT Star Contender Chennai',
  '3175': 'WTT Contender Buenos Aires',
  '3176': 'WTT Star Contender Muscat',

  // 2024 WTT series
  '2866': 'WTT Finals Men Doha',
  '2862': 'WTT Star Contender Doha',
  '2861': 'WTT Contender Doha',
  '2863': 'WTT Star Contender Goa',
  '2904': 'Singapore Smash',
  '2899': 'WTT Champions Incheon',
  '2937': "ITTF Men's and Women's World Cup Macao",
  '2932': 'Saudi Smash',
  '2867': 'WTT Contender Rio de Janeiro',
  '2865': 'WTT Contender Taiyuan',
  '2934': 'WTT Contender Mendoza',
  '2941': 'WTT Champions Chongqing',
  '2869': 'WTT Contender Zagreb',
  '2870': 'WTT Star Contender Ljubljana',
  '2868': 'WTT Contender Lagos',
  '2871': 'WTT Contender Tunis',
  '2900': 'WTT Star Contender Bangkok',
  '2872': 'WTT Contender Lima',
  '2873': 'WTT Contender Almaty',
  '2983': 'WTT Champions Macao',
  '2942': 'China Smash',
  '2940': 'WTT Champions Montpellier',
  '2997': 'WTT Contender Muscat',
  '2877': 'WTT Champions Frankfurt',
  '2947': 'WTT Finals Fukuoka',

  // 2023 WTT series
  '2699': 'WTT Contender Durban',
  '2698': 'WTT Contender Doha',
  '2697': 'WTT Contender Amman',
  '2696': 'WTT Star Contender Goa',
  '2629': 'Singapore Smash',
  '2737': 'WTT Champions Xinxiang',
  '2728': 'WTT Champions Macao',
  '2695': 'WTT Star Contender Bangkok',
  '2660': 'ITTF World Table Tennis Championships Finals Durban',
  '2693': 'WTT Contender Lagos',
  '2691': 'WTT Contender Tunis',
  '2692': 'WTT Contender Zagreb',
  '2694': 'WTT Star Contender Ljubljana',
  '2721': 'WTT Contender Lima',
  '2722': 'WTT Contender Rio de Janeiro',
  '2739': 'WTT Contender Almaty',
  '2777': 'WTT Star Contender Lanzhou',
  '2775': 'WTT Contender Muscat',
  '2742': 'WTT Contender Antalya',
  '2705': 'WTT Champions Frankfurt',
  '2794': 'WTT Contender Taiyuan',
  '2776': 'WTT Finals Women Nagoya',

  // 2022 WTT series
  '2537': 'WTT Macao',
  '2531': 'WTT Contender Muscat (February)',
  '2536': 'Singapore Smash',
  '2532': 'WTT Contender Doha',
  '2533': 'WTT Star Contender Doha',
  '2539': 'WTT Contender Zagreb',
  '2574': 'WTT Contender Lima',
  '2591': 'WTT Star Contender European Summer Series',
  '2593': 'WTT Champions European Summer Series',
  '2568': 'WTT Contender Tunis',
  '2605': 'WTT Contender Muscat (September)',
  '2606': 'WTT Contender Almaty',
  '2619': 'WTT Champions Macao',
  '2627': 'WTT Cup Finals Xinxiang',
  '2589': 'WTT Contender Nova Gorica',

  // 2021 WTT series
  '2410': 'WTT Contender Doha',
  '2411': 'WTT Star Contender Doha (March)',
  '2487': 'WTT Contender Budapest',
  '2489': 'WTT Star Contender Doha (September)',
  '2502': 'WTT Contender Tunis',
  '2503': 'WTT Contender Laško',
  '2504': 'WTT Contender Novo Mesto',
  '2346': 'World Table Tennis Championships Finals Houston',
  '2516': 'WTT Cup Finals Singapore',

  // 2018-2020 ITTF World Tour
  '2816': '香港公開賽',
  '2817': '中國公開賽',
  '2818': '日本公開賽',
  '2819': '韓國公開賽',
  '2820': '保加利亞公開賽',
  '2821': '捷克公開賽',
  '2822': '奧地利公開賽',
  '2823': '瑞典公開賽',
  '2824': '澳洲公開賽',
  '2825': '年終總決賽',
  // `ittf` prefix: WTT reuses the bare id 2873 for Contender Almaty 2024.
  ittf2873: '世界盃',
  '5000': '世界錦標賽',
  '5001': '匈牙利公開賽',
  '5002': '卡達公開賽',
  '5003': '中國公開賽',
  '5004': '香港公開賽',
  '5005': '日本公開賽',
  '5006': '韓國公開賽',
  '5007': '澳洲公開賽',
  '5008': '保加利亞公開賽',
  '5009': '捷克公開賽',
  '5010': '瑞典公開賽',
  '5011': '德國公開賽',
  '5012': '奧地利公開賽',
  '5013': '年終總決賽',
  '5014': '葡萄牙公開賽',
  '5015': '阿曼公開賽',
  '5016': '西班牙公開賽',
  '5017': '塞爾維亞公開賽',
  '5018': '斯洛文尼亞公開賽',
  '5019': '克羅地亞公開賽',
  '5020': '泰國公開賽',
  '5021': '平壤公開賽',
  '5022': '尼日利亞公開賽',
  '5023': '巴拉圭公開賽',
  '5025': '波蘭公開賽',
  '5026': '白俄羅斯公開賽',
  '5028': '印尼公開賽',
  '5030': '北美公開賽',
  '5069': '世界盃',
  '5139': '德國公開賽',
  '5145': '匈牙利公開賽',
  '5146': '卡達公開賽',
  '5184': '世界盃',
  '5263': '年終總決賽',
};

export const GROUP_NAMES: Record<Group, string> = {
  MS: '男子單打',
  WS: '女子單打',
};

const BOTH_GROUPS: readonly Group[] = ['MS', 'WS'];

/**
 * Events that ran only one singles draw.
 *
 * WTT split the 2023 Finals by gender and staged them months apart: the women
 * played Nagoya in December 2023, the men Doha in January 2024. Each is its own
 * event with a single draw, so neither has a counterpart to show.
 */
const SINGLE_GROUP_EVENTS: Record<string, readonly Group[]> = {
  '2776': ['WS'],
  '2866': ['MS'],
};

/** The draws an event actually has. Both singles unless listed above. */
export function groupsOf(eventId: string): readonly Group[] {
  return SINGLE_GROUP_EVENTS[eventId] ?? BOTH_GROUPS;
}

export interface TourSeason {
  year: number;
  /** Event ids in chronological order. Append new events to the end. */
  eventIds: readonly string[];
}

/**
 * Seasons are listed newest first, which is the order the sidebar renders them.
 * Within a season the ids are chronological; the sidebar reverses them so the
 * most recent event sits at the top.
 *
 * This replaces the old `TTE > 4999 ? (TTE > 5100 ? 2020 : 2019) : 2018` check,
 * which relied on id ranges that only held by coincidence.
 */
export const SEASONS: readonly TourSeason[] = [
  {
    // Only the events played so far. The rest of the calendar has no draw yet.
    year: 2026,
    eventIds: [
      '3231', '3232', '3251', '3233', '3234', '3235', '3236', '3379', '3237',
      '3238', '3239', '3240', '3241', '3242', '3244',
    ],
  },
  {
    // WTT took over from the ITTF World Tour, so ids restart in the 3000s.
    year: 2025,
    eventIds: [
      '3083', '3084', '3085', '3086', '3133', '3087', '3088', '3109', '3089',
      '3108', '3090', '3091', '3092', '3082', '3121', '3175', '3093', '3094',
      '3128', '3096', '3097', '3098', '3110', '3099', '3100', '3176', '3112',
    ],
  },
  {
    year: 2024,
    eventIds: [
      '2866', '2862', '2861', '2863', '2904', '2899', '2937', '2932', '2867',
      '2865', '2934', '2941', '2869', '2870', '2868', '2871', '2900', '2872',
      '2873', '2983', '2942', '2940', '2997', '2877', '2947',
    ],
  },
  {
    year: 2023,
    eventIds: [
      '2699', '2698', '2697', '2696', '2629', '2737', '2728', '2695', '2660',
      '2693', '2691', '2692', '2694', '2721', '2722', '2739', '2777', '2775',
      '2742', '2705', '2794', '2776',
    ],
  },
  {
    year: 2022,
    eventIds: [
      '2537', '2531', '2536', '2532', '2533', '2539', '2574', '2591', '2593',
      '2568', '2605', '2606', '2619', '2627', '2589',
    ],
  },
  {
    // WTT's first full season. The ITTF World Tour did not resume after 2020.
    year: 2021,
    eventIds: [
      '2410', '2411', '2487', '2489', '2502', '2503', '2504', '2346', '2516',
    ],
  },
  { year: 2020, eventIds: ['5139', '5145', '5146', '5184', '5263'] },
  {
    year: 2019,
    eventIds: [
      '5000', '5001', '5002', '5003', '5004', '5005', '5006', '5007', '5008',
      '5009', '5010', '5011', '5012', '5013', '5014', '5015', '5016', '5017',
      '5018', '5019', '5020', '5021', '5022', '5023', '5025', '5026', '5028',
      '5030', '5069',
    ],
  },
  {
    year: 2018,
    eventIds: [
      '2816', '2817', '2818', '2819', '2820', '2821', '2822', '2823', '2824',
      '2825', 'ittf2873',
    ],
  },
];

/** The event shown when the app first loads: the newest one on record. */
export const LATEST_EVENT_ID = SEASONS[0]?.eventIds.at(-1) ?? '3112';

/** The season an event belongs to, or `undefined` if the id is unknown. */
export function seasonOf(eventId: string): number | undefined {
  return SEASONS.find((season) => season.eventIds.includes(eventId))?.year;
}

export function eventName(eventId: string): string {
  return EVENT_NAMES[eventId] ?? eventId;
}
