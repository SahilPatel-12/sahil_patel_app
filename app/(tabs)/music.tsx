import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  LayoutAnimation,
  Platform,
  UIManager,
  StatusBar,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";
import { useLanguage } from "../../context/LanguageContext";
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { bhajanSupabase } from '../../services/bhajanSupabase';
import DraggableCalendarButton from "../../components/DraggableCalendarButton";

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

// Localized tracks database
const TRACKS_DATABASE = [
  {
    id: 't1',
    title: 'Shiv Tandav Stotram',
    artist: 'Ravana Chanted Chords',
    duration: '3:45',
    durationSec: 225,
    title_Hindi: 'शिव ताण्डव स्तोत्रम्',
    artist_Hindi: 'रावण रचित ओजस्वी राग',
    title_Sanskrit: 'शिवताण्डवस्तोत्रम्',
    artist_Sanskrit: 'रावणकृतम् ओजस्वी स्वरम्',
    title_Gujarati: 'શિવ તાંડવ સ્તોત્રમ',
    artist_Gujarati: 'રાવણ રચિત ઓજસ્વી રાગ',
    title_Marathi: 'शिव तांडव स्तोत्रम्',
    artist_Marathi: 'रावण रचित ओजस्वी राग',
    title_Tamil: 'சிவ தாண்டவ ஸ்தோத்திரம்',
    artist_Tamil: 'இராவணன் இயற்றிய உக்கிர ராகம்',
    title_Telugu: 'శివ తాండవ స్తోత్రం',
    artist_Telugu: 'రావణ ప్రణీత ఓజస్వి రాగం',
    
    // Synced verses translated dynamically
    lyrics: {
      en: [
        'Jatatavigalajjala pravahapavitasthale...',
        'Galeavalambya lambitam bhujangatungamalikam...',
        'Damaddama ddama ddama ninnadavadamarvayam...',
        'Chakara chandatandavam tanotu nah shivah shivam...'
      ],
      Sanskrit: [
        'जटाटवीगलज्जलप्रवाहपावितस्थले...',
        'गलेऽवलम्ब्य लम्बितां भुजङ्गतुङ्गमालिकाम्...',
        'डमड्डमड्डमड्डमन्निनादवड्डमर्वयम्...',
        'चकार चण्डताण्डवं तनोतु नः शिवः शिवम्...'
      ],
      Hindi: [
        'जटाटवी से निकलता हुआ जल जिसके कंठ को पवित्र करता है...',
        'और उनके गले में सर्पों की विशाल माला लटकी हुई है...',
        'डमरू की डम-डम ध्वनि से दिशाएं गुंजायमान हैं...',
        'ऐसे तांडव नृत्य करने वाले भगवान शिव हमारा कल्याण करें।'
      ],
      Gujarati: [
        'જટાટવીમાંથી નીકળતા જળ પ્રવાહથી પવિત્ર થયેલા કંઠ વાળા...',
        'તેમના ગળામાં સાપોની વિશાળ માળા લટકી રહી છે...',
        'ડમરુના ડમ-ડમ અવાજથી દિશાઓ ગુંજી રહી છે...',
        'આવા તાંડવ નૃત્ય કરનાર ભગવાન શિવ અમારું કલ્યાણ કરે.'
      ],
      Marathi: [
        'જટાંમધૂન વાહણાર્યા ગંગેચ્યા પ્રવાહાને પવિત્ર ઝાલેલ્યા ગળ્યાવર...',
        'ગળ્યાત સાપાંચ્યા માળા લટકત આહેત...',
        'ડમરૂચ્યા ડમ-ડમ આવાજાને દિશા ગુંજત આહેત...',
        'અસા ઉગ્ર તાંડવ કરણાર્યા ભગવાન્ શિવાંની આમચે કલ્યાણ કરાવા.'
      ],
      Tamil: [
        'ஜடாமுடியில் இருந்து வழியும் கங்கை நீரால் தூய்மையான கழுத்தை உடையவர்...',
        'அவரது கழுத்தில் பெரிய பாம்புகள் மாலையாக தொங்குகின்றன...',
        'உடுக்கையின் டம்-டம் ஓசை திசையெங்கும் ஒலிக்கிறது...',
        'அத்தகைய தாண்டவம் ஆடும் சிவபெருமான் நமக்கு நன்மைகளை அருளட்டும்.'
      ],
      Telugu: [
        'జటాజూటం నుండి ప్రవహించే గంగా జలాలచే పవిత్రమైన కంఠము గలవాడు...',
        'అతని మెడలో సర్పముల పెద్ద దండలు వేలాడుతున్నాయి...',
        'డమరుకం యొక్క డం-డం నాదము దిక్కులన్నిటా మారుమోగుతోంది...',
        'అలా తాండవ నృత్యము చేసే శివుడు మనకు మంగళములను ప్రసాదించుగాక.'
      ]
    }
  },
  {
    id: 't2',
    title: 'Maha Mrityunjaya Mantra',
    artist: 'Vedic Chanting Pandits',
    duration: '2:15',
    durationSec: 135,
    title_Hindi: 'महामृत्युंजय महामंत्र',
    artist_Hindi: 'काशि के वैदिक पंडित',
    title_Sanskrit: 'महामृत्युञ्जयमहामन्त्रः',
    artist_Sanskrit: 'काशीविश्वेश्वरवैदिकविद्',
    title_Gujarati: 'મહામૃત્યુંજય મહામંત્ર',
    artist_Gujarati: 'કાશીના વેદ પાઠી પંડિતો',
    title_Marathi: 'महामृत्युंजय महामंत्र',
    artist_Marathi: 'काशीचे वैदिक पंडित',
    title_Tamil: 'மகா மிருத்யுஞ்சய மந்திரம்',
    artist_Tamil: 'வாரணாசி வேத பண்டிதர்கள்',
    title_Telugu: 'మహామృత్యుంజయ మహామంత్రం',
    artist_Telugu: 'కాశీ వేద పండితులు',
    
    lyrics: {
      en: [
        'Om Tryambakam Yajamahe...',
        'Sugandhim Pushtivardhanam...',
        'Urvarukamiva Bandhanan...',
        'Mrityor Mukshiya Mamritat...'
      ],
      Sanskrit: [
        'ॐ त्र्यम्बकम् यजामहे...',
        'सुगन्धिम् पुष्टिवर्धनम्...',
        'उर्वारुकमिव बन्धनान्...',
        'मृत्योर्मुक्षीय माऽमृतात्...'
      ],
      Hindi: [
        'हम त्रिनेत्रधारी भगवान शिव की आराधना करते हैं...',
        'जो सुगंधित हैं और हमारा पोषण करते हैं...',
        'जैसे पका हुआ खरबूजा बेल के बंधन से मुक्त होता है...',
        'वैसे ही हमें मृत्यु और संसार के बंधनों से मोक्ष प्राप्त हो।'
      ],
      Gujarati: [
        'અમે ત્રિનેત્રધારી ભગવાન શિવની આરાધના કરીએ છીએ...',
        'જેઓ સુગંધિત છે અને આપણું પોષણ કરે છે...',
        'જેમ પાકેલું તડબૂચ વેલાના બંધનમાંથી મુક્ત થાય છે...',
        'તેમ જ અમને મૃત્યુ અને સંસારના બંધનોમાંથી મોક્ષ મળે.'
      ],
      Marathi: [
        'આમ્હી ત્રિનેત્રધારી ભગવાન્ શિવાંચી આરાધના કરતો...',
        'જે સુગંધિત આહેત આણિ આમચે પોષણ કરત્યાત્...',
        'જસે પિકલેલે કલિંગડ વેલીચ્યા બંધનાતૂન આપોઆપ મુક્ત હોતે...',
        'તસેચ આમચી મૃત્યુ આણિ મોહાચ્યા બંધનાતૂન મુક્તતા વ્હાવી.'
      ],
      Tamil: [
        'முக்கண்ணனான சிவபெருமானை நாங்கள் வணங்குகிறோம்...',
        'அவர் நறுமணம் மிக்கவர் மற்றும் எங்களைக் காப்பவர்...',
        'வெள்ளரிப்பழம் கொடியிலிருந்து விடுபடுவது போல...',
        'நாங்கள் மரண பயத்திலிருந்து விடுபட்டு அழியா நிலையை அடைவோம்.'
      ],
      Telugu: [
        'మేము ముక్కంటి అయిన శివుని ఆరాధిస్తున్నాము...',
        'ఆయన సువాసనభరితుడు మరియు మమ్ములను పోషించేవాడు...',
        'పండిన దోసకాయ తొడిమ నుండి విడివడినట్లుగా...',
        'మరణ బంధాల నుండి మమ్ములను విముక్తులను చేసి మోక్షాన్ని ప్రసాదించు.'
      ]
    }
  },
  {
    id: 't3',
    title: 'Hanuman Chalisa',
    artist: 'Devotional Chorus Band',
    duration: '4:20',
    durationSec: 260,
    title_Hindi: 'हनुमान चालीसा',
    artist_Hindi: 'भक्तिमय सुर संगम',
    title_Sanskrit: 'हनुमच्चालीसास्तोत्रम्',
    artist_Sanskrit: 'तुलसीदासकृत मधुरस्वरम्',
    title_Gujarati: 'હનુમાન ચાલીસા',
    artist_Gujarati: 'ભક્તિમય સૂર સંગમ',
    title_Marathi: 'हनुमान चालीसा',
    artist_Marathi: 'भक्तिमय सूर संगम',
    title_Tamil: 'அனுமன் சாலிசா',
    artist_Tamil: 'பக்தி ராக பஜனை குழு',
    title_Telugu: 'హనుమాన్ చాలీసా',
    artist_Telugu: 'భక్తిమయ స్వర బృందం',
    
    lyrics: {
      en: [
        'Shree Guru Charan Saroj Raj, Nij Manu Mukuru Sudhari...',
        'Barnau Raghuvar Bimal Jasu, Jo Dayaku Phal Chari...',
        'Buddhiheen Tanu Janike, Sumirau Pawan Kumar...',
        'Bal Budhi Vidya Dehu Mohi, Harahu Kalesh Bikar...'
      ],
      Sanskrit: [
        'श्रीगुरु चरण सरोज रज, निज मनु मुकुरु सुधारि।',
        'बरनउँ रघुबर बिमल जसु, जो दायकु फल चारि॥',
        'बुद्धिहीन तनु जानिके, सुमिरौ पवन कुमार।',
        'बल बुधि बिद्या देहु मोहि, हरहु कलेस बिकार॥'
      ],
      Hindi: [
        'श्री गुरुदेव के चरण कमलों की धूलि से अपने मन रूपी दर्पण को स्वच्छ कर...',
        'मैं श्री रघुवीर के निर्मल यश का गान करता हूँ, जो चारों फल देने वाला है।',
        'स्वयं को बुद्धिहीन जानकर, मैं पवनपुत्र हनुमान का स्मरण करता हूँ...',
        'हे बजरंगबली! मुझे बल, बुद्धि और विद्या प्रदान करें तथा मेरे कष्टों को हर लें।'
      ],
      Gujarati: [
        'શ્રી ગુરુદેવના ચરણ કમળોની રજથી પોતાના મનરૂપી અરીસાને સાફ કરી...',
        'હું શ્રી રઘુવીરના પવિત્ર યશનું ગાન કરું છું, જે ચારેય પુરુષાર્થ આપનાર છે.',
        'પોતાને બુદ્ધિહીન સમજીને, હું પવનપુત્ર હનુમાનનું સ્મરણ કરું છું...',
        'એ બજરંગબલી! મને બળ, બુદ્ધિ અને વિદ્યા આપો તથા મારા કષ્ટો હરી લો.'
      ],
      Marathi: [
        'સદ્ગુરૂંચ્યા ચરણ કમલાંચ્યા ધૂળીને આપલ્યા મનરૂપી આરશા સ્વચ્છ કરૂન...',
        'મી શ્રીરામચંદ્રાંચ્યા પવિત્ર યશાચે વર્ણન કરતો, જે ચારહી પુરુષાર્થ દેતે.',
        'સ્વતઃલા બુદ્ધિહીન સમજૂન મી પવનપુત્ર હનુમંતાંચે સ્મરણ કરતો...',
        'હે બજરંગબલી! મલા બલ, બુદ્ધિ આણિ વિદ્યા દ્યા વ માઝે સર્વ ત્રાસ દૂર કરા.'
      ],
      Tamil: [
        'ஸ்ரீ குருவின் தாமரை பாத தூசியால் என் மனக் கண்ணாடியைத் தூய்மை செய்து...',
        'நான்கு பலன்களையும் தரக்கூடிய ரகுவீரனின் புகழைப் பாடுகிறேன்.',
        'என்னை அறிவற்றவனாக உணர்ந்து, பவனகுமாரனான அனுமனை தியானிக்கிறேன்...',
        'எனக்கு பலம், புத்தி, மற்றும் கல்வியைத் தந்து, என் துயரங்களை நீக்குங்கள்.'
      ],
      Telugu: [
        'శ్రీ గురుదేవుని పాద పద్మముల ధూళితో నా మనస్సనే అద్దాన్ని శుభ్రం చేసుకొని...',
        'ధర్మ అర్థ కామ మోక్షాలనే నాలుగు ఫలాలను ఇచ్చే రాముని కీర్తిని పాడుతున్నాను.',
        'నన్ను నేను బుద్ధిహీనునిగా భావించి, పవనకుమారుడైన హనుమంతుని తలుస్తున్నాను...',
        'ఓ బజరంగబలి! నాకు బలం, బుద్ధి మరియు విద్యను ప్రసాదించి నా కష్టాలను హరించు.'
      ]
    }
  }
];

export default function MusicScreen() {
  const { t, locale } = useLanguage();
  const activeLocale = locale as 'en' | 'Hindi' | 'Sanskrit' | 'Gujarati' | 'Marathi' | 'Tamil' | 'Telugu';

  // Dynamic Bhajans and Categories state
  const [tracks, setTracks] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [activeTrackIndex, setActiveTrackIndex] = useState(0);
  const activeTrack = tracks[activeTrackIndex];
  
  const [lyricIndex, setLyricIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  // Expo Audio Setup
  const player = useAudioPlayer(require('../../assets/Sound/bell_sound.mp3'));
  const status = useAudioPlayerStatus(player);

  // Load dynamic data from Drishti Bhajan Supabase
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // 1. Fetch Categories
        const { data: catData, error: catErr } = await bhajanSupabase
          .from('categories')
          .select('name')
          .eq('is_visible', true)
          .order('name', { ascending: true });

        if (catErr) console.error('Error categories:', catErr);
        if (catData) {
          setCategories(['All', ...catData.map(c => c.name)]);
        }

        // 2. Fetch Bhajans
        const { data: bhajanData, error: bhajanErr } = await bhajanSupabase
          .from('bhajans')
          .select('*')
          .eq('is_visible', true)
          .order('created_at', { ascending: false });

        if (bhajanErr) console.error('Error bhajans:', bhajanErr);
        if (bhajanData && bhajanData.length > 0) {
          const formatted = bhajanData.map((b: any) => {
            const durationSec = b.duration || 200;
            const minutes = Math.floor(durationSec / 60);
            const seconds = durationSec % 60;
            const durationStr = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

            return {
              id: b.id,
              title: b.title,
              artist: b.category || 'Vedic Devotion',
              duration: durationStr,
              durationSec: durationSec,
              url: b.url,
              thumbnail: b.thumbnail,
              category: b.category,
              sub_type: b.sub_type,
              description: b.description || ''
            };
          });
          setTracks(formatted);
        }
      } catch (err) {
        console.error('Error loading data from bhajan database:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const isInitialMount = useRef(true);

  // Handle Track Source Swap
  useEffect(() => {
    if (activeTrack && activeTrack.url) {
      player.replace(activeTrack.url);
      
      // Auto-advance/autoplay only after initial mount
      if (isInitialMount.current) {
        isInitialMount.current = false;
      } else {
        player.play();
      }
    }
  }, [activeTrackIndex, tracks]);

  // Handle track auto-advance when finished
  useEffect(() => {
    if (status.didJustFinish) {
      handleNext();
    }
  }, [status.didJustFinish]);

  // Split description or generate fallback lyrics dynamically
  const lyricsArray = useMemo(() => {
    if (!activeTrack) return [];
    if (activeTrack.description && activeTrack.description.length > 5) {
      const lines = activeTrack.description
        .split(/[.\n,]/)
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);
      if (lines.length > 0) return lines;
    }
    // Fallbacks
    const cat = (activeTrack.category || '').toLowerCase();
    if (cat.includes('shiv')) {
      return [
        'Om Namah Shivaya...',
        'Har Har Mahadev...',
        'Karpoora Gauram Karunavataram...',
        'Sansara Saram Bhujagendra Haram...'
      ];
    }
    if (cat.includes('krishna') || cat.includes('biha') || cat.includes('radha')) {
      return [
        'Hare Krishna Hare Krishna...',
        'Krishna Krishna Hare Hare...',
        'Hare Rama Hare Rama...',
        'Rama Rama Hare Hare...'
      ];
    }
    if (cat.includes('hanuman') || cat.includes('ram')) {
      return [
        'Mangal Bhavan Amangal Hari...',
        'Drava hu Su Dasharath Ajir Bihari...',
        'Jai Pawan Sut Hanuman Ki...',
        'Jai Jai Jai Bajrangbali...'
      ];
    }
    return [
      'Chanting divine names for peace & wisdom...',
      'May the light of truth guide your path...',
      'Connecting with the cosmic sound...',
      'Deep meditation and spiritual healing...'
    ];
  }, [activeTrack]);

  // Sync lyrics line with currentTime progress
  useEffect(() => {
    const duration = status.duration || (activeTrack ? activeTrack.durationSec : 0);
    if (duration > 0 && lyricsArray.length > 0) {
      const percentage = status.currentTime / duration;
      const index = Math.min(Math.floor(percentage * lyricsArray.length), lyricsArray.length - 1);
      setLyricIndex(index);
    }
  }, [status.currentTime, status.duration, lyricsArray]);

  // Action helpers
  const handlePlayPause = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (status.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  const handleNext = () => {
    if (tracks.length > 0) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
      setLyricIndex(0);
      setActiveTrackIndex((prev) => (prev + 1) % tracks.length);
    }
  };

  const handlePrev = () => {
    if (tracks.length > 0) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
      setLyricIndex(0);
      setActiveTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
    }
  };

  const formatTime = (totalSec: number) => {
    const min = Math.floor(totalSec / 60);
    const sec = Math.floor(totalSec % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  // Filtered tracks
  const filteredTracks = useMemo(() => {
    if (activeCategory === 'All') return tracks;
    return tracks.filter(track => (track.category || '').toLowerCase() === activeCategory.toLowerCase());
  }, [activeCategory, tracks]);

  if (loading) {
    return (
      <View style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <ActivityIndicator size="large" color="#ea580c" />
        <Text style={{ marginTop: 12, color: '#64748b', fontFamily: 'Outfit-Medium' }}>
          Loading divine chants...
        </Text>
      </View>
    );
  }

  if (tracks.length === 0) {
    return (
      <View style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <Ionicons name="musical-notes-outline" size={48} color="#ea580c" style={{ marginBottom: 12 }} />
        <Text style={{ color: '#64748b', fontFamily: 'Outfit-Medium', textAlign: 'center' }}>
          No devotional chants available. Check back soon!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <SafeAreaView style={styles.headerContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>{t('Vedic Chants')}</Text>
          <Text style={styles.headerSubtitle}>{t('Connect with divine sounds')}</Text>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Section 1: Premium Audio Player Banner */}
        <LinearGradient
          colors={['#ffffff', '#fffaf0']}
          style={styles.playerWrapper}
        >
          {/* Visualizer active state lines */}
          <View style={styles.visualizerContainer}>
            <View style={[styles.visualizerBar, status.playing && styles.barPlaying1]} />
            <View style={[styles.visualizerBar, status.playing && styles.barPlaying2]} />
            <View style={[styles.visualizerBar, status.playing && styles.barPlaying3]} />
            <View style={[styles.visualizerBar, status.playing && styles.barPlaying4]} />
            <View style={[styles.visualizerBar, status.playing && styles.barPlaying3]} />
            <View style={[styles.visualizerBar, status.playing && styles.barPlaying2]} />
            <View style={[styles.visualizerBar, status.playing && styles.barPlaying1]} />
          </View>

          {/* Track titles */}
          <Text style={styles.playerTrackTitle}>{activeTrack.title}</Text>
          <Text style={styles.playerTrackArtist}>{activeTrack.artist}</Text>

          {/* Synced Lyrics Line Display Box */}
          <View style={styles.lyricBox}>
            <Text style={styles.lyricChantStar}>✦</Text>
            <Text style={styles.activeLyricText} numberOfLines={2}>
              {lyricsArray[lyricIndex] || ''}
            </Text>
            <Text style={styles.lyricChantStar}>✦</Text>
          </View>

          {/* Simulated progress slider bar */}
          <View style={styles.progressBarWrapper}>
            <Text style={styles.progressTimeLabel}>{formatTime(status.currentTime)}</Text>
            <View style={styles.progressBarTrack}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${((status.currentTime || 0) / (status.duration || activeTrack.durationSec || 1)) * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressTimeLabel}>{formatTime(status.duration || activeTrack.durationSec)}</Text>
          </View>

          {/* Controller Action buttons */}
          <View style={styles.controllerRow}>
            <TouchableOpacity style={styles.controlSubBtn} onPress={handlePrev} activeOpacity={0.8}>
              <Ionicons name="play-back" size={24} color="#ea580c" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlPlayBtn} onPress={handlePlayPause} activeOpacity={0.85}>
              <Ionicons 
                name={status.playing ? "pause" : "play"} 
                size={32} 
                color="#ffffff" 
                style={{ marginLeft: status.playing ? 0 : 4 }}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlSubBtn} onPress={handleNext} activeOpacity={0.8}>
              <Ionicons name="play-forward" size={24} color="#ea580c" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Section 2: Music Category Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.tabsSection}
          contentContainerStyle={styles.tabsScrollContent}
        >
          {categories.map(cat => {
            const isSelected = activeCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.tabItem, isSelected && styles.tabItemActive]}
                onPress={() => setActiveCategory(cat)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
                  {t(cat)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Section 3: Devotional Playlist Tracks */}
        <View style={styles.playlistSection}>
          <Text style={styles.sectionHeader}>{t('DEVOTIONAL PLAYLIST')}</Text>

          {filteredTracks.map((track, idx) => {
            const isCurrent = track.id === activeTrack.id;
            return (
              <TouchableOpacity
                key={track.id}
                style={[styles.trackListItem, isCurrent && styles.trackListItemActive]}
                activeOpacity={0.8}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                  const originalIdx = tracks.findIndex(t => t.id === track.id);
                  setActiveTrackIndex(originalIdx);
                }}
              >
                {/* Left play/equalizer bubble */}
                <View style={[styles.trackItemLeftBubble, isCurrent && styles.activeBubble]}>
                  <Ionicons 
                    name={isCurrent && status.playing ? "volume-medium" : "play"} 
                    size={16} 
                    color={isCurrent ? "#ffffff" : "#ea580c"} 
                  />
                </View>

                {/* Middle track information */}
                <View style={styles.trackItemInfoCol}>
                  <Text style={[styles.trackItemTitle, isCurrent && styles.trackItemTitleActive]}>
                    {track.title}
                  </Text>
                  <Text style={styles.trackItemArtist}>
                    {track.artist}
                  </Text>
                </View>

                {/* Right duration */}
                <Text style={styles.trackItemDuration}>{track.duration}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Spacer */}
        <View style={{ height: 100 }} />
      </ScrollView>
      <DraggableCalendarButton />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  headerContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  headerRow: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Outfit-ExtraBold',
    color: '#0f172a',
    textShadowColor: 'rgba(234, 88, 12, 0.05)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: 'Outfit-Medium',
    color: '#ea580c',
    opacity: 0.9,
    marginTop: 2
  },
  scrollContent: {
    paddingBottom: 20,
    backgroundColor: '#ffffff'
  },
  playerWrapper: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#ffedd5',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4
  },
  visualizerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 30,
    marginBottom: 20
  },
  visualizerBar: {
    width: 3.5,
    backgroundColor: '#ea580c',
    borderRadius: 2,
    height: 6
  },
  barPlaying1: { height: 24, transform: [{ scaleY: 1.2 }] },
  barPlaying2: { height: 16, transform: [{ scaleY: 0.8 }] },
  barPlaying3: { height: 20, transform: [{ scaleY: 1.4 }] },
  barPlaying4: { height: 28, transform: [{ scaleY: 0.5 }] },
  playerTrackTitle: {
    fontSize: 20,
    fontFamily: 'Outfit-Bold',
    color: '#1e293b',
    textAlign: 'center'
  },
  playerTrackArtist: {
    fontSize: 12.5,
    fontFamily: 'Outfit-Medium',
    color: '#ea580c',
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.95
  },
  lyricBox: {
    backgroundColor: '#fff7ed',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginVertical: 20,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ffedd5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8
  },
  activeLyricText: {
    fontSize: 13.5,
    fontFamily: 'Outfit-Bold',
    color: '#1e293b',
    textAlign: 'center',
    flex: 1,
    lineHeight: 19
  },
  lyricChantStar: {
    color: '#ea580c',
    fontSize: 12
  },
  progressBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 10,
    marginBottom: 20
  },
  progressTimeLabel: {
    fontSize: 11,
    fontFamily: 'Outfit-Medium',
    color: '#64748b',
    minWidth: 30
  },
  progressBarTrack: {
    flex: 1,
    height: 4.5,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#ea580c',
    borderRadius: 3
  },
  controllerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 30
  },
  controlSubBtn: {
    padding: 8
  },
  controlPlayBtn: {
    width: 60,
    height: 60,
    backgroundColor: '#ea580c',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4
  },
  tabsSection: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    borderRadius: 14,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    height: 52
  },
  tabsScrollContent: {
    flexDirection: 'row',
    padding: 4,
    gap: 4
  },
  tabItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10
  },
  tabItemActive: {
    backgroundColor: '#ea580c'
  },
  tabText: {
    fontSize: 13,
    fontFamily: 'Outfit-Bold',
    color: '#64748b'
  },
  tabTextActive: {
    color: '#ffffff'
  },
  playlistSection: {
    marginTop: 24,
    paddingHorizontal: 20
  },
  sectionHeader: {
    fontSize: 11.5,
    fontFamily: 'Outfit-Bold',
    color: '#ea580c',
    letterSpacing: 1.5,
    marginBottom: 12
  },
  trackListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    marginBottom: 10,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1
  },
  trackListItemActive: {
    borderColor: '#ea580c',
    backgroundColor: '#fff7ed'
  },
  trackItemLeftBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff7ed',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  activeBubble: {
    backgroundColor: '#ea580c'
  },
  trackItemInfoCol: {
    flex: 1,
    justifyContent: 'center'
  },
  trackItemTitle: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
    color: '#1e293b'
  },
  trackItemTitleActive: {
    color: '#ea580c'
  },
  trackItemArtist: {
    fontSize: 11.5,
    fontFamily: 'Outfit-Medium',
    color: '#64748b',
    marginTop: 2
  },
  trackItemDuration: {
    fontSize: 12,
    fontFamily: 'Outfit-Medium',
    color: '#64748b'
  }
});
