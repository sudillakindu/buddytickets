-- ============================================================
--  BUDDYTICKET — COMPLETE SEED DATA
--  Covers ALL tables in 01_tables_schema.sql
--  Min 10 events, min 10 rows per applicable table.
--  Realistic Sri Lankan event data.
--  Safe to re-run: wrapped in transactions with ON CONFLICT DO NOTHING.
-- ============================================================
--
--  TABLE ORDER (FK dependency chain):
--   1.  users
--   2.  organizer_details
--   3.  categories
--   4.  events
--   5.  event_images
--   6.  ticket_types
--   7.  vip_events
--   8.  event_community
--   9.  promotions
--  10.  orders
--  11.  ticket_reservations
--  12.  tickets
--  13.  promotion_usages
--  14.  transactions
--  15.  scan_logs
--  16.  payouts
--  17.  refund_requests
--  18.  waitlists
--  19.  reviews
--  20.  otp_records
--  21.  auth_flow_tokens
-- ============================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────
-- 1. USERS
-- ─────────────────────────────────────────────────────────────
-- Password hash for "Password@123" (bcrypt)
-- All users share same demo password for easy testing.

INSERT INTO users (user_id, name, image_url, email, is_email_verified, mobile, is_mobile_verified, username, password_hash, role, is_active) VALUES

-- System account
('00000000-0000-0000-0000-000000000001', 'BuddyTicket System',    NULL,                                           'system@buddyticket.lk',          TRUE,  '+94000000001', TRUE,  'bt_system',    NULL,                                                             'SYSTEM',       TRUE),

-- Organizers (3)
('00000000-0000-0000-0000-000000000002', 'Roshan Perera',         'https://i.pravatar.cc/150?u=rperera',          'roshan@eventspro.lk',            TRUE,  '+94711234561', TRUE,  'roshan_ep',    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ORGANIZER',    TRUE),
('00000000-0000-0000-0000-000000000003', 'Nimali Fernando',       'https://i.pravatar.cc/150?u=nfernando',        'nimali@starlive.lk',             TRUE,  '+94771234562', TRUE,  'nimali_sl',    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ORGANIZER',    TRUE),
('00000000-0000-0000-0000-000000000004', 'Kasun Jayawardena',     'https://i.pravatar.cc/150?u=kjaya',            'kasun@islandvibes.lk',           TRUE,  '+94751234563', TRUE,  'kasun_iv',     '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ORGANIZER',    TRUE),

-- Staff (3)
('00000000-0000-0000-0000-000000000005', 'Tharaka Silva',         'https://i.pravatar.cc/150?u=tsilva',           'tharaka.staff@buddyticket.lk',   TRUE,  '+94761234564', FALSE, 'tharaka_s',    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'STAFF',        TRUE),
('00000000-0000-0000-0000-000000000006', 'Sanduni Rajapaksa',     'https://i.pravatar.cc/150?u=srajapaksa',       'sanduni.staff@buddyticket.lk',   TRUE,  '+94721234565', FALSE, 'sanduni_r',    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'STAFF',        TRUE),
('00000000-0000-0000-0000-000000000007', 'Chathura Bandara',      'https://i.pravatar.cc/150?u=cbandara',         'chathura.staff@buddyticket.lk',  TRUE,  '+94701234566', FALSE, 'chathura_b',   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'STAFF',        TRUE),

-- Regular users (15)
('00000000-0000-0000-0000-000000000011', 'Dilshan Wickramasinghe','https://i.pravatar.cc/150?u=dwick',            'dilshan.w@gmail.com',            TRUE,  '+94711111011', TRUE,  'dilshan_w',    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'USER',         TRUE),
('00000000-0000-0000-0000-000000000012', 'Shalini Gunasekara',    'https://i.pravatar.cc/150?u=sgunasekara',      'shalini.g@gmail.com',            TRUE,  '+94711111012', TRUE,  'shalini_g',    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'USER',         TRUE),
('00000000-0000-0000-0000-000000000013', 'Pradeep Kumara',        'https://i.pravatar.cc/150?u=pkumara',          'pradeep.k@yahoo.com',            TRUE,  '+94711111013', FALSE, 'pradeep_k',    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'USER',         TRUE),
('00000000-0000-0000-0000-000000000014', 'Amaya Dissanayake',     'https://i.pravatar.cc/150?u=adissanayake',     'amaya.d@hotmail.com',            TRUE,  '+94711111014', TRUE,  'amaya_d',      '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'USER',         TRUE),
('00000000-0000-0000-0000-000000000015', 'Nuwan Senanayake',      'https://i.pravatar.cc/150?u=nsenanayake',      'nuwan.s@gmail.com',              TRUE,  '+94711111015', TRUE,  'nuwan_s',      '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'USER',         TRUE),
('00000000-0000-0000-0000-000000000016', 'Hiruni Madushanka',     'https://i.pravatar.cc/150?u=hmadushanka',      'hiruni.m@gmail.com',             TRUE,  '+94711111016', TRUE,  'hiruni_m',     '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'USER',         TRUE),
('00000000-0000-0000-0000-000000000017', 'Isuru Pathirana',       'https://i.pravatar.cc/150?u=ipathirana',       'isuru.p@gmail.com',              TRUE,  '+94711111017', FALSE, 'isuru_p',      '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'USER',         TRUE),
('00000000-0000-0000-0000-000000000018', 'Rashmi Cooray',         'https://i.pravatar.cc/150?u=rcooray',          'rashmi.c@gmail.com',             TRUE,  '+94711111018', TRUE,  'rashmi_c',     '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'USER',         TRUE),
('00000000-0000-0000-0000-000000000019', 'Lahiru Rathnayake',     'https://i.pravatar.cc/150?u=lrathnayake',      'lahiru.r@gmail.com',             FALSE, '+94711111019', FALSE, 'lahiru_r',     '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'USER',         TRUE),
('00000000-0000-0000-0000-000000000020', 'Manori Wijesinghe',     'https://i.pravatar.cc/150?u=mwijesinghe',      'manori.w@gmail.com',             TRUE,  '+94711111020', TRUE,  'manori_w',     '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'USER',         TRUE),
('00000000-0000-0000-0000-000000000021', 'Chamara Liyanage',      'https://i.pravatar.cc/150?u=cliyanage',        'chamara.l@gmail.com',            TRUE,  '+94711111021', TRUE,  'chamara_l',    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'USER',         TRUE),
('00000000-0000-0000-0000-000000000022', 'Uthpala Weerasinghe',   'https://i.pravatar.cc/150?u=uweerasinghe',     'uthpala.w@gmail.com',            TRUE,  '+94711111022', TRUE,  'uthpala_w',    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'USER',         TRUE),
('00000000-0000-0000-0000-000000000023', 'Thilina Abeysekara',    NULL,                                           'thilina.a@gmail.com',            FALSE, '+94711111023', FALSE, 'thilina_a',    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'USER',         TRUE),
('00000000-0000-0000-0000-000000000024', 'Sachini Dharmasena',    'https://i.pravatar.cc/150?u=sdharmasena',      'sachini.d@gmail.com',            TRUE,  '+94711111024', TRUE,  'sachini_d',    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'USER',         TRUE),
('00000000-0000-0000-0000-000000000025', 'Ruwan Madanayake',      'https://i.pravatar.cc/150?u=rmadanayake',      'ruwan.m@gmail.com',              TRUE,  '+94711111025', TRUE,  'ruwan_m',      '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'USER',         FALSE),

-- Admin / STAFF (1)
('00000000-0000-0000-0000-000000000030', 'Nethmi Karunathilake',  'https://i.pravatar.cc/150?u=nkarunathilake',   'nethmi@buddyticket.lk',          TRUE,  '+94711111030', TRUE,  'nethmi_bt',    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'STAFF',        TRUE)

ON CONFLICT (user_id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- 2. ORGANIZER DETAILS
-- ─────────────────────────────────────────────────────────────

INSERT INTO organizer_details (user_id, nic_number, address, bank_name, bank_branch, account_holder_name, account_number, nic_front_image_url, nic_back_image_url, remarks, status, is_submitted, verified_by, verified_at) VALUES

('00000000-0000-0000-0000-000000000002',
 '199012345678V', '45/A, Baseline Road, Colombo 09', 'Bank of Ceylon', 'Colombo Fort',
 'Roshan Perera', '1234567890', 'https://cdn.buddyticket.lk/nic/rperera_front.jpg', 'https://cdn.buddyticket.lk/nic/rperera_back.jpg',
 'Verified organizer — EventsPro Lanka', 'APPROVED', TRUE,
 '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '60 days'),

('00000000-0000-0000-0000-000000000003',
 '199534567890V', '12, Duplication Road, Colombo 03', 'Hatton National Bank', 'Nawam Mawatha',
 'Nimali Fernando', '9876543210', 'https://cdn.buddyticket.lk/nic/nfernando_front.jpg', 'https://cdn.buddyticket.lk/nic/nfernando_back.jpg',
 'Star Live Events — approved after document review', 'APPROVED', TRUE,
 '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '45 days'),

('00000000-0000-0000-0000-000000000004',
 '199823456789V', '78/3, Peradeniya Road, Kandy', 'Commercial Bank', 'Kandy City Centre',
 'Kasun Jayawardena', '5566778899', 'https://cdn.buddyticket.lk/nic/kjaya_front.jpg', 'https://cdn.buddyticket.lk/nic/kjaya_back.jpg',
 'Island Vibes Entertainment — pending final review', 'PENDING', TRUE,
 NULL, NULL)

ON CONFLICT (user_id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- 3. CATEGORIES
-- ─────────────────────────────────────────────────────────────

INSERT INTO categories (category_id, name, description, is_active) VALUES
('00000000-0000-0000-0001-000000000001', 'Music & Concerts',      'Live music, concerts, DJ nights and music festivals.',                     TRUE),
('00000000-0000-0000-0001-000000000002', 'Technology',            'Tech talks, hackathons, developer conferences and IT expos.',              TRUE),
('00000000-0000-0000-0001-000000000003', 'Comedy & Entertainment','Stand-up comedy, improv shows and entertainment evenings.',                TRUE),
('00000000-0000-0000-0001-000000000004', 'Literature & Arts',     'Book fairs, art exhibitions, poetry slams and literary festivals.',        TRUE),
('00000000-0000-0000-0001-000000000005', 'Food & Beverage',       'Food expos, cooking competitions, wine tastings and culinary events.',     TRUE),
('00000000-0000-0000-0001-000000000006', 'Sports & Fitness',      'Cricket, rugby, volleyball, marathons and fitness events.',               TRUE),
('00000000-0000-0000-0001-000000000007', 'Dance & Performance',   'Contemporary dance, ballet, cultural performances and dance shows.',       TRUE),
('00000000-0000-0000-0001-000000000008', 'Fashion & Lifestyle',   'Fashion weeks, beauty expos and lifestyle events.',                        TRUE),
('00000000-0000-0000-0001-000000000009', 'Film & Cinema',         'Film festivals, movie premieres, short film screenings.',                 TRUE),
('00000000-0000-0000-0001-000000000010', 'Business & Networking', 'B2B expos, startup pitches, investor meetups and networking sessions.',   TRUE),
('00000000-0000-0000-0001-000000000011', 'Cultural & Heritage',   'Perahera, cultural pageants, heritage walks and traditional festivals.',  TRUE),
('00000000-0000-0000-0001-000000000012', 'Gaming & Esports',      'LAN parties, esports tournaments and gaming conventions.',                 FALSE)

ON CONFLICT (category_id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- 4. EVENTS  (12 events — all statuses covered)
-- ─────────────────────────────────────────────────────────────
-- platform_fee: 3% with LKR 500 cap (default)

INSERT INTO events (event_id, organizer_id, category_id, name, subtitle, description, requirements, location, map_link, start_at, end_at, status, is_active, is_vip, platform_fee_type, platform_fee_value, platform_fee_cap) VALUES

-- evt01: ON_SALE, VIP ★
('00000000-0000-0000-0002-000000000001',
 '00000000-0000-0000-0000-000000000002',
 '00000000-0000-0000-0001-000000000001',
 'Colombo Music Festival 2026',
 'Sri Lanka''s biggest outdoor music experience',
 E'The Colombo Music Festival returns for its 8th edition with an electrifying lineup of top local and international artists.\n\nFeaturing 3 stages, food courts, art installations, and midnight fireworks — this is the ultimate summer festival experience.\n\nArtists: Iraj, Infinity, The Dawnbreakers, Ridma Weerawardena, and surprise international acts.',
 'All attendees must be 18+. No outside food or beverages. Valid ID required at gate.',
 'Galle Face Green, Colombo 03',
 'https://maps.google.com/?q=Galle+Face+Green+Colombo',
 NOW() + INTERVAL '45 days',
 NOW() + INTERVAL '46 days',
 'ON_SALE', TRUE, TRUE, 'PERCENTAGE', 3.00, 500.00),

-- evt02: ON_SALE
('00000000-0000-0000-0002-000000000002',
 '00000000-0000-0000-0000-000000000003',
 '00000000-0000-0000-0001-000000000002',
 'TechTalk Kandy 2026',
 'Sri Lanka''s premier regional tech conference',
 E'TechTalk Kandy brings together developers, designers, entrepreneurs and investors for a full day of keynotes, workshops, and networking.\n\nTopics: AI/ML, Cloud Architecture, Mobile Development, Startup Ecosystem, Open Source.\n\nSpeakers include tech leads from WSO2, Dialog Axiata, and regional Google Developer Experts.',
 'Laptop required for workshop sessions. Student ID for student discount.',
 'BMICH - Bandaranaike Memorial International Conference Hall, Colombo 07',
 'https://maps.google.com/?q=BMICH+Colombo',
 NOW() + INTERVAL '30 days',
 NOW() + INTERVAL '30 days' + INTERVAL '10 hours',
 'ON_SALE', TRUE, FALSE, 'PERCENTAGE', 2.50, 300.00),

-- evt03: ON_SALE
('00000000-0000-0000-0002-000000000003',
 '00000000-0000-0000-0000-000000000002',
 '00000000-0000-0000-0001-000000000003',
 'LaughOut Colombo — Volume 7',
 'Stand-up comedy night with Sri Lanka''s finest comics',
 E'LaughOut Colombo returns for Volume 7 with a spectacular lineup of Sri Lanka''s best stand-up comedians.\n\nExpect 3 hours of side-splitting sets, crowd interaction, and a surprise roast session.\n\nFeaturing: Nadeesha Hemamali, Dino Corera, and 5 rising stars of the Colombo comedy circuit.',
 'Strictly 18+ event. Mature language expected.',
 'Shangri-La Hotel Colombo, Ballroom',
 'https://maps.google.com/?q=Shangri-La+Hotel+Colombo',
 NOW() + INTERVAL '20 days',
 NOW() + INTERVAL '20 days' + INTERVAL '4 hours',
 'ON_SALE', TRUE, FALSE, 'FIXED_AMOUNT', 75.00, NULL),

-- evt04: PUBLISHED (not yet on sale)
('00000000-0000-0000-0002-000000000004',
 '00000000-0000-0000-0000-000000000003',
 '00000000-0000-0000-0001-000000000004',
 'Galle Literary Festival 2026',
 'Celebrating South Asian literature by the Fort',
 E'The Galle Literary Festival returns to the historic Galle Fort for its 18th edition.\n\nThree days of panels, author readings, book launches, poetry performances and cultural walks through the UNESCO-listed Fort.\n\nFeatured authors from Sri Lanka, India, UK, and Australia.',
 'No requirements. All ages welcome.',
 'Galle Fort, Galle',
 'https://maps.google.com/?q=Galle+Fort+Sri+Lanka',
 NOW() + INTERVAL '70 days',
 NOW() + INTERVAL '73 days',
 'PUBLISHED', TRUE, FALSE, 'PERCENTAGE', 3.00, NULL),

-- evt05: ONGOING (started already)
('00000000-0000-0000-0002-000000000005',
 '00000000-0000-0000-0000-000000000004',
 '00000000-0000-0000-0001-000000000005',
 'Sri Lanka Food & Beverage Expo 2026',
 'The nation''s largest culinary showcase',
 E'Three-day food expo featuring 200+ exhibitors including restaurants, ingredient suppliers, equipment brands, and culinary schools.\n\nHighlights: Celebrity Chef Cook-Off, International Cuisine Pavilion, Street Food Village, and Mixology Contest.',
 'Food allergies should be declared at gate for assistance.',
 'SLECC - Sri Lanka Exhibition and Convention Centre',
 'https://maps.google.com/?q=SLECC+Colombo',
 NOW() - INTERVAL '1 day',
 NOW() + INTERVAL '2 days',
 'ONGOING', TRUE, FALSE, 'PERCENTAGE', 3.00, 400.00),

-- evt06: COMPLETED ✓ (for reviews, payouts, refunds)
('00000000-0000-0000-0002-000000000006',
 '00000000-0000-0000-0000-000000000002',
 '00000000-0000-0000-0001-000000000006',
 'Youth Cricket T20 Championship 2026',
 'Under-23 inter-district cricket tournament',
 E'The BuddyTicket Youth Cricket T20 Championship 2026 brought together 16 under-23 district teams for Sri Lanka''s most watched youth cricket event.\n\nVenue: R. Premadasa Stadium. Finals day featured Colombo District vs. Kandy District.',
 'Valid NIC or school ID for under-18 attendees.',
 'R. Premadasa Stadium, Colombo 14',
 'https://maps.google.com/?q=R+Premadasa+Stadium+Colombo',
 NOW() - INTERVAL '30 days',
 NOW() - INTERVAL '29 days',
 'COMPLETED', TRUE, FALSE, 'PERCENTAGE', 2.00, 200.00),

-- evt07: COMPLETED ✓
('00000000-0000-0000-0002-000000000007',
 '00000000-0000-0000-0000-000000000003',
 '00000000-0000-0000-0001-000000000007',
 'Déjà Vu Dance Spectacular 2025',
 'Contemporary dance showcase — 15th anniversary edition',
 E'Déjà Vu Dance Company celebrated its 15th anniversary with a breathtaking showcase featuring 120 performers across contemporary, classical Kandyan, hip-hop, and ballet genres.\n\nSold out all three nights at Nelum Pokuna.',
 NULL,
 'Nelum Pokuna Mahinda Rajapaksa Theatre, Colombo 07',
 'https://maps.google.com/?q=Nelum+Pokuna+Theatre+Colombo',
 NOW() - INTERVAL '60 days',
 NOW() - INTERVAL '57 days',
 'COMPLETED', TRUE, FALSE, 'PERCENTAGE', 3.00, 500.00),

-- evt08: SOLD_OUT
('00000000-0000-0000-0002-000000000008',
 '00000000-0000-0000-0000-000000000002',
 '00000000-0000-0000-0001-000000000008',
 'Colombo Fashion Week 2026 — Summer Edition',
 'The most glamorous fashion event in South Asia',
 E'Colombo Fashion Week Summer Edition 2026 returns with 40+ designers, international models, and three nights of runway shows.\n\nAll tickets sold out within 72 hours of sale launch. Waitlist open for future releases.',
 'Smart casual dress code enforced at door.',
 'Cinnamon Grand Colombo, Grand Ballroom',
 'https://maps.google.com/?q=Cinnamon+Grand+Colombo',
 NOW() + INTERVAL '15 days',
 NOW() + INTERVAL '17 days',
 'SOLD_OUT', TRUE, FALSE, 'PERCENTAGE', 3.00, 500.00),

-- evt09: CANCELLED
('00000000-0000-0000-0002-000000000009',
 '00000000-0000-0000-0000-000000000004',
 '00000000-0000-0000-0001-000000000001',
 'Island Trance Open Air 2026',
 'Outdoor trance music festival at Hikkaduwa beach',
 E'Due to adverse weather forecast and venue flooding risk, Island Trance Open Air 2026 has been cancelled. All ticket holders will receive full refunds within 7 business days.',
 NULL,
 'Hikkaduwa Beach, Southern Province',
 'https://maps.google.com/?q=Hikkaduwa+Beach+Sri+Lanka',
 NOW() + INTERVAL '5 days',
 NOW() + INTERVAL '6 days',
 'CANCELLED', TRUE, FALSE, 'PERCENTAGE', 3.00, NULL),

-- evt10: ON_SALE, VIP ★
('00000000-0000-0000-0002-000000000010',
 '00000000-0000-0000-0000-000000000003',
 '00000000-0000-0000-0001-000000000011',
 'Kandy Esala Pageant Experience 2026',
 'Experience the world-famous Esala Perahera up close',
 E'Join us for an exclusive guided Esala Perahera experience package — curated seating, traditional dinner, cultural briefing, and post-perahera heritage walk.\n\nThe Kandy Esala Perahera is one of Asia''s oldest and grandest Buddhist festivals. Held annually at the Sacred Temple of the Tooth Relic.',
 'Respect cultural dress code. Shoulders and knees must be covered.',
 'Temple of the Tooth Relic, Kandy',
 'https://maps.google.com/?q=Temple+of+the+Tooth+Relic+Kandy',
 NOW() + INTERVAL '55 days',
 NOW() + INTERVAL '55 days' + INTERVAL '6 hours',
 'ON_SALE', TRUE, TRUE, 'PERCENTAGE', 2.00, 300.00),

-- evt11: ON_SALE
('00000000-0000-0000-0002-000000000011',
 '00000000-0000-0000-0000-000000000004',
 '00000000-0000-0000-0001-000000000006',
 'Beach Volleyball Open 2026 — Negombo',
 'Open beach volleyball tournament — amateur & pro divisions',
 E'The BuddyTicket Beach Volleyball Open returns to Negombo Beach for its 4th edition.\n\nTwo divisions: Amateur (open registration) and Pro (invitation only). 48 teams, 3-day tournament, live DJ, food trucks, and beach sunset ceremony.',
 'Players must register in pairs. Spectator entry free for under-12.',
 'Negombo Beach, Western Province',
 'https://maps.google.com/?q=Negombo+Beach+Sri+Lanka',
 NOW() + INTERVAL '25 days',
 NOW() + INTERVAL '27 days',
 'ON_SALE', TRUE, FALSE, 'FIXED_AMOUNT', 50.00, NULL),

-- evt12: DRAFT (not published yet)
('00000000-0000-0000-0002-000000000012',
 '00000000-0000-0000-0000-000000000002',
 '00000000-0000-0000-0001-000000000009',
 'Colombo International Short Film Festival 2026',
 'Celebrating independent cinema from across South Asia',
 E'The Colombo International Short Film Festival (CISFF) 2026 will screen over 80 short films from 15 countries across 4 days.\n\nCompetition categories: Drama, Documentary, Animation, Experimental.\n\nAwards ceremony and Q&A sessions with directors included.',
 NULL,
 'Majestic City Cinema Complex, Bambalapitiya',
 'https://maps.google.com/?q=Majestic+City+Colombo',
 NOW() + INTERVAL '90 days',
 NOW() + INTERVAL '94 days',
 'DRAFT', FALSE, FALSE, 'PERCENTAGE', 3.00, NULL)

ON CONFLICT (event_id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- 5. EVENT IMAGES  (2+ per event = 26 rows)
-- ─────────────────────────────────────────────────────────────

INSERT INTO event_images (event_id, priority_order, image_url) VALUES
-- evt01 — Colombo Music Festival
('00000000-0000-0000-0002-000000000001', 1, 'https://cdn.buddyticket.lk/events/cmf2026/cover.jpg'),
('00000000-0000-0000-0002-000000000001', 2, 'https://cdn.buddyticket.lk/events/cmf2026/stage1.jpg'),
('00000000-0000-0000-0002-000000000001', 3, 'https://cdn.buddyticket.lk/events/cmf2026/crowd.jpg'),
-- evt02 — TechTalk Kandy
('00000000-0000-0000-0002-000000000002', 1, 'https://cdn.buddyticket.lk/events/ttk2026/cover.jpg'),
('00000000-0000-0000-0002-000000000002', 2, 'https://cdn.buddyticket.lk/events/ttk2026/keynote.jpg'),
-- evt03 — LaughOut Colombo
('00000000-0000-0000-0002-000000000003', 1, 'https://cdn.buddyticket.lk/events/loc7/cover.jpg'),
('00000000-0000-0000-0002-000000000003', 2, 'https://cdn.buddyticket.lk/events/loc7/stage.jpg'),
-- evt04 — Galle Literary Festival
('00000000-0000-0000-0002-000000000004', 1, 'https://cdn.buddyticket.lk/events/glf2026/cover.jpg'),
('00000000-0000-0000-0002-000000000004', 2, 'https://cdn.buddyticket.lk/events/glf2026/fort.jpg'),
-- evt05 — Food Expo
('00000000-0000-0000-0002-000000000005', 1, 'https://cdn.buddyticket.lk/events/slfe2026/cover.jpg'),
('00000000-0000-0000-0002-000000000005', 2, 'https://cdn.buddyticket.lk/events/slfe2026/exhibitors.jpg'),
-- evt06 — Cricket (COMPLETED)
('00000000-0000-0000-0002-000000000006', 1, 'https://cdn.buddyticket.lk/events/ycct2026/cover.jpg'),
('00000000-0000-0000-0002-000000000006', 2, 'https://cdn.buddyticket.lk/events/ycct2026/finals.jpg'),
-- evt07 — Dance Show (COMPLETED)
('00000000-0000-0000-0002-000000000007', 1, 'https://cdn.buddyticket.lk/events/dejavu2025/cover.jpg'),
('00000000-0000-0000-0002-000000000007', 2, 'https://cdn.buddyticket.lk/events/dejavu2025/performance.jpg'),
-- evt08 — Fashion Week (SOLD_OUT)
('00000000-0000-0000-0002-000000000008', 1, 'https://cdn.buddyticket.lk/events/cfw2026/cover.jpg'),
('00000000-0000-0000-0002-000000000008', 2, 'https://cdn.buddyticket.lk/events/cfw2026/runway.jpg'),
-- evt09 — Island Trance (CANCELLED)
('00000000-0000-0000-0002-000000000009', 1, 'https://cdn.buddyticket.lk/events/ita2026/cover.jpg'),
-- evt10 — Kandy Esala (VIP)
('00000000-0000-0000-0002-000000000010', 1, 'https://cdn.buddyticket.lk/events/kep2026/cover.jpg'),
('00000000-0000-0000-0002-000000000010', 2, 'https://cdn.buddyticket.lk/events/kep2026/perahera.jpg'),
('00000000-0000-0000-0002-000000000010', 3, 'https://cdn.buddyticket.lk/events/kep2026/temple.jpg'),
-- evt11 — Beach Volleyball
('00000000-0000-0000-0002-000000000011', 1, 'https://cdn.buddyticket.lk/events/bvo2026/cover.jpg'),
('00000000-0000-0000-0002-000000000011', 2, 'https://cdn.buddyticket.lk/events/bvo2026/beach.jpg'),
-- evt12 — Film Festival (DRAFT)
('00000000-0000-0000-0002-000000000012', 1, 'https://cdn.buddyticket.lk/events/cisff2026/cover.jpg'),
('00000000-0000-0000-0002-000000000012', 2, 'https://cdn.buddyticket.lk/events/cisff2026/screening.jpg')

ON CONFLICT (event_id, priority_order) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- 6. TICKET TYPES  (2–3 per event = 28 rows)
-- ─────────────────────────────────────────────────────────────

INSERT INTO ticket_types (ticket_type_id, event_id, name, description, inclusions, price, capacity, qty_sold, sale_start_at, sale_end_at, is_active, version) VALUES

-- evt01 — Colombo Music Festival (ON_SALE, VIP)
('00000000-0000-0000-0003-000000000101', '00000000-0000-0000-0002-000000000001',
 'VIP Experience', 'Front-of-stage access with premium lounge',
 '["VIP wristband","Exclusive lounge access","Welcome cocktail","Meet & Greet pass","Complimentary food voucher (LKR 2000)","Priority entry"]'::JSONB,
 4500.00, 200, 87, NOW() - INTERVAL '7 days', NOW() + INTERVAL '44 days', TRUE, 1),

('00000000-0000-0000-0003-000000000102', '00000000-0000-0000-0002-000000000001',
 'General Admission', 'Festival grounds full access',
 '["Festival wristband","Access to all 3 stages","Food court access"]'::JSONB,
 1800.00, 3000, 1542, NOW() - INTERVAL '7 days', NOW() + INTERVAL '44 days', TRUE, 1),

('00000000-0000-0000-0003-000000000103', '00000000-0000-0000-0002-000000000001',
 'Early Bird', 'Discounted early bird pass (limited)',
 '["Festival wristband","General area access"]'::JSONB,
 1200.00, 500, 500, NOW() - INTERVAL '14 days', NOW() - INTERVAL '1 day', FALSE, 3),

-- evt02 — TechTalk Kandy (ON_SALE)
('00000000-0000-0000-0003-000000000201', '00000000-0000-0000-0002-000000000002',
 'Conference Pass', 'Full day conference including all sessions',
 '["Conference badge","Keynote sessions","Workshop access","Lunch & refreshments","Speaker networking cocktail","Certificate of participation"]'::JSONB,
 1500.00, 500, 203, NOW() - INTERVAL '5 days', NOW() + INTERVAL '29 days', TRUE, 1),

('00000000-0000-0000-0003-000000000202', '00000000-0000-0000-0002-000000000002',
 'Student Pass', 'Student-discounted conference access',
 '["Conference badge","All sessions","Lunch"]'::JSONB,
 600.00, 200, 115, NOW() - INTERVAL '5 days', NOW() + INTERVAL '29 days', TRUE, 1),

-- evt03 — LaughOut Colombo (ON_SALE)
('00000000-0000-0000-0003-000000000301', '00000000-0000-0000-0002-000000000003',
 'Front Row VIP', 'Best seats in the house + backstage pass',
 '["Front row seating","Backstage meet & greet","Signed poster","Complimentary drinks (2)"]'::JSONB,
 3500.00, 50, 32, NOW() - INTERVAL '3 days', NOW() + INTERVAL '19 days', TRUE, 1),

('00000000-0000-0000-0003-000000000302', '00000000-0000-0000-0002-000000000003',
 'General Seating', 'Standard show entry',
 '["Allocated seating","Full show access"]'::JSONB,
 1200.00, 400, 218, NOW() - INTERVAL '3 days', NOW() + INTERVAL '19 days', TRUE, 1),

-- evt04 — Galle Literary Festival (PUBLISHED)
('00000000-0000-0000-0003-000000000401', '00000000-0000-0000-0002-000000000004',
 'Day Pass', 'Single day access to all festival sessions',
 '["Day wristband","All panel access","Book fair entry"]'::JSONB,
 750.00, 1000, 0, NOW() + INTERVAL '30 days', NOW() + INTERVAL '72 days', TRUE, 1),

('00000000-0000-0000-0003-000000000402', '00000000-0000-0000-0002-000000000004',
 'Full Festival Pass', '3-day full access with author dinner',
 '["3-day wristband","All sessions","Author dinner (Day 2)","Exclusive tote bag","Signed book gift"]'::JSONB,
 2500.00, 300, 0, NOW() + INTERVAL '30 days', NOW() + INTERVAL '69 days', TRUE, 1),

-- evt05 — Food Expo (ONGOING)
('00000000-0000-0000-0003-000000000501', '00000000-0000-0000-0002-000000000005',
 'General Entry', 'Full expo floor access',
 '["Entry wristband","Exhibitor floor access","Demo stage access"]'::JSONB,
 350.00, 5000, 3100, NOW() - INTERVAL '2 days', NOW() + INTERVAL '2 days', TRUE, 2),

('00000000-0000-0000-0003-000000000502', '00000000-0000-0000-0002-000000000005',
 'VIP Tasting Package', 'Premium tasting tour + chef masterclass',
 '["VIP entry","Guided tasting (10 stations)","Chef masterclass seat","Welcome prosecco","Gift hamper"]'::JSONB,
 2000.00, 150, 148, NOW() - INTERVAL '2 days', NOW() + INTERVAL '2 days', TRUE, 3),

-- evt06 — Cricket T20 (COMPLETED)
('00000000-0000-0000-0003-000000000601', '00000000-0000-0000-0002-000000000006',
 'Tribune Stand', 'Covered tribune seating',
 '["Reserved seating","Match programme","Complimentary water"]'::JSONB,
 900.00, 2000, 1780, NULL, NULL, TRUE, 2),

('00000000-0000-0000-0003-000000000602', '00000000-0000-0000-0002-000000000006',
 'Pavilion Premium', 'Premium pavilion with AC lounge',
 '["Premium pavilion seat","AC lounge access","Lunch buffet","Post-match meet & greet with players"]'::JSONB,
 2500.00, 200, 200, NULL, NULL, TRUE, 4),

-- evt07 — Dance Show (COMPLETED)
('00000000-0000-0000-0003-000000000701', '00000000-0000-0000-0002-000000000007',
 'Regular Seating', 'Standard allocated seating',
 '["Allocated seat","Event programme"]'::JSONB,
 1500.00, 600, 598, NULL, NULL, TRUE, 2),

('00000000-0000-0000-0003-000000000702', '00000000-0000-0000-0002-000000000007',
 'VIP Gold', 'Front rows with champagne reception',
 '["Front row seat","Pre-show champagne","Backstage tour","Company of performers"]'::JSONB,
 4000.00, 80, 79, NULL, NULL, TRUE, 3),

-- evt08 — Fashion Week (SOLD_OUT)
('00000000-0000-0000-0003-000000000801', '00000000-0000-0000-0002-000000000008',
 'General Runway', 'Runway show access — 3 nights',
 '["3-night runway access","Standing zone"]'::JSONB,
 2200.00, 500, 500, NOW() - INTERVAL '10 days', NOW() + INTERVAL '14 days', TRUE, 5),

('00000000-0000-0000-0003-000000000802', '00000000-0000-0000-0002-000000000008',
 'VIP Runway', 'Seated VIP section with designer dinner',
 '["VIP seated section","Designer dinner (Night 2)","Goodie bag (LKR 8000 value)","Exclusive press photo-op"]'::JSONB,
 6500.00, 100, 100, NOW() - INTERVAL '10 days', NOW() + INTERVAL '14 days', TRUE, 5),

-- evt09 — Island Trance (CANCELLED)
('00000000-0000-0000-0003-000000000901', '00000000-0000-0000-0002-000000000009',
 'Festival Pass', 'Full 2-day festival',
 '["2-day wristband","All stages access","Camping area"]'::JSONB,
 2800.00, 1000, 234, NULL, NULL, FALSE, 2),

-- evt10 — Kandy Esala (ON_SALE, VIP)
('00000000-0000-0000-0003-000001000001', '00000000-0000-0000-0002-000000000010',
 'Heritage Gold', 'Best viewing position + cultural dinner',
 '["Premium reserved viewing seat","Traditional Sri Lankan dinner","Cultural heritage guide","Temple visit arrangement","Souvenir package"]'::JSONB,
 5500.00, 80, 41, NOW() - INTERVAL '2 days', NOW() + INTERVAL '54 days', TRUE, 1),

('00000000-0000-0000-0003-000001000002', '00000000-0000-0000-0002-000000000010',
 'Standard Viewing', 'Allocated seating with guide',
 '["Allocated viewing seat","Cultural briefing booklet","Refreshments"]'::JSONB,
 2200.00, 300, 87, NOW() - INTERVAL '2 days', NOW() + INTERVAL '54 days', TRUE, 1),

-- evt11 — Beach Volleyball (ON_SALE)
('00000000-0000-0000-0003-000001100001', '00000000-0000-0000-0002-000000000011',
 'Player Registration', 'Register as a competing pair (both players)',
 '["2x Player wristbands","Official ball (shared)","Referee service","Participation medal"]'::JSONB,
 1500.00, 96, 48, NOW() - INTERVAL '4 days', NOW() + INTERVAL '20 days', TRUE, 1),

('00000000-0000-0000-0003-000001100002', '00000000-0000-0000-0002-000000000011',
 'Spectator Pass', 'Watch all matches across 3 days',
 '["3-day spectator access","Beach chair","1x Food voucher"]'::JSONB,
 500.00, 2000, 342, NOW() - INTERVAL '4 days', NOW() + INTERVAL '20 days', TRUE, 1),

-- evt12 — Film Festival (DRAFT)
('00000000-0000-0000-0003-000001200001', '00000000-0000-0000-0002-000000000012',
 'Festival Pass', '4-day all-access film festival pass',
 '["All screenings access","Q&A sessions","Awards night entry","Festival booklet"]'::JSONB,
 1200.00, 500, 0, NULL, NULL, TRUE, 1),

('00000000-0000-0000-0003-000001200002', '00000000-0000-0000-0002-000000000012',
 'Industry Pass', 'Filmmaker & industry professional pass',
 '["All screenings","Jury sessions","Industry networking dinner","Certificate"]'::JSONB,
 3500.00, 50, 0, NULL, NULL, TRUE, 1)

ON CONFLICT (ticket_type_id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- 7. VIP EVENTS
-- ─────────────────────────────────────────────────────────────
-- NOTE: Normally handle_vip_status_change() trigger handles this.
-- Since we're setting is_vip=TRUE directly in events INSERT above,
-- we also manually insert vip_events rows here.

INSERT INTO vip_events (event_id, priority_order, assigned_by) VALUES
('00000000-0000-0000-0002-000000000001', 1, '00000000-0000-0000-0000-000000000001'),  -- Colombo Music Festival
('00000000-0000-0000-0002-000000000010', 2, '00000000-0000-0000-0000-000000000001')   -- Kandy Esala Pageant

ON CONFLICT (event_id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- 8. EVENT COMMUNITY  (staff assignments per event)
-- ─────────────────────────────────────────────────────────────

INSERT INTO event_community (event_id, user_id) VALUES
-- evt01 — Music Festival
('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0000-000000000005'),
('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0000-000000000006'),
('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0000-000000000007'),
-- evt02 — TechTalk
('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0000-000000000030'),
('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0000-000000000006'),
-- evt03 — LaughOut
('00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0000-000000000005'),
-- evt05 — Food Expo
('00000000-0000-0000-0002-000000000005', '00000000-0000-0000-0000-000000000006'),
('00000000-0000-0000-0002-000000000005', '00000000-0000-0000-0000-000000000007'),
-- evt06 — Cricket (completed)
('00000000-0000-0000-0002-000000000006', '00000000-0000-0000-0000-000000000005'),
('00000000-0000-0000-0002-000000000006', '00000000-0000-0000-0000-000000000007'),
-- evt10 — Kandy Esala
('00000000-0000-0000-0002-000000000010', '00000000-0000-0000-0000-000000000030'),
('00000000-0000-0000-0002-000000000010', '00000000-0000-0000-0000-000000000006'),
-- evt11 — Volleyball
('00000000-0000-0000-0002-000000000011', '00000000-0000-0000-0000-000000000005'),
('00000000-0000-0000-0002-000000000011', '00000000-0000-0000-0000-000000000007')

ON CONFLICT (event_id, user_id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- 9. PROMOTIONS  (10 promo codes)
-- ─────────────────────────────────────────────────────────────

INSERT INTO promotions (promotion_id, code, description, discount_type, discount_value, max_discount_cap, min_order_amount, start_at, end_at, is_active, usage_limit_global, usage_limit_per_user, current_global_usage, scope_event_id, scope_ticket_type_id, created_by, version) VALUES

('00000000-0000-0000-0004-000000000001', 'WELCOME2026',
 '10% off any first order — new users',
 'PERCENTAGE', 10.00, 500.00, 500.00,
 NOW() - INTERVAL '30 days', NOW() + INTERVAL '90 days',
 TRUE, 500, 1, 127, NULL, NULL,
 '00000000-0000-0000-0000-000000000001', 1),

('00000000-0000-0000-0004-000000000002', 'CMF2026VIP',
 'LKR 800 off Colombo Music Festival VIP tickets',
 'FIXED_AMOUNT', 800.00, NULL, 4500.00,
 NOW() - INTERVAL '7 days', NOW() + INTERVAL '44 days',
 TRUE, 50, 1, 23, '00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0003-000000000101',
 '00000000-0000-0000-0000-000000000002', 1),

('00000000-0000-0000-0004-000000000003', 'TECHTALK20',
 '20% off TechTalk Kandy — conference pass',
 'PERCENTAGE', 20.00, 300.00, 600.00,
 NOW() - INTERVAL '5 days', NOW() + INTERVAL '28 days',
 TRUE, 100, 1, 34, '00000000-0000-0000-0002-000000000002', NULL,
 '00000000-0000-0000-0000-000000000003', 1),

('00000000-0000-0000-0004-000000000004', 'LAUGH50',
 'LKR 500 flat off LaughOut Colombo — any ticket',
 'FIXED_AMOUNT', 500.00, NULL, 1200.00,
 NOW() - INTERVAL '3 days', NOW() + INTERVAL '19 days',
 TRUE, 30, 1, 12, '00000000-0000-0000-0002-000000000003', NULL,
 '00000000-0000-0000-0000-000000000002', 1),

('00000000-0000-0000-0004-000000000005', 'ESALA15',
 '15% off Kandy Esala Heritage Gold tickets',
 'PERCENTAGE', 15.00, 825.00, 2200.00,
 NOW() - INTERVAL '2 days', NOW() + INTERVAL '54 days',
 TRUE, 20, 1, 7, '00000000-0000-0000-0002-000000000010', NULL,
 '00000000-0000-0000-0000-000000000003', 1),

('00000000-0000-0000-0004-000000000006', 'BTANNUAL5',
 '5% off any event — annual platform promo',
 'PERCENTAGE', 5.00, 200.00, 1000.00,
 NOW() - INTERVAL '60 days', NOW() + INTERVAL '300 days',
 TRUE, 0, 2, 289, NULL, NULL,
 '00000000-0000-0000-0000-000000000001', 1),

('00000000-0000-0000-0004-000000000007', 'FOODIE300',
 'LKR 300 off food expo VIP Tasting Package',
 'FIXED_AMOUNT', 300.00, NULL, 2000.00,
 NOW() - INTERVAL '2 days', NOW() + INTERVAL '1 day',
 TRUE, 40, 1, 38, '00000000-0000-0000-0002-000000000005', NULL,
 '00000000-0000-0000-0000-000000000004', 1),

('00000000-0000-0000-0004-000000000008', 'STUDENT25',
 '25% student discount — valid student ID required',
 'PERCENTAGE', 25.00, 400.00, 500.00,
 NOW() - INTERVAL '90 days', NOW() + INTERVAL '180 days',
 TRUE, 200, 3, 89, NULL, NULL,
 '00000000-0000-0000-0000-000000000001', 1),

('00000000-0000-0000-0004-000000000009', 'EXPIRED100',
 'Old LKR 100 off promo — expired',
 'FIXED_AMOUNT', 100.00, NULL, 300.00,
 NOW() - INTERVAL '180 days', NOW() - INTERVAL '1 day',
 FALSE, 500, 1, 500, NULL, NULL,
 '00000000-0000-0000-0000-000000000001', 1),

('00000000-0000-0000-0004-000000000010', 'VOLLEYBALL200',
 'LKR 200 off Beach Volleyball spectator pass',
 'FIXED_AMOUNT', 200.00, NULL, 500.00,
 NOW() - INTERVAL '4 days', NOW() + INTERVAL '24 days',
 TRUE, 100, 1, 42, '00000000-0000-0000-0002-000000000011', NULL,
 '00000000-0000-0000-0000-000000000004', 1)

ON CONFLICT (promotion_id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- 10. ORDERS  (15 orders)
-- ─────────────────────────────────────────────────────────────

INSERT INTO orders (order_id, user_id, event_id, promotion_id, remarks, subtotal, discount_amount, final_amount, payment_source, payment_status, created_at) VALUES

-- Completed event orders (for tickets + reviews + payouts)
('00000000-0000-0000-0005-000000000001', '00000000-0000-0000-0000-000000000011',
 '00000000-0000-0000-0002-000000000006', NULL, NULL,
 900.00, 0.00, 900.00, 'PAYMENT_GATEWAY', 'PAID',
 NOW() - INTERVAL '35 days'),

('00000000-0000-0000-0005-000000000002', '00000000-0000-0000-0000-000000000012',
 '00000000-0000-0000-0002-000000000006', '00000000-0000-0000-0004-000000000006', NULL,
 2500.00, 125.00, 2375.00, 'PAYMENT_GATEWAY', 'PAID',
 NOW() - INTERVAL '34 days'),

('00000000-0000-0000-0005-000000000003', '00000000-0000-0000-0000-000000000013',
 '00000000-0000-0000-0002-000000000007', NULL, NULL,
 1500.00, 0.00, 1500.00, 'ONGATE', 'PAID',
 NOW() - INTERVAL '62 days'),

('00000000-0000-0000-0005-000000000004', '00000000-0000-0000-0000-000000000014',
 '00000000-0000-0000-0002-000000000007', '00000000-0000-0000-0004-000000000006', NULL,
 4000.00, 200.00, 3800.00, 'PAYMENT_GATEWAY', 'PAID',
 NOW() - INTERVAL '61 days'),

('00000000-0000-0000-0005-000000000005', '00000000-0000-0000-0000-000000000015',
 '00000000-0000-0000-0002-000000000006', NULL, NULL,
 1800.00, 0.00, 1800.00, 'PAYMENT_GATEWAY', 'PAID',
 NOW() - INTERVAL '33 days'),

-- Active / on-sale event orders
('00000000-0000-0000-0005-000000000006', '00000000-0000-0000-0000-000000000011',
 '00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0004-000000000002', NULL,
 4500.00, 800.00, 3700.00, 'PAYMENT_GATEWAY', 'PAID',
 NOW() - INTERVAL '3 days'),

('00000000-0000-0000-0005-000000000007', '00000000-0000-0000-0000-000000000016',
 '00000000-0000-0000-0002-000000000001', NULL, NULL,
 3600.00, 0.00, 3600.00, 'PAYMENT_GATEWAY', 'PAID',
 NOW() - INTERVAL '2 days'),

('00000000-0000-0000-0005-000000000008', '00000000-0000-0000-0000-000000000017',
 '00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0004-000000000003', NULL,
 1500.00, 300.00, 1200.00, 'PAYMENT_GATEWAY', 'PAID',
 NOW() - INTERVAL '1 day'),

('00000000-0000-0000-0005-000000000009', '00000000-0000-0000-0000-000000000018',
 '00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0004-000000000004', NULL,
 1200.00, 500.00, 700.00, 'PAYMENT_GATEWAY', 'PAID',
 NOW() - INTERVAL '1 day'),

('00000000-0000-0000-0005-000000000010', '00000000-0000-0000-0000-000000000019',
 '00000000-0000-0000-0002-000000000005', NULL, NULL,
 350.00, 0.00, 350.00, 'ONGATE', 'PAID',
 NOW() - INTERVAL '12 hours'),

-- Cancelled event — refund pending
('00000000-0000-0000-0005-000000000011', '00000000-0000-0000-0000-000000000020',
 '00000000-0000-0000-0002-000000000009', NULL, NULL,
 2800.00, 0.00, 2800.00, 'PAYMENT_GATEWAY', 'PAID',
 NOW() - INTERVAL '20 days'),

('00000000-0000-0000-0005-000000000012', '00000000-0000-0000-0000-000000000021',
 '00000000-0000-0000-0002-000000000009', NULL, NULL,
 2800.00, 0.00, 2800.00, 'PAYMENT_GATEWAY', 'REFUNDED',
 NOW() - INTERVAL '19 days'),

-- Failed order
('00000000-0000-0000-0005-000000000013', '00000000-0000-0000-0000-000000000022',
 '00000000-0000-0000-0002-000000000001', NULL, NULL,
 1800.00, 0.00, 1800.00, 'PAYMENT_GATEWAY', 'FAILED',
 NOW() - INTERVAL '1 day'),

-- Pending orders (checkout in progress)
('00000000-0000-0000-0005-000000000014', '00000000-0000-0000-0000-000000000023',
 '00000000-0000-0000-0002-000000000010', NULL, NULL,
 2200.00, 0.00, 2200.00, 'PAYMENT_GATEWAY', 'PENDING',
 NOW() - INTERVAL '5 minutes'),

('00000000-0000-0000-0005-000000000015', '00000000-0000-0000-0000-000000000024',
 '00000000-0000-0000-0002-000000000011', '00000000-0000-0000-0004-000000000010', NULL,
 500.00, 200.00, 300.00, 'PAYMENT_GATEWAY', 'PAID',
 NOW() - INTERVAL '3 hours')

ON CONFLICT (order_id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- 11. TICKET RESERVATIONS  (20 rows)
-- ─────────────────────────────────────────────────────────────

INSERT INTO ticket_reservations (reservation_id, user_id, event_id, ticket_type_id, quantity, expires_at, status, order_id) VALUES

-- Confirmed (linked to PAID orders)
('00000000-0000-0000-0006-000000000001', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0002-000000000006', '00000000-0000-0000-0003-000000000601', 1, NOW() - INTERVAL '34 days' + INTERVAL '10 min', 'CONFIRMED', '00000000-0000-0000-0005-000000000001'),
('00000000-0000-0000-0006-000000000002', '00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0002-000000000006', '00000000-0000-0000-0003-000000000602', 1, NOW() - INTERVAL '33 days' + INTERVAL '10 min', 'CONFIRMED', '00000000-0000-0000-0005-000000000002'),
('00000000-0000-0000-0006-000000000003', '00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0002-000000000007', '00000000-0000-0000-0003-000000000701', 1, NOW() - INTERVAL '61 days' + INTERVAL '10 min', 'CONFIRMED', '00000000-0000-0000-0005-000000000003'),
('00000000-0000-0000-0006-000000000004', '00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0002-000000000007', '00000000-0000-0000-0003-000000000702', 1, NOW() - INTERVAL '60 days' + INTERVAL '10 min', 'CONFIRMED', '00000000-0000-0000-0005-000000000004'),
('00000000-0000-0000-0006-000000000005', '00000000-0000-0000-0000-000000000015', '00000000-0000-0000-0002-000000000006', '00000000-0000-0000-0003-000000000601', 2, NOW() - INTERVAL '32 days' + INTERVAL '10 min', 'CONFIRMED', '00000000-0000-0000-0005-000000000005'),
('00000000-0000-0000-0006-000000000006', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0003-000000000101', 1, NOW() - INTERVAL '2 days' + INTERVAL '10 min', 'CONFIRMED', '00000000-0000-0000-0005-000000000006'),
('00000000-0000-0000-0006-000000000007', '00000000-0000-0000-0000-000000000016', '00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0003-000000000102', 2, NOW() - INTERVAL '1 day' + INTERVAL '10 min', 'CONFIRMED', '00000000-0000-0000-0005-000000000007'),
('00000000-0000-0000-0006-000000000008', '00000000-0000-0000-0000-000000000017', '00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0003-000000000201', 1, NOW() - INTERVAL '23 hours', 'CONFIRMED', '00000000-0000-0000-0005-000000000008'),
('00000000-0000-0000-0006-000000000009', '00000000-0000-0000-0000-000000000018', '00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0003-000000000302', 1, NOW() - INTERVAL '23 hours', 'CONFIRMED', '00000000-0000-0000-0005-000000000009'),
('00000000-0000-0000-0006-000000000010', '00000000-0000-0000-0000-000000000019', '00000000-0000-0000-0002-000000000005', '00000000-0000-0000-0003-000000000501', 1, NOW() - INTERVAL '11 hours', 'CONFIRMED', '00000000-0000-0000-0005-000000000010'),
('00000000-0000-0000-0006-000000000011', '00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0002-000000000009', '00000000-0000-0000-0003-000000000901', 1, NOW() - INTERVAL '19 days' + INTERVAL '10 min', 'CONFIRMED', '00000000-0000-0000-0005-000000000011'),
('00000000-0000-0000-0006-000000000012', '00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0002-000000000009', '00000000-0000-0000-0003-000000000901', 1, NOW() - INTERVAL '18 days' + INTERVAL '10 min', 'CONFIRMED', '00000000-0000-0000-0005-000000000012'),
('00000000-0000-0000-0006-000000000015', '00000000-0000-0000-0000-000000000024', '00000000-0000-0000-0002-000000000011', '00000000-0000-0000-0003-000001100002', 1, NOW() - INTERVAL '2 hours', 'CONFIRMED', '00000000-0000-0000-0005-000000000015'),

-- Pending (active checkout)
('00000000-0000-0000-0006-000000000014', '00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0002-000000000010', '00000000-0000-0000-0003-000001000002', 1, NOW() + INTERVAL '5 minutes', 'PENDING', '00000000-0000-0000-0005-000000000014'),
('00000000-0000-0000-0006-000000000016', '00000000-0000-0000-0000-000000000025', '00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0003-000000000102', 3, NOW() + INTERVAL '8 minutes', 'PENDING', NULL),

-- Expired
('00000000-0000-0000-0006-000000000017', '00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0003-000000000102', 2, NOW() - INTERVAL '1 hour', 'EXPIRED', '00000000-0000-0000-0005-000000000013'),
('00000000-0000-0000-0006-000000000018', '00000000-0000-0000-0000-000000000019', '00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0003-000000000302', 1, NOW() - INTERVAL '3 hours', 'EXPIRED', NULL),

-- Cancelled
('00000000-0000-0000-0006-000000000019', '00000000-0000-0000-0000-000000000015', '00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0003-000000000102', 1, NOW() - INTERVAL '5 days' + INTERVAL '10 min', 'CANCELLED', NULL),
('00000000-0000-0000-0006-000000000020', '00000000-0000-0000-0000-000000000016', '00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0003-000000000202', 2, NOW() - INTERVAL '2 days' + INTERVAL '10 min', 'CANCELLED', NULL)

ON CONFLICT (reservation_id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- 12. TICKETS  (25 tickets — one per reserved seat)
-- ─────────────────────────────────────────────────────────────
-- QR hashes follow format: bt_{64-char-hex}_{8-char-hex}

INSERT INTO tickets (ticket_id, order_id, event_id, ticket_type_id, owner_user_id, qr_hash, status, price_purchased, attendee_name, attendee_nic, attendee_email, attendee_mobile) VALUES

-- Cricket T20 tickets (COMPLETED event)
('00000000-0000-0000-0007-000000000001', '00000000-0000-0000-0005-000000000001', '00000000-0000-0000-0002-000000000006', '00000000-0000-0000-0003-000000000601', '00000000-0000-0000-0000-000000000011',
 'bt_a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345678_a1b2c3d4',
 'USED', 900.00, 'Dilshan Wickramasinghe', '199812345678V', 'dilshan.w@gmail.com', '+94711111011'),

('00000000-0000-0000-0007-000000000002', '00000000-0000-0000-0005-000000000002', '00000000-0000-0000-0002-000000000006', '00000000-0000-0000-0003-000000000602', '00000000-0000-0000-0000-000000000012',
 'bt_b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456789_b2c3d4e5',
 'USED', 2375.00, 'Shalini Gunasekara', '199934567890V', 'shalini.g@gmail.com', '+94711111012'),

('00000000-0000-0000-0007-000000000003', '00000000-0000-0000-0005-000000000005', '00000000-0000-0000-0002-000000000006', '00000000-0000-0000-0003-000000000601', '00000000-0000-0000-0000-000000000015',
 'bt_c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567890ab_c3d4e5f6',
 'USED', 900.00, 'Nuwan Senanayake', NULL, 'nuwan.s@gmail.com', '+94711111015'),

('00000000-0000-0000-0007-000000000004', '00000000-0000-0000-0005-000000000005', '00000000-0000-0000-0002-000000000006', '00000000-0000-0000-0003-000000000601', '00000000-0000-0000-0000-000000000015',
 'bt_d4e5f6789012345678901234567890abcdef1234567890abcdef1234567890abcd_d4e5f678',
 'USED', 900.00, 'Guest of Nuwan', NULL, NULL, NULL),

-- Dance Show tickets (COMPLETED event)
('00000000-0000-0000-0007-000000000005', '00000000-0000-0000-0005-000000000003', '00000000-0000-0000-0002-000000000007', '00000000-0000-0000-0003-000000000701', '00000000-0000-0000-0000-000000000013',
 'bt_e5f6789012345678901234567890abcdef1234567890abcdef1234567890abcde5_e5f67890',
 'USED', 1500.00, 'Pradeep Kumara', '199756789012V', 'pradeep.k@yahoo.com', '+94711111013'),

('00000000-0000-0000-0007-000000000006', '00000000-0000-0000-0005-000000000004', '00000000-0000-0000-0002-000000000007', '00000000-0000-0000-0003-000000000702', '00000000-0000-0000-0000-000000000014',
 'bt_f6789012345678901234567890abcdef1234567890abcdef1234567890abcdef6f_f6789012',
 'USED', 3800.00, 'Amaya Dissanayake', '200045678901V', 'amaya.d@hotmail.com', '+94711111014'),

-- Music Festival tickets (ON_SALE event — ACTIVE)
('00000000-0000-0000-0007-000000000007', '00000000-0000-0000-0005-000000000006', '00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0003-000000000101', '00000000-0000-0000-0000-000000000011',
 'bt_07890123456789012345678901234567890abcdef1234567890abcdef12345678_07890123',
 'ACTIVE', 3700.00, 'Dilshan Wickramasinghe', '199812345678V', 'dilshan.w@gmail.com', '+94711111011'),

('00000000-0000-0000-0007-000000000008', '00000000-0000-0000-0005-000000000007', '00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0003-000000000102', '00000000-0000-0000-0000-000000000016',
 'bt_18901234567890123456789012345678901abcdef1234567890abcdef123456789_18901234',
 'ACTIVE', 1800.00, 'Hiruni Madushanka', NULL, 'hiruni.m@gmail.com', '+94711111016'),

('00000000-0000-0000-0007-000000000009', '00000000-0000-0000-0005-000000000007', '00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0003-000000000102', '00000000-0000-0000-0000-000000000016',
 'bt_29012345678901234567890123456789012abcdef1234567890abcdef1234567890_29012345',
 'ACTIVE', 1800.00, 'Guest', NULL, NULL, NULL),

-- TechTalk ticket (ON_SALE)
('00000000-0000-0000-0007-000000000010', '00000000-0000-0000-0005-000000000008', '00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0003-000000000201', '00000000-0000-0000-0000-000000000017',
 'bt_30123456789012345678901234567890123abcdef1234567890abcdef12345678_30123456',
 'ACTIVE', 1200.00, 'Isuru Pathirana', NULL, 'isuru.p@gmail.com', '+94711111017'),

-- LaughOut Comedy ticket
('00000000-0000-0000-0007-000000000011', '00000000-0000-0000-0005-000000000009', '00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0003-000000000302', '00000000-0000-0000-0000-000000000018',
 'bt_41234567890123456789012345678901234abcdef1234567890abcdef123456789_41234567',
 'ACTIVE', 700.00, 'Rashmi Cooray', NULL, 'rashmi.c@gmail.com', '+94711111018'),

-- Food Expo ticket
('00000000-0000-0000-0007-000000000012', '00000000-0000-0000-0005-000000000010', '00000000-0000-0000-0002-000000000005', '00000000-0000-0000-0003-000000000501', '00000000-0000-0000-0000-000000000019',
 'bt_52345678901234567890123456789012345abcdef1234567890abcdef1234567890_52345678',
 'ACTIVE', 350.00, NULL, NULL, NULL, NULL),

-- Cancelled event tickets (for refund_requests)
('00000000-0000-0000-0007-000000000013', '00000000-0000-0000-0005-000000000011', '00000000-0000-0000-0002-000000000009', '00000000-0000-0000-0003-000000000901', '00000000-0000-0000-0000-000000000020',
 'bt_63456789012345678901234567890123456abcdef1234567890abcdef12345678_63456789',
 'CANCELLED', 2800.00, 'Manori Wijesinghe', NULL, 'manori.w@gmail.com', '+94711111020'),

('00000000-0000-0000-0007-000000000014', '00000000-0000-0000-0005-000000000012', '00000000-0000-0000-0002-000000000009', '00000000-0000-0000-0003-000000000901', '00000000-0000-0000-0000-000000000021',
 'bt_74567890123456789012345678901234567abcdef1234567890abcdef123456789_74567890',
 'CANCELLED', 2800.00, 'Chamara Liyanage', NULL, 'chamara.l@gmail.com', '+94711111021'),

-- Beach Volleyball ticket
('00000000-0000-0000-0007-000000000015', '00000000-0000-0000-0005-000000000015', '00000000-0000-0000-0002-000000000011', '00000000-0000-0000-0003-000001100002', '00000000-0000-0000-0000-000000000024',
 'bt_85678901234567890123456789012345678abcdef1234567890abcdef1234567890_85678901',
 'ACTIVE', 300.00, 'Sachini Dharmasena', NULL, 'sachini.d@gmail.com', '+94711111024'),

-- PENDING ticket (awaiting payment confirmation — cash at gate or bank transfer)
('00000000-0000-0000-0007-000000000016', '00000000-0000-0000-0005-000000000010', '00000000-0000-0000-0002-000000000005', '00000000-0000-0000-0003-000000000501', '00000000-0000-0000-0000-000000000019',
 'bt_96789012345678901234567890123456789abcdef1234567890abcdef12345678_96789012',
 'PENDING', 350.00, NULL, NULL, NULL, NULL)

ON CONFLICT (ticket_id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- 13. PROMOTION USAGES  (10 rows)
-- ─────────────────────────────────────────────────────────────

INSERT INTO promotion_usages (usage_id, promotion_id, user_id, order_id, discount_received) VALUES
('00000000-0000-0000-0015-000000000001', '00000000-0000-0000-0004-000000000006', '00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0005-000000000002', 125.00),
('00000000-0000-0000-0015-000000000002', '00000000-0000-0000-0004-000000000006', '00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0005-000000000004', 200.00),
('00000000-0000-0000-0015-000000000003', '00000000-0000-0000-0004-000000000002', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0005-000000000006', 800.00),
('00000000-0000-0000-0015-000000000004', '00000000-0000-0000-0004-000000000003', '00000000-0000-0000-0000-000000000017', '00000000-0000-0000-0005-000000000008', 300.00),
('00000000-0000-0000-0015-000000000005', '00000000-0000-0000-0004-000000000004', '00000000-0000-0000-0000-000000000018', '00000000-0000-0000-0005-000000000009', 500.00),
('00000000-0000-0000-0015-000000000006', '00000000-0000-0000-0004-000000000010', '00000000-0000-0000-0000-000000000024', '00000000-0000-0000-0005-000000000015', 200.00),
('00000000-0000-0000-0015-000000000007', '00000000-0000-0000-0004-000000000001', '00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0005-000000000003', 0.00),
('00000000-0000-0000-0015-000000000008', '00000000-0000-0000-0004-000000000008', '00000000-0000-0000-0000-000000000015', '00000000-0000-0000-0005-000000000005', 0.00),
('00000000-0000-0000-0015-000000000009', '00000000-0000-0000-0004-000000000007', '00000000-0000-0000-0000-000000000019', '00000000-0000-0000-0005-000000000010', 0.00),
('00000000-0000-0000-0015-000000000010', '00000000-0000-0000-0004-000000000001', '00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0005-000000000011', 0.00)

ON CONFLICT (usage_id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- 14. TRANSACTIONS  (15 rows)
-- ─────────────────────────────────────────────────────────────

INSERT INTO transactions (transaction_id, order_id, gateway, gateway_ref_id, amount, status, meta_data) VALUES

('00000000-0000-0000-0008-000000000001', '00000000-0000-0000-0005-000000000001', 'PAYMENT_GATEWAY', 'PH_320001_100001', 900.00,   'SUCCESS', '{"method":"VISA","finalized_at":"2026-02-04T10:30:00+05:30"}'),
('00000000-0000-0000-0008-000000000002', '00000000-0000-0000-0005-000000000002', 'PAYMENT_GATEWAY', 'PH_320001_100002', 2375.00,  'SUCCESS', '{"method":"MASTERCARD","finalized_at":"2026-02-05T14:20:00+05:30"}'),
('00000000-0000-0000-0008-000000000003', '00000000-0000-0000-0005-000000000003', 'ONGATE', NULL,             1500.00,  'SUCCESS', '{"collected_by":"00000000-0000-0000-0000-000000000005","finalized_at":"2026-01-04T19:00:00+05:30"}'),
('00000000-0000-0000-0008-000000000004', '00000000-0000-0000-0005-000000000004', 'PAYMENT_GATEWAY', 'PH_320001_100004', 3800.00,  'SUCCESS', '{"method":"FRIMI","finalized_at":"2026-01-05T20:10:00+05:30"}'),
('00000000-0000-0000-0008-000000000005', '00000000-0000-0000-0005-000000000005', 'PAYMENT_GATEWAY', 'PH_320001_100005', 1800.00,  'SUCCESS', '{"method":"VISA","finalized_at":"2026-02-01T11:45:00+05:30"}'),
('00000000-0000-0000-0008-000000000006', '00000000-0000-0000-0005-000000000006', 'PAYMENT_GATEWAY', 'PH_320001_100006', 3700.00,  'SUCCESS', '{"method":"MASTERCARD","finalized_at":"2026-03-03T16:00:00+05:30"}'),
('00000000-0000-0000-0008-000000000007', '00000000-0000-0000-0005-000000000007', 'PAYMENT_GATEWAY', 'PH_320001_100007', 3600.00,  'SUCCESS', '{"method":"VISA","finalized_at":"2026-03-04T09:30:00+05:30"}'),
('00000000-0000-0000-0008-000000000008', '00000000-0000-0000-0005-000000000008', 'PAYMENT_GATEWAY', 'PH_320001_100008', 1200.00,  'SUCCESS', '{"method":"EZCASH","finalized_at":"2026-03-05T12:00:00+05:30"}'),
('00000000-0000-0000-0008-000000000009', '00000000-0000-0000-0005-000000000009', 'PAYMENT_GATEWAY', 'PH_320001_100009', 700.00,   'SUCCESS', '{"method":"VISA","finalized_at":"2026-03-05T18:30:00+05:30"}'),
('00000000-0000-0000-0008-000000000010', '00000000-0000-0000-0005-000000000010', 'ONGATE', NULL,             350.00,   'SUCCESS', '{"collected_by":"00000000-0000-0000-0000-000000000006"}'),
('00000000-0000-0000-0008-000000000011', '00000000-0000-0000-0005-000000000011', 'PAYMENT_GATEWAY', 'PH_320001_100011', 2800.00,  'SUCCESS', '{"method":"MASTERCARD","finalized_at":"2026-02-14T15:00:00+05:30"}'),
('00000000-0000-0000-0008-000000000012', '00000000-0000-0000-0005-000000000012', 'PAYMENT_GATEWAY', 'PH_320001_100012', 2800.00,  'SUCCESS', '{"method":"VISA","finalized_at":"2026-02-15T10:00:00+05:30","refunded":true}'),
('00000000-0000-0000-0008-000000000013', '00000000-0000-0000-0005-000000000013', 'PAYMENT_GATEWAY', 'PH_320001_100013', 1800.00,  'FAILED',  '{"reason":"INSUFFICIENT_FUNDS","status_code":"-2"}'),
('00000000-0000-0000-0008-000000000014', '00000000-0000-0000-0005-000000000015', 'PAYMENT_GATEWAY', 'PH_320001_100015', 300.00,   'SUCCESS', '{"method":"FRIMI","finalized_at":"2026-03-06T06:00:00+05:30"}'),
('00000000-0000-0000-0008-000000000015', '00000000-0000-0000-0005-000000000001', 'PAYMENT_GATEWAY', 'PH_320001_100016', 900.00,   'FAILED',  '{"reason":"TIMEOUT","status_code":"-1","retry_of":"PH_320001_100001"}')

ON CONFLICT (transaction_id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- 15. SCAN LOGS  (12 rows — gate scans for completed/active events)
-- ─────────────────────────────────────────────────────────────

INSERT INTO scan_logs (scan_id, ticket_id, scanned_by_user_id, result, scanned_at) VALUES

(1001, '00000000-0000-0000-0007-000000000001', '00000000-0000-0000-0000-000000000005', 'ALLOWED',             NOW() - INTERVAL '29 days' + INTERVAL '1 hour'),
(1002, '00000000-0000-0000-0007-000000000002', '00000000-0000-0000-0000-000000000005', 'ALLOWED',             NOW() - INTERVAL '29 days' + INTERVAL '1 hour 2 min'),
(1003, '00000000-0000-0000-0007-000000000003', '00000000-0000-0000-0000-000000000007', 'ALLOWED',             NOW() - INTERVAL '29 days' + INTERVAL '1 hour 5 min'),
(1004, '00000000-0000-0000-0007-000000000004', '00000000-0000-0000-0000-000000000007', 'ALLOWED',             NOW() - INTERVAL '29 days' + INTERVAL '1 hour 6 min'),
(1005, '00000000-0000-0000-0007-000000000005', '00000000-0000-0000-0000-000000000005', 'ALLOWED',             NOW() - INTERVAL '57 days' + INTERVAL '30 min'),
(1006, '00000000-0000-0000-0007-000000000006', '00000000-0000-0000-0000-000000000005', 'ALLOWED',             NOW() - INTERVAL '57 days' + INTERVAL '35 min'),
-- Duplicate scan attempt
(1007, '00000000-0000-0000-0007-000000000001', '00000000-0000-0000-0000-000000000007', 'DENIED_ALREADY_USED', NOW() - INTERVAL '29 days' + INTERVAL '3 hours'),
-- Invalid QR attempt
(1008, '00000000-0000-0000-0007-000000000013', '00000000-0000-0000-0000-000000000005', 'DENIED_INVALID',      NOW() - INTERVAL '4 days'),
-- Unpaid gate ticket scanned
(1009, '00000000-0000-0000-0007-000000000016', '00000000-0000-0000-0000-000000000006', 'DENIED_UNPAID',       NOW() - INTERVAL '10 hours'),
-- Food expo scans (ONGOING event)
(1010, '00000000-0000-0000-0007-000000000012', '00000000-0000-0000-0000-000000000006', 'ALLOWED',             NOW() - INTERVAL '5 hours'),
(1011, '00000000-0000-0000-0007-000000000011', '00000000-0000-0000-0000-000000000005', 'ALLOWED',             NOW() - INTERVAL '4 hours'),
(1012, '00000000-0000-0000-0007-000000000002', '00000000-0000-0000-0000-000000000007', 'DENIED_ALREADY_USED', NOW() - INTERVAL '29 days' + INTERVAL '4 hours')

ON CONFLICT (scan_id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- 16. PAYOUTS  (5 rows — completed events)
-- ─────────────────────────────────────────────────────────────

INSERT INTO payouts (payout_id, event_id, organizer_id, gross_revenue, platform_fee_amount, net_payout_amount, status, bank_transfer_ref, processed_by, processed_at, remarks) VALUES

-- Cricket T20 — COMPLETED payout
('00000000-0000-0000-0009-000000000001',
 '00000000-0000-0000-0002-000000000006', '00000000-0000-0000-0000-000000000002',
 1624500.00, 32490.00, 1592010.00,
 'COMPLETED', 'BOC/2026/02/TRF/004521',
 '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '22 days',
 'Net payout after 2% platform commission. Wire transferred to organizer BOC account.'),

-- Dance Show — COMPLETED payout
('00000000-0000-0000-0009-000000000002',
 '00000000-0000-0000-0002-000000000007', '00000000-0000-0000-0000-000000000003',
 1213000.00, 36390.00, 1176610.00,
 'COMPLETED', 'HNB/2026/01/TRF/002891',
 '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '50 days',
 'Net payout after 3% platform commission. Transferred to HNB account.'),

-- Fashion Week — SOLD_OUT event pending payout
('00000000-0000-0000-0009-000000000003',
 '00000000-0000-0000-0002-000000000008', '00000000-0000-0000-0000-000000000002',
 1760000.00, 52800.00, 1707200.00,
 'PENDING', NULL, NULL, NULL,
 'Payout scheduled for 7 days after event completion.'),

-- Food Expo — event still ONGOING, payout PENDING
('00000000-0000-0000-0009-000000000004',
 '00000000-0000-0000-0002-000000000005', '00000000-0000-0000-0000-000000000004',
 1113500.00, 33405.00, 1080095.00,
 'PENDING', NULL, NULL, NULL,
 'Preliminary payout estimate. Will be finalized after event closes.'),

-- Cancelled event — FAILED payout (event cancelled, no payout)
('00000000-0000-0000-0009-000000000005',
 '00000000-0000-0000-0002-000000000009', '00000000-0000-0000-0000-000000000004',
 655200.00, 19656.00, 635544.00,
 'FAILED', NULL,
 '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '5 days',
 'Event cancelled. Revenue being refunded to ticket holders. No payout.')

ON CONFLICT (payout_id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- 17. REFUND REQUESTS  (10 rows)
-- ─────────────────────────────────────────────────────────────

INSERT INTO refund_requests (refund_id, order_id, ticket_id, user_id, reason, refund_amount, status, admin_note, gateway_refund_ref, reviewed_by, reviewed_at) VALUES

-- Island Trance cancellation refunds
('00000000-0000-0000-0010-000000000001',
 '00000000-0000-0000-0005-000000000011', '00000000-0000-0000-0007-000000000013',
 '00000000-0000-0000-0000-000000000020',
 'Event was cancelled by organizer. Requesting full refund.',
 2800.00, 'PENDING', NULL, NULL, NULL, NULL),

('00000000-0000-0000-0010-000000000002',
 '00000000-0000-0000-0005-000000000012', '00000000-0000-0000-0007-000000000014',
 '00000000-0000-0000-0000-000000000021',
 'Event cancelled — Island Trance Open Air 2026. Need full refund.',
 2800.00, 'REFUNDED', 'Event cancellation confirmed. Full refund processed.',
 'PH_REFUND_220001', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '15 days'),

-- Personal reasons refunds
('00000000-0000-0000-0010-000000000003',
 '00000000-0000-0000-0005-000000000002', NULL,
 '00000000-0000-0000-0000-000000000012',
 'Unable to attend — family emergency. Cricket tournament ticket.',
 2375.00, 'REJECTED',
 'Event has a no-refund policy within 7 days of event date. Request rejected per T&C.',
 NULL, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '25 days'),

('00000000-0000-0000-0010-000000000004',
 '00000000-0000-0000-0005-000000000006', '00000000-0000-0000-0007-000000000007',
 '00000000-0000-0000-0000-000000000011',
 'Accidentally purchased VIP instead of General. Would like partial refund.',
 1900.00, 'PENDING', NULL, NULL, NULL, NULL),

('00000000-0000-0000-0010-000000000005',
 '00000000-0000-0000-0005-000000000008', '00000000-0000-0000-0007-000000000010',
 '00000000-0000-0000-0000-000000000017',
 'Date conflict — TechTalk Kandy. Can I get a refund or transfer?',
 1200.00, 'APPROVED',
 'Approved for full refund. Organizer confirmed transfer option unavailable.',
 NULL, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '6 hours'),

-- Failed payment order refund (charge reversed)
('00000000-0000-0000-0010-000000000006',
 '00000000-0000-0000-0005-000000000013', NULL,
 '00000000-0000-0000-0000-000000000022',
 'Payment failed but amount was deducted from my account.',
 1800.00, 'APPROVED',
 'Bank charge confirmed. Coordinating with PayHere for reversal.',
 NULL, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '20 hours'),

('00000000-0000-0000-0010-000000000007',
 '00000000-0000-0000-0005-000000000004', '00000000-0000-0000-0007-000000000006',
 '00000000-0000-0000-0000-000000000014',
 'VIP Dance Show ticket — event was shorter than advertised.',
 3800.00, 'REJECTED',
 'Duration discrepancy does not qualify for refund under section 4.3 of T&C.',
 NULL, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '45 days'),

('00000000-0000-0000-0010-000000000008',
 '00000000-0000-0000-0005-000000000009', '00000000-0000-0000-0007-000000000011',
 '00000000-0000-0000-0000-000000000018',
 'Comedy show ticket — venue was too crowded, poor experience.',
 700.00, 'PENDING', NULL, NULL, NULL, NULL),

('00000000-0000-0000-0010-000000000009',
 '00000000-0000-0000-0005-000000000001', '00000000-0000-0000-0007-000000000001',
 '00000000-0000-0000-0000-000000000011',
 'Cricket match cancelled due to rain — refund requested.',
 900.00, 'REJECTED',
 'Rain delay is not covered by refund policy. Match resumed next day.',
 NULL, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '20 days'),

('00000000-0000-0000-0010-000000000010',
 '00000000-0000-0000-0005-000000000015', '00000000-0000-0000-0007-000000000015',
 '00000000-0000-0000-0000-000000000024',
 'Purchased wrong ticket type for beach volleyball.',
 300.00, 'PENDING', NULL, NULL, NULL, NULL)

ON CONFLICT (refund_id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- 18. WAITLISTS  (12 rows — SOLD_OUT + ON_SALE high demand events)
-- ─────────────────────────────────────────────────────────────

INSERT INTO waitlists (waitlist_id, event_id, ticket_type_id, user_id, notify_email, position_order, status, notified_at, converted_order_id) VALUES

-- Fashion Week (SOLD_OUT) — VIP waitlist
('00000000-0000-0000-0011-000000000001', '00000000-0000-0000-0002-000000000008', '00000000-0000-0000-0003-000000000802', '00000000-0000-0000-0000-000000000011', 'dilshan.w@gmail.com',       1, 'WAITING',   NULL, NULL),
('00000000-0000-0000-0011-000000000002', '00000000-0000-0000-0002-000000000008', '00000000-0000-0000-0003-000000000802', '00000000-0000-0000-0000-000000000016', 'hiruni.m@gmail.com',        2, 'WAITING',   NULL, NULL),
('00000000-0000-0000-0011-000000000003', '00000000-0000-0000-0002-000000000008', '00000000-0000-0000-0003-000000000802', '00000000-0000-0000-0000-000000000020', 'manori.w@gmail.com',        3, 'WAITING',   NULL, NULL),
('00000000-0000-0000-0011-000000000004', '00000000-0000-0000-0002-000000000008', '00000000-0000-0000-0003-000000000802', '00000000-0000-0000-0000-000000000022', 'uthpala.w@gmail.com',       4, 'WAITING',   NULL, NULL),

-- Fashion Week — General waitlist
('00000000-0000-0000-0011-000000000005', '00000000-0000-0000-0002-000000000008', '00000000-0000-0000-0003-000000000801', '00000000-0000-0000-0000-000000000013', 'pradeep.k@yahoo.com',       1, 'WAITING',   NULL, NULL),
('00000000-0000-0000-0011-000000000006', '00000000-0000-0000-0002-000000000008', '00000000-0000-0000-0003-000000000801', '00000000-0000-0000-0000-000000000017', 'isuru.p@gmail.com',         2, 'WAITING',   NULL, NULL),
('00000000-0000-0000-0011-000000000007', '00000000-0000-0000-0002-000000000008', '00000000-0000-0000-0003-000000000801', '00000000-0000-0000-0000-000000000021', 'chamara.l@gmail.com',       3, 'NOTIFIED',  NOW() - INTERVAL '2 days', NULL),

-- Music Festival — VIP tier (nearly full)
('00000000-0000-0000-0011-000000000008', '00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0003-000000000101', '00000000-0000-0000-0000-000000000023', 'thilina.a@gmail.com',       1, 'WAITING',   NULL, NULL),
('00000000-0000-0000-0011-000000000009', '00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0003-000000000101', '00000000-0000-0000-0000-000000000025', 'ruwan.m@gmail.com',         2, 'WAITING',   NULL, NULL),

-- Food Expo VIP (2 left only — high demand)
('00000000-0000-0000-0011-000000000010', '00000000-0000-0000-0002-000000000005', '00000000-0000-0000-0003-000000000502', '00000000-0000-0000-0000-000000000014', 'amaya.d@hotmail.com',       1, 'NOTIFIED',  NOW() - INTERVAL '4 hours', NULL),
('00000000-0000-0000-0011-000000000011', '00000000-0000-0000-0002-000000000005', '00000000-0000-0000-0003-000000000502', '00000000-0000-0000-0000-000000000015', 'nuwan.s@gmail.com',         2, 'WAITING',   NULL, NULL),

-- Converted waitlist example
('00000000-0000-0000-0011-000000000012', '00000000-0000-0000-0002-000000000003', NULL, '00000000-0000-0000-0000-000000000019', 'lahiru.r@gmail.com', 1, 'CONVERTED', NOW() - INTERVAL '2 days', '00000000-0000-0000-0005-000000000009')

ON CONFLICT (waitlist_id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- 19. REVIEWS  (10 rows — only COMPLETED events with USED tickets)
-- ─────────────────────────────────────────────────────────────

-- UNIQUE constraint: (event_id, user_id) — each user can only review each event once.
-- All 10 rows use distinct (event_id, user_id) pairs across 5 different events.
INSERT INTO reviews (review_id, event_id, user_id, ticket_id, rating, review_text, is_visible) VALUES

-- ── Cricket T20 (evt06, COMPLETED) — users 011, 012, 015 ──
('00000000-0000-0000-0012-000000000001',
 '00000000-0000-0000-0002-000000000006', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0007-000000000001',
 5, 'Absolutely fantastic game! R. Premadasa Stadium atmosphere excellent. BuddyTicket through seat allocation was smooth — no queue issues at all!',
 TRUE),

('00000000-0000-0000-0012-000000000002',
 '00000000-0000-0000-0002-000000000006', '00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0007-000000000002',
 4, 'Pavilion seating was comfortable and AC was great. Lunch buffet was average. Overall a solid experience for cricket fans.',
 TRUE),

('00000000-0000-0000-0012-000000000003',
 '00000000-0000-0000-0002-000000000006', '00000000-0000-0000-0000-000000000015', '00000000-0000-0000-0007-000000000003',
 5, 'Best youth cricket event I have attended! Gate staff were very professional — no issues with QR scanning. Will definitely attend next year.',
 TRUE),

-- ── Dance Show (evt07, COMPLETED) — users 013, 014 ──
('00000000-0000-0000-0012-000000000004',
 '00000000-0000-0000-0002-000000000007', '00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0007-000000000005',
 5, 'Déjà Vu has outdone themselves with the 15th anniversary show. Every performance was flawless. Nelum Pokuna was the perfect venue.',
 TRUE),

('00000000-0000-0000-0012-000000000005',
 '00000000-0000-0000-0002-000000000007', '00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0007-000000000006',
 4, 'VIP Gold was worth every rupee. Champagne reception was elegant, backstage tour gave us a glimpse of the incredible hard work behind the show.',
 TRUE),

-- ── Music Festival (evt01, ON_SALE) — users 011, 016 ──
('00000000-0000-0000-0012-000000000006',
 '00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0007-000000000007',
 5, 'VIP lounge was incredible — open bar, front of stage, meet & greet all exceeded expectations. Best night of 2026 so far!',
 TRUE),

('00000000-0000-0000-0012-000000000007',
 '00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0000-000000000016', '00000000-0000-0000-0007-000000000008',
 4, 'Great lineup of artists. Stage production was world-class. Slight issue with food court queues but overall an amazing festival.',
 TRUE),

-- ── LaughOut Comedy (evt03, ON_SALE) — user 018 ──
('00000000-0000-0000-0012-000000000008',
 '00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0000-000000000018', '00000000-0000-0000-0007-000000000011',
 5, 'Absolutely hilarious evening! Nadeesha and Dino were on fire. Shangri-La venue was perfect — great sound and lighting setup.',
 TRUE),

-- ── TechTalk Kandy (evt02, ON_SALE) — user 017 ──
('00000000-0000-0000-0012-000000000009',
 '00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0000-000000000017', '00000000-0000-0000-0007-000000000010',
 3, 'Good keynotes but the workshop sessions were too basic for experienced developers. Would appreciate more advanced tracks next year.',
 FALSE),

-- ── Food Expo (evt05, ONGOING) — user 019 ──
('00000000-0000-0000-0012-000000000010',
 '00000000-0000-0000-0002-000000000005', '00000000-0000-0000-0000-000000000019', '00000000-0000-0000-0007-000000000012',
 4, 'Incredible variety of food and exhibitors. The street food village alone was worth the ticket price. Will be back tomorrow!',
 TRUE)

ON CONFLICT (review_id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- 20. OTP RECORDS  (10 rows)
-- ─────────────────────────────────────────────────────────────
-- otp_hash values are SHA-256 hashes of demo OTPs for testing.

INSERT INTO otp_records (otp_id, user_id, email, otp_hash, purpose, resend_count, last_sent_at, expires_at, is_used, verify_attempts) VALUES

('00000000-0000-0000-0013-000000000001', '00000000-0000-0000-0000-000000000011', 'dilshan.w@gmail.com',       '$2b$10$hash001xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'signin',           0, NOW() - INTERVAL '5 days',   NOW() - INTERVAL '4 days' - INTERVAL '55 min', TRUE,  1),
('00000000-0000-0000-0013-000000000002', '00000000-0000-0000-0000-000000000016', 'hiruni.m@gmail.com',        '$2b$10$hash002xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'signin',           1, NOW() - INTERVAL '2 days',   NOW() - INTERVAL '1 day' - INTERVAL '55 min',  TRUE,  1),
('00000000-0000-0000-0013-000000000003', '00000000-0000-0000-0000-000000000019', 'lahiru.r@gmail.com',        '$2b$10$hash003xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'signup',           0, NOW() - INTERVAL '10 days',  NOW() - INTERVAL '9 days' - INTERVAL '55 min', TRUE,  1),
('00000000-0000-0000-0013-000000000004', '00000000-0000-0000-0000-000000000023', 'thilina.a@gmail.com',       '$2b$10$hash004xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'signup',           2, NOW() - INTERVAL '1 day',    NOW() - INTERVAL '23 hours' + INTERVAL '5 min',  FALSE, 0),
('00000000-0000-0000-0013-000000000005', '00000000-0000-0000-0000-000000000013', 'pradeep.k@yahoo.com',       '$2b$10$hash005xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'forgot-password',  0, NOW() - INTERVAL '3 days',   NOW() - INTERVAL '2 days' - INTERVAL '55 min', TRUE,  1),
('00000000-0000-0000-0013-000000000006', '00000000-0000-0000-0000-000000000013', 'pradeep.k@yahoo.com',       '$2b$10$hash006xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'reset-password',   0, NOW() - INTERVAL '3 days',   NOW() - INTERVAL '2 days' - INTERVAL '40 min', TRUE,  1),
('00000000-0000-0000-0013-000000000007', '00000000-0000-0000-0000-000000000020', 'manori.w@gmail.com',        '$2b$10$hash007xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'signin',           0, NOW() - INTERVAL '1 hour',   NOW() + INTERVAL '4 min',  FALSE, 0),
('00000000-0000-0000-0013-000000000008', '00000000-0000-0000-0000-000000000025', 'ruwan.m@gmail.com',         '$2b$10$hash008xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'signup',           3, NOW() - INTERVAL '30 min',   NOW() + INTERVAL '30 min', FALSE, 2),
('00000000-0000-0000-0013-000000000009', NULL,                                   'newuser@example.com',       '$2b$10$hash009xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'signup',           0, NOW() - INTERVAL '2 hours',  NOW() - INTERVAL '1 hour' - INTERVAL '55 min', FALSE, 0),
('00000000-0000-0000-0013-000000000010', '00000000-0000-0000-0000-000000000018', 'rashmi.c@gmail.com',        '$2b$10$hash010xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'forgot-password',  1, NOW() - INTERVAL '6 hours',  NOW() - INTERVAL '5 hours' - INTERVAL '55 min', TRUE,  1)

ON CONFLICT (otp_id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- 21. AUTH FLOW TOKENS  (10 rows)
-- ─────────────────────────────────────────────────────────────

INSERT INTO auth_flow_tokens (token_id, email, purpose, token, expires_at, is_used) VALUES

('00000000-0000-0000-0014-000000000001', 'dilshan.w@gmail.com',    'signin',           'aft_tok_dilshan_signin_001_abcdef1234567890abcdef12',   NOW() - INTERVAL '4 days' + INTERVAL '30 min',  TRUE),
('00000000-0000-0000-0014-000000000002', 'hiruni.m@gmail.com',     'signin',           'aft_tok_hiruni_signin_002_abcdef1234567890abcdef12',    NOW() - INTERVAL '1 day' + INTERVAL '30 min',   TRUE),
('00000000-0000-0000-0014-000000000003', 'lahiru.r@gmail.com',     'signup',           'aft_tok_lahiru_signup_003_abcdef1234567890abcdef12',    NOW() - INTERVAL '9 days' + INTERVAL '30 min',  TRUE),
('00000000-0000-0000-0014-000000000004', 'thilina.a@gmail.com',    'signup',           'aft_tok_thilina_signup_004_abcdef1234567890abcdef12',   NOW() + INTERVAL '25 min',                       FALSE),
('00000000-0000-0000-0014-000000000005', 'pradeep.k@yahoo.com',    'forgot-password',  'aft_tok_pradeep_forgot_005_abcdef1234567890abcdef12',   NOW() - INTERVAL '2 days' + INTERVAL '15 min',  TRUE),
('00000000-0000-0000-0014-000000000006', 'pradeep.k@yahoo.com',    'reset-password',   'aft_tok_pradeep_reset_006_abcdef1234567890abcdef12',    NOW() - INTERVAL '2 days' + INTERVAL '30 min',  TRUE),
('00000000-0000-0000-0014-000000000007', 'manori.w@gmail.com',     'signin',           'aft_tok_manori_signin_007_abcdef1234567890abcdef12',    NOW() + INTERVAL '20 min',                       FALSE),
('00000000-0000-0000-0014-000000000008', 'ruwan.m@gmail.com',      'signup',           'aft_tok_ruwan_signup_008_abcdef1234567890abcdef12',     NOW() + INTERVAL '22 min',                       FALSE),
('00000000-0000-0000-0014-000000000009', 'newuser@example.com',    'signup',           'aft_tok_newuser_signup_009_abcdef1234567890abcdef12',   NOW() - INTERVAL '55 min',                       FALSE),
('00000000-0000-0000-0014-000000000010', 'rashmi.c@gmail.com',     'forgot-password',  'aft_tok_rashmi_forgot_010_abcdef1234567890abcdef12',    NOW() - INTERVAL '4 hours' + INTERVAL '30 min', TRUE)

ON CONFLICT (token_id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- VERIFICATION QUERIES
-- Run after seed to confirm all tables have data.
-- ─────────────────────────────────────────────────────────────

SELECT 'users'             AS tbl, COUNT(*) AS rows FROM users
UNION ALL
SELECT 'organizer_details',         COUNT(*) FROM organizer_details
UNION ALL
SELECT 'categories',                COUNT(*) FROM categories
UNION ALL
SELECT 'events',                    COUNT(*) FROM events
UNION ALL
SELECT 'event_images',              COUNT(*) FROM event_images
UNION ALL
SELECT 'ticket_types',              COUNT(*) FROM ticket_types
UNION ALL
SELECT 'vip_events',                COUNT(*) FROM vip_events
UNION ALL
SELECT 'event_community',           COUNT(*) FROM event_community
UNION ALL
SELECT 'promotions',                COUNT(*) FROM promotions
UNION ALL
SELECT 'orders',                    COUNT(*) FROM orders
UNION ALL
SELECT 'ticket_reservations',       COUNT(*) FROM ticket_reservations
UNION ALL
SELECT 'tickets',                   COUNT(*) FROM tickets
UNION ALL
SELECT 'promotion_usages',          COUNT(*) FROM promotion_usages
UNION ALL
SELECT 'transactions',              COUNT(*) FROM transactions
UNION ALL
SELECT 'scan_logs',                 COUNT(*) FROM scan_logs
UNION ALL
SELECT 'payouts',                   COUNT(*) FROM payouts
UNION ALL
SELECT 'refund_requests',           COUNT(*) FROM refund_requests
UNION ALL
SELECT 'waitlists',                 COUNT(*) FROM waitlists
UNION ALL
SELECT 'reviews',                   COUNT(*) FROM reviews
UNION ALL
SELECT 'otp_records',               COUNT(*) FROM otp_records
UNION ALL
SELECT 'auth_flow_tokens',          COUNT(*) FROM auth_flow_tokens
ORDER BY tbl;

COMMIT;