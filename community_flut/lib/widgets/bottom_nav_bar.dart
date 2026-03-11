import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

// Mirrors Design.Nav.render() from main.js — HOME / COMMUNITY / PROFILE
// BACKEND: update route navigation in onTap callbacks

class LigtasBottomNavBar extends StatelessWidget {
  final int activeIndex;
  final ValueChanged<int> onTap;

  const LigtasBottomNavBar({
    super.key,
    required this.activeIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 72,
      decoration: const BoxDecoration(
        color: AppColors.card,
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      child: Row(
        children: [
          _NavBtn(
            icon: Icons.home_outlined,
            activeIcon: Icons.home,
            label: 'HOME',
            isActive: activeIndex == 0,
            onTap: () => onTap(0),
          ),
          _NavBtn(
            icon: Icons.people_outline,
            activeIcon: Icons.people,
            label: 'COMMUNITY',
            isActive: activeIndex == 1,
            onTap: () => onTap(1),
          ),
          _NavBtn(
            icon: Icons.person_outline,
            activeIcon: Icons.person,
            label: 'PROFILE',
            isActive: activeIndex == 2,
            onTap: () => onTap(2),
          ),
        ],
      ),
    );
  }
}

class _NavBtn extends StatelessWidget {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final bool isActive;
  final VoidCallback onTap;

  const _NavBtn({
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          color: isActive ? AppColors.tealDim : Colors.transparent,
          padding: const EdgeInsets.only(top: 8, bottom: 12),
          child: Stack(
            alignment: Alignment.center,
            children: [
              Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    isActive ? activeIcon : icon,
                    size: 20,
                    color: isActive ? AppColors.teal : AppColors.text3,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    label,
                    style: TextStyle(
                      fontFamily: 'Plus Jakarta Sans',
                      fontSize: 9,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.8,
                      color: isActive ? AppColors.teal : AppColors.text3,
                    ),
                  ),
                ],
              ),
              // Active dot indicator (matches .nav-btn.active::after in CSS)
              if (isActive)
                Positioned(
                  bottom: 0,
                  child: Container(
                    width: 4,
                    height: 4,
                    decoration: const BoxDecoration(
                      color: AppColors.teal,
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
