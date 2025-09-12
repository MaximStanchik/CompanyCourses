import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faEnvelope, faMapMarkerAlt, faFlag, faBuilding, faBriefcase, faIdBadge, faBullseye, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

const UserProfileModal = ({ open, onClose, user = {}, profile = {}, dark = false, borderColor = dark ? '#3c4250' : '#e9ecef', skillsFirst = false }) => {
	if (!open) return null;
	const primary = '#3976a8';
	const avatarText = (user.username || user.email || 'U')[0]?.toUpperCase();
	const bg = dark ? 'linear-gradient(135deg,#232526 0%,#414345 100%)' : '#ffffff';

	const SkillsBlock = () => (
		Array.isArray(profile.skills) && profile.skills.length > 0 ? (
			<div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
				{profile.skills.map((s, i) => (
					<span key={i} style={{ background: primary, color: '#fff', padding: '4px 10px', borderRadius: 6, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>{s}</span>
				))}
			</div>
		) : null
	);

	return (
		<>
			<div onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#0008', zIndex: 9998 }} />
			<div style={{
				position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
				width: 420, maxWidth: '92vw', background: bg, borderRadius: 20,
				boxShadow: '0 8px 32px rgba(0,0,0,0.18)', border: `1px solid ${borderColor}`, zIndex: 9999, padding: 24,
				color: dark ? '#eaf4fd' : '#1d1d25', textAlign: 'center'
			}}>
				<button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: dark ? '#eaf4fd' : '#666' }}>
					<FontAwesomeIcon icon={faTimes} />
				</button>
				<h3 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{user.username || user.email || 'User'}</h3>
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 16 }}>
					<div style={{ width: 92, height: 92, borderRadius: '50%', border: `3px solid ${primary}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 800, color: primary }}>
						{avatarText}
					</div>
				</div>
				{skillsFirst && <SkillsBlock />}
				<div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, color: dark ? '#cfd8dc' : '#555', alignItems: 'center', marginTop: 10 }}>
					{(profile.email || user.email) && (
						<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
							<FontAwesomeIcon icon={faEnvelope} /> {(profile.email || user.email)}
						</div>
					)}
					{profile.bio && <div style={{ fontStyle: 'italic', maxWidth: 360 }}>{profile.bio}</div>}
				</div>
				{/* info rows */}
				<div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10, marginTop: 16, fontSize: 14, justifyItems: 'center' }}>
					{profile.city && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FontAwesomeIcon icon={faMapMarkerAlt} /> {profile.city}</div>}
					{profile.country && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FontAwesomeIcon icon={faFlag} /> {profile.country}</div>}
					{profile.company && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FontAwesomeIcon icon={faBuilding} /> {profile.company}</div>}
					{profile.position && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FontAwesomeIcon icon={faBriefcase} /> {profile.position}</div>}
					{profile.jobTitle && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FontAwesomeIcon icon={faIdBadge} /> {profile.jobTitle}</div>}
					{profile.goal && (
						<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
							<div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
								<FontAwesomeIcon icon={faBullseye} /> Профессиональная или личная цель:
							</div>
							<div style={{ color: dark ? '#cfd8dc' : '#666', textAlign: 'center', lineHeight: '1.4' }}>{profile.goal}</div>
						</div>
					)}
					{profile.status && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FontAwesomeIcon icon={faInfoCircle} /> {profile.status}</div>}
				</div>
				{!skillsFirst && <SkillsBlock />}
				<div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
					<button onClick={onClose} style={{ background: primary, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 16px', fontWeight: 700, cursor: 'pointer' }}>OK</button>
				</div>
			</div>
		</>
	);
};

export default UserProfileModal; 