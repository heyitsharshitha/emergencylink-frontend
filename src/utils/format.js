export const fmtDateTime = (iso) => (iso ? new Date(iso).toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');
export const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
export const fmtTime = (iso) => (iso ? new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '—');

export function timeAgo(iso) {
  if (!iso) return 'never';
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h} h ago`;
  const d = Math.floor(h / 24); return `${d} day${d > 1 ? 's' : ''} ago`;
}

export const STATUS = {
  CREATED: { label: 'Created', tone: 'neutral', icon: 'FilePlus2' },
  MATCHING: { label: 'Matching', tone: 'info', icon: 'GitCompareArrows' },
  SENT: { label: 'Sent', tone: 'warning', icon: 'Send' },
  VIEWED: { label: 'Viewed', tone: 'info', icon: 'Eye' },
  MORE_INFORMATION_REQUIRED: { label: 'More info', tone: 'warning', icon: 'MessageCircleQuestion' },
  ACCEPTED: { label: 'Accepted', tone: 'success', icon: 'CircleCheck' },
  DECLINED: { label: 'Declined', tone: 'danger', icon: 'CircleX' },
  TRANSFER_IN_PROGRESS: { label: 'In transfer', tone: 'info', icon: 'Ambulance' },
  COMPLETED: { label: 'Completed', tone: 'success', icon: 'BadgeCheck' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral', icon: 'Ban' },
};
export const URGENCY = {
  CRITICAL: { label: 'Critical', tone: 'danger', icon: 'TriangleAlert' },
  URGENT: { label: 'Urgent', tone: 'warning', icon: 'Clock3' },
  STANDARD: { label: 'Standard', tone: 'info', icon: 'Minus' },
};
export const STATUS_ORDER = Object.keys(STATUS);

export const EVENT_META = {
  CREATED: { label: 'Referral created', tone: 'neutral', icon: 'FilePlus2' },
  MATCHING_COMPLETED: { label: 'Matching completed', tone: 'info', icon: 'GitCompareArrows' },
  SENT: { label: 'Referral sent', tone: 'warning', icon: 'Send' },
  VIEWED: { label: 'Viewed by receiving hospital', tone: 'info', icon: 'Eye' },
  INFO_REQUESTED: { label: 'More information requested', tone: 'warning', icon: 'MessageCircleQuestion' },
  INFO_PROVIDED: { label: 'Information provided', tone: 'info', icon: 'MessageCircleReply' },
  ACCEPTED: { label: 'Referral accepted', tone: 'success', icon: 'CircleCheck' },
  DECLINED: { label: 'Referral declined', tone: 'danger', icon: 'CircleX' },
  TRANSFER_STARTED: { label: 'Transfer in progress', tone: 'info', icon: 'Ambulance' },
  COMPLETED: { label: 'Transfer completed', tone: 'success', icon: 'BadgeCheck' },
  CANCELLED: { label: 'Referral cancelled', tone: 'neutral', icon: 'Ban' },
  ADMIN_EDITED: { label: 'Corrected by administrator', tone: 'warning', icon: 'Edit3' },
  ADMIN_REASSIGNED: { label: 'Reassigned by administrator', tone: 'warning', icon: 'Route' },
  ADMIN_CANCELLED: { label: 'Cancelled by administrator', tone: 'neutral', icon: 'Ban' },
};

export const ROLE_LABEL = { REFERRING_HOSPITAL: 'Referring hospital', RECEIVING_HOSPITAL: 'Receiving hospital', ADMIN: 'Administrator' };
export const HOSPITAL_TYPES = [
  ['TERTIARY_CARE', 'Tertiary care'], ['MULTI_SPECIALTY', 'Multi-specialty'], ['DISTRICT', 'District hospital'],
  ['COMMUNITY', 'Community hospital'], ['SPECIALTY_CENTRE', 'Specialty centre'],
];
export const typeLabel = (t) => (HOSPITAL_TYPES.find(([k]) => k === t) || [, t])[1];

export const RESOURCE_LABEL = {
  GENERAL_BED: 'General beds', EMERGENCY_BED: 'Emergency beds', ICU_BED: 'ICU beds', VENTILATOR: 'Ventilators', BLOOD_UNITS: 'Blood units',
  OXYGEN_POINTS: 'Oxygen supply points', OPERATING_THEATRE: 'Operating theatres', SPECIALIST_ON_CALL: 'Specialists on call',
};

export const ACTION_LABEL = {
  LOGIN: 'Signed in', LOGOUT: 'Signed out', REFERRAL_CREATED: 'Referral created', REFERRAL_SENT: 'Referral sent', REFERRAL_ACCEPTED: 'Referral accepted',
  REFERRAL_DECLINED: 'Referral declined', REFERRAL_CANCELLED: 'Referral cancelled', REFERRAL_COMPLETED: 'Referral completed', RESOURCES_UPDATED: 'Resources updated',
  HOSPITAL_UPDATED: 'Hospital updated', HOSPITAL_REGISTERED: 'Hospital registered', HOSPITAL_ACTIVATED: 'Hospital activated', HOSPITAL_DEACTIVATED: 'Hospital deactivated',
  USER_ACTIVATED: 'User activated', USER_DEACTIVATED: 'User deactivated', REPORT_EXPORTED: 'Report exported',
  HOSPITAL_CREATED: 'Hospital created', HOSPITAL_ADMIN_EDITED: 'Hospital edited by admin', RESOURCES_ADMIN_CORRECTED: 'Resources corrected',
  SETTINGS_UPDATED: 'Settings changed', EXCEPTION_STATE_CHANGED: 'Exception updated',
  REFERRAL_ADMIN_EDITED: 'Referral corrected', REFERRAL_REASSIGNED: 'Referral reassigned', REFERRAL_ADMIN_CANCELLED: 'Referral cancelled by admin',
  REFERRAL_FLAGGED: 'Referral flagged', REFERRAL_FLAG_RESOLVED: 'Flag resolved', ADMIN_NOTE_ADDED: 'Internal note added',
};

export const initials = (name = '') => name.replace(/\(.*?\)/g, '').split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]).join('').toUpperCase() || '?';

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
