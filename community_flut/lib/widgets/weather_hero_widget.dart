import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../models/community_models.dart';

// Mirrors .weather-hero + .forecast-strip from community.html
// BACKEND: data comes from LigtasAPI.fetchForecast() → GET /api/forecast

class WeatherHeroWidget extends StatefulWidget {
  final ForecastToday today;
  final List<ForecastDay> days;

  const WeatherHeroWidget({
    super.key,
    required this.today,
    required this.days,
  });

  @override
  State<WeatherHeroWidget> createState() => _WeatherHeroWidgetState();
}

class _WeatherHeroWidgetState extends State<WeatherHeroWidget> {
  int _selectedDay = 0;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _buildHero(),
        const SizedBox(height: 14),
        _buildForecastStrip(),
        const SizedBox(height: 14),
      ],
    );
  }

  Widget _buildHero() {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF0C7C8C), Color(0xFF0A6070), Color(0xFF074D62)],
          stops: [0, 0.6, 1],
        ),
        borderRadius: BorderRadius.circular(26),
        border: Border.all(color: const Color(0x4D0D9E9E)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x330D6464),
            blurRadius: 32,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Text(widget.today.icon, style: const TextStyle(fontSize: 42)),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.today.condition,
                      style: const TextStyle(
                        fontFamily: 'Plus Jakarta Sans',
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                    Text(
                      widget.today.warning,
                      style: const TextStyle(fontSize: 12, color: Colors.white),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    '${widget.today.tempC}°C',
                    style: const TextStyle(
                      fontSize: 34,
                      fontWeight: FontWeight.w300,
                      color: Colors.white,
                    ),
                  ),
                  Text(
                    'Feels like ${widget.today.feelsLikeC}°',
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.tealLight,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: _HeroButton(
                  label: 'View Map',
                  icon: Icons.map,
                  onTap: () {}, // BACKEND: navigate to map screen
                ),
              ),
              const SizedBox(width: 10),
              _SecondaryButton(label: 'Details', onTap: () {}),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildForecastStrip() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(14),
        child: Row(
          children: List.generate(widget.days.length, (i) {
            final day = widget.days[i];
            final isActive = i == _selectedDay;
            final isLast = i == widget.days.length - 1;
            return Expanded(
              child: GestureDetector(
                onTap: () => setState(() => _selectedDay = i),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  decoration: BoxDecoration(
                    color: isActive ? AppColors.tealDim : AppColors.card,
                    border: isLast
                        ? null
                        : const Border(
                            right: BorderSide(color: AppColors.border),
                          ),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        day.label,
                        style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w700,
                          color: isActive ? AppColors.teal : AppColors.text2,
                          letterSpacing: 0.5,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(day.icon, style: const TextStyle(fontSize: 18)),
                      const SizedBox(height: 4),
                      Text(
                        '${day.tempC}°',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: AppColors.text,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        _riskLabel(day.risk),
                        style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.3,
                          color: _riskColor(day.risk),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }),
        ),
      ),
    );
  }

  String _riskLabel(RiskLevel r) {
    switch (r) {
      case RiskLevel.high: return 'HIGH';
      case RiskLevel.med:  return 'MED';
      case RiskLevel.low:  return 'LOW';
      case RiskLevel.safe: return 'SAFE';
    }
  }

  Color _riskColor(RiskLevel r) {
    switch (r) {
      case RiskLevel.high: return AppColors.red;
      case RiskLevel.med:  return AppColors.yellow;
      case RiskLevel.low:  return AppColors.green;
      case RiskLevel.safe: return AppColors.green;
    }
  }
}

class _HeroButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback onTap;

  const _HeroButton({required this.label, required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: AppColors.teal,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 16, color: AppColors.bg),
            const SizedBox(width: 6),
            Text(
              label,
              style: const TextStyle(
                fontFamily: 'Plus Jakarta Sans',
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: AppColors.bg,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SecondaryButton extends StatelessWidget {
  final String label;
  final VoidCallback onTap;

  const _SecondaryButton({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 18),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.18),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.white.withOpacity(0.35)),
        ),
        child: Text(
          label,
          style: const TextStyle(fontSize: 13, color: Colors.white),
        ),
      ),
    );
  }
}
