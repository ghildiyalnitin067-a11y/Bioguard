
const TEMPLATES = {

  Wildlife: {
    critical: {
      headline: '🚨 WILDLIFE DANGER — STAY INDOORS',
      hindi: '🚨 वन्यजीव खतरा — घर के अंदर रहें',
      message: (loc) => `A dangerous wild animal has been spotted near ${loc}. This is a critical situation. Do NOT go outside. Keep children, elderly and livestock inside. The forest department and rescue team have been alerted and are on their way.`,
      solutions: [
      'Stay inside your home with doors and windows closed',
      'Do NOT approach, chase, or try to capture the animal',
      'Call the Forest Department helpline: 1800-11-0027',
      'Make loud noise (drums, bells) only if animal enters your compound',
      'Wait for the rescue team — they are already on the way',
      'If someone is injured, call 108 (ambulance) immediately'],

      prevention: [
      'Install solar-powered fences around your farm and livestock area',
      'Keep a torch and noise-making device ready at night',
      'Never leave food scraps or garbage near your home — it attracts animals',
      'Plant thorny hedges (Lantana or Kair) as a natural barrier',
      'Report any animal movement to Asha Worker / Forest Guard promptly',
      'Set up community warning bells at village entry points']

    },
    warning: {
      headline: '⚠️ WILDLIFE ALERT — CAUTION ADVISED',
      hindi: '⚠️ वन्यजीव सतर्कता — सावधान रहें',
      message: (loc) => `A wild animal has been sighted near ${loc}. Please be careful when going outside, especially at dusk and dawn. Do not let children or livestock roam freely. The forest department has been informed.`,
      solutions: [
      'Avoid going to forests, fields, or rivers after sunset',
      'Travel in groups if you must go outside',
      'Secure all livestock in a closed shelter for the next 48 hours',
      'Report exact animal sighting to your local Asha Worker',
      'Do NOT try to photograph or film — maintain safe distance'],

      prevention: [
      'Create a community watch schedule for night hours',
      'Use bright lights on your porch and paths to deter animals',
      'Keep your farm area clean — remove unharvested crops promptly',
      'Learn to identify animal tracks and report immediately',
      'Participate in forest department training on coexistence']

    },
    info: {
      headline: 'ℹ️ WILDLIFE SIGHTING — INFORMATION',
      hindi: 'ℹ️ वन्यजीव दर्शन — सूचना',
      message: (loc) => `A wildlife sighting has been recorded near ${loc}. This is for your information. The situation is being monitored. Please remain watchful and report any unusual behaviour to your Asha Worker.`,
      solutions: [
      'Stay alert and inform your Asha Worker of any movement',
      'Avoid going near forest edges alone',
      'Ensure children do not play near forest areas today'],

      prevention: [
      'Stay updated on wildlife alerts through your BioGuard app',
      'Keep community contact list of forest guards ready',
      'Participate in village-level biodiversity awareness programs']

    }
  },

  Deforestation: {
    critical: {
      headline: '🌳 URGENT — ILLEGAL TREE CUTTING DETECTED',
      hindi: '🌳 अत्यावश्यक — अवैध पेड़ काटना पकड़ा गया',
      message: (loc) => `Large-scale illegal deforestation has been detected near ${loc}. This threatens your water supply, soil quality, and the animals that protect your ecosystem. Authorities have been alerted. Please do NOT participate in or allow this activity.`,
      solutions: [
      'Immediately inform the District Forest Officer (DFO) if you witness cutting',
      'Note down vehicle numbers, faces, and timing — this is evidence',
      'Do NOT accept money to allow tree cutting on your land or commons',
      'Call the Forest Crime helpline: 1800-11-0027',
      'Gather community members to peacefully report to authorities',
      'Photograph or video the activity from a safe distance as evidence'],

      prevention: [
      'Register your community forest under Van Adhikar Dawa (Forest Rights Act)',
      'Form a Van Suraksha Samiti (Village Forest Protection Committee)',
      'Mark and GPS-tag important trees in your area through BioGuard',
      'Educate youth to report suspicious night-time activity near forests',
      'Plant 5 trees for every tree naturally lost in your village boundary',
      'Demand tree-cutting permits be displayed before any logging begins']

    },
    warning: {
      headline: '⚠️ DEFORESTATION WARNING — FORESTS BEING CLEARED',
      hindi: '⚠️ वन कटाव चेतावनी — जंगल साफ किया जा रहा है',
      message: (loc) => `Suspicious tree-clearing activity has been detected near ${loc}. This may affect your local water sources and farming. The forest department and local authorities are being informed.`,
      solutions: [
      'Inform your Asha Worker or village head immediately',
      'Do not buy or sell timber from suspicious sources',
      'Keep records of who is doing the cutting and why',
      'Demand to see government permission (Form 26 / DFO order)'],

      prevention: [
      'Monitor forest edges with the BioGuard community reporting system',
      'Plant fruit and shade trees as community property',
      'Apply for MGNREGA tree-planting projects in your Gram Sabha',
      'Conduct monthly community forest inspections']

    },
    info: {
      headline: 'ℹ️ LAND COVER CHANGE DETECTED',
      hindi: 'ℹ️ भूमि आच्छादन परिवर्तन पकड़ा गया',
      message: (loc) => `A change in forest cover has been detected near ${loc}. Monitoring is ongoing. If you see any tree-cutting or land clearing, please report it using the BioGuard app.`,
      solutions: [
      'Use BioGuard Report to flag any suspicious activity near forests',
      'Ask your Asha Worker about the status of this area'],

      prevention: [
      'Attend Gram Sabha meetings to raise forest protection resolutions',
      'Join the BioGuard Forest Watch volunteer group']

    }
  },

  Wildfire: {
    critical: {
      headline: '🔥 FIRE EMERGENCY — EVACUATE IF UNSAFE',
      hindi: '🔥 आग आपातकाल — असुरक्षित हो तो घर छोड़ें',
      message: (loc) => `A rapidly spreading wildfire has been detected near ${loc}. This is an emergency. If smoke is visible from your village, be ready to evacuate. Cover all water tanks. Move livestock away from the fire direction. Call 101 (Fire) or 1800-11-0027 immediately.`,
      solutions: [
      'Call Fire Department: 101 and Forest Dept: 1800-11-0027 NOW',
      'Wet the roofs and walls of your house with water to reduce fire risk',
      'Evacuate elderly, children, and livestock if fire is within 1km',
      'Move to open ground away from trees and dried grass',
      'Do NOT use vehicles near active fire — fire can spread suddenly',
      'Follow your village emergency evacuation plan'],

      prevention: [
      'Create firebreaks (cleared strips of land) around your village every March',
      'Never burn crop stubble or household waste near forests',
      'Set up a community fire watch system during dry months (Feb–May)',
      'Keep buckets of water and sand near homes during fire season',
      'Remove dried leaves and branches near your home regularly',
      'Learn the Fire Safety training offered by Forest Department']

    },
    warning: {
      headline: '⚠️ WILDFIRE RISK — BE ALERT',
      hindi: '⚠️ जंगल की आग — सतर्क रहें',
      message: (loc) => `Fire has been spotted in forest areas near ${loc}. Wind conditions may spread it further. Do not light any fire outdoors today. Keep water containers filled. Stay indoors if possible and monitor for smoke.`,
      solutions: [
      'Do NOT light any fire — no cooking fires outdoors, no burning dry leaves',
      'Clear a 10-metre buffer of dry grass from your home boundary',
      'Keep water buckets ready near your home and barn',
      'Contact your Asha Worker to coordinate with forest guards'],

      prevention: [
      'Plant fire-resistant trees like Teak and Sal near village edges',
      'Set up fire detection early warning system with BioGuard',
      'Carry out controlled burning only in November–December under supervision']

    },
    info: {
      headline: 'ℹ️ FOREST FIRE DETECTED NEARBY',
      hindi: 'ℹ️ निकट में जंगल की आग पकड़ी गई',
      message: (loc) => `A small forest fire has been detected near ${loc}. Fire department and forest officials are monitoring the situation. Please avoid going near forested areas today and report if you see any smoke.`,
      solutions: [
      'Avoid forests today and stay on open paths',
      'Report any smoke you see using BioGuard or by calling 101'],

      prevention: [
      'Participate in village fire prevention training this season',
      'Keep fire extinguisher or sand bucket near your kitchen']

    }
  },

  Poaching: {
    critical: {
      headline: '🚫 CRITICAL — POACHING / WILDLIFE CRIME DETECTED',
      hindi: '🚫 गंभीर — शिकार / वन्यजीव अपराध पकड़ा गया',
      message: (loc) => `Illegal wildlife poaching or hunting has been detected near ${loc}. This is a serious criminal activity. Do NOT interact with poachers. Inform the Wildlife Crime Cell immediately. Your information is confidential and protected.`,
      solutions: [
      'Call Wildlife Crime Control Bureau (WCCB): 1800-11-0027',
      'Note any vehicles, faces, or equipment you see — DO NOT confront',
      'Report anonymously through BioGuard app if you feel unsafe',
      'Inform your village head and forest guard immediately',
      'Preserve any snares, traps, or carcasses you find as evidence — do not touch',
      'A reward may be available for information leading to arrest'],

      prevention: [
      'Educate every household: poaching is a criminal offence under Wildlife Protection Act 1972',
      'Do NOT buy or consume any wild animal meat, skins, or parts',
      'Report strangers entering the village with weapons or traps',
      'Mount camera traps on forest trails with help from BioGuard',
      'Organize community patrols with forest department during peak poaching season',
      "Wildlife protection generates eco-tourism income — protect, don't poach"]

    },
    warning: {
      headline: '⚠️ POACHING ACTIVITY — REPORT SUSPICIOUS PERSONS',
      hindi: '⚠️ शिकार गतिविधि — संदिग्ध लोगों की जानकारी दें',
      message: (loc) => `Suspicious activity linked to possible poaching has been detected near ${loc}. If you see strangers with weapons, traps, or snares near forest areas, report it immediately. Do not approach them.`,
      solutions: [
      'Report to Forest Department helpline: 1800-11-0027',
      'Inform your Asha Worker with exact location and description',
      'Keep a written note of suspicious persons or vehicles',
      'Do NOT buy wildlife products from unknown traders'],

      prevention: [
      'Join Community Anti-Poaching Watch committees',
      'Display Forest Rights and wildlife laws in your village center',
      'Report wire snares or hunting traps found on forest paths']

    },
    info: {
      headline: 'ℹ️ PATROL — WILDLIFE MONITORING ACTIVE',
      hindi: 'ℹ️ गश्त — वन्यजीव निगरानी सक्रिय',
      message: (loc) => `Forest rangers are conducting active patrols near ${loc} in response to a wildlife safety concern. This is routine monitoring. Please cooperate with forest staff if asked.`,
      solutions: [
      'Cooperate with any questions from forest department staff',
      'Report any unusual people or activity you may have seen recently'],

      prevention: [
      'Support community-based wildlife protection efforts',
      'Use BioGuard to log any wildlife sightings in your area']

    }
  },

  Conflict: {
    critical: {
      headline: '🚨 HUMAN-WILDLIFE CONFLICT — URGENT ACTION NEEDED',
      hindi: '🚨 मानव-वन्यजीव संघर्ष — तुरंत कार्रवाई जरूरी',
      message: (loc) => `A serious human-wildlife conflict situation has been reported near ${loc}. An animal has caused or may cause harm to people or crops. Emergency response teams are being deployed. Stay inside and follow instructions from forest staff.`,
      solutions: [
      'Stay inside — do not go to the conflict area',
      'Call 1800-11-0027 for immediate wildlife response team',
      'If someone is injured — call 108 (ambulance) immediately',
      'Do NOT try to harm or chase the animal — it will worsen the situation',
      'Use noise (drums, horns) to drive animals away only if necessary',
      'Secure all livestock in safe enclosures now'],

      prevention: [
      'Install electric fencing (government subsidy available) around farms',
      'Grow crops that animals dislike near forest edges (chilli, ginger)',
      'Apply for government crop damage compensation under PMFBY',
      'Build Predator-proof livestock sheds with forest dept support',
      'Plant thorny bush barriers around village perimeter',
      'Never feed wild animals — it creates dependency and danger']

    },
    warning: {
      headline: '⚠️ ANIMAL MOVEMENT — NEAR VILLAGE BOUNDARY',
      hindi: '⚠️ पशु आवाजाही — गाँव की सीमा के पास',
      message: (loc) => `Wild animals have been observed moving towards human settlement near ${loc}. Please secure livestock, avoid going to fields at night, and report any crop damage or injury immediately.`,
      solutions: [
      'Bring livestock inside before dark',
      'Avoid fields and forest edges between 6PM and 6AM',
      'Report to Asha Worker with GPS location of animal sighting',
      'Light fires or torches around farm boundaries at night'],

      prevention: [
      'Apply for government compensation for any crop or livestock damage',
      'Coordinate with neighbours for night watch rotations',
      'Install motion-activated lights around homes']

    },
    info: {
      headline: 'ℹ️ ANIMAL MOVEMENT MONITORED',
      hindi: 'ℹ️ पशु आवाजाही निगरानी में',
      message: (loc) => `Animal movement has been recorded near village areas at ${loc}. No immediate danger, but please remain alert. Report any livestock loss or crop damage to your Asha Worker for compensation claim.`,
      solutions: [
      'Stay alert and report any fresh animal signs (tracks, droppings)',
      'File a crop damage report with your Asha Worker for documentation'],

      prevention: [
      'Install BioGuard early warning sensor traps on forest trails',
      'Learn how to coexist safely with local wildlife species']

    }
  },

  Other: {
    critical: {
      headline: '🚨 CRITICAL ENVIRONMENTAL ALERT',
      hindi: '🚨 गंभीर पर्यावरण चेतावनी',
      message: (loc) => `A critical environmental event has been detected near ${loc}. Please follow all instructions from local authorities. Stay informed through BioGuard and your Asha Worker.`,
      solutions: [
      'Stay indoors and await instructions from authorities',
      'Call 1800-11-0027 for forest/environment emergencies',
      'Report the situation using BioGuard app'],

      prevention: [
      'Stay updated through BioGuard alerts',
      'Participate in village-level disaster preparedness training']

    },
    warning: {
      headline: '⚠️ ENVIRONMENTAL WARNING',
      hindi: '⚠️ पर्यावरण चेतावनी',
      message: (loc) => `An environmental issue has been flagged near ${loc}. Please stay alert and report anything unusual to your Asha Worker or through BioGuard.`,
      solutions: [
      'Report to your Asha Worker',
      'Use BioGuard app to submit photos or details'],

      prevention: [
      'Participate in BioGuard awareness programs',
      'Follow environmental guidelines shared by the forest department']

    },
    info: {
      headline: 'ℹ️ ENVIRONMENTAL NOTICE',
      hindi: 'ℹ️ पर्यावरण सूचना',
      message: (loc) => `An environmental update has been logged for the ${loc} area. Please stay informed and cooperate with any surveys or studies being conducted nearby.`,
      solutions: ['Stay informed and cooperate with authorities'],
      prevention: ['Keep reporting unusual events through BioGuard']
    }
  }
};

function generateAlertMessage(type, severity, location) {
  const typeTemplate = TEMPLATES[type] || TEMPLATES.Other;
  const sevTemplate = typeTemplate[severity] || typeTemplate.info || TEMPLATES.Other.info;

  const headline = sevTemplate.headline;
  const hindi = sevTemplate.hindi;
  const villageMessage = sevTemplate.message(location);
  const solutions = sevTemplate.solutions;
  const prevention = sevTemplate.prevention;

  const whatsappText = [
  `${headline}`,
  `${hindi}`,
  ``,
  `📍 स्थान / Location: ${location}`,
  ``,
  villageMessage,
  ``,
  `✅ क्या करें / What To Do:`,
  ...solutions.map((s, i) => `${i + 1}. ${s}`),
  ``,
  `🛡️ बचाव / Prevention:`,
  ...prevention.map((p, i) => `${i + 1}. ${p}`),
  ``,
  `📞 वन विभाग हेल्पलाइन / Forest Helpline: 1800-11-0027`,
  `📞 आपातकाल / Emergency: 108 | 101 | 112`,
  ``,
  `— BioGuard NE India 🌿`].
  join('\n');

  return { headline, hindi, villageMessage, solutions, prevention, whatsappText };
}

module.exports = { generateAlertMessage };