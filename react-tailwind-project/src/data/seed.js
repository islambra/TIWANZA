import { addDays, nowIso, uid } from '../lib/utils.js'

function demoImage(label, tone = '#0D7A6A') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675"><rect width="1200" height="675" fill="#F8F8F6"/><rect x="40" y="40" width="1120" height="595" rx="24" fill="#ffffff" stroke="#E4E4E0"/><circle cx="950" cy="150" r="70" fill="${tone}" opacity="0.10"/><rect x="110" y="300" width="330" height="150" rx="16" fill="${tone}" opacity="0.08" stroke="${tone}" stroke-dasharray="8 8"/><rect x="520" y="250" width="440" height="200" rx="16" fill="#ffffff" stroke="${tone}" stroke-width="3"/><text x="540" y="330" font-family="Sora, Arial" font-size="30" font-weight="700" fill="#111111">Composant</text><text x="540" y="380" font-family="Sora, Arial" font-size="22" fill="#5C5C5C">props → rendu</text><text x="110" y="540" font-family="Sora, Arial" font-size="40" font-weight="700" fill="#111111">${label}</text><text x="110" y="590" font-family="Sora, Arial" font-size="22" fill="#5C5C5C">Schéma de démonstration — Tiwanza</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export function createSeedData() {
  const now = new Date()
  const at = (days, hour = 10, minute = 0) => {
    const date = addDays(now, days)
    date.setHours(hour, minute, 0, 0)
    return date.toISOString()
  }
  const createdAt = at(-120)

  const users = [
    { id: 'u-admin', name: 'Yasmine Tiwanza', email: 'admin@tiwanza.dz', password: 'demo1234', role: 'admin', schoolId: null, language: 'fr', status: 'active', createdAt, lastActiveAt: at(-1) },
    { id: 'u-t1', name: 'Yacine Belkacem', email: 'yacine@nour-academy.dz', password: 'demo1234', role: 'trainer', schoolId: 's-nour', language: 'fr', status: 'active', createdAt: at(-100), lastActiveAt: at(0) },
    { id: 'u-t2', name: 'Imane Haddad', email: 'imane@code-school.dz', password: 'demo1234', role: 'trainer', schoolId: 's-code', language: 'fr', status: 'active', createdAt: at(-80), lastActiveAt: at(-1) },
    { id: 'u-t3', name: 'Sofiane Merabet', email: 'sofiane@langue-plus.dz', password: 'demo1234', role: 'trainer', schoolId: 's-langue', language: 'ar', status: 'active', createdAt: at(-70), lastActiveAt: at(-3) },
    { id: 'u-t4', name: 'Rachid Brahimi', email: 'rachid@el-fajr.dz', password: 'demo1234', role: 'trainer', schoolId: 's-fajr', language: 'fr', status: 'active', createdAt: at(-6), lastActiveAt: at(-1) },
    { id: 'u-t5', name: 'Nadia Bensalem', email: 'nadia@example.dz', password: 'demo1234', role: 'trainer', schoolId: null, language: 'fr', status: 'active', createdAt: at(-1), lastActiveAt: at(0) },
    { id: 'u-l1', name: 'Amina Cherif', email: 'amina@example.dz', password: 'demo1234', role: 'learner', schoolId: 's-nour', language: 'fr', status: 'active', createdAt: at(-30), lastActiveAt: at(0) },
    { id: 'u-l2', name: 'Karim Boudiaf', email: 'karim@example.dz', password: 'demo1234', role: 'learner', schoolId: 's-nour', language: 'fr', status: 'active', createdAt: at(-25), lastActiveAt: at(-1) },
    { id: 'u-l3', name: 'Lina Saadi', email: 'lina@example.dz', password: 'demo1234', role: 'learner', schoolId: 's-code', language: 'fr', status: 'active', createdAt: at(-22), lastActiveAt: at(0) },
    { id: 'u-l4', name: 'Mehdi Khelifi', email: 'mehdi@example.dz', password: 'demo1234', role: 'learner', schoolId: 's-code', language: 'fr', status: 'active', createdAt: at(-19), lastActiveAt: at(-2) },
    { id: 'u-l5', name: 'Sara Benali', email: 'sara@example.dz', password: 'demo1234', role: 'learner', schoolId: 's-langue', language: 'ar', status: 'active', createdAt: at(-17), lastActiveAt: at(-2) },
    { id: 'u-l6', name: 'Omar Ziani', email: 'omar@example.dz', password: 'demo1234', role: 'learner', schoolId: 's-nour', language: 'fr', status: 'active', createdAt: at(-14), lastActiveAt: at(-1) },
    { id: 'u-l7', name: 'Nour Bouzid', email: 'nour@example.dz', password: 'demo1234', role: 'learner', schoolId: 's-nour', language: 'ar', status: 'active', createdAt: at(-12), lastActiveAt: at(0) },
    { id: 'u-l8', name: 'Rania Guerroudj', email: 'rania@example.dz', password: 'demo1234', role: 'learner', schoolId: 's-code', language: 'fr', status: 'active', createdAt: at(-20), lastActiveAt: at(-6) },
  ]

  const plans = [
    {
      id: 'plan-free',
      code: 'free',
      nameFr: 'Gratuit',
      nameAr: 'مجاني',
      descFr: 'Pour lancer votre première formation et découvrir Tiwanza.',
      descAr: 'لإطلاق أول دورة تدريبية واكتشاف تيوانزا.',
      priceDA: 0,
      period: 'month',
      samplePricing: false,
      enabled: true,
      order: 1,
      limits: { publishedCourses: 2, paidCourses: 1, learners: 50, storageGb: 2 },
      featuresFr: ['2 cours publiés', '1 cours payant', '50 apprenants inscrits', '2 Go de stockage vidéo natif', 'Site école public', 'Paiements manuels'],
      featuresAr: ['دورتان منشورتان', 'دورة مدفوعة واحدة', '50 متعلماً', '2 غيغابايت لتخزين الفيديو', 'موقع مدرسة عام', 'مدفوعات يدوية'],
    },
    {
      id: 'plan-pro',
      code: 'pro',
      nameFr: 'Pro',
      nameAr: 'برو',
      descFr: 'Pour développer une école en ligne complète et sans limite.',
      descAr: 'لتطوير مدرسة إلكترونية كاملة دون حدود.',
      priceDA: 4900,
      period: 'month',
      samplePricing: true,
      enabled: true,
      order: 2,
      limits: { publishedCourses: -1, paidCourses: -1, learners: -1, storageGb: 50 },
      featuresFr: ['Cours publiés illimités', 'Cours payants illimités', 'Apprenants illimités', '50 Go de stockage vidéo natif', 'Site école personnalisé', 'Sessions live & calendrier', 'Support prioritaire'],
      featuresAr: ['دورات منشورة غير محدودة', 'دورات مدفوعة غير محدودة', 'متعلقون غير محدودين', '50 غيغابايت لتخزين الفيديو', 'موقع مدرسة مخصص', 'حصص مباشرة وتقويم', 'دعم ذو أولوية'],
    },
  ]

  const schools = [
    {
      id: 's-nour',
      trainerId: 'u-t1',
      name: 'Académie Nour',
      slug: 'nour-academy',
      subdomain: 'nour-academy.tiwanza.com',
      description: "Académie Nour accompagne les créateurs et développeurs algériens avec des formations pratiques, vivantes et directement applicables.",
      contactEmail: 'contact@nour-academy.dz',
      contactPhone: '+213 555 12 34 56',
      city: 'Alger',
      language: 'fr',
      logo: null,
      brandAccent: '#0D7A6A',
      createdAt: at(-100),
      paymentSettings: {
        chargerly: { status: 'connected', mode: 'test', accountName: 'Académie Nour' },
        manual: {
          enabled: true,
          ccp: '001 234 567 89 clé 45',
          baridimob: '00799999000123456789',
          bank: { name: 'BNA', agency: 'Agence Alger Centre', rib: '00123456789012345678' },
          beneficiary: 'Académie Nour',
          instructionsFr: "Effectuez le virement puis indiquez la référence de votre paiement. Un justificatif (capture ou reçu) accélère la validation.",
          instructionsAr: 'قم بالتحويل ثم أشر إلى مرجع الدفع. إرفاق الإثبات (لقطة شاشة أو وصل) يسرّع التحقق.',
          delay: '24 h ouvrées',
        },
      },
    },
    {
      id: 's-code',
      trainerId: 'u-t2',
      name: 'Code School DZ',
      slug: 'code-school',
      subdomain: 'code-school.tiwanza.com',
      description: "Une école 100 % pratique pour apprendre à coder à son rythme, avec des projets concrets et un accompagnement humain.",
      contactEmail: 'bonjour@code-school.dz',
      contactPhone: '+213 661 08 76 54',
      city: 'Oran',
      language: 'fr',
      logo: null,
      brandAccent: '#0F766E',
      createdAt: at(-80),
      paymentSettings: {
        chargerly: { status: 'disconnected', mode: 'test', accountName: '' },
        manual: {
          enabled: true,
          ccp: '002 345 678 90 clé 12',
          baridimob: '00799999000987654321',
          bank: { name: 'CPA', agency: 'Agence Oran', rib: '00987654321012345678' },
          beneficiary: 'Code School DZ',
          instructionsFr: "Le paiement manuel est validé par Imane sous 48 h. Indiquez la référence du paiement dans le formulaire.",
          instructionsAr: 'تتم الموافقة على الدفع اليدوي من طرف إيمان خلال 48 ساعة. أشر إلى مرجع الدفع في النموذج.',
          delay: '48 h ouvrées',
        },
      },
    },
    {
      id: 's-langue',
      trainerId: 'u-t3',
      name: 'Langue Plus',
      slug: 'langue-plus',
      subdomain: 'langue-plus.tiwanza.com',
      description: 'مدرسة اللغات بلس متخصصة في تعليم اللغة الفرنسية والإنجليزية للمبتدئين بطريقة تفاعلية.',
      contactEmail: 'contact@langue-plus.dz',
      contactPhone: '+213 770 45 67 89',
      city: 'Constantine',
      language: 'ar',
      logo: null,
      brandAccent: '#0D7A6A',
      createdAt: at(-70),
      paymentSettings: {
        chargerly: { status: 'connected', mode: 'test', accountName: 'Langue Plus' },
        manual: {
          enabled: true,
          ccp: '003 456 789 01 clé 78',
          baridimob: '00799999000345678901',
          bank: { name: 'BADR', agency: 'Agence Constantine', rib: '00345678901234567890' },
          beneficiary: 'Langue Plus',
          instructionsFr: 'Le paiement manuel est vérifié sous 24 h.',
          instructionsAr: 'يتم التحقق من الدفع اليدوي خلال 24 ساعة.',
          delay: '24 h ouvrées',
        },
      },
    },
    {
      id: 's-fajr',
      trainerId: 'u-t4',
      name: 'Institut El Fajr',
      slug: 'el-fajr',
      subdomain: 'el-fajr.tiwanza.com',
      description: "Institut El Fajr propose des formations professionnelles courtes en gestion et comptabilité pour les jeunes entrepreneurs.",
      contactEmail: 'contact@el-fajr.dz',
      contactPhone: '+213 550 77 88 99',
      city: 'Sétif',
      language: 'fr',
      logo: null,
      brandAccent: '#0D7A6A',
      createdAt: at(-6),
      paymentSettings: {
        chargerly: { status: 'disconnected', mode: 'test', accountName: '' },
        manual: {
          enabled: true,
          ccp: '004 567 890 12 clé 34',
          baridimob: '00799999000456789012',
          bank: { name: 'BNA', agency: 'Agence Sétif', rib: '00456789012345678901' },
          beneficiary: 'Institut El Fajr',
          instructionsFr: 'Renseignez la référence du paiement manuel.',
          instructionsAr: 'يرجى إدخال مرجع الدفع اليدوي.',
          delay: '48 h ouvrées',
        },
      },
    },
  ]

  const trainerProfiles = [
    { id: 'tp-nour', userId: 'u-t1', schoolId: 's-nour', bio: 'Développeur full-stack et formateur depuis 8 ans. J’aime rendre le code accessible et concret.', headline: 'Développement web & produit', onboardingComplete: true, planId: 'plan-pro', subscriptionId: 'sub-nour', createdAt: at(-100) },
    { id: 'tp-code', userId: 'u-t2', schoolId: 's-code', bio: 'Ingénieure logiciel et pédagogie avant tout. J’accompagne les débutants vers leur premier projet.', headline: 'Python, Git & bonnes pratiques', onboardingComplete: true, planId: 'plan-free', subscriptionId: 'sub-code', createdAt: at(-80) },
    { id: 'tp-langue', userId: 'u-t3', schoolId: 's-langue', bio: 'أستاذ لغات منذ 10 سنوات، أؤمن أن التعلم يبدأ بالثقة والتطبيق اليومي.', headline: 'الفرنسية والإنجليزية للمبتدئين', onboardingComplete: true, planId: 'plan-pro', subscriptionId: 'sub-langue', createdAt: at(-70) },
    { id: 'tp-fajr', userId: 'u-t4', schoolId: 's-fajr', bio: 'Expert-comptable et formateur en gestion d’entreprise.', headline: 'Gestion & comptabilité', onboardingComplete: true, planId: 'plan-pro', subscriptionId: 'sub-fajr', createdAt: at(-6) },
    { id: 'tp-nadia', userId: 'u-t5', schoolId: null, bio: '', headline: '', onboardingComplete: false, planId: null, subscriptionId: null, createdAt: at(-1) },
  ]

  const subscriptions = [
    { id: 'sub-nour', trainerId: 'u-t1', planId: 'plan-pro', status: 'active', startedAt: at(-20), endsAt: at(10), amount: 4900, method: 'online', createdAt: at(-20), cancelledAt: null },
    { id: 'sub-code', trainerId: 'u-t2', planId: 'plan-free', status: 'active', startedAt: at(-80), endsAt: at(280), amount: 0, method: 'free', createdAt: at(-80), cancelledAt: null },
    { id: 'sub-langue', trainerId: 'u-t3', planId: 'plan-pro', status: 'expired', startedAt: at(-50), endsAt: at(-5), amount: 4900, method: 'manual', createdAt: at(-50), cancelledAt: null },
    { id: 'sub-fajr', trainerId: 'u-t4', planId: 'plan-pro', status: 'pending', startedAt: null, endsAt: null, amount: 4900, method: 'manual', createdAt: at(-1), cancelledAt: null },
  ]

  const subscriptionPayments = [
    { id: 'sp-nour-1', trainerId: 'u-t1', planId: 'plan-pro', amount: 4900, method: 'online', provider: 'cib', status: 'validated', reference: 'TIW-ONL-83921', proofName: null, proofDataUrl: null, submittedAt: at(-20), reviewedAt: at(-20), rejectionReason: null },
    { id: 'sp-nour-2', trainerId: 'u-t1', planId: 'plan-pro', amount: 4900, method: 'online', provider: 'edahabia', status: 'validated', reference: 'TIW-ONL-71203', proofName: null, proofDataUrl: null, submittedAt: at(-50), reviewedAt: at(-50), rejectionReason: null },
    { id: 'sp-langue-1', trainerId: 'u-t3', planId: 'plan-pro', amount: 4900, method: 'manual', provider: 'ccp', status: 'validated', reference: 'CCP-2026-4412', proofName: 'recu-ccp-langue.pdf', proofDataUrl: null, submittedAt: at(-50), reviewedAt: at(-49), rejectionReason: null },
    { id: 'sp-fajr-1', trainerId: 'u-t4', planId: 'plan-pro', amount: 4900, method: 'manual', provider: 'baridimob', status: 'pending', reference: 'BM-90912', proofName: 'preuve-baridimob.jpg', proofDataUrl: null, submittedAt: at(-1), reviewedAt: null, rejectionReason: null },
  ]

  const courses = [
    { id: 'crs-nour-react', schoolId: 's-nour', trainerId: 'u-t1', title: 'Développement web moderne avec React', shortDescription: 'Construisez des interfaces rapides et maintenables avec React, des composants aux hooks.', description: "Cette formation vous emmène des bases de React jusqu'à la création d'une application complète. Vous apprendrez à penser en composants, à gérer l'état, à structurer un projet et à préparer un déploiement. Chaque module combine une démonstration, un exercice guidé et un quiz de validation.", category: 'Développement', language: 'fr', isFree: false, priceDA: 8900, cover: 'linear-gradient(135deg,#0D7A6A 0%,#0A5F53 100%)', coverLabel: 'REACT', coverImage: null, status: 'published', sequential: true, commentsEnabled: true, objectivesFr: ['Penser et découper une interface en composants', 'Maîtriser les props, l’état et les effets', 'Structurer une application React maintenable', 'Préparer un projet pour la mise en ligne'], objectivesAr: ['تفكيك الواجهة إلى مكونات', 'إتقان الخصائص والحالة والتأثيرات', 'هيكلة تطبيق React قابل للصيانة', 'تحضير المشروع للنشر'], createdAt: at(-60), updatedAt: at(-2), publishedAt: at(-40) },
    { id: 'crs-nour-ux', schoolId: 's-nour', trainerId: 'u-t1', title: 'Design UI/UX : les fondamentaux', shortDescription: 'Concevez des interfaces claires, utiles et cohérentes, de la recherche au prototype.', description: "Une formation concrète pour comprendre les principes du design d'interface et d'expérience. Vous travaillerez sur la hiérarchie visuelle, la typographie, les couleurs, les parcours utilisateurs et le prototypage rapide. Le fil rouge : améliorer une interface réelle pas à pas.", category: 'Design', language: 'fr', isFree: false, priceDA: 6500, cover: 'linear-gradient(135deg,#1F2937 0%,#0F766E 100%)', coverLabel: 'UI / UX', coverImage: null, status: 'published', sequential: false, commentsEnabled: true, objectivesFr: ['Appliquer des principes de hiérarchie visuelle', 'Créer un système de couleurs et de typographie', 'Construire un prototype testable', 'Présenter et défendre ses choix de design'], objectivesAr: ['تطبيق مبادئ التسلسل البصري', 'إنشاء نظام ألوان وخطوط', 'بناء نموذج أولي قابل للاختبار', 'عرض خيارات التصميم والدفاع عنها'], createdAt: at(-45), updatedAt: at(-1), publishedAt: at(-30) },
    { id: 'crs-nour-marketing', schoolId: 's-nour', trainerId: 'u-t1', title: 'Marketing digital pour indépendants', shortDescription: 'Une méthode simple pour trouver vos premiers clients sans brûler votre budget.', description: "Ce cours gratuit vous donne un cadre clair pour clarifier votre offre, choisir vos canaux et construire un plan d'acquisition réaliste quand on est indépendant en Algérie. Des exemples concrets, des modèles et un quiz final.", category: 'Business', language: 'fr', isFree: true, priceDA: 0, cover: 'linear-gradient(135deg,#0F766E 0%,#14532D 100%)', coverLabel: 'GROWTH', coverImage: null, status: 'published', sequential: false, commentsEnabled: true, objectivesFr: ['Définir une audience et une promesse claire', 'Choisir deux canaux prioritaires', 'Construire un plan d’action sur 30 jours'], objectivesAr: ['تحديد الجمهور والوعد الواضح', 'اختيار قناتين أساسيتين', 'بناء خطة عمل لـ 30 يوماً'], createdAt: at(-35), updatedAt: at(-5), publishedAt: at(-25) },
    { id: 'crs-nour-ts', schoolId: 's-nour', trainerId: 'u-t1', title: 'Masterclass TypeScript', shortDescription: 'Un brouillon de masterclass sur les types avancés et l’architecture front-end.', description: 'Contenu en préparation. Cette masterclass couvrira les génériques, les types utilitaires et les patterns d’architecture pour de grandes applications.', category: 'Développement', language: 'fr', isFree: false, priceDA: 12000, cover: 'linear-gradient(135deg,#134E4A 0%,#0D7A6A 100%)', coverLabel: 'TS', coverImage: null, status: 'draft', sequential: true, commentsEnabled: true, objectivesFr: ['Comprendre les génériques', 'Utiliser les types utilitaires'], objectivesAr: ['فهم الأنواع العامة', 'استخدام الأنواع المساعدة'], createdAt: at(-8), updatedAt: at(-2), publishedAt: null },
    { id: 'crs-code-python', schoolId: 's-code', trainerId: 'u-t2', title: 'Python pour débutants', shortDescription: 'Vos premiers pas en programmation avec Python, sans prérequis.', description: "Un parcours gratuit et progressif pour découvrir la programmation avec Python. Vous écrivez vos premières lignes, manipulez des variables, des conditions et des boucles, puis validez vos acquis avec un quiz.", category: 'Développement', language: 'fr', isFree: true, priceDA: 0, cover: 'linear-gradient(135deg,#0D7A6A 0%,#115E59 100%)', coverLabel: 'PYTHON', coverImage: null, status: 'published', sequential: true, commentsEnabled: true, objectivesFr: ['Écrire et exécuter un script Python', 'Comprendre variables, types et conditions', 'Utiliser des boucles simples'], objectivesAr: ['كتابة وتنفيذ سكريبت بايثون', 'فهم المتغيرات والأنواع والشروط', 'استخدام الحلقات البسيطة'], createdAt: at(-50), updatedAt: at(-3), publishedAt: at(-35) },
    { id: 'crs-code-git', schoolId: 's-code', trainerId: 'u-t2', title: 'Git & GitHub en pratique', shortDescription: 'Versionnez votre code et collaborez sereinement sur vos projets.', description: "Apprenez Git par la pratique : commits, branches, fusion, résolution de conflits et collaboration sur GitHub. Cette formation payante inclut des exercices et un quiz de validation.", category: 'Développement', language: 'fr', isFree: false, priceDA: 3900, cover: 'linear-gradient(135deg,#292524 0%,#0D7A6A 100%)', coverLabel: 'GIT', coverImage: null, status: 'published', sequential: false, commentsEnabled: true, objectivesFr: ['Créer et gérer un dépôt Git', 'Travailler avec des branches', 'Collaborer sur GitHub'], objectivesAr: ['إنشاء وإدارة مستودع Git', 'العمل بالفروع', 'التعاون على GitHub'], createdAt: at(-30), updatedAt: at(-4), publishedAt: at(-20) },
    { id: 'crs-langue-fr', schoolId: 's-langue', trainerId: 'u-t3', title: 'اللغة الفرنسية للمبتدئين', shortDescription: 'دورة تفاعلية لتعلم أساسيات اللغة الفرنسية والتحدث بثقة في الحياة اليومية.', description: 'تبدأ هذه الدورة من الحروف والتحيات وتصل بك إلى محادثات بسيطة في الحياة اليومية. تتضمن فيديوهات قصيرة وتمارين وملفات قابلة للتحميل واختباراً نهائياً.', category: 'اللغات', language: 'ar', isFree: false, priceDA: 5500, cover: 'linear-gradient(135deg,#0D7A6A 0%,#1E3A5F 100%)', coverLabel: 'FR', coverImage: null, status: 'published', sequential: true, commentsEnabled: true, objectivesFr: ['Prononcer les sons essentiels du français', 'Se présenter et tenir une conversation simple'], objectivesAr: ['نطق الأصوات الأساسية في الفرنسية', 'التعريف بالنفس وإجراء محادثة بسيطة'], createdAt: at(-40), updatedAt: at(-6), publishedAt: at(-28) },
    { id: 'crs-fajr-compta', schoolId: 's-fajr', trainerId: 'u-t4', title: 'Bases de la comptabilité', shortDescription: 'Comprendre le bilan, le compte de résultat et les écritures essentielles.', description: 'Formation en préparation pour les jeunes entrepreneurs.', category: 'Gestion', language: 'fr', isFree: false, priceDA: 7500, cover: 'linear-gradient(135deg,#134E4A 0%,#1F2937 100%)', coverLabel: 'COMPTA', coverImage: null, status: 'draft', sequential: false, commentsEnabled: true, objectivesFr: ['Lire un bilan', 'Comprendre les écritures courantes'], objectivesAr: ['قراءة الميزانية', 'فهم القيود المحاسبية'], createdAt: at(-5), updatedAt: at(-5), publishedAt: null },
  ]

  const courseMeta = {
    'crs-nour-react': {
      difficulty: 'intermediate',
      prerequisitesFr: ['Bases de HTML, CSS et JavaScript', 'Un ordinateur avec Node.js installé'],
      prerequisitesAr: ['أساسيات HTML وCSS وJavaScript', 'حاسوب مثبت عليه Node.js'],
    },
    'crs-nour-ux': {
      difficulty: 'beginner',
      prerequisitesFr: ['Aucun prérequis technique', 'Une curiosité pour le design et les usages'],
      prerequisitesAr: ['لا توجد متطلبات تقنية مسبقة', 'فضول تجاه التصميم وتجربة المستخدم'],
    },
    'crs-nour-marketing': {
      difficulty: 'beginner',
      prerequisitesFr: ['Aucun prérequis'],
      prerequisitesAr: ['لا توجد متطلبات مسبقة'],
    },
    'crs-nour-ts': {
      difficulty: 'advanced',
      prerequisitesFr: ['Maîtriser JavaScript moderne', 'Avoir déjà réalisé un projet React'],
      prerequisitesAr: ['إتقان JavaScript الحديثة', 'سبق إنجاز مشروع باستخدام React'],
    },
    'crs-code-python': {
      difficulty: 'beginner',
      prerequisitesFr: ['Aucun prérequis'],
      prerequisitesAr: ['لا توجد متطلبات مسبقة'],
    },
    'crs-code-git': {
      difficulty: 'beginner',
      prerequisitesFr: ['Savoir utiliser un terminal', 'Un compte GitHub (facultatif)'],
      prerequisitesAr: ['معرفة استخدام الطرفية', 'حساب GitHub (اختياري)'],
    },
    'crs-langue-fr': {
      difficulty: 'beginner',
      prerequisitesFr: ['Aucun prérequis'],
      prerequisitesAr: ['لا توجد متطلبات مسبقة'],
    },
    'crs-fajr-compta': {
      difficulty: 'beginner',
      prerequisitesFr: ['Aucun prérequis'],
      prerequisitesAr: ['لا توجد متطلبات مسبقة'],
    },
  }
  courses.forEach((course) => Object.assign(course, courseMeta[course.id]))

  const sections = [
    { id: 'sec-nr-1', courseId: 'crs-nour-react', title: 'Démarrer avec React', order: 1 },
    { id: 'sec-nr-2', courseId: 'crs-nour-react', title: 'Composants et état', order: 2 },
    { id: 'sec-nu-1', courseId: 'crs-nour-ux', title: 'Principes essentiels', order: 1 },
    { id: 'sec-nu-2', courseId: 'crs-nour-ux', title: 'Mettre en pratique', order: 2 },
    { id: 'sec-nm-1', courseId: 'crs-nour-marketing', title: 'Acquisition', order: 1 },
    { id: 'sec-nm-2', courseId: 'crs-nour-marketing', title: 'Passer à l’action', order: 2 },
    { id: 'sec-nt-1', courseId: 'crs-nour-ts', title: 'Introduction', order: 1 },
    { id: 'sec-cp-1', courseId: 'crs-code-python', title: 'Les bases', order: 1 },
    { id: 'sec-cp-2', courseId: 'crs-code-python', title: 'Aller plus loin', order: 2 },
    { id: 'sec-cg-1', courseId: 'crs-code-git', title: 'Git en local', order: 1 },
    { id: 'sec-cg-2', courseId: 'crs-code-git', title: 'Collaborer', order: 2 },
    { id: 'sec-lf-1', courseId: 'crs-langue-fr', title: 'الأساسيات', order: 1 },
    { id: 'sec-lf-2', courseId: 'crs-langue-fr', title: 'المحادثة', order: 2 },
    { id: 'sec-fc-1', courseId: 'crs-fajr-compta', title: 'Introduction', order: 1 },
  ]

  const sectionMeta = {
    'sec-nr-1': { descriptionFr: 'Installation, structure du projet et premiers composants.', descriptionAr: 'التثبيت وهيكلة المشروع وأول المكونات.' },
    'sec-nr-2': { descriptionFr: 'Props, état, événements et composition de composants.', descriptionAr: 'الخصائص والحالة والأحداث وتركيب المكونات.' },
    'sec-nu-1': { descriptionFr: "Les principes qui rendent une interface lisible et utile.", descriptionAr: 'المبادئ التي تجعل الواجهة واضحة ومفيدة.' },
    'sec-nu-2': { descriptionFr: 'Du wireframe au prototype testable.', descriptionAr: 'من المخطط الأولي إلى نموذج قابل للاختبار.' },
    'sec-nm-1': { descriptionFr: 'Comprendre son audience et clarifier son offre.', descriptionAr: 'فهم الجمهور وتوضيح العرض.' },
    'sec-nm-2': { descriptionFr: 'Construire un plan d’acquisition réaliste.', descriptionAr: 'بناء خطة جذب واقعية.' },
    'sec-nt-1': { descriptionFr: 'Pourquoi TypeScript et comment l’adopter progressivement.', descriptionAr: 'لماذا TypeScript وكيفية اعتماده تدريجياً.' },
    'sec-cp-1': { descriptionFr: 'Premiers programmes, variables et types.', descriptionAr: 'أول البرامج والمتغيرات والأنواع.' },
    'sec-cp-2': { descriptionFr: 'Conditions, boucles et exercices guidés.', descriptionAr: 'الشروط والحلقات وتمارين موجهة.' },
    'sec-cg-1': { descriptionFr: 'Commits, historique et branches en local.', descriptionAr: 'الالتزامات والسجل والفروع محلياً.' },
    'sec-cg-2': { descriptionFr: 'Travailler à plusieurs sur GitHub.', descriptionAr: 'العمل الجماعي على GitHub.' },
    'sec-lf-1': { descriptionFr: 'الحروف والتحيات والمفردات الأساسية.', descriptionAr: 'الحروف والتحيات والمفردات الأساسية.' },
    'sec-lf-2': { descriptionFr: 'محادثات قصيرة وتدريب على النطق.', descriptionAr: 'محادثات قصيرة وتدريب على النطق.' },
    'sec-fc-1': { descriptionFr: 'Découvrir les notions comptables essentielles.', descriptionAr: 'التعرف على المفاهيم المحاسبية الأساسية.' },
  }
  sections.forEach((section) => Object.assign(section, sectionMeta[section.id]))

  const lessons = [
    { id: 'les-nr-1', courseId: 'crs-nour-react', sectionId: 'sec-nr-1', title: 'Bienvenue & objectifs', type: 'content', order: 1, durationMin: 8, createdAt: at(-60) },
    { id: 'les-nr-2', courseId: 'crs-nour-react', sectionId: 'sec-nr-1', title: 'Installer l’environnement', type: 'content', order: 2, durationMin: 14, createdAt: at(-60) },
    { id: 'les-nr-3', courseId: 'crs-nour-react', sectionId: 'sec-nr-1', title: 'Quiz — les fondamentaux', type: 'quiz', order: 3, durationMin: 10, quizId: 'qz-react-1', createdAt: at(-60) },
    { id: 'les-nr-4', courseId: 'crs-nour-react', sectionId: 'sec-nr-2', title: 'Créer son premier composant', type: 'content', order: 1, durationMin: 18, createdAt: at(-55) },
    { id: 'les-nr-5', courseId: 'crs-nour-react', sectionId: 'sec-nr-2', title: 'Props, state et événements', type: 'content', order: 2, durationMin: 22, createdAt: at(-54) },
    { id: 'les-nr-6', courseId: 'crs-nour-react', sectionId: 'sec-nr-2', title: 'Quiz — composants', type: 'quiz', order: 3, durationMin: 12, quizId: 'qz-react-2', createdAt: at(-54) },
    { id: 'les-nu-1', courseId: 'crs-nour-ux', sectionId: 'sec-nu-1', title: 'Penser l’expérience utilisateur', type: 'content', order: 1, durationMin: 16, createdAt: at(-45) },
    { id: 'les-nu-2', courseId: 'crs-nour-ux', sectionId: 'sec-nu-1', title: 'Couleur, typographie et espace', type: 'content', order: 2, durationMin: 20, createdAt: at(-45) },
    { id: 'les-nu-3', courseId: 'crs-nour-ux', sectionId: 'sec-nu-2', title: 'Wireframes et prototypes', type: 'content', order: 1, durationMin: 24, createdAt: at(-42) },
    { id: 'les-nu-4', courseId: 'crs-nour-ux', sectionId: 'sec-nu-2', title: 'Quiz — design UI', type: 'quiz', order: 2, durationMin: 10, quizId: 'qz-ux', createdAt: at(-42) },
    { id: 'les-nm-1', courseId: 'crs-nour-marketing', sectionId: 'sec-nm-1', title: 'Comprendre son audience', type: 'content', order: 1, durationMin: 12, createdAt: at(-35) },
    { id: 'les-nm-2', courseId: 'crs-nour-marketing', sectionId: 'sec-nm-1', title: 'Créer une offre claire', type: 'content', order: 2, durationMin: 15, createdAt: at(-35) },
    { id: 'les-nm-3', courseId: 'crs-nour-marketing', sectionId: 'sec-nm-1', title: 'Quiz — bases du marketing', type: 'quiz', order: 3, durationMin: 8, quizId: 'qz-marketing', createdAt: at(-35) },
    { id: 'les-nm-4', courseId: 'crs-nour-marketing', sectionId: 'sec-nm-2', title: 'Plan d’action sur 30 jours', type: 'content', order: 1, durationMin: 14, createdAt: at(-34) },
    { id: 'les-nt-1', courseId: 'crs-nour-ts', sectionId: 'sec-nt-1', title: 'Pourquoi TypeScript ?', type: 'content', order: 1, durationMin: 10, createdAt: at(-8) },
    { id: 'les-cp-1', courseId: 'crs-code-python', sectionId: 'sec-cp-1', title: 'Premiers pas avec Python', type: 'content', order: 1, durationMin: 12, createdAt: at(-50) },
    { id: 'les-cp-2', courseId: 'crs-code-python', sectionId: 'sec-cp-1', title: 'Variables et types', type: 'content', order: 2, durationMin: 18, createdAt: at(-50) },
    { id: 'les-cp-3', courseId: 'crs-code-python', sectionId: 'sec-cp-2', title: 'Boucles et conditions', type: 'content', order: 1, durationMin: 20, createdAt: at(-48) },
    { id: 'les-cp-4', courseId: 'crs-code-python', sectionId: 'sec-cp-2', title: 'Quiz — Python', type: 'quiz', order: 2, durationMin: 10, quizId: 'qz-python', createdAt: at(-48) },
    { id: 'les-cg-1', courseId: 'crs-code-git', sectionId: 'sec-cg-1', title: 'Pourquoi Git ?', type: 'content', order: 1, durationMin: 14, createdAt: at(-30) },
    { id: 'les-cg-2', courseId: 'crs-code-git', sectionId: 'sec-cg-1', title: 'Commits et branches', type: 'content', order: 2, durationMin: 25, createdAt: at(-30) },
    { id: 'les-cg-3', courseId: 'crs-code-git', sectionId: 'sec-cg-2', title: 'Quiz — Git & GitHub', type: 'quiz', order: 1, durationMin: 12, quizId: 'qz-git', createdAt: at(-28) },
    { id: 'les-lf-1', courseId: 'crs-langue-fr', sectionId: 'sec-lf-1', title: 'أهلاً بكم في دورة اللغة الفرنسية', type: 'content', order: 1, durationMin: 10, createdAt: at(-40) },
    { id: 'les-lf-2', courseId: 'crs-langue-fr', sectionId: 'sec-lf-1', title: 'الحروف والتحيات', type: 'content', order: 2, durationMin: 18, createdAt: at(-40) },
    { id: 'les-lf-3', courseId: 'crs-langue-fr', sectionId: 'sec-lf-2', title: 'اختبار — الأساسيات', type: 'quiz', order: 1, durationMin: 10, quizId: 'qz-langue', createdAt: at(-38) },
    { id: 'les-fc-1', courseId: 'crs-fajr-compta', sectionId: 'sec-fc-1', title: 'Les bases de la comptabilité', type: 'content', order: 1, durationMin: 12, createdAt: at(-5) },
  ]

  const lessonMeta = {
    'les-nr-1': { descriptionFr: 'Découvrez le parcours, le projet fil rouge et la méthode de travail.', descriptionAr: 'اكتشف مسار الدورة والمشروع التطبيقي وطريقة العمل.', preview: true },
    'les-nr-2': { descriptionFr: 'Préparer Node.js, Vite et votre éditeur de code.', descriptionAr: 'تحضير Node.js وVite ومحرر الأكواد.' },
    'les-nr-3': { descriptionFr: 'Validez les bases de React avec un quiz corrigé.', descriptionAr: 'تحقق من أساسيات React عبر اختبار مصحح.' },
    'les-nr-4': { descriptionFr: 'Écrire un premier composant réutilisable.', descriptionAr: 'كتابة أول مكون قابل لإعادة الاستخدام.' },
    'les-nr-5': { descriptionFr: 'Faire circuler les données avec les props et le state.', descriptionAr: 'تمرير البيانات باستخدام الخصائص والحالة.' },
    'les-nr-6': { descriptionFr: 'Testez votre compréhension des composants et de l’état.', descriptionAr: 'اختبر فهمك للمكونات والحالة.' },
    'les-nu-1': { descriptionFr: 'Partir des besoins réels avant de dessiner.', descriptionAr: 'الانطلاق من الاحتياجات الحقيقية قبل التصميم.', preview: true },
    'les-nu-2': { descriptionFr: 'Construire une échelle typographique et une palette cohérente.', descriptionAr: 'بناء مقياس خطوط ولوحة ألوان متناسقة.' },
    'les-nu-3': { descriptionFr: 'Transformer une idée en prototype testable.', descriptionAr: 'تحويل الفكرة إلى نموذج أولي قابل للاختبار.' },
    'les-nu-4': { descriptionFr: 'Validez les principes de hiérarchie et de contraste.', descriptionAr: 'تحقق من مبادئ التسلسل والتباين.' },
    'les-nm-1': { descriptionFr: 'Décrire son audience avec des faits utiles.', descriptionAr: 'وصف الجمهور بحقائق مفيدة.', preview: true },
    'les-nm-2': { descriptionFr: 'Formuler une promesse claire en dix secondes.', descriptionAr: 'صياغة وعد واضح في عشر ثوان.' },
    'les-nm-3': { descriptionFr: 'Testez les bases d’une acquisition saine.', descriptionAr: 'اختبر أساسيات جذب العملاء.' },
    'les-nm-4': { descriptionFr: 'Un plan simple, mesurable et soutenable.', descriptionAr: 'خطة بسيطة وقابلة للقياس والاستمرار.' },
    'les-nt-1': { descriptionFr: 'Comprendre l’intérêt des types statiques.', descriptionAr: 'فهم فائدة الأنواع الثابتة.', preview: true },
    'les-cp-1': { descriptionFr: 'Exécuter son premier script Python.', descriptionAr: 'تنفيذ أول سكريبت بايثون.', preview: true },
    'les-cp-2': { descriptionFr: 'Manipuler les variables et les types natifs.', descriptionAr: 'التعامل مع المتغيرات والأنواع الأساسية.' },
    'les-cp-3': { descriptionFr: 'Prendre des décisions et répéter des actions.', descriptionAr: 'اتخاذ القرارات وتكرار الإجراءات.' },
    'les-cp-4': { descriptionFr: 'Vérifiez vos acquis avec un quiz Python.', descriptionAr: 'تحقق من مكتسباتك عبر اختبار بايثون.' },
    'les-cg-1': { descriptionFr: 'Comprendre l’historique et les commits.', descriptionAr: 'فهم السجل والالتزامات.', preview: true },
    'les-cg-2': { descriptionFr: 'Créer des branches et fusionner sans stress.', descriptionAr: 'إنشاء الفروع ودمجها بسهولة.' },
    'les-cg-3': { descriptionFr: 'Validez les commandes essentielles de Git.', descriptionAr: 'تحقق من أوامر Git الأساسية.' },
    'les-lf-1': { descriptionFr: 'بداية الدورة، الحروف والأصوات الأساسية.', descriptionAr: 'بداية الدورة والحروف والأصوات الأساسية.', preview: true },
    'les-lf-2': { descriptionFr: 'التحيات والمفردات المستخدمة يومياً.', descriptionAr: 'التحيات والمفردات المستخدمة يومياً.' },
    'les-lf-3': { descriptionFr: 'اختبر ما تعلمته في الوحدة الأولى.', descriptionAr: 'اختبر ما تعلمته في الوحدة الأولى.' },
    'les-fc-1': { descriptionFr: 'Découvrir le vocabulaire de base de la comptabilité.', descriptionAr: 'التعرف على المصطلحات الأساسية للمحاسبة.', preview: true },
  }
  lessons.forEach((lesson) => {
    const meta = lessonMeta[lesson.id] || {}
    lesson.descriptionFr = meta.descriptionFr || 'Une leçon pratique avec des exemples concrets.'
    lesson.descriptionAr = meta.descriptionAr || 'درس عملي مع أمثلة تطبيقية.'
    lesson.preview = Boolean(meta.preview)
  })

  const blocks = [
    { id: 'blk-nr-1a', lessonId: 'les-nr-1', type: 'richtext', order: 1, data: { html: '<h2>Bienvenue dans la formation</h2><p>Dans ce cours, vous allez apprendre à construire des interfaces avec <strong>React</strong>. Nous avancerons pas à pas, avec des exemples concrets et des exercices courts.</p><ul><li>Penser en composants</li><li>Gérer l’état sans complexité inutile</li><li>Structurer un projet maintenable</li></ul><blockquote>Conseil : codez chaque exemple dans votre éditeur. La pratique est ce qui fait la différence.</blockquote>' } },
    { id: 'blk-nr-1b', lessonId: 'les-nr-1', type: 'video', order: 2, data: { fileName: 'bienvenue-react.mp4', sizeMb: 86, durationSec: 420, status: 'ready', poster: null } },
    { id: 'blk-nr-1c', lessonId: 'les-nr-1', type: 'youtube', order: 3, data: { url: 'https://www.youtube.com/watch?v=Tn6-PIqc4UM', title: 'React en 100 secondes' } },
    { id: 'blk-nr-2a', lessonId: 'les-nr-2', type: 'richtext', order: 1, data: { html: '<h2>Préparer votre environnement</h2><p>Vous aurez besoin de <strong>Node.js</strong> et d’un éditeur de code. Nous utiliserons Vite pour démarrer rapidement.</p><ol><li>Installez Node.js LTS.</li><li>Créez un dossier de projet.</li><li>Lancez la commande de création.</li></ol><p><code>npm create vite@latest</code></p>' } },
    { id: 'blk-nr-2b', lessonId: 'les-nr-2', type: 'pdf', order: 2, data: { fileName: 'guide-installation-react.pdf', sizeMb: 2.4, status: 'ready' } },
    { id: 'blk-nr-2c', lessonId: 'les-nr-2', type: 'file', order: 3, data: { fileName: 'starter-react.zip', sizeMb: 8.2, status: 'ready' } },
    { id: 'blk-nr-4a', lessonId: 'les-nr-4', type: 'richtext', order: 1, data: { html: `<h2>Un composant, une responsabilité</h2><p>Un composant est une fonction qui retourne du JSX. Commencez petit, puis composez.</p><pre><code>function Welcome({ name }) {
  return &lt;h1&gt;Bonjour {name}&lt;/h1&gt;
}</code></pre><p>Remarquez la prop <strong>name</strong> : elle rend le composant réutilisable.</p>` } },
    { id: 'blk-nr-4b', lessonId: 'les-nr-4', type: 'image', order: 2, data: { fileName: 'schema-composants.svg', caption: 'Anatomie d’un composant React', url: demoImage('Anatomie d’un composant') } },
    { id: 'blk-nr-4c', lessonId: 'les-nr-4', type: 'gdrive', order: 3, data: { url: 'https://drive.google.com/file/d/1TiwanzaDemoFileReact/view', fileName: 'Fiche mémo composants' } },
    { id: 'blk-nr-5a', lessonId: 'les-nr-5', type: 'video', order: 1, data: { fileName: 'props-state.mp4', sizeMb: 132, durationSec: 1320, status: 'ready', poster: null } },
    { id: 'blk-nr-5b', lessonId: 'les-nr-5', type: 'richtext', order: 2, data: { html: '<h2>State et événements</h2><p>Le state est la mémoire locale d’un composant. Utilisez <code>useState</code> pour le créer, et une fonction pour le mettre à jour.</p><ul><li>Les props descendent, les événements remontent.</li><li>Ne modifiez jamais le state directement.</li><li>Gardez un état minimal et dérivé quand c’est possible.</li></ul>' } },
    { id: 'blk-nu-1a', lessonId: 'les-nu-1', type: 'richtext', order: 1, data: { html: '<h2>L’utilisateur avant l’interface</h2><p>Un bon design part d’un besoin réel. Avant de dessiner, clarifiez qui utilise le produit, dans quel contexte et pour quel objectif.</p><ul><li>Qui est l’utilisateur ?</li><li>Quel problème cherche-t-il à résoudre ?</li><li>Qu’est-ce qui pourrait le bloquer ?</li></ul>' } },
    { id: 'blk-nu-1b', lessonId: 'les-nu-1', type: 'image', order: 2, data: { fileName: 'parcours-utilisateur.svg', caption: 'Cartographier un parcours utilisateur', url: demoImage('Parcours utilisateur') } },
    { id: 'blk-nu-2a', lessonId: 'les-nu-2', type: 'richtext', order: 1, data: { html: '<h2>Une base visuelle cohérente</h2><p>La couleur attire, la typographie structure, l’espace respire. Limitez votre palette et créez une échelle typographique claire.</p><blockquote>Si tout est mis en avant, plus rien ne l’est.</blockquote>' } },
    { id: 'blk-nu-2b', lessonId: 'les-nu-2', type: 'youtube', order: 2, data: { url: 'https://www.youtube.com/watch?v=uwNClNmekWc', title: 'Les principes du design visuel' } },
    { id: 'blk-nu-3a', lessonId: 'les-nu-3', type: 'richtext', order: 1, data: { html: '<h2>Du croquis au prototype</h2><p>Commencez par des wireframes en niveaux de gris, puis ajoutez progressivement la hiérarchie visuelle. Testez avec une personne extérieure au projet.</p>' } },
    { id: 'blk-nu-3b', lessonId: 'les-nu-3', type: 'pdf', order: 2, data: { fileName: 'checklist-prototype.pdf', sizeMb: 1.1, status: 'ready' } },
    { id: 'blk-nm-1a', lessonId: 'les-nm-1', type: 'richtext', order: 1, data: { html: '<h2>À qui parlez-vous vraiment ?</h2><p>Décrivez votre audience avec des faits : son rôle, ses contraintes, ses objectifs et le vocabulaire qu’elle utilise. Évitez les personas décoratifs.</p>' } },
    { id: 'blk-nm-2a', lessonId: 'les-nm-2', type: 'richtext', order: 1, data: { html: '<h2>Une offre compréhensible en 10 secondes</h2><p>Votre promesse doit répondre à trois questions : pour qui, quel résultat, en combien de temps.</p>' } },
    { id: 'blk-nm-2b', lessonId: 'les-nm-2', type: 'video', order: 2, data: { fileName: 'offre-claire.mp4', sizeMb: 64, durationSec: 600, status: 'ready', poster: null } },
    { id: 'blk-nm-4a', lessonId: 'les-nm-4', type: 'richtext', order: 1, data: { html: '<h2>Votre plan sur 30 jours</h2><p>Choisissez deux canaux, définissez un rythme soutenable et mesurez une seule chose : les conversations qualifiées générées.</p><ul><li>Semaine 1 : clarifier l’offre</li><li>Semaine 2 : publier trois contenus utiles</li><li>Semaine 3 : contacter dix prospects</li><li>Semaine 4 : analyser et ajuster</li></ul>' } },
    { id: 'blk-nt-1a', lessonId: 'les-nt-1', type: 'richtext', order: 1, data: { html: '<h2>Pourquoi TypeScript ?</h2><p>TypeScript ajoute une couche de sécurité statique à JavaScript. Ce cours est encore en préparation.</p>' } },
    { id: 'blk-cp-1a', lessonId: 'les-cp-1', type: 'richtext', order: 1, data: { html: '<h2>Votre premier programme</h2><p>Python se lit presque comme de l’anglais. Essayez ce programme dans votre terminal :</p><pre><code>print("Bonjour Tiwanza")</code></pre><p>Félicitations, vous venez d’écrire votre premier programme.</p>' } },
    { id: 'blk-cp-1b', lessonId: 'les-cp-1', type: 'video', order: 2, data: { fileName: 'premiers-pas-python.mp4', sizeMb: 54, durationSec: 540, status: 'ready', poster: null } },
    { id: 'blk-cp-2a', lessonId: 'les-cp-2', type: 'richtext', order: 1, data: { html: `<h2>Variables et types</h2><p>Une variable est un nom associé à une valeur. Python devine le type automatiquement.</p><pre><code>nom = "Amina"
age = 24
est_inscrite = True</code></pre>` } },
    { id: 'blk-cp-2b', lessonId: 'les-cp-2', type: 'pdf', order: 2, data: { fileName: 'memo-types-python.pdf', sizeMb: 1.8, status: 'ready' } },
    { id: 'blk-cp-3a', lessonId: 'les-cp-3', type: 'richtext', order: 1, data: { html: `<h2>Conditions et boucles</h2><p>Une condition choisit, une boucle répète. Ces deux outils suffisent déjà à résoudre beaucoup de problèmes.</p><pre><code>for nombre in range(1, 6):
    if nombre % 2 == 0:
        print(nombre, "est pair")</code></pre>` } },
    { id: 'blk-cp-3b', lessonId: 'les-cp-3', type: 'file', order: 2, data: { fileName: 'exercices-boucles.zip', sizeMb: 0.6, status: 'ready' } },
    { id: 'blk-cg-1a', lessonId: 'les-cg-1', type: 'richtext', order: 1, data: { html: '<h2>Pourquoi versionner son code ?</h2><p>Git garde l’historique de vos modifications. Vous pouvez revenir en arrière, tester une idée dans une branche et collaborer sans écraser le travail des autres.</p>' } },
    { id: 'blk-cg-1b', lessonId: 'les-cg-1', type: 'youtube', order: 2, data: { url: 'https://www.youtube.com/watch?v=RGOj5yH7evk', title: 'Git & GitHub pour débutants' } },
    { id: 'blk-cg-2a', lessonId: 'les-cg-2', type: 'richtext', order: 1, data: { html: `<h2>Commits et branches</h2><p>Un commit est une photographie de votre projet. Une branche est une ligne de travail parallèle.</p><pre><code>git checkout -b feature/quiz
git add .
git commit -m "Ajoute le quiz"</code></pre>` } },
    { id: 'blk-cg-2b', lessonId: 'les-cg-2', type: 'file', order: 2, data: { fileName: 'commandes-git-essentielles.pdf', sizeMb: 0.9, status: 'ready' } },
    { id: 'blk-lf-1a', lessonId: 'les-lf-1', type: 'richtext', order: 1, data: { html: '<h2>مرحباً بكم</h2><p>في هذه الدورة ستتعلمون أساسيات اللغة الفرنسية بطريقة بسيطة. سنبدأ بالحروف والتحيات ثم ننتقل إلى محادثات قصيرة.</p><ul><li>الاستماع والنطق</li><li>المفردات اليومية</li><li>التعبير عن النفس بثقة</li></ul>' } },
    { id: 'blk-lf-1b', lessonId: 'les-lf-1', type: 'video', order: 2, data: { fileName: 'bienvenue-fr.mp4', sizeMb: 72, durationSec: 480, status: 'ready', poster: null } },
    { id: 'blk-lf-2a', lessonId: 'les-lf-2', type: 'richtext', order: 1, data: { html: '<h2>التحيات الأساسية</h2><p><strong>Bonjour</strong> تعني صباح الخير أو مرحباً، و<strong>Bonsoir</strong> تُستخدم في المساء. تدربوا على نطقها بصوت عالٍ.</p><blockquote>لا تخافوا من الأخطاء، فهي جزء من التعلم.</blockquote>' } },
    { id: 'blk-lf-2b', lessonId: 'les-lf-2', type: 'pdf', order: 2, data: { fileName: 'fiche-salutations.pdf', sizeMb: 1.3, status: 'ready' } },
    { id: 'blk-fc-1a', lessonId: 'les-fc-1', type: 'richtext', order: 1, data: { html: '<h2>Comprendre les bases</h2><p>Cette leçon sera complétée lors de la publication de la formation.</p>' } },
  ]

  const quizzes = [
    {
      id: 'qz-react-1',
      courseId: 'crs-nour-react',
      lessonId: 'les-nr-3',
      title: 'Quiz — les fondamentaux de React',
      passingScore: 70,
      randomizeQuestions: false,
      randomizeAnswers: false,
      questions: [
        { id: 'r1q1', type: 'single', title: 'Quel outil permet de créer un état local dans un composant fonction ?', points: 2, explanation: 'useState retourne une valeur et une fonction de mise à jour.', choices: [{ id: 'r1q1a', text: 'useState', correct: true }, { id: 'r1q1b', text: 'useEffect', correct: false }, { id: 'r1q1c', text: 'useRef', correct: false }] },
        { id: 'r1q2', type: 'boolean', title: 'Un composant React doit toujours commencer par une majuscule.', points: 1, explanation: 'React distingue les composants des balises HTML grâce à la majuscule initiale.', choices: [{ id: 'r1q2a', text: 'Vrai', correct: true }, { id: 'r1q2b', text: 'Faux', correct: false }] },
        { id: 'r1q3', type: 'multiple', title: 'Quels éléments peuvent être passés à un composant via les props ?', points: 2, explanation: 'Les props peuvent contenir des valeurs, fonctions ou même d’autres éléments.', choices: [{ id: 'r1q3a', text: 'Des chaînes de caractères', correct: true }, { id: 'r1q3b', text: 'Des fonctions', correct: true }, { id: 'r1q3c', text: 'Des éléments JSX', correct: true }, { id: 'r1q3d', text: 'Uniquement des nombres', correct: false }] },
        { id: 'r1q4', type: 'single', title: 'Que retourne un composant React ?', points: 2, explanation: 'Un composant retourne du JSX (ou null).', choices: [{ id: 'r1q4a', text: 'Du JSX', correct: true }, { id: 'r1q4b', text: 'Une base de données', correct: false }, { id: 'r1q4c', text: 'Un fichier CSS', correct: false }] },
      ],
    },
    {
      id: 'qz-react-2',
      courseId: 'crs-nour-react',
      lessonId: 'les-nr-6',
      title: 'Quiz — composants et état',
      passingScore: 70,
      randomizeQuestions: true,
      randomizeAnswers: false,
      questions: [
        { id: 'r2q1', type: 'single', title: 'Comment mettre à jour un état avec useState ?', points: 2, explanation: 'On appelle la fonction de mise à jour retournée par useState.', choices: [{ id: 'r2q1a', text: 'En appelant la fonction retournée par useState', correct: true }, { id: 'r2q1b', text: 'En modifiant directement la variable', correct: false }, { id: 'r2q1c', text: 'En rechargeant la page', correct: false }] },
        { id: 'r2q2', type: 'multiple', title: 'Quelles affirmations sont vraies ?', points: 3, explanation: 'Les props sont en lecture seule et le state déclenche un nouveau rendu.', choices: [{ id: 'r2q2a', text: 'Les props sont en lecture seule', correct: true }, { id: 'r2q2b', text: 'Modifier le state provoque un nouveau rendu', correct: true }, { id: 'r2q2c', text: 'Le state est partagé entre tous les composants', correct: false }] },
        { id: 'r2q3', type: 'boolean', title: 'Un événement peut remonter des données vers le composant parent via une fonction passée en prop.', points: 1, explanation: 'C’est le pattern classique des callbacks.', choices: [{ id: 'r2q3a', text: 'Vrai', correct: true }, { id: 'r2q3b', text: 'Faux', correct: false }] },
      ],
    },
    {
      id: 'qz-ux',
      courseId: 'crs-nour-ux',
      lessonId: 'les-nu-4',
      title: 'Quiz — design UI',
      passingScore: 60,
      randomizeQuestions: false,
      randomizeAnswers: false,
      questions: [
        { id: 'uxq1', type: 'single', title: 'Quel principe aide à guider le regard dans une interface ?', points: 2, explanation: 'La hiérarchie visuelle organise l’information par importance.', choices: [{ id: 'uxq1a', text: 'La hiérarchie visuelle', correct: true }, { id: 'uxq1b', text: 'Le hasard', correct: false }, { id: 'uxq1c', text: 'Le plus grand nombre de couleurs possible', correct: false }] },
        { id: 'uxq2', type: 'boolean', title: 'Un espace blanc excessif est toujours une erreur de design.', points: 1, explanation: 'L’espace blanc améliore la lisibilité et la respiration.', choices: [{ id: 'uxq2a', text: 'Vrai', correct: false }, { id: 'uxq2b', text: 'Faux', correct: true }] },
        { id: 'uxq3', type: 'multiple', title: 'Que faut-il tester avec un prototype ?', points: 2, explanation: 'On teste la compréhension, le parcours et les points de blocage.', choices: [{ id: 'uxq3a', text: 'La compréhension des libellés', correct: true }, { id: 'uxq3b', text: 'Le parcours principal', correct: true }, { id: 'uxq3c', text: 'La couleur préférée du designer', correct: false }] },
      ],
    },
    {
      id: 'qz-marketing',
      courseId: 'crs-nour-marketing',
      lessonId: 'les-nm-3',
      title: 'Quiz — bases du marketing',
      passingScore: 60,
      randomizeQuestions: false,
      randomizeAnswers: false,
      questions: [
        { id: 'mkq1', type: 'single', title: 'Que doit contenir une promesse claire ?', points: 2, explanation: 'Une promesse indique pour qui, quel résultat et dans quel délai.', choices: [{ id: 'mkq1a', text: 'Pour qui, quel résultat, en combien de temps', correct: true }, { id: 'mkq1b', text: 'Uniquement un prix', correct: false }, { id: 'mkq1c', text: 'Un slogan abstrait', correct: false }] },
        { id: 'mkq2', type: 'boolean', title: 'Il vaut mieux être présent partout dès le début.', points: 1, explanation: 'Mieux vaut deux canaux maîtrisés que dix canaux négligés.', choices: [{ id: 'mkq2a', text: 'Vrai', correct: false }, { id: 'mkq2b', text: 'Faux', correct: true }] },
        { id: 'mkq3', type: 'multiple', title: 'Quels indicateurs sont utiles pour un indépendant ?', points: 2, explanation: 'Les conversations qualifiées et les demandes entrantes comptent plus que les likes.', choices: [{ id: 'mkq3a', text: 'Conversations qualifiées', correct: true }, { id: 'mkq3b', text: 'Demandes entrantes', correct: true }, { id: 'mkq3c', text: 'Nombre de likes uniquement', correct: false }] },
      ],
    },
    {
      id: 'qz-python',
      courseId: 'crs-code-python',
      lessonId: 'les-cp-4',
      title: 'Quiz — Python',
      passingScore: 70,
      randomizeQuestions: true,
      randomizeAnswers: true,
      questions: [
        { id: 'pyq1', type: 'single', title: 'Quelle instruction affiche du texte en Python ?', points: 2, explanation: 'print() affiche une valeur dans la console.', choices: [{ id: 'pyq1a', text: 'print()', correct: true }, { id: 'pyq1b', text: 'echo()', correct: false }, { id: 'pyq1c', text: 'console.log()', correct: false }] },
        { id: 'pyq2', type: 'boolean', title: 'Python est sensible à la casse.', points: 1, explanation: 'Nom et nom sont deux variables différentes.', choices: [{ id: 'pyq2a', text: 'Vrai', correct: true }, { id: 'pyq2b', text: 'Faux', correct: false }] },
        { id: 'pyq3', type: 'multiple', title: 'Quels sont des types Python valides ?', points: 2, explanation: 'int, str et bool sont des types natifs.', choices: [{ id: 'pyq3a', text: 'int', correct: true }, { id: 'pyq3b', text: 'str', correct: true }, { id: 'pyq3c', text: 'bool', correct: true }, { id: 'pyq3d', text: 'texte', correct: false }] },
      ],
    },
    {
      id: 'qz-git',
      courseId: 'crs-code-git',
      lessonId: 'les-cg-3',
      title: 'Quiz — Git & GitHub',
      passingScore: 70,
      randomizeQuestions: false,
      randomizeAnswers: false,
      questions: [
        { id: 'gtq1', type: 'single', title: 'Quelle commande crée un nouveau commit ?', points: 2, explanation: 'git commit enregistre les changements indexés.', choices: [{ id: 'gtq1a', text: 'git commit', correct: true }, { id: 'gtq1b', text: 'git push', correct: false }, { id: 'gtq1c', text: 'git clone', correct: false }] },
        { id: 'gtq2', type: 'boolean', title: 'Une branche permet de travailler sans modifier la branche principale.', points: 1, explanation: 'C’est tout l’intérêt des branches.', choices: [{ id: 'gtq2a', text: 'Vrai', correct: true }, { id: 'gtq2b', text: 'Faux', correct: false }] },
        { id: 'gtq3', type: 'multiple', title: 'Que peut-on faire avec GitHub ?', points: 2, explanation: 'GitHub héberge les dépôts et facilite la collaboration.', choices: [{ id: 'gtq3a', text: 'Héberger un dépôt distant', correct: true }, { id: 'gtq3b', text: 'Créer des pull requests', correct: true }, { id: 'gtq3c', text: 'Compiler du Python automatiquement', correct: false }] },
        { id: 'gtq4', type: 'single', title: 'Quelle commande envoie vos commits sur le dépôt distant ?', points: 1, explanation: 'git push envoie les commits locaux.', choices: [{ id: 'gtq4a', text: 'git push', correct: true }, { id: 'gtq4b', text: 'git pull', correct: false }, { id: 'gtq4c', text: 'git status', correct: false }] },
      ],
    },
    {
      id: 'qz-langue',
      courseId: 'crs-langue-fr',
      lessonId: 'les-lf-3',
      title: 'اختبار — الأساسيات',
      passingScore: 60,
      randomizeQuestions: false,
      randomizeAnswers: false,
      questions: [
        { id: 'lfq1', type: 'single', title: 'كيف نقول « Bonjour » بالفرنسية في الصباح؟', points: 2, explanation: 'Bonjour تُستخدم في الصباح. Bonsoir في المساء.', choices: [{ id: 'lfq1a', text: 'Bonjour', correct: true }, { id: 'lfq1b', text: 'Bonsoir', correct: false }, { id: 'lfq1c', text: 'Merci', correct: false }] },
        { id: 'lfq2', type: 'boolean', title: '« Merci » تعني شكراً.', points: 1, explanation: 'نعم، Merci تعني شكراً.', choices: [{ id: 'lfq2a', text: 'صحيح', correct: true }, { id: 'lfq2b', text: 'خطأ', correct: false }] },
        { id: 'lfq3', type: 'multiple', title: 'أي عبارات تُستخدم للتحية؟', points: 2, explanation: 'Bonjour وSalut تحيتان شائعتان.', choices: [{ id: 'lfq3a', text: 'Bonjour', correct: true }, { id: 'lfq3b', text: 'Salut', correct: true }, { id: 'lfq3c', text: 'Au revoir', correct: false }] },
      ],
    },
  ]

  const quizMeta = {
    'qz-react-1': { descriptionFr: 'Un contrôle rapide des fondamentaux : composants, JSX et état.', descriptionAr: 'مراجعة سريعة للأساسيات: المكونات وJSX والحالة.', timeLimitMin: 15, maxAttempts: 3 },
    'qz-react-2': { descriptionFr: 'Vérifiez votre maîtrise des props, du state et des événements.', descriptionAr: 'تحقق من إتقانك للخصائص والحالة والأحداث.', timeLimitMin: 20, maxAttempts: 3 },
    'qz-ux': { descriptionFr: 'Validez les principes de hiérarchie, d’espace et de prototypage.', descriptionAr: 'تحقق من مبادئ التسلسل والمساحات والنماذج الأولية.', timeLimitMin: 12, maxAttempts: 0 },
    'qz-marketing': { descriptionFr: 'Un quiz court pour ancrer les bases de l’acquisition.', descriptionAr: 'اختبار قصير لترسيخ أساسيات جذب العملاء.', timeLimitMin: 10, maxAttempts: 0 },
    'qz-python': { descriptionFr: 'Testez vos premiers réflexes Python.', descriptionAr: 'اختبر أولى مهاراتك في بايثون.', timeLimitMin: 12, maxAttempts: 3 },
    'qz-git': { descriptionFr: 'Commits, branches et collaboration GitHub.', descriptionAr: 'الالتزامات والفروع والتعاون على GitHub.', timeLimitMin: 15, maxAttempts: 2 },
    'qz-langue': { descriptionFr: 'اختبار قصير حول التحيات والأساسيات.', descriptionAr: 'اختبار قصير حول التحيات والأساسيات.', timeLimitMin: 10, maxAttempts: 0 },
  }
  quizzes.forEach((quiz) => Object.assign(quiz, { descriptionFr: '', descriptionAr: '', timeLimitMin: 0, maxAttempts: 0 }, quizMeta[quiz.id]))

  const reviews = [
    { id: 'rev-1', courseId: 'crs-nour-react', learnerId: 'u-l1', rating: 5, titleFr: 'Clair et très concret', titleAr: 'واضح وعملي جداً', commentFr: 'Les explications sont progressives et les exemples sont directement réutilisables. Le quiz après chaque module aide vraiment à retenir.', commentAr: 'الشروحات تدريجية والأمثلة قابلة لإعادة الاستخدام مباشرة. الاختبار بعد كل وحدة يساعد على التذكر.', createdAt: at(-5), trainerReplyFr: 'Merci Amina ! Continue avec le projet final, c’est là que tout se met en place.' },
    { id: 'rev-2', courseId: 'crs-nour-react', learnerId: 'u-l3', rating: 4, titleFr: 'Bon rythme, contenu solide', titleAr: 'وتيرة جيدة ومحتوى متين', commentFr: 'J’aurais aimé un peu plus d’exercices sur les hooks, mais le parcours est très bien structuré.', commentAr: 'كنت أتمنى تمارين أكثر عن الـ hooks، لكن المسار منظم جداً.', createdAt: at(-8) },
    { id: 'rev-3', courseId: 'crs-nour-react', learnerId: 'u-l2', rating: 5, titleFr: 'Enfin un cours qui explique le pourquoi', titleAr: 'أخيراً دورة تشرح السبب', commentFr: 'On ne se contente pas de copier du code : on comprend les décisions. Les supports PDF sont un vrai plus.', commentAr: 'لا نكتفي بنسخ الكود بل نفهم القرارات. ملفات PDF إضافة حقيقية.', createdAt: at(-10) },
    { id: 'rev-4', courseId: 'crs-nour-ux', learnerId: 'u-l6', rating: 5, titleFr: 'Un déclic pour mes projets', titleAr: 'نقطة تحول لمشاريعي', commentFr: 'La partie sur les parcours utilisateurs a complètement changé ma façon de concevoir mes écrans.', commentAr: 'جزء مسارات المستخدم غيّر تماماً طريقة تصميمي للشاشات.', createdAt: at(-4) },
    { id: 'rev-5', courseId: 'crs-nour-ux', learnerId: 'u-l1', rating: 4, titleFr: 'Pratique et bien illustré', titleAr: 'عملي ومصور جيداً', commentFr: 'Les checklists sont très utiles. J’aurais aimé plus d’exemples en arabe.', commentAr: 'قوائم التحقق مفيدة جداً. كنت أتمنى أمثلة أكثر بالعربية.', createdAt: at(-2) },
    { id: 'rev-6', courseId: 'crs-nour-marketing', learnerId: 'u-l1', rating: 5, titleFr: 'Directement applicable', titleAr: 'قابل للتطبيق مباشرة', commentFr: 'Le plan sur 30 jours m’a donné une structure claire. Gratuit et pourtant très complet.', commentAr: 'خطة الثلاثين يوماً منحتني هيكلاً واضحاً. مجاني لكن شامل جداً.', createdAt: at(-6) },
    { id: 'rev-7', courseId: 'crs-nour-marketing', learnerId: 'u-l3', rating: 4, titleFr: 'Bon point de départ', titleAr: 'بداية جيدة', commentFr: 'Les exemples sont adaptés au marché algérien, ce qui change tout.', commentAr: 'الأمثلة مناسبة للسوق الجزائري، وهذا يغير كل شيء.', createdAt: at(-3) },
    { id: 'rev-8', courseId: 'crs-code-python', learnerId: 'u-l3', rating: 5, titleFr: 'Parfait pour débuter', titleAr: 'مثالي للمبتدئين', commentFr: 'Je n’avais jamais codé et j’ai réussi à écrire mes premiers programmes sans me sentir perdue.', commentAr: 'لم أبرمج من قبل ونجحت في كتابة أول برامجي دون أن أشعر بالضياع.', createdAt: at(-7) },
    { id: 'rev-9', courseId: 'crs-code-python', learnerId: 'u-l7', rating: 4, titleFr: 'Progression douce', titleAr: 'تدرج سلس', commentFr: 'Les exercices corrigés sont bien pensés. Un peu court, mais excellent pour commencer.', commentAr: 'التمارين المصححة مدروسة. قصير نسبياً لكن ممتاز للبداية.', createdAt: at(-4) },
    { id: 'rev-10', courseId: 'crs-code-git', learnerId: 'u-l8', rating: 4, titleFr: 'Les bases enfin claires', titleAr: 'أساسيات واضحة أخيراً', commentFr: 'Les schémas sur les branches m’ont beaucoup aidé. La partie GitHub pourrait être plus détaillée.', commentAr: 'المخططات الخاصة بالفروع ساعدتني كثيراً. جزء GitHub يحتاج تفصيلاً أكثر.', createdAt: at(-11) },
    { id: 'rev-11', courseId: 'crs-langue-fr', learnerId: 'u-l5', rating: 5, titleFr: 'أسلوب بسيط ومشجع', titleAr: 'أسلوب بسيط ومشجع', commentFr: 'Les vidéos courtes sont parfaites pour réviser. Je me sens plus à l’aise pour parler.', commentAr: 'الفيديوهات القصيرة ممتازة للمراجعة. أصبحت أكثر ثقة في التحدث.', createdAt: at(-5) },
  ]

  const enrollments = [
    { id: 'enr-1', courseId: 'crs-nour-react', schoolId: 's-nour', learnerId: 'u-l1', status: 'active', source: 'online', enrolledAt: at(-18), updatedAt: at(-18) },
    { id: 'enr-2', courseId: 'crs-nour-marketing', schoolId: 's-nour', learnerId: 'u-l1', status: 'active', source: 'free', enrolledAt: at(-15), updatedAt: at(-15) },
    { id: 'enr-3', courseId: 'crs-nour-react', schoolId: 's-nour', learnerId: 'u-l2', status: 'active', source: 'manual', enrolledAt: at(-16), updatedAt: at(-15) },
    { id: 'enr-4', courseId: 'crs-nour-ux', schoolId: 's-nour', learnerId: 'u-l2', status: 'pending', source: 'manual', enrolledAt: at(-1), updatedAt: at(-1) },
    { id: 'enr-5', courseId: 'crs-nour-react', schoolId: 's-nour', learnerId: 'u-l3', status: 'active', source: 'online', enrolledAt: at(-12), updatedAt: at(-12) },
    { id: 'enr-6', courseId: 'crs-code-python', schoolId: 's-code', learnerId: 'u-l3', status: 'active', source: 'free', enrolledAt: at(-10), updatedAt: at(-10) },
    { id: 'enr-7', courseId: 'crs-code-git', schoolId: 's-code', learnerId: 'u-l4', status: 'pending', source: 'manual', enrolledAt: at(-2), updatedAt: at(-2) },
    { id: 'enr-8', courseId: 'crs-langue-fr', schoolId: 's-langue', learnerId: 'u-l5', status: 'active', source: 'manual', enrolledAt: at(-9), updatedAt: at(-8) },
    { id: 'enr-9', courseId: 'crs-nour-ux', schoolId: 's-nour', learnerId: 'u-l6', status: 'active', source: 'online', enrolledAt: at(-7), updatedAt: at(-7) },
    { id: 'enr-10', courseId: 'crs-nour-marketing', schoolId: 's-nour', learnerId: 'u-l7', status: 'active', source: 'free', enrolledAt: at(-6), updatedAt: at(-6) },
    { id: 'enr-11', courseId: 'crs-code-python', schoolId: 's-code', learnerId: 'u-l7', status: 'active', source: 'free', enrolledAt: at(-5), updatedAt: at(-5) },
    { id: 'enr-12', courseId: 'crs-code-git', schoolId: 's-code', learnerId: 'u-l8', status: 'suspended', source: 'online', enrolledAt: at(-14), updatedAt: at(-6) },
    { id: 'enr-13', courseId: 'crs-nour-ux', schoolId: 's-nour', learnerId: 'u-l1', status: 'active', source: 'manual', enrolledAt: at(-4), updatedAt: at(-3) },
    { id: 'enr-14', courseId: 'crs-nour-marketing', schoolId: 's-nour', learnerId: 'u-l3', status: 'active', source: 'free', enrolledAt: at(-3), updatedAt: at(-3) },
  ]

  const coursePayments = [
    { id: 'cpy-1', enrollmentId: 'enr-1', courseId: 'crs-nour-react', schoolId: 's-nour', learnerId: 'u-l1', amount: 8900, method: 'online', provider: 'cib', status: 'validated', reference: 'CHG-88921', proofName: null, proofDataUrl: null, submittedAt: at(-18), reviewedAt: at(-18), rejectionReason: null, refundedAt: null },
    { id: 'cpy-2', enrollmentId: 'enr-3', courseId: 'crs-nour-react', schoolId: 's-nour', learnerId: 'u-l2', amount: 8900, method: 'manual', provider: 'ccp', status: 'validated', reference: 'CPT-2026-1184', proofName: 'recu-ccp-karim.jpg', proofDataUrl: null, submittedAt: at(-16), reviewedAt: at(-15), rejectionReason: null, refundedAt: null },
    { id: 'cpy-3', enrollmentId: 'enr-5', courseId: 'crs-nour-react', schoolId: 's-nour', learnerId: 'u-l3', amount: 8900, method: 'online', provider: 'edahabia', status: 'validated', reference: 'CHG-89002', proofName: null, proofDataUrl: null, submittedAt: at(-12), reviewedAt: at(-12), rejectionReason: null, refundedAt: null },
    { id: 'cpy-4', enrollmentId: 'enr-4', courseId: 'crs-nour-ux', schoolId: 's-nour', learnerId: 'u-l2', amount: 6500, method: 'manual', provider: 'baridimob', status: 'pending', reference: 'BM-55120', proofName: 'preuve-baridimob-karim.jpg', proofDataUrl: null, submittedAt: at(-1), reviewedAt: null, rejectionReason: null, refundedAt: null },
    { id: 'cpy-5', enrollmentId: 'enr-7', courseId: 'crs-code-git', schoolId: 's-code', learnerId: 'u-l4', amount: 3900, method: 'manual', provider: 'ccp', status: 'pending', reference: 'CPT-2026-2231', proofName: 'recu-git-mehdi.pdf', proofDataUrl: null, submittedAt: at(-2), reviewedAt: null, rejectionReason: null, refundedAt: null },
    { id: 'cpy-6', enrollmentId: 'enr-8', courseId: 'crs-langue-fr', schoolId: 's-langue', learnerId: 'u-l5', amount: 5500, method: 'manual', provider: 'ccp', status: 'validated', reference: 'CPT-2026-3344', proofName: 'recu-sara.jpg', proofDataUrl: null, submittedAt: at(-9), reviewedAt: at(-8), rejectionReason: null, refundedAt: null },
    { id: 'cpy-7', enrollmentId: 'enr-9', courseId: 'crs-nour-ux', schoolId: 's-nour', learnerId: 'u-l6', amount: 6500, method: 'online', provider: 'cib', status: 'validated', reference: 'CHG-89120', proofName: null, proofDataUrl: null, submittedAt: at(-7), reviewedAt: at(-7), rejectionReason: null, refundedAt: null },
    { id: 'cpy-8', enrollmentId: 'enr-12', courseId: 'crs-code-git', schoolId: 's-code', learnerId: 'u-l8', amount: 3900, method: 'online', provider: 'edahabia', status: 'refunded', reference: 'CHG-88990', proofName: null, proofDataUrl: null, submittedAt: at(-14), reviewedAt: at(-14), rejectionReason: null, refundedAt: at(-6) },
    { id: 'cpy-9', enrollmentId: 'enr-13', courseId: 'crs-nour-ux', schoolId: 's-nour', learnerId: 'u-l1', amount: 6500, method: 'manual', provider: 'ccp', status: 'validated', reference: 'CPT-2026-5567', proofName: 'recu-ux-amina.pdf', proofDataUrl: null, submittedAt: at(-4), reviewedAt: at(-3), rejectionReason: null, refundedAt: null },
  ]

  const lessonProgress = [
    { id: 'lpg-1', learnerId: 'u-l1', courseId: 'crs-nour-react', lessonId: 'les-nr-1', completed: true, completedAt: at(-17), videoPosition: 0 },
    { id: 'lpg-2', learnerId: 'u-l1', courseId: 'crs-nour-react', lessonId: 'les-nr-2', completed: true, completedAt: at(-16), videoPosition: 0 },
    { id: 'lpg-3', learnerId: 'u-l1', courseId: 'crs-nour-react', lessonId: 'les-nr-3', completed: true, completedAt: at(-14), videoPosition: 0 },
    { id: 'lpg-4', learnerId: 'u-l1', courseId: 'crs-nour-react', lessonId: 'les-nr-4', completed: false, completedAt: null, videoPosition: 0 },
    { id: 'lpg-5', learnerId: 'u-l1', courseId: 'crs-nour-marketing', lessonId: 'les-nm-1', completed: true, completedAt: at(-13), videoPosition: 0 },
    { id: 'lpg-6', learnerId: 'u-l1', courseId: 'crs-nour-ux', lessonId: 'les-nu-1', completed: true, completedAt: at(-2), videoPosition: 0 },
    { id: 'lpg-7', learnerId: 'u-l2', courseId: 'crs-nour-react', lessonId: 'les-nr-1', completed: true, completedAt: at(-15), videoPosition: 0 },
    { id: 'lpg-8', learnerId: 'u-l3', courseId: 'crs-nour-react', lessonId: 'les-nr-1', completed: true, completedAt: at(-11), videoPosition: 0 },
    { id: 'lpg-9', learnerId: 'u-l3', courseId: 'crs-nour-react', lessonId: 'les-nr-2', completed: true, completedAt: at(-10), videoPosition: 0 },
    { id: 'lpg-10', learnerId: 'u-l3', courseId: 'crs-nour-react', lessonId: 'les-nr-3', completed: true, completedAt: at(-9), videoPosition: 0 },
    { id: 'lpg-11', learnerId: 'u-l3', courseId: 'crs-nour-react', lessonId: 'les-nr-4', completed: true, completedAt: at(-8), videoPosition: 0 },
    { id: 'lpg-12', learnerId: 'u-l3', courseId: 'crs-code-python', lessonId: 'les-cp-1', completed: true, completedAt: at(-7), videoPosition: 0 },
    { id: 'lpg-13', learnerId: 'u-l5', courseId: 'crs-langue-fr', lessonId: 'les-lf-1', completed: true, completedAt: at(-6), videoPosition: 0 },
    { id: 'lpg-14', learnerId: 'u-l6', courseId: 'crs-nour-ux', lessonId: 'les-nu-1', completed: true, completedAt: at(-6), videoPosition: 0 },
    { id: 'lpg-15', learnerId: 'u-l6', courseId: 'crs-nour-ux', lessonId: 'les-nu-2', completed: true, completedAt: at(-5), videoPosition: 0 },
    { id: 'lpg-16', learnerId: 'u-l7', courseId: 'crs-nour-marketing', lessonId: 'les-nm-1', completed: true, completedAt: at(-5), videoPosition: 0 },
    { id: 'lpg-17', learnerId: 'u-l7', courseId: 'crs-code-python', lessonId: 'les-cp-1', completed: true, completedAt: at(-4), videoPosition: 0 },
    { id: 'lpg-18', learnerId: 'u-l8', courseId: 'crs-code-git', lessonId: 'les-cg-1', completed: true, completedAt: at(-12), videoPosition: 0 },
  ]

  const quizAttempts = [
    { id: 'att-1', quizId: 'qz-react-1', courseId: 'crs-nour-react', lessonId: 'les-nr-3', learnerId: 'u-l1', score: 7, total: 7, percentage: 100, passed: true, answers: { r1q1: 'r1q1a', r1q2: 'r1q2a', r1q3: ['r1q3a', 'r1q3b', 'r1q3c'], r1q4: 'r1q4a' }, startedAt: at(-14, 18, 10), completedAt: at(-14, 18, 24) },
    { id: 'att-2', quizId: 'qz-react-1', courseId: 'crs-nour-react', lessonId: 'les-nr-3', learnerId: 'u-l3', score: 5, total: 7, percentage: 71, passed: true, answers: { r1q1: 'r1q1a', r1q2: 'r1q2b', r1q3: ['r1q3a', 'r1q3b'], r1q4: 'r1q4a' }, startedAt: at(-9, 20, 0), completedAt: at(-9, 20, 15) },
    { id: 'att-3', quizId: 'qz-react-1', courseId: 'crs-nour-react', lessonId: 'les-nr-3', learnerId: 'u-l2', score: 3, total: 7, percentage: 43, passed: false, answers: { r1q1: 'r1q1b', r1q2: 'r1q2a', r1q3: ['r1q3a'], r1q4: 'r1q4a' }, startedAt: at(-13, 19, 0), completedAt: at(-13, 19, 18) },
    { id: 'att-4', quizId: 'qz-ux', courseId: 'crs-nour-ux', lessonId: 'les-nu-4', learnerId: 'u-l6', score: 5, total: 5, percentage: 100, passed: true, answers: { uxq1: 'uxq1a', uxq2: 'uxq2b', uxq3: ['uxq3a', 'uxq3b'] }, startedAt: at(-4, 17, 30), completedAt: at(-4, 17, 45) },
  ]

  const announcements = [
    { id: 'ann-1', schoolId: 's-nour', courseId: 'crs-nour-react', title: 'Session live jeudi : Q&A React', content: 'Nous nous retrouvons jeudi à 18:00 pour une session de questions-réponses sur les composants et les hooks. Préparez vos questions !', audience: 'course', authorId: 'u-t1', status: 'published', publishedAt: at(-2), createdAt: at(-2), readBy: ['u-l3'] },
    { id: 'ann-2', schoolId: 's-nour', courseId: null, title: 'Bienvenue sur Académie Nour', content: 'Notre nouvelle école en ligne est ouverte. Découvrez les formations disponibles et n’hésitez pas à nous écrire pour toute question.', audience: 'all', authorId: 'u-t1', status: 'published', publishedAt: at(-20), createdAt: at(-20), readBy: ['u-l1', 'u-l2'] },
    { id: 'ann-3', schoolId: 's-nour', courseId: 'crs-nour-ux', title: 'Nouveau support de cours disponible', content: 'Une checklist de prototype a été ajoutée au module « Mettre en pratique ». Bon travail à tous !', audience: 'course', authorId: 'u-t1', status: 'published', publishedAt: at(-1), createdAt: at(-1), readBy: [] },
    { id: 'ann-4', schoolId: 's-nour', courseId: null, title: 'Prochainement : atelier portfolio', content: 'Un atelier gratuit pour construire votre portfolio sera annoncé prochainement.', audience: 'all', authorId: 'u-t1', status: 'draft', publishedAt: null, createdAt: at(-1), readBy: [] },
    { id: 'ann-5', schoolId: 's-code', courseId: 'crs-code-python', title: 'Mise à jour du cours Python', content: 'Deux exercices supplémentaires ont été ajoutés au module des boucles. Pensez à télécharger la nouvelle archive.', audience: 'course', authorId: 'u-t2', status: 'published', publishedAt: at(-3), createdAt: at(-3), readBy: ['u-l3'] },
    { id: 'ann-6', schoolId: 's-langue', courseId: null, title: 'مرحباً بكم في لانغ بلوس', content: 'يسعدنا انضمامكم إلى مدرستنا. ستجدون هنا الدورات والإعلانات والمواعيد المهمة.', audience: 'all', authorId: 'u-t3', status: 'published', publishedAt: at(-4), createdAt: at(-4), readBy: ['u-l5'] },
  ]

  const comments = [
    { id: 'cmt-1', lessonId: 'les-nr-1', courseId: 'crs-nour-react', schoolId: 's-nour', userId: 'u-l1', parentId: null, content: 'Bonjour Yacine, merci pour cette introduction claire. Hâte de commencer les exercices !', status: 'visible', reported: false, createdAt: at(-6, 19, 12) },
    { id: 'cmt-2', lessonId: 'les-nr-1', courseId: 'crs-nour-react', schoolId: 's-nour', userId: 'u-t1', parentId: 'cmt-1', content: 'Merci Amina ! N’hésite pas à partager tes questions au fil des leçons.', status: 'visible', reported: false, createdAt: at(-6, 20, 5) },
    { id: 'cmt-3', lessonId: 'les-nr-4', courseId: 'crs-nour-react', schoolId: 's-nour', userId: 'u-l3', parentId: null, content: 'Le schéma aide beaucoup. Est-ce qu’on peut réutiliser un composant dans plusieurs pages ?', status: 'reported', reported: true, createdAt: at(-2, 14, 22) },
    { id: 'cmt-4', lessonId: 'les-nr-1', courseId: 'crs-nour-react', schoolId: 's-nour', userId: 'u-l2', parentId: null, content: 'Introduction très motivante. Je commence ce soir.', status: 'visible', reported: false, createdAt: at(-4, 18, 40) },
    { id: 'cmt-5', lessonId: 'les-nr-5', courseId: 'crs-nour-react', schoolId: 's-nour', userId: 'u-l1', parentId: null, content: 'Petite question sur les événements : faut-il toujours remonter l’état au parent ?', status: 'visible', reported: false, createdAt: at(-1, 9, 15) },
    { id: 'cmt-6', lessonId: 'les-cp-1', courseId: 'crs-code-python', schoolId: 's-code', userId: 'u-l3', parentId: null, content: 'Premier programme réussi, merci Imane !', status: 'visible', reported: false, createdAt: at(-3, 21, 0) },
    { id: 'cmt-7', lessonId: 'les-nu-1', courseId: 'crs-nour-ux', schoolId: 's-nour', userId: 'u-l6', parentId: null, content: 'Le parcours utilisateur est vraiment un déclic pour moi.', status: 'visible', reported: false, createdAt: at(-2, 10, 30) },
    { id: 'cmt-8', lessonId: 'les-nr-4', courseId: 'crs-nour-react', schoolId: 's-nour', userId: 'u-l1', parentId: 'cmt-3', content: 'Oui, c’est même l’intérêt principal des composants réutilisables.', status: 'visible', reported: false, createdAt: at(-2, 15, 0) },
  ]

  const events = [
    { id: 'evt-1', schoolId: 's-nour', courseId: 'crs-nour-react', title: 'Live Q&A — Composants React', description: 'Une session ouverte pour revoir les composants, les props et les hooks. Apportez vos questions.', startAt: at(2, 18, 0), durationMin: 60, type: 'live', provider: 'jitsi', joinUrl: 'https://meet.jit.si/tiwanza-nour-react', status: 'scheduled', createdAt: at(-2) },
    { id: 'evt-2', schoolId: 's-nour', courseId: 'crs-nour-ux', title: 'Rendu du projet fil rouge', description: 'Déposez votre prototype et une courte note expliquant vos choix de design.', startAt: at(6, 23, 59), durationMin: 30, type: 'deadline', provider: 'none', joinUrl: '', status: 'scheduled', createdAt: at(-5) },
    { id: 'evt-3', schoolId: 's-nour', courseId: 'crs-nour-react', title: 'Atelier : déployer son application', description: 'Atelier pratique en visioconférence pour préparer la mise en ligne.', startAt: at(10, 17, 30), durationMin: 90, type: 'live', provider: 'external', joinUrl: 'https://meet.google.com/tiw-demo-nour', status: 'scheduled', createdAt: at(-1) },
    { id: 'evt-4', schoolId: 's-nour', courseId: 'crs-nour-react', title: 'Live d’ouverture de la formation', description: 'Présentation du parcours et des objectifs.', startAt: at(-8, 18, 0), durationMin: 60, type: 'live', provider: 'jitsi', joinUrl: 'https://meet.jit.si/tiwanza-nour-ouverture', status: 'past', createdAt: at(-15) },
    { id: 'evt-5', schoolId: 's-code', courseId: 'crs-code-python', title: 'Live Python — vos premiers pas', description: 'Session en direct pour coder ensemble votre premier programme.', startAt: at(1, 19, 0), durationMin: 60, type: 'live', provider: 'jitsi', joinUrl: 'https://meet.jit.si/tiwanza-code-python', status: 'scheduled', createdAt: at(-2) },
    { id: 'evt-6', schoolId: 's-langue', courseId: 'crs-langue-fr', title: 'جلسة مباشرة — نطق الحروف', description: 'جلسة تفاعلية لتدريب النطق.', startAt: at(3, 18, 30), durationMin: 45, type: 'live', provider: 'jitsi', joinUrl: 'https://meet.jit.si/tiwanza-langue-fr', status: 'scheduled', createdAt: at(-2) },
    { id: 'evt-7', schoolId: 's-nour', courseId: 'crs-nour-ux', title: 'Revue de portfolios', description: 'Session reportée à une date ultérieure.', startAt: at(4, 16, 0), durationMin: 60, type: 'event', provider: 'external', joinUrl: 'https://meet.google.com/tiw-demo-review', status: 'cancelled', createdAt: at(-3) },
    { id: 'evt-8', schoolId: 's-nour', courseId: null, title: 'Rencontre des apprenants Nour', description: 'Un moment informel pour échanger entre apprenants et formateur.', startAt: at(14, 17, 0), durationMin: 90, type: 'event', provider: 'external', joinUrl: 'https://meet.google.com/tiw-demo-rencontre', status: 'scheduled', createdAt: at(-1) },
  ]

  const supportRequests = [
    { id: 'sup-1', schoolId: 's-code', trainerId: 'u-t2', subject: 'Problème d’upload vidéo', message: 'Une vidéo reste bloquée à 80 % dans l’éditeur de leçon. Pouvez-vous vérifier ?', status: 'open', priority: 'high', createdAt: at(-2), updatedAt: at(-2) },
    { id: 'sup-2', schoolId: 's-nour', trainerId: 'u-t1', subject: 'Question sur les limites du plan Pro', message: 'Le stockage vidéo est-il mutualisé entre tous mes cours ?', status: 'pending', priority: 'normal', createdAt: at(-1), updatedAt: at(-1) },
    { id: 'sup-3', schoolId: 's-langue', trainerId: 'u-t3', subject: 'Renouvellement de l’abonnement', message: 'Mon abonnement a expiré, comment soumettre un nouveau paiement manuel ?', status: 'resolved', priority: 'normal', createdAt: at(-7), updatedAt: at(-5) },
  ]

  const activity = [
    { id: 'act-1', type: 'trainer_registered', actorId: 'u-t4', schoolId: 's-fajr', createdAt: at(-6) },
    { id: 'act-2', type: 'subscription_manual', actorId: 'u-t4', schoolId: 's-fajr', meta: { amount: 4900 }, createdAt: at(-1) },
    { id: 'act-3', type: 'course_published', actorId: 'u-t1', schoolId: 's-nour', courseId: 'crs-nour-react', createdAt: at(-40) },
    { id: 'act-4', type: 'enrollment_created', actorId: 'u-l1', schoolId: 's-nour', courseId: 'crs-nour-react', createdAt: at(-18) },
    { id: 'act-5', type: 'course_payment_validated', actorId: 'u-t1', schoolId: 's-nour', courseId: 'crs-nour-react', meta: { amount: 8900, learnerId: 'u-l1' }, createdAt: at(-15) },
    { id: 'act-6', type: 'quiz_passed', actorId: 'u-l1', schoolId: 's-nour', courseId: 'crs-nour-react', meta: { percentage: 100 }, createdAt: at(-14) },
    { id: 'act-7', type: 'course_published', actorId: 'u-t2', schoolId: 's-code', courseId: 'crs-code-python', createdAt: at(-35) },
    { id: 'act-8', type: 'subscription_paid', actorId: 'u-t1', schoolId: 's-nour', meta: { amount: 4900 }, createdAt: at(-20) },
    { id: 'act-9', type: 'comment_created', actorId: 'u-l2', schoolId: 's-nour', courseId: 'crs-nour-react', createdAt: at(-4) },
    { id: 'act-10', type: 'course_payment_pending', actorId: 'u-l2', schoolId: 's-nour', courseId: 'crs-nour-ux', meta: { amount: 6500 }, createdAt: at(-1) },
  ]

  const platformSettings = {
    platformName: 'Tiwanza',
    supportEmail: 'support@tiwanza.dz',
    timezone: 'Africa/Algiers',
    currency: 'DA',
    demoMode: true,
    methods: { online: true, manual: true, cib: true, edahabia: true },
    manualPayment: {
      ccp: '000 123 456 7 clé 89',
      baridimob: '00799999000123456789',
      bank: { name: 'BNA', agency: 'Agence Alger Centre', rib: '00123456789012345678' },
      beneficiary: 'Tiwanza SARL',
      instructionsFr: "Effectuez le virement sur le compte de Tiwanza, puis joignez une preuve de paiement (JPG, PNG ou PDF). Votre abonnement reste en attente jusqu'à validation par l'équipe Tiwanza sous 24 à 48 h.",
      instructionsAr: 'قم بالتحويل إلى حساب تيوانزا ثم أرفق إثبات الدفع (JPG أو PNG أو PDF). يبقى اشتراكك قيد الانتظار حتى تتحقق منه فرقة تيوانزا خلال 24 إلى 48 ساعة.',
      delay: '24-48 h',
    },
  }

  return {
    version: 2,
    generatedAt: nowIso(),
    users,
    schools,
    trainerProfiles,
    plans,
    subscriptions,
    subscriptionPayments,
    courses,
    sections,
    lessons,
    blocks,
    quizzes,
    enrollments,
    coursePayments,
    lessonProgress,
    quizAttempts,
    reviews,
    announcements,
    comments,
    events,
    supportRequests,
    activity,
    onboardingDrafts: {},
    platformSettings,
    session: null,
  }
}

export function migrateState(raw) {
  const seed = createSeedData()
  const mergeRows = (current = [], defaults = []) => {
    const byId = new Map(defaults.map((row) => [row.id, row]))
    return current.map((row) => ({ ...(byId.get(row.id) || {}), ...row }))
  }
  return {
    ...seed,
    ...raw,
    version: 2,
    courses: mergeRows(raw.courses, seed.courses),
    sections: mergeRows(raw.sections, seed.sections),
    lessons: mergeRows(raw.lessons, seed.lessons),
    quizzes: mergeRows(raw.quizzes, seed.quizzes),
    reviews: Array.isArray(raw.reviews) ? mergeRows(raw.reviews, seed.reviews) : seed.reviews,
  }
}

export function createDemoUser() {
  return {
    id: uid('usr'),
    name: 'Nouveau Formateur',
    email: `demo-${Date.now()}@tiwanza.dz`,
    password: 'demo1234',
    role: 'trainer',
    schoolId: null,
    language: 'fr',
    status: 'active',
    createdAt: nowIso(),
    lastActiveAt: nowIso(),
  }
}
