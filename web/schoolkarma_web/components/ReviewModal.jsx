import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { IconX, IconStarFilled, IconCheck, IconUser } from '@tabler/icons-react';
import { useSubmitSchoolReviewMutation } from '../lib/store/marketplaceApi.js';
import SearchableSelect from './SearchableSelect.jsx';

const RELATIONSHIP_OPTIONS = [
  { value: 'Parent', label: 'Parent' },
  { value: 'Student', label: 'Student' },
  { value: 'Alumni', label: 'Alumni' },
  { value: 'Guardian', label: 'Guardian' },
  { value: 'Teacher', label: 'Teacher / Staff' },
  { value: 'Visitor', label: 'Campus Visitor' }
];

export default function ReviewModal({ school, isOpen, onClose }) {
  const { user } = useSelector((state) => state.auth);
  const [reviewerName, setReviewerName] = useState(user?.name || '');
  const [relationship, setRelationship] = useState('Parent');
  
  const [overallRating, setOverallRating] = useState(5);
  const [academicsRating, setAcademicsRating] = useState(5);
  const [infrastructureRating, setInfrastructureRating] = useState(5);
  const [facultyRating, setFacultyRating] = useState(5);
  const [safetyRating, setSafetyRating] = useState(5);
  const [valueForMoneyRating, setValueForMoneyRating] = useState(5);

  const [title, setTitle] = useState('');
  const [reviewText, setReviewText] = useState('');

  const [submitReview, { isLoading }] = useSubmitSchoolReviewMutation();
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !school) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!reviewerName.trim()) {
      setErrorMessage('Please enter your name.');
      return;
    }

    if (!reviewText.trim()) {
      setErrorMessage('Please provide your review feedback.');
      return;
    }

    if (reviewText.trim().length < 6) {
      setErrorMessage('Please write at least 6 characters in your comments.');
      return;
    }

    try {
      const res = await submitReview({
        slug: school.slug,
        reviewer_name: reviewerName.trim(),
        relationship,
        overall_rating: overallRating,
        academics_rating: academicsRating,
        infrastructure_rating: infrastructureRating,
        faculty_rating: facultyRating,
        safety_rating: safetyRating,
        value_for_money_rating: valueForMoneyRating,
        title: title || undefined,
        review_text: reviewText.trim()
      }).unwrap();

      if (res.success) {
        setIsSuccess(true);
      }
    } catch (err) {
      setErrorMessage(err.data?.error?.message || err.data?.message || 'Failed to submit review.');
    }
  };

  const renderStarPicker = (label, value, setValue) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
      <span style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>{label}</span>
      <div style={{ display: 'flex', gap: '4px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setValue(star)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px',
              color: star <= value ? '#f59e0b' : '#cbd5e1'
            }}
          >
            <IconStarFilled size={18} />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="mk-modal-overlay">
      <div className="mk-modal-card" style={{ maxWidth: '580px' }}>
        {/* Header */}
        <div className="mk-modal-header">
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#a7f3d0', fontWeight: '700' }}>
              SHARE YOUR FEEDBACK
            </div>
            <h2 style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: '700', wordBreak: 'break-word' }}>
              {school.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#a7f3d0',
              cursor: 'pointer',
              padding: '4px',
              flexShrink: 0
            }}
          >
            <IconX size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="mk-modal-body">
          {isSuccess ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#ecfdf5',
                color: '#047857',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <IconCheck size={32} />
              </div>
              <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                Thank You for Your Feedback!
              </h3>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5', maxWidth: '420px', margin: '0 auto 20px' }}>
                Your review has been posted on {school.name}'s profile. Your genuine feedback helps students, parents and educators make informed choices.
              </p>
              <button
                onClick={onClose}
                style={{
                  backgroundColor: '#064e3b',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 24px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {errorMessage && (
                <div style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  marginBottom: '14px'
                }}>
                  {errorMessage}
                </div>
              )}

              {/* Reviewer Name & Relationship */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '12px',
                marginBottom: '14px'
              }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
                    YOUR NAME *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
                    YOUR ROLE / CONNECTION
                  </label>
                  <SearchableSelect
                    value={relationship}
                    onChange={(value) => setRelationship(value)}
                    options={RELATIONSHIP_OPTIONS}
                    nullable={false}
                    compact
                    placeholder="Relationship"
                    searchPlaceholder="Select relationship…"
                  />
                </div>
              </div>

              {/* Overall Rating */}
              <div style={{
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                padding: '12px 14px',
                marginBottom: '14px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                    Overall Rating (1 to 5 Stars) *
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setOverallRating(star)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px',
                          color: star <= overallRating ? '#f59e0b' : '#cbd5e1'
                        }}
                      >
                        <IconStarFilled size={22} />
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                  {renderStarPicker('Academics & Teaching', academicsRating, setAcademicsRating)}
                  {renderStarPicker('Infrastructure & Sports Labs', infrastructureRating, setInfrastructureRating)}
                  {renderStarPicker('Faculty Mentorship & Care', facultyRating, setFacultyRating)}
                  {renderStarPicker('Student Safety & Hygiene', safetyRating, setSafetyRating)}
                  {renderStarPicker('Value for Money', valueForMoneyRating, setValueForMoneyRating)}
                </div>
              </div>

              {/* Review Title */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
                  REVIEW HEADLINE
                </label>
                <input
                  type="text"
                  placeholder="e.g. Excellent academics, supportive mentors and sports facilities"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Review Text */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
                  COMMENTS / FEEDBACK *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Share details about your experience, campus infrastructure, teachers, co-curriculars..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Submit */}
              <div className="mk-modal-actions" style={{ marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#64748b',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '9px 18px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    backgroundColor: '#064e3b',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '9px 24px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 8px rgba(6, 78, 59, 0.25)'
                  }}
                >
                  {isLoading ? 'Posting Review...' : 'Publish Review'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
