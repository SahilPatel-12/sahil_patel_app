import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Dimensions,
  Modal,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Share,
  Animated,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Reanimated, { FadeIn, FadeInDown, Layout } from 'react-native-reanimated';
import { useLanguage } from '../context/LanguageContext';
import { safeStorage } from '../services/storage';
import { supabase } from '../services/supabase';
import { requestAstro } from '../services/api';
import { Colors } from '../constants/Colors';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PersonalReminder {
  id: string;
  title: string;
  category: 'birthday' | 'anniversary' | 'puja' | 'sankalp' | 'milestone';
  date: string; // YYYY-MM-DD
  repeat: 'none' | 'yearly' | 'monthly';
  isMuted: boolean;
}

interface Festival {
  id: string;
  title: string;
  desc: string;
  date: string; // MM-DD
  deity?: string;
  asset: any;
}

interface Particle {
  id: string;
  x: number;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: number;
  symbol: string;
}

interface VratHubItem {
  id: string;
  title: string;
  dateStr: string;
  dateKey: string; // YYYY-MM-DD
  deity: 'Shiva' | 'Vishnu' | 'Ganesha' | 'Surya' | 'Durga';
  deityLabel: string;
  type: 'Ekadashi' | 'Pradosh' | 'Chaturthi' | 'Weekly' | 'Navratri';
  importance: 'high' | 'medium' | 'normal';
  oneLiner: string;
  desc: string;
  whyObserve: {
    spiritualImportance: string;
    religiousSignificance: string;
    scripturalReferences: string;
  };
  benefits: {
    mental: string;
    spiritual: string;
    family: string;
    financial: string;
    health: string;
  };
  howToPerform: {
    preparation: string;
    morningRituals: string;
    pujaProcess: string;
    sankalpProcess: string;
    eveningRituals: string;
    completionProcess: string;
  };
  foodGuidelines: {
    allowed: string[];
    restricted: string[];
    method: string;
  };
  mantrasPrayers: {
    mantras: string[];
    aarti: string;
    chantingGuidance: string;
  };
  vratKatha: string;
  pujaTimings: {
    auspicious: string;
    paran: string;
    muhurat: string;
  };
  recommendedPuja: {
    id: string;
    name: string;
    purpose: string;
    price: string;
    duration: string;
    image: any;
    route: string;
  };
  asset: any;
}

const RASHI_LIST = [
  { id: 'aries', name: 'Aries', emoji: '♈' },
  { id: 'taurus', name: 'Taurus', emoji: '♉' },
  { id: 'gemini', name: 'Gemini', emoji: '♊' },
  { id: 'cancer', name: 'Cancer', emoji: '♋' },
  { id: 'leo', name: 'Leo', emoji: '♌' },
  { id: 'virgo', name: 'Virgo', emoji: '♍' },
  { id: 'libra', name: 'Libra', emoji: '♎' },
  { id: 'scorpio', name: 'Scorpio', emoji: '♏' },
  { id: 'sagittarius', name: 'Sagittarius', emoji: '♐' },
  { id: 'capricorn', name: 'Capricorn', emoji: '♑' },
  { id: 'aquarius', name: 'Aquarius', emoji: '♒' },
  { id: 'pisces', name: 'Pisces', emoji: '♓' }
];

interface RashiGuidance {
  rashiId: string;
  rashiName: string;
  rashiVedic: string;
  deity: string;
  puja: {
    name: string;
    purpose: string;
    price: string;
    duration: string;
    image: any;
    route: string;
  };
  pujas: Array<{
    name: string;
    purpose: string;
    price: string;
    duration: string;
    image: any;
    route: string;
  }>;
  mantra: string;
  donation: string;
  activity: string;
  recommendedVratIds: string[];
  kundliExplanation: string;
}

const RASHI_GUIDANCE_DB: Record<string, RashiGuidance> = {
  aries: {
    rashiId: 'aries',
    rashiName: 'Aries',
    rashiVedic: 'मेष',
    deity: 'Lord Hanuman 🛡️',
    pujas: [
      {
        name: 'Maha Hanuman Puja',
        purpose: 'Brings immense courage, protection, physical strength, and planetary pacification.',
        price: '₹1,500',
        duration: '45 mins',
        image: require('../assets/bhagwan/hanuman.png'),
        route: '/all_pujas',
      },
      {
        name: 'Shani Dev Grah Shanti Path',
        purpose: 'Mitigates malefic effects of Shani and balances Mars-Saturn energies.',
        price: '₹1,200',
        duration: '40 mins',
        image: require('../assets/bhagwan/hanuman.png'),
        route: '/all_pujas',
      },
      {
        name: 'Mangal Grah Shanti Homa',
        purpose: 'Pacifies active Mars energies, removes aggression, and clears debt hurdles.',
        price: '₹2,100',
        duration: '60 mins',
        image: require('../assets/bhagwan/shiva.png'),
        route: '/all_pujas',
      }
    ],
    puja: {
      name: 'Maha Hanuman Puja',
      purpose: 'Brings immense courage, protection, physical strength, and planetary pacification.',
      price: '₹1,500',
      duration: '45 mins',
      image: require('../assets/bhagwan/hanuman.png'),
      route: '/all_pujas',
    },
    mantra: 'Om Ham Hanumate Namah (108 times)',
    donation: 'Red lentils (Masoor Dal) or copper utensils on Tuesdays',
    activity: 'Chant Hanuman Chalisa or Sundarkand Path for focus and confidence.',
    recommendedVratIds: ['vrat-2', 'vrat-4', 'vrat-5'],
    kundliExplanation: 'Aries (Mesh) is ruled by Mars (Mangal). Observing Pradosh, Somvar Shiva, or Sunday Surya Dev fasts helps control aggressive energies, build discipline, and pacify planetary heats.',
  },
  taurus: {
    rashiId: 'taurus',
    rashiName: 'Taurus',
    rashiVedic: 'वृषभ',
    deity: 'Goddess Lakshmi 🌸',
    pujas: [
      {
        name: 'Ashta Lakshmi Puja',
        purpose: 'Attracts financial stability, abundance, harmony, and material comforts.',
        price: '₹2,500',
        duration: '60 mins',
        image: require('../assets/bhagwan/lakshmi.png'),
        route: '/all_pujas',
      },
      {
        name: 'Durga Saptashati Path',
        purpose: 'Invokes protective maternal shield of Maa Durga to destroy obstacles.',
        price: '₹1,800',
        duration: '50 mins',
        image: require('../assets/bhagwan/durga.png'),
        route: '/all_pujas',
      },
      {
        name: 'Shukra Grah Shanti Puja',
        purpose: 'Strengthens Venus for artistic growth, domestic luxury, and charm.',
        price: '₹1,600',
        duration: '45 mins',
        image: require('../assets/bhagwan/lakshmi.png'),
        route: '/all_pujas',
      }
    ],
    puja: {
      name: 'Ashta Lakshmi Puja',
      purpose: 'Attracts financial stability, abundance, harmony, and material comforts.',
      price: '₹2,500',
      duration: '60 mins',
      image: require('../assets/bhagwan/lakshmi.png'),
      route: '/all_pujas',
    },
    mantra: 'Om Shreem Hreem Shreem Kamale Kamalaalaye Praseed (108 times)',
    donation: 'White sweets, camphor, or white sandalwood on Fridays',
    activity: 'Recite Kanakadhara Stotram or Shri Sukta for wealth and peace.',
    recommendedVratIds: ['vrat-1', 'vrat-6'],
    kundliExplanation: 'Taurus (Vrishabha) is ruled by Venus (Shukra). Fasting on Ekadashi or Navratri invokes Goddess Durga and Lord Vishnu\'s blessings, attracting material comfort, family peace, and emotional stability.',
  },
  gemini: {
    rashiId: 'gemini',
    rashiName: 'Gemini',
    rashiVedic: 'मिथुन',
    deity: 'Lord Ganesha 🐘',
    pujas: [
      {
        name: 'Ganesha Vignaharta Puja',
        purpose: 'Removes career and business obstacles, grants intellect, and boosts creativity.',
        price: '₹1,200',
        duration: '40 mins',
        image: require('../assets/bhagwan/ganesha.png'),
        route: '/all_pujas',
      },
      {
        name: 'Budh Grah Shanti Puja',
        purpose: 'Calms hyperactive minds, builds logical intelligence and clarity.',
        price: '₹1,500',
        duration: '45 mins',
        image: require('../assets/bhagwan/ganesha.png'),
        route: '/all_pujas',
      },
      {
        name: 'Maha Laxmi Saraswati Puja',
        purpose: 'Combines abundance and wisdom blessings for students and freelancers.',
        price: '₹2,000',
        duration: '50 mins',
        image: require('../assets/bhagwan/lakshmi.png'),
        route: '/all_pujas',
      }
    ],
    puja: {
      name: 'Ganesha Vignaharta Puja',
      purpose: 'Removes career and business obstacles, grants intellect, and boosts creativity.',
      price: '₹1,200',
      duration: '40 mins',
      image: require('../assets/bhagwan/ganesha.png'),
      route: '/all_pujas',
    },
    mantra: 'Om Gan Ganapataye Namah (108 times)',
    donation: 'Green grass (Durva), green vegetables, or green clothing on Wednesdays',
    activity: 'Chant Ganesh Atharvashirsha and feed green grass to cows.',
    recommendedVratIds: ['vrat-3', 'vrat-1'],
    kundliExplanation: 'Gemini (Mithun) is ruled by Mercury (Budha). Fasting on Sankashti Chaturthi or Ekadashi resolves intellectual stress, cleanses communication channels, and brings professional clarity.',
  },
  cancer: {
    rashiId: 'cancer',
    rashiName: 'Cancer',
    rashiVedic: 'कर्क',
    deity: 'Lord Shiva 🔱',
    pujas: [
      {
        name: 'Shravan Rudrabhishek Puja',
        purpose: 'Purifies the mind, balances emotions, removes negativity, and brings health.',
        price: '₹2,100',
        duration: '50 mins',
        image: require('../assets/bhagwan/shiva.png'),
        route: '/all_pujas',
      },
      {
        name: 'Maha Mrityunjaya Jaap',
        purpose: 'Destroys fear, boosts physical longevity and overcomes severe planetary doshas.',
        price: '₹3,500',
        duration: '90 mins',
        image: require('../assets/bhagwan/shiva.png'),
        route: '/all_pujas',
      },
      {
        name: 'Chandra Grah Shanti Puja',
        purpose: 'Calms emotional instabilities and builds peaceful sub-conscious channels.',
        price: '₹1,500',
        duration: '45 mins',
        image: require('../assets/bhagwan/shiva.png'),
        route: '/all_pujas',
      }
    ],
    puja: {
      name: 'Shravan Rudrabhishek Puja',
      purpose: 'Purifies the mind, balances emotions, removes negativity, and brings health.',
      price: '₹2,100',
      duration: '50 mins',
      image: require('../assets/bhagwan/shiva.png'),
      route: '/all_pujas',
    },
    mantra: 'Om Namah Shivaya (108 times)',
    donation: 'Raw milk, rice, white sugar, or silver ornaments on Mondays',
    activity: 'Perform water/milk Abhishek on Shiva Lingam and chant Shiva Tandava Stotram.',
    recommendedVratIds: ['vrat-2', 'vrat-4'],
    kundliExplanation: 'Cancer (Kark) is ruled by the Moon (Chandra). Performing Somvar Shiva Vrats and Pradosh fasts pacifies unstable emotional waves, brings peace of mind, and boosts mental clarity.',
  },
  leo: {
    rashiId: 'leo',
    rashiName: 'Leo',
    rashiVedic: 'सिंह',
    deity: 'Surya Dev ☀️',
    pujas: [
      {
        name: 'Maha Surya Puja',
        purpose: 'Strengthens self-confidence, vitality, honors, career leadership, and prestige.',
        price: '₹1,800',
        duration: '45 mins',
        image: require('../assets/bhagwan/surya.png'),
        route: '/all_pujas',
      },
      {
        name: 'Surya Grah Shanti Homa',
        purpose: 'Balances ego blocks and aligns personal power with solar abundance.',
        price: '₹2,200',
        duration: '50 mins',
        image: require('../assets/bhagwan/surya.png'),
        route: '/all_pujas',
      },
      {
        name: 'Maha Vishnu Puja',
        purpose: 'Stabilizes prestige and brings overall household security and fortune.',
        price: '₹1,600',
        duration: '45 mins',
        image: require('../assets/bhagwan/vishnu.png'),
        route: '/all_pujas',
      }
    ],
    puja: {
      name: 'Maha Surya Puja',
      purpose: 'Strengthens self-confidence, vitality, honors, career leadership, and prestige.',
      price: '₹1,800',
      duration: '45 mins',
      image: require('../assets/bhagwan/surya.png'),
      route: '/all_pujas',
    },
    mantra: 'Om Ghrini Suryaya Namah (108 times)',
    donation: 'Wheat, jaggery, red copper vessels, or red flowers on Sundays',
    activity: 'Offer Arghya (water) to the rising sun and recite Aditya Hridaya Stotram.',
    recommendedVratIds: ['vrat-5'],
    kundliExplanation: 'Leo (Simha) is ruled by the Sun (Surya). Observing Sunday fasts and offering Surya Dev Arghya enhances leadership qualities, builds courage, and boosts physical vitality.',
  },
  virgo: {
    rashiId: 'virgo',
    rashiName: 'Virgo',
    rashiVedic: 'कन्या',
    deity: 'Lord Vishnu 📿',
    pujas: [
      {
        name: 'Maha Vishnu Archana',
        purpose: 'Enhances business success, intellect, communications, and logical reasoning.',
        price: '₹1,600',
        duration: '45 mins',
        image: require('../assets/bhagwan/vishnu.png'),
        route: '/all_pujas',
      },
      {
        name: 'Ganesha Shanti Homa',
        purpose: 'Clears analytical blockages and enhances work focus and details accuracy.',
        price: '₹1,500',
        duration: '40 mins',
        image: require('../assets/bhagwan/ganesha.png'),
        route: '/all_pujas',
      },
      {
        name: 'Budh Grah Shanti Puja',
        purpose: 'Improves communication skills and memory filters.',
        price: '₹1,500',
        duration: '45 mins',
        image: require('../assets/bhagwan/ganesha.png'),
        route: '/all_pujas',
      }
    ],
    puja: {
      name: 'Maha Vishnu Archana',
      purpose: 'Enhances business success, intellect, communications, and logical reasoning.',
      price: '₹1,600',
      duration: '45 mins',
      image: require('../assets/bhagwan/vishnu.png'),
      route: '/all_pujas',
    },
    mantra: 'Om Namo Bhagavate Vasudevaya (108 times)',
    donation: 'Green Moong dal, educational books, or green clothes to the needy',
    activity: 'Recite Vishnu Sahasranama for wisdom and protection.',
    recommendedVratIds: ['vrat-1', 'vrat-3'],
    kundliExplanation: 'Virgo (Kanya) is ruled by Mercury (Budha). Fasting on Ekadashi and Chaturthi helps clear career obstacles, improves detail-oriented memory, and purifies metabolic functions.',
  },
  libra: {
    rashiId: 'libra',
    rashiName: 'Libra',
    rashiVedic: 'तुला',
    deity: 'Goddess Durga 🦁',
    pujas: [
      {
        name: 'Navgrah Shanti Durga Puja',
        purpose: 'Resolves relationship issues, maintains domestic harmony, and invites prosperity.',
        price: '₹2,200',
        duration: '60 mins',
        image: require('../assets/bhagwan/durga.png'),
        route: '/all_pujas',
      },
      {
        name: 'Ashta Lakshmi Puja',
        purpose: 'Draws massive luxury, business expansion, and financial comfort.',
        price: '₹2,500',
        duration: '60 mins',
        image: require('../assets/bhagwan/lakshmi.png'),
        route: '/all_pujas',
      },
      {
        name: 'Shukra Grah Shanti Homa',
        purpose: 'Enhances relationship bonds and balances Venus energies.',
        price: '₹1,600',
        duration: '45 mins',
        image: require('../assets/bhagwan/lakshmi.png'),
        route: '/all_pujas',
      }
    ],
    puja: {
      name: 'Navgrah Shanti Durga Puja',
      purpose: 'Resolves relationship issues, maintains domestic harmony, and invites prosperity.',
      price: '₹2,200',
      duration: '60 mins',
      image: require('../assets/bhagwan/durga.png'),
      route: '/all_pujas',
    },
    mantra: 'Om Dum Durgayei Namaha (108 times)',
    donation: 'Perfumes, cosmetics, white clothes, or curd on Fridays',
    activity: 'Chant Argala Stotram or Mahalakshmi Ashtakam in the evening.',
    recommendedVratIds: ['vrat-6'],
    kundliExplanation: 'Libra (Tula) is ruled by Venus (Shukra). Fasting on Navratri and Friday Pujas balances relationships, attracts aesthetic abundance, and removes professional blocks.',
  },
  scorpio: {
    rashiId: 'scorpio',
    rashiName: 'Scorpio',
    rashiVedic: 'वृश्चिक',
    deity: 'Lord Shiva 🔱',
    pujas: [
      {
        name: 'Mahamrityunjaya Puja',
        purpose: 'Protects against obstacles, chronic health issues, and hidden threats.',
        price: '₹3,500',
        duration: '90 mins',
        image: require('../assets/bhagwan/shiva.png'),
        route: '/all_pujas',
      },
      {
        name: 'Maha Hanuman Puja',
        purpose: 'Destroys planetary fears, boosts physical security and ward off evil eyes.',
        price: '₹1,500',
        duration: '45 mins',
        image: require('../assets/bhagwan/hanuman.png'),
        route: '/all_pujas',
      },
      {
        name: 'Mangal Grah Shanti Homa',
        purpose: 'Pacifies intense Mars energies and balances inner strength and leadership.',
        price: '₹2,100',
        duration: '60 mins',
        image: require('../assets/bhagwan/shiva.png'),
        route: '/all_pujas',
      }
    ],
    puja: {
      name: 'Mahamrityunjaya Puja',
      purpose: 'Protects against obstacles, chronic health issues, and hidden threats.',
      price: '₹3,500',
      duration: '90 mins',
      image: require('../assets/bhagwan/shiva.png'),
      route: '/all_pujas',
    },
    mantra: 'Om Tryambakam Yajamahe Sugandhim Pushtivardhanam... (108 times)',
    donation: 'Red sandalwood, copper vessels, or sweet jaggery preparations',
    activity: 'Recite Mahamrityunjaya Mantra and Hanuman Chalisa for strength.',
    recommendedVratIds: ['vrat-2', 'vrat-4'],
    kundliExplanation: 'Scorpio (Vrishchik) is ruled by Mars (Mangal). Observing Shani Pradosh and Somvar Shiva fasts helps clear hidden obstacles, protects from accidents, and converts anger to spiritual energy.',
  },
  sagittarius: {
    rashiId: 'sagittarius',
    rashiName: 'Sagittarius',
    rashiVedic: 'धनु',
    deity: 'Lord Vishnu 📿',
    pujas: [
      {
        name: 'Satyanarayan Vrat Katha Puja',
        purpose: 'Brings wisdom, academic growth, truthfulness, and overrides general hurdles.',
        price: '₹2,500',
        duration: '75 mins',
        image: require('../assets/bhagwan/vishnu.png'),
        route: '/all_pujas',
      },
      {
        name: 'Maha Vishnu Sahasranama Path',
        purpose: 'Removes deep blocks and clears family paths with Vishnu blessings.',
        price: '₹1,200',
        duration: '45 mins',
        image: require('../assets/bhagwan/vishnu.png'),
        route: '/all_pujas',
      },
      {
        name: 'Guru Grah Shanti Puja',
        purpose: 'Calms Jupiter, boosts moral authority, and grants wealth alignments.',
        price: '₹2,100',
        duration: '60 mins',
        image: require('../assets/bhagwan/vishnu.png'),
        route: '/all_pujas',
      }
    ],
    puja: {
      name: 'Satyanarayan Vrat Katha Puja',
      purpose: 'Brings wisdom, academic growth, truthfulness, and overrides general hurdles.',
      price: '₹2,500',
      duration: '75 mins',
      image: require('../assets/bhagwan/vishnu.png'),
      route: '/all_pujas',
    },
    mantra: 'Om Namo Narayanaya (108 times)',
    donation: 'Yellow sweets, bananas, saffron, or chana dal on Thursdays',
    activity: 'Worship the banana tree, feed yellow food to birds, and seek Guru blessings.',
    recommendedVratIds: ['vrat-1'],
    kundliExplanation: 'Sagittarius (Dhanu) is ruled by Jupiter (Guru). Observing the sacred Ekadashi fasts unlocks spiritual growth, boosts higher academic success, and builds moral wisdom.',
  },
  capricorn: {
    rashiId: 'capricorn',
    rashiName: 'Capricorn',
    rashiVedic: 'मकर',
    deity: 'Shani Dev / Lord Hanuman 🛡️',
    pujas: [
      {
        name: 'Shani Shanti Graha Puja',
        purpose: 'Mitigates Shani Sade Sati malefic cycles, brings discipline and delay neutralizations.',
        price: '₹3,000',
        duration: '60 mins',
        image: require('../assets/bhagwan/hanuman.png'),
        route: '/all_pujas',
      },
      {
        name: 'Maha Hanuman Puja',
        purpose: 'Wards off karmic obstructions and builds focus, strength, and courage.',
        price: '₹1,500',
        duration: '45 mins',
        image: require('../assets/bhagwan/hanuman.png'),
        route: '/all_pujas',
      },
      {
        name: 'Shani Dev Tailabhishek Path',
        purpose: 'Offers oil to Shani Dev shrine to neutralize dynamic planetary heat.',
        price: '₹1,200',
        duration: '40 mins',
        image: require('../assets/bhagwan/hanuman.png'),
        route: '/all_pujas',
      }
    ],
    puja: {
      name: 'Shani Shanti Graha Puja',
      purpose: 'Mitigates Shani Sade Sati malefic cycles, brings discipline and delay neutralizations.',
      price: '₹3,000',
      duration: '60 mins',
      image: require('../assets/bhagwan/hanuman.png'),
      route: '/all_pujas',
    },
    mantra: 'Om Sham Shanicharaya Namah (108 times)',
    donation: 'Black sesame seeds, mustard oil, black blankets, or iron pans on Saturdays',
    activity: 'Light a mustard oil lamp under a Peepal tree and chant Shani Chalisa.',
    recommendedVratIds: ['vrat-2', 'vrat-4'],
    kundliExplanation: 'Capricorn (Makar) is ruled by Saturn (Shani). Observing Shiva Pradosh and Monday fasts mitigates Saturn\'s harsh karmic phases, increases patience, and brings career stability.',
  },
  aquarius: {
    rashiId: 'aquarius',
    rashiName: 'Aquarius',
    rashiVedic: 'कुंभ',
    deity: 'Lord Shiva 🔱',
    pujas: [
      {
        name: 'Maha Shiva Puja & Abhishek',
        purpose: 'Enhances career growth, spiritual inclination, and clears karmic obstructions.',
        price: '₹2,100',
        duration: '50 mins',
        image: require('../assets/bhagwan/shiva.png'),
        route: '/all_pujas',
      },
      {
        name: 'Maha Hanuman Puja',
        purpose: 'Neutralizes severe planetary limitations and helps in swift business clearance.',
        price: '₹1,500',
        duration: '45 mins',
        image: require('../assets/bhagwan/hanuman.png'),
        route: '/all_pujas',
      },
      {
        name: 'Shani Grah Shanti Path',
        purpose: 'Mitigates Saturn\'s heavy transit phases and restores structural flow.',
        price: '₹1,200',
        duration: '40 mins',
        image: require('../assets/bhagwan/hanuman.png'),
        route: '/all_pujas',
      }
    ],
    puja: {
      name: 'Maha Shiva Puja & Abhishek',
      purpose: 'Enhances career growth, spiritual inclination, and clears karmic obstructions.',
      price: '₹2,100',
      duration: '50 mins',
      image: require('../assets/bhagwan/shiva.png'),
      route: '/all_pujas',
    },
    mantra: 'Om Sham Shanicharaya Namah (108 times)',
    donation: 'Charcoal, black blankets, or blue clothing on Saturdays',
    activity: 'Chant Shiva Tandava Stotram and perform social charity/community service.',
    recommendedVratIds: ['vrat-2', 'vrat-4'],
    kundliExplanation: 'Aquarius (Kumbha) is ruled by Saturn (Shani). Observing Somvar Shiva and Pradosh Vrats dissolves karmic blockages, attracts group alignment, and brings spiritual release.',
  },
  pisces: {
    rashiId: 'pisces',
    rashiName: 'Pisces',
    rashiVedic: 'मीन',
    deity: 'Lord Vishnu 📿',
    pujas: [
      {
        name: 'Vishnu Sahasranama Havan',
        purpose: 'Grants extreme peace of mind, high intelligence, spiritual release, and wealth.',
        price: '₹2,800',
        duration: '80 mins',
        image: require('../assets/bhagwan/vishnu.png'),
        route: '/all_pujas',
      },
      {
        name: 'Satyanarayan Vrat Katha Puja',
        purpose: 'Cleanses positive aura at home and draws peaceful financial channels.',
        price: '₹1,800',
        duration: '50 mins',
        image: require('../assets/bhagwan/vishnu.png'),
        route: '/all_pujas',
      },
      {
        name: 'Guru Grah Shanti Homa',
        purpose: 'Draws blessing of divine wisdom, good fortune, and academic heights.',
        price: '₹2,100',
        duration: '60 mins',
        image: require('../assets/bhagwan/vishnu.png'),
        route: '/all_pujas',
      }
    ],
    puja: {
      name: 'Vishnu Sahasranama Havan',
      purpose: 'Grants extreme peace of mind, high intelligence, spiritual release, and wealth.',
      price: '₹2,800',
      duration: '80 mins',
      image: require('../assets/bhagwan/vishnu.png'),
      route: '/all_pujas',
    },
    mantra: 'Om Namo Bhagavate Vasudevaya (108 times)',
    donation: 'Yellow clothes, turmeric, raw honey, or study scriptures to students',
    activity: 'Read Narayana Upanishad or Bhagavad Gita chapters daily.',
    recommendedVratIds: ['vrat-1'],
    kundliExplanation: 'Pisces (Meen) is ruled by Jupiter (Guru). Observing the Ekadashi fast invokes Lord Vishnu\'s deep peace, aligns wisdom, and provides mental tranquility.',
  },
};

const CATEGORIES = [
  { key: 'puja', label: 'Puja 📿', color: '#ff7a00' },
  { key: 'sankalp', label: 'Sankalp 🧘', color: '#8b5cf6' },
  { key: 'birthday', label: 'Birthday 🎂', color: '#3b82f6' },
  { key: 'anniversary', label: 'Anniversary 💍', color: '#ec4899' },
  { key: 'milestone', label: 'Milestone 🏆', color: '#10b981' },
];

const UPCOMING_FESTIVALS: Festival[] = [
  { id: 'f-1', title: 'Makar Sankranti', desc: 'Harvest festival dedicated to the sun god Surya.', date: '01-14', deity: 'Surya', asset: require('../assets/bhagwan/surya.png') },
  { id: 'f-2', title: 'Maha Shivaratri', desc: 'The Great Night of Lord Shiva celebrating his cosmic dance.', date: '02-15', deity: 'Shiva', asset: require('../assets/bhagwan/shiva.png') },
  { id: 'f-3', title: 'Holi', desc: 'Festival of colors representing the victory of good over evil.', date: '03-03', deity: 'Krishna', asset: require('../assets/bhagwan/krishna.png') },
  { id: 'f-4', title: 'Rama Navami', desc: 'The birth anniversary of Lord Rama, the seventh avatar of Lord Vishnu.', date: '03-27', deity: 'Rama', asset: require('../assets/bhagwan/rama.png') },
  { id: 'f-5', title: 'Hanuman Jayanti', desc: 'The birth celebration of Lord Hanuman, the supreme devotee of Lord Rama.', date: '04-11', deity: 'Hanuman', asset: require('../assets/bhagwan/hanuman.png') },
  { id: 'f-6', title: 'Krishna Janmashtami', desc: 'The birth of Lord Krishna, the eighth avatar of Lord Vishnu.', date: '08-15', deity: 'Krishna', asset: require('../assets/bhagwan/krishna.png') },
  { id: 'f-7', title: 'Ganesh Chaturthi', desc: 'Celebration of the arrival of Lord Ganesha from Kailash to Earth.', date: '09-17', deity: 'Ganesha', asset: require('../assets/bhagwan/ganesha.png') },
  { id: 'f-8', title: 'Diwali', desc: 'Festival of lights marking Lord Rama\'s triumphant return to Ayodhya.', date: '11-09', deity: 'Lakshmi', asset: require('../assets/bhagwan/lakshmi.png') },
];

const FESTIVALS_DATABASE: Record<string, { title: string; desc: string; deity?: string; asset?: any }[]> = {
  '00-14': [{ title: 'Makar Sankranti', desc: 'Harvest festival dedicated to the sun god Surya.', deity: 'Surya', asset: require('../assets/bhagwan/surya.png') }],
  '01-15': [{ title: 'Maha Shivaratri', desc: 'The Great Night of Lord Shiva celebrating his cosmic dance.', deity: 'Shiva', asset: require('../assets/bhagwan/shiva.png') }],
  '02-03': [{ title: 'Holi', desc: 'Festival of colors representing the victory of good over evil.', deity: 'Krishna', asset: require('../assets/bhagwan/krishna.png') }],
  '02-27': [{ title: 'Rama Navami', desc: 'The birth anniversary of Lord Rama, the seventh avatar of Lord Vishnu.', deity: 'Rama', asset: require('../assets/bhagwan/rama.png') }],
  '03-11': [{ title: 'Hanuman Jayanti', desc: 'The birth celebration of Lord Hanuman, the supreme devotee of Lord Rama.', deity: 'Hanuman', asset: require('../assets/bhagwan/hanuman.png') }],
  '05-11': [{ title: 'Ganga Dussehra', desc: 'The descent of the holy river Ganga from heaven to earth.', deity: 'Shiva', asset: require('../assets/bhagwan/shiv.png') }],
  '05-16': [{ title: 'Nirjala Ekadashi', desc: 'An absolute waterless fast to attain the benefits of all 24 Ekadashis.', deity: 'Vishnu', asset: require('../assets/bhagwan/vishnu.png') }],
  '06-09': [{ title: 'Guru Purnima', desc: 'Day to honor spiritual and academic gurus.', deity: 'Brahma', asset: require('../assets/bhagwan/brahma.png') }],
  '07-15': [{ title: 'Krishna Janmashtami', desc: 'The birth of Lord Krishna, the eighth avatar of Lord Vishnu.', deity: 'Krishna', asset: require('../assets/bhagwan/krishna.png') }],
  '07-28': [{ title: 'Raksha Bandhan', desc: 'Celebrating the sacred bond between brothers and sisters.', deity: 'Vishnu', asset: require('../assets/bhagwan/vishnu.png') }],
  '08-17': [{ title: 'Ganesh Chaturthi', desc: 'Celebration of the arrival of Lord Ganesha from Kailash to Earth.', deity: 'Ganesha', asset: require('../assets/bhagwan/ganesha.png') }],
  '09-20': [{ title: 'Dussehra', desc: 'Victory of Lord Rama over Ravana, celebrating triumph of good over evil.', deity: 'Rama', asset: require('../assets/bhagwan/rama.png') }],
  '09-12': [{ title: 'Durga Puja Begins', desc: 'Welcoming Goddess Durga in her fierce and protective forms.', deity: 'Durga', asset: require('../assets/bhagwan/durga.png') }],
  '10-07': [{ title: 'Dhanteras', desc: 'First day of Diwali celebrating wealth, health, and Dhanvantari.', deity: 'Lakshmi', asset: require('../assets/bhagwan/lakshmi.png') }],
  '10-09': [{ title: 'Diwali', desc: 'Festival of lights marking Lord Rama\'s triumphant return to Ayodhya.', deity: 'Lakshmi', asset: require('../assets/bhagwan/lakshmi.png') }],
  '11-20': [{ title: 'Gita Jayanti', desc: 'The advent of the holy Bhagavad Gita spoken by Lord Krishna.', deity: 'Krishna', asset: require('../assets/bhagwan/krishna.png') }],
};

const VRAT_HUB_DATA: VratHubItem[] = [
  {
    id: 'vrat-1',
    title: 'Nirjala Ekadashi Vrat',
    dateStr: 'June 16, 2026',
    dateKey: '2026-06-16',
    deity: 'Vishnu',
    deityLabel: 'Lord Vishnu',
    type: 'Ekadashi',
    importance: 'high',
    oneLiner: 'The most sacred waterless fast of the year to attain the benefits of all 24 Ekadashis.',
    desc: 'Observed during the Shukla Paksha of Jyeshtha month, Nirjala Ekadashi is the most severe and rewarding of all Ekadashis. It is observed without drinking any water or eating food for a full 24-hour cycle.',
    whyObserve: {
      spiritualImportance: 'Observed to seek ultimate spiritual purification and complete alignment with cosmic energies. It is considered the peak of self-control over bodily desires.',
      religiousSignificance: 'Grants the same spiritual merit (punya) as observing all 24 Ekadashis of the year, purifying past negative karma.',
      scripturalReferences: 'Mentioned in the Mahabharata (Vyasa-Bhimsen dialogue) and Padma Purana.'
    },
    benefits: {
      mental: 'Improves concentration, develops self-discipline, and helps control negative thoughts.',
      spiritual: 'Establishes a deep connection with Lord Vishnu, elevating the devotee\'s spiritual consciousness.',
      family: 'Spreads positive vibes at home, resolving conflicts and promoting harmony among members.',
      financial: 'Invokes the blessings of Goddess Lakshmi (consort of Vishnu) for wealth and financial stability.',
      health: 'Detoxifies the digestive tract, resets metabolic processes, and strengthens cellular regeneration.'
    },
    howToPerform: {
      preparation: 'Clean the house and set up the puja altar on the day before (Dashami). Devotees consume only satvik meals on Dashami.',
      morningRituals: 'Wake up during Brahma Muhurta, take a purifying bath, wear clean yellow attire, and light a pure cow-ghee lamp.',
      pujaProcess: 'Perform Abhishek of Lord Vishnu\'s idol using Panchamrit and Ganga water. Offer yellow flowers, tulsi leaves, and sweet fruit prasad.',
      sankalpProcess: 'Hold some water and yellow flowers in your right hand, recite your name and intention to fast without water, and offer it to the Lord.',
      eveningRituals: 'Perform evening aarti, light incense, sing Vishnu bhajans, and recite the Vishnu Sahasranama.',
      completionProcess: 'Maintain the waterless vigil overnight. Break the fast (Parana) on Dwadashi morning by offering water and grains to a Brahmin or deity first.'
    },
    foodGuidelines: {
      allowed: ['Water and food are strictly disallowed during fasting hours.', 'On Dwadashi morning: break the fast (Parana) with water, sweet fruits, and simple satvik grains.'],
      restricted: ['Wheat, rice, pulses, salt, onions, garlic, and non-satvik ingredients.'],
      method: 'Strict Nirjala (complete waterless and grainless fasting) for 24 hours from sunrise of Ekadashi to sunrise of Dwadashi.'
    },
    mantrasPrayers: {
      mantras: ['Om Namo Bhagavate Vasudevaya', 'Om Vishnave Namah', 'Hare Krishna Hare Krishna Krishna Krishna Hare Hare'],
      aarti: 'Om Jai Jagadish Hare Aarti',
      chantingGuidance: 'Chant the mantras using a Tulsi mala, facing east, preferably in quiet morning hours.'
    },
    vratKatha: 'Bhimsen, the second Pandava brother, had a huge appetite and could not observe bimonthly Ekadashi fasts, which grieved him. He approached Maharishi Vyasa for a solution. Sage Vyasa advised him to fast strictly on Jyeshtha Shukla Ekadashi without water. Bhimsen observed the fast and fainted, but attained the entire fruits of all Ekadashis. Thus it is also called Pandava Ekadashi.',
    pujaTimings: {
      auspicious: 'Brahma Muhurta (04:15 AM - 05:00 AM)',
      paran: '06:12 AM - 08:30 AM (on June 17, Dwadashi)',
      muhurat: 'Ekadashi Puja Muhurat: 07:15 AM - 09:30 AM'
    },
    recommendedPuja: {
      id: 'vishnu-puja',
      name: 'Maha Vishnu Puja & Archana',
      purpose: 'Brings peace, destroys bad karma, and grants ultimate liberation (Moksha).',
      price: '₹2,100',
      duration: '60 mins',
      image: require('../assets/bhagwan/vishnu.png'),
      route: '/all_pujas'
    },
    asset: require('../assets/bhagwan/vishnu.png')
  },
  {
    id: 'vrat-2',
    title: 'Shani Pradosh Vrat',
    dateStr: 'June 13, 2026',
    dateKey: '2026-06-13',
    deity: 'Shiva',
    deityLabel: 'Lord Shiva',
    type: 'Pradosh',
    importance: 'high',
    oneLiner: 'An auspicious bimonthly fast dedicated to Lord Shiva to seek blessings of health and fortune.',
    desc: 'Falls on the Trayodashi tithi of lunar fortnight. When Trayodashi falls on a Saturday, it is celebrated as Shani Pradosh, particularly powerful for neutralizing Saturn\'s malefic placements (Shani Dosh).',
    whyObserve: {
      spiritualImportance: 'Observed to seek Lord Shiva\'s divine grace during the auspicious twilight window, merging absolute devotion with karmic corrections.',
      religiousSignificance: 'Particularly powerful on Saturday (Shani Pradosh) to pacify the malefic transit effects of Saturn (Sade Sati, Dhaiya).',
      scripturalReferences: 'Described in the Shiva Purana and Skanda Purana.'
    },
    benefits: {
      mental: 'Alleviates mental stress, anxiety, and fear of sudden obstacles.',
      spiritual: 'Invokes the deep presence of Shiva, dissolving blockages and advancing spiritual insights.',
      family: 'Heals familial relations, restores trust, and eliminates ancestral blockages.',
      financial: 'Clears long-standing debts, restores business flow, and guarantees career growth.',
      health: 'Aids in curing chronic ailments and shields the devotee from severe accidents.'
    },
    howToPerform: {
      preparation: 'Keep a clean satvik state from morning, preparing the ingredients for evening Shiva puja.',
      morningRituals: 'Take a bath at sunrise, offer water to the sun, and sit in silent meditation.',
      pujaProcess: 'During twilight (Pradosh Kaal), bathe the Shiva Lingam with milk, honey, yogurt, ghee, and water. Offer Bilva leaves and white sandalwood.',
      sankalpProcess: 'Hold raw rice grains and water, commit to fasting sincerely for Shiva, and release the water before the Shiva Lingam.',
      eveningRituals: 'Perform evening Shiva Aarti, light mustard oil lamps, and recite the Pradosh Vrat Katha.',
      completionProcess: 'Offer sweet milk or fruit prasad to Shiva, then break your fast with satvik fruit meals after sunset.'
    },
    foodGuidelines: {
      allowed: ['Raw milk, yogurt, sendha salt, sweet fruits, potatoes, and sago (sabudana).'],
      restricted: ['Grains, wheat, table salt, red chilies, onion, garlic, and non-satvik ingredients.'],
      method: 'Partial fast during the day with one satvik meal in the evening after twilight prayers.'
    },
    mantrasPrayers: {
      mantras: ['Om Namah Shivaya', 'Om Tryambakam Yajamahe...', 'Maha Mrityunjaya Mantra'],
      aarti: 'Shiva Aarti (Om Jai Shiv Omkara)',
      chantingGuidance: 'Chant using a Rudraksha mala, facing north or east, during the twilight Pradosh Kaal.'
    },
    vratKatha: 'A poor widow and her son lived on alms. One day she met a prince whose kingdom was taken away by enemies. On the advice of Sage Sandilya, the widow and prince observed Shani Pradosh Vrat. Pleased with their devotion, Shiva blessed the prince, who married a celestial maiden and regained his father\'s empire. The widow\'s poverty was eradicated forever.',
    pujaTimings: {
      auspicious: 'Pradosh Kaal (06:42 PM - 08:15 PM)',
      paran: 'Post sunset, after performing Shiva Aarti',
      muhurat: 'Shiva Puja: 06:45 PM - 08:00 PM'
    },
    recommendedPuja: {
      id: 'rudrabhishek',
      name: 'Shravan Rudrabhishek Puja',
      purpose: 'Neutralizes Saturn doshas, heals chronic illnesses, and brings home peace.',
      price: '₹3,500',
      duration: '90 mins',
      image: require('../assets/bhagwan/shiva.png'),
      route: '/all_pujas'
    },
    asset: require('../assets/bhagwan/shiva.png')
  },
  {
    id: 'vrat-3',
    title: 'Sankashti Chaturthi Vrat',
    dateStr: 'July 3, 2026',
    dateKey: '2026-07-03',
    deity: 'Ganesha',
    deityLabel: 'Lord Ganesha',
    type: 'Chaturthi',
    importance: 'medium',
    oneLiner: 'A monthly fasting day dedicated to Lord Ganesha to remove obstacles and seek wisdom.',
    desc: 'Observed on the fourth day (Chaturthi) of the waning phase of the moon (Krishna Paksha). Devotees observe partial or full fasts to remove all obstacles from their paths.',
    whyObserve: {
      spiritualImportance: 'Observed to worship Lord Ganesha, the lord of wisdom, to overcome any severe life blocks and invoke steady progress.',
      religiousSignificance: 'Falls on the fourth day of the waning moon phase. Sighting the moon is a mandatory part of the ritual.',
      scripturalReferences: 'Lauded in the Ganesha Purana and Mudgala Purana.'
    },
    benefits: {
      mental: 'Sharpens intellect, enhances clarity in decision-making, and brings peace.',
      spiritual: 'Aligns the devotee\'s mind with Ganesha\'s energy of focus and grounding.',
      family: 'Ensures educational growth of children and protects the household from evil eyes.',
      financial: 'Resolves business losses, invites new carrier paths, and ensures steady growth.',
      health: 'Reduces nervous disorders and helps maintain balanced hormonal levels.'
    },
    howToPerform: {
      preparation: 'Place Ganesha\'s idol on a clean yellow cloth in your altar, and buy fresh Durva grass.',
      morningRituals: 'Clean the altar, perform basic panchopchar puja of Lord Ganesha, and offer red hibiscus flowers.',
      pujaProcess: 'Bath the idol with water and milk, apply red vermillion (sindoor), and offer 21 modaks or laddoos.',
      sankalpProcess: 'Mentally seek Ganesha\'s help to clear obstacles, resolving to fast until sighting the moon.',
      eveningRituals: 'Perform Ganesha aarti, read the Sankashti Katha, and wait for moonrise.',
      completionProcess: 'Once the moon rises, offer water (Arghya) and flowers to the Moon God, then break the fast with Ganesha prasad.'
    },
    foodGuidelines: {
      allowed: ['Singhara (water chestnut) flour, peanuts, sabudana, milk, yogurt, and rock salt.'],
      restricted: ['Normal grains, rice, lentils, table salt, onion, garlic, and lentils.'],
      method: 'Strict fast from sunrise to moonrise, breaking only after offering Arghya to the moon.'
    },
    mantrasPrayers: {
      mantras: ['Om Gan Ganapataye Namah', 'Vakratunda Mahakaya...', 'Sankata Nashana Ganesha Stotra'],
      aarti: 'Jai Ganesh Jai Ganesh Deva Aarti',
      chantingGuidance: 'Chant while sitting facing north, holding a crystal or rudraksha rosary.'
    },
    vratKatha: 'In ancient times, a king named Shurasena had an dry kingdom. Lord Indra told him that the dry river would flow again if the citizens observed Sankashti Chaturthi. The king and his subjects performed the fast with total devotion, Ganesha was pleased, and the kingdom was blessed with abundant water, rain, and bumper crops.',
    pujaTimings: {
      auspicious: 'Evening Moonrise (around 09:42 PM)',
      paran: 'Immediately post Moon Arghya',
      muhurat: 'Ganesha Puja: 06:30 PM - 08:00 PM'
    },
    recommendedPuja: {
      id: 'ganesha-puja',
      name: 'Ganesha Vignaharta Puja',
      purpose: 'Removes hurdles in new jobs, business startups, or marriages.',
      price: '₹1,500',
      duration: '45 mins',
      image: require('../assets/bhagwan/ganesha.png'),
      route: '/all_pujas'
    },
    asset: require('../assets/bhagwan/ganesha.png')
  },
  {
    id: 'vrat-4',
    title: 'Somvar Shiva Vrat',
    dateStr: 'June 15, 2026',
    dateKey: '2026-06-15',
    deity: 'Shiva',
    deityLabel: 'Lord Shiva',
    type: 'Weekly',
    importance: 'normal',
    oneLiner: 'Weekly devotional fast to seek Lord Shiva\'s blessings for family peace and ideal life partner.',
    desc: 'Mondays (Somvar) are traditionally dedicated to Lord Shiva. Devotees perform fasts to gain mental clarity, emotional balance, and marriage blessings.',
    whyObserve: {
      spiritualImportance: 'Observed weekly to honor Lord Shiva and express absolute devotion, seeking peace, mental composure, and stability.',
      religiousSignificance: 'Somvar (Monday) is ruled by the Moon. Fasting helps control the mind and balances emotional highs and lows.',
      scripturalReferences: 'Explained in the Shiva Purana.'
    },
    benefits: {
      mental: 'Calms the mind, controls anxiety, and relieves mental confusion.',
      spiritual: 'Strengthens devotion (bhakti) and awakens inner spiritual light.',
      family: 'Brings happiness in marital life and helps single devotees find an ideal partner.',
      financial: 'Brings general stability in business and career, preventing financial losses.',
      health: 'Enhances skin health, physical aura, and balances water elements in the body.'
    },
    howToPerform: {
      preparation: 'Clean the home temple on Sunday night. Keep milk and bilva leaves ready.',
      morningRituals: 'Take an early bath, visit a Shiva temple, and perform Abhishek with raw milk.',
      pujaProcess: 'Apply sandalwood paste to the Shiva Lingam. Offer five Bilva leaves, datura, and white flowers.',
      sankalpProcess: 'Hold some water in your hand and pray to Shiva for family peace and marriage blessings.',
      eveningRituals: 'Light a ghee lamp in the evening, read Solah Somvar Katha, and offer aarti.',
      completionProcess: 'Break the fast after sunset with a simple, salt-less satvik meal (sweet halwa or fruits).'
    },
    foodGuidelines: {
      allowed: ['Raw milk, sweets made of milk, fruits, dates, and non-salty preparations.'],
      restricted: ['Salt, grains, lentils, red spices, sour foods, onion, garlic, and non-veg.'],
      method: 'Fasting during the day, consuming only one salt-less satvik meal after evening prayers.'
    },
    mantrasPrayers: {
      mantras: ['Om Namah Shivaya', 'Om Namo Bhagavate Rudraya', 'Shiva Panchakshara Stotra'],
      aarti: 'Shiva Aarti (Om Jai Shiv Omkara)',
      chantingGuidance: 'Chant while sitting in a meditative posture, facing east, preferably at sunrise.'
    },
    vratKatha: 'A wealthy merchant had no son. Through constant Somvar fasts, Shiva blessed him with a son, though the son had a short lifespan. At age 12, the son died in Kashi, but because the merchant\'s wife strictly observed Solah Somvar Vrats, Lord Shiva and Parvati revived the boy. The merchant and his family lived in joy and prosperity.',
    pujaTimings: {
      auspicious: 'Morning (06:00 AM - 08:30 AM)',
      paran: 'After sunset evening prayers (around 06:30 PM)',
      muhurat: 'Shiva Temple Abhishek: 06:15 AM - 08:00 AM'
    },
    recommendedPuja: {
      id: 'shiva-vivah',
      name: 'Shiv Parvati Vivah Puja',
      purpose: 'Resolves delays in marriage and brings deep domestic harmony.',
      price: '₹2,500',
      duration: '60 mins',
      image: require('../assets/bhagwan/shiv.png'),
      route: '/all_pujas'
    },
    asset: require('../assets/bhagwan/shiv.png')
  },
  {
    id: 'vrat-5',
    title: 'Surya Dev Vrat',
    dateStr: 'June 14, 2026',
    dateKey: '2026-06-14',
    deity: 'Surya',
    deityLabel: 'Surya Dev',
    type: 'Weekly',
    importance: 'normal',
    oneLiner: 'Weekly Sunday fast dedicated to Surya Dev to invoke vital energy, health, and career success.',
    desc: 'Sunday is ruled by the Sun God (Surya Dev). Fasting on this day is recommended to strengthen the Sun\'s placement in the birth chart and acquire leadership blessings.',
    whyObserve: {
      spiritualImportance: 'Observed on Sundays to worship Surya Dev, the visible god who drives life on Earth, seeking vital energy and career growth.',
      religiousSignificance: 'Sunday is ruled by the Sun. Fasting strengthens the Sun\'s placement in the natal chart, bringing honors.',
      scripturalReferences: 'Bhavishya Purana and Rig Veda solar hymns.'
    },
    benefits: {
      mental: 'Boosts confidence, self-esteem, willpower, and logical clarity.',
      spiritual: 'Grants inner illumination, cleansing the aura of dullness and stagnation.',
      family: 'Improves relations with father, authority figures, and society.',
      financial: 'Attracts administrative promotions, honors, government recognition, and wealth.',
      health: 'Improves eyesight, skin condition, bone strength, and cardiovascular health.'
    },
    howToPerform: {
      preparation: 'Keep a copper lota clean. Gather red flowers and red sandalwood powder.',
      morningRituals: 'Wake up before sunrise. Offer Arghya (water) to the rising sun, looking through the water stream.',
      pujaProcess: 'Perform puja of Surya Dev image with red sandalwood, red flowers, and wheat-based sweets.',
      sankalpProcess: 'Pour water from a copper vessel to the ground, committing to fast for career growth and health.',
      eveningRituals: 'Offer evening prayers, recite Aditya Hridaya Stotram, and perform solar aarti.',
      completionProcess: 'Break the fast before sunset by consuming a single saltless, sweet meal (like wheat halwa).'
    },
    foodGuidelines: {
      allowed: ['Wheat-based sweet dishes (halwa, roti), milk, sugar, and sweet fruits.'],
      restricted: ['Salt (strictly prohibited), spices, oil, onion, garlic, and sour dishes.'],
      method: 'Strict saltless fast, consuming only one sweet meal before sunset.'
    },
    mantrasPrayers: {
      mantras: ['Om Ghrini Suryaya Namah', 'Om Bhaskaraya Namah', 'Aditya Hridaya Stotram'],
      aarti: 'Surya Dev Aarti',
      chantingGuidance: 'Chant while standing facing east, during the first hour of sunrise.'
    },
    vratKatha: 'An old woman regularly performed Sunday fasts. Impressed by her devotion, Surya Dev gifted her a cow that dunged gold. A greedy village head stole the cow. The next day, the village head\'s house was filled with smoke and fire, while the woman\'s yard remained bright. Realizing his sin, the chief returned the cow, and the villagers understood the power of Sunday fasts.',
    pujaTimings: {
      auspicious: 'Sunrise Arghya (05:32 AM - 06:15 AM)',
      paran: 'Before sunset (around 05:45 PM)',
      muhurat: 'Sun Puja: 06:00 AM - 07:30 AM'
    },
    recommendedPuja: {
      id: 'surya-shanti',
      name: 'Surya Grah Shanti Puja',
      purpose: 'Heals weak solar alignments in Kundli, bringing health and career glory.',
      price: '₹1,800',
      duration: '50 mins',
      image: require('../assets/bhagwan/surya.png'),
      route: '/all_pujas'
    },
    asset: require('../assets/bhagwan/surya.png')
  },
  {
    id: 'vrat-6',
    title: 'Maha Navratri Vrat',
    dateStr: 'October 12, 2026',
    dateKey: '2026-10-12',
    deity: 'Durga',
    deityLabel: 'Goddess Durga',
    type: 'Navratri',
    importance: 'high',
    oneLiner: 'A sacred 9-night fast celebrating the triumph of Goddess Durga over Mahishasura.',
    desc: 'Observed twice a year during the changing of seasons, Navratri is dedicated to the worship of the nine forms of Shakti (Navadurga). It involves extensive fasting, chanting, and night prayers.',
    whyObserve: {
      spiritualImportance: 'Observed to invoke the divine feminine energy (Shakti) within ourselves, purifying the consciousness and destroying inner demons like anger, greed, and ego.',
      religiousSignificance: 'Celebrates the cosmic victory of Goddess Durga over the demon Mahishasura, symbolizing the ultimate triumph of dharma over adharma.',
      scripturalReferences: 'Elaborated in the Devi Mahatmya (Durga Saptashati) and Markandeya Purana.'
    },
    benefits: {
      mental: 'Brings clarity, eliminates deep-seated fears, and instills absolute courage.',
      spiritual: 'Awakens the Kundalini energy, aligns the chakras, and invites cosmic grace.',
      family: 'Protects children and spouses from evil energies, ensuring prosperity and safety.',
      financial: 'Paves the way for sudden wealth, business expansions, and clearance of litigation hurdles.',
      health: 'Reboots the entire metabolic system through satvik dietary detox.'
    },
    howToPerform: {
      preparation: 'Perform Ghatasthapana (sowing barley seeds in a clay pot) in your altar on the first day.',
      morningRituals: 'Take a bath, light a perpetual lamp (Akhand Jyoti), and perform Durga Puja.',
      pujaProcess: 'Read chapters of Durga Saptashati daily. Offer red chunri, coconut, and vermillion to the Goddess.',
      sankalpProcess: 'Make a 9-day sankalp holding water, dry fruits, and money, choosing your fasting method (water only, fruits only, or one meal).',
      eveningRituals: 'Sing Devi Durga Aarti, perform standard Homa (fire ritual) if possible, and attend night kirtans.',
      completionProcess: 'Perform Kanya Puja on Ashtami or Navami by feeding nine young girls, offering them gifts, and breaking the fast on Dashami.'
    },
    foodGuidelines: {
      allowed: ['Kuttu (buckwheat) flour, Singhara flour, sabudana, sendha salt, milk, yogurt, and fresh fruits.'],
      restricted: ['Wheat, rice, onion, garlic, table salt, pulses, spices, and non-satvik ingredients.'],
      method: '9-day continuous satvik fast, consuming either water, fruits, or a single grainless meal after sunset.'
    },
    mantrasPrayers: {
      mantras: ['Om Dum Durgayei Namaha', 'Ya Devi Sarvabhuteshu Shakthi Roopena Samsthitha...', 'Navarna Mantra'],
      aarti: 'Ambe Tu Hai Jagdambe Kali Aarti',
      chantingGuidance: 'Chant daily 108 times using a red coral (Moonga) or rudraksha rosary.'
    },
    vratKatha: 'The demon Mahishasura obtained a boon that no man or god could kill him. He terrorized the three worlds. The gods merged their divine energies to create Goddess Durga. Equipped with celestial weapons, the Goddess fought Mahishasura for nine days and killed him on the tenth day (Vijayadashami), restoring peace to the cosmos.',
    pujaTimings: {
      auspicious: 'Ghatasthapana Muhurat: 06:18 AM - 08:24 AM',
      paran: 'Sunrise of Vijayadashami (October 22)',
      muhurat: 'Sandhi Puja Muhurat: Auspicious transition on Ashtami-Navami'
    },
    recommendedPuja: {
      id: 'durga-puja',
      name: 'Maha Durga Puja & Path',
      purpose: 'Grants victory over enemies, protection from evil eyes, and overall success.',
      price: '₹3,100',
      duration: '90 mins',
      image: require('../assets/bhagwan/durga.png'),
      route: '/all_pujas'
    },
    asset: require('../assets/bhagwan/durga.png')
  }
];

const getDeityForDayOfWeek = (dayOfWeek: number) => {
  switch (dayOfWeek) {
    case 0: return { title: 'Surya Dev Puja', desc: 'Sunday is dedicated to Surya Dev. Offer prayers for health, vitality, and clarity.', deity: 'Surya', asset: require('../assets/bhagwan/surya.png') };
    case 1: return { title: 'Somvar Shiva Aradhana', desc: 'Monday is dedicated to Lord Shiva. Chant Om Namah Shivaya for peace and strength.', deity: 'Shiva', asset: require('../assets/bhagwan/shiva.png') };
    case 2: return { title: 'Mangal Hanuman Puja', desc: 'Tuesday is dedicated to Lord Hanuman. Recite Hanuman Chalisa to remove obstacles and fear.', deity: 'Hanuman', asset: require('../assets/bhagwan/hanuman.png') };
    case 3: return { title: 'Budhwar Ganesha Aradhana', desc: 'Wednesday is dedicated to Lord Ganesha. Offer prayers for wisdom, intellect, and success.', deity: 'Ganesha', asset: require('../assets/bhagwan/ganesha.png') };
    case 4: return { title: 'Guruvar Vishnu Puja', desc: 'Thursday is dedicated to Lord Vishnu. Offer prayers for prosperity, dharma, and wisdom.', deity: 'Vishnu', asset: require('../assets/bhagwan/vishnu.png') };
    case 5: return { title: 'Shukravar Lakshmi Puja', desc: 'Friday is dedicated to Goddess Lakshmi. Pray for abundance, wealth, and spiritual grace.', deity: 'Lakshmi', asset: require('../assets/bhagwan/lakshmi.png') };
    case 6: return { title: 'Shanivar Shani Dev Puja', desc: 'Saturday is dedicated to Shani Dev. Pray to Lord Hanuman to ward off ill effects.', deity: 'Hanuman', asset: require('../assets/bhagwan/hanuman.png') };
    default: return { title: 'Daily Prayers', desc: 'Perform your daily prayers and offerings to stay aligned with spiritual energies.', deity: 'Ganesha', asset: require('../assets/bhagwan/ganesha.png') };
  }
};

const getDeityImage = (deity: string) => {
  const normalized = (deity || '').toLowerCase();
  if (normalized.includes('shiva') || normalized.includes('shiv')) {
    return require('../assets/bhagwan/shiva.png');
  }
  if (normalized.includes('vishnu') || normalized.includes('narayan')) {
    return require('../assets/bhagwan/vishnu.png');
  }
  if (normalized.includes('ganesha') || normalized.includes('ganesh')) {
    return require('../assets/bhagwan/ganesha.png');
  }
  if (normalized.includes('surya') || normalized.includes('sun')) {
    return require('../assets/bhagwan/surya.png');
  }
  if (normalized.includes('durga') || normalized.includes('shakti') || normalized.includes('lakshmi')) {
    return require('../assets/bhagwan/durga.png');
  }
  if (normalized.includes('hanuman')) {
    return require('../assets/bhagwan/hanuman.png');
  }
  return require('../assets/bhagwan/ganesha.png');
};

const doesVratMatchRashiRule = (vrat: VratHubItem, rashiVratId: string) => {
  if (vrat.id === rashiVratId) return true;
  
  const normalizedId = (vrat.id || '').toLowerCase();
  const normalizedType = (vrat.type || '').toLowerCase();
  const normalizedDeity = (vrat.deityLabel || '').toLowerCase();
  
  if (rashiVratId === 'vrat-1' && (normalizedType === 'ekadashi' || normalizedId.startsWith('vrat-1'))) return true;
  if (rashiVratId === 'vrat-2' && (normalizedType === 'pradosh' || normalizedId.startsWith('vrat-2'))) return true;
  if (rashiVratId === 'vrat-3' && (normalizedType === 'chaturthi' || normalizedId.startsWith('vrat-3'))) return true;
  if (rashiVratId === 'vrat-4' && (normalizedType === 'weekly' && (normalizedDeity.includes('shiva') || normalizedDeity.includes('shiv')) || normalizedId.startsWith('vrat-4'))) return true;
  if (rashiVratId === 'vrat-5' && (normalizedType === 'weekly' && (normalizedDeity.includes('surya') || normalizedDeity.includes('sun')) || normalizedId.startsWith('vrat-5'))) return true;
  if (rashiVratId === 'vrat-6' && (normalizedType === 'navratri' || normalizedId.startsWith('vrat-6'))) return true;

  return false;
};


const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const PREFERENCE_OPTIONS = [
  'All',
  'Mesh',
  'Vrishabh',
  'Mithun',
  'Karka',
  'Singh',
  'Kanya',
  'Tula',
  'Vrischik',
  'Dhanu',
  'Makar',
  'Kumbh',
  'Meen'
];

const RASHI_PREFERENCE_MAP: Record<string, string> = {
  'Mesh': 'aries',
  'Vrishabh': 'taurus',
  'Mithun': 'gemini',
  'Karka': 'cancer',
  'Singh': 'leo',
  'Kanya': 'virgo',
  'Tula': 'libra',
  'Vrischik': 'scorpio',
  'Dhanu': 'sagittarius',
  'Makar': 'capricorn',
  'Kumbh': 'aquarius',
  'Meen': 'pisces',
};

export default function SpiritualCalendarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Tab segments
  const [activeSegment, setActiveSegment] = useState<'panchang' | 'reminders'>('panchang');

  // Panchang states
  const [panchangData, setPanchangData] = useState<any>(null);
  const [panchangLoading, setPanchangLoading] = useState<boolean>(false);
  
  // Reminders states
  const [reminders, setReminders] = useState<PersonalReminder[]>([]);
  const [showReminderModal, setShowReminderModal] = useState<boolean>(false);
  const [reminderTitle, setReminderTitle] = useState<string>('');
  const [reminderCategory, setReminderCategory] = useState<PersonalReminder['category']>('puja');
  const [reminderRepeat, setReminderRepeat] = useState<PersonalReminder['repeat']>('none');
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fasting Hub states
  const [preferenceSelector, setPreferenceSelector] = useState<string>('All');
  const [userProfileRashi, setUserProfileRashi] = useState<string>('aries');
  const [showAllVrats, setShowAllVrats] = useState<boolean>(false);
  const [rashiFilterMode, setRashiFilterMode] = useState<'custom' | 'all'>('all');
  const [expandedVrats, setExpandedVrats] = useState<Record<string, boolean>>({});
  const [savedVrats, setSavedVrats] = useState<string[]>([]);
  const [selectedRashi, setSelectedRashi] = useState<string>('aries');
  const [expandedSubSections, setExpandedSubSections] = useState<Record<string, Record<string, boolean>>>({});
  const [vratHubData, setVratHubData] = useState<VratHubItem[]>(VRAT_HUB_DATA);
  const [calendarLoading, setCalendarLoading] = useState<boolean>(true);

  // Devotional micro-interaction states
  const [particles, setParticles] = useState<Particle[]>([]);
  const [coinBalance, setCoinBalance] = useState<number>(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasPrayedToday, setHasPrayedToday] = useState<boolean>(false);
  const [expandedFestivalId, setExpandedFestivalId] = useState<string | null>(null);

  // Load reminders, user session, coin balances, saved vrats
  useEffect(() => {
    loadReminders();
    loadUserSession();
    checkIfPrayed();
    loadSavedVrats();
  }, [selectedDate]);

  // Load spiritual calendar events from database on mount & subscribe to realtime updates
  useEffect(() => {
    loadSpiritualCalendarFromDb();

    // Subscribe to realtime changes on spiritual_calendar table
    const channel = supabase
      .channel('spiritual-calendar-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'spiritual_calendar' }, () => {
        loadSpiritualCalendarFromDb();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getActiveRashi = () => {
    return RASHI_PREFERENCE_MAP[preferenceSelector] || 'aries';
  };

  const loadReminders = async () => {
    try {
      const stored = await safeStorage.getItem('spiritual_reminders');
      if (stored) {
        setReminders(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('[SpiritualCalendar] Error loading reminders:', e);
    }
  };

  const loadSpiritualCalendarFromDb = async () => {
    try {
      setCalendarLoading(true);
      const { data, error } = await supabase
        .from('spiritual_calendar')
        .select('*');
      if (error) throw error;
      
      if (data && data.length > 0) {
        const mappedData: VratHubItem[] = data.map(item => {
          const whyObserve = item.why_observe || {};
          const benefits = item.benefits || {};
          const howToPerform = item.how_to_perform || {};
          const foodGuidelines = item.food_guidelines || {};
          const mantrasPrayers = item.mantras_prayers || {};
          const recommendedPuja = item.recommended_puja || {};
          
          return {
            id: item.date_key,
            title: item.title,
            dateStr: item.date_str,
            dateKey: item.date_key,
            deity: (item.deity_label || 'Ganesha') as any,
            deityLabel: item.deity || 'Lord Ganesha',
            type: (item.vrat_type || 'Ekadashi') as any,
            importance: (item.importance || 'normal') as any,
            oneLiner: item.one_liner || '',
            desc: item.description || '',
            whyObserve: {
              spiritualImportance: Array.isArray(whyObserve) ? whyObserve[0] || '' : whyObserve.spiritualImportance || '',
              religiousSignificance: Array.isArray(whyObserve) ? whyObserve[1] || '' : whyObserve.religiousSignificance || '',
              scripturalReferences: Array.isArray(whyObserve) ? whyObserve[2] || '' : whyObserve.scripturalReferences || ''
            },
            benefits: {
              mental: Array.isArray(benefits) ? benefits[0] || '' : benefits.mental || '',
              spiritual: Array.isArray(benefits) ? benefits[1] || '' : benefits.spiritual || '',
              family: Array.isArray(benefits) ? benefits[2] || '' : benefits.family || '',
              financial: Array.isArray(benefits) ? benefits[3] || '' : benefits.financial || '',
              health: Array.isArray(benefits) ? benefits[4] || '' : benefits.health || ''
            },
            howToPerform: {
              preparation: Array.isArray(howToPerform) ? howToPerform[0] || '' : howToPerform.preparation || '',
              morningRituals: Array.isArray(howToPerform) ? howToPerform[1] || '' : howToPerform.morningRituals || '',
              pujaProcess: Array.isArray(howToPerform) ? howToPerform[2] || '' : howToPerform.pujaProcess || '',
              sankalpProcess: Array.isArray(howToPerform) ? howToPerform[3] || '' : howToPerform.sankalpProcess || '',
              eveningRituals: Array.isArray(howToPerform) ? howToPerform[4] || '' : howToPerform.eveningRituals || '',
              completionProcess: Array.isArray(howToPerform) ? howToPerform[5] || '' : howToPerform.completionProcess || ''
            },
            foodGuidelines: {
              allowed: Array.isArray(foodGuidelines.allowed) ? foodGuidelines.allowed : [],
              restricted: Array.isArray(foodGuidelines.prohibited) ? foodGuidelines.prohibited : (Array.isArray(foodGuidelines.restricted) ? foodGuidelines.restricted : []),
              method: foodGuidelines.method || (item.vrat_type === 'Ekadashi' ? 'Strict fasting without grains.' : 'Satvik dietary routine today.')
            },
            mantrasPrayers: {
              mantras: Array.isArray(mantrasPrayers)
                ? mantrasPrayers.map((m: any) => typeof m === 'object' ? `${m.name}: ${m.mantra} (${m.count || '108 times'})` : String(m))
                : (Array.isArray(mantrasPrayers.mantras) ? mantrasPrayers.mantras : []),
              aarti: mantrasPrayers.aarti || (item.deity ? `${item.deity} Aarti` : ''),
              chantingGuidance: mantrasPrayers.chantingGuidance || 'Chant with a calm mind facing East in the morning.'
            },
            vratKatha: item.vrat_katha || '',
            pujaTimings: {
              auspicious: Array.isArray(item.puja_timings)
                ? (item.puja_timings.find((t: any) => t.label?.toLowerCase().includes('auspicious'))?.value || item.puja_timings[0]?.value || 'Brahma Muhurta')
                : (item.puja_timings?.auspicious || 'Brahma Muhurta'),
              paran: Array.isArray(item.puja_timings)
                ? (item.puja_timings.find((t: any) => t.label?.toLowerCase().includes('paran'))?.value || item.puja_timings[1]?.value || 'Next day sunrise')
                : (item.puja_timings?.paran || 'Next day sunrise'),
              muhurat: Array.isArray(item.puja_timings)
                ? (item.puja_timings.find((t: any) => t.label?.toLowerCase().includes('muhurat'))?.value || item.puja_timings[2]?.value || 'Auspicious Kaal')
                : (item.puja_timings?.muhurat || 'Auspicious Kaal')
            },
            recommendedPuja: {
              id: recommendedPuja.id || 'rec-puja',
              name: recommendedPuja.name || '',
              purpose: recommendedPuja.purpose || item.one_liner || '',
              price: recommendedPuja.price || '₹1,500',
              duration: recommendedPuja.duration || '45 mins',
              image: recommendedPuja.image
                ? (typeof recommendedPuja.image === 'string' ? { uri: recommendedPuja.image } : recommendedPuja.image)
                : getDeityImage(item.deity || item.deity_label || ''),
              route: recommendedPuja.route || '/all_pujas'
            },
            asset: getDeityImage(item.deity || item.deity_label || '')
          };
        });
        
        // Merge DB data on top of static data to preserve default events if not configured in DB
        const merged = [...VRAT_HUB_DATA];
        mappedData.forEach(dbItem => {
          const idx = merged.findIndex(x => x.dateKey === dbItem.dateKey);
          if (idx !== -1) {
            merged[idx] = dbItem;
          } else {
            merged.push(dbItem);
          }
        });
        
        setVratHubData(merged);
      }
    } catch (err) {
      console.warn('[SpiritualCalendar] Error loading from DB:', err);
    } finally {
      setCalendarLoading(false);
    }
  };

  const loadUserSession = async () => {
    try {
      const sessionStr = await safeStorage.getItem('user_session');
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        setUserId(session.id);
        
        // Fetch current wallet coin balance
        const { data: walletData } = await supabase
          .from('user_wallets')
          .select('balance')
          .eq('user_id', session.id)
          .maybeSingle();
        
        if (walletData) {
          setCoinBalance(walletData.balance);
        }

        // Fetch user's saved rashi
        const { data: profileData } = await supabase
          .from('profiles')
          .select('rashi')
          .eq('id', session.id)
          .maybeSingle();

        if (profileData && profileData.rashi) {
          const uRashi = profileData.rashi.toLowerCase().trim();
          if (RASHI_GUIDANCE_DB[uRashi]) {
            setUserProfileRashi(uRashi);
          }
        }
      }
    } catch (e) {
      console.warn('[SpiritualCalendar] Error loading session:', e);
    }
  };

  const loadSavedVrats = async () => {
    try {
      const stored = await safeStorage.getItem('saved_vrats');
      if (stored) {
        setSavedVrats(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('[SpiritualCalendar] Error loading saved vrats:', e);
    }
  };

  const toggleSaveVrat = async (id: string) => {
    let updated: string[];
    if (savedVrats.includes(id)) {
      updated = savedVrats.filter(vid => vid !== id);
      Alert.alert(t('Saved Removed'), t('Fast removed from your bookmarked list.'));
    } else {
      updated = [...savedVrats, id];
      Alert.alert(t('Saved successfully'), t('This fast has been bookmarked for later.'));
    }
    setSavedVrats(updated);
    await safeStorage.setItem('saved_vrats', JSON.stringify(updated));
  };

  const checkIfPrayed = async () => {
    const dateKey = getFormattedDate(selectedDate);
    const lastPrayedStr = await safeStorage.getItem(`last_prayer_${dateKey}`);
    setHasPrayedToday(!!lastPrayedStr);
  };

  // Fetch daily Panchang calculation
  useEffect(() => {
    const fetchPanchangForSelectedDate = async () => {
      setPanchangLoading(true);
      setPanchangData(null);
      try {
        const response = await requestAstro('panchang', {
          method: 'POST',
          body: JSON.stringify({
            day: selectedDate.getDate(),
            month: selectedDate.getMonth() + 1,
            year: selectedDate.getFullYear(),
          }),
        });
        setPanchangData(response);
      } catch (err) {
        console.error('[SpiritualCalendar] fetchPanchang failed:', err);
      } finally {
        setPanchangLoading(false);
      }
    };

    fetchPanchangForSelectedDate();
  }, [selectedDate]);

  // Calendar Helpers
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const getFormattedDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getMonthAndYearString = (date: Date) => {
    return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Generate 42 cells representing current month view
  const generateMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayIndex = getFirstDayOfMonth(year, month);

    const daysArray: { dayNum: number; isCurrentMonth: boolean; dateString: string }[] = [];

    // Previous month padding
    const prevMonthDays = getDaysInMonth(year, month - 1);
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dNum = prevMonthDays - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      daysArray.push({
        dayNum: dNum,
        isCurrentMonth: false,
        dateString: `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      daysArray.push({
        dayNum: d,
        isCurrentMonth: true,
        dateString: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      });
    }

    // Next month padding
    const totalSlots = 42;
    const nextMonthPadding = totalSlots - daysArray.length;
    for (let d = 1; d <= nextMonthPadding; d++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      daysArray.push({
        dayNum: d,
        isCurrentMonth: false,
        dateString: `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      });
    }

    return daysArray;
  };

  const getRemindersForDate = (dateString: string) => {
    return reminders.filter(r => r.date === dateString);
  };

  const getFestivalForDate = (dateString: string) => {
    const parts = dateString.split('-');
    if (parts.length < 3) return [];
    const key = `${parts[1]}-${parts[2]}`; // MM-DD
    return FESTIVALS_DATABASE[key] || [];
  };

  // Devotional interaction
  const triggerPrayerReward = async () => {
    if (hasPrayedToday) {
      Alert.alert(t('Devotional Offered'), t('You have already offered prayers for this auspicious day. Receive blessings and try again on another date!'));
      return;
    }

    // Spawn floating flower particle animations
    const symbols = ['🌸', '🪔', '🔔', '💐', '🌼'];
    const newParticles: Particle[] = Array.from({ length: 12 }).map((_, idx) => {
      const id = `${Date.now()}-${idx}`;
      const x = Math.random() * 260 - 130;
      const yVal = new Animated.Value(0);
      const opacityVal = new Animated.Value(1);

      Animated.parallel([
        Animated.timing(yVal, {
          toValue: -180 - Math.random() * 100,
          duration: 1600 + Math.random() * 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacityVal, {
          toValue: 0,
          duration: 1600 + Math.random() * 600,
          useNativeDriver: true,
        })
      ]).start(() => {
        setParticles(prev => prev.filter(p => p.id !== id));
      });

      return {
        id,
        x,
        y: yVal,
        opacity: opacityVal,
        scale: 0.8 + Math.random() * 0.6,
        symbol: symbols[Math.floor(Math.random() * symbols.length)],
      };
    });

    setParticles(prev => [...prev, ...newParticles]);

    // DB coin update
    if (!userId) {
      // Local demo mode for guests
      setCoinBalance(prev => prev + 5);
      setHasPrayedToday(true);
      const dateKey = getFormattedDate(selectedDate);
      await safeStorage.setItem(`last_prayer_${dateKey}`, 'true');
      Alert.alert(t('Blessings Received'), t('You offered prayers and earned 5 Devotional Coins! Log in to save these to your wallet.'));
      return;
    }

    try {
      const { error: walletError } = await supabase
        .from('user_wallets')
        .update({ balance: coinBalance + 5 })
        .eq('user_id', userId);

      if (walletError) throw walletError;

      const { error: txError } = await supabase
        .from('coin_transactions')
        .insert({
          user_id: userId,
          amount: 5,
          type: 'daily_puja_reward',
        });

      if (txError) throw txError;

      setCoinBalance(prev => prev + 5);
      setHasPrayedToday(true);
      const dateKey = getFormattedDate(selectedDate);
      await safeStorage.setItem(`last_prayer_${dateKey}`, 'true');
    } catch (e) {
      console.warn('[SpiritualCalendar] Prayer coin reward transaction failed:', e);
    }
  };

  // Reminders Management
  const handleSaveReminder = async () => {
    if (!reminderTitle.trim()) {
      Alert.alert(t('Required Field'), t('Please enter a title for your milestone reminder.'));
      return;
    }

    const newReminder: PersonalReminder = {
      id: editingReminderId || Math.random().toString(36).substring(2, 9),
      title: reminderTitle.trim(),
      category: reminderCategory,
      date: getFormattedDate(selectedDate),
      repeat: reminderRepeat,
      isMuted: false,
    };

    let updatedReminders = [];
    if (editingReminderId) {
      updatedReminders = reminders.map(r => r.id === editingReminderId ? newReminder : r);
    } else {
      updatedReminders = [...reminders, newReminder];
    }

    setReminders(updatedReminders);
    await safeStorage.setItem('spiritual_reminders', JSON.stringify(updatedReminders));
    
    // Reset inputs
    setReminderTitle('');
    setReminderCategory('puja');
    setReminderRepeat('none');
    setEditingReminderId(null);
    setShowReminderModal(false);

    Alert.alert(t('Reminder Saved'), t('Your spiritual reminder has been successfully saved.'));
  };

  const handleEditReminder = (reminder: PersonalReminder) => {
    setReminderTitle(reminder.title);
    setReminderCategory(reminder.category);
    setReminderRepeat(reminder.repeat);
    setEditingReminderId(reminder.id);
    setShowReminderModal(true);
  };

  const handleDeleteReminder = (id: string) => {
    Alert.alert(
      t('Delete Reminder'),
      t('Are you sure you want to remove this spiritual reminder?'),
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Delete'),
          style: 'destructive',
          onPress: async () => {
            const filtered = reminders.filter(r => r.id !== id);
            setReminders(filtered);
            await safeStorage.setItem('spiritual_reminders', JSON.stringify(filtered));
          }
        }
      ]
    );
  };

  const toggleMuteReminder = async (id: string) => {
    const updated = reminders.map(r => r.id === id ? { ...r, isMuted: !r.isMuted } : r);
    setReminders(updated);
    await safeStorage.setItem('spiritual_reminders', JSON.stringify(updated));
  };

  // Add standard festival or vrat to personal reminders list
  const handleSetReminder = async (event: { title: string; date: string } | VratHubItem) => {
    let dateStr = '';
    
    if ('id' in event) {
      // It's a VratHubItem
      if (event.id === 'vrat-1') dateStr = '2026-06-16';
      else if (event.id === 'vrat-2') dateStr = '2026-06-13';
      else if (event.id === 'vrat-3') dateStr = '2026-07-03';
      else if (event.id === 'vrat-4') dateStr = '2026-06-15';
      else if (event.id === 'vrat-5') dateStr = '2026-06-14';
      else dateStr = getFormattedDate(selectedDate);
    } else {
      // It's a festival
      const dateParts = event.date.split('-');
      const year = new Date().getFullYear();
      dateStr = `${year}-${dateParts[0]}-${dateParts[1]}`;
    }

    const exists = reminders.some(r => r.title === event.title && r.date === dateStr);
    if (exists) {
      Alert.alert(t('Reminder Exists'), t('You already have a reminder scheduled for this fast or festival.'));
      return;
    }

    const newRem: PersonalReminder = {
      id: Math.random().toString(36).substring(2, 9),
      title: event.title,
      category: 'puja',
      date: dateStr,
      repeat: 'yearly',
      isMuted: false,
    };

    const updated = [...reminders, newRem];
    setReminders(updated);
    await safeStorage.setItem('spiritual_reminders', JSON.stringify(updated));
    Alert.alert(t('Reminder Added'), t(`Annually repeating reminder for "${event.title}" has been saved.`));
  };

  const handleShareVrat = async (vrat: VratHubItem) => {
    try {
      await Share.share({
        message: `🌸 *MantraPuja Vrat Hub* 🌸\n\nCelebrate *${vrat.title}* on ${vrat.dateStr}. \n\n_${vrat.oneLiner}_\n\nDiscover Puja Vidhi, fast rules, and stories on MantraPuja App!`,
      });
    } catch (e) {
      console.warn(e);
    }
  };

  const handleShareFestival = async (festival: any) => {
    try {
      await Share.share({
        message: `🌸 *MantraPuja Blessings* 🌸\n\nCelebrate *${festival.title}* on ${festival.date}. \n\n_${festival.desc}_\n\nJoin me in daily prayers on MantraPuja App!`,
      });
    } catch (e) {
      console.warn(e);
    }
  };

  // Countdown calculations
  const getReminderCountdown = (reminderDateStr: string, repeat: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const remDate = new Date(reminderDateStr);
    remDate.setHours(0, 0, 0, 0);

    if (repeat === 'yearly') {
      remDate.setFullYear(today.getFullYear());
      if (remDate.getTime() < today.getTime()) {
        remDate.setFullYear(today.getFullYear() + 1);
      }
    } else if (repeat === 'monthly') {
      remDate.setMonth(today.getMonth());
      remDate.setFullYear(today.getFullYear());
      if (remDate.getTime() < today.getTime()) {
        remDate.setMonth(today.getMonth() + 1);
      }
    }

    const diffTime = remDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handlePreferenceChange = (opt: string) => {
    setPreferenceSelector(opt);
    setShowAllVrats(false);
    if (opt === 'All') {
      setRashiFilterMode('all');
    } else {
      setRashiFilterMode('custom');
      const mapped = RASHI_PREFERENCE_MAP[opt];
      if (mapped) {
        setSelectedRashi(mapped);
      }
    }
  };

  const getCountdownLabel = (days: number) => {
    if (days === 0) return t('Today!');
    if (days === 1) return t('Tomorrow');
    return t(`In ${days} days`);
  };

  // Filter lists based on Search bar
  const filteredTimelineFestivals = UPCOMING_FESTIVALS.filter(f =>
    f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredReminders = reminders.filter(r =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Fasting Hub Filters Logic
  const filteredVrats = vratHubData.filter(vrat => {
    const matchesSearch = searchQuery.trim() === '' || 
      vrat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vrat.oneLiner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vrat.desc.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  if (rashiFilterMode === 'custom') {
    const rashiRec = RASHI_GUIDANCE_DB[selectedRashi];
    if (rashiRec) {
      filteredVrats.sort((a, b) => {
        const aMatches = rashiRec.recommendedVratIds.some(vratId => doesVratMatchRashiRule(a, vratId));
        const bMatches = rashiRec.recommendedVratIds.some(vratId => doesVratMatchRashiRule(b, vratId));
        if (aMatches && !bMatches) return -1;
        if (!aMatches && bMatches) return 1;
        return 0;
      });
    }
  }

  const toggleExpandVrat = (id: string) => {
    setExpandedVrats(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const isSubSectionExpanded = (vratId: string, sectionKey: string) => {
    return !!expandedSubSections[vratId]?.[sectionKey];
  };

  const toggleSubSection = (vratId: string, sectionKey: string) => {
    setExpandedSubSections(prev => ({
      ...prev,
      [vratId]: {
        ...(prev[vratId] || {}),
        [sectionKey]: !(prev[vratId]?.[sectionKey])
      }
    }));
  };

  // Render variables
  const formattedSelectedDate = getFormattedDate(selectedDate);
  const selectedDateFestivals = getFestivalForDate(formattedSelectedDate);
  const hasFestivalOnSelectedDate = selectedDateFestivals.length > 0;
  
  const currentWeekday = selectedDate.getDay();
  const getHeroEvent = () => {
    const formattedSelDate = getFormattedDate(selectedDate);
    
    // Priority 1: Today's active Vrat from filteredVrats
    const activeVrat = filteredVrats.find(v => v.dateKey === formattedSelDate);
    if (activeVrat) {
      return {
        vrat: activeVrat,
        status: 'Today',
        countdown: 0,
        type: 'vrat'
      };
    }

    // Priority 2: Today's active Festival from FESTIVALS_DATABASE / selectedDateFestivals
    const activeFestivals = getFestivalForDate(formattedSelDate);
    if (activeFestivals.length > 0) {
      const fest = activeFestivals[0];
      return {
        vrat: {
          id: 'virtual-fest',
          title: fest.title,
          dateStr: getMonthAndYearString(selectedDate),
          dateKey: formattedSelDate,
          deity: (fest.deity === 'Shiva' || fest.deity === 'Vishnu' || fest.deity === 'Ganesha' || fest.deity === 'Surya' || fest.deity === 'Durga' ? fest.deity : 'Ganesha') as 'Shiva' | 'Vishnu' | 'Ganesha' | 'Surya' | 'Durga',
          deityLabel: `${fest.deity || 'Lord Ganesha'}`,
          type: 'Ekadashi',
          importance: 'high',
          oneLiner: fest.desc,
          desc: fest.desc,
          whyObserve: {
            spiritualImportance: fest.desc,
            religiousSignificance: "This day is historically associated with deep divine energy and scriptural alignment.",
            scripturalReferences: "Lauded in traditional Puranas and calendars."
          },
          benefits: {
            mental: "Brings mental peace and aligns positive thought frequencies.",
            spiritual: "Elevates conscious connection with the divine deity.",
            family: "Promotes home peace and positive aura.",
            financial: "Brings auspicious fortune and stable material paths.",
            health: "Cleanses metabolic channels and restores vitality."
          },
          howToPerform: {
            preparation: "Clean the home temple and light a ghee lamp.",
            morningRituals: "Take an early bath and perform daily offerings.",
            pujaProcess: "Chant deity prayers, offer flowers, and perform simple standard aarti.",
            sankalpProcess: "Commit to positive thinking and devotions today.",
            eveningRituals: "Light evening lamps and do deep meditation.",
            completionProcess: "Perform standard daily prayers."
          },
          foodGuidelines: {
            allowed: ["Fruits, milk, water, sendha salt, satvik preparations."],
            restricted: ["Avoid grains, heavy spices, onion, garlic, and non-veg."],
            method: "Satvik dietary routine today."
          },
          mantrasPrayers: {
            mantras: [`Om ${fest.deity || 'Ganesh'}aya Namah`],
            aarti: "Daily Aarti",
            chantingGuidance: "Chant in the morning after daily bath."
          },
          vratKatha: fest.desc,
          pujaTimings: {
            auspicious: "Brahma Muhurta",
            paran: "Next day sunrise",
            muhurat: "Auspicious Kaal during the day"
          },
          recommendedPuja: {
            id: 'generic-puja',
            name: `Maha ${fest.deity || 'Deity'} Puja`,
            purpose: fest.desc,
            price: '₹1,500',
            duration: '45 mins',
            image: fest.asset || require('../assets/bhagwan/ganesha.png'),
            route: '/all_pujas'
          },
          asset: fest.asset || require('../assets/bhagwan/ganesha.png')
        } as VratHubItem,
        status: 'Today',
        countdown: 0,
        type: 'festival'
      };
    }

    // Priority 3: Next upcoming Vrat (from filteredVrats) relative to selectedDate
    const futureVrats = filteredVrats.map(v => {
      const vDate = new Date(v.dateKey + 'T12:00:00');
      const diff = vDate.getTime() - selectedDate.getTime();
      return { vrat: v, diff, diffDays: Math.ceil(diff / (1000 * 60 * 60 * 24)) };
    }).filter(x => x.diffDays > 0);

    if (futureVrats.length > 0) {
      futureVrats.sort((a, b) => a.diff - b.diff);
      const closest = futureVrats[0];
      return {
        vrat: closest.vrat,
        status: closest.diffDays === 1 ? 'Tomorrow' : 'Upcoming',
        countdown: closest.diffDays,
        type: 'upcoming_vrat'
      };
    }

    // Priority 4: Upcoming Important Spiritual Event (from UPCOMING_FESTIVALS relative to selectedDate)
    const futureFestivals = UPCOMING_FESTIVALS.map(f => {
      const activeYear = selectedDate.getFullYear();
      const fDate = new Date(`${activeYear}-${f.date}T12:00:00`);
      const diff = fDate.getTime() - selectedDate.getTime();
      return { fest: f, diff, diffDays: Math.ceil(diff / (1000 * 60 * 60 * 24)) };
    }).filter(x => x.diffDays > 0);

    if (futureFestivals.length > 0) {
      futureFestivals.sort((a, b) => a.diff - b.diff);
      const closest = futureFestivals[0].fest;
      const diffDays = futureFestivals[0].diffDays;
      const monthIndex = parseInt(closest.date.split('-')[0]) - 1;
      const monthName = MONTH_NAMES[monthIndex] || 'Month';
      const dayNum = closest.date.split('-')[1];
      
      return {
        vrat: {
          id: closest.id || 'virtual-fest',
          title: closest.title,
          dateStr: `${monthName} ${dayNum}`,
          dateKey: `${selectedDate.getFullYear()}-${closest.date}`,
          deity: (closest.deity === 'Shiva' || closest.deity === 'Vishnu' || closest.deity === 'Ganesha' || closest.deity === 'Surya' || closest.deity === 'Durga' ? closest.deity : 'Ganesha') as 'Shiva' | 'Vishnu' | 'Ganesha' | 'Surya' | 'Durga',
          deityLabel: `${closest.deity || 'Lord Ganesha'}`,
          type: 'Ekadashi',
          importance: 'high',
          oneLiner: closest.desc,
          desc: closest.desc,
          whyObserve: {
            spiritualImportance: closest.desc,
            religiousSignificance: "This day is historically associated with deep divine energy and scriptural alignment.",
            scripturalReferences: "Lauded in traditional Puranas and calendars."
          },
          benefits: {
            mental: "Brings mental peace and aligns positive thought frequencies.",
            spiritual: "Elevates conscious connection with the divine deity.",
            family: "Promotes home peace and positive aura.",
            financial: "Brings auspicious fortune and stable material paths.",
            health: "Cleanses metabolic channels and restores vitality."
          },
          howToPerform: {
            preparation: "Clean the home temple and light a ghee lamp.",
            morningRituals: "Take an early bath and perform daily offerings.",
            pujaProcess: "Chant deity prayers, offer flowers, and perform simple standard aarti.",
            sankalpProcess: "Commit to positive thinking and devotions today.",
            eveningRituals: "Light evening lamps and do deep meditation.",
            completionProcess: "Perform standard daily prayers."
          },
          foodGuidelines: {
            allowed: ["Fruits, milk, water, sendha salt, satvik preparations."],
            restricted: ["Avoid grains, heavy spices, onion, garlic, and non-veg."],
            method: "Satvik dietary routine today."
          },
          mantrasPrayers: {
            mantras: [`Om ${closest.deity || 'Ganesh'}aya Namah`],
            aarti: "Daily Aarti",
            chantingGuidance: "Chant in the morning after daily bath."
          },
          vratKatha: closest.desc,
          pujaTimings: {
            auspicious: "Brahma Muhurta",
            paran: "Next day sunrise",
            muhurat: "Auspicious Kaal during the day"
          },
          recommendedPuja: {
            id: 'generic-puja',
            name: `Maha ${closest.deity || 'Deity'} Puja`,
            purpose: closest.desc,
            price: '₹1,500',
            duration: '45 mins',
            image: closest.asset || require('../assets/bhagwan/ganesha.png'),
            route: '/all_pujas'
          },
          asset: closest.asset || require('../assets/bhagwan/ganesha.png')
        } as VratHubItem,
        status: diffDays === 1 ? 'Tomorrow' : 'Upcoming',
        countdown: diffDays,
        type: 'festival'
      };
    }

    // Fallback: Default back to first vrat if nothing matches
    return {
      vrat: vratHubData[0] || VRAT_HUB_DATA[0],
      status: 'Upcoming',
      countdown: 5,
      type: 'fallback'
    };
  };

  const deityCardInfo = hasFestivalOnSelectedDate 
    ? selectedDateFestivals[0] 
    : getDeityForDayOfWeek(currentWeekday);

  // Get Vrat/Fast info based on dynamic Panchang elements
  const getVratForDate = () => {
    if (!panchangData || !panchangData.panchang_for_today) return null;

    const tithiStr = (panchangData.panchang_for_today["Tithi"] || "").toLowerCase();
    const pakshaStr = (panchangData.panchang_for_today["Paksha"] || "").toLowerCase();
    const weekdayStr = (panchangData.panchang_for_today["Weekday"] || "").toLowerCase();

    // 1. Ekadashi
    if (tithiStr.includes("ekadashi")) {
      return {
        title: t('Ekadashi Vrat'),
        deity: t('Lord Vishnu'),
        rules: t('Strict fast abstaining from grains, rice, and beans. Recommended to spend time chanting and listening to spiritual scriptures.'),
        icon: '🍚'
      };
    }
    
    // 2. Pradosh Vrat
    if (tithiStr.includes("trayodashi") || tithiStr.includes("trayodasi")) {
      return {
        title: t('Pradosh Vrat'),
        deity: t('Lord Shiva'),
        rules: t('Fasting from sunrise until sunset. Offer prayers, milk, and water to Shiva Lingam during twilight (Pradosh Kaal).'),
        icon: '📿'
      };
    }

    // 3. Chaturthi
    if (tithiStr.includes("chaturthi")) {
      if (pakshaStr.includes("krishna")) {
        return {
          title: t('Sankashti Chaturthi Vrat'),
          deity: t('Lord Ganesha'),
          rules: t('Fasting from sunrise until moonrise. Offer durva grass and modaks to Lord Ganesha to remove all life hurdles.'),
          icon: '🪔'
        };
      } else {
        return {
          title: t('Vinayaka Chaturthi Vrat'),
          deity: t('Lord Ganesha'),
          rules: t('Daytime fasting and special puja dedicated to Lord Ganesha.'),
          icon: '🌸'
        };
      }
    }

    // 4. Purnima
    if (tithiStr.includes("purnima") || tithiStr.includes("pournami")) {
      return {
        title: t('Purnima Vrat'),
        deity: t('Lord Satyanarayan'),
        rules: t('Full moon fasting, holy dips, charity, and recitation of Sri Satyanarayan Katha in the evening.'),
        icon: '🌕'
      };
    }

    // 5. Amavasya
    if (tithiStr.includes("amavasya")) {
      return {
        title: t('Amavasya Pitru Tarpan'),
        deity: t('Ancestors & Pitrus'),
        rules: t('Fasting, offering black sesame seeds and water (Tarpan) to ancestors, and distributing food to the needy.'),
        icon: '🌑'
      };
    }

    // 6. Masik Shivaratri
    if (tithiStr.includes("chaturdashi") && pakshaStr.includes("krishna")) {
      return {
        title: t('Masik Shivaratri Vrat'),
        deity: t('Lord Shiva'),
        rules: t('Night vigil (Jagran), night pujas, and fasting dedicated to Lord Shiva.'),
        icon: '🔱'
      };
    }

    // 7. General fast recommendations based on weekdays
    if (weekdayStr.includes("monday") || weekdayStr.includes("somvar")) {
      return {
        title: t('Somvar Vrat (Optional)'),
        deity: t('Lord Shiva'),
        rules: t('Devotees perform light fasting on Mondays, consuming only milk and fruits to honor Lord Shiva.'),
        icon: '🥛'
      };
    }

    return null;
  };

  const vratInfo = getVratForDate();



  return (
    <View style={styles.mainContainer}>
      <StatusBar style="light" />
      <LinearGradient colors={['#1e293b', '#0f172a']} style={StyleSheet.absoluteFill} />

      {/* HEADER SECTION */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back-outline" size={24} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.headerTitleRow}>
            <View style={styles.headerCalendarIcon}>
              <Svg width={24} height={24} viewBox="0 0 24 24">
                <Rect x="3" y="5" width="18" height="16" rx="3" ry="3" fill="none" stroke="#ffffff" strokeWidth="2" />
                <Line x1="7" y1="2" x2="7" y2="6" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                <Line x1="17" y1="2" x2="17" y2="6" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                <Line x1="3" y1="9" x2="21" y2="9" stroke="#ffffff" strokeWidth="1.5" />
                <SvgText x="12" y="18.5" fontSize="8" fontWeight="900" fill="#ffffff" textAnchor="middle" fontFamily="Outfit-Bold">31</SvgText>
              </Svg>
            </View>
            <Text style={styles.headerTitle}>{t('Spiritual Calendar')}</Text>
          </View>
          <View style={styles.headerWalletContainer}>
            <Ionicons name="wallet-outline" size={16} color="#FF9500" />
            <Text style={styles.headerWalletText}>{coinBalance}</Text>
          </View>
        </View>

        {/* SEARCH & FILTER BAR */}
        <View style={styles.searchBarContainer}>
          <Ionicons name="search-outline" size={18} color="rgba(255, 255, 255, 0.45)" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('Search fasts, festivals or reminders...')}
            placeholderTextColor="rgba(255, 255, 255, 0.45)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle-outline" size={18} color="rgba(255, 255, 255, 0.45)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* ==================== 1. SPIRITUAL PREFERENCE SELECTOR ==================== */}
        <View style={styles.preferenceSelectorContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.preferenceSelectorScroll}>
            {PREFERENCE_OPTIONS.map(opt => {
              const isSelected = preferenceSelector === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.preferencePill, isSelected && styles.preferencePillActive]}
                  onPress={() => handlePreferenceChange(opt)}
                >
                  <Text style={[styles.preferencePillText, isSelected && styles.preferencePillTextActive]}>
                    {t(opt)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ==================== 2. VRAT & SPIRITUAL GUIDANCE HUB ==================== */}
        <View style={styles.vratHubContainer}>
          <View style={styles.vratHubHeader}>
            <Text style={styles.vratHubEmoji}>🔥</Text>
            <View>
              <Text style={styles.vratHubTitle}>{t('Vrat & Spiritual Guidance Hub')}</Text>
              <Text style={styles.vratHubSubtitle}>{t('Spiritual fasting guides, personal Rashi remedies, and rituals')}</Text>
            </View>
          </View>

          {/* Today's Recommended Vrat Card (Featured Hero Card) */}
          {preferenceSelector === 'All' && (() => {
            const hero = getHeroEvent();
            if (!hero) return null;
            return (
              <View style={styles.heroWrapper}>
                <LinearGradient
                  colors={['#FF9500', '#FF7A00', '#F56B00']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.heroCard}
                >
                  <View style={styles.heroRow}>
                    <View style={styles.heroDetails}>
                      <View style={styles.heroStatusRow}>
                        <View style={styles.heroStatusBadge}>
                          <Text style={styles.heroStatusText}>
                            {t(hero.status).toUpperCase()}
                          </Text>
                        </View>
                        {hero.countdown > 0 && (
                          <View style={styles.heroCountdownBadge}>
                            <Text style={styles.heroCountdownText}>
                              {t('In')} {hero.countdown} {t('days')}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.heroTitle}>{t(hero.vrat.title)}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 3 }}>
                        <Text style={[styles.heroDate, { marginRight: 10 }]}>📅 {t(hero.vrat.dateStr)}</Text>
                        <Text style={[styles.heroDate, { color: '#FFEBE0', fontWeight: '800' }]}>🎯 {t(hero.vrat.deityLabel)}</Text>
                      </View>
                      <Text style={styles.heroSignificance} numberOfLines={3}>
                        {t(hero.vrat.whyObserve.spiritualImportance)}
                      </Text>
                    </View>
                    <View style={styles.heroImageCol}>
                      <Image source={hero.vrat.asset} style={styles.heroIllustration} />
                    </View>
                  </View>

                  <View style={styles.heroDivider} />

                  <View style={styles.heroActionsRow}>
                    <TouchableOpacity
                      style={styles.heroActionBtn}
                      onPress={() => {
                        toggleExpandVrat(hero.vrat.id);
                      }}
                    >
                      <Ionicons name="book-outline" size={14} color="#ffffff" />
                      <Text style={styles.heroActionBtnText}>{t('View Details')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.heroActionBtn}
                      onPress={() => handleSetReminder(hero.vrat)}
                    >
                      <Ionicons name="notifications-outline" size={14} color="#ffffff" />
                      <Text style={styles.heroActionBtnText}>{t('Set Reminder')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.heroActionBtn}
                      onPress={() => handleShareVrat(hero.vrat)}
                    >
                      <Ionicons name="share-social-outline" size={14} color="#ffffff" />
                      <Text style={styles.heroActionBtnText}>{t('Share')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.heroActionBtnHighlight}
                      onPress={() => router.push(hero.vrat.recommendedPuja.route as any)}
                    >
                      <Ionicons name="rose-outline" size={14} color="#FF7A00" />
                      <Text style={styles.heroActionBtnHighlightText}>{t('Book Puja')}</Text>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </View>
            );
          })()}

          {/* Section 3: Personalized Recommendation Card */}
          {preferenceSelector !== 'All' && (() => {
            const activeRashiId = getActiveRashi();
            const rec = RASHI_GUIDANCE_DB[activeRashiId];
            if (!rec) return null;

            // Find all matching Vrats for this Rashi
            const rashiVrats = vratHubData.filter(vrat => 
              rec.recommendedVratIds.some(vratId => doesVratMatchRashiRule(vrat, vratId))
            );

            // Sort them by closeness to selectedDate
            const sortedRashiVrats = [...rashiVrats].sort((a, b) => {
              const aDate = new Date(a.dateKey + 'T12:00:00');
              const bDate = new Date(b.dateKey + 'T12:00:00');
              const diffA = Math.abs(aDate.getTime() - selectedDate.getTime());
              const diffB = Math.abs(bDate.getTime() - selectedDate.getTime());
              return diffA - diffB;
            });

            const primaryVrat = sortedRashiVrats[0];

            return (
              <Reanimated.View entering={FadeInDown.duration(400)} style={[styles.rashiDetailsContainer, { marginVertical: 12 }]}>
                <Text style={styles.recommendationTitle}>🔮 {t('Personal Guidance for')} {t(preferenceSelector)}</Text>

                {primaryVrat ? (
                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.rashiPujaListHeader}>✨ {t('Recommended Rashi Vrat & Fast')}</Text>
                    
                    {/* Render the Vrat card inline */}
                    {(() => {
                      const vrat = primaryVrat;
                      const isExpanded = !!expandedVrats[vrat.id];
                      const isSaved = savedVrats.includes(vrat.id);

                      return (
                        <View style={[styles.vratCardItem, isExpanded && styles.vratCardItemExpanded, { borderWidth: 1.5, borderColor: '#FF9500' }]}>
                          {/* Collapsed Card Header */}
                          <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => toggleExpandVrat(vrat.id)}
                            style={styles.vratCardHeader}
                          >
                            <View style={styles.vratCardLeftRow}>
                              <Image source={vrat.asset} style={styles.vratDeityImage} />
                              <View style={styles.vratTitleBlock}>
                                <View style={styles.vratTagRow}>
                                  <Text style={styles.vratTypeTag}>{t(vrat.type)}</Text>
                                  <Text style={[
                                    styles.vratImportanceTag,
                                    { color: '#FF7A00', backgroundColor: 'rgba(255, 122, 0, 0.12)', borderColor: '#FF7A00', borderWidth: 0.5 }
                                  ]}>
                                    ✨ {t('Recommended Fast')}
                                  </Text>
                                </View>
                                <Text style={styles.vratCardTitleText}>{t(vrat.title)}</Text>
                                <Text style={styles.vratCardDateText}>📅 {t(vrat.dateStr)} • {t(vrat.deityLabel)}</Text>
                              </View>
                            </View>
                            <View style={styles.vratCardRightActions}>
                              <TouchableOpacity
                                style={styles.collapsedReminderBtn}
                                onPress={(e) => {
                                  e.stopPropagation();
                                  handleSetReminder(vrat);
                                }}
                              >
                                <Ionicons name="notifications-outline" size={16} color="#FF9500" />
                              </TouchableOpacity>
                              <Ionicons
                                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                size={20}
                                color="rgba(255, 255, 255, 0.45)"
                                style={{ marginLeft: 8 }}
                              />
                            </View>
                          </TouchableOpacity>

                          {!isExpanded && (
                            <Text style={styles.vratOneLiner} numberOfLines={2}>
                              {t(vrat.oneLiner)}
                            </Text>
                          )}

                          {/* Expanded Details Panel with parent accordion */}
                          {isExpanded && (
                            <Reanimated.View entering={FadeIn.duration(300)} style={styles.vratDetailedPanel}>
                              <Text style={styles.vratExpandedDesc}>{t(vrat.desc)}</Text>

                              {/* Parent Accordion */}
                              <View style={styles.parentAccordionContainer}>
                                <TouchableOpacity
                                  style={styles.parentAccordionHeader}
                                  onPress={() => toggleSubSection(vrat.id, 'allRitualDetails')}
                                >
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Ionicons name="book-outline" size={18} color="#FF9500" />
                                    <Text style={styles.parentAccordionTitle}>
                                      {t('View Fasting Rules, Rituals & Katha')}
                                    </Text>
                                  </View>
                                  <Ionicons
                                    name={isSubSectionExpanded(vrat.id, 'allRitualDetails') ? 'chevron-up' : 'chevron-down'}
                                    size={18}
                                    color="#FF9500"
                                  />
                                </TouchableOpacity>

                                {isSubSectionExpanded(vrat.id, 'allRitualDetails') && (
                                  <Reanimated.View entering={FadeIn.duration(200)} style={styles.parentAccordionContent}>
                                    {/* 1. Why Perform */}
                                    <View style={styles.subAccordionContainer}>
                                      <TouchableOpacity
                                        style={styles.subAccordionHeader}
                                        onPress={() => toggleSubSection(vrat.id, 'whyObserve')}
                                      >
                                        <Text style={styles.subAccordionTitle}>✨ {t('Why Perform This Vrat')}</Text>
                                        <Ionicons
                                          name={isSubSectionExpanded(vrat.id, 'whyObserve') ? 'chevron-up' : 'chevron-down'}
                                          size={16}
                                          color="#FF9500"
                                        />
                                      </TouchableOpacity>
                                      {isSubSectionExpanded(vrat.id, 'whyObserve') && (
                                        <View style={styles.subAccordionBody}>
                                          <Text style={styles.subDetailItem}><Text style={styles.subDetailLabel}>{t('Spiritual Importance')}:</Text> {t(vrat.whyObserve.spiritualImportance)}</Text>
                                          <Text style={styles.subDetailItem}><Text style={styles.subDetailLabel}>{t('Religious Significance')}:</Text> {t(vrat.whyObserve.religiousSignificance)}</Text>
                                          <Text style={styles.subDetailItem}><Text style={styles.subDetailLabel}>{t('Scriptural References')}:</Text> {t(vrat.whyObserve.scripturalReferences)}</Text>
                                        </View>
                                      )}
                                    </View>

                                    {/* 2. Benefits */}
                                    <View style={styles.subAccordionContainer}>
                                      <TouchableOpacity
                                        style={styles.subAccordionHeader}
                                        onPress={() => toggleSubSection(vrat.id, 'benefits')}
                                      >
                                        <Text style={styles.subAccordionTitle}>🏆 {t('Benefits')}</Text>
                                        <Ionicons
                                          name={isSubSectionExpanded(vrat.id, 'benefits') ? 'chevron-up' : 'chevron-down'}
                                          size={16}
                                          color="#FF9500"
                                        />
                                      </TouchableOpacity>
                                      {isSubSectionExpanded(vrat.id, 'benefits') && (
                                        <View style={styles.subAccordionBody}>
                                          <Text style={styles.subDetailItem}><Text style={styles.subDetailLabel}>🧠 {t('Mental Benefits')}:</Text> {t(vrat.benefits.mental)}</Text>
                                          <Text style={styles.subDetailItem}><Text style={styles.subDetailLabel}>✨ {t('Spiritual Benefits')}:</Text> {t(vrat.benefits.spiritual)}</Text>
                                          <Text style={styles.subDetailItem}><Text style={styles.subDetailLabel}>👨‍👩‍👧‍👦 {t('Family Benefits')}:</Text> {t(vrat.benefits.family)}</Text>
                                          <Text style={styles.subDetailItem}><Text style={styles.subDetailLabel}>💰 {t('Financial Prosperity')}:</Text> {t(vrat.benefits.financial)}</Text>
                                          <Text style={styles.subDetailItem}><Text style={styles.subDetailLabel}>❤️ {t('Health Beliefs')}:</Text> {t(vrat.benefits.health)}</Text>
                                        </View>
                                      )}
                                    </View>

                                    {/* 3. How To Perform */}
                                    <View style={styles.subAccordionContainer}>
                                      <TouchableOpacity
                                        style={styles.subAccordionHeader}
                                        onPress={() => toggleSubSection(vrat.id, 'howToPerform')}
                                      >
                                        <Text style={styles.subAccordionTitle}>📿 {t('How To Perform')}</Text>
                                        <Ionicons
                                          name={isSubSectionExpanded(vrat.id, 'howToPerform') ? 'chevron-up' : 'chevron-down'}
                                          size={16}
                                          color="#FF9500"
                                        />
                                      </TouchableOpacity>
                                      {isSubSectionExpanded(vrat.id, 'howToPerform') && (
                                        <View style={styles.subAccordionBody}>
                                          <Text style={styles.subDetailItem}><Text style={styles.subDetailLabel}>{t('Preparation steps')}:</Text> {t(vrat.howToPerform.preparation)}</Text>
                                          <Text style={styles.subDetailItem}><Text style={styles.subDetailLabel}>{t('Morning rituals')}:</Text> {t(vrat.howToPerform.morningRituals)}</Text>
                                          <Text style={styles.subDetailItem}><Text style={styles.subDetailLabel}>{t('Puja process')}:</Text> {t(vrat.howToPerform.pujaProcess)}</Text>
                                          <Text style={styles.subDetailItem}><Text style={styles.subDetailLabel}>{t('Sankalp process')}:</Text> {t(vrat.howToPerform.sankalpProcess)}</Text>
                                          <Text style={styles.subDetailItem}><Text style={styles.subDetailLabel}>{t('Evening rituals')}:</Text> {t(vrat.howToPerform.eveningRituals)}</Text>
                                          <Text style={styles.subDetailItem}><Text style={styles.subDetailLabel}>{t('Completion process')}:</Text> {t(vrat.howToPerform.completionProcess)}</Text>
                                        </View>
                                      )}
                                    </View>

                                    {/* 4. Food Guidelines */}
                                    <View style={styles.subAccordionContainer}>
                                      <TouchableOpacity
                                        style={styles.subAccordionHeader}
                                        onPress={() => toggleSubSection(vrat.id, 'foodGuidelines')}
                                      >
                                        <Text style={styles.subAccordionTitle}>🍎 {t('Food Guidelines')}</Text>
                                        <Ionicons
                                          name={isSubSectionExpanded(vrat.id, 'foodGuidelines') ? 'chevron-up' : 'chevron-down'}
                                          size={16}
                                          color="#FF9500"
                                        />
                                      </TouchableOpacity>
                                      {isSubSectionExpanded(vrat.id, 'foodGuidelines') && (
                                        <View style={styles.subAccordionBody}>
                                          <Text style={styles.subDetailLabel}>✅ {t('Allowed Foods')}:</Text>
                                          {vrat.foodGuidelines.allowed.map((f, idx) => (
                                            <Text key={idx} style={styles.dietBulletText}>• {t(f)}</Text>
                                          ))}
                                          <Text style={[styles.subDetailLabel, { marginTop: 10 }]}>❌ {t('Restricted Foods')}:</Text>
                                          {vrat.foodGuidelines.restricted.map((f, idx) => (
                                            <Text key={idx} style={styles.dietBulletText}>• {t(f)}</Text>
                                          ))}
                                          <Text style={styles.subDetailItem}><Text style={styles.subDetailLabel}>{t('Recommended Fasting Method')}:</Text> {t(vrat.foodGuidelines.method)}</Text>
                                        </View>
                                      )}
                                    </View>

                                    {/* 5. Mantras & Prayers */}
                                    <View style={styles.subAccordionContainer}>
                                      <TouchableOpacity
                                        style={styles.subAccordionHeader}
                                        onPress={() => toggleSubSection(vrat.id, 'mantrasPrayers')}
                                      >
                                        <Text style={styles.subAccordionTitle}>🕉️ {t('Mantras & Prayers')}</Text>
                                        <Ionicons
                                          name={isSubSectionExpanded(vrat.id, 'mantrasPrayers') ? 'chevron-up' : 'chevron-down'}
                                          size={16}
                                          color="#FF9500"
                                        />
                                      </TouchableOpacity>
                                      {isSubSectionExpanded(vrat.id, 'mantrasPrayers') && (
                                        <View style={styles.subAccordionBody}>
                                          <Text style={styles.subDetailLabel}>{t('Relevant Mantras')}:</Text>
                                          {vrat.mantrasPrayers.mantras.map((m, idx) => (
                                            <Text key={idx} style={styles.mantraVerse}>🕉️ "{m}"</Text>
                                          ))}
                                          <Text style={styles.subDetailItem}><Text style={styles.subDetailLabel}>{t('Aarti recommendations')}:</Text> {t(vrat.mantrasPrayers.aarti)}</Text>
                                          <Text style={styles.subDetailItem}><Text style={styles.subDetailLabel}>{t('Chanting guidance')}:</Text> {t(vrat.mantrasPrayers.chantingGuidance)}</Text>
                                        </View>
                                      )}
                                    </View>

                                    {/* 6. Puja Timings */}
                                    <View style={styles.subAccordionContainer}>
                                      <TouchableOpacity
                                        style={styles.subAccordionHeader}
                                        onPress={() => toggleSubSection(vrat.id, 'pujaTimings')}
                                      >
                                        <Text style={styles.subAccordionTitle}>⏱️ {t('Puja Timings')}</Text>
                                        <Ionicons
                                          name={isSubSectionExpanded(vrat.id, 'pujaTimings') ? 'chevron-up' : 'chevron-down'}
                                          size={16}
                                          color="#FF9500"
                                        />
                                      </TouchableOpacity>
                                      {isSubSectionExpanded(vrat.id, 'pujaTimings') && (
                                        <View style={styles.subAccordionBody}>
                                          <Text style={styles.subDetailItem}><Text style={styles.subDetailLabel}>{t('Auspicious time')}:</Text> {t(vrat.pujaTimings.auspicious)}</Text>
                                          <Text style={styles.subDetailItem}><Text style={styles.subDetailLabel}>{t('Paran time')}:</Text> {t(vrat.pujaTimings.paran)}</Text>
                                          <Text style={styles.subDetailItem}><Text style={styles.subDetailLabel}>{t('Puja muhurat')}:</Text> {t(vrat.pujaTimings.muhurat)}</Text>
                                        </View>
                                      )}
                                    </View>

                                    {/* 7. Vrat Katha */}
                                    <View style={styles.subAccordionContainer}>
                                      <TouchableOpacity
                                        style={styles.subAccordionHeader}
                                        onPress={() => toggleSubSection(vrat.id, 'vratKatha')}
                                      >
                                        <Text style={styles.subAccordionTitle}>📖 {t('Vrat Katha')}</Text>
                                        <Ionicons
                                          name={isSubSectionExpanded(vrat.id, 'vratKatha') ? 'chevron-up' : 'chevron-down'}
                                          size={16}
                                          color="#FF9500"
                                        />
                                      </TouchableOpacity>
                                      {isSubSectionExpanded(vrat.id, 'vratKatha') && (
                                        <View style={styles.subAccordionBody}>
                                          <Text style={styles.kathaBodyText}>{t(vrat.vratKatha)}</Text>
                                        </View>
                                      )}
                                    </View>
                                  </Reanimated.View>
                                )}
                              </View>

                              {/* Quick Actions */}
                              <View style={styles.quickActionsChipsContainer}>
                                <Text style={styles.quickActionsTitle}>{t('Quick Spiritual Actions')}</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionChipsScroll}>
                                  <TouchableOpacity
                                    style={styles.actionChipPill}
                                    onPress={() => router.push(vrat.recommendedPuja.route as any)}
                                  >
                                    <Ionicons name="rose-outline" size={14} color="#FF9500" />
                                    <Text style={styles.actionChipText}>{t('Book Puja')}</Text>
                                  </TouchableOpacity>

                                  <TouchableOpacity
                                    style={styles.actionChipPill}
                                    onPress={() => handleSetReminder(vrat)}
                                  >
                                    <Ionicons name="notifications-outline" size={14} color="#FF9500" />
                                    <Text style={styles.actionChipText}>{t('Set Reminder')}</Text>
                                  </TouchableOpacity>

                                  <TouchableOpacity
                                    style={styles.actionChipPill}
                                    onPress={() => handleShareVrat(vrat)}
                                  >
                                    <Ionicons name="share-social-outline" size={14} color="#FF9500" />
                                    <Text style={styles.actionChipText}>{t('Share')}</Text>
                                  </TouchableOpacity>
                                </ScrollView>
                              </View>
                            </Reanimated.View>
                          )}
                        </View>
                      );
                    })()}
                  </View>
                ) : null}

                {/* Multiple Recommended Pujas list */}
                <Text style={styles.rashiPujaListHeader}>🌺 {t('Recommended Pujas for Planetary Peace')}</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.rashiPujasScrollContent}
                >
                  {rec.pujas.map((puja, index) => (
                    <View key={index} style={styles.rashiPujaCardItem}>
                      <Image source={puja.image} style={styles.rashiPujaCardImage} />
                      <View style={styles.rashiPujaCardBody}>
                        <Text style={styles.rashiPujaCardName} numberOfLines={1}>{t(puja.name)}</Text>
                        <Text style={styles.rashiPujaCardPurpose} numberOfLines={2}>{t(puja.purpose)}</Text>
                        <View style={styles.rashiPujaCardMeta}>
                          <Text style={styles.rashiPujaCardMetaText}>⏱️ {t(puja.duration)}</Text>
                          <Text style={styles.rashiPujaCardMetaText}>💰 {t(puja.price)}</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.rashiPujaCardBtn}
                          onPress={() => router.push(puja.route as any)}
                        >
                          <LinearGradient colors={['#FF9500', '#FF7A00']} style={styles.rashiPujaCardBtnGrad}>
                            <Text style={styles.rashiPujaCardBtnText}>{t('Book Puja')}</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </Reanimated.View>
            );
          })()}

          {/* Section 4: Upcoming Vrats Section */}
          <Text style={styles.vratHubHeaderTitle}>{t('Upcoming Vrats & Fasts')}</Text>
          {filteredVrats.length === 0 ? (
            <View style={styles.emptyFastingCard}>
              <Text style={styles.emptyFastingText}>{t('No fasting guides match the selected filters.')}</Text>
            </View>
          ) : (
            <View>
              {(showAllVrats ? filteredVrats : filteredVrats.slice(0, 3)).map(vrat => {
                const isExpanded = !!expandedVrats[vrat.id];
                const isSaved = savedVrats.includes(vrat.id);
                
                const rashiRec = RASHI_GUIDANCE_DB[selectedRashi];
                const isRashiRecommended = rashiRec && rashiRec.recommendedVratIds.some(vratId => doesVratMatchRashiRule(vrat, vratId));

                return (
                  <View key={vrat.id} style={[styles.vratCardItem, isExpanded && styles.vratCardItemExpanded]}>
                  {/* Collapsed Card Header */}
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => toggleExpandVrat(vrat.id)}
                    style={styles.vratCardHeader}
                  >
                    <View style={styles.vratCardLeftRow}>
                      <Image source={vrat.asset} style={styles.vratDeityImage} />
                      <View style={styles.vratTitleBlock}>
                        <View style={styles.vratTagRow}>
                          <Text style={styles.vratTypeTag}>{t(vrat.type)}</Text>
                          <Text style={[
                            styles.vratImportanceTag,
                            vrat.importance === 'high' && { color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.12)' },
                            vrat.importance === 'medium' && { color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.12)' },
                          ]}>
                            {vrat.importance === 'high' ? t('High 🔥') : vrat.importance === 'medium' ? t('Medium ⭐') : t('Normal 🍃')}
                          </Text>
                          {isRashiRecommended && (
                            <Text style={[
                              styles.vratImportanceTag,
                              { color: '#FF7A00', backgroundColor: 'rgba(255, 122, 0, 0.12)', borderColor: '#FF7A00', borderWidth: 0.5 }
                            ]}>
                              ✨ {t('Recommended')}
                            </Text>
                          )}
                          {isSaved && (
                            <View style={styles.savedVratBadge}>
                              <Ionicons name="bookmark" size={10} color="#FF9500" />
                            </View>
                          )}
                        </View>
                        <Text style={styles.vratCardTitleText}>{t(vrat.title)}</Text>
                        <Text style={styles.vratCardDateText}>📅 {t(vrat.dateStr)} • {t(vrat.deityLabel)}</Text>
                      </View>
                    </View>
                    <View style={styles.vratCardRightActions}>
                      <TouchableOpacity
                        style={styles.collapsedReminderBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleSetReminder(vrat);
                        }}
                      >
                        <Ionicons name="notifications-outline" size={16} color="#FF9500" />
                      </TouchableOpacity>
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color="rgba(255, 255, 255, 0.45)"
                        style={{ marginLeft: 8 }}
                      />
                    </View>
                  </TouchableOpacity>

                  {!isExpanded && (
                    <Text style={styles.vratOneLiner} numberOfLines={2}>
                      {t(vrat.oneLiner)}
                    </Text>
                  )}

                  {/* Expanded Knowledge Details Panel */}
                  {isExpanded && (
                    <Reanimated.View entering={FadeIn.duration(300)} style={styles.vratDetailedPanel}>
                      <Text style={styles.vratExpandedDesc}>{t(vrat.desc)}</Text>

                      {/* Parent Accordion */}
                      <View style={styles.parentAccordionContainer}>
                        <TouchableOpacity
                          style={styles.parentAccordionHeader}
                          onPress={() => toggleSubSection(vrat.id, 'allRitualDetails')}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Ionicons name="book-outline" size={18} color="#FF9500" />
                            <Text style={styles.parentAccordionTitle}>
                              {t('View Fasting Rules, Rituals & Katha')}
                            </Text>
                          </View>
                          <Ionicons
                            name={isSubSectionExpanded(vrat.id, 'allRitualDetails') ? 'chevron-up' : 'chevron-down'}
                            size={18}
                            color="#FF9500"
                          />
                        </TouchableOpacity>

                        {isSubSectionExpanded(vrat.id, 'allRitualDetails') && (
                          <Reanimated.View entering={FadeIn.duration(200)} style={styles.parentAccordionContent}>
                            {/* 1. Why Perform This Vrat */}
                            <View style={styles.subAccordionContainer}>
                              <TouchableOpacity
                                style={styles.subAccordionHeader}
                                onPress={() => toggleSubSection(vrat.id, 'whyObserve')}
                              >
                                <Text style={styles.subAccordionTitle}>✨ {t('Why Perform This Vrat')}</Text>
                                <Ionicons
                                  name={isSubSectionExpanded(vrat.id, 'whyObserve') ? 'chevron-up' : 'chevron-down'}
                                  size={16}
                                  color="#FF9500"
                                />
                              </TouchableOpacity>
                              {isSubSectionExpanded(vrat.id, 'whyObserve') && (
                                <View style={styles.subAccordionBody}>
                                  <Text style={styles.subDetailItem}><Text style={styles.subDetailLabel}>{t('Spiritual Importance')}:</Text> {t(vrat.whyObserve.spiritualImportance)}</Text>
                                  <Text style={styles.subDetailItem}><Text style={styles.subDetailLabel}>{t('Religious Significance')}:</Text> {t(vrat.whyObserve.religiousSignificance)}</Text>
                                  <Text style={styles.subDetailItem}><Text style={styles.subDetailLabel}>{t('Scriptural References')}:</Text> {t(vrat.whyObserve.scripturalReferences)}</Text>
                                </View>
                              )}
                            </View>

                            {/* 2. Benefits */}
                            <View style={styles.subAccordionContainer}>
                              <TouchableOpacity
                                style={styles.subAccordionHeader}
                                onPress={() => toggleSubSection(vrat.id, 'benefits')}
                              >
                                <Text style={styles.subAccordionTitle}>🏆 {t('Benefits')}</Text>
                                <Ionicons
                                  name={isSubSectionExpanded(vrat.id, 'benefits') ? 'chevron-up' : 'chevron-down'}
                                  size={16}
                                  color="#FF9500"
                                />
                              </TouchableOpacity>
                              {isSubSectionExpanded(vrat.id, 'benefits') && (
                                <View style={styles.subAccordionBody}>
                                  <Text style={styles.subDetailItem}><Text style={styles.subDetailLabel}>🧠 {t('Mental Benefits')}:</Text> {t(vrat.benefits.mental)}</Text>
                                  <Text style={styles.subDetailItem}><Text style={styles.subDetailLabel}>✨ {t('Spiritual Benefits')}:</Text> {t(vrat.benefits.spiritual)}</Text>
                                  <Text style={styles.subDetailItem}><Text style={styles.subDetailLabel}>👨‍👩‍👧‍👦 {t('Family Benefits')}:</Text> {t(vrat.benefits.family)}</Text>
                                  <Text style={styles.subDetailItem}><Text style={styles.subDetailLabel}>💰 {t('Financial Prosperity')}:</Text> {t(vrat.benefits.financial)}</Text>
                                  <Text style={styles.subDetailItem}><Text style={styles.subDetailLabel}>❤️ {t('Health Beliefs')}:</Text> {t(vrat.benefits.health)}</Text>
                                </View>
                              )}
                            </View>

                            {/* 3. How To Perform */}
                            <View style={styles.subAccordionContainer}>
                              <TouchableOpacity
                                style={styles.subAccordionHeader}
                                onPress={() => toggleSubSection(vrat.id, 'howToPerform')}
                              >
                                <Text style={styles.subAccordionTitle}>📿 {t('How To Perform')}</Text>
                                <Ionicons
                                  name={isSubSectionExpanded(vrat.id, 'howToPerform') ? 'chevron-up' : 'chevron-down'}
                                  size={16}
                                  color="#FF9500"
                                />
                              </TouchableOpacity>
                              {isSubSectionExpanded(vrat.id, 'howToPerform') && (
                                <View style={styles.subAccordionBody}>
                                  <Text style={styles.subDetailItem}><Text style={styles.subDetailLabel}>{t('Preparation steps')}:</Text> {t(vrat.howToPerform.preparation)}</Text>
                                  <Text style={styles.subDetailItem}><Text style={styles.subDetailLabel}>{t('Morning rituals')}:</Text> {t(vrat.howToPerform.morningRituals)}</Text>
                                  <Text style={styles.subDetailItem}><Text style={styles.subDetailLabel}>{t('Puja process')}:</Text> {t(vrat.howToPerform.pujaProcess)}</Text>
                                  <Text style={styles.subDetailItem}><Text style={styles.subDetailLabel}>{t('Sankalp process')}:</Text> {t(vrat.howToPerform.sankalpProcess)}</Text>
                                  <Text style={styles.subDetailItem}><Text style={styles.subDetailLabel}>{t('Evening rituals')}:</Text> {t(vrat.howToPerform.eveningRituals)}</Text>
                                  <Text style={styles.subDetailItem}><Text style={styles.subDetailLabel}>{t('Completion process')}:</Text> {t(vrat.howToPerform.completionProcess)}</Text>
                                </View>
                              )}
                            </View>

                            {/* 4. Food Guidelines */}
                            <View style={styles.subAccordionContainer}>
                              <TouchableOpacity
                                style={styles.subAccordionHeader}
                                onPress={() => toggleSubSection(vrat.id, 'foodGuidelines')}
                              >
                                <Text style={styles.subAccordionTitle}>🍎 {t('Food Guidelines')}</Text>
                                <Ionicons
                                  name={isSubSectionExpanded(vrat.id, 'foodGuidelines') ? 'chevron-up' : 'chevron-down'}
                                  size={16}
                                  color="#FF9500"
                                />
                              </TouchableOpacity>
                              {isSubSectionExpanded(vrat.id, 'foodGuidelines') && (
                                <View style={styles.subAccordionBody}>
                                  <Text style={styles.subDetailLabel}>✅ {t('Allowed Foods')}:</Text>
                                  {vrat.foodGuidelines.allowed.map((f, idx) => (
                                    <Text key={idx} style={styles.dietBulletText}>• {t(f)}</Text>
                                  ))}
                                  <Text style={[styles.subDetailLabel, { marginTop: 10 }]}>❌ {t('Restricted Foods')}:</Text>
                                  {vrat.foodGuidelines.restricted.map((f, idx) => (
                                    <Text key={idx} style={styles.dietBulletText}>• {t(f)}</Text>
                                  ))}
                                  <Text style={styles.subDetailItem}><Text style={styles.subDetailLabel}>{t('Recommended Fasting Method')}:</Text> {t(vrat.foodGuidelines.method)}</Text>
                                </View>
                              )}
                            </View>

                            {/* 5. Mantras & Prayers */}
                            <View style={styles.subAccordionContainer}>
                              <TouchableOpacity
                                style={styles.subAccordionHeader}
                                onPress={() => toggleSubSection(vrat.id, 'mantrasPrayers')}
                              >
                                <Text style={styles.subAccordionTitle}>🕉️ {t('Mantras & Prayers')}</Text>
                                <Ionicons
                                  name={isSubSectionExpanded(vrat.id, 'mantrasPrayers') ? 'chevron-up' : 'chevron-down'}
                                  size={16}
                                  color="#FF9500"
                                />
                              </TouchableOpacity>
                              {isSubSectionExpanded(vrat.id, 'mantrasPrayers') && (
                                <View style={styles.subAccordionBody}>
                                  <Text style={styles.subDetailLabel}>{t('Relevant Mantras')}:</Text>
                                  {vrat.mantrasPrayers.mantras.map((m, idx) => (
                                    <Text key={idx} style={styles.mantraVerse}>🕉️ "{m}"</Text>
                                  ))}
                                  <Text style={styles.subDetailItem}><Text style={styles.subDetailLabel}>{t('Aarti recommendations')}:</Text> {t(vrat.mantrasPrayers.aarti)}</Text>
                                  <Text style={styles.subDetailItem}><Text style={styles.subDetailLabel}>{t('Chanting guidance')}:</Text> {t(vrat.mantrasPrayers.chantingGuidance)}</Text>
                                </View>
                              )}
                            </View>

                            {/* 6. Puja Timings */}
                            <View style={styles.subAccordionContainer}>
                              <TouchableOpacity
                                style={styles.subAccordionHeader}
                                onPress={() => toggleSubSection(vrat.id, 'pujaTimings')}
                              >
                                <Text style={styles.subAccordionTitle}>⏱️ {t('Puja Timings')}</Text>
                                <Ionicons
                                  name={isSubSectionExpanded(vrat.id, 'pujaTimings') ? 'chevron-up' : 'chevron-down'}
                                  size={16}
                                  color="#FF9500"
                                />
                              </TouchableOpacity>
                              {isSubSectionExpanded(vrat.id, 'pujaTimings') && (
                                <View style={styles.subAccordionBody}>
                                  <Text style={styles.subDetailItem}><Text style={styles.subDetailLabel}>{t('Auspicious time')}:</Text> {t(vrat.pujaTimings.auspicious)}</Text>
                                  <Text style={styles.subDetailItem}><Text style={styles.subDetailLabel}>{t('Paran time')}:</Text> {t(vrat.pujaTimings.paran)}</Text>
                                  <Text style={styles.subDetailItem}><Text style={styles.subDetailLabel}>{t('Puja muhurat')}:</Text> {t(vrat.pujaTimings.muhurat)}</Text>
                                </View>
                              )}
                            </View>

                            {/* 7. Vrat Katha Accordion */}
                            <View style={styles.subAccordionContainer}>
                              <TouchableOpacity
                                style={styles.subAccordionHeader}
                                onPress={() => toggleSubSection(vrat.id, 'vratKatha')}
                              >
                                <Text style={styles.subAccordionTitle}>📖 {t('Vrat Katha')}</Text>
                                <Ionicons
                                  name={isSubSectionExpanded(vrat.id, 'vratKatha') ? 'chevron-up' : 'chevron-down'}
                                  size={16}
                                  color="#FF9500"
                                />
                              </TouchableOpacity>
                              {isSubSectionExpanded(vrat.id, 'vratKatha') && (
                                <View style={styles.subAccordionBody}>
                                  <Text style={styles.kathaBodyText}>{t(vrat.vratKatha)}</Text>
                                </View>
                              )}
                            </View>
                          </Reanimated.View>
                        )}
                      </View>

                      {/* RECOMMENDED PUJA SECTION */}
                      <View style={styles.pujaRecommendationSection}>
                        <Text style={styles.recommendationTitle}>🌺 {t('Recommended Puja For This Vrat')}</Text>
                        <View style={styles.marketplacePujaCard}>
                          <View style={styles.marketplacePujaRow}>
                            <Image source={vrat.recommendedPuja.image} style={styles.marketplacePujaImage} />
                            <View style={styles.marketplacePujaInfo}>
                              <Text style={styles.marketplacePujaName}>{t(vrat.recommendedPuja.name)}</Text>
                              <Text style={styles.marketplacePujaPurpose}>{t(vrat.recommendedPuja.purpose)}</Text>
                              <View style={styles.marketplacePujaMeta}>
                                <Text style={styles.marketplaceMetaText}>⏱️ {t(vrat.recommendedPuja.duration)}</Text>
                                <Text style={styles.marketplaceMetaText}>💰 {t(vrat.recommendedPuja.price)}</Text>
                              </View>
                            </View>
                          </View>
                          <TouchableOpacity
                            style={styles.marketplaceBookBtn}
                            onPress={() => router.push(vrat.recommendedPuja.route as any)}
                          >
                            <LinearGradient colors={['#FF9500', '#F56B00']} style={styles.marketplaceBtnGradient}>
                              <Text style={styles.marketplaceBtnText}>{t('Book Now')}</Text>
                            </LinearGradient>
                          </TouchableOpacity>
                        </View>
                      </View>



                      {/* QUICK SPIRITUAL ACTIONS */}
                      <View style={styles.quickActionsChipsContainer}>
                        <Text style={styles.quickActionsTitle}>{t('Quick Spiritual Actions')}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionChipsScroll}>
                          <TouchableOpacity
                            style={styles.actionChipPill}
                            onPress={() => router.push(vrat.recommendedPuja.route as any)}
                          >
                            <Ionicons name="rose-outline" size={14} color="#FF9500" />
                            <Text style={styles.actionChipText}>{t('Book Puja')}</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.actionChipPill}
                            onPress={() => handleSetReminder(vrat)}
                          >
                            <Ionicons name="notifications-outline" size={14} color="#FF9500" />
                            <Text style={styles.actionChipText}>{t('Set Reminder')}</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.actionChipPill, isSaved && styles.actionChipPillActive]}
                            onPress={() => toggleSaveVrat(vrat.id)}
                          >
                            <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={14} color={isSaved ? "#ffffff" : "#FF9500"} />
                            <Text style={[styles.actionChipText, isSaved && styles.actionChipTextActive]}>{isSaved ? t('Saved') : t('Save Vrat')}</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.actionChipPill}
                            onPress={() => Alert.alert(t('Calendar Sync'), t('Fasting date has been marked on your system calendar.'))}
                          >
                            <Ionicons name="calendar-outline" size={14} color="#FF9500" />
                            <Text style={styles.actionChipText}>{t('Add To Cal')}</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.actionChipPill}
                            onPress={() => handleShareVrat(vrat)}
                          >
                            <Ionicons name="share-social-outline" size={14} color="#FF9500" />
                            <Text style={styles.actionChipText}>{t('Share')}</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.actionChipPill}
                            onPress={() => Alert.alert(t(vrat.deityLabel), `${t('You can offer daily flowers or perform special pujas for')} ${t(vrat.deityLabel)} ${t('on this page.')}`)}
                          >
                            <Ionicons name="eye-outline" size={14} color="#FF9500" />
                            <Text style={styles.actionChipText}>{t('View Deity')}</Text>
                          </TouchableOpacity>
                        </ScrollView>
                      </View>
                    </Reanimated.View>
                  )}
                </View>
              );
            })}
            
            {filteredVrats.length > 3 && (
              <TouchableOpacity
                style={styles.showMoreVratsBtn}
                onPress={() => setShowAllVrats(!showAllVrats)}
              >
                <LinearGradient colors={['rgba(255, 149, 0, 0.08)', 'rgba(255, 122, 0, 0.03)']} style={styles.showMoreVratsGradient}>
                  <Text style={styles.showMoreVratsText}>
                    {showAllVrats ? t('Show Less Fasts ⌃') : t('Show More Fasts ⌄')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

        {/* ==================== 2. MAIN REGULAR CALENDAR EXPERIENCE ==================== */}
        
        {/* INTERACTIVE MONTH NAVIGATION */}
        <View style={styles.calendarCard}>
          <View style={styles.monthNavRow}>
            <TouchableOpacity style={styles.monthNavBtn} onPress={handlePrevMonth}>
              <Ionicons name="chevron-back-outline" size={20} color="#FF7A00" />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{getMonthAndYearString(currentDate)}</Text>
            <TouchableOpacity style={styles.monthNavBtn} onPress={handleNextMonth}>
              <Ionicons name="chevron-forward-outline" size={20} color="#FF7A00" />
            </TouchableOpacity>
          </View>

          {/* WEEKDAYS LABELS */}
          <View style={styles.weekdaysRow}>
            {WEEKDAYS.map((wd, index) => (
              <Text key={index} style={styles.weekdayLabel}>{wd}</Text>
            ))}
          </View>

          {/* DATES GRID */}
          <View style={styles.daysGrid}>
            {generateMonthDays().map((cell, index) => {
              const isToday = cell.dateString === getFormattedDate(new Date());
              const isSelected = cell.dateString === getFormattedDate(selectedDate);
              const dayReminders = getRemindersForDate(cell.dateString);
              const dayFestivals = getFestivalForDate(cell.dateString);

              const hasReminder = dayReminders.length > 0;
              const hasFestival = dayFestivals.length > 0;

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCell,
                    !cell.isCurrentMonth && styles.dayCellOutOfMonth,
                    isSelected && styles.dayCellSelected,
                  ]}
                  onPress={() => setSelectedDate(new Date(cell.dateString + 'T12:00:00'))}
                >
                  {isToday ? (
                    <LinearGradient
                      colors={['#FF9500', '#F56B00']}
                      style={styles.todayGradient}
                    >
                      <Text style={[styles.dayText, styles.dayTextToday]}>{cell.dayNum}</Text>
                    </LinearGradient>
                  ) : (
                    <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{cell.dayNum}</Text>
                  )}

                  {/* Indicator badges */}
                  <View style={styles.indicatorsRow}>
                    {hasFestival && (
                      <View style={styles.festivalIndicator}>
                        <Text style={styles.festivalDot}>🌸</Text>
                      </View>
                    )}
                    {hasReminder && <View style={styles.reminderDot} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* TABS SEGMENTS SELECTOR */}
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeSegment === 'panchang' && styles.segmentBtnActive]}
            onPress={() => setActiveSegment('panchang')}
          >
            <Text style={[styles.segmentText, activeSegment === 'panchang' && styles.segmentTextActive]}>
              ✨ {t('Panchang & Deity Puja')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, activeSegment === 'reminders' && styles.segmentBtnActive]}
            onPress={() => setActiveSegment('reminders')}
          >
            <Text style={[styles.segmentText, activeSegment === 'reminders' && styles.segmentTextActive]}>
              🔔 {t('Personal Reminders')}
            </Text>
          </TouchableOpacity>
        </View>

        {activeSegment === 'panchang' ? (
          <View>
            {/* DEITY JAYANTI / ARADHANA CARD */}
            {deityCardInfo && (
              <Reanimated.View entering={FadeInDown.duration(400)} style={styles.deityCard}>
                <LinearGradient
                  colors={['rgba(255, 149, 0, 0.12)', 'rgba(245, 107, 0, 0.05)']}
                  style={styles.deityCardBg}
                >
                  <View style={styles.deityCardContent}>
                    <View style={styles.deityImageWrapper}>
                      {deityCardInfo.asset ? (
                        <View style={styles.deityAssetContainer}>
                          {/* Saffron Glow Background layer */}
                          <View style={styles.deityGlowCircle} />
                          <Reanimated.Image
                            source={deityCardInfo.asset}
                            style={styles.deityIllustration}
                          />
                        </View>
                      ) : (
                        <Text style={styles.deityGenericIcon}>🕉️</Text>
                      )}
                    </View>
                    <View style={styles.deityInfoWrapper}>
                      <View style={styles.tagRow}>
                        <Text style={styles.deityCardTag}>
                          {hasFestivalOnSelectedDate ? t('Auspicious Festival') : t('Weekday Devotion')}
                        </Text>
                      </View>
                      <Text style={styles.deityCardTitle}>{t(deityCardInfo.title)}</Text>
                      <Text style={styles.deityCardDesc}>{t(deityCardInfo.desc)}</Text>

                      <View style={styles.deityCardActionRow}>
                        <TouchableOpacity
                          style={[styles.prayCTAButton, hasPrayedToday && styles.prayCTAButtonMuted]}
                          onPress={triggerPrayerReward}
                        >
                          <LinearGradient
                            colors={hasPrayedToday ? ['#64748b', '#475569'] : ['#FF9500', '#F56B00']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.prayCTAGradient}
                          >
                            <Ionicons name={hasPrayedToday ? "checkmark-done-circle-outline" : "rose-outline"} size={18} color="#ffffff" />
                            <Text style={styles.prayCTAText}>
                              {hasPrayedToday ? t('Prayed offered') : t('Offer Flowers (+5 🪙)')}
                            </Text>
                          </LinearGradient>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.prayCTAShare} onPress={() => handleShareFestival(deityCardInfo)}>
                          <Ionicons name="share-social-outline" size={18} color="#FF9500" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </LinearGradient>
                
                {/* Floating particle animations overlay */}
                {particles.map(p => (
                  <Animated.View
                    key={p.id}
                    style={{
                      position: 'absolute',
                      left: '45%',
                      bottom: '50%',
                      transform: [
                        { translateX: p.x },
                        { translateY: p.y },
                        { scale: p.scale }
                      ],
                      opacity: p.opacity,
                      zIndex: 9999,
                    }}
                  >
                    <Text style={{ fontSize: 24 }}>{p.symbol}</Text>
                  </Animated.View>
                ))}
              </Reanimated.View>
            )}

            {/* TODAY'S VRAT / FASTING CARD */}
            {vratInfo ? (
              <Reanimated.View entering={FadeInDown.duration(400).delay(100)} style={styles.vratCard}>
                <LinearGradient
                  colors={['rgba(255, 122, 0, 0.08)', 'rgba(255, 237, 213, 0.03)']}
                  style={styles.vratCardBg}
                >
                  <View style={styles.vratCardContent}>
                    <Text style={styles.vratCardIcon}>{vratInfo.icon}</Text>
                    <View style={styles.vratTextContent}>
                      <View style={styles.vratBadgeRow}>
                        <Text style={styles.vratBadgeText}>{t('Vrat & Fasting Today')}</Text>
                        <Text style={styles.vratDeityText}>🎯 {vratInfo.deity}</Text>
                      </View>
                      <Text style={styles.vratCardTitle}>{vratInfo.title}</Text>
                      <Text style={styles.vratCardRules}>{vratInfo.rules}</Text>
                    </View>
                  </View>
                </LinearGradient>
              </Reanimated.View>
            ) : (
              <Reanimated.View entering={FadeInDown.duration(400).delay(100)} style={styles.noVratCard}>
                <View style={styles.vratCardContent}>
                  <Text style={styles.vratCardIcon}>🌾</Text>
                  <View style={styles.vratTextContent}>
                    <Text style={styles.vratBadgeText}>{t('Fasting Schedule')}</Text>
                    <Text style={styles.vratCardTitle}>{t('No Mandatory Fast Today')}</Text>
                    <Text style={styles.vratCardRules}>
                      {t('No major fasts fall on this date. You may consume regular vegetarian foods and perform daily sandhya prayers.')}
                    </Text>
                  </View>
                </View>
              </Reanimated.View>
            )}

            {/* PERSONALIZED RASHI GUIDANCE FOR SELECTED DATE */}
            {preferenceSelector !== 'All' && (() => {
              const activeRashiId = getActiveRashi();
              const rec = RASHI_GUIDANCE_DB[activeRashiId];
              if (!rec) return null;
              const formattedSelDate = getFormattedDate(selectedDate);
              const matchingVrats = vratHubData.filter(v => 
                v.dateKey === formattedSelDate && 
                rec.recommendedVratIds.some(vratId => doesVratMatchRashiRule(v, vratId))
              );

              return (
                <Reanimated.View entering={FadeInDown.duration(400)} style={[styles.rashiDetailsContainer, { marginVertical: 12 }]}>
                  <Text style={styles.recommendationTitle}>🔮 {t('Recommended for Your Rashi on this Date')}</Text>
                  
                  {matchingVrats.length > 0 ? (
                    <View style={{ marginTop: 8 }}>
                      <Text style={[styles.rashiVratExplanationBody, { marginBottom: 10 }]}>
                        ✨ {t('This date is an auspicious fasting day recommended for your Rashi')} ({t(preferenceSelector)}).
                      </Text>
                      {matchingVrats.map(v => (
                        <TouchableOpacity
                          key={v.id}
                          style={[styles.vratCardItem, { borderWidth: 1, borderColor: '#FF9500', marginBottom: 12 }]}
                          onPress={() => toggleExpandVrat(v.id)}
                        >
                          <View style={[styles.vratCardHeader, { padding: 10 }]}>
                            <Image source={v.asset} style={[styles.vratDeityImage, { width: 32, height: 32 }]} />
                            <View style={{ flex: 1, marginLeft: 8 }}>
                              <Text style={[styles.vratCardTitleText, { fontSize: 13 }]}>{t(v.title)}</Text>
                              <Text style={[styles.vratCardDateText, { fontSize: 10 }]}>📅 {t(v.dateStr)}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={16} color="#FF9500" />
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <Text style={[styles.rashiVratExplanationBody, { marginVertical: 8 }]}>
                      {t('No specific recommended fasts for your Rashi fall on this date. You can perform daily prayers and any of the recommended Rashi pujas below:')}
                    </Text>
                  )}

                  <Text style={[styles.rashiPujaListHeader, { marginTop: 8 }]}>
                    🌺 {t('Recommended Rashi Pujas')}
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.rashiPujasScrollContent}
                  >
                    {rec.pujas.map((puja, index) => (
                      <View key={index} style={styles.rashiPujaCardItem}>
                        <Image source={puja.image} style={styles.rashiPujaCardImage} />
                        <View style={styles.rashiPujaCardBody}>
                          <Text style={styles.rashiPujaCardName} numberOfLines={1}>{t(puja.name)}</Text>
                          <Text style={styles.rashiPujaCardPurpose} numberOfLines={2}>{t(puja.purpose)}</Text>
                          <View style={styles.rashiPujaCardMeta}>
                            <Text style={styles.rashiPujaCardMetaText}>⏱️ {t(puja.duration)}</Text>
                            <Text style={styles.rashiPujaCardMetaText}>💰 {t(puja.price)}</Text>
                          </View>
                          <TouchableOpacity
                            style={styles.rashiPujaCardBtn}
                            onPress={() => router.push(puja.route as any)}
                          >
                            <LinearGradient colors={['#FF9500', '#FF7A00']} style={styles.rashiPujaCardBtnGrad}>
                              <Text style={styles.rashiPujaCardBtnText}>{t('Book Puja')}</Text>
                            </LinearGradient>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                </Reanimated.View>
              );
            })()}

            {/* DYNAMIC VEDIC PANCHANG CALCULATION */}
            <Text style={styles.sectionSubtitle}>{t('Daily Vedic Panchang')}</Text>
            {panchangLoading ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator size="large" color="#FF7A00" />
                <Text style={styles.loadingText}>{t('Fetching dynamic astrological elements...')}</Text>
              </View>
            ) : panchangData ? (
              <Reanimated.View entering={FadeIn.duration(400)} style={styles.panchangCard}>
                {/* Location row */}
                <View style={styles.panchangLocationRow}>
                  <Ionicons name="location-outline" size={15} color="#FF7A00" />
                  <Text style={styles.panchangLocationText}>{panchangData.location}</Text>
                </View>

                {/* Grid layout of Panchang elements */}
                <View style={styles.panchangGrid}>
                  {Object.entries(panchangData.panchang_for_today || {}).map(([key, val]: any, idx) => (
                    <View key={idx} style={styles.panchangItem}>
                      <Text style={styles.panchangKey}>{t(key)}</Text>
                      <Text style={styles.panchangVal}>{t(val)}</Text>
                    </View>
                  ))}
                </View>

                {/* Samvat & Year calculations */}
                <View style={styles.panchangDividingLine} />
                <Text style={styles.panchangGridTitle}>📅 {t('Vedic Era Details')}</Text>
                <View style={styles.panchangGrid}>
                  {Object.entries(panchangData.hindu_month_year || {}).map(([key, val]: any, idx) => (
                    <View key={idx} style={styles.panchangItem}>
                      <Text style={styles.panchangKey}>{t(key)}</Text>
                      <Text style={styles.panchangVal}>{t(val)}</Text>
                    </View>
                  ))}
                </View>

                {/* Sun & Moon Timings */}
                <View style={styles.panchangDividingLine} />
                <Text style={styles.panchangGridTitle}>☀️ {t('Solar & Lunar Transitions')}</Text>
                <View style={styles.panchangGrid}>
                  {Object.entries(panchangData.sun_moon_calculations || {}).map(([key, val]: any, idx) => (
                    <View key={idx} style={styles.panchangItem}>
                      <Text style={styles.panchangKey}>{t(key)}</Text>
                      <Text style={styles.panchangVal}>{t(val)}</Text>
                    </View>
                  ))}
                </View>

                {/* Muhurta & Kaal */}
                <View style={styles.panchangDividingLine} />
                <Text style={styles.panchangGridTitle}>⏱️ {t('Auspicious & Inauspicious Muhurtas')}</Text>
                <View style={styles.panchangGrid}>
                  <View style={styles.panchangItem}>
                    <Text style={[styles.panchangKey, { color: '#10b981' }]}>{t('Abhijit Muhurta')}</Text>
                    <Text style={styles.panchangVal}>{t(panchangData.auspicious_timings?.['Abhijit Muhurta'] || '-')}</Text>
                  </View>
                  <View style={styles.panchangItem}>
                    <Text style={[styles.panchangKey, { color: '#ef4444' }]}>{t('Rahu Kaal')}</Text>
                    <Text style={styles.panchangVal}>{t(panchangData.inauspicious_timings?.['Rahu Kaal'] || '-')}</Text>
                  </View>
                </View>
              </Reanimated.View>
            ) : (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>{t('Vedic Panchang calculations unavailable for this date.')}</Text>
              </View>
            )}
          </View>
        ) : (
          <View>
            {/* PERSONAL REMINDERS & MILESTONES */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionSubtitle}>{t('Saved Reminders')}</Text>
              <TouchableOpacity
                style={styles.addReminderBtn}
                onPress={() => {
                  setEditingReminderId(null);
                  setReminderTitle('');
                  setShowReminderModal(true);
                }}
              >
                <LinearGradient
                  colors={['#FF9500', '#F56B00']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.addReminderGradient}
                >
                  <Ionicons name="add" size={18} color="#ffffff" />
                  <Text style={styles.addReminderText}>{t('Add New')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {filteredReminders.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="notifications-off-outline" size={48} color="rgba(255, 255, 255, 0.2)" />
                <Text style={styles.emptyTextTitle}>{t('No Milestones Found')}</Text>
                <Text style={styles.emptyTextSub}>
                  {searchQuery.length > 0 
                    ? t('No milestones match your search term.')
                    : t('Select a date on the calendar and tap "Add New" to save birthdays, anniversaries, or special rituals.')}
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredReminders}
                keyExtractor={item => item.id}
                scrollEnabled={false}
                renderItem={({ item }) => {
                  const daysLeft = getReminderCountdown(item.date, item.repeat);
                  const catInfo = CATEGORIES.find(c => c.key === item.category);
                  
                  return (
                    <Reanimated.View entering={FadeInDown} style={styles.reminderCard}>
                      <View style={styles.reminderCardLeft}>
                        <View style={[styles.reminderCategoryBadge, { backgroundColor: catInfo?.color || '#FF7A00' }]}>
                          <Text style={styles.reminderCategoryText}>
                            {catInfo?.label || t('Milestone')}
                          </Text>
                        </View>
                        <Text style={styles.reminderTitleText}>{item.title}</Text>
                        <View style={styles.reminderDateRow}>
                          <Ionicons name="calendar-outline" size={13} color="rgba(255, 255, 255, 0.45)" />
                          <Text style={styles.reminderDateText}>
                            {item.date} {item.repeat !== 'none' && `(${t(item.repeat)})`}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.reminderCardRight}>
                        <Text style={[styles.reminderCountdownText, daysLeft === 0 && { color: '#ff7a00' }]}>
                          {getCountdownLabel(daysLeft)}
                        </Text>
                        <View style={styles.reminderActionRow}>
                          <TouchableOpacity onPress={() => toggleMuteReminder(item.id)} style={styles.reminderActionBtn}>
                            <Ionicons
                              name={item.isMuted ? "volume-mute-outline" : "volume-high-outline"}
                              size={18}
                              color={item.isMuted ? "rgba(255,255,255,0.3)" : "#10b981"}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleEditReminder(item)} style={styles.reminderActionBtn}>
                            <Ionicons name="pencil-outline" size={18} color="#3b82f6" />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleDeleteReminder(item.id)} style={styles.reminderActionBtn}>
                            <Ionicons name="trash-outline" size={18} color="#ef4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </Reanimated.View>
                  );
                }}
              />
            )}
          </View>
        )}

        {/* TIMELINE OF UPCOMING FESTIVALS */}
        <Text style={styles.sectionSubtitle}>{t('Upcoming Festivals')}</Text>
        {filteredTimelineFestivals.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTextSub}>{t('No upcoming festivals matched your search.')}</Text>
          </View>
        ) : (
          filteredTimelineFestivals.map(fest => {
            const isExpanded = expandedFestivalId === fest.id;
            return (
              <TouchableOpacity
                key={fest.id}
                activeOpacity={0.9}
                onPress={() => setExpandedFestivalId(isExpanded ? null : fest.id)}
                style={styles.timelineCard}
              >
                <View style={styles.timelineCardHeader}>
                  <View style={styles.timelineDateBlock}>
                    <Text style={styles.timelineMonthText}>{MONTH_NAMES[parseInt(fest.date.split('-')[0]) - 1].substring(0, 3)}</Text>
                    <Text style={styles.timelineDayText}>{fest.date.split('-')[1]}</Text>
                  </View>
                  <View style={styles.timelineInfoBlock}>
                    <Text style={styles.timelineTitleText}>{t(fest.title)}</Text>
                    <Text style={styles.timelineSubtitleText}>{t('Lord')} {t(fest.deity || 'Surya')}</Text>
                  </View>
                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="rgba(255, 255, 255, 0.45)"
                  />
                </View>

                {isExpanded && (
                  <Reanimated.View entering={FadeIn.duration(300)} style={styles.timelineExpandedContent}>
                    <Text style={styles.timelineDescText}>{t(fest.desc)}</Text>
                    <View style={styles.timelineActionsRow}>
                      <TouchableOpacity
                        style={styles.timelineActionBtnOutline}
                        onPress={() => handleSetReminder(fest)}
                      >
                        <Ionicons name="alarm-outline" size={14} color="#FF9500" />
                        <Text style={styles.timelineActionBtnText}>{t('Set Reminder')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.timelineActionBtnOutline}
                        onPress={() => handleShareFestival(fest)}
                      >
                        <Ionicons name="share-social-outline" size={14} color="#FF9500" />
                        <Text style={styles.timelineActionBtnText}>{t('Share')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.timelineActionBtnOutline}
                        onPress={() => Alert.alert(t('Calendar Integration'), t('Festival has been pinned to your local system calendar.'))}
                      >
                        <Ionicons name="calendar-outline" size={14} color="#FF9500" />
                        <Text style={styles.timelineActionBtnText}>{t('Add to Calendar')}</Text>
                      </TouchableOpacity>
                    </View>
                  </Reanimated.View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* ADD/EDIT REMINDER bottom sheet MODAL */}
      <Modal
        visible={showReminderModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReminderModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalContainer}
            >
              <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.modalGradient}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {editingReminderId ? t('Edit Milestone') : t('Add Custom Milestone')}
                  </Text>
                  <TouchableOpacity onPress={() => setShowReminderModal(false)}>
                    <Ionicons name="close" size={24} color="#ffffff" />
                  </TouchableOpacity>
                </View>

                {/* PREFILL DATE DISPLAY */}
                <View style={styles.modalDateIndicator}>
                  <Ionicons name="calendar-outline" size={16} color="#FF9500" />
                  <Text style={styles.modalDateIndicatorText}>
                    {t('Reminder for Selected Date')}: <Text style={styles.modalDateHighlight}>{formattedSelectedDate}</Text>
                  </Text>
                </View>

                <View style={styles.modalBody}>
                  <Text style={styles.fieldLabel}>{t('Milestone Name')}</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder={t('Enter title (e.g. Shravan Somvar Puja, Birthday...)')}
                    placeholderTextColor="rgba(255, 255, 255, 0.3)"
                    value={reminderTitle}
                    onChangeText={setReminderTitle}
                  />

                  <Text style={styles.fieldLabel}>{t('Category')}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                    {CATEGORIES.map(cat => (
                      <TouchableOpacity
                        key={cat.key}
                        style={[
                          styles.categoryPill,
                          reminderCategory === cat.key && styles.categoryPillActive,
                          { borderColor: cat.color }
                        ]}
                        onPress={() => setReminderCategory(cat.key as any)}
                      >
                        <Text style={[styles.categoryPillText, reminderCategory === cat.key && styles.categoryPillTextActive]}>
                          {t(cat.label)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <Text style={styles.fieldLabel}>{t('Recurrence')}</Text>
                  <View style={styles.recurrenceRow}>
                    {(['none', 'monthly', 'yearly'] as const).map(rep => (
                      <TouchableOpacity
                        key={rep}
                        style={[
                          styles.recurrenceBtn,
                          reminderRepeat === rep && styles.recurrenceBtnActive
                        ]}
                        onPress={() => setReminderRepeat(rep)}
                      >
                        <Text style={[styles.recurrenceText, reminderRepeat === rep && styles.recurrenceTextActive]}>
                          {t(rep === 'none' ? 'Only Once' : rep === 'monthly' ? 'Every Month' : 'Every Year')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity style={styles.saveBtn} onPress={handleSaveReminder}>
                    <LinearGradient
                      colors={['#FF9500', '#F56B00']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.saveBtnGradient}
                    >
                      <Text style={styles.saveBtnText}>{editingReminderId ? t('Update Milestone') : t('Save Milestone')}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.45)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    marginBottom: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerCalendarIcon: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: 'Outfit-Bold',
  },
  headerWalletContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 149, 0, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.25)',
  },
  headerWalletText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    height: '100%',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  
  /* Fasting Hub Styles */
  vratHubContainer: {
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 149, 0, 0.2)',
    marginBottom: 20,
  },
  vratHubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  vratHubEmoji: {
    fontSize: 28,
    marginRight: 10,
  },
  vratHubTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    fontFamily: 'Outfit-Bold',
  },
  vratHubSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
    width: SCREEN_WIDTH - 100,
  },
  filtersContainer: {
    marginBottom: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  filterRowLabel: {
    width: 68,
    fontSize: 11,
    fontWeight: '800',
    color: '#FF9500',
    textTransform: 'uppercase',
  },
  filterRowScroll: {
    alignItems: 'center',
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  filterPillActive: {
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    borderColor: '#FF9500',
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  filterPillTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  emptyFastingCard: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyFastingText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 12,
    textAlign: 'center',
  },
  vratCardItem: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 12,
    marginVertical: 5,
  },
  vratCardItemExpanded: {
    borderColor: 'rgba(255, 149, 0, 0.25)',
  },
  vratCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vratCardLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  vratDeityImage: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
    marginRight: 12,
  },
  vratTitleBlock: {
    flex: 1,
  },
  vratTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  vratTypeTag: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FF9500',
    backgroundColor: 'rgba(255, 149, 0, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    textTransform: 'uppercase',
  },
  vratImportanceTag: {
    fontSize: 8,
    fontWeight: '900',
    color: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
    textTransform: 'uppercase',
  },
  savedVratBadge: {
    marginLeft: 6,
  },
  vratCardTitleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  vratCardDateText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.45)',
    marginTop: 2,
  },
  vratOneLiner: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 8,
    paddingLeft: 4,
  },
  
  /* Expanded details panel */
  vratDetailedPanel: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  vratExpandedDesc: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 17,
    marginBottom: 14,
    fontStyle: 'italic',
  },
  vratDetailSection: {
    marginVertical: 8,
  },
  vratSectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FF9500',
    marginBottom: 6,
  },
  vratSectionBody: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.65)',
    lineHeight: 17,
  },
  vratStepText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.65)',
    lineHeight: 17,
    marginVertical: 2,
    paddingLeft: 4,
  },
  dietChecklistContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  dietChecklistTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  dietChecklistItem: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    marginVertical: 1,
    paddingLeft: 12,
  },
  vratTimingText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  mantraBox: {
    backgroundColor: 'rgba(255, 149, 0, 0.05)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.15)',
  },
  mantraBoxTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF9500',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  mantraText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    marginVertical: 2,
    fontStyle: 'italic',
  },
  vratKathaText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.65)',
    lineHeight: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  serviceCTACard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 149, 0, 0.08)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 149, 0, 0.2)',
    marginVertical: 12,
  },
  serviceCardLeft: {
    flex: 1,
    paddingRight: 8,
  },
  serviceLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FF9500',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  serviceTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  servicePrice: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10b981',
    marginTop: 2,
  },
  serviceBookBtn: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  serviceBookGradient: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  serviceBookText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  vratActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 12,
  },
  vratActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
    paddingVertical: 6,
    flex: 1,
    marginHorizontal: 2,
  },
  vratActionPillActive: {
    backgroundColor: '#FF9500',
    borderColor: '#FF9500',
  },
  vratActionPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FF9500',
    marginLeft: 3,
  },
  vratActionPillTextActive: {
    color: '#ffffff',
  },

  /* Calendar Card Styles */
  calendarCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.55)',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
    }),
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  monthNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekdayLabel: {
    width: (SCREEN_WIDTH - 64) / 7,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayCell: {
    width: (SCREEN_WIDTH - 72) / 7,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    borderRadius: 14,
  },
  dayCellOutOfMonth: {
    opacity: 0.25,
  },
  dayCellSelected: {
    borderWidth: 1.5,
    borderColor: '#FF7A00',
  },
  todayGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  dayTextToday: {
    color: '#ffffff',
  },
  dayTextSelected: {
    color: '#FF7A00',
  },
  indicatorsRow: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3b82f6',
    marginHorizontal: 1,
  },
  festivalIndicator: {
    marginHorizontal: 1,
  },
  festivalDot: {
    fontSize: 8,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  segmentBtnActive: {
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  segmentTextActive: {
    color: '#ffffff',
  },
  deityCard: {
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 149, 0, 0.25)',
    marginBottom: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#F56B00',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
    }),
  },
  deityCardBg: {
    padding: 16,
  },
  deityCardContent: {
    flexDirection: 'row',
  },
  deityImageWrapper: {
    width: 86,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  deityAssetContainer: {
    width: 86,
    height: 86,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deityGlowCircle: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FF9500',
    opacity: 0.15,
  },
  deityIllustration: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  deityGenericIcon: {
    fontSize: 48,
  },
  deityInfoWrapper: {
    flex: 1,
  },
  tagRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  deityCardTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FF9500',
    backgroundColor: 'rgba(255, 149, 0, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    textTransform: 'uppercase',
  },
  deityCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  deityCardDesc: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 16,
    marginBottom: 12,
  },
  deityCardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prayCTAButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  prayCTAButtonMuted: {
    opacity: 0.8,
  },
  prayCTAGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  prayCTAText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 6,
  },
  prayCTAShare: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 12,
    marginTop: 12,
    paddingLeft: 4,
  },
  loadingCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.35)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },
  panchangCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.45)',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 20,
  },
  panchangLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  panchangLocationText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    marginLeft: 4,
    fontWeight: '600',
  },
  panchangGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  panchangItem: {
    width: '48%',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderRadius: 14,
    padding: 10,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  panchangKey: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF9500',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  panchangVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  panchangDividingLine: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 14,
  },
  panchangGridTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
    paddingLeft: 4,
  },
  errorCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.35)',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  errorText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 13,
    textAlign: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  addReminderBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  addReminderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  addReminderText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 4,
  },
  emptyCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.35)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 16,
  },
  emptyTextTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyTextSub: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  reminderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(30, 41, 59, 0.45)',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 4,
  },
  reminderCardLeft: {
    flex: 1,
    paddingRight: 10,
  },
  reminderCategoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  reminderCategoryText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  reminderTitleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  reminderDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderDateText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.45)',
    marginLeft: 4,
  },
  reminderCardRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    width: 96,
  },
  reminderCountdownText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#10b981',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  reminderActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  timelineCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.45)',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 4,
  },
  timelineCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineDateBlock: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 149, 0, 0.12)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 149, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  timelineMonthText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FF9500',
    textTransform: 'uppercase',
  },
  timelineDayText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
  },
  timelineInfoBlock: {
    flex: 1,
  },
  timelineTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  timelineSubtitleText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.45)',
    marginTop: 2,
  },
  timelineExpandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  timelineDescText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 16,
    marginBottom: 12,
  },
  timelineActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timelineActionBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 149, 0, 0.06)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 149, 0, 0.2)',
    flex: 1,
    marginHorizontal: 3,
  },
  timelineActionBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FF9500',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    width: '100%',
    maxHeight: '80%',
  },
  modalGradient: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  modalDateIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
  },
  modalDateIndicatorText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 6,
  },
  modalDateHighlight: {
    fontWeight: 'bold',
    color: '#FF9500',
  },
  modalBody: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  modalInput: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    color: '#ffffff',
    fontSize: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  categoryScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.2,
    marginRight: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  categoryPillActive: {
    backgroundColor: '#FF7A00',
    borderColor: '#FF7A00',
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  categoryPillTextActive: {
    color: '#ffffff',
  },
  recurrenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  recurrenceBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    marginHorizontal: 3,
  },
  recurrenceBtnActive: {
    borderColor: '#FF7A00',
    backgroundColor: 'rgba(255, 122, 0, 0.1)',
  },
  recurrenceText: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  recurrenceTextActive: {
    color: '#FF7A00',
  },
  saveBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  saveBtnGradient: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  vratCard: {
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 122, 0, 0.2)',
    marginBottom: 16,
    overflow: 'hidden',
  },
  vratCardBg: {
    padding: 14,
  },
  noVratCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.35)',
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 14,
    marginBottom: 16,
  },
  vratCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vratCardIcon: {
    fontSize: 28,
    marginRight: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    width: 46,
    height: 46,
    borderRadius: 23,
    textAlign: 'center',
    lineHeight: 44,
  },
  vratTextContent: {
    flex: 1,
  },
  vratBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  vratBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FF9500',
    textTransform: 'uppercase',
  },
  vratDeityText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  vratCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 2,
  },
  vratCardRules: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.65)',
    lineHeight: 16,
  },
  // Vrat & Spiritual Guidance Hub Styles
  heroWrapper: {
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'hidden',
  },
  heroCard: {
    padding: 16,
    borderRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#F56B00',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroDetails: {
    flex: 1.2,
    paddingRight: 10,
  },
  heroStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  heroStatusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  heroStatusText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#ffffff',
  },
  heroCountdownBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 6,
  },
  heroCountdownText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FF9500',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 4,
    fontFamily: 'Outfit-Bold',
  },
  heroDate: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '700',
    marginBottom: 8,
  },
  heroSignificance: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 15,
  },
  heroImageCol: {
    flex: 0.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIllustration: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginVertical: 14,
  },
  heroActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  heroActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginRight: 4,
    marginBottom: 4,
    flex: 1,
    minWidth: 90,
  },
  heroActionBtnText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
    marginLeft: 4,
  },
  heroActionBtnHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 4,
    flex: 1.1,
    minWidth: 100,
  },
  heroActionBtnHighlightText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FF7A00',
    marginLeft: 4,
  },

  // Knowledge Card Details & Accordion Sub-sections
  vratCardRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  collapsedReminderBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subAccordionContainer: {
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 149, 0, 0.15)',
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    marginBottom: 10,
    overflow: 'hidden',
  },
  subAccordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255, 149, 0, 0.05)',
  },
  subAccordionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  subAccordionBody: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 149, 0, 0.1)',
  },
  subDetailItem: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 17,
    marginBottom: 8,
  },
  subDetailLabel: {
    fontWeight: '900',
    color: '#FF9500',
  },
  dietBulletText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 16,
    marginLeft: 8,
    marginBottom: 4,
  },
  mantraVerse: {
    fontSize: 13,
    color: '#ffffff',
    fontStyle: 'italic',
    lineHeight: 18,
    backgroundColor: 'rgba(255, 149, 0, 0.08)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9500',
  },
  kathaBodyText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
    textAlign: 'justify',
  },

  // Recommended Puja section inside card
  pujaRecommendationSection: {
    marginTop: 16,
    marginBottom: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 16,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 12,
  },
  marketplacePujaCard: {
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 122, 0, 0.25)',
    backgroundColor: 'rgba(255, 149, 0, 0.04)',
    padding: 12,
  },
  marketplacePujaRow: {
    flexDirection: 'row',
  },
  marketplacePujaImage: {
    width: 68,
    height: 68,
    borderRadius: 12,
    marginRight: 12,
    resizeMode: 'cover',
  },
  marketplacePujaInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  marketplacePujaName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 3,
  },
  marketplacePujaPurpose: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 14,
    marginBottom: 6,
  },
  marketplacePujaMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  marketplaceMetaText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FF9500',
    marginRight: 12,
  },
  marketplaceBookBtn: {
    marginTop: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  marketplaceBtnGradient: {
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marketplaceBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },

  // Rashi guidance inside card
  rashiGuidanceSection: {
    marginBottom: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 16,
  },
  rashiSelectorScroll: {
    paddingVertical: 4,
    marginBottom: 12,
  },
  rashiSelectorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginRight: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  rashiSelectorPillActive: {
    borderColor: '#FF9500',
    backgroundColor: 'rgba(255, 149, 0, 0.12)',
  },
  rashiSelectorEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  rashiSelectorName: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  rashiSelectorNameActive: {
    color: '#FF9500',
  },
  rashiDetailsContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  rashiQuickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  rashiGridItem: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    padding: 8,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  rashiGridLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FF9500',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  rashiGridValue: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '700',
    lineHeight: 14,
  },
  rashiPujaSubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 149, 0, 0.05)',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.15)',
  },
  rashiPujaImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 10,
    resizeMode: 'cover',
  },
  rashiPujaInfo: {
    flex: 1,
  },
  rashiPujaLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FF9500',
    textTransform: 'uppercase',
  },
  rashiPujaName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  rashiPujaPurpose: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  rashiPujaMeta: {
    flexDirection: 'row',
    marginTop: 2,
  },
  rashiMetaText: {
    fontSize: 8,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
    marginRight: 8,
  },
  rashiBookBtn: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rashiBookBtnText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#ffffff',
  },

  // Bottom action chips
  quickActionsChipsContainer: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 12,
  },
  quickActionsTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: 'rgba(255, 255, 255, 0.4)',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  actionChipsScroll: {
    paddingVertical: 2,
  },
  actionChipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 149, 0, 0.2)',
    marginRight: 6,
  },
  actionChipPillActive: {
    backgroundColor: '#FF7A00',
    borderColor: '#FF7A00',
  },
  actionChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
    marginLeft: 4,
  },
  actionChipTextActive: {
    color: '#ffffff',
  },
  toggleModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  toggleModeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 9,
  },
  toggleModeBtnActive: {
    backgroundColor: '#FF9500',
  },
  toggleModeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF9500',
    marginLeft: 6,
  },
  toggleModeTextActive: {
    color: '#ffffff',
  },
  rashiGuidanceSub: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    lineHeight: 15,
    marginBottom: 12,
  },
  rashiVratExplanationTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF9500',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  rashiVratExplanationBody: {
    fontSize: 11,
    color: '#ffffff',
    lineHeight: 16,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  preferenceSelectorContainer: {
    paddingVertical: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    borderBottomWidth: 1.2,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  preferenceSelectorScroll: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  preferencePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginRight: 8,
  },
  preferencePillActive: {
    backgroundColor: '#FF7A00',
    borderColor: '#FF7A00',
  },
  preferencePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.65)',
  },
  preferencePillTextActive: {
    color: '#ffffff',
  },
  showMoreVratsBtn: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.25)',
  },
  showMoreVratsGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  showMoreVratsText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FF9500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  vratHubHeaderTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
    textTransform: 'uppercase',
    marginTop: 18,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  parentAccordionContainer: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FF9500',
    backgroundColor: 'rgba(255, 149, 0, 0.03)',
    marginBottom: 14,
    overflow: 'hidden',
  },
  parentAccordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 149, 0, 0.08)',
  },
  parentAccordionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FF9500',
    fontFamily: 'Outfit-Bold',
  },
  parentAccordionContent: {
    padding: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.2)',
  },
  rashiPujaListHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 18,
    marginBottom: 10,
    fontFamily: 'Outfit-Bold',
  },
  rashiPujasScrollContent: {
    paddingVertical: 4,
    paddingRight: 16,
  },
  rashiPujaCardItem: {
    width: 250,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 149, 0, 0.15)',
    marginRight: 12,
    overflow: 'hidden',
  },
  rashiPujaCardImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  rashiPujaCardBody: {
    padding: 12,
  },
  rashiPujaCardName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: 'Outfit-Bold',
    marginBottom: 4,
  },
  rashiPujaCardPurpose: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.65)',
    height: 32,
    lineHeight: 15,
    marginBottom: 8,
  },
  rashiPujaCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  rashiPujaCardMetaText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FF9500',
  },
  rashiPujaCardBtn: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  rashiPujaCardBtnGrad: {
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rashiPujaCardBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#ffffff',
  },
});
