// Skin interfaces
export interface Skin {
    weapon_defindex: number;
    weapon_name: string;
    paint: number;
    image: string;
    paint_name: string;
}

// Selected skin settings
export interface SelectedSkin {
    weapon_defindex: number;
    paint_id: number;
    wear: number;
    seed: number;
}

// Weapon category interface
export interface WeaponCategory {
    id: string;
    name: string;
    icon: string;
    defindexes: number[];
}

// Weapon categories mapping
export const WEAPON_CATEGORIES: WeaponCategory[] = [
    {
        id: 'rifles',
        name: 'Rifle',
        icon: '🔫',
        defindexes: [7, 8, 9, 10, 11, 13, 16, 38, 39, 40, 60] // AK, AUG, AWP, FAMAS, G3SG1, Galil, M4A4, SCAR, SG556, SSG08, M4A1-S
    },
    {
        id: 'pistols',
        name: 'Pistol',
        icon: '🔫',
        defindexes: [1, 2, 3, 4, 30, 32, 36, 61, 63, 64] // Deagle, Elite, Five-Seven, Glock, Tec-9, P2000, P250, USP-S, CZ75, R8
    },
    {
        id: 'smgs',
        name: 'SMG',
        icon: '💨',
        defindexes: [17, 19, 23, 24, 26, 33, 34] // MAC-10, P90, MP5-SD, UMP-45, Bizon, MP7, MP9
    },
    {
        id: 'heavy',
        name: 'Heavy',
        icon: '💥',
        defindexes: [14, 25, 27, 28, 29, 35] // M249, XM1014, MAG-7, Negev, Sawed-Off, Nova
    }
];

// Knife defindexes (separated from weapon categories)
export const KNIFE_DEFINDEXES = [500, 503, 505, 506, 507, 508, 509, 512, 514, 515, 516, 517, 518, 519, 520, 521, 522, 523, 525, 526];

// Knife name to defindex mapping (used to find old knife defindex from database knife name)
export const KNIFE_NAME_TO_DEFINDEX: Record<string, number> = {
    'weapon_knife': 500,
    'weapon_knife_t': 500,
    'weapon_bayonet': 500,
    'weapon_knife_css': 503,
    'weapon_knife_flip': 505,
    'weapon_knife_gut': 506,
    'weapon_knife_karambit': 507,
    'weapon_knife_m9_bayonet': 508,
    'weapon_knife_tactical': 509,
    'weapon_knife_falchion': 512,
    'weapon_knife_survival_bowie': 514,
    'weapon_knife_butterfly': 515,
    'weapon_knife_push': 516,
    'weapon_knife_cord': 517,
    'weapon_knife_canis': 518,
    'weapon_knife_ursus': 519,
    'weapon_knife_gypsy_jackknife': 520,
    'weapon_knife_outdoor': 521,
    'weapon_knife_stiletto': 522,
    'weapon_knife_widowmaker': 523,
    'weapon_knife_skeleton': 525,
    'weapon_knife_kukri': 526,
};

// Weapon name display mapping
export const WEAPON_DISPLAY_NAMES: Record<string, string> = {
    'weapon_ak47': 'AK-47',
    'weapon_aug': 'AUG',
    'weapon_awp': 'AWP',
    'weapon_famas': 'FAMAS',
    'weapon_g3sg1': 'G3SG1',
    'weapon_galilar': 'Galil AR',
    'weapon_m4a1': 'M4A4',
    'weapon_m4a1_silencer': 'M4A1-S',
    'weapon_scar20': 'SCAR-20',
    'weapon_sg556': 'SG 553',
    'weapon_ssg08': 'SSG 08',
    'weapon_deagle': 'Desert Eagle',
    'weapon_elite': 'Dual Berettas',
    'weapon_fiveseven': 'Five-SeveN',
    'weapon_glock': 'Glock-18',
    'weapon_hkp2000': 'P2000',
    'weapon_p250': 'P250',
    'weapon_tec9': 'Tec-9',
    'weapon_usp_silencer': 'USP-S',
    'weapon_cz75a': 'CZ75-Auto',
    'weapon_revolver': 'R8 Revolver',
    'weapon_mac10': 'MAC-10',
    'weapon_p90': 'P90',
    'weapon_mp5sd': 'MP5-SD',
    'weapon_ump45': 'UMP-45',
    'weapon_bizon': 'PP-Bizon',
    'weapon_mp7': 'MP7',
    'weapon_mp9': 'MP9',
    'weapon_m249': 'M249',
    'weapon_xm1014': 'XM1014',
    'weapon_mag7': 'MAG-7',
    'weapon_negev': 'Negev',
    'weapon_sawedoff': 'Sawed-Off',
    'weapon_nova': 'Nova',
    'weapon_bayonet': 'Bayonet',
    'weapon_knife_css': 'Classic Knife',
    'weapon_knife_flip': 'Flip Knife',
    'weapon_knife_gut': 'Gut Knife',
    'weapon_knife_karambit': 'Karambit',
    'weapon_knife_m9_bayonet': 'M9 Bayonet',
    'weapon_knife_tactical': 'Huntsman Knife',
    'weapon_knife_falchion': 'Falchion Knife',
    'weapon_knife_survival_bowie': 'Bowie Knife',
    'weapon_knife_butterfly': 'Butterfly Knife',
    'weapon_knife_push': 'Shadow Daggers',
    'weapon_knife_cord': 'Paracord Knife',
    'weapon_knife_canis': 'Survival Knife',
    'weapon_knife_ursus': 'Ursus Knife',
    'weapon_knife_gypsy_jackknife': 'Navaja Knife',
    'weapon_knife_outdoor': 'Nomad Knife',
    'weapon_knife_stiletto': 'Stiletto Knife',
    'weapon_knife_widowmaker': 'Talon Knife',
    'weapon_knife_skeleton': 'Skeleton Knife',
    'weapon_knife_kukri': 'Kukri Knife'
};

// Glove type display mapping (by defindex)
export const GLOVE_DISPLAY_NAMES: Record<number, string> = {
    5027: 'Bloodhound Gloves',
    5030: 'Sport Gloves',
    5031: 'Driver Gloves',
    5032: 'Hand Wraps',
    5033: 'Moto Gloves',
    5034: 'Specialist Gloves',
    5035: 'Hydra Gloves',
    4725: 'Broken Fang Gloves'
};

// Glove defindexes
export const GLOVE_DEFINDEXES = [5027, 5030, 5031, 5032, 5033, 5034, 5035, 4725];
