# Ligtas Community Screen — Flutter

Converted from `community.html` + `community.js` to Flutter.

---

## File Structure

```
lib/
├── main.dart                          # App entry + nav shell
├── theme/
│   └── app_theme.dart                 # Color tokens (matches CSS :root vars)
├── models/
│   └── community_models.dart          # ReportModel, NewsModel, NotifModel, etc.
├── data/
│   └── mock_data.dart                 # Static mock data (replace with API calls)
├── screens/
│   └── community_screen.dart          # Main Safety Feed screen
└── widgets/
    ├── bottom_nav_bar.dart             # HOME / COMMUNITY / PROFILE nav
    ├── weather_hero_widget.dart        # Weather card + 5-day forecast strip
    ├── news_strip_widget.dart          # Official News section
    ├── report_card_widget.dart         # Community report card with verify toggle
    └── notif_sheet.dart                # Notification bottom sheet
```

---

## HTML → Flutter Mapping

| HTML element              | Flutter widget/file              |
|---------------------------|----------------------------------|
| `.app-header`             | `_buildHeader()` in `community_screen.dart` |
| `.weather-hero`           | `WeatherHeroWidget`              |
| `.forecast-strip`         | Inside `WeatherHeroWidget`       |
| `.news-strip`             | `NewsStripWidget`                |
| `.cat-scroll` (pills)     | `_buildCategoryPills()`          |
| `.report-card`            | `ReportCardWidget`               |
| `.fab`                    | `_buildFAB()`                    |
| `.bottom-nav`             | `LigtasBottomNavBar`             |
| `.notif-backdrop` + sheet | `NotifSheet` + `AnimatedSlide`   |

---

## Backend Integration

All API call points are marked with `// BACKEND:` comments. The JS equivalents are:

| Flutter location                          | JS equivalent (community.js)             | Flask endpoint                        |
|-------------------------------------------|------------------------------------------|---------------------------------------|
| `mock_data.dart` → `mockReports`          | `LigtasAPI.fetchReports()`               | `GET /api/reports?category=&sort=`    |
| `mock_data.dart` → `mockNews`             | `LigtasAPI.fetchNews()`                  | `GET /api/news`                       |
| `mock_data.dart` → `mockForecastToday`    | `LigtasAPI.fetchForecast()`              | `GET /api/forecast`                   |
| `mock_data.dart` → `mockNotifications`    | `LigtasAPI.fetchNotifications()`         | `GET /api/notifications?user_id=`     |
| `report_card_widget.dart` `_handleVerify` | `LigtasUI.handleVerify()` + `LigtasAPI.verifyReport()` | `POST /api/reports/<id>/verify` |
| `notif_sheet.dart` `onTap` → `onMarkRead` | `LigtasUI.handleMarkRead()`              | `POST /api/notifications/<id>/read`   |

### Quick swap: mock → live data

In `community_screen.dart`, replace the `initState` / field declarations with:

```dart
@override
void initState() {
  super.initState();
  _loadData();
}

Future<void> _loadData() async {
  // Replace with your actual HTTP calls to Flask
  final reports = await LigtasApi.fetchReports();
  final news    = await LigtasApi.fetchNews();
  final notifs  = await LigtasApi.fetchNotifications(userId: config.userId);
  setState(() {
    _reports = reports;
    _news = news;
    _notifications = notifs;
  });
}
```

---

## Navigation

`LigtasBottomNavBar` uses index `0=Home, 1=Community, 2=Profile`.  
The `onNavTap` callback in `main.dart`'s `_AppShell` is where you plug in your router (e.g. `go_router`).

---

## Fonts

The design uses **Plus Jakarta Sans** (headings, nav labels) and **DM Sans** (body).  
Uncomment the `fonts:` section in `pubspec.yaml` and add the font files to `assets/fonts/`.
Download from [Google Fonts](https://fonts.google.com).
