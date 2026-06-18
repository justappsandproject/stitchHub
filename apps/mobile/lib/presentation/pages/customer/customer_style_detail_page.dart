import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:stitchhub_mobile/core/utils/role_utils.dart';
import 'package:stitchhub_mobile/domain/entities/app_entities.dart';
import 'package:stitchhub_mobile/domain/repositories/repositories.dart';
import 'package:stitchhub_mobile/injection_container.dart';

class CustomerStyleDetailPage extends StatefulWidget {
  const CustomerStyleDetailPage({super.key, required this.styleId});

  final String styleId;

  @override
  State<CustomerStyleDetailPage> createState() => _CustomerStyleDetailPageState();
}

class _CustomerStyleDetailPageState extends State<CustomerStyleDetailPage> {
  StyleEntity? _style;
  bool _loading = true;
  int _mediaIndex = 0;
  final _notesController = TextEditingController();
  final _promoController = TextEditingController();
  bool _ordering = false;
  bool _tryingOn = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _notesController.dispose();
    _promoController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final style = await sl<StylesRepository>().getStyle(widget.styleId);
      setState(() => _style = style);
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _order() async {
    if (_style == null) return;
    setState(() => _ordering = true);
    try {
      await sl<OrdersRepository>().createOrder({
        'styleId': _style!.id,
        if (_notesController.text.trim().isNotEmpty) 'notes': _notesController.text.trim(),
        if (_promoController.text.trim().isNotEmpty) 'discountCode': _promoController.text.trim(),
      });
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Order placed successfully!')),
      );
      context.go('/customer/orders');
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString())),
      );
    } finally {
      if (mounted) setState(() => _ordering = false);
    }
  }

  Future<Map<String, String>?> _showTryOnPreferences() async {
    var skinTone = 'medium';
    var bodyType = 'average';
    var gender = 'unisex';

    return showModalBottomSheet<Map<String, String>>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 16,
                right: 16,
                top: 16,
                bottom: MediaQuery.of(context).viewInsets.bottom + 16,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Try-on preferences',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    initialValue: skinTone,
                    decoration: const InputDecoration(labelText: 'Skin tone'),
                    items: const [
                      DropdownMenuItem(value: 'light', child: Text('Light')),
                      DropdownMenuItem(value: 'medium', child: Text('Medium')),
                      DropdownMenuItem(value: 'medium-dark', child: Text('Medium dark')),
                      DropdownMenuItem(value: 'dark', child: Text('Dark')),
                    ],
                    onChanged: (v) {
                      if (v != null) setSheetState(() => skinTone = v);
                    },
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: bodyType,
                    decoration: const InputDecoration(labelText: 'Body type'),
                    items: const [
                      DropdownMenuItem(value: 'slim', child: Text('Slim')),
                      DropdownMenuItem(value: 'athletic', child: Text('Athletic')),
                      DropdownMenuItem(value: 'average', child: Text('Average')),
                      DropdownMenuItem(value: 'plus', child: Text('Plus')),
                    ],
                    onChanged: (v) {
                      if (v != null) setSheetState(() => bodyType = v);
                    },
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: gender,
                    decoration: const InputDecoration(labelText: 'Gender'),
                    items: const [
                      DropdownMenuItem(value: 'female', child: Text('Female')),
                      DropdownMenuItem(value: 'male', child: Text('Male')),
                      DropdownMenuItem(value: 'unisex', child: Text('Unisex')),
                    ],
                    onChanged: (v) {
                      if (v != null) setSheetState(() => gender = v);
                    },
                  ),
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: () => Navigator.pop(ctx, {
                      'skinTone': skinTone,
                      'bodyType': bodyType,
                      'gender': gender,
                    }),
                    child: const Text('Generate preview'),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Future<void> _tryOn() async {
    if (_style == null) return;
    final prefs = await _showTryOnPreferences();
    if (prefs == null || !mounted) return;

    setState(() => _tryingOn = true);
    try {
      final result = await sl<StylesRepository>().tryOn(_style!.id, prefs);
      if (!mounted) return;
      await showDialog<void>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('AI Try-On Preview'),
          content: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              mainAxisSize: MainAxisSize.min,
              children: [
                if (result['previewUrl'] != null)
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: CachedNetworkImage(
                      imageUrl: result['previewUrl'] as String,
                      height: 280,
                      fit: BoxFit.cover,
                    ),
                  ),
                const SizedBox(height: 12),
                Text(
                  result['disclaimer'] as String? ??
                      'This is a simulated preview based on your measurements.',
                  style: Theme.of(ctx).textTheme.bodySmall,
                ),
                if (result['placeholder'] == true) ...[
                  const SizedBox(height: 8),
                  Text(
                    result['integrationNote'] as String? ?? '',
                    style: Theme.of(ctx).textTheme.labelSmall?.copyWith(
                          color: Theme.of(ctx).colorScheme.onSurfaceVariant,
                        ),
                  ),
                ],
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Close'),
            ),
          ],
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString())),
      );
    } finally {
      if (mounted) setState(() => _tryingOn = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_style?.name ?? 'Style')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _style == null
              ? const Center(child: Text('Style not found'))
              : _buildBody(_style!),
    );
  }

  Widget _buildBody(StyleEntity style) {
    final media = [
      ...style.photoUrls.map((url) => _MediaItem.photo(url)),
      ...style.videoUrls.map((url) => _MediaItem.video(url)),
    ];

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        AspectRatio(
          aspectRatio: 3 / 4,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: media.isEmpty
                ? Container(
                    color: Theme.of(context).colorScheme.surfaceContainerHighest,
                    child: const Center(child: Icon(Icons.checkroom_outlined, size: 48)),
                  )
                : media[_mediaIndex.clamp(0, media.length - 1)].type == _MediaType.video
                    ? Container(
                        color: Colors.black,
                        child: Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.play_circle_outline, color: Colors.white, size: 48),
                              Text('Video preview', style: TextStyle(color: Colors.white.withValues(alpha: 0.8))),
                            ],
                          ),
                        ),
                      )
                    : CachedNetworkImage(
                        imageUrl: media[_mediaIndex.clamp(0, media.length - 1)].url,
                        fit: BoxFit.cover,
                        width: double.infinity,
                      ),
          ),
        ),
        if (media.length > 1) ...[
          const SizedBox(height: 8),
          SizedBox(
            height: 64,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: media.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final item = media[index];
                return GestureDetector(
                  onTap: () => setState(() => _mediaIndex = index),
                  child: Container(
                    width: 64,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: _mediaIndex == index
                            ? Theme.of(context).colorScheme.primary
                            : Theme.of(context).dividerColor,
                        width: 2,
                      ),
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: item.type == _MediaType.photo
                        ? CachedNetworkImage(imageUrl: item.url, fit: BoxFit.cover)
                        : ColoredBox(
                            color: Colors.black87,
                            child: Icon(Icons.videocam, color: Colors.white.withValues(alpha: 0.9)),
                          ),
                  ),
                );
              },
            ),
          ),
        ],
        const SizedBox(height: 16),
        Text(style.category.toUpperCase(), style: Theme.of(context).textTheme.labelMedium),
        Text(style.name, style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
        if (style.basePrice != null)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(formatNgn(style.basePrice!), style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
          ),
        if (style.description != null) ...[
          const SizedBox(height: 12),
          Text(style.description!),
        ],
        const SizedBox(height: 16),
        OutlinedButton.icon(
          onPressed: _tryingOn ? null : _tryOn,
          icon: _tryingOn
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Icon(Icons.auto_awesome),
          label: Text(_tryingOn ? 'Generating preview...' : 'Try it on'),
        ),
        const SizedBox(height: 20),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text('Place an order', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 12),
                TextField(
                  controller: _notesController,
                  decoration: const InputDecoration(labelText: 'Special instructions'),
                  maxLines: 3,
                ),
                TextField(
                  controller: _promoController,
                  decoration: const InputDecoration(labelText: 'Promo code (optional)'),
                ),
                const SizedBox(height: 12),
                FilledButton(
                  onPressed: _ordering ? null : _order,
                  child: Text(_ordering ? 'Placing order...' : 'Order this style'),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

enum _MediaType { photo, video }

class _MediaItem {
  const _MediaItem._(this.url, this.type);
  factory _MediaItem.photo(String url) => _MediaItem._(url, _MediaType.photo);
  factory _MediaItem.video(String url) => _MediaItem._(url, _MediaType.video);

  final String url;
  final _MediaType type;
}
