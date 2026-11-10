import { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  LayoutDashboard,
  Building2,
  Star,
  Images,
  Newspaper,
  UserPlus,
  LogOut,
  ExternalLink,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';
import { logout } from '../features/authSlice';
import UserAvatar from '../components/UserAvatar';
import { applySchoolBranding, resolveAssetUrl } from '../utils/branding';
import { getOverview, marketplaceSchoolUrl } from '../services/api';

const NAV_ITEMS = [
  { to: '/overview', label: 'Overview', icon: LayoutDashboard, color: '#059669', bg: 'rgba(16, 185, 129, 0.15)' },
  { to: '/profile', label: 'Profile', icon: Building2, color: '#0891b2', bg: 'rgba(8, 145, 178, 0.15)' },
  { to: '/reviews', label: 'Reviews', icon: Star, color: '#d97706', bg: 'rgba(217, 119, 6, 0.15)' },
  { to: '/gallery', label: 'Gallery', icon: Images, color: '#db2777', bg: 'rgba(219, 39, 119, 0.15)' },
  { to: '/press', label: 'Press', icon: Newspaper, color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.15)' },
  { to: '/leads', label: 'Leads', icon: UserPlus, color: '#2563eb', bg: 'rgba(37, 99, 235, 0.15)' },
];

const NavItem = ({ item }) => {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.32rem 0.5rem',
        borderRadius: '6px',
        color: isActive ? 'var(--accent-primary)' : 'var(--text-primary)',
        background: isActive ? 'var(--accent-light)' : 'transparent',
        textDecoration: 'none',
        transition: 'all 0.2s ease',
        borderLeft: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent',
      })}
    >
      <div
        style={{
          width: '22px',
          height: '22px',
          borderRadius: '5px',
          background: item.bg,
          color: item.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={12.5} strokeWidth={2.4} />
      </div>
      <span style={{ flex: 1, fontSize: '0.82rem', fontWeight: 600, lineHeight: 1.2 }}>{item.label}</span>
    </NavLink>
  );
};

const SECTION_TITLES = {
  '/overview': 'Overview',
  '/profile': 'Profile',
  '/reviews': 'Reviews',
  '/gallery': 'Gallery',
  '/press': 'Press',
  '/leads': 'Leads',
};

export default function SpocLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const authUser = useSelector((state) => state.auth.user);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [verifiedSlug, setVerifiedSlug] = useState(null);

  const user = authUser || (() => {
    try {
      return JSON.parse(localStorage.getItem('spocUser')) || null;
    } catch (e) {
      return null;
    }
  })();

  useEffect(() => {
    if (user) applySchoolBranding(user, 'SPOC Portal');
  }, [user]);

  // The server is the source of truth for the school slug — a cached user object
  // must never point "Public Page" at another school.
  useEffect(() => {
    let mounted = true;
    getOverview()
      .then((res) => {
        const slug = res.data?.data?.school?.slug;
        if (mounted && slug) setVerifiedSlug(slug);
      })
      .catch(() => {
        /* the cached slug below is good enough if the probe fails */
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const sectionTitle = SECTION_TITLES[location.pathname] || 'Overview';
  const logo = resolveAssetUrl(user?.logoUrl || user?.logo_url);
  const schoolSlug = verifiedSlug || user?.schoolSlug || user?.school_slug || user?.tenant_slug || null;
  const publicUrl = schoolSlug ? marketplaceSchoolUrl(schoolSlug) : null;

  return (
    <div className="spoc-shell">
      {sidebarOpen && (
        <div className="spoc-scrim" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      )}
      <aside
        className={`glass-panel spoc-sidebar${sidebarOpen ? ' is-open' : ''}`}
        style={{
          padding: '0.55rem 0.6rem',
          display: 'flex',
          flexDirection: 'column',
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
          height: '100%',
          overflow: 'hidden',
        }}
      >
        <div style={{ marginBottom: '0.55rem', display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
          {logo ? (
            <img
              src={logo}
              alt={user?.schoolName || 'School'}
              style={{ height: '34px', width: '34px', borderRadius: '50%', objectFit: 'cover', boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }}
            />
          ) : (
            <div
              style={{
                height: '34px',
                width: '34px',
                borderRadius: '50%',
                backgroundColor: user?.themeColor || '#064e3b',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '14px',
              }}
            >
              {(user?.schoolName || 'S').charAt(0)}
            </div>
          )}
          <button
            type="button"
            className="spoc-sidebar-close ckr-icon-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={15} />
          </button>
          <div style={{ minWidth: 0 }}>
            <h2
              style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                lineHeight: 1.15,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user?.schoolName || 'School'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 600, lineHeight: 1.1 }}>SPOC Portal</p>
          </div>
        </div>

        <nav
          className="sidebar-nav"
          style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1px', overflowY: 'auto', paddingBottom: '0.35rem' }}
        >
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.to} item={item} />
          ))}

          {publicUrl && (
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.32rem 0.5rem',
                borderRadius: '6px',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                marginTop: '4px',
              }}
            >
              <div
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '5px',
                  background: 'rgba(100, 116, 139, 0.15)',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <ExternalLink size={12.5} strokeWidth={2.4} />
              </div>
              <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Public Page</span>
            </a>
          )}
        </nav>

        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--glass-border)', paddingTop: '0.45rem' }}>
          <div style={{ marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <UserAvatar src={user?.avatar_url} name={user?.name || 'SPOC'} size={28} />
            <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', lineHeight: 1.2 }}>
                {user?.name || 'SPOC'}
              </p>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'capitalize', lineHeight: 1.1 }}>
                {user?.type || 'spoc'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="btn btn-ghost"
            style={{
              width: '100%',
              justifyContent: 'center',
              gap: '0.4rem',
              color: '#dc2626',
              backgroundColor: 'rgba(220, 38, 38, 0.06)',
              border: '1px solid rgba(220, 38, 38, 0.15)',
              fontSize: '0.8rem',
              padding: '0.28rem 0.5rem',
            }}
          >
            <LogOut size={13} />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="spoc-content">
        <header
          style={{
            height: '56px',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '0 20px',
            background: '#ffffff',
            borderBottom: '1px solid var(--glass-border)',
            position: 'sticky',
            top: 0,
            zIndex: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <button
              type="button"
              className="spoc-hamburger ckr-icon-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={16} />
            </button>
            <h1 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)' }}>{sectionTitle}</h1>
            <span className="spoc-section-tag" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
              Public Domain
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              onMouseEnter={() => setAvatarOpen(true)}
              onMouseLeave={() => setAvatarOpen(false)}
              style={{ position: 'relative' }}
            >
              <button
                type="button"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px',
                }}
              >
                <UserAvatar src={user?.avatar_url} name={user?.name || 'SPOC'} size={30} />
                <ChevronDown size={13} color="var(--text-secondary)" />
              </button>

              {avatarOpen && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '40px',
                    width: '238px',
                    background: '#ffffff',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 12px 28px -12px rgba(15, 23, 42, 0.35)',
                    padding: '12px',
                    zIndex: 40,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                    <UserAvatar src={user?.avatar_url} name={user?.name || 'SPOC'} size={32} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user?.name || 'SPOC'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user?.email || 'spoc@school'}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="ckr-pill" style={{ background: '#dcfce7', color: '#15803d' }}>SPOC</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{user?.schoolName || 'School'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="btn btn-ghost"
                    style={{ width: '100%', marginTop: '10px', justifyContent: 'center', color: '#dc2626', background: 'rgba(220,38,38,0.06)' }}
                  >
                    <LogOut size={13} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 24px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
