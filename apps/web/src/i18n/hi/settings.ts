import type { settings as en } from '../en/settings';

export const settings: Record<keyof typeof en, string> = {
  'settings.title': 'सेटिंग्स',
  'settings.language': 'भाषा',
  'settings.textSize': 'अक्षरों का आकार',
  'settings.textSize.normal': 'सामान्य',
  'settings.textSize.large': 'बड़ा',
  'settings.textSize.largest': 'सबसे बड़ा',
  'settings.contrast': 'ज़्यादा कंट्रास्ट',
  'settings.contrast.hint': 'गहरे अक्षर और साफ़ रंग',
  'settings.readAloud': 'सब कुछ पढ़कर सुनाएँ',
  'settings.avoidStairs': 'सीढ़ियों से बचें',
  'settings.assisted': 'कोई मेरी मदद कर रहा है',
  'settings.on': 'चालू',
  'settings.off': 'बंद',
  'settings.noHindiVoice': 'इस फ़ोन में हिंदी आवाज़ नहीं है, इसलिए हिंदी में सुनना काम नहीं करेगा।',
  'settings.helpline104': 'सेहत की सलाह: 104 पर कॉल करें (इमरजेंसी के लिए नहीं)',
  'settings.staffLink': 'अस्पताल स्टाफ़ के लिए',
};
