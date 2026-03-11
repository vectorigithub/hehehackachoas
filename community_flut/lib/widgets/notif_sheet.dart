import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../models/community_models.dart';

// Mirrors .notif-sheet from community.html
// BACKEND: data from LigtasAPI.fetchNotifications() → GET /api/notifications?user_id=<id>

class NotifSheet extends StatefulWidget {
  final List<NotifModel> notifications;
  final int unreadCount;
  final ValueChanged<String> onMarkRead; // notif id
  final VoidCallback onClose;

  const NotifSheet({
    super.key,
    required this.notifications,
    required this.unreadCount,
    required this.onMarkRead,
    required this.onClose,
  });

  @override
  State<NotifSheet> createState() => _NotifSheetState();
}

class _NotifSheetState extends State<NotifSheet> {
  int _tabIndex = 0;
  final _tabs = ['All', 'Reports', 'Alerts', 'Forecast'];

  List<NotifModel> get _filtered {
    if (_tabIndex == 0) return widget.notifications;
    final typeFilter = {
      1: [NotifType.flood, NotifType.verify, NotifType.crime],
      2: [NotifType.flood, NotifType.typhoon, NotifType.fire],
      3: [NotifType.forecast],
    }[_tabIndex]!;
    return widget.notifications.where((n) => typeFilter.contains(n.type)).toList();
  }

  @override
  Widget build(BuildContext context) {
    final byPeriod = <NotifTimePeriod, List<NotifModel>>{};
    for (final n in _filtered) {
      byPeriod.putIfAbsent(n.timePeriod, () => []).add(n);
    }

    return Container(
      decoration: const BoxDecoration(
        color: AppColors.bg2,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        border: Border(top: BorderSide(color: AppColors.border2)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle
          Container(
            width: 36, height: 4,
            margin: const EdgeInsets.only(top: 12),
            decoration: BoxDecoration(
              color: AppColors.tealDim,
              borderRadius: BorderRadius.circular(99),
            ),
          ),
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 10),
            child: Row(
              children: [
                const Text(
                  'Notifications',
                  style: TextStyle(
                    fontFamily: 'Plus Jakarta Sans',
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: AppColors.text,
                  ),
                ),
                const Spacer(),
                GestureDetector(
                  onTap: widget.onClose,
                  child: Container(
                    width: 30, height: 30,
                    decoration: BoxDecoration(
                      color: AppColors.tealDim,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.close, size: 18, color: AppColors.text2),
                  ),
                ),
              ],
            ),
          ),
          // Tabs
          Container(
            decoration: const BoxDecoration(
              border: Border(bottom: BorderSide(color: AppColors.border)),
            ),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 10),
              child: Row(
                children: List.generate(_tabs.length, (i) {
                  final active = i == _tabIndex;
                  return GestureDetector(
                    onTap: () => setState(() => _tabIndex = i),
                    child: Container(
                      margin: const EdgeInsets.only(right: 6),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
                      decoration: BoxDecoration(
                        color: active ? AppColors.teal : Colors.transparent,
                        borderRadius: BorderRadius.circular(999),
                        border: Border.all(
                          color: active ? AppColors.teal : AppColors.border,
                        ),
                      ),
                      child: Text(
                        _tabs[i],
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: active ? Colors.white : AppColors.text2,
                        ),
                      ),
                    ),
                  );
                }),
              ),
            ),
          ),
          // List
          ConstrainedBox(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.of(context).size.height * 0.55,
            ),
            child: ListView(
              padding: const EdgeInsets.only(top: 4, bottom: 20),
              children: [
                if (byPeriod.containsKey(NotifTimePeriod.today)) ...[
                  _GroupLabel(label: 'Today'),
                  ...byPeriod[NotifTimePeriod.today]!.map(_buildItem),
                ],
                if (byPeriod.containsKey(NotifTimePeriod.yesterday)) ...[
                  _Divider(),
                  _GroupLabel(label: 'Yesterday'),
                  ...byPeriod[NotifTimePeriod.yesterday]!.map(_buildItem),
                ],
                if (byPeriod.containsKey(NotifTimePeriod.earlier)) ...[
                  _Divider(),
                  _GroupLabel(label: 'Earlier'),
                  ...byPeriod[NotifTimePeriod.earlier]!.map(_buildItem),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildItem(NotifModel n) {
    return GestureDetector(
      onTap: () {
        if (n.unread) widget.onMarkRead(n.id);
        // BACKEND: POST /api/notifications/${n.id}/read
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 11),
        decoration: BoxDecoration(
          color: n.unread
              ? AppColors.teal.withOpacity(0.06)
              : Colors.transparent,
          border: Border(
            left: BorderSide(
              color: n.unread ? AppColors.teal : Colors.transparent,
              width: 3,
            ),
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Avatar + badge
            SizedBox(
              width: 44,
              height: 44,
              child: Stack(
                children: [
                  Container(
                    width: 44, height: 44,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: n.avatarGradient,
                      ),
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(
                        n.avatarText,
                        style: const TextStyle(
                          fontSize: 17, fontWeight: FontWeight.w800, color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: -2, right: -2,
                    child: Container(
                      width: 18, height: 18,
                      decoration: BoxDecoration(
                        color: _badgeColor(n.type),
                        shape: BoxShape.circle,
                        border: Border.all(color: AppColors.bg2, width: 2),
                      ),
                      child: Center(
                        child: Text(
                          _badgeIcon(n.type),
                          style: const TextStyle(fontSize: 8),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    n.body,
                    style: const TextStyle(
                      fontSize: 12, height: 1.5, color: AppColors.text,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    n.source != null ? '${n.timeAgo} · ${n.source}' : n.timeAgo,
                    style: const TextStyle(fontSize: 10, color: AppColors.text3),
                  ),
                  if (n.actionLabel != null) ...[
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppColors.tealDim,
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: const Color(0x38138E8E)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.open_in_new, size: 12, color: AppColors.teal),
                          const SizedBox(width: 4),
                          Text(
                            n.actionLabel!,
                            style: const TextStyle(
                              fontSize: 10, fontWeight: FontWeight.w700,
                              color: AppColors.teal,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
            if (n.unread)
              Container(
                width: 7, height: 7, margin: const EdgeInsets.only(top: 8),
                decoration: const BoxDecoration(
                  color: AppColors.teal, shape: BoxShape.circle,
                ),
              ),
          ],
        ),
      ),
    );
  }

  Color _badgeColor(NotifType t) {
    switch (t) {
      case NotifType.flood:    return AppColors.blue;
      case NotifType.typhoon:  return const Color(0xFF6B7FD4);
      case NotifType.fire:     return AppColors.orange;
      case NotifType.verify:   return AppColors.green;
      case NotifType.forecast: return AppColors.teal;
      case NotifType.crime:    return const Color(0xFF9B72CF);
    }
  }

  String _badgeIcon(NotifType t) {
    switch (t) {
      case NotifType.flood:    return '💧';
      case NotifType.typhoon:  return '🌪';
      case NotifType.fire:     return '🔥';
      case NotifType.verify:   return '✓';
      case NotifType.forecast: return '🌤';
      case NotifType.crime:    return '🚨';
    }
  }
}

class _GroupLabel extends StatelessWidget {
  final String label;
  const _GroupLabel({required this.label});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 10, 20, 3),
      child: Text(
        label.toUpperCase(),
        style: const TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w800,
          letterSpacing: 1,
          color: AppColors.text3,
        ),
      ),
    );
  }
}

class _Divider extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      height: 1,
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 3),
      color: AppColors.border,
    );
  }
}
