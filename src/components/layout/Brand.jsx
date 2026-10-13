import { Link } from 'react-router-dom';

export function BrandMark({ size = 38, className = 'brand-mark' }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 40 40" role="img" aria-label="EmergencyLink logo">
      <rect width="40" height="40" rx="10" fill="#0f5c63" />
      <path d="M13 20 26 12M13 20l13 8" stroke="#8fe0d0" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="12" cy="20" r="4.2" fill="#fff" /><circle cx="27" cy="11.5" r="3.4" fill="#fff" /><circle cx="27" cy="28.5" r="3.4" fill="#fff" />
      <path d="M12 18.2v3.6M10.2 20h3.6" stroke="#0f5c63" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function Brand({ to = '/', sub = 'Emergency Healthcare Referral Coordination' }) {
  return (
    <Link to={to} className="brand" aria-label="EmergencyLink home">
      <BrandMark />
      <span><span className="brand-name">EmergencyLink</span><br /><span className="brand-sub">{sub}</span></span>
    </Link>
  );
}
