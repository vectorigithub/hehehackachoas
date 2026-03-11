import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../models/community_models.dart';

// Mirrors .news-strip from community.html
// BACKEND: data from LigtasAPI.fetchNews() → GET /api/news

class NewsStripWidget extends StatelessWidget {
  final List<NewsModel> news;

  const NewsStripWidget({super.key, required this.news});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 14),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Row(
              children: [
                const Icon(Icons.campaign, size: 16, color: AppColors.yellow),
                const SizedBox(width: 6),
                const Text(
                  'Official News',
                  style: TextStyle(
                    fontFamily: 'Plus Jakarta Sans',
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    color: AppColors.text,
                  ),
                ),
                const Spacer(),
                GestureDetector(
                  onTap: () {}, // BACKEND: navigate to full news list
                  child: const Text(
                    'See All →',
                    style: TextStyle(
                      fontSize: 11,
                      color: AppColors.teal,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
          // News items
          ...news.map((n) => _NewsItem(news: n)),
        ],
      ),
    );
  }
}

class _NewsItem extends StatelessWidget {
  final NewsModel news;
  const _NewsItem({required this.news});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      child: Row(
        children: [
          _SourceTag(source: news.source, type: news.sourceType),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              news.title,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppColors.text,
                height: 1.4,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Text(
            news.timeAgo,
            style: const TextStyle(fontSize: 10, color: AppColors.text2),
          ),
        ],
      ),
    );
  }
}

class _SourceTag extends StatelessWidget {
  final String source;
  final NewsSourceType type;
  const _SourceTag({required this.source, required this.type});

  @override
  Widget build(BuildContext context) {
    Color bg, fg, borderColor;
    switch (type) {
      case NewsSourceType.official:
        bg = AppColors.blueDim; fg = AppColors.blue;
        borderColor = const Color(0x403B9ED4);
        break;
      case NewsSourceType.gov:
        bg = AppColors.greenDim; fg = AppColors.green;
        borderColor = const Color(0x4022C97C);
        break;
      case NewsSourceType.alert:
        bg = AppColors.redDim; fg = AppColors.red;
        borderColor = const Color(0x40E05252);
        break;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: borderColor),
      ),
      child: Text(
        source,
        style: TextStyle(
          fontSize: 9,
          fontWeight: FontWeight.w800,
          color: fg,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}
