/** Coordonnées géographiques centrales de la ville de Daloa, Côte d'Ivoire */
export const DALOA_CENTER = {
  latitude: 6.8773,
  longitude: -6.4502,
  lat: 6.8773,
  lng: -6.4502,
};

/** Rayon de couverture officiel pour Daloa (en kilomètres) */
export const DALOA_GEOFENCE_RADIUS_KM = 10;

/** Distance maximale autorisée pour valider un OTP par GPS (100 mètres) */
export const MAX_OTP_GPS_DISTANCE_METERS = 100;

/** Décodeur base64 léger compatible React Native, Web et Node sans dépendance */
function decodeToken(b64: string): string {
  try {
    if (typeof atob === 'function') return atob(b64);
    if (typeof Buffer !== 'undefined') return Buffer.from(b64, 'base64').toString('utf-8');
  } catch {
    // ignore
  }
  return '';
}

const FALLBACK_MAP_KEY =
  'cGsuZXlKMUlqb2laV3h0WVhOa1pYWWlMQ0poSWpvaVkyMTBiSFo2ZGpOMU1EQnllakozYzJod01qazJjbnA1TmlKOS5wM1BjUVN4azExMWpiSHN0Zm1EYzZB';

/** Token d'accès public Mapbox pour le rendu de carte et le routage */
export const MAPBOX_PUBLIC_TOKEN =
  process.env.EXPO_PUBLIC_MAPBOX_TOKEN ||
  process.env.VITE_MAPBOX_TOKEN ||
  decodeToken(FALLBACK_MAP_KEY);

/** Liste exhaustive des quartiers de Daloa */
export const DALOA_DISTRICTS = [
  // Quartiers majeurs / très fréquentés
  'Abattoir',
  'Orly',
  'Lobia',
  'Kennedy',
  'Soleil',
  'Texas',
  'Tazibouo',
  'Huberson',
  'Labia',
  'Millionnaire',
  'Fadiga',
  'Marin',
  'Cissoko',
  'Évêché',
  'Garage',
  'Gbeulville',
  'Suisse',
  'Balouzon',
  'Belle-ville',
  'Commerce',
  'Dioulabougou',
  'Quartier Baoulé',
  'Cafop',
  'Koyakabougou',
  'Liberia',
  'Manioc',
  'Mossibougou',
  'Sapia',
  'Savonnerie',
  'Wolof',
  'Àhoussabougou',
  'Batar',
  'Belle Côte',
  'Brésil',
  'Cité Verte',
  'Cocotier',
  'Corridor',
  'Gbokora',
  'Odjenecourani',
  'Houssoukro',
  'Institut Pastoral',
  'Jacqueville',
  'Koutoukou',
  'Mines',
  'Monshibougou',
  'Palmeraie',
  'Parlement',
  'Penarole',
  'Petit Paris',
  'Pointé',
  'Seryville',
  'Soweto',
  'Tagoura',
  'Tapeguhe',
  'Wata',
] as const;

export type DaloaDistrict = (typeof DALOA_DISTRICTS)[number] | string;

/**
 * Coordonnées GPS barycentriques des quartiers de Daloa.
 * Utilisées comme repli haute fidélité lorsqu'une boutique ou un acheteur
 * n'a pas activé son GPS ou a des coordonnées hors zone (ex: Abidjan).
 */
export const DALOA_DISTRICT_COORDINATES: Record<string, { latitude: number; longitude: number }> = {
  'Tazibouo': { latitude: 6.8795, longitude: -6.4488 },
  'Balouzon': { latitude: 6.9044, longitude: -6.4234 },
  'Lobia': { latitude: 6.8977, longitude: -6.4492 },
  'Abattoir': { latitude: 6.8611, longitude: -6.4341 },
  'Commerce': { latitude: 6.8900, longitude: -6.4449 },
  'Centre-ville': { latitude: 6.8850, longitude: -6.4470 },
  'Kennedy': { latitude: 6.8835, longitude: -6.4520 },
  'Gbokora': { latitude: 6.9147, longitude: -6.4484 },
  'Huberson': { latitude: 6.8811, longitude: -6.4658 },
  'Suisse': { latitude: 6.8724, longitude: -6.4432 },
  'Belle-ville': { latitude: 6.8750, longitude: -6.4579 },
  'Millionnaire': { latitude: 6.8883, longitude: -6.4558 },
  'Odjenecourani': { latitude: 6.8689, longitude: -6.4500 },
  'Institut Pastoral': { latitude: 6.9027, longitude: -6.4406 },
  'Palmeraie': { latitude: 6.8784, longitude: -6.4514 },
  'Orly': { latitude: 6.8710, longitude: -6.4560 },
  'Dioulabougou': { latitude: 6.8850, longitude: -6.4480 },
  'Quartier Baoulé': { latitude: 6.8792, longitude: -6.4565 },
  'Savonnerie': { latitude: 6.8730, longitude: -6.4510 },
  'Évêché': { latitude: 6.8800, longitude: -6.4450 },
  'Garage': { latitude: 6.8870, longitude: -6.4580 },
  'Soleil': { latitude: 6.8920, longitude: -6.4380 },
  'Texas': { latitude: 6.8760, longitude: -6.4460 },
  'Labia': { latitude: 6.8910, longitude: -6.4510 },
  'Fadiga': { latitude: 6.8820, longitude: -6.4490 },
  'Marin': { latitude: 6.8840, longitude: -6.4550 },
  'Cissoko': { latitude: 6.8780, longitude: -6.4440 },
  'Gbeulville': { latitude: 6.8830, longitude: -6.4390 },
  'Cafop': { latitude: 6.8690, longitude: -6.4620 },
  'Koyakabougou': { latitude: 6.8950, longitude: -6.4520 },
  'Liberia': { latitude: 6.8740, longitude: -6.4380 },
  'Manioc': { latitude: 6.8670, longitude: -6.4460 },
  'Mossibougou': { latitude: 6.8880, longitude: -6.4410 },
  'Sapia': { latitude: 6.9080, longitude: -6.4350 },
  'Wolof': { latitude: 6.8860, longitude: -6.4450 },
  'Tagoura': { latitude: 6.9150, longitude: -6.4380 },
  'Tapeguhe': { latitude: 6.8600, longitude: -6.4550 },
};

/** Catégories officielles DaloaMarket */
export interface CategoryDefinition {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  color: string;
  subcategories: string[];
}

export const MARKET_CATEGORIES: CategoryDefinition[] = [
  {
    id: 'fashion',
    name: 'Mode & Accessoires',
    slug: 'mode',
    iconName: 'Shirt',
    color: '#EC4899',
    subcategories: ['Vêtements Homme', 'Vêtements Femme', 'Chaussures', 'Sacs & Valises', 'Bijoux & Montres', 'Enfants & Bébés'],
  },
  {
    id: 'electronics',
    name: 'Électronique & High-Tech',
    slug: 'electronique',
    iconName: 'Smartphone',
    color: '#3B82F6',
    subcategories: ['Téléphones & Smartphones', 'Ordinateurs & PC', 'Téléviseurs & Écrans', 'Accessoires & Câbles', 'Audio & Enceintes', 'Consoles & Jeux'],
  },
  {
    id: 'home',
    name: 'Maison & Jardin',
    slug: 'maison-deco',
    iconName: 'Home',
    color: '#10B981',
    subcategories: ['Mobilier & Salon', 'Électroménager', 'Décoration', 'Cuisine & Vaisselle', 'Bricolage & Outils', 'Linge de maison'],
  },
  {
    id: 'vehicles',
    name: 'Auto & Moto',
    slug: 'vehicules',
    iconName: 'Car',
    color: '#F59E0B',
    subcategories: ['Motos & Scooters', 'Voitures', 'Pièces détachées', 'Casques & Équipements', 'Vélos'],
  },
  {
    id: 'food',
    name: 'Alimentaire & Restauration',
    slug: 'alimentaire',
    iconName: 'UtensilsCrossed',
    color: '#EA580C',
    subcategories: ['Plats cuisinés & Fast-food', 'Épicerie & Vivres frais', 'Pâtisseries & Desserts', 'Boissons & Jus locaux', 'Épices & Condiments'],
  },
  {
    id: 'beauty',
    name: 'Beauté & Cosmétiques',
    slug: 'cosmetiques',
    iconName: 'Sparkles',
    color: '#D946EF',
    subcategories: ['Soins du visage', 'Soins du corps', 'Cheveux & Perruques', 'Maquillage', 'Parfums & Déodorants', 'Hygiène & Bien-être'],
  },
  {
    id: 'sports',
    name: 'Sports & Loisirs',
    slug: 'sports-loisirs',
    iconName: 'Dumbbell',
    color: '#8B5CF6',
    subcategories: ['Maillots & Tenues', 'Chaussures de sport', 'Équipements de fitness', 'Ballons & Accessoires', 'Instruments de musique'],
  },
  {
    id: 'books',
    name: 'Livres & Fournitures',
    slug: 'livres',
    iconName: 'BookOpen',
    color: '#6366F1',
    subcategories: ['Manuels scolaires', 'Romans & Littérature', 'Fournitures de bureau', 'Cahiers & Stylos'],
  },
];

/** États des articles */
export const LISTING_CONDITIONS = [
  { id: 'new', label: 'Neuf (Sous emballage)', shortLabel: 'Neuf' },
  { id: 'like_new', label: 'Très bon état (Comme neuf)', shortLabel: 'Très bon état' },
  { id: 'good', label: 'Bon état (Fonctionne parfaitement)', shortLabel: 'Bon état' },
  { id: 'used', label: 'Usagé (Traces d’usure)', shortLabel: 'Usagé' },
] as const;

/** Types de véhicules supportés pour DaloaDelivery */
export const VEHICLE_TYPES = [
  { id: 'moto', label: 'Moto', iconName: 'Bike', description: 'Le plus rapide pour les courses légères et moyennes' },
  { id: 'velo', label: 'Vélo', iconName: 'Bike', description: 'Pour les livraisons de proximité en centre-ville' },
  { id: 'triporteur', label: 'Triporteur', iconName: 'Truck', description: 'Idéal pour les colis volumineux ou commerces' },
  { id: 'voiture', label: 'Voiture', iconName: 'Car', description: 'Pour les commandes lourdes ou les trajets inter-quartiers' },
] as const;

/** Réseaux Mobile Money acceptés en Côte d'Ivoire (+225) */
export const MOBILE_MONEY_NETWORKS = [
  { id: 'wave', name: 'Wave', color: '#1DC4FF', icon: 'wave' },
  { id: 'orange', name: 'Orange Money', color: '#FF7900', icon: 'orange' },
  { id: 'mtn', name: 'MTN MoMo', color: '#FFCC00', icon: 'mtn' },
  { id: 'moov', name: 'Moov Money', color: '#006699', icon: 'moov' },
] as const;

/**
 * Normalise l'identifiant du réseau de paiement vers le format standardisé en base de données.
 * Exemple: 'wave' -> 'wave-ci', 'orange' -> 'orange-money-ci'.
 */
export const normalizePayoutNetwork = (network?: string): string => {
  const map: Record<string, string> = {
    wave: 'wave-ci',
    'wave-ci': 'wave-ci',
    orange: 'orange-money-ci',
    'orange-money-ci': 'orange-money-ci',
    mtn: 'mtn-ci',
    'mtn-ci': 'mtn-ci',
    moov: 'moov-ci',
    'moov-ci': 'moov-ci',
  };
  return network ? map[network.trim().toLowerCase()] || 'wave-ci' : 'wave-ci';
};

/**
 * Coordonnées de support par défaut (utilisées si non surchargées par variable d'environnement).
 * Pour changer le numéro WhatsApp lors de l'acquisition d'un nouveau numéro professionnel,
 * définissez la variable d'environnement EXPO_PUBLIC_SUPPORT_WHATSAPP ou modifiez cette constante.
 *
 * Le support ne prend pas d'appels : WhatsApp uniquement. C'est pour cela qu'il
 * n'existe volontairement pas de constante de numéro appelable — la remettre
 * ferait réapparaître des liens `tel:` que personne ne décrochera.
 */
export const DEFAULT_SUPPORT_WHATSAPP = '2250704163361';
export const DEFAULT_SUPPORT_EMAIL = 'support@daloamarket.com';

/**
 * Vehicules pour lesquels un permis de conduire est exige a la verification.
 *
 * Le velo en est exclu : il n'exige aucun titre de conduite, et l'imposer
 * ecarterait la majorite des coursiers de Daloa.
 */
export const VEHICLES_REQUIRING_LICENCE = ['Moto', 'Voiture', 'Triporteur'] as const;

/**
 * Identifiant de véhicule (`moto`, `velo`…) quelle que soit l'écriture reçue.
 * La base contient les deux formes : « Moto » (inscription, site) et « moto »
 * (ancienne édition de profil de l'app).
 */
export const normalizeVehicleId = (vehicleType?: string | null): string =>
  (vehicleType || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

/** Libellé enregistré en base (« Moto », « Vélo »…), le même que le site. */
export const vehicleLabel = (vehicleType?: string | null): string =>
  VEHICLE_TYPES.find((v) => v.id === normalizeVehicleId(vehicleType))?.label || (vehicleType || '');

export const requiresDrivingLicence = (vehicleType?: string | null): boolean =>
  VEHICLES_REQUIRING_LICENCE.some((v) => normalizeVehicleId(v) === normalizeVehicleId(vehicleType));
