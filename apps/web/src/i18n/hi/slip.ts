import type { slip as en } from '../en/slip';

export const slip: Record<keyof typeof en, string> = {
  'slip.title': 'आपकी ओपीडी पर्ची',
  'slip.token': 'टोकन',
  'slip.name': 'नाम',
  'slip.dept': 'विभाग',
  'slip.room': 'कमरा',
  'slip.floor': 'मंज़िल',
  'slip.doctor': 'डॉक्टर',
  'slip.ahead': 'आगे कितने लोग',
  'slip.wait': 'अंदाज़न इंतज़ार',
  'slip.roomLater': 'बुलाने पर कमरा बताया जाएगा',
  'slip.qr': 'अपनी बारी देखने के लिए स्कैन करें',
  'slip.keep': 'यह पर्ची संभालकर रखें। स्टाफ़ इसे देखना चाह सकते हैं।',
  'slip.readAloud': 'पढ़कर सुनाएँ',
  'slip.showStaff': 'स्टाफ़ को दिखाएँ',
  'slip.myTurn': 'मेरी बारी देखें',
  'slip.findRoom': 'मेरा कमरा खोजें',
  'slip.route': 'वहाँ कैसे पहुँचें',
  'slip.largeTitle': 'कृपया यह कमरा ढूँढने में मेरी मदद करें',
  'slip.speech': 'आपका टोकन {token} है। {dept}। {floor} पर {room} में जाइए।',
};
