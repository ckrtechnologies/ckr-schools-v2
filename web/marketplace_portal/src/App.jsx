import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import MarqueeTicker from './components/MarqueeTicker.jsx';
import Navbar from './components/Navbar.jsx';
import HomeView from './views/HomeView.jsx';
import SchoolProfileView from './views/SchoolProfileView.jsx';
import CompareView from './views/CompareView.jsx';
import CatalogView from './views/CatalogView.jsx';
import ComparisonTray from './components/ComparisonTray.jsx';
import EnquiryModal from './components/EnquiryModal.jsx';
import BrochureModal from './components/BrochureModal.jsx';
import MultiEnquiryModal from './components/MultiEnquiryModal.jsx';
import LoginModal from './components/LoginModal.jsx';
import { useGetMeQuery } from './store/marketplaceApi.js';
import { setCredentials } from './store/authSlice.js';
import { useMarketplaceRoute } from './hooks/useMarketplaceRoute.js';

export default function App() {
  // Path based routing: / | /schools | /schools/:slug | /compare
  const { view: currentView, slug: activeSlug, navigate } = useMarketplaceRoute();

  // Modal state
  const [enquirySchool, setEnquirySchool] = useState(null);
  const [brochureSchool, setBrochureSchool] = useState(null);
  const [multiEnquiryOpen, setMultiEnquiryOpen] = useState(false);

  // Redux comparison state
  const dispatch = useDispatch();
  const comparedSchools = useSelector(state => state.comparison.comparedSchools);
  const { isLoginOpen, token } = useSelector(state => state.auth);

  // Refresh the signed-in account so inquiry forms stay pre-filled after a reload.
  const { data: meRes } = useGetMeQuery(undefined, { skip: !token });

  useEffect(() => {
    if (meRes?.data && token) {
      dispatch(setCredentials({ token, user: meRes.data }));
    }
  }, [meRes, token, dispatch]);

  const handleSelectSchool = (slug) => {
    navigate('school-profile', slug);
  };

  const handleOpenCatalog = () => {
    navigate('catalog');
  };

  const handleOpenComparison = () => {
    navigate('compare');
  };

  const handleBackToHome = () => {
    navigate('home');
  };

  return (
    <div className="app-root">
      {/* Always-visible ticker at top */}
      <MarqueeTicker />

      {/* Sticky navbar */}
      <Navbar
        currentView={currentView}
        onNavigateHome={handleBackToHome}
        onNavigateCatalog={handleOpenCatalog}
        onOpenComparison={handleOpenComparison}
        onOpenEnquiry={() => setEnquirySchool({ name: 'General Inquiry', slug: null })}
      />

      {/* View switcher */}
      <main className="app-main">
        {currentView === 'home' && (
          <HomeView
            onSelectSchool={handleSelectSchool}
            onOpenEnquiry={setEnquirySchool}
            onOpenBrochure={setBrochureSchool}
            onOpenComparison={handleOpenComparison}
            onOpenCatalog={handleOpenCatalog}
          />
        )}

        {currentView === 'catalog' && (
          <CatalogView
            onSelectSchool={handleSelectSchool}
            onOpenComparison={handleOpenComparison}
            onOpenMultiEnquiry={() => setMultiEnquiryOpen(true)}
          />
        )}

        {currentView === 'school-profile' && activeSlug && (
          <SchoolProfileView
            slug={activeSlug}
            onBack={handleBackToHome}
            onOpenEnquiry={setEnquirySchool}
            onOpenBrochure={setBrochureSchool}
            onOpenComparison={handleOpenComparison}
          />
        )}

        {currentView === 'compare' && (
          <CompareView
            onSelectSchool={handleSelectSchool}
            onOpenMultiEnquiry={() => setMultiEnquiryOpen(true)}
            onBack={handleBackToHome}
            onOpenCatalog={handleOpenCatalog}
          />
        )}
      </main>

      {/* Floating comparison tray (hidden on the matrix itself) */}
      {currentView !== 'compare' && (
        <ComparisonTray
          onOpenComparison={handleOpenComparison}
          onOpenMultiEnquiry={() => setMultiEnquiryOpen(true)}
        />
      )}

      {/* Modals */}
      <LoginModal isOpen={isLoginOpen} />
      {enquirySchool && (
        <EnquiryModal
          school={enquirySchool}
          isOpen={!!enquirySchool}
          onClose={() => setEnquirySchool(null)}
        />
      )}

      {brochureSchool && (
        <BrochureModal
          school={brochureSchool}
          isOpen={!!brochureSchool}
          onClose={() => setBrochureSchool(null)}
        />
      )}

      {multiEnquiryOpen && (
        <MultiEnquiryModal
          selectedSchools={comparedSchools}
          isOpen={multiEnquiryOpen}
          onClose={() => setMultiEnquiryOpen(false)}
        />
      )}
    </div>
  );
}

