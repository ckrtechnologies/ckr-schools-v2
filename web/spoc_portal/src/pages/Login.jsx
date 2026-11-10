import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { Globe2, LogIn, Sparkles } from 'lucide-react';
import { loginSuccess } from '../features/authSlice';
import { login, getTenantSlug } from '../services/api';
import { applySchoolBranding, fetchSchoolProfile, resolveAssetUrl } from '../utils/branding';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [tenantSlug, setTenantSlug] = useState(searchParams.get('tenant') || searchParams.get('school') || getTenantSlug() || '');
  const [schoolProfile, setSchoolProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingProfile(true);
      const profile = await fetchSchoolProfile(tenantSlug);
      if (profile && mounted) {
        setSchoolProfile(profile);
        if (profile.slug) {
          setTenantSlug(profile.slug);
          localStorage.setItem('spocTenantSlug', profile.slug);
        }
        applySchoolBranding(profile, 'SPOC Portal');
      }
      if (mounted) setLoadingProfile(false);
    })();
    return () => {
      mounted = false;
    };
  }, [tenantSlug]);

  const schoolName = schoolProfile?.name || 'School Campus';
  const motto = schoolProfile?.motto || 'Public Domain Portal';
  const logo = resolveAssetUrl(schoolProfile?.logoUrl || schoolProfile?.logo_url);
  const brandColor = schoolProfile?.themeColor || '#064e3b';

  const handleLogin = async (event) => {
    event.preventDefault();
    if (!email || !password) {
      toast.error('Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      if (tenantSlug) localStorage.setItem('spocTenantSlug', tenantSlug);
      const response = await login({ email, password }, tenantSlug);
      const user = response.data?.user;
      const token = response.data?.token || response.data?.accessToken;

      if (!user || !token) {
        toast.error('Login failed. Please try again.');
        return;
      }

      if (!['spoc', 'super_admin'].includes(user.type)) {
        toast.error('This portal is for school SPOC accounts. Please use the school admin panel.');
        return;
      }

      if (user.schoolSlug) localStorage.setItem('spocTenantSlug', user.schoolSlug);
      dispatch(loginSuccess({ user, token }));
      applySchoolBranding(user, 'SPOC Portal');
      toast.success(`Welcome, ${user.name || 'SPOC'}`);
      navigate('/overview');
    } catch (error) {
      const message = error.response?.data?.error?.message || error.response?.data?.message || 'Invalid credentials.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: '#f8fafc' }}>
      <div
        style={{
          maxWidth: '430px',
          width: '100%',
          padding: '2.4rem 2.2rem',
          borderRadius: '18px',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.12)',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.8rem' }}>
          <div
            style={{
              width: '68px',
              height: '68px',
              margin: '0 auto 1rem',
              borderRadius: '50%',
              padding: '3px',
              background: `linear-gradient(135deg, ${brandColor}, #3b82f6)`,
              boxShadow: `0 8px 18px ${brandColor}33`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {logo ? (
              <img src={logo} alt={schoolName} style={{ height: '100%', width: '100%', borderRadius: '50%', objectFit: 'cover', backgroundColor: '#ffffff' }} />
            ) : (
              <div
                style={{
                  height: '100%',
                  width: '100%',
                  borderRadius: '50%',
                  backgroundColor: brandColor,
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.6rem',
                  fontWeight: 800,
                }}
              >
                {schoolName.charAt(0)}
              </div>
            )}
          </div>

          <h2 style={{ fontSize: '1.55rem', fontWeight: 800, marginBottom: '0.35rem', lineHeight: 1.2, color: '#0f172a' }}>
            {loadingProfile ? 'Loading School Campus...' : schoolName}
          </h2>
          {motto && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 12px',
                borderRadius: '14px',
                backgroundColor: '#ecfdf5',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: brandColor,
                marginBottom: '6px',
              }}
            >
              <Sparkles size={13} color={brandColor} />
              <span>{motto}</span>
            </div>
          )}
          <p style={{ color: '#64748b', fontSize: '0.8rem' }}>School SPOC Portal — Public Domain</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
              SPOC Email Address
            </label>
            <input
              type="email"
              placeholder="e.g. spoc@school.edu.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              style={{ width: '100%', padding: '0.75rem 0.9rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '0.75rem 0.9rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              marginTop: '0.6rem',
              padding: '0.85rem',
              fontSize: '0.95rem',
              fontWeight: 600,
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              backgroundColor: brandColor,
              boxShadow: `0 4px 12px ${brandColor}44`,
            }}
          >
            {loading ? 'Authenticating...' : <><LogIn size={17} /> Sign In</>}
          </button>
        </form>

        <div style={{ marginTop: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11.5px', color: '#64748b' }}>
          <Globe2 size={13} />
          Manages the CKR Marketplace public page for this school
        </div>
      </div>
    </div>
  );
};

export default Login;
