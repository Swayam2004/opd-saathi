import type { find as en } from '../en/find';

export const find: Record<keyof typeof en, string> = {
  'find.title': 'जगह खोजें',
  'find.search': 'जगह का नाम खोजें',
  'find.pick': 'या इनमें से चुनें',
  'find.noResults': '“{q}” नाम की कोई जगह नहीं मिली',
  'find.from': 'कहाँ से',
  'find.to': 'कहाँ तक',
  'find.youAreAt': 'आप {place} पर हैं',
  'find.steps': 'रास्ता',
  'find.distance': 'लगभग {n} मीटर',
  'find.avoidStairs': 'सीढ़ियों से बचें',
  'find.listen': 'सुनें',
  'find.lost': 'रास्ता नहीं मिल रहा',
  'find.lostHelpDesk': 'हेल्प डेस्क भूतल पर है। रास्ता यह है।',
  'find.lostCard': 'यह किसी भी स्टाफ़ को दिखाइए',
  'find.lostDest': 'मुझे यहाँ जाना है: {place}',
  'find.outOfService': '{place} अभी उपलब्ध नहीं है। आपका रास्ता दूसरी तरफ़ से है।',
  'find.noRoute': 'अभी वहाँ बिना सीढ़ी का कोई रास्ता नहीं है। कृपया हेल्प डेस्क जाइए। स्टाफ़ आपकी मदद करेंगे।',
  'find.map': 'आपके रास्ते के साथ मंज़िल का नक्शा',
  'find.zoomIn': 'बड़ा करें',
  'find.zoomOut': 'छोटा करें',
};
