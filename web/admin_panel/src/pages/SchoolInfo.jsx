import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchUsers, fetchClasses, fetchInfo } from "../features/dataSlice";
import { 
    uploadFile, updateSettings, 
    addGalleryImage, deleteGalleryImage, 
    addNewsletter, deleteNewsletter,
    getSchoolProfile, updateSchoolProfile, getTenantSlug
} from "../services/api";
import { resolveAssetUrl } from "../utils/branding";
import { toast } from "react-toastify";
import { 
    Link2, Image as ImageIcon, FileText, Plus, Trash2, Edit, 
    Building, Upload, Save, ExternalLink, Globe, Mail, Phone, MapPin, X, Check
} from "lucide-react";

const ensureHttps = (url) => {
    if (!url) return "";
    let trimmed = String(url).trim();
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
};

const SchoolInfo = () => {
    const { infoSettings, infoGallery, infoNewsletters, users, classes } = useSelector((state) => state.data);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [modal, setModal] = useState(null);
    const [social, setNewSocial] = useState({ instagram_url: "", whatsapp_url: "", linkedin_url: "", twitter_url: "", facebook_url: "", youtube_url: "", website_url: "", late_fee_penalty: 10 });

    const [profile, setProfile] = useState({
        name: "",
        motto: "",
        logo_url: "",
        theme_color: "#064e3b",
        accent_color: "#10b981",
        affiliation_board: "CBSE",
        board_affiliation_number: "",
        school_code: "",
        official_email: "",
        official_phone: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        website: ""
    });
    const [originalProfile, setOriginalProfile] = useState(null);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);

    useEffect(() => {
        dispatch(fetchInfo());
        if (!users || users.length === 0) dispatch(fetchUsers());
        if (!classes || classes.length === 0) dispatch(fetchClasses());

        async function loadProfile() {
            try {
                const res = await getSchoolProfile();
                if (res.data?.success && res.data.data) {
                    setProfile(prev => ({ ...prev, ...res.data.data }));
                    setOriginalProfile(res.data.data);
                }
            } catch (e) {
                console.warn("Failed to load school profile", e);
            }
        }
        loadProfile();
    }, [dispatch]);

    const handleLogoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploadingLogo(true);
        try {
            const url = await uploadFile(file, "logo", "logo");
            if (url) {
                setProfile(prev => ({ ...prev, logo_url: url }));
                showToast("School logo uploaded. Click 'Save Identity' to apply.");
            }
        } catch (err) {
            showToast("Failed to upload logo: " + (err.response?.data?.message || err.message), "error");
        } finally {
            setIsUploadingLogo(false);
        }
    };

    const handleSaveProfile = async (e) => {
        e?.preventDefault();
        setIsSavingProfile(true);
        try {
            const sanitizedProfile = {
                ...profile,
                website: profile.website ? ensureHttps(profile.website) : ""
            };
            const res = await updateSchoolProfile(sanitizedProfile);
            setProfile(sanitizedProfile);
            setOriginalProfile(sanitizedProfile);
            setIsEditingProfile(false);
            showToast(res.data?.message || "School profile updated successfully!");
            try {
                const stored = localStorage.getItem("adminUser");
                if (stored) {
                    const parsed = JSON.parse(stored);
                    parsed.schoolName = sanitizedProfile.name;
                    parsed.logoUrl = sanitizedProfile.logo_url;
                    parsed.themeColor = sanitizedProfile.theme_color;
                    parsed.schoolAddress = sanitizedProfile.address;
                    parsed.schoolCity = sanitizedProfile.city;
                    parsed.schoolState = sanitizedProfile.state;
                    parsed.schoolPincode = sanitizedProfile.pincode;
                    parsed.boardAffiliationNumber = sanitizedProfile.board_affiliation_number;
                    parsed.schoolCode = sanitizedProfile.school_code;
                    parsed.officialEmail = sanitizedProfile.official_email;
                    parsed.officialPhone = sanitizedProfile.official_phone;
                    parsed.website = sanitizedProfile.website;
                    parsed.motto = sanitizedProfile.motto;
                    localStorage.setItem("adminUser", JSON.stringify(parsed));
                }
            } catch (err) {}
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to update profile", "error");
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleCancelEditProfile = () => {
        if (originalProfile) {
            setProfile(prev => ({ ...prev, ...originalProfile }));
        }
        setIsEditingProfile(false);
    };

    const showToast = (message, type = "success") => {
        if (type === "success") toast.success(message);
        else toast.error(message);
    };

    const handleFileUpload = async (fileUpload, bucket = "school") => {
        if (!fileUpload) return null;
        try {
            const url = await uploadFile(fileUpload, bucket);
            return url;
        } catch (err) {
            console.error("Upload failed", err);
            showToast("Failed to upload file", "error");
            return null;
        }
    };

    const handleDelete = async (type, id) => {
        if (!window.confirm("Are you sure you want to delete this record?")) return;
        try {
            let res;
            if (type === 'gallery') res = await deleteGalleryImage(id);
            else if (type === 'newsletter') res = await deleteNewsletter(id);
            
            showToast(res.data?.message || "Deleted successfully", "success");
            dispatch(fetchInfo());
        } catch (error) {
            showToast(error.response?.data?.message || "Failed to delete", "error");
        }
    };

    const handleSaveSocial = async () => {
        try {
            const sanitizedSocial = {
                ...social,
                facebook_url: social.facebook_url ? ensureHttps(social.facebook_url) : null,
                instagram_url: social.instagram_url ? ensureHttps(social.instagram_url) : null,
                whatsapp_url: social.whatsapp_url ? ensureHttps(social.whatsapp_url) : null,
                linkedin_url: social.linkedin_url ? ensureHttps(social.linkedin_url) : null,
                twitter_url: social.twitter_url ? ensureHttps(social.twitter_url) : null,
                youtube_url: social.youtube_url ? ensureHttps(social.youtube_url) : null,
                website_url: social.website_url ? ensureHttps(social.website_url) : null,
            };
            const res = await updateSettings(sanitizedSocial);
            showToast(res.data?.message || "Settings updated", "success");
            dispatch(fetchInfo());
            setModal(null);
        } catch (error) {
            showToast(error.response?.data?.message || "Error saving settings", "error");
        }
    };

    const handleUploadGallery = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = await handleFileUpload(file, "gallery");
        if (!url) return;
        try {
            const res = await addGalleryImage({ 
                title: file.name ? file.name.replace(/\.[^/.]+$/, "") : "Campus Photo",
                image_url: url,
                media_url: url 
            });
            showToast(res.data?.message || "Photo added to gallery", "success");
            dispatch(fetchInfo());
        } catch (error) {
            showToast(error.response?.data?.message || "Error saving image", "error");
        }
    };

    const handleUploadNews = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = await handleFileUpload(file, "newsletters");
        if (!url) return;
        try {
            const res = await addNewsletter({ document_url: url });
            showToast(res.data?.message || "Newsletter added", "success");
            dispatch(fetchInfo());
        } catch (error) {
            showToast(error.response?.data?.message || "Error saving newsletter", "error");
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <div>
                <h1 style={{ fontSize: "2rem", fontWeight: "800", color: "var(--text-primary)", marginBottom: "0.5rem" }}>School Information Manager</h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "1rem" }}>Manage school logo, official identity, social links, gallery, and newsletters.</p>
            </div>

            {/* SCHOOL IDENTITY & BRANDING */}
            <section className="glass-panel" style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ padding: "0.5rem", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", borderRadius: "12px" }}>
                            <Building size={20} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--text-primary)" }}>
                                {isEditingProfile ? "Edit School Identity & Official Logo" : "School Identity & Official Logo"}
                            </h2>
                            <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)" }}>
                                {isEditingProfile ? "Update school crest, board affiliation details, motto, and campus contacts." : "Official crest, affiliation details, campus contacts, and credentials."}
                            </p>
                        </div>
                    </div>
                    {isEditingProfile ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <button 
                                type="button" 
                                onClick={handleCancelEditProfile} 
                                className="btn btn-ghost" 
                                style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSaveProfile} 
                                disabled={isSavingProfile}
                                className="btn btn-primary" 
                                style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", padding: "0.5rem 1.25rem" }}
                            >
                                <Save size={16} /> {isSavingProfile ? "Saving..." : "Save Identity"}
                            </button>
                        </div>
                    ) : (
                        <button 
                            type="button"
                            onClick={() => setIsEditingProfile(true)} 
                            className="btn btn-primary" 
                            style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", padding: "0.5rem 1.25rem" }}
                        >
                            <Edit size={16} /> Edit Identity
                        </button>
                    )}
                </div>

                {isEditingProfile ? (
                    /* EDIT MODE */
                    <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: "2rem", alignItems: "start" }}>
                        {/* Logo Preview & Upload */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
                            <div style={{
                                width: "110px",
                                height: "110px",
                                borderRadius: "16px",
                                backgroundColor: profile.theme_color || "var(--primary-color, #064e3b)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                overflow: "hidden",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                border: "2px solid var(--glass-border)"
                            }}>
                                {profile.logo_url ? (
                                    <img 
                                        src={resolveAssetUrl(profile.logo_url)} 
                                        alt={profile.name || "School Logo"} 
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                                    />
                                ) : (
                                    <span style={{ fontSize: "2.5rem", color: "#ffffff", fontWeight: "800" }}>
                                        {(profile.name || "S").charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <input 
                                type="file" 
                                id="schoolLogoUpload" 
                                accept="image/*" 
                                style={{ display: "none" }} 
                                onChange={handleLogoUpload} 
                            />
                            <label 
                                htmlFor="schoolLogoUpload" 
                                className="btn btn-ghost" 
                                style={{ 
                                    display: "inline-flex", 
                                    alignItems: "center", 
                                    gap: "0.35rem", 
                                    fontSize: "0.75rem", 
                                    padding: "0.4rem 0.75rem", 
                                    cursor: "pointer",
                                    border: "1px solid var(--glass-border)" 
                                }}
                            >
                                <Upload size={14} /> {isUploadingLogo ? "Uploading..." : "Change Logo"}
                            </label>
                        </div>

                        {/* Form Fields */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
                            <div>
                                <label style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "0.35rem" }}>School Name</label>
                                <input 
                                    type="text" 
                                    className="input-glass" 
                                    value={profile.name || ""} 
                                    onChange={(e) => setProfile({ ...profile, name: e.target.value })} 
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "0.35rem" }}>Motto / Tagline</label>
                                <input 
                                    type="text" 
                                    className="input-glass" 
                                    value={profile.motto || ""} 
                                    onChange={(e) => setProfile({ ...profile, motto: e.target.value })} 
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "0.35rem" }}>Affiliation Board</label>
                                <select 
                                    className="input-glass" 
                                    value={profile.affiliation_board || "CBSE"} 
                                    onChange={(e) => setProfile({ ...profile, affiliation_board: e.target.value })}
                                >
                                    <option value="CBSE">CBSE</option>
                                    <option value="ICSE">ICSE</option>
                                    <option value="State Board">State Board</option>
                                    <option value="IB">IB</option>
                                    <option value="Cambridge">Cambridge</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "0.35rem" }}>Affiliation Number</label>
                                <input 
                                    type="text" 
                                    className="input-glass" 
                                    placeholder="e.g. CBSE/2026/8912" 
                                    value={profile.board_affiliation_number || ""} 
                                    onChange={(e) => setProfile({ ...profile, board_affiliation_number: e.target.value })} 
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "0.35rem" }}>School Code</label>
                                <input 
                                    type="text" 
                                    className="input-glass" 
                                    placeholder="e.g. 65123" 
                                    value={profile.school_code || ""} 
                                    onChange={(e) => setProfile({ ...profile, school_code: e.target.value })} 
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "0.35rem" }}>Official Contact Email</label>
                                <input 
                                    type="email" 
                                    className="input-glass" 
                                    value={profile.official_email || ""} 
                                    onChange={(e) => setProfile({ ...profile, official_email: e.target.value })} 
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "0.35rem" }}>Official Phone Number</label>
                                <input 
                                    type="text" 
                                    className="input-glass" 
                                    value={profile.official_phone || ""} 
                                    onChange={(e) => setProfile({ ...profile, official_phone: e.target.value })} 
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "0.35rem" }}>Website</label>
                                <input 
                                    type="text" 
                                    className="input-glass" 
                                    placeholder="e.g. https://www.arcschool.in"
                                    value={profile.website || ""} 
                                    onChange={(e) => setProfile({ ...profile, website: e.target.value })} 
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "0.35rem" }}>Campus Address</label>
                                <input 
                                    type="text" 
                                    className="input-glass" 
                                    placeholder="e.g. Sector 128, Expressway"
                                    value={profile.address || ""} 
                                    onChange={(e) => setProfile({ ...profile, address: e.target.value })} 
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "0.35rem" }}>City</label>
                                <input 
                                    type="text" 
                                    className="input-glass" 
                                    value={profile.city || ""} 
                                    onChange={(e) => setProfile({ ...profile, city: e.target.value })} 
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "0.35rem" }}>State</label>
                                <input 
                                    type="text" 
                                    className="input-glass" 
                                    value={profile.state || ""} 
                                    onChange={(e) => setProfile({ ...profile, state: e.target.value })} 
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "0.35rem" }}>Pincode</label>
                                <input 
                                    type="text" 
                                    className="input-glass" 
                                    placeholder="e.g. 201304"
                                    value={profile.pincode || ""} 
                                    onChange={(e) => setProfile({ ...profile, pincode: e.target.value })} 
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--text-secondary)", display: "block", marginBottom: "0.35rem" }}>Brand Theme Color</label>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <input 
                                        type="color" 
                                        value={profile.theme_color || "#064e3b"} 
                                        onChange={(e) => setProfile({ ...profile, theme_color: e.target.value })} 
                                        style={{ width: "36px", height: "36px", border: "none", borderRadius: "8px", cursor: "pointer", background: "transparent" }}
                                    />
                                    <span style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "var(--text-primary)" }}>{profile.theme_color || "#064e3b"}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* VIEW MODE (ELEGANT READ-ONLY CARD) */
                    <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "2rem", alignItems: "center" }}>
                        {/* School Crest / Logo */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                            <div style={{
                                width: "110px",
                                height: "110px",
                                borderRadius: "16px",
                                backgroundColor: profile.theme_color || "var(--primary-color, #064e3b)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                overflow: "hidden",
                                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                                border: "2px solid var(--glass-border)"
                            }}>
                                {profile.logo_url ? (
                                    <img 
                                        src={resolveAssetUrl(profile.logo_url)} 
                                        alt={profile.name || "School Logo"} 
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                                    />
                                ) : (
                                    <span style={{ fontSize: "2.5rem", color: "#ffffff", fontWeight: "800" }}>
                                        {(profile.name || "S").charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)", textAlign: "center" }}>Official Crest</span>
                        </div>

                        {/* School Details */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
                                    <h3 style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--text-primary)", margin: 0 }}>
                                        {profile.name || "School Name Not Configured"}
                                    </h3>
                                    <span style={{ padding: "0.2rem 0.65rem", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: "700" }}>
                                        {profile.affiliation_board || "CBSE"}
                                    </span>
                                    {profile.board_affiliation_number && (
                                        <span style={{ padding: "0.2rem 0.65rem", background: "rgba(59, 130, 246, 0.15)", color: "#3b82f6", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: "600" }}>
                                            Affil No: {profile.board_affiliation_number}
                                        </span>
                                    )}
                                    {profile.school_code && (
                                        <span style={{ padding: "0.2rem 0.65rem", background: "rgba(168, 85, 247, 0.15)", color: "#c084fc", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: "600" }}>
                                            Code: {profile.school_code}
                                        </span>
                                    )}
                                </div>
                                {profile.motto && (
                                    <p style={{ fontSize: "0.95rem", fontStyle: "italic", color: "var(--text-secondary)", margin: 0 }}>
                                        "{profile.motto}"
                                    </p>
                                )}
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.75rem", borderTop: "1px solid var(--glass-border)", paddingTop: "1rem" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--text-primary)" }}>
                                    <Mail size={16} color="var(--text-secondary)" />
                                    <span>{profile.official_email || "Email not specified"}</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--text-primary)" }}>
                                    <Phone size={16} color="var(--text-secondary)" />
                                    <span>{profile.official_phone || "Phone not specified"}</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--text-primary)" }}>
                                    <Globe size={16} color="var(--text-secondary)" />
                                    {profile.website ? (
                                        <a href={ensureHttps(profile.website)} target="_blank" rel="noreferrer" style={{ color: "#10b981", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.25rem", fontWeight: "600" }}>
                                            {profile.website.replace(/^https?:\/\//i, '')} <ExternalLink size={12} />
                                        </a>
                                    ) : (
                                        <span style={{ color: "var(--text-secondary)" }}>Website not set</span>
                                    )}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--text-primary)" }}>
                                    <MapPin size={16} color="var(--text-secondary)" />
                                    <span>{[profile.address, profile.city, profile.state, profile.pincode].filter(Boolean).join(", ") || "Address not specified"}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* PUBLIC MARKETPLACE (managed in the SPOC portal) */}
            <section className="glass-panel" style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ padding: "0.5rem", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", borderRadius: "12px" }}>
                            <Globe size={20} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--text-primary)" }}>Public Marketplace</h2>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Managed by the school SPOC in the public-domain portal</span>
                        </div>
                    </div>
                    <a
                        href={import.meta.env.VITE_SPOC_URL || `/spoc/login?tenant=${encodeURIComponent(getTenantSlug() || "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary"
                        style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", padding: "0.5rem 1rem", textDecoration: "none" }}
                    >
                        <ExternalLink size={16} /> Open SPOC Portal
                    </a>
                </div>
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.9rem", lineHeight: 1.5 }}>
                    The public profile, campus photos, newsroom and parent reviews are managed in the dedicated public-domain portal.
                    Create a <strong>SPOC user</strong> under Staff Management → SPOC Users and share that portal link with them.
                </p>
            </section>

            {/* GENERAL SETTINGS & SOCIAL HANDLES */}
            <section className="glass-panel" style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ padding: "0.5rem", background: "rgba(236, 72, 153, 0.1)", color: "#ec4899", borderRadius: "12px" }}>
                            <Link2 size={20} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--text-primary)" }}>General Settings & Social Channels</h2>
                            <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)" }}>Official school social links, website routing, and late fee policies.</p>
                        </div>
                    </div>
                    <button onClick={() => { 
                        setModal("social"); 
                        setNewSocial(infoSettings || { instagram_url: "", whatsapp_url: "", linkedin_url: "", twitter_url: "", facebook_url: "", youtube_url: "", website_url: "", late_fee_penalty: 10 }); 
                    }} className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", padding: "0.5rem 1rem" }}>
                        <Edit size={16} /> Edit Settings
                    </button>
                </div>
                <div>
                    {infoSettings ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", padding: "1rem", background: "var(--bg-secondary)", border: "1px solid var(--glass-border)", borderRadius: "12px" }}>
                            {infoSettings.facebook_url && (
                                <a href={ensureHttps(infoSettings.facebook_url)} target="_blank" rel="noreferrer" style={{ padding: "0.4rem 0.85rem", background: "rgba(59, 130, 246, 0.12)", color: "#3b82f6", borderRadius: "8px", fontSize: "0.875rem", fontWeight: "600", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                                    Facebook <ExternalLink size={13} />
                                </a>
                            )}
                            {infoSettings.instagram_url && (
                                <a href={ensureHttps(infoSettings.instagram_url)} target="_blank" rel="noreferrer" style={{ padding: "0.4rem 0.85rem", background: "rgba(236, 72, 153, 0.12)", color: "#ec4899", borderRadius: "8px", fontSize: "0.875rem", fontWeight: "600", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                                    Instagram <ExternalLink size={13} />
                                </a>
                            )}
                            {infoSettings.whatsapp_url && (
                                <a href={ensureHttps(infoSettings.whatsapp_url)} target="_blank" rel="noreferrer" style={{ padding: "0.4rem 0.85rem", background: "rgba(34, 197, 94, 0.12)", color: "#22c55e", borderRadius: "8px", fontSize: "0.875rem", fontWeight: "600", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                                    WhatsApp <ExternalLink size={13} />
                                </a>
                            )}
                            {infoSettings.linkedin_url && (
                                <a href={ensureHttps(infoSettings.linkedin_url)} target="_blank" rel="noreferrer" style={{ padding: "0.4rem 0.85rem", background: "rgba(59, 130, 246, 0.12)", color: "#3b82f6", borderRadius: "8px", fontSize: "0.875rem", fontWeight: "600", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                                    LinkedIn <ExternalLink size={13} />
                                </a>
                            )}
                            {infoSettings.twitter_url && (
                                <a href={ensureHttps(infoSettings.twitter_url)} target="_blank" rel="noreferrer" style={{ padding: "0.4rem 0.85rem", background: "rgba(14, 165, 233, 0.12)", color: "#0ea5e9", borderRadius: "8px", fontSize: "0.875rem", fontWeight: "600", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                                    Twitter <ExternalLink size={13} />
                                </a>
                            )}
                            {infoSettings.youtube_url && (
                                <a href={ensureHttps(infoSettings.youtube_url)} target="_blank" rel="noreferrer" style={{ padding: "0.4rem 0.85rem", background: "rgba(239, 68, 68, 0.12)", color: "#ef4444", borderRadius: "8px", fontSize: "0.875rem", fontWeight: "600", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                                    YouTube <ExternalLink size={13} />
                                </a>
                            )}
                            {infoSettings.website_url && (
                                <a href={ensureHttps(infoSettings.website_url)} target="_blank" rel="noreferrer" style={{ padding: "0.4rem 0.85rem", background: "rgba(99, 102, 241, 0.12)", color: "#6366f1", borderRadius: "8px", fontSize: "0.875rem", fontWeight: "600", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                                    Website <ExternalLink size={13} />
                                </a>
                            )}
                            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                                <span>Late Fee Penalty:</span>
                                <strong style={{ color: "var(--text-primary)" }}>₹{infoSettings.late_fee_penalty || 0}/day</strong>
                            </div>
                        </div>
                    ) : (
                        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", padding: "1.5rem", textAlign: "center", border: "1px dashed var(--glass-border)", borderRadius: "12px" }}>
                            No social links configured yet. Click "Edit Settings" to add links.
                        </p>
                    )}
                </div>
            </section>

            {/* SCHOOL GALLERY */}
            <section className="glass-panel" style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ padding: "0.5rem", background: "rgba(99, 102, 241, 0.1)", color: "#6366f1", borderRadius: "12px" }}>
                            <ImageIcon size={20} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--text-primary)" }}>
                                School Gallery {infoGallery?.length > 0 && `(${infoGallery.length})`}
                            </h2>
                            <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)" }}>Campus activities, events, and facility photographs.</p>
                        </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <input type="file" id="galleryUploadDirect" accept="image/*" style={{ display: "none" }} onChange={handleUploadGallery} />
                        <label htmlFor="galleryUploadDirect" className="btn btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", padding: "0.5rem 1rem", cursor: "pointer" }}>
                            <Plus size={16} /> Upload Photo
                        </label>
                        <button onClick={() => navigate('/gallery')} className="btn btn-ghost" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", padding: "0.5rem 1rem", cursor: "pointer" }}>
                            Full Gallery Page
                        </button>
                    </div>
                </div>

                {infoGallery?.length > 0 ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1.25rem" }}>
                        {infoGallery.map((item) => (
                            <div 
                                key={item.id} 
                                style={{ 
                                    position: "relative", 
                                    borderRadius: "14px", 
                                    overflow: "hidden", 
                                    border: "1px solid var(--glass-border)", 
                                    aspectRatio: "4/3", 
                                    background: "var(--bg-secondary)",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                                    transition: "transform 0.2s ease"
                                }}
                            >
                                <img 
                                    src={resolveAssetUrl(item.image_url || item.media_url)} 
                                    alt={item.title || "Gallery"} 
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                                />
                                <div style={{ 
                                    position: "absolute", 
                                    bottom: 0, 
                                    insetInline: 0, 
                                    padding: "0.6rem 0.75rem", 
                                    background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 70%, transparent 100%)", 
                                    display: "flex", 
                                    justifyContent: "space-between", 
                                    alignItems: "center" 
                                }}>
                                    <span style={{ fontSize: "0.78rem", fontWeight: "600", color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "130px" }}>
                                        {item.title || "Campus Photo"}
                                    </span>
                                    <button 
                                        type="button"
                                        onClick={() => handleDelete('gallery', item.id)} 
                                        style={{ padding: "0.35rem", color: "#ef4444", background: "rgba(0,0,0,0.5)", border: "none", cursor: "pointer", borderRadius: "6px", display: "flex", alignItems: "center" }} 
                                        title="Delete photo"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", padding: "2.5rem", textAlign: "center", border: "1px dashed var(--glass-border)", borderRadius: "12px" }}>
                        No gallery photos uploaded yet. Click "+ Upload Photo" to showcase campus life.
                    </p>
                )}
            </section>

            {/* NEWSLETTERS */}
            <section className="glass-panel" style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ padding: "0.5rem", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", borderRadius: "12px" }}>
                            <FileText size={20} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--text-primary)" }}>
                                Newsletters {infoNewsletters?.length > 0 && `(${infoNewsletters.length})`}
                            </h2>
                            <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)" }}>Official circulars, newsletters, and periodic school publications.</p>
                        </div>
                    </div>
                    <div>
                        <input type="file" id="newsUploadDirect" accept=".pdf,.doc,.docx" style={{ display: "none" }} onChange={handleUploadNews} />
                        <label htmlFor="newsUploadDirect" className="btn btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", padding: "0.5rem 1rem", cursor: "pointer" }}>
                            <Plus size={16} /> Upload Newsletter
                        </label>
                    </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
                    {infoNewsletters?.length > 0 && infoNewsletters.map((n) => {
                        const fileName = n.document_url ? decodeURIComponent(n.document_url.split('/').pop().split('?')[0]) : "Newsletter Document";
                        return (
                            <div key={n.id} style={{ display: "flex", alignItems: "center", gap: "1rem", border: "1px solid var(--glass-border)", background: "var(--bg-secondary)", borderRadius: "12px", padding: "1rem" }}>
                                <div style={{ width: "44px", height: "44px", background: "rgba(16, 185, 129, 0.12)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981", flexShrink: 0 }}>
                                    <FileText size={22} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                                    <a 
                                        href={resolveAssetUrl(n.document_url)} 
                                        download 
                                        target="_blank" 
                                        rel="noreferrer" 
                                        style={{ fontSize: "0.875rem", fontWeight: "700", color: "var(--text-primary)", textDecoration: "none", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            const fullUrl = resolveAssetUrl(n.document_url);
                                            fetch(fullUrl)
                                                .then(response => response.blob())
                                                .then(blob => {
                                                    const url = window.URL.createObjectURL(blob);
                                                    const a = document.createElement('a');
                                                    a.href = url;
                                                    a.download = fileName;
                                                    document.body.appendChild(a);
                                                    a.click();
                                                    a.remove();
                                                    window.URL.revokeObjectURL(url);
                                                })
                                                .catch(() => window.open(fullUrl, '_blank'));
                                        }}
                                    >
                                        {fileName}
                                    </a>
                                    <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "0.2rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>PDF / DOC Document</p>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => handleDelete('newsletter', n.id)} 
                                    style={{ padding: "0.5rem", color: "#ef4444", background: "rgba(239, 68, 68, 0.1)", border: "none", cursor: "pointer", borderRadius: "8px", display: "flex", alignItems: "center" }}
                                    title="Delete newsletter"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        );
                    })}
                </div>
                {(!infoNewsletters || infoNewsletters.length === 0) && (
                    <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", padding: "2rem", textAlign: "center", border: "1px dashed var(--glass-border)", borderRadius: "12px" }}>
                        No newsletters uploaded. Click "+ Upload Newsletter" to add documents.
                    </p>
                )}
            </section>

            {/* SOCIAL MODAL */}
            {modal === "social" && (
                <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)" }} onClick={() => setModal(null)}>
                    <div style={{ background: "var(--bg-secondary)", borderRadius: "16px", width: "100%", maxWidth: "520px", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", border: "1px solid var(--glass-border)", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }} onClick={e => e.stopPropagation()}>
                        
                        {/* Header */}
                        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--glass-border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-primary)" }}>
                            <h3 style={{ fontSize: "1.125rem", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
                                General Settings & Social Channels
                            </h3>
                            <button onClick={() => setModal(null)} style={{ background: "transparent", border: "none", fontSize: "1.25rem", cursor: "pointer", color: "var(--text-secondary)" }}>✕</button>
                        </div>

                        {/* Body */}
                        <div style={{ padding: "1.5rem", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <div>
                                <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--text-primary)", marginBottom: "0.4rem", display: "block" }}>
                                    Late Fee Penalty (₹ per day)
                                </label>
                                <input 
                                    type="number" 
                                    min="0" 
                                    placeholder="e.g. 10" 
                                    value={social?.late_fee_penalty || 0} 
                                    onChange={(e) => setNewSocial({ ...social, late_fee_penalty: Number(e.target.value) })} 
                                    className="input-glass"
                                    style={{ width: "100%" }}
                                />
                            </div>
                            <hr style={{ border: "none", borderTop: "1px solid var(--glass-border)", margin: "0.25rem 0" }} />
                            {[
                                { name: "Facebook", variable: "facebook_url", color: "#3b82f6" }, 
                                { name: "Instagram", variable: "instagram_url", color: "#ec4899" }, 
                                { name: "WhatsApp", variable: "whatsapp_url", color: "#22c55e" }, 
                                { name: "LinkedIn", variable: "linkedin_url", color: "#3b82f6" }, 
                                { name: "Twitter", variable: "twitter_url", color: "#0ea5e9" }, 
                                { name: "YouTube", variable: "youtube_url", color: "#ef4444" }, 
                                { name: "Website", variable: "website_url", color: "#6366f1" }
                            ].map((item) => (
                                <div key={item.variable}>
                                    <label style={{ fontSize: "0.825rem", fontWeight: "700", color: item.color, marginBottom: "0.35rem", display: "block" }}>
                                        {item.name} URL
                                    </label>
                                    <input 
                                        type="text" 
                                        placeholder={`https://${item.name.toLowerCase()}.com/...`} 
                                        value={social?.[item.variable] || ""} 
                                        onChange={(e) => setNewSocial({ ...social, [item.variable]: e.target.value })} 
                                        className="input-glass"
                                        style={{ width: "100%" }}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div style={{ padding: "1rem 1.5rem", background: "var(--bg-primary)", borderTop: "1px solid var(--glass-border)", display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                            <button onClick={() => setModal(null)} className="btn btn-ghost" style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}>Cancel</button>
                            <button onClick={handleSaveSocial} className="btn btn-primary" style={{ padding: "0.5rem 1.5rem", fontSize: "0.875rem" }}>
                                Save Settings
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SchoolInfo;
