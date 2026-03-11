import 'package:flutter/material.dart';
import 'screens/community_screen.dart';

void main() {
  runApp(const LigtasApp());
}

class LigtasApp extends StatelessWidget {
  const LigtasApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Ligtas — Safety Feed',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        fontFamily: 'DM Sans',
        useMaterial3: true,
      ),
      home: const _AppShell(),
    );
  }
}

// ── APP SHELL ────────────────────────────────────────────────
// Wraps CommunityScreen and manages the bottom nav index.
// BACKEND: Replace _navIndex logic with your GoRouter / Navigator
// to route between Home (explore), Community, and Profile screens.

class _AppShell extends StatefulWidget {
  const _AppShell();

  @override
  State<_AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<_AppShell> {
  int _navIndex = 1; // start on Community

  void _onNavTap(int index) {
    setState(() => _navIndex = index);
    // BACKEND: use your router here, e.g.:
    //   if (index == 0) context.go('/explore');
    //   if (index == 1) context.go('/community');
    //   if (index == 2) context.go('/profile');
  }

  @override
  Widget build(BuildContext context) {
    // For now only Community is built — show placeholder for others
    return CommunityScreen(
      activeNavIndex: _navIndex,
      onNavTap: _onNavTap,
    );
  }
}
