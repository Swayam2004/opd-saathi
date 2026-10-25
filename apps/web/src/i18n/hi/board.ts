import type { board as en } from '../en/board';

export const board: Record<keyof typeof en, string> = {
  'board.nowServing': 'अभी इस नंबर की बारी है',
  'board.room': 'कमरा',
  'board.nextTokens': 'अगले',
  'board.noOne': 'कोई इंतज़ार में नहीं',
  'board.late': '{m} मिनट देरी से',
  'board.break': '{time} तक ब्रेक पर',
  'board.announce': 'टोकन {token}, कृपया {room} में जाइए।',
  'board.enableSound': 'आवाज़ चालू करें',
  'board.soundOn': 'आवाज़ चालू है',
  'board.emergency': 'इमरजेंसी? भूतल पर कैज़ुअल्टी जाइए। टोकन की ज़रूरत नहीं।',
};
