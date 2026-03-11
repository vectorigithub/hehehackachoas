// ── REPORT MODEL ────────────────────────────────────────────
// Mirrors the shape expected by LigtasUI.renderReports() in community.js
//
// BACKEND: Flask endpoint GET /api/reports?category=all&sort=recent
// returns { "reports": [ ReportModel.toJson(), ... ] }

enum Severity { critical, high, moderate, info }

enum ReportCategory { flood, typhoon, fire, quake, slide, crime, all }

class ReportModel {
  final String id;
  final String authorName;
  final String authorInitials;
  final List<Color> authorGradient; // two-stop gradient
  final String timeAgo;
  final String location;
  final ReportCategory category;
  final Severity severity;
  final String badgeLabel;
  final String body;
  final String? imageUrl;
  final bool gpsVerified;
  final int verifyCount;
  final int verifyMax;
  final bool userVerified;
  final int commentCount;

  const ReportModel({
    required this.id,
    required this.authorName,
    required this.authorInitials,
    required this.authorGradient,
    required this.timeAgo,
    required this.location,
    required this.category,
    required this.severity,
    required this.badgeLabel,
    required this.body,
    this.imageUrl,
    required this.gpsVerified,
    required this.verifyCount,
    required this.verifyMax,
    required this.userVerified,
    required this.commentCount,
  });

  ReportModel copyWith({int? verifyCount, bool? userVerified}) {
    return ReportModel(
      id: id,
      authorName: authorName,
      authorInitials: authorInitials,
      authorGradient: authorGradient,
      timeAgo: timeAgo,
      location: location,
      category: category,
      severity: severity,
      badgeLabel: badgeLabel,
      body: body,
      imageUrl: imageUrl,
      gpsVerified: gpsVerified,
      verifyCount: verifyCount ?? this.verifyCount,
      verifyMax: verifyMax,
      userVerified: userVerified ?? this.userVerified,
      commentCount: commentCount,
    );
  }
}

// ── NEWS MODEL ───────────────────────────────────────────────
// BACKEND: Flask endpoint GET /api/news
// returns { "news": [ NewsModel.toJson(), ... ] }

enum NewsSourceType { official, gov, alert }

class NewsModel {
  final String id;
  final String source;
  final NewsSourceType sourceType;
  final String title;
  final String timeAgo;

  const NewsModel({
    required this.id,
    required this.source,
    required this.sourceType,
    required this.title,
    required this.timeAgo,
  });
}

// ── FORECAST MODEL ───────────────────────────────────────────
// BACKEND: Flask endpoint GET /api/forecast
// returns { "today": ForecastToday.toJson(), "days": [ ForecastDay.toJson(), ... ] }

enum RiskLevel { high, med, low, safe }

class ForecastToday {
  final String condition;
  final String warning;
  final int tempC;
  final int feelsLikeC;
  final String icon; // emoji

  const ForecastToday({
    required this.condition,
    required this.warning,
    required this.tempC,
    required this.feelsLikeC,
    required this.icon,
  });
}

class ForecastDay {
  final String label;
  final String icon; // emoji
  final int tempC;
  final RiskLevel risk;

  const ForecastDay({
    required this.label,
    required this.icon,
    required this.tempC,
    required this.risk,
  });
}

// ── NOTIFICATION MODEL ───────────────────────────────────────
// BACKEND: Flask endpoint GET /api/notifications?user_id=<id>
// returns { "notifications": [ NotifModel.toJson(), ... ], "unread_count": n }

enum NotifType { flood, typhoon, fire, verify, forecast, crime }
enum NotifTimePeriod { today, yesterday, earlier }

class NotifModel {
  final String id;
  final NotifType type;
  final String body;
  final String timeAgo;
  final String? source;
  final bool unread;
  final String? actionLabel;
  final String? actionUrl;
  final String avatarText;
  final List<Color> avatarGradient;
  final NotifTimePeriod timePeriod;

  NotifModel({
    required this.id,
    required this.type,
    required this.body,
    required this.timeAgo,
    this.source,
    required this.unread,
    this.actionLabel,
    this.actionUrl,
    required this.avatarText,
    required this.avatarGradient,
    required this.timePeriod,
  });

  NotifModel copyWith({bool? unread}) {
    return NotifModel(
      id: id,
      type: type,
      body: body,
      timeAgo: timeAgo,
      source: source,
      unread: unread ?? this.unread,
      actionLabel: actionLabel,
      actionUrl: actionUrl,
      avatarText: avatarText,
      avatarGradient: avatarGradient,
      timePeriod: timePeriod,
    );
  }
}
