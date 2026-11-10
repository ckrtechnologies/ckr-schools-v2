import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import MarqueeTicker from './components/MarqueeTicker.jsx';
import Navbar from './components/Navbar.jsx';
import HomeView from './views/HomeView.jsx';
import SchoolProfileView from './views/SchoolProfileView.jsx';
import CompareView from './views/CompareView.jsx';
import ComparisonTray from './components/ComparisonTray.jsx';
import EnquiryModal from './components/EnquiryModal.jsx';
import BrochureModal from './components/BrochureModal.jsx';
import MultiEnquiryModal from './components/MultiEnquiryModal.jsx';

export default function App() {
  // View routing state
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'school-profile' | 'compare'
  const [activeSlug, setActiveSlug] = useState(null);

  // Modal state
  const [enquirySchool, setEnquirySchool] = useState(null);
  const [brochureSchool, setBrochureSchool] = useState(null);
  const [multiEnquiryOpen, setMultiEnquiryOpen] = useState(false);

  // Redux comparison state
  const comparedSchools = useSelector(state => state.comparison.comparedSchools);

  const handleSelectSchool = (slug) => {
    setActiveSlug(slug);
    setCurrentView('school-profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenComparison = () => {
    setCurrentView('compare');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app-root">
      {/* Always-visible ticker at top */}
      <MarqueeTicker />

      {/* Sticky navbar */}
      <Navbar
        currentView={currentView}
        onNavigateHome={handleBackToHome}
        onNavigateCompare={handleOpenComparison}
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
          />
        )}
      </main>

      {/* Always-visible floating comparison tray */}
      <ComparisonTray
        onOpenComparison={handleOpenComparison}
        onOpenMultiEnquiry={() => setMultiEnquiryOpen(true)}
      />

      {/* Modals */}
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

