import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // ============================================================================
  // Subjects
  // ============================================================================
  console.log('📚 Creating subjects...');

  // ── STEM ──────────────────────────────────────────────────────────────────
  const cs        = await upsertSubject('Computer Science',          'Technology',     'Programming, algorithms, data structures, software engineering');
  const math      = await upsertSubject('Mathematics',               'STEM',           'Calculus, linear algebra, statistics, discrete math');
  const physics   = await upsertSubject('Physics',                   'STEM',           'Mechanics, thermodynamics, electromagnetism, quantum physics');
  const chem      = await upsertSubject('Chemistry',                 'Science',        'Organic, inorganic, and physical chemistry');
  const bio       = await upsertSubject('Biology',                   'Science',        'Cell biology, genetics, evolution, anatomy');
  const stats     = await upsertSubject('Statistics',                'STEM',           'Probability, hypothesis testing, regression, data analysis');
  const calculus  = await upsertSubject('Calculus',                  'STEM',           'Differential and integral calculus, limits, series');
  const linAlg    = await upsertSubject('Linear Algebra',            'STEM',           'Matrices, vector spaces, eigenvalues, transformations');
  const discrete  = await upsertSubject('Discrete Mathematics',      'STEM',           'Logic, sets, graph theory, combinatorics, proofs');
  const diffEq    = await upsertSubject('Differential Equations',    'STEM',           'ODEs, PDEs, Laplace transforms, numerical methods');
  const ee        = await upsertSubject('Electrical Engineering',    'Engineering',    'Circuits, signals, digital systems, electromagnetics');
  const me        = await upsertSubject('Mechanical Engineering',    'Engineering',    'Thermodynamics, fluid mechanics, statics, dynamics');
  const ce        = await upsertSubject('Civil Engineering',         'Engineering',    'Structural analysis, geotechnics, surveying, hydraulics');
  const che       = await upsertSubject('Chemical Engineering',      'Engineering',    'Mass transfer, reaction engineering, thermodynamics');
  const se        = await upsertSubject('Software Engineering',      'Technology',     'SDLC, design patterns, testing, project management');
  const ai        = await upsertSubject('Artificial Intelligence',   'Technology',     'Search algorithms, knowledge representation, machine learning basics');
  const ml        = await upsertSubject('Machine Learning',          'Technology',     'Supervised, unsupervised learning, neural networks, model evaluation');
  const dbms      = await upsertSubject('Database Management',       'Technology',     'SQL, relational models, normalization, NoSQL');
  const networks  = await upsertSubject('Computer Networks',         'Technology',     'TCP/IP, routing, protocols, network security');
  const os        = await upsertSubject('Operating Systems',         'Technology',     'Processes, memory management, file systems, concurrency');
  const webDev    = await upsertSubject('Web Development',           'Technology',     'HTML, CSS, JavaScript, React, Angular, Node.js');

  // ── Business & Social Sciences ───────────────────────────────────────────
  const econ      = await upsertSubject('Economics',                 'Social Science', 'Microeconomics, macroeconomics, econometrics');
  const accounting= await upsertSubject('Accounting',               'Business',       'Financial accounting, managerial accounting, auditing');
  const finance   = await upsertSubject('Finance',                  'Business',       'Corporate finance, investments, financial markets, valuation');
  const mgmt      = await upsertSubject('Management',               'Business',       'Organizational behavior, strategy, operations, HRM');
  const marketing = await upsertSubject('Marketing',                'Business',       'Consumer behavior, branding, digital marketing, research');
  const bizLaw    = await upsertSubject('Business Law',             'Business',       'Contract law, commercial law, corporate governance');
  const entrnp    = await upsertSubject('Entrepreneurship',         'Business',       'Business models, startup finance, lean methodology');

  // ── Humanities & Social Sciences ─────────────────────────────────────────
  const psych     = await upsertSubject('Psychology',               'Social Science', 'Cognitive, behavioral, social, developmental psychology');
  const sociology = await upsertSubject('Sociology',                'Social Science', 'Social structures, culture, inequality, research methods');
  const poli      = await upsertSubject('Political Science',        'Social Science', 'Comparative politics, IR, political theory, public policy');
  const history   = await upsertSubject('History',                  'Humanities',     'World history, historiography, primary source analysis');
  const english   = await upsertSubject('English Literature',       'Humanities',     'Literary analysis, prose, poetry, academic writing');
  const phil      = await upsertSubject('Philosophy',               'Humanities',     'Logic, ethics, epistemology, metaphysics');
  const geo       = await upsertSubject('Geography',                'Social Science', 'Physical geography, human geography, GIS');

  // ── Health & Life Sciences ───────────────────────────────────────────────
  const anatomy   = await upsertSubject('Anatomy & Physiology',    'Health Sciences','Human body systems, organ function, medical terminology');
  const microbio  = await upsertSubject('Microbiology',            'Science',         'Bacteria, viruses, fungi, immunology, lab techniques');
  const biochem   = await upsertSubject('Biochemistry',            'Science',         'Metabolism, proteins, nucleic acids, enzyme kinetics');
  const pharma    = await upsertSubject('Pharmacology',            'Health Sciences', 'Drug mechanisms, pharmacokinetics, clinical pharmacology');
  const nursing   = await upsertSubject('Nursing Sciences',        'Health Sciences', 'Patient care, clinical reasoning, healthcare ethics');

  // ── Law ──────────────────────────────────────────────────────────────────
  const constLaw  = await upsertSubject('Constitutional Law',      'Law',             'Fundamental rights, constitutional interpretation');
  const crimLaw   = await upsertSubject('Criminal Law',            'Law',             'Offences, defences, criminal procedure, sentencing');
  const civilLaw  = await upsertSubject('Civil Law',               'Law',             'Torts, contracts, property, remedies');
  const intLaw    = await upsertSubject('International Law',       'Law',             'Treaties, state responsibility, human rights law');

  // ── Architecture & Design ────────────────────────────────────────────────
  const arch      = await upsertSubject('Architecture',            'Design',          'Architectural design, structures, history of architecture');
  const id        = await upsertSubject('Interior Design',         'Design',          'Space planning, materials, lighting, design principles');
  const graphDes  = await upsertSubject('Graphic Design',          'Design',          'Typography, branding, Adobe tools, visual communication');

  // ── Languages ────────────────────────────────────────────────────────────
  const urdu      = await upsertSubject('Urdu',                    'Language',        'Urdu grammar, literature, composition');
  const arabic    = await upsertSubject('Arabic',                  'Language',        'Modern standard Arabic, Quranic Arabic, grammar');
  const french    = await upsertSubject('French',                  'Language',        'French grammar, literature, conversation');
  const chinese   = await upsertSubject('Chinese (Mandarin)',      'Language',        'Mandarin grammar, HSK prep, conversation');

  // ── Other ────────────────────────────────────────────────────────────────
  const env       = await upsertSubject('Environmental Science',   'Science',         'Ecology, climate change, sustainability, environmental policy');
  const dataScience = await upsertSubject('Data Science',          'Technology',      'Data wrangling, visualization, Python/R, model deployment');
  const cybersec  = await upsertSubject('Cybersecurity',           'Technology',      'Network security, cryptography, ethical hacking, compliance');
  const iot       = await upsertSubject('Internet of Things',      'Technology',      'Embedded systems, sensors, protocols, cloud connectivity');
  const projMgmt  = await upsertSubject('Project Management',      'Business',        'Agile, Scrum, PMP, risk management, scheduling');

  console.log('✅ 55 subjects created\n');

  // ============================================================================
  // Users  (all passwords: "password123")
  // ============================================================================
  console.log('👥 Creating users...');
  const hash = await bcrypt.hash('password123', 12);

  // Students
  const marcus = await upsertUser({
    id: 'seed_student_1',
    email: 'marcus@university.edu',
    name: 'Marcus Vance',
    password: hash,
    role: 'student',
    university: 'MIT',
    major: 'Computer Science',
    year: 2,
    bio: 'Second-year CS student, need help with algorithms and data structures.',
  });

  const clara = await upsertUser({
    id: 'seed_student_2',
    email: 'clara@university.edu',
    name: 'Clara Oswald',
    password: hash,
    role: 'student',
    university: 'UC Berkeley',
    major: 'Economics',
    year: 4,
    bio: 'Final-year economics student working on regression models.',
  });

  const alex = await upsertUser({
    id: 'seed_student_3',
    email: 'alex@university.edu',
    name: 'Alex Johnson',
    password: hash,
    role: 'student',
    university: 'Stanford University',
    major: 'Mathematics',
    year: 3,
    bio: 'Need help with multivariable calculus before midterms.',
  });

  // Tutors
  const sarah = await upsertUser({
    id: 'seed_tutor_1',
    email: 'sarah@university.edu',
    name: 'Sarah Miller',
    password: hash,
    role: 'tutor',
    university: 'Stanford University',
    major: 'Computer Science',
    year: 4,
    bio: 'TA for CS106B. Helped 30+ peers ace recursion, graphs, and dynamic programming.',
  });

  const david = await upsertUser({
    id: 'seed_tutor_2',
    email: 'david@university.edu',
    name: 'David Chen',
    password: hash,
    role: 'tutor',
    university: 'MIT',
    major: 'Mathematics',
    year: 4,
    bio: 'Math major passionate about making calculus and linear algebra intuitive.',
  });

  const elena = await upsertUser({
    id: 'seed_tutor_3',
    email: 'elena@university.edu',
    name: 'Elena Rostova',
    password: hash,
    role: 'tutor',
    university: 'UC Berkeley',
    major: 'Chemistry',
    year: 4,
    bio: 'Pre-med senior specializing in reaction mechanisms and stereochemistry.',
  });

  // Admin
  await upsertUser({
    id: 'seed_admin_1',
    email: 'admin@projectmate.com',
    name: 'Admin',
    password: await bcrypt.hash('admin123', 12),
    role: 'admin',
    university: null,
    major: null,
    year: null,
    bio: null,
  });

  console.log('✅ 7 users created\n');

  // ============================================================================
  // Tutor Listings
  // ============================================================================
  console.log('📝 Creating tutor listings...');

  // Delete old listings for these tutors to avoid duplicates on re-seed
  await prisma.tutorListing.deleteMany({ where: { tutorId: { in: [sarah.id, david.id, elena.id] } } });

  await prisma.tutorListing.create({
    data: {
      tutorId: sarah.id,
      subjectId: cs.id,
      title: 'Algorithms & Data Structures',
      description: 'TA for CS106B. Helped 30+ students ace recursion, graphs, and dynamic programming.',
      courseCode: 'CS 106B',
      ratePerHour: 1500,
      availability: 'Weekdays 6–9 PM, weekends flexible',
      format: 'online',
      status: 'active',
    }
  });

  await prisma.tutorListing.create({
    data: {
      tutorId: david.id,
      subjectId: math.id,
      title: 'Calculus & Linear Algebra',
      description: 'Making vector calculus, matrix decompositions, and eigenvalues intuitive.',
      courseCode: 'MATH 201',
      ratePerHour: 2000,
      availability: 'Mon / Wed / Fri 5–8 PM',
      format: 'both',
      status: 'active',
    }
  });

  await prisma.tutorListing.create({
    data: {
      tutorId: elena.id,
      subjectId: chem.id,
      title: 'Organic Chemistry I & II',
      description: 'Reaction mechanisms, synthesis problems, and stereochemistry explained clearly.',
      courseCode: 'CHEM 220',
      ratePerHour: 1800,
      availability: 'Tue / Thu evenings',
      format: 'online',
      status: 'active',
    }
  });

  console.log('✅ 3 tutor listings created\n');

  // ============================================================================
  // Help Requests
  // ============================================================================
  console.log('🆘 Creating help requests...');

  // Delete old requests for these students to avoid duplicates on re-seed
  await prisma.helpRequest.deleteMany({ where: { studentId: { in: [marcus.id, clara.id, alex.id] } } });

  await prisma.helpRequest.create({
    data: {
      studentId: marcus.id,
      subjectId: cs.id,
      title: 'Need review on Dijkstra algorithm implementation in C++',
      description: 'Stuck on handling priority queue updates for shortest path calculations. Looking for a 1-hour live walkthrough to understand why my relaxation step is not updating distances properly.',
      courseCode: 'CS 161',
      budget: 2500,
      urgency: 'high',
      status: 'open',
      proposalsCount: 0,
    }
  });

  await prisma.helpRequest.create({
    data: {
      studentId: clara.id,
      subjectId: econ.id,
      title: 'Econometrics regression model interpretation (R code)',
      description: 'Need help understanding heteroskedasticity tests (Breusch-Pagan) and correcting multicollinearity in my final paper dataset using R tidyverse packages.',
      courseCode: 'ECON 302',
      budget: 3000,
      urgency: 'medium',
      status: 'open',
      proposalsCount: 0,
    }
  });

  await prisma.helpRequest.create({
    data: {
      studentId: alex.id,
      subjectId: math.id,
      title: 'Calculus II – Integration by parts & trigonometric substitutions',
      description: 'Preparing for midterm next Tuesday. Need a focused session reviewing difficult definite integrals with trig substitutions and partial fraction decompositions.',
      courseCode: 'MATH 201',
      budget: 1500,
      urgency: 'high',
      status: 'open',
      proposalsCount: 0,
    }
  });

  console.log('✅ 3 help requests created\n');

  console.log('🎉 Seeding complete!\n');
  console.log('────────────────────────────────');
  console.log('  Login credentials (all: password123)');
  console.log('  Students:');
  console.log('    marcus@university.edu');
  console.log('    clara@university.edu');
  console.log('    alex@university.edu');
  console.log('  Tutors:');
  console.log('    sarah@university.edu');
  console.log('    david@university.edu');
  console.log('    elena@university.edu');
  console.log('  Admin:');
  console.log('    admin@projectmate.com  (password: admin123)');
  console.log('────────────────────────────────\n');
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function upsertSubject(name: string, category: string, description: string) {
  return prisma.subject.upsert({
    where: { name },
    update: {},
    create: { name, category, description }
  });
}

async function upsertUser(data: {
  id: string; email: string; name: string; password: string;
  role: 'student' | 'tutor' | 'admin';
  university: string | null; major: string | null; year: number | null; bio: string | null;
}) {
  // First check if a user with this email already exists (possibly with a different id)
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return prisma.user.update({
      where: { email: data.email },
      data: {
        name: data.name,
        password: data.password,
        role: data.role as any,
        university: data.university,
        major: data.major,
        year: data.year,
        bio: data.bio,
        verified: true
      }
    });
  }
  return prisma.user.create({
    data: { ...data, role: data.role as any, verified: true }
  });
}

// ─── Run ────────────────────────────────────────────────────────────────────

main()
  .catch(e => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
