import React, { useState } from 'react';
import { IconX, IconStarFilled, IconStar, IconCheck, IconShieldCheck } from '@tabler/icons-react';
import { useSubmitSchoolReviewMutation } from '../store/marketplaceApi.js';

export default function ReviewModal({ school, isOpen, onClose }) {
  if (!isOpen || !school) return null;

  const [reviewerName, setReviewerName] = useState('');
  const [reviewerPhone, setReviewerPhone] = useState('');
  const [reviewerEmail, setReviewerEmail] = useState('');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!reviewerName.trim() || !reviewText.trim()) {
      setErrorMessage('Please provide your name and review comments.');
      return;
    }

    if (reviewText.trim().length < 10) {
      setErrorMessage('Please write a detailed review of at least 10 characters.');
      return;
    }

    try {
      const res = await submitReview({
        slug: school.slug,
        reviewer_name: reviewerName,
        reviewer_phone: reviewerPhone || undefined,
        reviewer_email: reviewerEmail || undefined,
        relationship,
        overall_rating: overallRating,
        academics_rating: academicsRating,
        infrastructure_rating: infrastructureRating,
        faculty_rating: facultyRating,
        safety_rating: safetyRating,
        value_for_money_rating: valueForMoneyRating,
        title: title || undefined,
        review_text: reviewText
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
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '14px',
        width: '100%',
        maxWidth: '580px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#064e3b',
          color: '#ffffff'
        }}>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#a7f3d0', fontWeight: '700' }}>
              SHARE VERIFIED PARENT REVIEW (5-AXIS UGC)
            </div>
            <h2 style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: '700' }}>
              {school.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#a7f3d0',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <IconX size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
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
                Your review has been verified and posted on the public school micro-site. Your insights help fellow parents make informed education choices.
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

              {/* Notice that parents cannot upload photos */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '8px 12px',
                fontSize: '11px',
                color: '#64748b',
                marginBottom: '14px'
              }}>
                ℹ️ To maintain strict authenticity, reviews are limited to written ratings and feedback. Photos are curated directly by school administration.
              </div>

              {/* 5-Axis Rating Box */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '18px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#0f172a', textTransform: 'uppercase', marginBottom: '8px' }}>
                  RATE ACROSS 5 KEY DIMENSIONS
                </div>
                {renderStarPicker('Overall Experience *', overallRating, setOverallRating)}
                {renderStarPicker('Academic Excellence', academicsRating, setAcademicsRating)}
                {renderStarPicker('Campus & Sports Infrastructure', infrastructureRating, setInfrastructureRating)}
                {renderStarPicker('Teaching Quality & Care', facultyRating, setFacultyRating)}
                {renderStarPicker('Campus Safety & Transport', safetyRating, setSafetyRating)}
                {renderStarPicker('Value for Money / Fees', valueForMoneyRating, setValueForMoneyRating)}
              </div>

              {/* Reviewer Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
                    YOUR FULL NAME *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Rajesh Kulkarni"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
                    RELATIONSHIP TO SCHOOL
                  </label>
                  <select
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <option value="Parent">Parent of Current Student</option>
                    <option value="Alumni">Alumnus / Former Student</option>
                    <option value="Guardian">Guardian / Family Member</option>
                  </select>
                </div>
              </div>

              {/* Review Title */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
                  REVIEW HEADLINE
                </label>
                <input
                  type="text"
                  placeholder="e.g. Excellent academics and caring faculty"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px'
                  }}
                />
              </div>

              {/* Review Text */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
                  DETAILED COMMENTS / FEEDBACK *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Share details about the teaching methodology, safety, school bus, sports, or management..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Submit */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#64748b',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '8px 16px',
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
                    padding: '8px 20px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: isLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isLoading ? 'Publishing...' : 'Publish Verified Review'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

