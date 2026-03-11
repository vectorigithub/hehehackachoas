import 'package:flutter/material.dart';
import '../models/community_models.dart';

// ── MOCK REPORTS ─────────────────────────────────────────────
// BACKEND: Replace with LigtasAPI.fetchReports() response from
//   GET /api/reports?category=all&sort=recent

final mockReports = <ReportModel>[
  ReportModel(
    id: '1',
    authorName: 'Juan Dela Cruz',
    authorInitials: 'JD',
    authorGradient: const [Color(0xFFE63946), Color(0xFFC1121F)],
    timeAgo: '5 mins ago',
    location: 'Pasay City',
    category: ReportCategory.flood,
    severity: Severity.critical,
    badgeLabel: 'Flood Watch',
    body:
        'Knee-deep flooding along Taft Avenue near DLSU. Vehicles advised to take alternate routes immediately.',
    gpsVerified: true,
    verifyCount: 124,
    verifyMax: 150,
    userVerified: true,
    commentCount: 12,
  ),
  ReportModel(
    id: '2',
    authorName: 'Maria Santos',
    authorInitials: 'MS',
    authorGradient: const [Color(0xFF3B9ED4), Color(0xFF1A6FA0)],
    timeAgo: '15 mins ago',
    location: 'Makati CBD',
    category: ReportCategory.all,
    severity: Severity.moderate,
    badgeLabel: 'Heavy Traffic',
    body:
        'Stalled truck at EDSA–Ayala intersection. Traffic backed up all the way to Buendia.',
    gpsVerified: false,
    verifyCount: 45,
    verifyMax: 150,
    userVerified: false,
    commentCount: 5,
  ),
  ReportModel(
    id: '3',
    authorName: 'PAGASA Official',
    authorInitials: 'PA',
    authorGradient: const [Color(0xFF1A7FC1), Color(0xFF1A6FA0)],
    timeAgo: '30 mins ago',
    location: 'Metro Manila',
    category: ReportCategory.typhoon,
    severity: Severity.info,
    badgeLabel: 'Official',
    body:
        'Typhoon Signal No. 2 raised over Metro Manila and nearby provinces. Prepare emergency kits and monitor updates.',
    gpsVerified: false,
    verifyCount: 341,
    verifyMax: 9999,
    userVerified: true,
    commentCount: 89,
  ),
  ReportModel(
    id: '4',
    authorName: 'Ramon Cruz',
    authorInitials: 'RC',
    authorGradient: const [Color(0xFFC95B18), Color(0xFFC45E1E)],
    timeAgo: '1 hr ago',
    location: 'Tondo, Manila',
    category: ReportCategory.fire,
    severity: Severity.high,
    badgeLabel: 'Fire Alert',
    body:
        'House fire spreading near Delpan St. BFP units on scene. Residents advised to evacuate the surrounding area.',
    gpsVerified: false,
    verifyCount: 57,
    verifyMax: 150,
    userVerified: false,
    commentCount: 8,
  ),
];

// ── MOCK NEWS ────────────────────────────────────────────────
// BACKEND: Replace with LigtasAPI.fetchNews() → GET /api/news

final mockNews = <NewsModel>[
  const NewsModel(
    id: 'n1',
    source: 'PAGASA',
    sourceType: NewsSourceType.alert,
    title: 'Signal No. 2 raised — Metro Manila & nearby provinces',
    timeAgo: '10m',
  ),
  const NewsModel(
    id: 'n2',
    source: "QC Gov't",
    sourceType: NewsSourceType.gov,
    title: '12 evacuation centers opened; capacity 8,000 residents',
    timeAgo: '2h',
  ),
  const NewsModel(
    id: 'n3',
    source: 'MMDA',
    sourceType: NewsSourceType.official,
    title: 'Marikina River at Level 3 — avoid riverside barangays',
    timeAgo: '3h',
  ),
  const NewsModel(
    id: 'n4',
    source: 'NDRRMC',
    sourceType: NewsSourceType.gov,
    title: '7-day flood forecast updated — improving by Thursday',
    timeAgo: '6h',
  ),
];

// ── MOCK FORECAST ────────────────────────────────────────────
// BACKEND: Replace with LigtasAPI.fetchForecast() → GET /api/forecast

const mockForecastToday = ForecastToday(
  condition: 'Heavy Rain',
  warning: 'Flood Warning Active',
  tempC: 24,
  feelsLikeC: 26,
  icon: '🌧️',
);

final mockForecastDays = <ForecastDay>[
  const ForecastDay(label: 'Today', icon: '🌧️', tempC: 24, risk: RiskLevel.high),
  const ForecastDay(label: 'Tue',   icon: '⛈️',  tempC: 22, risk: RiskLevel.high),
  const ForecastDay(label: 'Wed',   icon: '🌦️',  tempC: 25, risk: RiskLevel.med),
  const ForecastDay(label: 'Thu',   icon: '🌤️',  tempC: 28, risk: RiskLevel.low),
  const ForecastDay(label: 'Fri',   icon: '☀️',  tempC: 30, risk: RiskLevel.safe),
];

// ── MOCK NOTIFICATIONS ───────────────────────────────────────
// BACKEND: Replace with LigtasAPI.fetchNotifications() → GET /api/notifications?user_id=<id>

final mockNotifications = <NotifModel>[
  NotifModel(
    id: '1',
    type: NotifType.flood,
    body:
        'Flood Alert — Marikina River reached Level 3. Evacuation advisories for riverside barangays.',
    timeAgo: 'Just now',
    source: 'MMDA Official',
    unread: true,
    actionLabel: 'View on Map',
    avatarText: '🌊',
    avatarGradient: const [Color(0xFF2563EB), Color(0xFF1A49B0)],
    timePeriod: NotifTimePeriod.today,
  ),
  NotifModel(
    id: '2',
    type: NotifType.verify,
    body:
        'Your report about flooding on Taft Ave was verified by 50+ community members.',
    timeAgo: '3 minutes ago',
    unread: true,
    avatarText: 'JD',
    avatarGradient: const [Color(0xFF22C97C), Color(0xFF1A9E60)],
    timePeriod: NotifTimePeriod.today,
  ),
  NotifModel(
    id: '3',
    type: NotifType.typhoon,
    body:
        'PAGASA raised Typhoon Signal No. 2 in your area. Stay indoors and monitor updates.',
    timeAgo: '20 minutes ago',
    source: 'Official',
    unread: true,
    actionLabel: 'Read Advisory',
    avatarText: '🌀',
    avatarGradient: const [Color(0xFF6B7FD4), Color(0xFF4B5BBF)],
    timePeriod: NotifTimePeriod.today,
  ),
  NotifModel(
    id: '4',
    type: NotifType.verify,
    body: 'Ana R. and 12 others upvoted your flood report on Marcos Highway.',
    timeAgo: '1 hour ago',
    unread: false,
    avatarText: 'AR',
    avatarGradient: const [Color(0xFFE07A5F), Color(0xFFC45A3E)],
    timePeriod: NotifTimePeriod.today,
  ),
  NotifModel(
    id: '5',
    type: NotifType.fire,
    body: 'New fire report near your saved location in Tondo, Manila.',
    timeAgo: '2 hours ago',
    unread: false,
    actionLabel: 'Verify Report',
    avatarText: '🔥',
    avatarGradient: const [Color(0xFFE87E3E), Color(0xFFC45E1E)],
    timePeriod: NotifTimePeriod.today,
  ),
  NotifModel(
    id: '6',
    type: NotifType.forecast,
    body:
        '7-Day Forecast updated — Weather improving by Thursday. Flood risk drops to LOW.',
    timeAgo: 'Yesterday, 6:00 PM',
    unread: false,
    avatarText: '📡',
    avatarGradient: const [Color(0xFF1EC8C8), Color(0xFF0FA0A0)],
    timePeriod: NotifTimePeriod.yesterday,
  ),
  NotifModel(
    id: '7',
    type: NotifType.verify,
    body: 'Ramon C. commented: "This is accurate, same situation here."',
    timeAgo: 'Yesterday, 11:22 AM',
    unread: false,
    avatarText: 'RC',
    avatarGradient: const [Color(0xFF457B9D), Color(0xFF2D5F7E)],
    timePeriod: NotifTimePeriod.yesterday,
  ),
];
