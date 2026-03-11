import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../models/community_models.dart';
import '../data/mock_data.dart';
import '../widgets/bottom_nav_bar.dart';
import '../widgets/weather_hero_widget.dart';
import '../widgets/news_strip_widget.dart';
import '../widgets/report_card_widget.dart';
import '../widgets/notif_sheet.dart';

// ── COMMUNITY SCREEN ─────────────────────────────────────────
// Mirrors community.html — Safety Feed + Notification Sheet
//
// BACKEND integration points are marked with // BACKEND: comments
// throughout this file and the widget files.

class CommunityScreen extends StatefulWidget {
  /// activeNavIndex: 0=Home, 1=Community, 2=Profile
  /// Pass the current page index from your app's nav controller.
  final int activeNavIndex;
  final ValueChanged<int> onNavTap;

  const CommunityScreen({
    super.key,
    this.activeNavIndex = 1,
    required this.onNavTap,
  });

  @override
  State<CommunityScreen> createState() => _CommunityScreenState();
}

class _CommunityScreenState extends State<CommunityScreen> {
  // ── STATE ────────────────────────────────────────────────
  List<ReportModel> _reports = List.from(mockReports);
  List<NewsModel> _news = List.from(mockNews);
  List<NotifModel> _notifications = List.from(mockNotifications);
  ReportCategory _activeCategory = ReportCategory.all;
  bool _notifOpen = false;

  int get _unreadCount => _notifications.where((n) => n.unread).length;

  // ── ACTIONS ──────────────────────────────────────────────

  void _onVerifyToggled(ReportModel updated) {
    setState(() {
      final idx = _reports.indexWhere((r) => r.id == updated.id);
      if (idx >= 0) _reports[idx] = updated;
    });
  }

  void _onMarkNotifRead(String id) {
    setState(() {
      final idx = _notifications.indexWhere((n) => n.id == id);
      if (idx >= 0) _notifications[idx] = _notifications[idx].copyWith(unread: false);
    });
    // BACKEND: POST /api/notifications/${id}/read
  }

  void _onCategorySelected(ReportCategory cat) {
    setState(() => _activeCategory = cat);
    // BACKEND: LigtasAPI.fetchReports(category, 'recent')
    //   GET /api/reports?category=${cat.name}&sort=recent
  }

  List<ReportModel> get _filteredReports {
    if (_activeCategory == ReportCategory.all) return _reports;
    return _reports.where((r) => r.category == _activeCategory).toList();
  }

  // ── BUILD ────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Stack(
        children: [
          Column(
            children: [
              _buildHeader(),
              Expanded(
                child: _buildScrollArea(),
              ),
              LigtasBottomNavBar(
                activeIndex: widget.activeNavIndex,
                onTap: widget.onNavTap,
              ),
            ],
          ),
          // FAB
          Positioned(
            bottom: 72 + 10,
            right: 20,
            child: _buildFAB(),
          ),
          // Notif backdrop
          if (_notifOpen)
            GestureDetector(
              onTap: () => setState(() => _notifOpen = false),
              child: Container(
                color: const Color(0x590828322),
              ),
            ),
          // Notif sheet
          AnimatedSlide(
            offset: _notifOpen ? Offset.zero : const Offset(0, 1),
            duration: const Duration(milliseconds: 380),
            curve: Curves.easeInOut,
            child: Align(
              alignment: Alignment.bottomCenter,
              child: NotifSheet(
                notifications: _notifications,
                unreadCount: _unreadCount,
                onMarkRead: _onMarkNotifRead,
                onClose: () => setState(() => _notifOpen = false),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── HEADER ───────────────────────────────────────────────

  Widget _buildHeader() {
    return Container(
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 8,
        bottom: 12,
        left: 20,
        right: 20,
      ),
      decoration: const BoxDecoration(
        color: Color(0xF0F0FAFA),
        border: Border(bottom: BorderSide(color: AppColors.border)),
      ),
      child: Row(
        children: [
          // Menu button
          _HdrIcon(
            child: const Icon(Icons.menu, size: 20, color: AppColors.teal),
            onTap: () {}, // BACKEND: open drawer
          ),
          const Spacer(),
          // Title
          Column(
            children: const [
              Text(
                'Safety Feed',
                style: TextStyle(
                  fontFamily: 'Plus Jakarta Sans',
                  fontSize: 17,
                  fontWeight: FontWeight.w800,
                  color: AppColors.text,
                  letterSpacing: -0.3,
                ),
              ),
              Text(
                'METRO MANILA',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: AppColors.teal,
                  letterSpacing: 1.5,
                ),
              ),
            ],
          ),
          const Spacer(),
          // Bell with unread dot
          _HdrIcon(
            onTap: () => setState(() => _notifOpen = true),
            child: Stack(
              children: [
                const Icon(Icons.notifications_outlined, size: 20, color: AppColors.text),
                if (_unreadCount > 0)
                  Positioned(
                    top: 0, right: 0,
                    child: Container(
                      width: 8, height: 8,
                      decoration: BoxDecoration(
                        color: AppColors.red,
                        shape: BoxShape.circle,
                        border: Border.all(color: AppColors.bg, width: 1.5),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── SCROLL AREA ──────────────────────────────────────────

  Widget _buildScrollArea() {
    return ListView(
      padding: const EdgeInsets.only(bottom: 16),
      children: [
        // Weather hero + forecast
        WeatherHeroWidget(
          today: mockForecastToday,
          days: mockForecastDays,
        ),
        // Official news strip
        NewsStripWidget(news: _news),
        // Category pills
        _buildCategoryPills(),
        // Section header
        _buildSectionHeader(),
        // Report cards
        ..._filteredReports.map(
          (r) => ReportCardWidget(
            report: r,
            onVerifyToggled: _onVerifyToggled,
          ),
        ),
      ],
    );
  }

  Widget _buildCategoryPills() {
    final cats = [
      (ReportCategory.all,     Icons.bolt,              'All'),
      (ReportCategory.flood,   Icons.water,             'Flood'),
      (ReportCategory.typhoon, Icons.cyclone,           'Typhoon'),
      (ReportCategory.fire,    Icons.local_fire_department, 'Fire'),
      (ReportCategory.quake,   Icons.crisis_alert,      'Quake'),
      (ReportCategory.slide,   Icons.landslide,         'Slide'),
      (ReportCategory.crime,   Icons.security,          'Crime'),
    ];
    return SizedBox(
      height: 46,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
        itemCount: cats.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (ctx, i) {
          final (cat, icon, label) = cats[i];
          final isActive = _activeCategory == cat;
          return GestureDetector(
            onTap: () => _onCategorySelected(cat),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
              decoration: BoxDecoration(
                color: isActive ? AppColors.teal : AppColors.card,
                borderRadius: BorderRadius.circular(999),
                border: Border.all(
                  color: isActive ? AppColors.teal : AppColors.border,
                  width: 1.5,
                ),
              ),
              child: Row(
                children: [
                  Icon(icon, size: 14, color: isActive ? Colors.white : AppColors.text2),
                  const SizedBox(width: 5),
                  Text(
                    label,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: isActive ? Colors.white : AppColors.text2,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildSectionHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 10),
      child: Row(
        children: [
          const Text(
            'Community Reports',
            style: TextStyle(
              fontFamily: 'Plus Jakarta Sans',
              fontSize: 17,
              fontWeight: FontWeight.w800,
              color: AppColors.text,
              letterSpacing: -0.3,
            ),
          ),
          const Spacer(),
          GestureDetector(
            onTap: () {
              // BACKEND: LigtasAPI.fetchReports('all','recent')
            },
            child: const Text(
              'Recent First',
              style: TextStyle(
                fontSize: 12,
                color: AppColors.teal,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFAB() {
    return GestureDetector(
      onTap: () {
        // BACKEND: open report submission sheet
        //   calls LigtasAPI.submitReport(FormData)
        //   POST /api/reports
      },
      child: Container(
        width: 52, height: 52,
        decoration: const BoxDecoration(
          color: AppColors.teal,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(color: AppColors.tealGlow, blurRadius: 20, offset: Offset(0, 4)),
          ],
        ),
        child: const Icon(Icons.add_a_photo, color: Colors.white, size: 24),
      ),
    );
  }
}

// ── SMALL HELPER WIDGETS ─────────────────────────────────────

class _HdrIcon extends StatelessWidget {
  final Widget child;
  final VoidCallback onTap;
  const _HdrIcon({required this.child, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 38, height: 38,
        decoration: BoxDecoration(
          color: AppColors.card,
          shape: BoxShape.circle,
          border: Border.all(color: AppColors.border),
        ),
        child: Center(child: child),
      ),
    );
  }
}
