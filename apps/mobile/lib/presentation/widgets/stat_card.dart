import 'package:flutter/material.dart';
import 'package:stitchhub_mobile/core/theme/app_theme.dart';

class StatCard extends StatelessWidget {
  const StatCard({
    super.key,
    required this.label,
    required this.value,
    this.onTap,
    this.icon,
    this.trend,
  });

  final String label;
  final String value;
  final VoidCallback? onTap;
  final IconData? icon;
  final ({int value, bool up})? trend;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppTheme.card,
      elevation: 0,
      shadowColor: Colors.black.withValues(alpha: 0.06),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppTheme.radiusMd),
        side: const BorderSide(color: AppTheme.border),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(boxShadow: AppTheme.cardShadow),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      label.toUpperCase(),
                      style: Theme.of(context).textTheme.labelSmall,
                    ),
                  ),
                  if (icon != null)
                    Icon(icon, size: 20, color: AppTheme.accent),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.navy,
                  height: 1.1,
                ),
              ),
              if (trend != null) ...[
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: (trend!.up ? AppTheme.success : AppTheme.danger)
                        .withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(AppTheme.radiusLg),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        trend!.up ? Icons.arrow_upward : Icons.arrow_downward,
                        size: 12,
                        color: trend!.up ? AppTheme.success : AppTheme.danger,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${trend!.value}%',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: trend!.up ? AppTheme.success : AppTheme.danger,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
