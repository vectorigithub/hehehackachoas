import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../models/community_models.dart';

// Mirrors .report-card from community.html
// BACKEND: verify calls LigtasAPI.verifyReport(id, wasActive)
//   POST /api/reports/<id>/verify  or  /api/reports/<id>/unverify

class ReportCardWidget extends StatefulWidget {
  final ReportModel report;
  final ValueChanged<ReportModel> onVerifyToggled;

  const ReportCardWidget({
    super.key,
    required this.report,
    required this.onVerifyToggled,
  });

  @override
  State<ReportCardWidget> createState() => _ReportCardWidgetState();
}

class _ReportCardWidgetState extends State<ReportCardWidget> {
  bool _showPlusOne = false;

  void _handleVerify() {
    final r = widget.report;
    final wasActive = r.userVerified;
    final newCount = wasActive ? r.verifyCount - 1 : r.verifyCount + 1;

    widget.onVerifyToggled(r.copyWith(
      verifyCount: newCount,
      userVerified: !wasActive,
    ));

    if (!wasActive) {
      setState(() => _showPlusOne = true);
      Future.delayed(const Duration(milliseconds: 700), () {
        if (mounted) setState(() => _showPlusOne = false);
      });
    }

    // BACKEND: POST /api/reports/${r.id}/${wasActive ? 'unverify' : 'verify'}
  }

  @override
  Widget build(BuildContext context) {
    final r = widget.report;
    final pct = (r.verifyCount / r.verifyMax).clamp(0.0, 1.0);
    final isOfficial = r.severity == Severity.info;

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 14),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isOfficial
              ? const Color(0x47407EC1)
              : AppColors.border,
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x1A0D6464),
            blurRadius: 14,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeader(r),
          _buildBody(r),
          if (r.gpsVerified) _buildImagePlaceholder(r),
          _buildVerifyBar(r, pct, isOfficial),
          _buildActions(r),
        ],
      ),
    );
  }

  Widget _buildHeader(ReportModel r) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(14, 14, 14, 8),
      child: Row(
        children: [
          // Avatar
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: r.authorGradient,
              ),
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white.withOpacity(0.1), width: 2),
            ),
            child: Center(
              child: Text(
                r.authorInitials,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                ),
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  r.authorName,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: AppColors.text,
                  ),
                ),
                Text(
                  '${r.timeAgo} · ${r.location}',
                  style: const TextStyle(fontSize: 10, color: AppColors.text2),
                ),
              ],
            ),
          ),
          _SeverityBadge(severity: r.severity, label: r.badgeLabel),
        ],
      ),
    );
  }

  Widget _buildBody(ReportModel r) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(14, 0, 14, 10),
      child: Text(
        r.body,
        style: const TextStyle(
          fontSize: 12,
          height: 1.6,
          color: AppColors.text2,
        ),
      ),
    );
  }

  Widget _buildImagePlaceholder(ReportModel r) {
    return Container(
      margin: const EdgeInsets.fromLTRB(14, 0, 14, 10),
      height: 150,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFB2DDE2), Color(0xFF8ECCD4)],
        ),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Stack(
        children: [
          const Center(
            child: Text('🌊', style: TextStyle(fontSize: 44)),
          ),
          Positioned(
            bottom: 8,
            right: 8,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.45),
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.location_on, size: 12, color: Colors.white),
                  SizedBox(width: 3),
                  Text(
                    'GPS Verified',
                    style: TextStyle(
                      fontSize: 10,
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVerifyBar(ReportModel r, double pct, bool isOfficial) {
    final barColors = isOfficial
        ? [AppColors.blue, AppColors.teal]
        : pct >= 0.8
            ? [AppColors.teal, AppColors.green]
            : [AppColors.yellow, const Color(0xFFE8A000)];

    final countColor = isOfficial
        ? AppColors.green
        : pct >= 0.8
            ? AppColors.teal
            : AppColors.yellow;

    return Padding(
      padding: const EdgeInsets.fromLTRB(14, 0, 14, 8),
      child: Column(
        children: [
          Row(
            children: [
              Text(
                isOfficial ? 'Official government source' : 'Community verification',
                style: const TextStyle(fontSize: 10, color: AppColors.text2),
              ),
              const Spacer(),
              Text(
                isOfficial
                    ? '✓ Verified'
                    : '${r.verifyCount} / ${r.verifyMax} needed',
                style: TextStyle(fontSize: 10, color: countColor),
              ),
            ],
          ),
          const SizedBox(height: 5),
          Container(
            height: 3,
            decoration: BoxDecoration(
              color: AppColors.tealDim,
              borderRadius: BorderRadius.circular(99),
            ),
            child: FractionallySizedBox(
              alignment: Alignment.centerLeft,
              widthFactor: pct,
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(colors: barColors),
                  borderRadius: BorderRadius.circular(99),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActions(ReportModel r) {
    final isVerified = r.userVerified;
    final isHelpful = r.verifyMax == 9999;
    final label = isHelpful ? 'Helpful' : 'Verify';

    return Container(
      padding: const EdgeInsets.fromLTRB(14, 10, 14, 14),
      decoration: const BoxDecoration(
        border: Border(
          top: BorderSide(color: Color(0x1A0D9E9E)),
        ),
      ),
      child: Row(
        children: [
          // Verify button
          Stack(
            clipBehavior: Clip.none,
            children: [
              GestureDetector(
                onTap: _handleVerify,
                child: Row(
                  children: [
                    Icon(
                      isVerified ? Icons.thumb_up : Icons.thumb_up_outlined,
                      size: 19,
                      color: isVerified ? AppColors.teal : AppColors.text2,
                    ),
                    const SizedBox(width: 5),
                    Text(
                      '$label (${r.verifyCount})',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: isVerified ? AppColors.teal : AppColors.text2,
                        letterSpacing: 0.3,
                      ),
                    ),
                  ],
                ),
              ),
              if (_showPlusOne)
                Positioned(
                  top: -8,
                  left: 0,
                  child: TweenAnimationBuilder<double>(
                    tween: Tween(begin: 0, end: 1),
                    duration: const Duration(milliseconds: 650),
                    builder: (ctx, v, _) => Opacity(
                      opacity: (1 - v).clamp(0, 1),
                      child: Transform.translate(
                        offset: Offset(0, -30 * v),
                        child: const Text(
                          '+1',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            color: AppColors.teal,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(width: 14),
          // Comment button
          Row(
            children: [
              const Icon(Icons.chat_bubble_outline, size: 19, color: AppColors.text2),
              const SizedBox(width: 5),
              Text(
                '${r.commentCount}',
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: AppColors.text2,
                ),
              ),
            ],
          ),
          const Spacer(),
          // Share button
          const Icon(Icons.share_outlined, size: 19, color: AppColors.text2),
        ],
      ),
    );
  }
}

class _SeverityBadge extends StatelessWidget {
  final Severity severity;
  final String label;
  const _SeverityBadge({required this.severity, required this.label});

  @override
  Widget build(BuildContext context) {
    Color bg, fg, border;
    switch (severity) {
      case Severity.critical:
        bg = AppColors.redDim; fg = AppColors.red;
        border = const Color(0x4DE05252);
        break;
      case Severity.high:
        bg = AppColors.orangeDim; fg = AppColors.orange;
        border = const Color(0x4DE87E3E);
        break;
      case Severity.moderate:
        bg = AppColors.yellowDim; fg = AppColors.yellow;
        border = const Color(0x4DF0B429);
        break;
      case Severity.info:
        bg = AppColors.blueDim; fg = AppColors.blue;
        border = const Color(0x4D3B9ED4);
        break;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: border),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w800,
          color: fg,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}
