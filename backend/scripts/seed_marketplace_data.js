/**
 * CKR Technologies — Marketplace Baseline Seeder
 * Seeds school profiles, 5-axis parent reviews, press releases, and monetization leads.
 */

import { pgPool } from '../src/config/db.js';

async function seedMarketplace() {
  console.log('\n===============================================================');
  console.log('🌱 SEEDING MARKETPLACE PORTAL & SUPER ADMIN LEADS DATA');
  console.log('===============================================================\n');

  // 1. Fetch Vision and ARC Tenants
  const visionRes = await pgPool.query("SELECT id, name, slug FROM public.tenants WHERE slug = 'vision' LIMIT 1;");
  const arcRes = await pgPool.query("SELECT id, name, slug FROM public.tenants WHERE slug = 'arc' LIMIT 1;");

  if (!visionRes.rows[0] || !arcRes.rows[0]) {
    throw new Error("Could not find Vision or ARC tenant in public.tenants table");
  }

  const visionId = visionRes.rows[0].id;
  const arcId = arcRes.rows[0].id;

  console.log(`✓ Resolved Vision International School ID: ${visionId}`);
  console.log(`✓ Resolved ARC School ID: ${arcId}`);

  // 2. Upsert Profiles in marketplace_school_profiles
  console.log('\n--- Seeding School Profiles ---');

  const visionProfile = {
    tenant_id: visionId,
    tagline: 'Nurturing Global Minds with Indian Values in Shirur, Pune',
    about: 'Vision International School is a premier CBSE-affiliated co-educational institution in Shirur, Pune. With world-class STEM robotics laboratories, Olympic-grade sports infrastructure, smart classrooms, and dedicated pastoral care, VIS empowers students from Nursery through Grade XII to excel academically, ethically, and socially.',
    established_year: 2012,
    min_fee: 35000,
    max_fee: 65000,
    fee_period: 'ANNUAL',
    grades_offered: 'Nursery to XII',
    facilities: JSON.stringify([
      'Smart Digital Classrooms',
      'Robotics & AI Innovation Lab',
      'Semi-Olympic Swimming Pool',
      'Football & Cricket Turf',
      'Fleet with Live GPS Tracking',
      '100% CCTV Monitored Campus',
      'Hygienic Organic Cafeteria',
      'Composite Science Labs',
      'Air-Conditioned Auditorium',
      'Infirmary & Doctor on Call'
    ]),
    gallery_images: JSON.stringify([
      { url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&auto=format&fit=crop&q=80', title: 'Main Academic Block', category: 'Campus' },
      { url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200&auto=format&fit=crop&q=80', title: 'Interactive Smart Classroom', category: 'Classroom' },
      { url: 'https://images.unsplash.com/photo-1562774053-701939374585?w=1200&auto=format&fit=crop&q=80', title: 'Robotics & STEM Lab', category: 'Laboratories' },
      { url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1200&auto=format&fit=crop&q=80', title: 'Central Knowledge Library', category: 'Library' },
      { url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&auto=format&fit=crop&q=80', title: 'Athletics & Sports Turf', category: 'Sports' }
    ]),
    brochure_url: 'https://vis-shirur.edu.in/prospectus-2026.pdf',
    is_featured: true,
    is_verified: true,
    admission_status: 'Admissions Open (2026-27)',
    hero_image_url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1600&auto=format&fit=crop&q=80',
    student_count_badge: '1,450+ Students',
    teacher_count_badge: '75+ Certified Faculty',
    student_teacher_ratio: '18:1'
  };

  const arcProfile = {
    tenant_id: arcId,
    tagline: 'Excellence in Progressive Education & Holistic Leadership in Noida',
    about: 'ARC School Noida is a progressive CBSE institution recognized for academic rigor, innovation labs, performing arts conservatory, and comprehensive sports training. Committed to fostering critical thinking, sustainability, and technological fluency from Pre-Primary to Senior Secondary.',
    established_year: 2016,
    min_fee: 60000,
    max_fee: 120000,
    fee_period: 'ANNUAL',
    grades_offered: 'Pre-Primary to XII',
    facilities: JSON.stringify([
      'STEM Innovation & Makerspace',
      'All-Weather Indoor Sports Complex',
      '3D Printing & Coding Lab',
      'Fleet with RFID & GPS Tracking',
      'Performing Arts Conservatory',
      'Digital Media Center & Podcast Studio',
      'RO Purified Water Stations',
      'Counseling & Career Guidance Cell',
      'Badminton & Squash Courts',
      'Touchscreen Smart Boards in Every Room'
    ]),
    gallery_images: JSON.stringify([
      { url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&auto=format&fit=crop&q=80', title: 'Modern Noida Campus', category: 'Campus' },
      { url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&auto=format&fit=crop&q=80', title: 'Collaborative Learning Pods', category: 'Classroom' },
      { url: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=1200&auto=format&fit=crop&q=80', title: 'Makerspace & 3D Prototyping', category: 'Laboratories' },
      { url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80', title: 'Outdoor Athletics Arena', category: 'Sports' }
    ]),
    brochure_url: 'https://arcschool.in/brochure-2026.pdf',
    is_featured: true,
    is_verified: true,
    admission_status: 'Admissions Open (2026-27)',
    hero_image_url: 'https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=1600&auto=format&fit=crop&q=80',
    student_count_badge: '1,100+ Students',
    teacher_count_badge: '60+ Certified Faculty',
    student_teacher_ratio: '16:1'
  };

  for (const prof of [visionProfile, arcProfile]) {
    await pgPool.query(`
      INSERT INTO public.marketplace_school_profiles (
        tenant_id, tagline, about, established_year, min_fee, max_fee, fee_period,
        grades_offered, facilities, gallery_images, brochure_url, is_featured, is_verified,
        admission_status, hero_image_url, student_count_badge, teacher_count_badge, student_teacher_ratio
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
      )
      ON CONFLICT (tenant_id) DO UPDATE SET
        tagline = EXCLUDED.tagline,
        about = EXCLUDED.about,
        established_year = EXCLUDED.established_year,
        min_fee = EXCLUDED.min_fee,
        max_fee = EXCLUDED.max_fee,
        fee_period = EXCLUDED.fee_period,
        grades_offered = EXCLUDED.grades_offered,
        facilities = EXCLUDED.facilities,
        gallery_images = EXCLUDED.gallery_images,
        brochure_url = EXCLUDED.brochure_url,
        is_featured = EXCLUDED.is_featured,
        is_verified = EXCLUDED.is_verified,
        admission_status = EXCLUDED.admission_status,
        hero_image_url = EXCLUDED.hero_image_url,
        student_count_badge = EXCLUDED.student_count_badge,
        teacher_count_badge = EXCLUDED.teacher_count_badge,
        student_teacher_ratio = EXCLUDED.student_teacher_ratio;
    `, [
      prof.tenant_id, prof.tagline, prof.about, prof.established_year, prof.min_fee, prof.max_fee, prof.fee_period,
      prof.grades_offered, prof.facilities, prof.gallery_images, prof.brochure_url, prof.is_featured, prof.is_verified,
      prof.admission_status, prof.hero_image_url, prof.student_count_badge, prof.teacher_count_badge, prof.student_teacher_ratio
    ]);
  }
  console.log('✓ Upserted School Profiles for Vision and ARC');

  // 3. Seed Verified Parent Reviews (5-Axis UGC)
  console.log('\n--- Seeding Parent Reviews (UGC) ---');
  await pgPool.query("DELETE FROM public.marketplace_reviews WHERE tenant_id IN ($1, $2);", [visionId, arcId]);

  const reviews = [
    // Vision Reviews
    {
      tenant_id: visionId,
      reviewer_name: 'Dr. Rajesh Kulkarni',
      reviewer_email: 'rajesh.kulkarni@gmail.com',
      reviewer_phone: '9822011223',
      relationship: 'Parent (Class VIII & IV)',
      overall_rating: 5,
      academics_rating: 5,
      infrastructure_rating: 5,
      faculty_rating: 5,
      safety_rating: 5,
      value_for_money_rating: 4,
      title: 'Outstanding academic rigor and caring teachers in Shirur',
      review_text: 'Both my children have been studying at Vision International for 4 years now. The CBSE curriculum is delivered with immense dedication. The robotics lab has sparked my son’s interest in engineering, and the school transport with live GPS is extremely safe for parents living in Shirur and nearby tehsils.',
      is_verified: true,
      is_approved: true,
      helpful_count: 24
    },
    {
      tenant_id: visionId,
      reviewer_name: 'Mrs. Sunita Patil',
      reviewer_email: 'sunita.patil@outlook.com',
      reviewer_phone: '9890123456',
      relationship: 'Parent (Class X)',
      overall_rating: 5,
      academics_rating: 5,
      infrastructure_rating: 4,
      faculty_rating: 5,
      safety_rating: 5,
      value_for_money_rating: 5,
      title: 'Exceptional board exam preparation and mentoring',
      review_text: 'The principal and faculty take personal interest in every child. Special doubt-clearing sessions and regular feedback on the Parent App helped my daughter score over 92% in pre-boards. Highly recommended for parents looking for disciplined education.',
      is_verified: true,
      is_approved: true,
      helpful_count: 18
    },
    {
      tenant_id: visionId,
      reviewer_name: 'Anand Deshmukh',
      reviewer_email: 'anand.deshmukh@yahoo.com',
      reviewer_phone: '9422556677',
      relationship: 'Parent (Class II)',
      overall_rating: 4,
      academics_rating: 4,
      infrastructure_rating: 5,
      faculty_rating: 4,
      safety_rating: 5,
      value_for_money_rating: 4,
      title: 'Safe campus and very active sports department',
      review_text: 'The swimming pool and athletic turf are maintained in top condition. Coaches are certified and give personal attention to young children. Transparent fee structure with no hidden fees.',
      is_verified: true,
      is_approved: true,
      helpful_count: 11
    },
    {
      tenant_id: visionId,
      reviewer_name: 'Sneha Joshi',
      reviewer_email: 'sneha.joshi@gmail.com',
      reviewer_phone: '9765432100',
      relationship: 'Alumna / Parent',
      overall_rating: 5,
      academics_rating: 5,
      infrastructure_rating: 5,
      faculty_rating: 5,
      safety_rating: 5,
      value_for_money_rating: 5,
      title: 'Holistic growth with traditional values',
      review_text: 'The emphasis on moral values, daily assemblies, and co-curricular dramatics makes children confident and humble. Vision is hands down the top CBSE school in this region.',
      is_verified: true,
      is_approved: true,
      helpful_count: 9
    },

    // ARC Reviews
    {
      tenant_id: arcId,
      reviewer_name: 'Vikram Malhotra',
      reviewer_email: 'vikram.m@techcorp.com',
      reviewer_phone: '9811099887',
      relationship: 'Parent (Class VII)',
      overall_rating: 5,
      academics_rating: 5,
      infrastructure_rating: 5,
      faculty_rating: 5,
      safety_rating: 5,
      value_for_money_rating: 4,
      title: 'Top-tier infrastructure and coding curriculum in Noida',
      review_text: 'ARC School provides the kind of forward-looking education modern parents look for. The 3D printing and coding lab has given my child practical hands-on skills. The indoor badminton court and auditorium are world-class.',
      is_verified: true,
      is_approved: true,
      helpful_count: 31
    },
    {
      tenant_id: arcId,
      reviewer_name: 'Priyanka Sharma',
      reviewer_email: 'priyanka.sharma@noida.org',
      reviewer_phone: '9910443322',
      relationship: 'Parent (Class III)',
      overall_rating: 4,
      academics_rating: 4,
      infrastructure_rating: 5,
      faculty_rating: 4,
      safety_rating: 5,
      value_for_money_rating: 4,
      title: 'Very secure campus and active communication with parents',
      review_text: 'RFID card attendance and prompt notifications on the school portal ensure total peace of mind for working parents. Teachers are approachable and patient with younger kids.',
      is_verified: true,
      is_approved: true,
      helpful_count: 14
    },
    {
      tenant_id: arcId,
      reviewer_name: 'Rohit Verma',
      reviewer_email: 'rohit.verma@consultant.in',
      reviewer_phone: '9818776655',
      relationship: 'Parent (Class XI - Science)',
      overall_rating: 5,
      academics_rating: 5,
      infrastructure_rating: 4,
      faculty_rating: 5,
      safety_rating: 5,
      value_for_money_rating: 5,
      title: 'Serious JEE/NEET integrated coaching and seasoned faculty',
      review_text: 'The senior secondary faculty is outstanding. Concept clarity and mock tests prepare students well for competitive exams alongside CBSE board syllabus. Well worth every rupee.',
      is_verified: true,
      is_approved: true,
      helpful_count: 22
    }
  ];

  for (const rev of reviews) {
    await pgPool.query(`
      INSERT INTO public.marketplace_reviews (
        tenant_id, reviewer_name, reviewer_email, reviewer_phone, relationship,
        overall_rating, academics_rating, infrastructure_rating, faculty_rating, safety_rating, value_for_money_rating,
        title, review_text, is_verified, is_approved, helpful_count
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
      );
    `, [
      rev.tenant_id, rev.reviewer_name, rev.reviewer_email, rev.reviewer_phone, rev.relationship,
      rev.overall_rating, rev.academics_rating, rev.infrastructure_rating, rev.faculty_rating, rev.safety_rating, rev.value_for_money_rating,
      rev.title, rev.review_text, rev.is_verified, rev.is_approved, rev.helpful_count
    ]);
  }

  // Recalculate average ratings
  for (const tid of [visionId, arcId]) {
    await pgPool.query(`
      UPDATE public.marketplace_school_profiles
      SET 
        avg_rating = (
          SELECT ROUND(AVG(overall_rating), 2)
          FROM public.marketplace_reviews
          WHERE tenant_id = $1 AND is_approved = TRUE
        ),
        review_count = (
          SELECT COUNT(*)::int
          FROM public.marketplace_reviews
          WHERE tenant_id = $1 AND is_approved = TRUE
        )
      WHERE tenant_id = $1;
    `, [tid]);
  }
  console.log(`✓ Seeded ${reviews.length} authentic parent reviews and updated averages.`);

  // 4. Seed Press Releases / Public Newsroom
  console.log('\n--- Seeding Public Press Releases ---');
  await pgPool.query("DELETE FROM public.marketplace_press_releases WHERE tenant_id IN ($1, $2);", [visionId, arcId]);

  const pressReleases = [
    {
      tenant_id: visionId,
      title: 'Vision International Students Triumph with 100% First-Class in CBSE Board Exams',
      summary: 'Remarkable milestone as 32 students score above 90% aggregate in Class X and XII exams.',
      content_html: '<p>Vision International School, Shirur, has once again established its academic supremacy with a stellar 100% first-class pass result in the CBSE Class X & XII Board Examinations 2025-26. Over 32 students secured 90%+ aggregates, with School Topper Ananya Kulkarni achieving 98.4%.</p><p>The School Management and Principal congratulated students, parents, and dedicated faculty members during a felicitation ceremony held on campus.</p>',
      featured_image_url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&auto=format&fit=crop&q=80',
      category: 'Academics',
      published_date: '2026-05-15',
      is_published: true
    },
    {
      tenant_id: visionId,
      title: 'Annual Sports Meet 2026 "Tarang" Inaugurated with Grand Athletics Parade',
      summary: 'Over 800 student athletes compete across 24 track and field disciplines over 3 energetic days.',
      content_html: '<p>The 14th Annual Athletic Meet "Tarang 2026" was inaugurated at the Vision International Sports Arena. The meet witnessed fierce yet sportsmanlike competition among the four houses: Agni, Vayu, Prithvi, and Jal.</p><p>Chief Guest, National Athlete Arjuna Awardee Shri Mahesh Shinde, praised the Olympic-standard synthetic track and multi-sport infrastructure developed by VIS for rural and semi-urban talent.</p>',
      featured_image_url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&auto=format&fit=crop&q=80',
      category: 'Sports',
      published_date: '2026-01-20',
      is_published: true
    },
    {
      tenant_id: arcId,
      title: 'ARC School Innovators Bag Gold at National Junior Robotics Olympiad',
      summary: 'Grade 8 students develop autonomous flood rescue drone using AI vision, beating 120 national teams.',
      content_html: '<p>A four-member junior robotics team from ARC School Noida clinched 1st Place and the prestigious Gold Medal at the National STEM & Robotics Olympiad held at IIT Delhi.</p><p>The team demonstrated an AI-powered autonomous drone equipped with thermal imaging designed for emergency flood surveillance and relief packet drops. The school management announced full research grant sponsorships for the innovators.</p>',
      featured_image_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&auto=format&fit=crop&q=80',
      category: 'Achievement',
      published_date: '2026-02-18',
      is_published: true
    },
    {
      tenant_id: arcId,
      title: 'Annual Cultural Gala "Symphony 2026" Celebrates Indian Classical Heritage',
      summary: 'A breathtaking evening of sitar ensembles, Kathak recitals, and Shakespearean theatre.',
      content_html: '<p>ARC School Noida presented its annual cultural extravaganza "Symphony 2026" at the state-of-the-art auditorium. The show featured 350+ student performers presenting Indian classical dance forms, symphonic orchestra fusion, and bilingual drama productions.</p><p>Distinguished patrons and parents applauded the high standard of aesthetic training cultivated by the school’s Performing Arts Department.</p>',
      featured_image_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80',
      category: 'Event',
      published_date: '2026-03-02',
      is_published: true
    }
  ];

  for (const pr of pressReleases) {
    await pgPool.query(`
      INSERT INTO public.marketplace_press_releases (
        tenant_id, title, summary, content_html, featured_image_url, category, published_date, is_published
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8
      );
    `, [pr.tenant_id, pr.title, pr.summary, pr.content_html, pr.featured_image_url, pr.category, pr.published_date, pr.is_published]);
  }
  console.log(`✓ Seeded ${pressReleases.length} Press Releases in the Public Newsroom.`);

  // 5. Seed Monetization Leads for Super Admin
  console.log('\n--- Seeding Centralized Marketplace Leads (Super Admin Engine) ---');
  await pgPool.query("DELETE FROM public.marketplace_leads WHERE tenant_id IN ($1, $2);", [visionId, arcId]);

  const leads = [
    {
      tenant_id: visionId,
      lead_type: 'enquiry',
      student_name: 'Aarav Kulkarni',
      parent_name: 'Suresh Kulkarni',
      phone: '9822334455',
      email: 'suresh.kulkarni@gmail.com',
      grade: 'Grade 6',
      academic_year: '2026-2027',
      message: 'Looking for CBSE admission for Grade 6 with school bus facility to Shirur bypass area.',
      compared_tenant_ids: JSON.stringify([]),
      is_multi_enquiry: false,
      status: 'new',
      monetization_fee_paise: 50000, // Rs. 500
      admin_notes: 'Urgent enquiry received via Website Marketplace. Shirur local resident.'
    },
    {
      tenant_id: visionId,
      lead_type: 'brochure_download',
      student_name: 'Rohan Shinde',
      parent_name: 'Pravin Shinde',
      phone: '9766554433',
      email: 'pravin.shinde@mahindra.com',
      grade: 'Grade 11 (Science)',
      academic_year: '2026-2027',
      message: 'Downloaded Official 2026-27 Prospectus & Fee Structure PDF.',
      compared_tenant_ids: JSON.stringify([]),
      is_multi_enquiry: false,
      status: 'qualified',
      monetization_fee_paise: 35000, // Rs. 350
      admin_notes: 'Parent verified. Interested in JEE integrated curriculum.'
    },
    {
      tenant_id: arcId,
      lead_type: 'enquiry',
      student_name: 'Ishaan Malhotra',
      parent_name: 'Karan Malhotra',
      phone: '9811223344',
      email: 'karan.malhotra@hcl.com',
      grade: 'Grade 1',
      academic_year: '2026-2027',
      message: 'Inquiring about Grade 1 admission in Noida Sector 62 branch. What is the teacher-student ratio?',
      compared_tenant_ids: JSON.stringify([]),
      is_multi_enquiry: false,
      status: 'school_contacted',
      monetization_fee_paise: 75000, // Rs. 750
      admin_notes: 'Super Admin pitched school coordinator. Lead presented in monthly dossier.'
    },
    {
      tenant_id: arcId,
      lead_type: 'brochure_download',
      student_name: 'Ananya Gupta',
      parent_name: 'Meenakshi Gupta',
      phone: '9911887766',
      email: 'meenakshi.g@deloitte.com',
      grade: 'Grade 9',
      academic_year: '2026-2027',
      message: 'Downloaded School Brochure from Marketplace Portal.',
      compared_tenant_ids: JSON.stringify([]),
      is_multi_enquiry: false,
      status: 'new',
      monetization_fee_paise: 35000,
      admin_notes: 'Parent downloaded brochure after viewing STEM lab facilities.'
    },
    {
      tenant_id: visionId,
      lead_type: 'comparison',
      student_name: 'Tanvi Gaikwad',
      parent_name: 'Santosh Gaikwad',
      phone: '9823998811',
      email: 'santosh.gaikwad@tcs.com',
      grade: 'Grade 4',
      academic_year: '2026-2027',
      message: 'Parent used Marketplace Comparison Tool (Vision vs ARC). Requested callback for fee comparison.',
      compared_tenant_ids: JSON.stringify([visionId, arcId]),
      is_multi_enquiry: false,
      status: 'qualified',
      monetization_fee_paise: 50000,
      admin_notes: 'High-intent parent evaluating CBSE options with transport.'
    },
    {
      tenant_id: visionId,
      lead_type: 'multi_enquiry',
      student_name: 'Kabir & Aditi Verma',
      parent_name: 'Nitin Verma',
      phone: '9810112233',
      email: 'nitin.verma@corp.in',
      grade: 'Grade 3 & Grade 7',
      academic_year: '2026-2027',
      message: '1-Click Multi-School Enquiry submitted simultaneously to Vision and ARC.',
      compared_tenant_ids: JSON.stringify([visionId, arcId]),
      is_multi_enquiry: true,
      status: 'transferred',
      monetization_fee_paise: 100000, // Rs. 1000 package fee
      admin_notes: 'Lead successfully handed over to school admissions head after fee clearance.'
    }
  ];

  for (const l of leads) {
    await pgPool.query(`
      INSERT INTO public.marketplace_leads (
        tenant_id, lead_type, student_name, parent_name, phone, email, grade,
        academic_year, message, compared_tenant_ids, is_multi_enquiry,
        status, monetization_fee_paise, admin_notes
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
      );
    `, [
      l.tenant_id, l.lead_type, l.student_name, l.parent_name, l.phone, l.email, l.grade,
      l.academic_year, l.message, l.compared_tenant_ids, l.is_multi_enquiry,
      l.status, l.monetization_fee_paise, l.admin_notes
    ]);
  }
  console.log(`✓ Seeded ${leads.length} Admission Leads in public.marketplace_leads.`);

  console.log('\n===============================================================');
  console.log('🎉 PHASE 1 BASELINE SEEDING COMPLETED SUCCESSFULLY!');
  console.log('===============================================================\n');

  process.exit(0);
}

seedMarketplace().catch(err => {
  console.error('❌ Seeding error:', err);
  process.exit(1);
});

