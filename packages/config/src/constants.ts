/** Coordonnées géographiques centrales de la ville de Daloa, Côte d'Ivoire */
export const DALOA_CENTER = {
  latitude: 6.8773,
  longitude: -6.4502,
  lat: 6.8773,
  lng: -6.4502,
};

/** Rayon de couverture officiel pour Daloa (en kilomètres) */
export const DALOA_GEOFENCE_RADIUS_KM = 18;

/** Distance maximale autorisée pour valider un OTP par GPS (100 mètres) */
export const MAX_OTP_GPS_DISTANCE_METERS = 100;

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
  'Hodjinninkloni',
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
