import type { dept as en } from '../en/dept';

export const dept: Record<keyof typeof en, string> = {
  'dept.MED': 'सामान्य चिकित्सा',
  'dept.MED.hint': 'बुखार, खाँसी, बीपी, शुगर',
  'dept.CHI': 'बच्चों का विभाग',
  'dept.CHI.hint': 'शिशु और बच्चे',
  'dept.WOM': 'महिला रोग और गर्भावस्था',
  'dept.WOM.hint': 'गर्भावस्था, माहवारी, महिलाओं की सेहत',
  'dept.BON': 'हड्डी और जोड़',
  'dept.BON.hint': 'हड्डी, जोड़ या कमर में दर्द',
  'dept.ENT': 'कान, नाक और गला',
  'dept.ENT.hint': 'कान में दर्द, सुनना, नाक, गला',
  'dept.EYE': 'आँख',
  'dept.EYE.hint': 'नज़र, लाल या दर्द वाली आँखें',
  'dept.SKI': 'त्वचा',
  'dept.SKI.hint': 'दाने, खुजली, त्वचा की तकलीफ़',
};
