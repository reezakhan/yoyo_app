import { registerSheet } from 'react-native-actions-sheet';
import { CustomActionSheet } from '@/components/ui/ActionSheet';
import { SearchActionSheet } from '@/components/ui/SearchActionSheet';
import { FiltersActionSheet } from '@/components/ui/FiltersActionSheet';
import { ModifyBookingActionSheet } from '@/components/ui/ModifyBookingActionSheet';
import { ContactHotelActionSheet } from '@/components/ui/ContactHotelActionSheet';
import { AmenitiesActionSheet } from '@/components/ui/AmenitiesActionSheet';
import { RoomUpgradeActionSheet } from '@/components/ui/RoomUpgradeActionSheet';
import { ReviewsActionSheet } from '@/components/ui/ReviewsActionSheet';
import { EditStayActionSheet } from '@/components/ui/EditStayActionSheet';
import { CouponsActionSheet } from '@/components/ui/CouponsActionSheet';
import { AddonSelectionSheet } from '@/components/ui/AddonSelectionSheet';
import { SortActionSheet } from '@/components/ui/SortActionSheet';
import { PriceFilterActionSheet } from '@/components/ui/PriceFilterActionSheet';
import { RatingFilterActionSheet } from '@/components/ui/RatingFilterActionSheet';
import { AmenitiesFilterActionSheet } from '@/components/ui/AmenitiesFilterActionSheet';
import { OffersActionSheet } from '@/components/ui/OffersActionSheet';
import { ModifyGuestNameActionSheet } from '@/components/ui/ModifyGuestNameActionSheet';
import { RoomSelectionSheet } from '@/components/ui/RoomSelectionSheet';
import ReviewSheet from '@/components/ui/ReviewSheet';

export const SHEET_IDS = {
  PROFILE_OPTIONS: 'profile-options',
  AMENITIES: 'amenities',
  REVIEWS: 'reviews',
  UPGRADEROOM: 'upgraderoom',
  SEARCH: 'search',
  CONTACT_HOTEL: 'contact-hotel',
  MODIFY_BOOKING: 'modify-booking',
  FILTERS: 'filters',
  ADDON_SELECTION: 'addon-selection',
  ROOM_SELCTION: 'roomSelection'
} as const;

registerSheet('profile-options', CustomActionSheet);
registerSheet('amenities', AmenitiesActionSheet);
registerSheet('reviews', ReviewsActionSheet);
registerSheet('upgraderoom', RoomUpgradeActionSheet);
registerSheet('search', SearchActionSheet);
registerSheet('editstay', EditStayActionSheet);
registerSheet('contact-hotel', ContactHotelActionSheet);
registerSheet('modify-booking', ModifyBookingActionSheet);
registerSheet('filters', FiltersActionSheet);
registerSheet('coupons-sheet', CouponsActionSheet);
registerSheet('addon-selection', AddonSelectionSheet);
registerSheet('sort-options', SortActionSheet);
registerSheet('price-filter', PriceFilterActionSheet);
registerSheet('rating-filter', RatingFilterActionSheet);
registerSheet('amenities-filter', AmenitiesFilterActionSheet);
registerSheet('offers-filter', OffersActionSheet);
registerSheet('modify-guest-name', ModifyGuestNameActionSheet);
registerSheet(SHEET_IDS.ROOM_SELCTION, RoomSelectionSheet);
registerSheet('review-sheet', ReviewSheet);
registerSheet('reviews-action-sheet',ReviewsActionSheet)

// Export the sheet IDs for type safety


// export type SheetId = typeof SHEET_IDS[keyof typeof SHEET_IDS];

export type SheetId = typeof SHEET_IDS[keyof typeof SHEET_IDS];

// Default export required by expo-router
// export default function Sheets() {
//   return null;
// }